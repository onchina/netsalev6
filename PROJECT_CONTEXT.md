# 网销 V6.0 前端开发规范与上下文
> **最后更新**: 2026-02-14
> **用途**: 本文件专注于前端开发规范、技术栈及环境约束。

---

## 1. 项目概览
**项目名称**: 网销 V6.0 (NetSale V6.0) - 前端工程
**类型**: CRM / 电商后端管理系统 (React SPA)
**目标**: 构建一套精细化的销售与运营管理系统的用户界面。

## 2. 前端技术栈

- **核心框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design (v6)
    - **主题配置**: 使用 `ConfigProvider` 定义全局主题，主色调 `#1677ff` (简洁蓝)。
- **图标库**: **Font Awesome** (`@fortawesome/react-fontawesome`)
    - **⚠️ 核心约束**: **严禁**使用 Ant Design 原生图标 (`@ant-design/icons`)，必须统一使用 Font Awesome。
- **状态管理**: Zustand (v5)
    - **静态状态**: 使用 `persist` 中间件持久化用户身份、Token、权限配置。
    - **动态状态**: 结合 WebSocket 实时维护在线状态、消息通知、协作信号（非持久化）。
- **实时通讯**: WebSocket (规划中)
    - 用于实时判断用户在线状态、接收服务端推送（消息/通知）。
    - 建议封装 `useSocketStore` 专门管理连接生命周期，与 `useUserStore` 联动。
- **路由管理**: React Router DOM (v7)
    - 采用 `createBrowserRouter` 数据路由模式。
- **图表库**: ECharts 6 / echarts-for-react
- **Excel 处理**: xlsx (SheetJS) — 用于导出数据为 Excel 文件
- **工具库**: Day.js (日期处理)
- **包管理**: npm (严格在 Docker 容器内运行)

## 3. 运行环境与约束
**当前环境**: 远程 Ubuntu 20.04 服务器 (1Panel + Docker)。

- **执行规则**:
  - **宿主操作**: 仅允许文件系统操作（`ls`, `cat`, `grep` 等）。
  - **🚫 AI 严禁执行的命令**:
    - **严禁** `npm`、`npx`、`node`、`pnpm` — 任何 Node.js 运行时命令。
    - **严禁** `npm run dev`、`npm run build`、`npm install` 等构建/启动命令。
    - **严禁** `docker`、`docker exec`、`docker restart` 等 Docker 命令。
    - **严禁** `sudo docker ...` 等任何需要提权的容器操作。
  - **AI 的职责边界**:
    - ✅ 只负责修改代码文件（源码 / 配置文件）。
    - ✅ 代码修改后依赖容器内 Vite HMR 自动热重载生效。
    - ✅ 如需安装依赖或执行命令，**仅告知用户需要执行的命令**，由用户自行操作。
  - **容器信息**:
    - **容器名称**: `netsalev6_node`
    - **工作目录**: `/app`（容器内挂载路径）
    - **开发账号**: `dev` / `Baidu123.`
    - **权限说明**: 可使用 `sudo` 获取 root 权限 (密码: `Baidu123.`)。
  - **路径规范**: 仅使用 Linux 绝对路径 (如 `/home/dev/netsalev6`)。

## 4. 编码规范

### 4.1 UI 开发
1.  **组件使用**: 严格使用 **Ant Design (v6)** 组件。
2.  **图标使用**: 所有图标必须引入 Font Awesome React 组件。
    ```tsx
    // ✅ 正确
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faUser } from '@fortawesome/free-solid-svg-icons';
    <FontAwesomeIcon icon={faUser} />

    // ❌ 错误
    import { UserOutlined } from '@ant-design/icons';
    ```
3.  **样式方案** (三层体系):
    - **第一层 — ConfigProvider 主题**: 通过 `App.tsx` 的 `themeConfig` 全局定义 token 与组件变量。
    - **第二层 — 全局覆盖 (`index.css`)**: Ant Design 类名覆盖，处理 ConfigProvider 未覆盖的细节。
    - **第三层 — CSS Modules (`.module.css`)**: 页面/组件级别的局部样式，避免类名冲突。文件命名与组件一对一对应（如 `order-audit.tsx` → `order-audit.module.css`），同一模块也可共享一个模块级 CSS（如 `order.module.css`）。
