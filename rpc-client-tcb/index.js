/**
 * 创建一个小程序 RPC 客户端实例。
 *
 * @public
 * @param {object} options - 配置项。
 * @param {string} options.functionName - 统一的云函数入口名称，例如 'rpc'。
 * @returns {Proxy} 一个 RPC 客户端代理对象，你可以通过它直接调用云函数中的模块和方法。
 */
export function createRpcClient(options) {
  if (!options || !options.functionName) {
    throw new Error('[rpc-client-tcb] `options.functionName` is required.');
  }

  // 第一层 Proxy：捕获模块名 (e.g., rpc.user)
  return new Proxy({}, {
    get(target, moduleName) {
      if (moduleName === 'then') {
        return undefined;
      }
      // 第二层 Proxy：捕获方法名 (e.g., rpc.user.getInfo)
      return new Proxy({}, {
        get(target, actionName) {
          // 返回一个 async 函数，直接使用 await 来处理 Promise
          return async (...params) => {
            try {
              // 1. 直接 await 调用，因为 wx.cloud.callFunction 在不传回调时返回 Promise
              const res = await wx.cloud.callFunction({
                name: options.functionName,
                data: {
                  rpcModule: moduleName.toString(),
                  rpcAction: actionName.toString(),
                  rpcParams: params,
                },
              });

              // 2. 在 try 块中处理成功或业务失败的逻辑
              if (res.result && res.result.success) {
                // 业务成功，直接 return 数据 (相当于 resolve)
                return res.result.data;
              } else if (res.result && res.result.error) {
                // 业务失败，构造并 throw 错误 (相当于 reject)
                const error = new Error(res.result.error.message);
                error.code = res.result.error.code;
                throw error;
              } else {
                // 未知格式，同样抛出错误
                throw new Error('Unknown server response format.');
              }
            } catch (err) {
              // 3. 在 catch 块中捕获所有类型的错误
              // 包括：wx.cloud.callFunction 的调用失败（网络等）和我们在上面手动 throw 的业务错误
              // 然后重新抛出，让外层的 .catch() 或 try...catch 能够捕获到
              throw err;
            }
          };
        },
      });
    },
  });
}