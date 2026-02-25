# NetSale V6.0 项目详细分析报告

> 生成日期：2026-02-25
> 仓库地址：https://github.com/onchina/netsalev6

---

## 一、项目概述

NetSale V6.0 是一套**全栈 CRM（客户关系管理）系统**，包含前端 React 应用和后端 FastAPI 服务。该系统主要服务于销售团队，提供客户管理、订单处理、库存管理、数据分析、即时通讯等功能。

**项目类型**：前后端分离的全栈 Web 应用
**部署方式**：Docker 容器化部署
**目标用户**：销售团队、运营人员、管理员

---

## 二、技术栈详情

### 2.1 前端技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18.2.0 |
| 语言 | TypeScript | 5.3.0 |
| 构建工具 | Vite | 5.0.0 |
| UI 组件库 | Ant Design | 6.2.2 |
| 状态管理 | Zustand | 5.0.10 |
| 路由 | React Router DOM | 7.13.0 |
| HTTP 客户端 | Axios | 1.13.5 |
| 图表库 | ECharts | 6.0.0 |
| 图标库 | Font Awesome | 7.2.0 |
| Excel 处理 | SheetJS (xlsx) | 0.18.5 |
| 日期处理 | Day.js | 1.11.19 |

### 2.2 后端技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | FastAPI | 0.115.0 |
| ASGI 服务器 | Uvicorn | 0.32.0 |
| ORM | SQLAlchemy | 2.0.36 |
| 数据库驱动 | asyncpg | 0.30.0 |
| 数据验证 | Pydantic | 2.10.0 |
| 认证 | Python-Jose + Passlib | 3.3.0 / 1.7.4 |
| 数据库迁移 | Alembic | 1.14.0 |
| WebSocket | FastAPI 内置 | - |

### 2.3 基础设施

| 组件 | 说明 |
|------|------|
| 容器引擎 | Docker |
| 容器编排 | Docker Compose |
| 域名 | crm.onchina.vip |
| 后端服务名 | netsale-backend |
| 前端服务名 | netsale-frontend (运行在 3000 端口) |

---

## 三、前端功能模块

前端采用 **React Router** 路由体系，主要功能模块如下：

### 3.1 页面路由结构

| 路由路径 | 功能模块 | 说明 |
|----------|----------|------|
| `/login` | 登录 | 用户认证入口 |
| `/` | 工作台 | 首页仪表盘 |
| `/message-center` | 消息中心 | 站内消息 |
| `/mall/customer` | 客户管理 | 客户列表、新增 |
| `/mall/order` | 订单管理 | 创建、待审核、已发货、已完成、售后等 |
| `/mall/warehouse` | 仓储管理 | 产品管理、库存管理、退货、库存记录 |
| `/analytics` | 数据分析 | 数据统计 |
| `/report` | 路远日报 | 日报 |
| `/settings` | 后台设置 | 系统配置 |
| `/system-settings` | 系统设置 | 系统级配置 |
| `/operations` | 运营管理 | 渠道管理、操作日志 |
| `/data-screen/performance/v1` | 作战大屏 v1.0 | 业绩数据展示 |
| `/data-screen/performance/v2` | 作战大屏 v2.0 | 业绩数据展示（新版） |
| `/data-screen/ranking` | 排行榜大屏 | 销售排行 |
| `/chat` | 即时通讯 | 实时聊天 |

### 3.2 核心组件

| 组件 | 功能 |
|------|------|
| `MainLayout` | 主布局（侧边栏 + 头部） |
| `FloatingChat` | 浮动聊天组件 |
| `NotificationReminder` | 通知提醒 |
| `ProfileModal` | 用户资料弹窗 |
| `AccountSettingsModal` | 账户设置弹窗 |

### 3.3 API 请求封装

- 基于 Axios 封装统一请求拦截器
- 支持 JWT Token 认证
- 代理配置：`/api` → `http://netsale-backend:8000`

---

## 四、后端 API 模块

后端提供 **21 个 API 路由模块**，统一前缀：`/api/v1`

### 4.1 API 路由清单

