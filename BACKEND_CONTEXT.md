# 网销 V6.0 后端开发规范与上下文
> **最后更新**: 2026-02-18
> **用途**: 本文件专注于后端开发规范、技术栈、环境约束及前端对接指南。
> **当前状态**: ✅ 后端服务已部署运行，数据库已初始化，API 已验证通过。

---

## 1. 项目概览
**项目名称**: 网销 V6.0 (NetSale V6.0) - 后端服务
**类型**: CRM / 电商后端管理系统 (RESTful API)
**目标**: 提供高效、安全的数据接口，支持客户管理、订单处理、库存管理、售后服务及实时通讯。

## 2. 后端技术栈

- **核心框架**: Python 3.12 + **FastAPI** 0.115
    - **API 模式**: RESTful API
    - **文档生成**: OpenAPI / Swagger UI (自动生成) — 访问 `http://<host>:8000/docs`
- **数据库**: **PostgreSQL** (Docker 容器化)
    - **ORM**: SQLAlchemy 2.0 (Async) + Pydantic v2 (Schema 验证)
    - **连接池**: Asyncpg
- **实时通讯 (IM)**: WebSocket
    - 结合 FastAPI WebSocket 提供 **企业级 IM 即时通讯** 能力。
    - **Session 管理**: 内存字典维护 `ConnectionManager` (单例模式)。
- **身份认证**: JWT (python-jose) + bcrypt 密码哈希
- **包管理**: pip (严格在 Docker 容器内运行)

## 3. 运行环境与容器信息

### 3.1 容器状态 (✅ 已部署)

| 容器名称 | 镜像 | 端口 | 网络 | 状态 |
|---|---|---|---|---|
| `netsale-backend` | `backend-netsale-backend` | `0.0.0.0:8000 → 8000` | `1panel-network` | ✅ Running |
| `1Panel-postgresql-RTuB` | PostgreSQL Latest | `127.0.0.1:5432 → 5432` | `1panel-network` | ✅ Healthy |
| `netsalev6_node` | Node.js (前端) | — | `1panel-network` | ✅ Running |

### 3.2 数据库配置 (✅ 已创建)

| 配置项 | 值 |
|---|---|
| **容器 DNS** | `1Panel-postgresql-RTuB` |
| **端口** | `5432` |
| **用户名** | `user_sdxNSw` |
| **密码** | `password_YZ7MZ4` |
| **数据库名** | `netsale_v6` ✅ 已创建 |
| **连接串** | `postgresql+asyncpg://user_sdxNSw:password_YZ7MZ4@1Panel-postgresql-RTuB:5432/netsale_v6` |

### 3.3 执行规则
- **宿主操作**: 仅允许文件系统操作和 Docker 命令。
- **🚫 严禁** 在宿主 Shell 直接运行 `python`, `pip`, `uvicorn`。
- **服务启动**: `cd /home/dev/netsalev6/backend && sudo docker compose up -d --build`
- **种子数据**: `sudo docker exec -it netsale-backend python -m app.db.seed`
- **查看日志**: `echo "Baidu123." | sudo -S docker logs --tail 200 netsale-backend`
- **路径规范**: 仅使用 Linux 绝对路径，后端代码根目录 `/home/dev/netsalev6/backend/`

## 4. 编码规范

### 4.1 架构设计
采用分层架构 (Layered Architecture)：
```text
/backend/app/
├── api/             # 路由与控制器 (Routers)
│   ├── v1/          # API 版本控制
│   │   ├── router.py       # 路由汇总
│   │   ├── auth.py          # 认证
│   │   ├── users.py         # 用户管理
│   │   ├── customers.py     # 客户管理
│   │   ├── products.py      # 商品管理
│   │   ├── orders.py        # 订单管理
│   │   ├── after_sales.py   # 售后管理
│   │   ├── analytics.py     # 统计分析 (大屏)
│   │   ├── warehouses.py    # 仓储管理
│   │   ├── settings.py      # 系统设置
│   │   └── websocket.py     # WebSocket IM
│   └── deps.py      # 依赖注入 (JWT鉴权 + 权限检查)
├── core/
│   ├── config.py    # 环境配置 (pydantic-settings)
│   └── security.py  # JWT + bcrypt
├── crud/
│   ├── base.py      # 通用异步 CRUD 基类
│   └── crud_instances.py  # 各实体 CRUD 实例
├── db/
│   ├── base.py      # Base + AuditMixin
│   ├── session.py   # AsyncSession + 连接池
│   └── seed.py      # 种子数据脚本
├── models/          # SQLAlchemy ORM 模型
│   ├── user.py, customer.py, product.py
│   ├── order.py, after_sale.py
│   ├── notification.py, im_message.py
├── schemas/         # Pydantic v2 — camelCase 对齐前端
│   ├── response.py  # 统一响应 + 分页 meta
│   ├── user.py, customer.py, product.py
│   ├── order.py, after_sale.py
├── services/
│   └── ws_manager.py  # WebSocket ConnectionManager (心跳/互踢)
└── main.py          # FastAPI 入口
```

