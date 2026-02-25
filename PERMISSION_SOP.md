# Antigravity CRM 权限系统规范文档 (PERMISSION_SOP)

> **版本时间:** 2026-02-23 (全站节点对齐落地)
> **说明:** 本文档包含全栈权限点映射逻辑、角色标识符基准规范以及全新的导航栏 1:1 权限功能树。由于导航栏（ Navigation Bar ）经历了大修重排且删除了部分过期路由，本文档对废弃权限点做出了纠正，同时标记了新增的页面模块。本规范必须在后续开发中作为权限参考的标准。**当前项目的前后端代码 (`main-layout.tsx`, `seed.py` 等) 已完成基于本文档结构树的全局重组对齐！**

---

## 1. 映射逻辑分析（问题根源及修复标准）

### 1.1 核心问题现象
在先前的版本中，“成员页面”展示的员工角色字段，与“权限配置”列表中管理维护的角色条目属于割裂的“孤岛”，无法相互匹配，表现为成员列表中员工的角色显示为英文字母标识符（如 `sales`, `finance`），而非中文名称。

### 1.2 根源定位
1. **数据出口不一致：**
   - 员工中心获取 `/api/v1/users` 时，其携带的基础 `role` 字段映射的是后端的 `Role.code` 静态标识符。 
   - “权限配置”模态框在获取 `/api/v1/admin/roles` 时，旧版本接口仅下发了 `Role.id`（UUID类型的物理主键）与 `Role.name`（中文展示名），缺失了桥接依据。
2. **校验失焦：**
   导致前端渲染 `Table` 组件时由于无法利用 `code` 回表查询，导致 `id` 和 `code` 匹配落空，直接原样输出了英文代号。

### 1.3 统一映射基准（标准约束）
- **废弃以 UUID 作为跨端和多表关联业务主键的弱匹配机制。**
- **统一标识符（Role_Key）：**
  前后端统一采用 `role.code` 作为全局唯一的业务标识键！所有返回角色列表的开放 API 必须包含 `code` 属性。
- **渲染基准：**
  前端所有涉及角色转换的列表或控件，都必须使用 `rolesList.find(r => r.code === roleCode)` 来映射获取其 `.name` 属性，以确保渲染出连贯一致的用户界面语义。

---

## 2. 角色定义表 (Role Register)

此表规定了本系统目前开放的四种核心身份。后续如果新增自定义角色，在 DB 中需自动为其生成符合 `snake_case` 或自定义生成的 Key。

| 角色中文名称 (UI) | 角色唯一标识 (Role_Key) | 性质   | 相关范围及说明                                                       |
| :---------------- | :---------------------- | :----- | :------------------------------------------------------------------- |
| **超级管理员**    | `admin`                 | System | 拥有平台所有权限 `["*"]`，作为根账户不受任何禁用/限制。              |
| **销售经理**      | `sales_manager`         | Common | 通常作为 `SALES` 部门负责人，可看部下数据、拥有分析及分配权限。      |
| **财务主管**      | `finance`               | Common | 拥有订单财务审核、退款控制及售后等高度敏感财务审核权。               |
| **销售专员**      | `sales`                 | Common | 仅限查看自身录入的客户、创建基础订单。                               |

---

## 3. 功能模块结构树 (Module Mapping Tree)

基于最新版本的通用工作平台导航侧边栏（`main-layout.tsx`），对每个权限点功能进行了全域扫描对照。

> **⚠️ 更新标记：**
> *带有 `【新增/变动】` 标签的项目为根据最新版由于去除了冗余旧选项、合并新系统（如修改订单/大屏模块）所重新生成的路由锚点。以往不在下表的旧权限如 `customer:pool`、`warehouse:adjustment` 现已废弃。*

| 一级导航模块 (Module) | 页面节点 (Page) / 按钮权 (Action) | 权限定义 Key (Permission_Key) | 前端组件 / 路由                          | 后端 API 接口守卫                        | 备注标记                     |
| :-------------------- | :---------------------------------- | :---------------------------- | :--------------------------------------- | :--------------------------------------- | :--------------------------- |
| **路远商城**          | 客户列表                            | `customer:list`               | `/mall/customer/list`                    | `/api/v1/customers`                      | 【变动】去除子项整合         |
|                       | 创建订单                            | `order:create`                | `/mall/order/create`                     | `/api/v1/orders/create`                  |                              |
|                       | 审核订单                            | `finance:audit`               | `/mall/order/audit`                      | `/api/v1/orders/audit`                   | 关联 Finance                 |
|                       | 待发货订单                          | `order:pending`               | `/mall/order/pending`                    | `/api/v1/orders/pending`                 | 【新增/变动】                |
|                       | 已发货订单                          | `order:shipped`               | `/mall/order/shipped`                    | `/api/v1/orders/shipped`                 | 【新增/变动】                |
|                       | 售后订单                            | `finance:aftersale`           | `/mall/order/aftersale`                  | `/api/v1/after_sales`                    | 仅 Finance 关联              |
|                       | 修改订单                            | `order:modify`                | `/mall/order/modify`                     | `/api/v1/orders/{id}`                    | 【新增】重构拆分             |
|                       | 已签收订单                          | `order:signed`                | `/mall/order/signed`                     | `/api/v1/orders/signed`                  | 【新增】重构拆分             |
| **综合办公**          | 数据分析                            | `office:analytics`            | `/analytics`                             | `/api/v1/analytics`                      |                              |
|                       | 路远日报                            | `office:report`               | `/report`                                | `/api/v1/reports`                        |                              |
| **全局独立控件**      | 大屏系统 (顶部 Header 下拉卡片)     | `office:dashboard`            | `Popover` 组合大屏路由聚合               | `/api/v1/tasks`, `/notifications` 等     | 【变动】已从侧边导航栏独立脱离           |
|                       | 即时通讯 (右下角全局悬浮气泡)       | `office:chat`                 | `<FloatingChat />` 悬浮组件              | 暂无特定防线（WebSocket 预留）           | 【变动】全局常驻的高级部件               |
|                       | 消息提醒框 (全局消息推送弹窗)       | `N/A` (非显式权限菜单)        | `<NotificationReminder />` 提醒组件      | 依赖 `/api/v1/notifications` 产生事件    | 【新增】除 `admin` 角色外默认启用        |
| **仓储物流**          | 商品管理                            | `warehouse:product`           | `/mall/warehouse/product`                | `/api/v1/products`                       |                              |
|                       | 产品库存                            | `warehouse:stock`             | `/mall/warehouse/stock`                  | `/api/v1/warehouses/stock`               | 【变动】更名                 |
|                       | 退货入库                            | `warehouse:return`            | `/mall/warehouse/return-stock`           | `/api/v1/warehouses/return`              |                              |
|                       | 出入库记录                          | `warehouse:records`           | `/mall/warehouse/stock-records`          | `/api/v1/warehouses/records`             |                              |
| **运营管理**          | 类型管理                            | `operation:channel`           | `/operations/channel`                    | N/A (依赖静态)                           |                              |
|                       | 日志列表                            | `operation:logs`              | `/operations/log-list`                   | `/api/v1/audit_logs`                     |                              |
| **高级设置**          | 后台设置                            | `settings:backend`            | `/settings`                              | `/api/v1/admin/...`                      | 【变动】层级提权             |
|                       | 系统设置                            | `settings:system`             | `/system-settings`                       | `/api/v1/admin/...`                      | 【变动】层级合并             |

