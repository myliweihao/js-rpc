# JS-RPC

> **让远程调用像本地函数一样简单。**  
> Make remote calls as simple as local functions.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**JS-RPC** 是一个专为 JavaScript 全栈生态设计的轻量级 RPC（远程过程调用）解决方案。

它打破了前端与后端的边界，通过“约定优于配置”的设计理念，让您在 小程序、Web、Node.js、UniApp 等任何 JS 运行环境中，都能享受到极致丝滑的接口调用体验。彻底告别繁琐的 URL 管理、Method 配置和 Axios 封装。

## ⚡️ 核心亮点

- **极致轻量**: 每个子包都追求零依赖或极简依赖，体积小巧，拒绝臃肿。
- **零配置**: 自动路由映射、自动参数序列化，真正做到开箱即用。
- **全场景覆盖**:
  - **客户端**: 完美支持 **Web (Vue/React)**、**Node.js**、**原生微信小程序**、**UniApp**。
  - **服务端**: 无缝对接 **微信云开发 (TCB)**、**腾讯云函数 (SCF)**、**原生 Node.js**。
- **无缝跨域**: 针对 H5 调用云函数的痛点，提供内置 CORS 跨域与鉴权解决方案。
- **类型友好**: 设计逻辑清晰，接口签名明确，易于配合 TypeScript 使用。

---

## 📦 生态矩阵 (Packages)

JS-RPC 采用极度解耦的模块化设计，您可以根据自己的实际技术栈，自由组合“客户端”与“服务端”包。

### 🟢 服务端生态 (Server)

| 包名 | 适用场景 | 描述 |
| :--- | :--- | :--- |
| **[`rpc-server-node`](./packages/rpc-server-node)** | **Node.js 原生** | 基于原生 HTTP 模块，无框架依赖，自带静态托管与 CORS，极速启动 BFF 层。 |
| **[`rpc-server-scf`](./packages/rpc-server-scf)** | **腾讯云云函数 (SCF)** | 专为 Serverless 设计，适配 API 网关触发器，内置鉴权拦截与标准响应封装。 |
| **[`rpc-server-tcb`](./packages/rpc-server-tcb)** | **微信云开发 (私有协议)** | 配合小程序 `wx.cloud.callFunction`，一行代码启动免鉴权的原生 RPC 服务。 |
| **[`rpc-server-tcb-http`](./packages/rpc-server-tcb-http)** | **微信云开发 (URL化)** | 专为**云函数 URL 化 (HTTP触发器)** 设计，内置 CORS 跨域与 Base64 解析，完美打通外部 H5/Web 调用。 |
| **[`timer-server-tcb`](./packages/timer-server-tcb)** | **微信云开发 (定时任务)** | 专用于处理云开发定时触发器任务，一个函数管理所有 Cron Job 路由。 |

### 🔵 客户端生态 (Client)

| 包名 | 适用场景 | 描述 |
| :--- | :--- | :--- |
| **[`rpc-client-fetch`](./packages/rpc-client-fetch)** | **Web / Node / RN** | 基于标准 `Fetch API`，通用性最强，支持动态 Token 配置，适用于现代浏览器及 Node 18+。 |
| **[`rpc-client-request`](./packages/rpc-client-request)** | **UniApp / 小程序 (HTTP)** | 自动适配 `uni.request` 或 `wx.request`，完美解决非云开发环境下的跨端 HTTP 调用。 |
| **[`rpc-client-tcb`](./packages/rpc-client-tcb)** | **微信小程序 (原生云)** | 基于 `wx.cloud.callFunction` 封装，原生云开发最佳拍档，无需关心 HTTP 协议。 |

---

## 🚀 快速预览

体验一下用 JS-RPC 写全栈代码有多爽：

### 1. 编写后端业务 (不写任何路由)

无论你部署在 Node 还是 Serverless，业务代码长得都一样。

```text
my-server/
├── api/                <-- 你的业务目录
│   └── user.js         <-- 对应前端 rpc.user
└── index.js            <-- 服务入口
```

**`api/user.js`**:
```javascript
module.exports = {
  // 1. 普通接口：前端通过 rpc.user.getInfo(1001) 直接调用
  async getInfo(uid) {
    return { id: uid, name: 'Alice', role: 'admin' };
  },

  // 2. 鉴权接口：通过 this 访问中间件注入的上下文
  async login(username, password) {
    if (password !== '123456') {
      throw { code: 'AUTH_FAIL', message: '密码错误' }; // 直接 throw，前端 catch
    }
    return { token: 'mock-token-888' };
  }
};
```

### 2. 启动服务端 (以 Node.js 为例)

```javascript
// index.js (入口文件)
const { create } = require('rpc-server-node');

// 自动扫描 ./api 目录，自带 CORS
create(); 
console.log('RPC Server running at http://localhost:3000');
```

### 3. 前端调用 (以 Web/Vue/React 为例)

前端代码风格完全统一，告别 `Axios` 封装，像调用本地函数一样请求接口。

```javascript
import { create } from 'rpc-client-fetch';

// 初始化一次
const rpc = create({
  url: 'http://localhost:3000',
});

async function main() {
  try {
    // ✨ 魔法时刻：远程调用就是这么丝滑！
    const user = await rpc.user.getInfo(1001);
    console.log(user); // { id: 1001, name: 'Alice', role: 'admin' }

    // 登录操作
    await rpc.user.login('tom', 'wrong_pwd');
  } catch (err) {
    // 后端 throw 的错误，这里完美捕获
    console.error('调用出错:', err.message); // 输出: 调用出错: 密码错误
  }
}
```

---

## 📖 详细使用文档

点击下方链接，查看各个环境的详细上手指南和进阶配置（如动态 Header 鉴权、CORS 配置等）：

- 🌐 **Web/Node HTTP 调用**:[rpc-client-fetch 文档](./packages/rpc-client-fetch)
- 📱 **UniApp/小程序 HTTP 调用**:[rpc-client-request 文档](./packages/rpc-client-request)
- ☁️ **微信小程序 原生云开发调用**: [客户端 rpc-client-tcb](./packages/rpc-client-tcb) & [服务端 rpc-server-tcb](./packages/rpc-server-tcb)
- 🔗 **微信云开发 外部 H5/URL化 调用**: [rpc-server-tcb-http 文档](./packages/rpc-server-tcb-http)
- ⏱️ **微信云开发 定时任务管理**:[timer-server-tcb 文档](./packages/timer-server-tcb)
- ⚡️ **腾讯云 SCF Serverless 部署**: [rpc-server-scf 文档](./packages/rpc-server-scf)
- 💻 **原生 Node.js 私有部署**: [rpc-server-node 文档](./packages/rpc-server-node)

---

## 🤝 贡献指南

本项目正处于快速迭代中，非常欢迎提交 Issue 或 Pull Request 来一起改进 JS-RPC 生态！

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。