4.  **响应式**: 利用 Ant Design 的 Grid 系统 (`Row`, `Col`) 适配不同屏幕。

### 4.2 逻辑开发
1.  **状态管理**:
    - 全局状态（用户信息、应用配置、权限）存放在 `src/stores` 目录下。
    - 使用 `zustand` 创建 store，必要时结合 `persist`。
2.  **类型安全**:
    - 所有核心数据模型（User, Order, Product 等）必须在 `src/types/index.ts` 中定义接口。
    - 避免使用 `any`，组件 Props 必须定义类型。
3.  **路由配置**:
    - 路由统一在 `src/router.tsx` 中定义。
    - 页面组件存放在 `src/pages` 目录。
4.  **工具函数**:
    - 通用逻辑提取到 `src/utils`。
    - 常量定义在 `src/constants`。

## 5. 项目结构
```text
/home/dev/netsalev6/frontend/
├── public/                  # Vite 静态资源 (原样复制，不经打包)
│   └── favicon.svg          # 网站图标
├── src/
│   ├── components/          # 通用 UI 组件
│   │   ├── layout/          # 布局组件 (MainLayout, FloatingChat, NotificationReminder)
│   │   ├── privacy-field/   # 隐私字段组件
│   │   └── user/            # 用户组件 (ProfileModal, AccountSettingsModal)
│   ├── constants/           # 公共常量与 Mock 数据
│   │   └── dictionaries.ts  # 字典数据 (渠道, 客户类型, 支付方式等)
│   ├── pages/               # 页面级组件
│   │   ├── mall/            # 路远商城 (核心业务模块)
│   │   │   ├── customer/    # 客户管理
│   │   │   ├── order/       # 订单管理 (7 个子页面)
│   │   │   └── warehouse/   # 仓储管理 (4 个子页面)
│   │   ├── data-screen/     # 数据大屏 (独立全屏页面)
│   │   │   ├── performance/ # 作战大屏
│   │   │   └── ranking/     # 排行榜大屏
│   │   ├── operations/      # 运营管理 (渠道管理, 操作日志)
│   │   ├── workbench/       # 工作台 (首页)
│   │   ├── chat/            # 即时通讯 (独立全屏页面)
│   │   ├── analytics/       # 数据分析
│   │   ├── report/          # 路远日报
│   │   ├── settings/        # 后台设置
│   │   ├── system-settings/ # 系统设置
│   │   ├── message-center/  # 消息中心
│   │   ├── opportunity/     # 商机管理
│   │   ├── login/           # 登录页 (独立页面)
│   │   └── messages/        # 消息通知记录 (规划中)
│   ├── stores/              # Zustand 状态仓库
│   │   ├── index.ts         # 统一导出
│   │   ├── user-store.ts    # 用户状态 (持久化)
│   │   └── app-store.ts     # 应用 UI 状态
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # 所有业务实体接口
│   ├── utils/               # 工具函数
│   │   └── color.ts         # 颜色处理 + PRESET_COLORS
│   ├── App.tsx              # 应用入口 (ConfigProvider + 主题配置)
│   ├── main.tsx             # 渲染入口 (StrictMode)
│   ├── router.tsx           # 路由配置
│   ├── index.css            # 全局样式 + Ant Design 覆盖
│   └── vite-env.d.ts        # Vite 类型声明
├── .gitignore               # Git 忽略规则
├── index.html               # 应用入口 HTML
├── package.json
├── tsconfig.json
├── tsconfig.node.json       # Vite 配置专用 TS 编译选项
└── vite.config.ts
```

## 7. 核心公共资源 (Standardized Resources)

为了避免重复定义和数据差异，请在开发中严格复用以下公共资源。

### 7.1 类型定义 (`src/types/index.ts`)
所有业务实体必须使用以下接口，**严禁**在组件内部定义重复的 interface。