### 4.2 开发规范
1.  **异步优先**: 必须使用 `async def` 定义 API 处理函数和数据库操作。
2.  **类型提示**: 全面使用 Python Type Hints，配合 Pydantic v2 进行严格数据验证。
3.  **API 规范 (RESTful Standard)**:
    - **资源路径**: 使用 kebab-case 复数名词。
    - **查询参数**: `page: int = 1`, `page_size: int = 20`
    - **响应结构 (Standard Response)**:
        - 成功: HTTP 200/201
        ```json
        {
          "code": 200,
          "message": "success",
          "data": { ... },
          "meta": {
            "total": 100,
            "page": 1,
            "pageSize": 20,
            "totalPages": 5
          }
        }
        ```
        - 失败: HTTP 4xx/5xx, Body: `{"code": 400, "message": "error detail"}`
4.  **WebSocket**:
    - 专门处理 `/ws/` 路径。
    - 使用 `ConnectionManager` 单例管理活跃连接。

### 4.3 数据库模型规范
- 所有模型继承自 `Base` + `AuditMixin`。
- 表名使用 snake_case。
- 必须包含审计字段: `id` (UUID), `created_at`, `updated_at`, `is_deleted` (软删除)。

## 5. 数据库表结构 (✅ 已创建)

共 **20 张表**，全部在 `netsale_v6` 数据库中：

| 表名 | 对应前端类型 | 说明 |
|---|---|---|
| `users` | `User` | 用户/员工 |
| `roles` | `UserRole` | 角色 (admin, sales_manager, sales, finance) |
| `permissions` | — | 权限标识 (37项) |
| `role_permissions` | — | 角色-权限多对多关联 |
| `customers` | `Customer` | 客户 |
| `products` | `Product` | 商品 |
| `orders` | `Order` | 订单 |
| `order_items` | `OrderItem` | 订单明细 |
| `after_sales` | `AfterSale` | 售后单 |
| `notifications` | `Notification` | 消息通知 |
| `im_messages` | `IMMessage` | IM 聊天记录 |
| `warehouses` | `Warehouse` | 仓库 |
| `stocks` | `Stock` | 库存明细 |
| `stock_logs` | `StockLog` | 出入库记录 |
| `system_settings` | `SystemSetting` | 系统配置 |
| `audit_logs` | — | 操作审计日志 |
| `dictionaries` | `ConfigItem` | 数据字典 (渠道/类型等) |
| `opportunities` | `Opportunity` | 商机跟进 |
| `sales_targets` | — | 业绩目标 |
| `tasks` | — | 待办任务/工单 |

## 6. API 接口清单 (✅ 已实现)

### 6.1 认证

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | 用户登录，返回 JWT + User 信息 | 公开 |

