const path = require('path');

/**
 * 创建一个小程序云函数 RPC 服务。
 * 默认情况下，它会自动查找与入口文件同级的 'api' 目录作为模块根目录。
 *
 * @public
 * @param {object} [options] - 可选的配置项。
 * @param {string} [options.apiDirName='api'] - (可选) 存放 API 模块的文件夹名称，默认为 'api'。
 * @returns {Function} 一个可作为云函数主入口的异步函数。
 */
function createRpcServer(options = {}) {
  // API 目录名，如果用户未提供，则使用默认值 'api'。
  const apiDirName = options.apiDirName || 'api';
  
  // 直接使用 Node.js 的 `process.cwd()` 来获取当前工作目录。
  // 在云函数环境中，这通常就是函数的根目录。
  const apiAbsolutePath = path.join(process.cwd(), apiDirName);

  /**
   * 云函数的实际入口处理器。
   * @param {object} event - 小程序端传递的事件对象。
   * @param {object} context - 云函数的上下文信息。
   * @returns {Promise<object>} 返回处理结果。
   */
  return async (event, context) => {
    const { rpcModule, rpcAction, rpcParams = [] } = event;

    if (!rpcModule || !rpcAction) {
      return {
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: '`rpcModule` and `rpcAction` are required.',
        },
      };
    }

    try {
      // 拼接并加载业务模块文件
      const modulePath = path.join(apiAbsolutePath, `${rpcModule}.js`);
      
      // 在非生产环境下清除模块缓存，以支持热更新
      if (process.env.NODE_ENV !== 'production' && require.cache[require.resolve(modulePath)]) {
        delete require.cache[require.resolve(modulePath)];
      }

      const apiModule = require(modulePath);
      const apiFunction = apiModule[rpcAction];

      if (typeof apiFunction !== 'function') {
        throw new Error(`Action '${rpcAction}' is not a function in module '${rpcModule}'.`);
      }
      
      // 将 event 和 context 注入到 this 上下文
      const executionContext = { event, context };
      
      // 使用 .apply() 调用函数，传递 this 上下文和参数数组
      const result = await apiFunction.apply(executionContext, rpcParams);

      return {
        success: true,
        data: result,
      };
    } catch (e) {
      console.error(`[rpc-server-tcb] Error in '${rpcModule}.${rpcAction}':`, e);
      return {
        success: false,
        error: { 
          code: e.code || 'EXECUTION_ERROR', 
          message: e.message || 'An unexpected error occurred.',
        },
      };
    }
  };
}

module.exports = {
  createRpcServer, // 导出更名后的函数
};