| 接口名 | 描述 | 关键字段 (简化) |
|---|---|---|
| `UserRole` | 用户角色联合类型 | `'admin' \| 'finance' \| 'sales_manager' \| 'sales'` |
| `User` | 用户/员工 | `id`, `name`, `role`, `roleLabel`, `employeeNo`, `permissionList`, `permissions` (兼容) |
| `MenuItem` | 菜单项 | `key`, `label`, `icon?`, `children?`, `path?` |
| `Customer` | 客户 | `id`, `name`, `phone`, `channel?`, `ownerId?`, `height?`, `age?`, `weight?` |
| `Product` | 商品 | `id`, `name`, `spec`, `price`, `cost?`, `status`, `stock?`, `image?` |
| `OrderItem` | 订单明细 | `productId`, `productName`, `spec`, `price`, `quantity`, `subtotal` |
| `Order` | 订单 | `id`, `orderNo`, `items`, `status`, `totalAmount`, `paidAmount`, `codAmount`, `paidRatio`, `shipNow`, `commission?` |
| `AfterSale` | 售后单 | `id`, `orderId`, `orderNo`, `type`, `reason`, `images?`, `status` |
| `Notification` | 消息通知 | `id`, `title`, `content`, `type`, `read`, `createdAt` |
| `TodoItem` | 待办事项 | `id`, `type`, `content`, `status`, `link?` |

> **注意**: `ConfigItem` 接口定义在 `constants/dictionaries.ts` 中，而非 `types/index.ts`。字段包含 `id`, `name`, `code`, `color?`, `sort`, `enabled`, `createdAt`。

### 7.2 全局状态 (`src/stores/`)
统一使用 Zustand 管理，禁止在组件间通过 Props 层层传递全局数据。

| Store Hook | 文件 | 用途 | 是否持久化 |
|---|---|---|---|
| `useUserStore` | `user-store.ts` | 当前登录用户信息、Token、登录状态 | ✅ 是 |
| `useAppStore` | `app-store.ts` | 侧边栏折叠 (`collapsed`) 等 UI 状态 | ❌ 否 |
| `useSocketStore` | *(规划中)* | WebSocket 连接状态、在线列表 | ❌ 否 |

### 7.3 工具函数 (`src/utils/`)

- **颜色处理** (`utils/color.ts`):
  - `hexToRgba(hex, alpha)`: 将 Hex 颜色转为 RGBA，常用于背景色透明化。
  - `getTagStyle(color)`: 生成标签样式（文字深色，背景浅色），用于渠道/状态标签。
    ```tsx
    <Tag style={getTagStyle('#1677ff')}>标签</Tag>
    ```

### 7.4 公共常量与演示数据 (`src/constants/dictionaries.ts`)
业务中涉及的下拉选项、状态枚举、Mock 数据，必须引用此文件。

| 常量名 | 用途 | 包含数据示例 |
|---|---|---|
| `MOCK_CHANNELS` | 进线渠道 | 抖音, 快手, 微信, 淘宝, 京东 |
| `MOCK_CUSTOMER_TYPES` | 客户类型 | 新客, 老客, 复购客, VIP客户 |
| `MOCK_ORDER_TYPES` | 订单类型 | 新单, 复购, 升单, 补单 |
| `MOCK_PAYMENT_METHODS` | 支付方式 | 微信支付, 支付宝, 银行转账, 企业微信转账, 预付定金, 货到付款 |
| `MOCK_RESPONSIBILITY_TYPES` | 售后判责 | 销售承担, 公司承担, 物流承担, 客户承担 |
| `MOCK_EMPLOYEES` | 员工列表 | 张三(销售一部), 李四(销售二部), 王五(市场部), 赵六(客服部) |
| `PRESET_COLORS` | 预设颜色池 (24色) | 定义在 `utils/color.ts`，用于标签颜色选择器 |

- **实时通讯**: WebSocket (核心基础设施)
    - **用途**: 企业内部 IM 即时通讯、在线状态同步、系统通知推送。
    - **协议**: 严格遵循 Section 7.5 定义的 JSON 消息格式。
    - **管理**: 使用 `useSocketStore` 单例管理连接心跳与重连。

### 7.5 WebSocket & IM 通讯协议 (Standardized WebSocket)
前后端必须严格遵守以下通讯标准，确保 IM 功能稳定。

1.  **连接地址**: `ws://<host>/api/v1/ws/connect?token={JWT_TOKEN}`
2.  **心跳机制**: 
    - 客户端每 30s 发送 `{"type": "ping"}`。
    - 服务端回复 `{"type": "pong"}`。
3.  **消息负载结构 (Payload)**:
    ```typescript
    interface WSEvent<T = any> {
        type: string;      // 事件类型: 'im.message', 'sys.notification', 'status.change'
        data: T;           // 业务数据
        timestamp: number; // 毫秒时间戳
        eventId?: string;  // 唯一事件ID (用于ACK)
    }
    ```