| 路由模块 | 路径前缀 | 功能说明 |
|----------|----------|----------|
| `auth` | `/auth` | 用户登录、认证 |
| `users` | `/users` | 用户管理 |
| `customers` | `/customers` | 客户管理 |
| `products` | `/products` | 产品管理 |
| `orders` | `/orders` | 订单管理 |
| `after_sales` | `/after-sales` | 售后管理 |
| `warehouses` | `/warehouses` | 仓储管理 |
| `analytics` | `/analytics` | 数据分析 |
| `settings` | `/settings` | 系统设置 |
| `audit_logs` | `/audit-logs` | 审计日志 |
| `dictionaries` | `/dictionaries` | 数据字典 |
| `opportunities` | `/opportunities` | 商机管理 |
| `opportunity_proxy` | `/opportunity-proxy` | 商机代理 |
| `tasks` | `/tasks` | 任务管理 |
| `sales_targets` | `/sales-targets` | 销售目标 |
| `notifications` | `/notifications` | 通知管理 |
| `admin` | `/admin` | 后台管理 |
| `reports` | `/reports` | 报表 |
| `chat` | `/chat` | 即时通讯 |
| `badges` | `/badges` | 徽章/成就 |
| `websocket` | `/ws` | WebSocket 实时通信 |

---

## 五、数据模型

后端基于 SQLAlchemy 定义了 **20 个数据模型**：

| 模型名 | 说明 |
|--------|------|
| `User` | 用户 |
| `Customer` | 客户 |
| `Product` | 产品 |
| `Order` | 订单 |
| `AfterSale` | 售后 |
| `Warehouse` | 仓库 |
| `Stock` | 库存 |
| `Setting` | 系统设置 |
| `Dictionary` | 数据字典 |
| `AuditLog` | 审计日志 |
| `Opportunity` | 商机 |
| `Task` | 任务 |
| `SalesTarget` | 销售目标 |
| `Notification` | 通知 |
| `Report` | 报表 |
| `IMConversation` | 即时通讯会话 |
| `IMMessage` | 即时通讯消息 |
| `AdminModel` | 管理员 |
| `Badge` | 徽章/成就 |

---

## 六、特殊功能

### 6.1 作战大屏

系统包含两个版本的业绩数据大屏：
- **v1.0**：基础版业绩展示
- **v2.0**：新版增强版

后台每 **10 秒** 通过 `screen_service` 推送实时数据更新。

### 6.2 WebSocket 即时通讯

- 支持实时聊天功能
- 独立的聊天窗口（新窗口打开）
- 后台通过 `ws_manager` 管理 WebSocket 连接

### 6.3 数据字典

- 使用 JSON 文件存储字典数据
- 路径：`backend/app/data/dictionaries.json`
- 支持动态加载到前端

---

## 七、项目结构

```
netsalev6/
├── .agent/               # Agent 配置目录
│   ├── rules/           # 规则文件
│   ├── skills/          # 技能配置
│   └── docs/            # 文档
├── .claude/            # Claude 配置
├── .trae/              # Trae IDE 规则
├── backend/            # Python 后端
│   ├── app/
│   │   ├── api/v1/    # API 路由
│   │   ├── models/    # 数据模型
│   │   ├── schemas/   # Pydantic 模型
│   │   ├── services/  # 业务逻辑
│   │   ├── crud/     # 数据库操作
│   │   ├── core/     # 核心配置
│   │   └── db/       # 数据库连接
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/          # React 前端
│   ├── src/
│   │   ├── api/      # API 请求
│   │   ├── components/ # 组件
│   │   ├── pages/    # 页面
│   │   ├── stores/   # 状态管理
│   │   ├── hooks/    # 自定义 Hooks
│   │   └── utils/    # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── .editorconfig      # 编辑器配置
├── .eslintrc.js       # ESLint 配置
├── .prettierrc.js     # Prettier 配置
├── ruff.toml          # Python 代码规范
└── .gitignore        # Git 忽略配置
```

---

## 八、部署配置

### 8.1 Docker Compose

后端通过 `docker-compose.yml` 管理服务：
- 服务名：`netsale-backend`
- 端口：8000
- 使用 `netsale-backend` 作为内部网络域名

### 8.2 前端代理配置

Vite 代理配置：
```typescript
proxy: {
  '/api': {
    target: 'http://netsale-backend:8000',
    changeOrigin: true,
    ws: true,  // 支持 WebSocket
  }
}
```

---

## 九、代码规范

项目已配置以下代码规范工具：

| 工具 | 用途 |
|------|------|
| EditorConfig | 编辑器基础配置（缩进、换行） |
| ESLint | JavaScript/TypeScript 代码检查 |
| Prettier | 代码格式化 |
| Ruff | Python 代码检查和格式化 |

---

## 十、总结

NetSale V6.0 是一个功能完整的 **CRM 管理系统**，具有以下特点：

1. **前后端分离架构** - React + FastAPI
2. **容器化部署** - Docker + Docker Compose
3. **丰富的业务功能** - 客户、订单、库存、数据分析、即时通讯
4. **实时数据更新** - WebSocket + 定时推送
5. **现代化 UI** - Ant Design + ECharts
6. **代码规范** - ESLint + Prettier + Ruff
