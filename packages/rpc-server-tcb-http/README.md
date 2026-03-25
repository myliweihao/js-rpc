# rpc-server-tcb-http

[![NPM version](https://img.shields.io/npm/v/rpc-server-tcb-http.svg?style=flat)](https://www.npmjs.com/package/rpc-server-tcb-http)
[![NPM downloads](https://img.shields.io/npm/dm/rpc-server-tcb-http.svg?style=flat)](https://www.npmjs.com/package/rpc-server-tcb-http)

专门为 **微信小程序云开发 HTTP 触发器（即：云函数 URL 化）** 设计的 RPC 服务端框架。

当你开启云函数的“云函数 URL 化”功能后，就可以让任何 H5、Web 应用通过 HTTP 请求（如 `fetch`、`axios`）直接调用云函数。本框架完美处理了 URL 化的复杂报文解析、跨域 (CORS) 及返回格式封装，让你继续享受“像写本地函数一样写接口”的丝滑体验。

强烈建议与 [rpc-client-fetch](https://www.npmjs.com/package/rpc-client-fetch) 配合使用，以获得最佳的前后端同构开发体验。

## ✨ 特性

-   🔌 **专为 URL 化设计**: 自动解析复杂的 `event.body`，包括自动进行 Base64 解码支持。
-   🌐 **内置 CORS 支持**: 开箱即用的跨域资源共享配置，完美解决 H5 调用云函数时的跨域痛点。
-   🛡️ **中间件鉴权**: 提供强大的 `before` 前置钩子，方便你解析 Header 中的 `Token` 进行自定义鉴权。
-   📂 **模块化约定**: 沿用 `js-rpc` 生态的“约定优于配置”，将业务逻辑按文件清晰拆分。
-   🧠 **统一上下文**: 通过 `this` 轻松访问请求上下文 (`ctx`)，在中间件和业务函数间无缝流转数据。

## 📦 安装

在你的云函数目录下执行：

```bash
npm install rpc-server-tcb-http
```

## 🚀 快速开始

你的云开发 HTTP 接口可以变得前所未有的简洁！

#### 1. 组织你的 API 文件

在开启了 URL 化的云函数根目录下，创建一个 `api` 文件夹。

```
cloudfunctions/
└── httpRpcEntry/
    ├── api/                <-- 你的业务逻辑模块
    |   ├── user.js
    |   └── order.js
    ├── index.js            <-- 云函数入口文件
    └── package.json
```

#### 2. 编写业务模块 (`api/user.js`)

每个 `.js` 文件就是一个模块。模块需要导出一个包含多个方法的对象。

```javascript
// api/user.js
module.exports = {
  async getProfile(uid) {
    // 纯粹的业务逻辑，不需要关心 HTTP 报文
    return {
      id: uid,
      name: 'TCB User',
      from: 'HTTP Trigger'
    };
  }
};
```

#### 3. 编写云函数入口 (`index.js`)

**这就是全部代码！** 引入并调用 `create` 即可。

```javascript
const { create } = require('rpc-server-tcb-http');

// 默认开启 CORS，自动加载同级 'api' 目录下的所有模块
exports.main = create();
```

部署该云函数并在控制台开启“云函数 URL 化”后，前端即可通过你获得的公网链接发起调用！

## 📖 进阶指南：鉴权与跨域

HTTP 触发器与普通云函数最大的不同在于：它**没有内置微信鉴权 (无 OPENID)**，并且面临**跨域问题**。

### 1. 实现自定义 Token 鉴权

利用 `before` 钩子，我们可以轻松拦截请求，读取 Headers 中的 Token，并进行校验。

```javascript
// index.js
const { create } = require('rpc-server-tcb-http');

exports.main = create({
  // 开启前置拦截器
  before: async (ctx) => {
    // 1. 获取前端传来的 Token (注意 HTTP Headers 通常会被网关转为小写)
    const token = ctx.headers['token'] || ctx.headers['authorization'];
    
    // 2. 简单的白名单放行策略
    if (!token && ctx.body.rpcAction !== 'login') {
      // 抛出的错误会被框架自动捕获，并封装为标准的 JSON 返回给前端
      throw { code: '401', message: '未授权，请提供 Token' };
    }
    
    // 3. 将解析后的用户信息挂载到 ctx.state 上
    // 之后的业务函数 (如 api/user.js) 可以通过 this.state.user 访问！
    if (token === '666') {
      ctx.state.user = { uid: 10086, role: 'admin' };
    }
  }
});
```

在业务函数中获取注入的数据：

```javascript
// api/order.js
module.exports = {
  async create(orderData) {
    // 直接获取 before 钩子中解析出的用户信息！
    const currentUser = this.state.user;
    return `用户 ${currentUser.uid} 创建了订单`;
  }
};
```

### 2. 跨域 (CORS) 配置

框架默认**已经开启了**宽松的 CORS 策略（`Access-Control-Allow-Origin: *`）。如果你需要关闭它，或者在外部网关层统一处理，可以通过 `cors: false` 关闭：

```javascript
const { create } = require('rpc-server-tcb-http');

exports.main = create({
  cors: false, // 禁用内置的 CORS 处理
});
```

## 📖 上下文对象 (Context)

在 `before`、`after` 钩子以及业务函数（通过 `this`）中，你可以访问到强大的上下文对象 `ctx`：

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `ctx.event` | `Object` | 云函数原始的 `event` 对象（包含了未解析的 body 和 url 参数等）。 |
| `ctx.context` | `Object` | 云函数原始的 `context` 上下文。 |
| `ctx.headers` | `Object` | 自动解析出的 HTTP 请求头集合（通常 key 为小写）。 |
| `ctx.query` | `Object` | URL 中的 QueryString 参数集合。 |
| `ctx.body` | `Object` | 自动解码 Base64 并 `JSON.parse` 后的 RPC 请求体。 |

## ⚙️ 配置项 (API 参考)

### `create([options])`

- `options` `<Object>` (可选) - 配置对象。
  - `apiDirName` `<string>` (可选) - 存放 API 模块的文件夹名称。**默认值**: `'api'`。
  - `cors` `<boolean>` (可选) - 是否自动处理 OPTIONS 预检请求并注入 CORS 响应头。**默认值**: `true`。
  - `before` `<Function>` (可选) - 前置拦截器，接收 `ctx` 参数。用于鉴权等。
  - `after` `<Function>` (可选) - 后置处理器，接收 `(ctx, result, error)` 参数。用于自定义返回结构或统一日志。
- **返回**: `<Function>` - 一个标准的云函数入口函数 `async (event, context) => {}`。

## 🤝 客户端调用推荐

强烈建议在 Web / H5 端使用 [rpc-client-fetch](https://www.npmjs.com/package/rpc-client-fetch) 发起调用，它支持动态传入 Header，完美对接本框架的鉴权机制。

```javascript
import { create } from 'rpc-client-fetch';

const rpc = create({
  // 填入微信云开发控制台分配给你的“云函数公网访问链接”
  url: 'https://release-xxxx.ap-shanghai.app.tcloudbase.com/',
  headers: () => ({
    'token': localStorage.getItem('my_token') // 动态传递 Token
  })