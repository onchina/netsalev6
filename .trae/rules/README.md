# NetSale V6.0 项目规则说明

> 本规则适用于 NetSale V6.0 ERP + CRM + IM（企业内部）系统开发

---

## 一、项目概述

NetSale V6.0 是一套全栈 **ERP + CRM + IM（企业内部）系统**，采用前后端分离架构。前端包含 **25+ 个页面**，涵盖复杂的业务交互。

| 端 | 技术栈 | 说明 |
|---|--------|------|
| 前端 | React 18 + TypeScript + Vite | SPA 单页应用（25+ 页面） |
| UI 组件 | Ant Design v6 | 严禁使用 `@ant-design/icons`，必须用 Font Awesome |
| 状态管理 | Zustand v5 | 持久化 + 实时状态 |
| 图表 | ECharts 6 | 数据大屏（3个） |
| 后端 | FastAPI 0.115 + SQLAlchemy 2.0 | RESTful API |
| 数据库 | PostgreSQL + asyncpg | 异步 ORM |
| 实时通讯 | WebSocket | IM 即时通讯 |
| 部署 | Docker + 1Panel | 容器化管理 |

---

## 二、规则文件说明

| 文件 | 作用 | 适用 |
|------|------|------|
| `.editorconfig` | 编辑器基础配置（缩进、换行、字符集） | 全部 |
| `.eslintrc.js` | JavaScript/TypeScript 代码规范 | 前端 |
| `.prettierrc.js` | 代码格式化配置 | 前端 |
| `ruff.toml` | Python 代码规范和格式化 | 后端 |

---

## 三、前端开发规范

### 3.1 图标约束 ⚠️

**严禁使用 Ant Design 图标**，必须统一使用 Font Awesome：

```tsx
// ✅ 正确
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
<FontAwesomeIcon icon={faUser} />

// ❌ 错误
import { UserOutlined } from '@ant-design/icons';
```

### 3.2 样式方案（三层体系）

| 层级 | 方案 | 说明 |
|------|------|------|
| 第一层 | ConfigProvider 主题 | `App.tsx` 定义全局 token |
| 第二层 | 全局覆盖 `index.css` | 处理 ConfigProvider 未覆盖的细节 |
| 第三层 | CSS Modules `.module.css` | 页面/组件局部样式 |

### 3.3 目录结构

```
frontend/src/
├── api/              # API 请求封装 (request.ts)
├── components/      # 公共组件
│   ├── layout/      # MainLayout, FloatingChat, NotificationReminder
│   ├── privacy-field/
│   └── user/        # ProfileModal, AccountSettingsModal
├── constants/       # 公共常量 + Mock 数据
│   └── dictionaries.ts  # 字典数据
├── pages/           # 页面组件（共25+页面）
│   ├── login/           # 登录页
│   ├── workbench/       # 工作台（首页）
│   ├── mall/            # 路远商城（核心业务）
│   │   ├── customer/    # 客户管理（2页面）
│   │   │   ├── customer-list.tsx
│   │   │   └── customer-create.tsx
│   │   ├── order/       # 订单管理（8个页面）
│   │   │   ├── order-create.tsx
│   │   │   ├── order-pending.tsx
│   │   │   ├── order-shipped.tsx
│   │   │   ├── order-modify.tsx
│   │   │   ├── order-signed.tsx
│   │   │   ├── order-audit.tsx
│   │   │   └── order-aftersale.tsx
│   │   └── warehouse/   # 仓储管理（4个页面）
│   │       ├── product-manage.tsx
│   │       ├── stock-manage.tsx
│   │       ├── return-stock.tsx
│   │       └── stock-records.tsx
│   ├── data-screen/    # 数据大屏（3个页面）
│   │   ├── performance/v1.tsx
│   │   ├── performance/v2.tsx
│   │   └── ranking/index.tsx
│   ├── operations/     # 运营管理（2页面）
│   │   ├── channel-manage.tsx
│   │   └── log-list.tsx
│   ├── chat/           # 即时通讯
│   ├── message-center/ # 消息中心
│   ├── analytics/      # 数据分析
│   ├── report/         # 路远日报
│   ├── opportunity/    # 商机管理
│   ├── settings/       # 后台设置
│   └── system-settings/# 系统设置
├── stores/            # Zustand 状态管理
│   ├── user-store.ts # 用户状态（持久化）
│   └── app-store.ts  # UI 状态
├── types/             # TypeScript 类型定义
│   └── index.ts       # 所有业务实体接口
├── utils/             # 工具函数
│   └── color.ts       # 颜色处理
├── router.tsx         # 路由配置
└── App.tsx            # 应用入口（ConfigProvider）
```