**登录响应示例** (对齐前端 `useUserStore.login(user)`):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "系统管理员",
      "role": "admin",
      "roleLabel": "超级管理员",
      "employeeNo": "EMP0001",
      "email": null,
      "phone": null,
      "avatar": null,
      "permissionList": ["user:list", "user:create", "order:audit", ...]
    }
  }
}
```

### 6.2 用户管理

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | 当前用户信息 | 登录即可 |
| `GET` | `/api/v1/users` | 用户列表 (分页) | `user:list` |
| `POST` | `/api/v1/users` | 创建用户 | `user:create` |
| `GET` | `/api/v1/users/{id}` | 用户详情 | `user:read` |
| `PATCH` | `/api/v1/users/{id}` | 更新用户 | `user:update` |
| `DELETE` | `/api/v1/users/{id}` | 删除用户 (软删除) | `user:delete` |

### 6.3 客户管理

| 方法 | 路径 | 说明 | 权限 | 数据权限 |
|---|---|---|---|---|
| `GET` | `/api/v1/customers` | 客户列表 | `customer:list` | sales 仅看自己的 |
| `POST` | `/api/v1/customers` | 创建客户 | `customer:create` | 默认归属当前用户 |
| `GET` | `/api/v1/customers/{id}` | 客户详情 | `customer:read` | — |
| `PATCH` | `/api/v1/customers/{id}` | 更新客户 | `customer:update` | — |
| `DELETE` | `/api/v1/customers/{id}` | 删除客户 | `customer:delete` | — |

### 6.4 商品管理

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `GET` | `/api/v1/products` | 商品列表 (支持 `status_filter`) | `product:list` |
| `POST` | `/api/v1/products` | 创建商品 | `product:create` |
| `GET` | `/api/v1/products/{id}` | 商品详情 | `product:read` |
| `PATCH` | `/api/v1/products/{id}` | 更新商品 | `product:update` |
| `DELETE` | `/api/v1/products/{id}` | 删除商品 | `product:delete` |

### 6.5 订单管理

| 方法 | 路径 | 说明 | 权限 | 数据权限 |
|---|---|---|---|---|
| `GET` | `/api/v1/orders` | 订单列表 (支持 `status_filter`) | `order:list` | sales 仅看自己的 |
| `POST` | `/api/v1/orders` | 创建订单 (自动生成 orderNo) | `order:create` | created_by = 当前用户 |
| `GET` | `/api/v1/orders/{id}` | 订单详情 (含 items) | `order:read` | — |
| `PATCH` | `/api/v1/orders/{id}` | 更新订单 / 审核状态变更 | `order:update` | — |
| `DELETE` | `/api/v1/orders/{id}` | 删除订单 | `order:delete` | — |

### 6.6 售后管理

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `GET` | `/api/v1/after-sales` | 售后列表 | `aftersale:list` |
| `POST` | `/api/v1/after-sales` | 创建售后单 | `aftersale:create` |
| `GET` | `/api/v1/after-sales/{id}` | 售后详情 | `aftersale:read` |
| `PATCH` | `/api/v1/after-sales/{id}` | 更新售后单 | `aftersale:update` |

### 6.8 系统配置 (System Settings)

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `GET` | `/api/v1/settings` | 获取配置 (默认 `?group=global`) | `settings:view` |
| `PUT` | `/api/v1/settings/global` | 批量更新全局设置 (例如 `siteName`) | `system:settings` |
| `PUT` | `/api/v1/settings/security` | 更新极度安全选项 (自动处理密码 Hash) | `system:settings` |
| `PUT` | `/api/v1/settings/batch` | 通用批量更新配置接口 | `system:settings` |

### 6.9 后台设置 (Admin Config)
包含部门管理、权限配置、物流接口、IP白名单、敏感词库配置。

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/admin/departments` | 部门管理 | `settings:system` |
| `GET` | `/api/v1/admin/roles` | 角色/权限配置列表 | `settings:system` |
| `PUT` | `/api/v1/admin/roles/{id}` | 更新角色权限 | `settings:system` |
| `GET` / `PUT(status)` | `/api/v1/admin/logistics` | 物流配置状态 | `settings:system` |
| `GET` / `POST` / `PUT` / `DELETE` / `PUT(status)` | `/api/v1/admin/ip-whitelist` | IP 白名单管理 | `settings:system` |
| `GET` / `POST` / `DELETE` | `/api/v1/admin/sensitive-words` | 敏感词库管理 | `settings:system` |

### 6.10 办公协同 (Office & Reports)

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| `GET` | `/api/v1/reports` | 当前用户的日报列表 | `office:dashboard` |
| `POST` | `/api/v1/reports` | 创建日报或保存草稿 | `office:dashboard` |
| `PUT` | `/api/v1/reports/{id}` | 更新或提交日报 | `office:dashboard` |
| `GET` | `/api/v1/tasks/todo` | 获取当前用户的待办任务列表 | `office:dashboard` |
| `POST` | `/api/v1/tasks` | 创建待办任务 | `office:dashboard` |

### 6.11 WebSocket

| 路径 | 说明 |
|---|---|
| `ws://<host>:8000/api/v1/ws/connect?token=<jwt>` | WebSocket 入口 (鉴权 + 心跳 + IM + 互踢) |

## 7. WebSocket IM 通讯协议

### 7.1 连接与鉴权
- **接入点**: `ws://<host>:8000/api/v1/ws/connect?token=<jwt>`
- **鉴权**: 握手阶段校验 JWT，失败断开 (Code: 1008)。

