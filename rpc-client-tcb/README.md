# rpc-client-tcb

[![NPM version](https://img.shields.io/npm/v/rpc-client-tcb.svg?style=flat)](https://www.npmjs.com/package/rpc-client-tcb)
[![NPM downloads](https://img.shields.io/npm/dm/rpc-client-tcb.svg?style=flat)](https://www.npmjs.com/package/rpc-client-tcb)

一个为**小程序云开发**设计的、**类型友好**、体验极致的 RPC 客户端。让你调用云函数就像调用本地模块一样简单自然。

必须与 [rpc-server-tcb](https://www.npmjs.com/package/rpc-server-tcb) 配合使用。

## ✨ 特性

-   🪄 **神奇的调用体验**: 以 `rpc.module.action(params)` 的方式调用云函数，完全屏蔽底层细节。
-   
-   🤝 **Promise-based**: 所有调用均返回 Promise，完美支持 `async/await`，代码更优雅。
-   
-   🎯 **参数直传**: 就像调用本地函数一样传递参数，无需手动封装。
-   
-    Eindeutige **统一的错误处理**: 无论是网络错误还是业务错误，都可以通过 `try...catch` 统一捕获。
-   
-   📦 **轻量级**: 无任何外部依赖，代码简洁高效。

## 📦 安装

在你的小程序项目根目录下执行：

```bash
npm install rpc-client-tcb
```

然后使用微信开发者工具构建 NPM。

## 🚀 快速开始

#### 1. 初始化客户端

建议在小程序的 `utils` 目录下创建一个文件来统一初始化和导出 RPC 实例。

**`utils/rpc.js`**

```javascript
import { createRpcClient } from 'rpc-client-tcb';

const rpc = createRpcClient({
  // 这里的名字必须和你部署的云函数名完全一致
  functionName: 'rpcEntry', 
});

export default rpc;
```

#### 2. 在页面中调用

现在，你可以在任何页面中引入并使用 `rpc` 实例，调用你在服务端 `api` 目录下定义的所有模块和方法。

**`pages/index/index.js`**

```javascript
import rpc from '../../utils/rpc';

Page({
  async onTestMath() {
    try {
      // 对应服务端的 api/math.js
      const result = await rpc.math.add(10, 20);
      wx.showModal({
        title: '调用成功',
        content: `10 + 20 = ${result}`, // 将显示 "10 + 20 = 30"
      });
    } catch (error) {
      console.error('调用 math.add 失败:', error);
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },
});
```

## 📖 指南

### 调用示例 (对应服务端)

假设你的服务端有 `api/user.js` 和 `api/math.js` 两个模块。

**服务端 `api/math.js`**
```javascript
module.exports = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
}
```

**小程序端调用**
```javascript
// 调用 add 方法
const sum = await rpc.math.add(5, 8); // sum will be 13

// 调用 multiply 方法
const product = await rpc.math.multiply(3, 4); // product will be 12
```

---

**服务端 `api/user.js`**
```javascript
module.exports = {
  getMyOpenId() {
    const { OPENID } = this.context.userInfo;
    if (!OPENID) throw new Error('OpenID not found.');
    return OPENID;
  }
}
```

**小程序端调用**
```javascript
// 调用 getMyOpenId 方法，无需传参
try {
  const openid = await rpc.user.getMyOpenId();
  console.log('当前用户的 OpenID:', openid);
} catch (error) {
  // 如果服务端抛出错误，会在这里被捕获
  console.error(error.message); // 将输出 "OpenID not found."
}
```

### 错误处理

`rpc-client-tcb` 的一大优势是统一了错误处理模型。

-   **网络问题** 或 **云函数不存在** 等调用层面的失败。
-   **服务端业务逻辑** `throw new Error()` 抛出的业务错误。

所有这些错误都可以通过 `try...catch` 捕获，让你能像处理本地代码异常一样处理远程调用失败。

```javascript
async function getUserData() {
  try {
    const user = await rpc.user.getInfo('non-existent-id');
    // ...
  } catch (err) {
    // `err` 是一个 Error 对象，包含 `message` 和 `code` 属性
    wx.showToast({
      title: `获取失败: ${err.message}`,
      icon: 'none',
    });
  }
}
```

### API 参考

#### `createRpcClient(options)`

-   `options` `<Object>` (必选) - 配置对象。
    -   `functionName` `<string>` (必选) - 你部署的云函数统一入口名称。
-   **返回**: `<Proxy>` - 一个 RPC 客户端代理对象。

## 🤝 贡献

欢迎通过提交 Pull Request 或 Issue 来为这个项目做出贡献。

## 📄 开源协议

[MIT](LICENSE)