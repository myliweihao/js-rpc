/**
 * 创建一个小程序 RPC 客户端实例。
 *
 * @public
 * @param {object} options - 配置项。
 * @param {string} options.functionName - 统一的云函数入口名称，例如 'rpcEntry'。
 * @returns {Proxy} 一个 RPC 客户端代理对象，你可以通过它直接调用云函数中的模块和方法。
 */
export function createRpcClient(options) {
  if (!options || !options.functionName) {
    throw new Error('[rpc-client-tcb] `options.functionName` is required.');
  }

  // 使用 Proxy 创建一个 “模块” 代理
  // 当访问 rpc.user 时, `moduleName` 就是 'user'
  return new Proxy({}, {
    get(target, moduleName) {
      // 避免某些库（如 antd）将 rpc 对象误判为 Promise 而尝试访问 .then
      if (moduleName === 'then') {
        return undefined;
      }

      // 返回第二个 "方法" 代理
      // 当访问 rpc.user.getInfo 时, `actionName` 就是 'getInfo'
      return new Proxy({}, {
        get(target, actionName) {
          // 最终返回一个可执行的异步函数
          return (...params) => {
            // 这个函数体将在用户实际调用时执行, e.g., rpc.user.getInfo('123')
            return new Promise((resolve, reject) => {
              wx.cloud.callFunction({
                name: options.functionName,
                data: {
                  rpcModule: moduleName.toString(), // 确保是字符串
                  rpcAction: actionName.toString(),
                  rpcParams: params,
                },
                success: (res) => {
                  if (res.result && res.result.success) {
                    // 云函数执行成功，返回业务数据
                    resolve(res.result.data);
                  } else if (res.result && res.result.error) {
                    // 云函数执行成功，但返回了业务错误
                    // 包装成一个真正的 Error 对象，以便于调试
                    const error = new Error(res.result.error.message);
                    error.code = res.result.error.code;
                    reject(error);
                  } else {
                    // 未知或不规范的返回格式
                    reject(new Error('Unknown server response format.'));
                  }
                },
                fail: (err) => {
                  // 网络错误或云函数调用失败
                  reject(err);
                },
              });
            });
          };
        },
      });
    },
  });
}