const path = require('path');

/**
 * 创建小程序云开发 HTTP 触发器 (云函数 URL 化) RPC 服务端
 * @param {object} [options]
 * @param {string}[options.apiDirName='api'] - 存放业务逻辑的目录名
 * @param {boolean} [options.cors=true] - 是否自动处理跨域请求
 * @param {Function} [options.before] - 前置钩子 async (ctx) => {}
 * @param {Function} [options.after] - 后置钩子 async (ctx, result, error) => {}
 */
function createHttpRpcServer(options = {}) {
    const apiDirName = options.apiDirName || 'api';
    const apiAbsolutePath = path.join(process.cwd(), apiDirName);
    const enableCors = options.cors !== false;

    // 默认的 HTTP 响应头
    const defaultHeaders = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    if (enableCors) {
        defaultHeaders['Access-Control-Allow-Origin'] = '*';
        defaultHeaders['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT, DELETE';
        // 允许常见的 header，包括从你示例中看到的 token
        defaultHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, token, x-requested-with';
    }

    const beforeHook = options.before || (async () => {});
    const afterHook = options.after || (async (ctx, res, err) => {
        if (err) return { success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } };
        return { success: true, data: res };
    });

    // 统一生成符合 TCB HTTP 触发器规范的响应对象
    const makeResponse = (statusCode, bodyData) => {
        return {
            statusCode,
            headers: defaultHeaders,
            body: typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData)
        };
    };

    return async (event, context) => {
        // 1. 处理 OPTIONS 预检请求 (CORS)
        if (event.httpMethod === 'OPTIONS') {
            return makeResponse(204, '');
        }

        // 2. 构造统一的 Context
        const ctx = {
            event,          // 原始 event
            context,        // 原始 context
            headers: event.headers || {},
            query: event.queryStringParameters || {},
            body: {},       // 待解析的 body
            state: {},      // 供中间件传递数据
        };

        try {
            // 3. 解析 Body (重点：处理 Base64 编码和 JSON 解析)
            let requestBodyStr = event.body;
            if (requestBodyStr) {
                if (event.isBase64Encoded) {
                    requestBodyStr = Buffer.from(requestBodyStr, 'base64').toString('utf8');
                }
                try {
                    ctx.body = JSON.parse(requestBodyStr);
                } catch (e) {
                    throw { code: 'INVALID_JSON', message: 'Request body must be valid JSON' };
                }
            }

            // 4. 获取 RPC 参数 (兼容 rpc-client-fetch 传过来的结构)
            const { rpcModule, rpcAction, rpcParams =[] } = ctx.body;

            // 5. 校验格式：如果不是规范的 RPC 请求，返回 404 或特定提示
            if (!rpcModule || !rpcAction) {
                return makeResponse(404, { success: false, message: 'Invalid RPC Request: missing rpcModule or rpcAction' });
            }

            // --- 执行 Before Hook (做 Token 鉴权等) ---
            await beforeHook(ctx);

            // 6. 安全校验与模块加载
            if (/[\\/]/.test(rpcModule)) {
                throw { code: 'INVALID_MODULE', message: 'Invalid module name' };
            }

            const modulePath = path.join(apiAbsolutePath, `${rpcModule}.js`);
            if (!modulePath.startsWith(apiAbsolutePath)) {
                throw { code: 'ACCESS_DENIED', message: 'Access denied' };
            }

            if (process.env.NODE_ENV !== 'production') {
                try { delete require.cache[require.resolve(modulePath)]; } catch (e) { }
            }

            let apiModule;
            try {
                apiModule = require(modulePath);
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    throw { code: 'MODULE_NOT_FOUND', message: `Module '${rpcModule}' not found` };
                }
                throw e;
            }

            // 兼容默认导出和具名导出
            let apiFunction = apiModule[rpcAction];
            if (typeof apiFunction !== 'function') {
                throw { code: 'FUNCTION_NOT_FOUND', message: `Action '${rpcAction}' not found` };
            }

            // --- 执行核心业务 ---
            const result = await apiFunction.apply(ctx, rpcParams);

            // --- 执行 After Hook (成功) ---
            const responseData = await afterHook(ctx, result, null);
            return makeResponse(200, responseData);

        } catch (error) {
            console.error('[RPC HTTP Error]', error);
            // --- 执行 After Hook (失败) ---
            const responseData = await afterHook(ctx, null, error);
            return makeResponse(200, responseData); // 业务错误也返 200，前端靠 success 字段判断
        }
    };
}

module.exports = createHttpRpcServer;
module.exports.create = createHttpRpcServer;