---

## 4. 角色特殊配置项 (Role Configurations)

除了标准的 RBAC 模块（页面与动作操作）控制外，针对安全管理与自动化响应，角色实体还附加了独立的安全和通知开关。这些配置不属于常规路由受控点，而是针对风控策略定义，并在表单中绑定为 `alertConfig` 属性对象：

| 配置大类     | 功能开关名称                   | 前端绑定字段 (Form Name)                           | 业务功能描述与边界                                                                                                   |
| :----------- | :----------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **预警配置** | 登录预警：接收异常预警         | `['alertConfig', 'login', 'receive']`              | 决定角色是否能够接收到组织内其他成员异地、跳板机高频登录的风控告警推送。                                           |
|              | 登录预警：作为监测对象         | `['alertConfig', 'login', 'isTarget']`             | 决定该角色包含的员工，在发生登录行为时，是否纳入系统异常监测的安全雷达视线。                                       |
|              | 通讯预警：接收敏感词预警       | `['alertConfig', 'im', 'receive']`                 | 系统内部 IM 即时通讯中若发生违反业务规则（如飞单、红包等高危动作）的敏感词时，是否收到事件报告。                   |
|              | 通讯预警：作为敏感词监测对象   | `['alertConfig', 'im', 'isTarget']`                | 控制此角色的员工在 IM 内部交流时，其收发的信息流是否受底层敏感词库模块的严格扫描并在后台提示，不进行拦截          |
| **高级配置** | 访问限制：开启 IP 白名单验证   | `['alertConfig', 'security', 'enableIPWhitelist']` | 一旦开启，该角色归属的员工仅容许在当前系统维护的 **“IP 白名单池”**（CIDR 地址范围）内访问后端系统，杜绝网段外非法截断及漫游登录。 |

> **⚠️ 特殊保护与防呆机制：**
> 出于风控安全托底，对于系统的 `admin` 超级管理员，由于其本身即为系统最高掌控者，**将其作为“监测对象”没有任何实际业务意义且逻辑相逆**；因此，针对超级管理员的所有 “作为（行为/通讯）监测对象” 以及 “访问限制” 等约束类开关均已被 UI 强力锁死限制（`disabled`）并处于排除状态。而涉及安全感知的 “接收异常预警” 等订阅类开关则被隐形强制激活，这确保了恶意用户无法通过修改高管权限来暗中实施静默隐匿。

---

## 5. 技术实施规范：如何扩展新权限？

若业务进一步迭代需扩充新的菜单项，必须严格按照以下步骤，以维持前后端与数据库配置的高度一致性：

1. **后端数据库映射 `backend/app/db/seed.py`：** 
   - 找出最新的 `PERMISSIONS` 元组集合，根据其归属的一级模块（如属于商城就是 `order:` 作为前缀命名），插入新的 `Key:描述` 记录。
   - 在其下方的 `ROLE_PERMISSIONS` 预设集合中，选择允许初始化获得此权限的角色插入。
   - 运行 `python -m app.db.seed`。
2. **后端接口 API 防护 `@router`：**
   - 所有的对应的端点必须在依赖注入中声明守卫 `_: Annotated[User, Depends(require_permission("module:page:new_action"))]` 实施鉴权阻拦。
3. **前端权限树定义 `frontend/src/pages/settings/index.tsx`：**
   - 在页面上方的 `ALL_PERMISSIONS` 配置树中，找到对应的 module 节点，新增其 `children` 选框值（此处的 key 必须与后端完全精准对应，区分大小写）。这步操作会立马使得系统管理员在此界面的复选框呈现出控制权。
4. **前端导航鉴权 `frontend/src/components/layout/main-layout.tsx`：**
   - 添加包含鉴权的菜单渲染条项： `...(hasPermission('module:page:new_action') ? [{ key: '/路由', label: '新增页面' }] : []),`