### 7.2 心跳检测
- 客户端每 30s 发送 `{"type": "ping"}`。
- 服务端回复 `{"type": "pong"}`，超时 (60s) 主动断开连接。

### 7.3 消息负载结构 (WSEvent)
```typescript
interface WSEvent<T = any> {
    type: string;      // 'im.message' | 'sys.notification' | 'status.change' | 'sys.kick' | 'im.ack'
    data: T;
    timestamp: number; // 毫秒时间戳
    eventId?: string;
}
```

### 7.4 IM 消息模型 (IMMessage)
```typescript
interface IMMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    contentType: 'text' | 'image' | 'file';
    scene: 'private' | 'group';
    status: 'sending' | 'sent' | 'read' | 'failed';
    createdAt: string;
}
```

### 7.5 单点登录互踢 (sys.kick)
- 新连接建立 → 检查旧连接 → 给旧设备发送：
```json
{ "type": "sys.kick", "data": { "reason": "logged_in_elsewhere" }, "timestamp": 1739880000000 }
```
- 前端收到后：清除 Token → 跳转 `/login` → 弹窗提示。

### 7.6 系统消息通知 (sys.notification)
当服务端产生系统广播、业务提醒（如：审核通过）或 IM 离线通知时，通过该类型推送：
```json
{
  "type": "sys.notification",
  "data": {
    "id": "uuid",
    "title": "审核通过",
    "content": "订单 NS2026... 已由经理审核通过",
    "type": "success",
    "read": false,
    "createdAt": "2026-02-18T17:45:00Z"
  }
}
```

### 7.7 大屏系统 (Data Screens) 推送协议
系统包含三个大屏：**V1 (基础版)**, **V2 (PRO 版)**, 和 **排行榜 (Ranking)**。

1.  **初始请求**: 前端进入大屏时发送 `screen.v1.init`, `screen.v2.init` 或 `screen.ranking.init`。
2.  **周期性推送**: 服务端每 10s 广播 `screen.v1.update`, `screen.v2.update` 和 `screen.ranking.update`。

**V1 大屏 (screen.v1.update)**:
```json
{
  "type": "screen.v1.update",
  "data": {
    "summary": { "sales": 128400, "orders": 456, ... },
    "trend": { "categories": ["00:00", ...], "actual": [...], "target": [...] },
    "distribution": [{ "name": "销售一部", "value": 45 }, ...]
  }
}
```

**V2 PRO 大屏 (screen.v2.update)**:
```json
{
  "type": "screen.v2.update",
  "data": {
    "stats": { "sales": 128400, "orders": 452, "trend": 12.5, ... },
    "chart": { "categories": [...], "actual": [...], "yesterday": [...] },
    "departmentContribution": [{ "name": "销售部", "value": 65, "color": "#3b82f6" }, ...]
  }
}
```

**排行榜大屏 (screen.ranking.update)**:
```json
{
  "type": "screen.ranking.update",
  "data": {
    "personal": [{ "rank": 1, "name": "张三", "amount": 128600, ... }, ...],
    "department": [{ "rank": 1, "name": "销售部", "amount": 302800, ... }, ...]
  }
}
```

## 8. 认证与权限系统 (RBAC)

### 8.1 认证流程
- **登录**: `POST /api/v1/auth/login` (Body: `{"username": "...", "password": "..."}`)
- **Token**: JWT, 有效期 7 天, Payload: `{sub: user_id, role: role_code}`
- **鉴权**: `Authorization: Bearer <token>`

### 8.2 角色定义 (✅ 已初始化)

| 角色 code | 显示名 | 系统角色 | 说明 |
|---|---|---|---|
| `admin` | 超级管理员 | ✅ 是 (不可删除) | 拥有全部 37 项权限 |
| `sales_manager` | 销售经理 | ❌ 否 | 管理团队 + 审批订单 (18项权限) |
| `sales` | 销售专员 | ❌ 否 | 仅操作自己数据 (13项权限) |
| `finance` | 财务专员 | ❌ 否 | 审核订单 + 查看报表 (8项权限) |

### 8.3 权限标识清单 (37项，✅ 已入库)