### 3.4 类型定义

所有业务实体必须在 `src/types/index.ts` 中定义接口，严禁组件内部重复定义。

### 3.5 模块导出

采用 **barrel export** 模式：
```typescript
// pages/mall/order/index.ts
export { default as OrderCreate } from './order-create';
export { default as OrderPending } from './order-pending';
```

---

## 四、后端开发规范

### 4.1 目录结构

```
backend/app/
├── api/v1/           # API 路由（按业务模块）
│   ├── router.py     # 路由汇总
│   ├── auth.py       # 认证
│   ├── users.py      # 用户管理
│   ├── customers.py  # 客户管理
│   ├── products.py   # 商品管理
│   ├── orders.py     # 订单管理
│   ├── warehouses.py # 仓储管理
│   ├── chat.py      # 即时通讯
│   └── ...
├── core/
│   ├── config.py     # 环境配置
│   └── security.py   # JWT + bcrypt
├── crud/            # 数据库操作
├── models/          # SQLAlchemy 模型
├── schemas/         # Pydantic 模型
├── services/        # 业务逻辑（WebSocket）
└── db/
    ├── base.py       # Base + AuditMixin
    ├── session.py    # 异步连接池
    └── seed.py      # 种子数据
```

### 4.2 数据库规范

- 所有模型继承 `Base` + `AuditMixin`
- 必须包含字段：`id` (UUID), `created_at`, `updated_at`, `is_deleted`
- 使用 async/await 异步操作

### 4.3 API 规范

- 资源路径：kebab-case 复数名词
- 查询参数：`page`, `page_size`, `status`, `sort`
- 响应结构：`{ code: 200, message: "success", data: {...}, meta: {...} }`

### 4.4 WebSocket

- 连接地址：`ws://<host>/api/v1/ws/connect?token=<jwt>`
- 心跳：客户端 30s 发送 `{"type": "ping"}`
- 消息格式：统一使用 `WSEvent` 接口

---

## 五、权限系统规范

### 5.1 角色定义

| 角色 code | 中文名称 | 说明 |
|-----------|----------|------|
| `admin` | 超级管理员 | 系统固定角色，拥有所有权限 `["*"]` |
| `sales_manager` | 销售经理 | 管理团队、审批订单 |
| `sales` | 销售专员 | 仅操作自己数据 |
| `finance` | 财务专员 | 审核订单、查看报表 |

### 5.2 权限标识格式

格式：`resource:action`，如 `order:create`, `customer:list`

### 5.3 功能模块权限树

| 模块 | 权限 key |
|------|----------|
| 客户管理 | `customer:list`, `customer:create` |
| 订单管理 | `order:create`, `order:pending`, `order:shipped`, `order:signed`, `order:modify`, `finance:audit` |
| 仓储管理 | `warehouse:product`, `warehouse:stock`, `warehouse:return`, `warehouse:records` |
| 数据分析 | `office:analytics`, `office:report` |
| 运营管理 | `operation:channel`, `operation:logs` |
| 系统设置 | `settings:backend`, `settings:system` |

---

## 六、代码规范

### 6.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getUserInfo` |
| 类/组件 | PascalCase | `UserProfile` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 数据库表 | snake_case | `customer`, `order_item` |
| API 路由 | kebab-case | `/orders`, `/after-sales` |

### 6.2 缩进规范

| 语言 | 缩进 |
|------|------|
| JavaScript/TypeScript | 2 空格 |
| Python | 4 空格 |

### 6.3 代码风格

