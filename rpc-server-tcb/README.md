# rpc-server-tcb

[![NPM version](https://img.shields.io/npm/v/rpc-server-tcb.svg?style=flat)](https://www.npmjs.com/package/rpc-server-tcb)
[![NPM downloads](https://img.shields.io/npm/dm/rpc-server-tcb.svg?style=flat)](https://www.npmjs.com/package/rpc-server-tcb)

一个为**小程序云开发**设计的、**零配置**、约定优于配置的 RPC 服务端框架。它可以让你将云函数内的业务逻辑按模块组织，并提供优雅的上下文注入机制。

与 [rpc-client-tcb](https://www.npmjs.com/package/rpc-client-tcb)配合使用，可以获得从云端到小程序端的极致开发体验。

## ✨ 特性

-   🚀 **零配置启动**: 默认情况下，无需任何配置即可工作。
-   📂 **模块化**: 将你的云函数逻辑拆分到不同的文件中，代码更清晰、更易于维护。
-   💡 **上下文注入**: 通过 `this` 轻松访问 `event` 和 `context` 对象，无需污染函数签名。
-   🔥 **热更新**: 在开发过程中，修改 API 模块代码可立即生效，无需重新部署云函数。
-   💪 **健壮的错误处理**: 自动捕获业务逻辑中的错误，并以统一格式返回给客户端。
-   📦 **轻量级**: 无任何外部依赖，代码简洁高效。

## 📦 安装

在你的云函数目录下执行：

```bash
npm install rpc-server-tcb
```

## 🚀 快速开始

你的云函数可以变得前所未有的简洁！

#### 1. 组织你的 API 文件

在你的云函数根目录下，创建一个 `api` 文件夹。这是存放所有业务逻辑的地方。

```
cloudfunctions/
└── rpcEntry/
    ├── api/                <-- 你的业务逻辑模块
    |   ├── user.js
    |   └── math.js
    ├── index.js            <-- 云函数入口文件
    └── package.json
```

#### 2. 编写业务模块 (`api/math.js`)

每个 `.js` 文件就是一个模块。模块需要导出一个包含多个方法的对象。

```javascript
// api/math.js
module.exports = {
  add(a, b) {
    // 这只是一个普通的 JavaScript 函数
    return a + b;
  },
  
  multiply(a, b) {
    return a * b;
  }
}
```

#### 3. 编写云函数入口 (`index.js`)

**这就是全部代码！** 引入并调用 `createRpcServer` 即可。

```javascript
const { createRpcServer } = require('rpc-server-tcb');

// 无需任何配置，它会自动加载同级 'api' 目录下的所有模块
exports.main = createRpcServer();
```

现在，你可以通过客户端调用 `math` 模块下的 `add` 和 `multiply` 方法了。

## 📖 指南

### 访问 `event` 和 `context`

在你的 API 方法中，如果需要获取小程序用户信息或本次调用的原始参数，可以通过 `this` 关键字访问到完整的 `event` 和 `context` 对象。

**示例: `api/user.js`**

```javascript
const cloud = require('wx-server-sdk');

module.exports = {
  /**
   * 获取当前调用者的 OpenID
   */
  getMyOpenId() {
    // 通过 `this.context.userInfo` 获取云函数初始化时得到的上下文信息
    const { OPENID } = this.context.userInfo;
    if (!OPENID) {
      throw new Error('User not logged in or OPENID not available.');
    }
    return OPENID;
  },

  /**
   * 返回小程序端调用云函数时传递的完整事件对象
   */
  getRawEvent() {
    // `this.event` 包含了 rpcModule, rpcAction, rpcParams 等所有字段
    return this.event;
  }
};
```

### 高级配置

`createRpcServer` 接受一个可选的 `options` 对象，用于自定义其行为。

如果你不想使用默认的 `api` 文件夹，可以自定义。

**示例：使用 `services` 文件夹**

```javascript
// index.js
const { createRpcServer } = require('rpc-server-tcb');

exports.main = createRpcServer({
  // 将存放 API 模块的文件夹从 'api' 改为 'services'
  apiDirName: 'services', 
});
```

### API 参考

#### `createRpcServer([options])`

-   `options` `<Object>` (可选) - 配置对象。
    -   `apiDirName` `<string>` (可选) - 存放 API 模块的文件夹名称。**默认值**: `'api'`。
-   **返回**: `<Function>` - 一个标准的云函数入口函数 `async (event, context) => {}`。

## 🤝 贡献

欢迎通过提交 Pull Request 或 Issue 来为这个项目做出贡献。

## 📄 开源协议

[MIT](LICENSE)