4.  **IM 消息数据模型 (`IMMessage`)**:
    ```typescript
    interface IMMessage {
        id: string;        // UUID
        senderId: string;
        receiverId: string; // 用户ID 或 群组ID
        content: string;
        contentType: 'text' | 'image' | 'file';
        scene: 'private' | 'group';
        status: 'sending' | 'sent' | 'read' | 'failed';
        createdAt: string;
    }
    ```
### 7.6 API 接口规范 (RESTful Standard)
前后端通讯统一使用 RESTful API 风格。

1.  **资源路径**: 使用名词复数，避免动词。
    - `GET /api/v1/users` (列表)
    - `POST /api/v1/users` (创建)
    - `GET /api/v1/users/{id}` (详情)
    - `PUT /api/v1/users/{id}` (全量更新)
    - `PATCH /api/v1/users/{id}` (部分更新)
    - `DELETE /api/v1/users/{id}` (删除)
2.  **查询参数**:
    - 分页: `?page=1&page_size=20`
    - 排序: `?sort=-created_at` (降序), `?sort=name` (升序)
    - 过滤: `?status=active&role=admin`
3.  **统一响应结构 (Standard Response)**:
    ```typescript
    interface APIResponse<T = any> {
        code: number;      // 业务码: 200(成功), 400(错误), 401(未认证)
        message: string;   // 提示信息
        data: T;           // 业务数据
        meta?: {           // 分页元数据 (仅列表接口)
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }
    ```

### 7.7 认证与权限规范 (Unified Auth & RBAC)
前后端统一采用 **RBAC (Role-Based Access Control)** 模型。


1.  **角色定义 (UserRole)**:
    - `admin` (超级管理员): **系统固定角色**，拥有所有权限，**不可删除或修改**。
    - **自定义角色** (Dynamic Roles): 系统初始化默认提供以下角色，但支持增删改：
        - `sales_manager`: 销售经理 (默认权限：管理团队、审批订单)
        - `sales`: 销售专员 (默认权限：仅操作自己数据)
        - `finance`: 财务专员 (默认权限：审核订单、查看报表)
2.  **权限标识 (Permission Strings)**:
    - 格式: `resource:action` (如 `order:create`, `customer:export`)
    - 前端判断: 使用 `user.permissionList.includes('order:create')` 或封装 Hook `usePermission('order:create')`。
3.  **登录流程**:
    - 接口: `POST /api/v1/auth/login`
    - 响应: `{ token: "jwt...", user: { ... } }`
    - 存储: Token 存入 localStorage (通过 Zustand persist)，请求头携带 `Authorization: Bearer <token>`。

4.  **单点登录 (Single Device Login)**:
    - **互踢机制**: 系统通过 WebSocket 保持单一在线。
    - **处理逻辑**: 监听 WebSocket `onMessage`，若收到 `type: 'sys.kick'`：
        - 立即调用 `useUserStore.getState().logout()` 清除 Token。
        - 弹出 `Modal.error({ title: '下线通知', content: '您的账号已在别处登录，如非本人操作请修改密码。' })`。
        - 跳转至 `/login` 页。

## 8. 模块导出约定

页面模块采用 **barrel export** 模式：
- 每个页面组件使用 `export default` 导出。
- 每个模块目录下有 `index.ts` 统一 re-export。
- CSS Modules 文件命名采用一对一对应：`order-audit.tsx` → `order-audit.module.css`。同一模块下的组件也可共享一个模块级 CSS（如 `order.module.css`）。

```typescript
// 示例: pages/mall/order/index.ts
export { default as OrderCreate } from './order-create';
export { default as OrderPending } from './order-pending';
```

路由文件 (`router.tsx`) 从各模块 `index.ts` 批量引入。

## 9. AI 工作流指南
1.  **读取上下文**: 任务开始前，优先检查本文件。
2.  **代码实现**:
    - 仅修改 `frontend/src` 下的代码文件。
    - 遵循上述编码规范，特别是 **Font Awesome 图标** 的使用。
    - 依托 Ubuntu 环境热重载 (HMR) 机制，代码修改自动生效，无需提醒用户验证。