- **引号**：单引号
- **分号**：不使用（JavaScript）
- **最大行宽**：100 字符
- **换行符**：LF

---

## 七、工程管理规范

### 7.1 系统配置

| 配置项 | 值 |
|--------|-----|
| 当前用户 | `dev` |
| sudo 密码 | `Baidu123.` |
| 服务器 | Ubuntu 20.04 LTS (远程) |
| 容器管理 | 1Panel Pro + Docker |

### 7.2 数据库配置

| 配置项 | 值 |
|--------|-----|
| 数据库类型 | PostgreSQL |
| 主机 | `1Panel-postgresql-RTuB` |
| 端口 | `5432` |
| 用户名 | `user_sdxNSw` |
| 密码 | `password_YZ7MZ4` |
| 数据库名 | `netsale_v6` |
| 连接串 | `postgresql+asyncpg://user_sdxNSw:password_YZ7MZ4@1Panel-postgresql-RTuB:5432/netsale_v6` |

### 7.3 容器化开发

| 容器名称 | 服务类型 | 端口 | 描述 |
|---------|---------|------|------|
| `netsalev6_node` | 前端Node.js | 3000 | 运行前端React应用 |
| `netsale-backend` | 后端Python | 8000 | 运行FastAPI后端服务 |
| `1Panel-postgresql-RTuB` | PostgreSQL数据库 | 5432 | 存储应用数据 |
| `1Panel-openresty-aAjT` | Nginx反向代理 | - | 处理请求转发 |

- **前端**：`sudo docker exec -it netsalev6_node sh`
- **后端**：`sudo docker exec -it netsale-backend bash`
- **禁止**在宿主 Shell 执行 `node`, `npm`, `python`, `pip`

### 7.4 常用命令

> 注意：执行 Docker 命令需要 sudo 权限，密码：`Baidu123.`

```bash
# 启动后端（需要 sudo）
echo "Baidu123." | sudo -S docker compose up -d --build

# 初始化种子数据
echo "Baidu123." | sudo -S docker exec -it netsale-backend python -m app.db.seed

# 进入后端容器
echo "Baidu123." | sudo -S docker exec -it netsale-backend bash

# 进入前端容器
echo "Baidu123." | sudo -S docker exec -it netsalev6_node sh

# 查看后端日志
echo "Baidu123." | sudo -S docker logs --tail 200 netsale-backend

# 查看前端日志
echo "Baidu123." | sudo -S docker logs --tail 200 netsalev6_node

# 重启后端
echo "Baidu123." | sudo -S docker restart netsale-backend

# 查看容器状态
echo "Baidu123." | sudo -S docker ps
```

### 7.5 直接连接数据库

```bash
# 通过后端容器连接 PostgreSQL
echo "Baidu123." | sudo -S docker exec -it netsale-backend psql -h 1Panel-postgresql-RTuB -U user_sdxNSw -d netsale_v6

# 或使用 psql 直接连接
PGPASSWORD=password_YZ7MZ4 psql -h 1Panel-postgresql-RTuB -U user_sdxNSw -d netsale_v6
```

### 7.6 Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 代码重构
chore: 构建/工具
```

### 7.7 语言要求

- **注释/文档**：简体中文
- **代码原文**：英文（变量名、函数名、错误信息）

---

## 八、初始账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |
| manager | manager123 | 销售经理 |
| sales | sales123 | 销售专员 |
| finance | finance123 | 财务专员 |

---

## 九、参考文档

- 前端规范：[PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)
- 权限规范：[PERMISSION_SOP.md](../PERMISSION_SOP.md)
- 后端规范：[BACKEND_CONTEXT.md](../BACKEND_CONTEXT.md)
- 原始规则：[.agent/rules/user_global.md](../.agent/rules/user_global.md)

---

## 十、注意事项

1. 本规则适用于 NetSale V6.0 项目
2. 前端必须使用 Font Awesome 图标，严禁 Ant Design 图标
3. Python 后端使用 `ruff` 进行代码检查
4. 前端使用 `eslint` + `prettier` 进行代码规范
5. 数据库敏感信息不要提交到 GitHub