| 资源 | 权限标识 |
|---|---|
| **用户** | `user:list` `user:create` `user:read` `user:update` `user:delete` |
| **客户** | `customer:list` `customer:create` `customer:read` `customer:update` `customer:delete` `customer:export` |
| **商品** | `product:list` `product:create` `product:read` `product:update` `product:delete` |
| **订单** | `order:list` `order:create` `order:read` `order:update` `order:delete` `order:audit` |
| **售后** | `aftersale:list` `aftersale:create` `aftersale:read` `aftersale:update` |
| **分析/日报** | `analytics:view` `report:view` `report:create` |
| **运营** | `channel:list` `channel:create` `channel:update` `channel:delete` `log:list` |
| **设置** | `settings:view` `settings:edit` `system:settings` |

### 8.4 数据权限
- `sales` 角色: 客户列表过滤 `owner_id == current_user.id`，订单列表过滤 `created_by == current_user.id`
- `sales_manager` / `admin`: 查看所有数据

## 9. 初始账号 (✅ 已创建)

| 用户名 | 密码 | 姓名 | 工号 | 角色 | 部门 |
|---|---|---|---|---|---|
| `admin` | `admin123` | 系统管理员 | EMP0001 | 超级管理员 | 管理层 |
| `zhangsan` | `123456` | 张三 | EMP1001 | 销售专员 | 销售一部 |
| `lisi` | `123456` | 李四 | EMP1002 | 销售专员 | 销售二部 |
| `wangwu` | `123456` | 王五 | EMP1003 | 销售经理 | 市场部 |
| `zhaoliu` | `123456` | 赵六 | EMP1004 | 财务专员 | 客服部 |

> 演示账号对齐前端 `constants/dictionaries.ts` 中的 `MOCK_EMPLOYEES`。

## 10. 前端对接指南

### 10.1 接口映射 — 前端需替换的 Mock 数据

| 前端当前 Mock / 硬编码 | 替换为 API | 说明 |
|---|---|---|
| `MOCK_EMPLOYEES` | `GET /api/v1/users` | 员工列表 |
| `useUserStore` 本地模拟登录 | `POST /api/v1/auth/login` | 登录后存入 Store |
| 客户列表硬编码 | `GET /api/v1/customers` | 分页 + 数据权限 |
| 商品列表硬编码 | `GET /api/v1/products` | 分页 + 状态过滤 |
| 订单数据 | `GET /api/v1/orders` | 分页 + 状态过滤 |
| 售后数据 | `GET /api/v1/after-sales` | 分页 |

### 10.2 字典同步 — 前端 `dictionaries.ts` ↔ 后端字段

| 前端常量 | 后端字段 | 存储值 (code) |
|---|---|---|
| `MOCK_ORDER_TYPES` | `orders.order_type` | `new` `repurchase` `upgrade` `supplement` |
| `MOCK_PAYMENT_METHODS` | `orders.payment_method` | `wechat` `alipay` `bank` `cp_wechat` `deposit` `cod` |
| `MOCK_CHANNELS` | `customers.channel` | `douyin` `kuaishou` `wechat` `taobao` `jd` |
| Order status 枚举 | `orders.status` | `draft` `manager_pending` `finance_pending` `approved` `shipped` `signed` `completed` `manager_rejected` `finance_rejected` `voided` `cancelled` |
| AfterSale type 枚举 | `after_sales.type` | `refund` `return` `exchange` |
| AfterSale status 枚举 | `after_sales.status` | `pending` `approved` `rejected` `completed` |
| 订单物流信息 | `orders.tracking_no`, `orders.courier_company`, `orders.shipped_at`, `orders.signed_at` | 发货/签收记录 |

### 10.3 请求头规范
```typescript
// 前端 Axios / Fetch 拦截器配置
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${useUserStore.getState().token}`,
}
```

## 11. AI 工作流指南
1.  **读取上下文**: 任务开始前，优先检查本文件及 `PROJECT_CONTEXT.md` (前端规范)。
2.  **代码实现**:
    - 仅修改 `backend/app` 下的代码文件。
    - 代码修改自动通过 Uvicorn `--reload` 热重载生效。
3.  **数据库变更**: 当前开发阶段由 `main.py` lifespan 自动建表。生产环境需切换到 Alembic 迁移。
4.  **容器命令参考**:
    ```bash
    # 重建并启动
    cd /home/dev/netsalev6/backend && sudo docker compose up -d --build
    # 查看日志 (如果因为sudo需要密码认证，请使用密码: Baidu123.)
    echo "Baidu123." | sudo -S docker logs --tail 200 netsale-backend
    # 进入容器
    sudo docker exec -it netsale-backend bash
    # 重新初始化种子数据
    sudo docker exec -it netsale-backend python -m app.db.seed
    ```
