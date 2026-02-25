"""
数据库初始化种子脚本
- 创建系统默认角色、权限和管理员账号
- 自动补齐数据库表缺失列 (类似简化 migration)
- 插入完整演示数据，覆盖前端所有页面
admin 系统固定角色 + 默认初始角色
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.models.user import User, Role, Permission
from app.core.security import hash_password
from sqlalchemy import select, text


# ============================================================
# 1. 权限清单 — 对齐前端 ALL_PERMISSIONS 结构
# ============================================================
PERMISSIONS = [
    # 路远商城 (mall)
    ("customer:list", "客户列表"),
    ("order:create", "创建订单"),
    ("finance:audit", "审核订单"),
    ("order:pending", "待发货订单"),
    ("order:shipped", "已发货订单"),
    ("finance:aftersale", "售后订单"),
    ("order:modify", "修改订单"),
    ("order:signed", "已签收订单"),
    # 综合办公 (office)
    ("office:analytics", "数据分析"),
    ("office:report", "路远日报"),
    # 全局独立控件 (global)
    ("office:dashboard", "大屏系统"),
    ("office:chat", "即时通讯"),
    # 仓储物流 (warehouse)
    ("warehouse:product", "商品管理"),
    ("warehouse:stock", "产品库存"),
    ("warehouse:return", "退货入库"),
    ("warehouse:records", "出入库记录"),
    # 运营管理 (operation)
    ("operation:channel", "类型管理"),
    ("operation:logs", "日志列表"),
    # 高级设置 (settings)
    ("settings:backend", "后台设置"),
    ("settings:system", "系统设置"),
]

# 默认角色和权限映射 (与前端保持一致)
ROLE_PERMISSIONS = {
    "admin": "*",  # 拥有所有权限
    "finance": [
        "finance:audit", "order:shipped", "finance:aftersale", "order:signed",
        "office:analytics", "office:dashboard", "office:chat", "warehouse:records"
    ],
    "sales_manager": [
        "customer:list", "order:create", "order:pending", "order:shipped", "order:modify", "order:signed",
        "office:analytics", "office:dashboard", "office:chat", "office:report",
        "warehouse:product", "warehouse:stock"
    ],
    "sales": [
        "customer:list", "order:create", "order:modify", "order:signed",
        "office:chat", "office:report", "warehouse:product"
    ],
}


# ============================================================
# 2. 数据库列补齐 (简化 migration)
# ============================================================
ENSURE_COLUMNS = {
    "users": [
        ("plain_password", "VARCHAR(100)"),
        ("last_active_time", "VARCHAR(30)"),
        ("is_active", "BOOLEAN DEFAULT TRUE"),
    ],
    "customers": [
        ("customer_type", "VARCHAR(20) DEFAULT 'new'"),
        ("entry_date", "VARCHAR(20)"),
    ],
    "orders": [
        ("actual_price", "FLOAT"),
        ("apply_reason", "TEXT"),
        ("shipped_at", "TIMESTAMP"),
        ("signed_at", "TIMESTAMP"),
        ("tracking_no", "VARCHAR(50)"),
        ("courier_company", "VARCHAR(50)"),
    ],
    "products": [
        ("department", "VARCHAR(50)"),
        ("sort", "INTEGER DEFAULT 0"),
    ],
    "im_messages": [
        ("conversation_id", "VARCHAR(36)"),
        ("sender_name", "VARCHAR(50)"),
        ("sender_ext", "VARCHAR(50)"),
        ("sender_dept", "VARCHAR(50)"),
        ("sender_avatar", "VARCHAR(500)"),
        ("direction", "VARCHAR(10) DEFAULT 'sent'"),
        ("file_name", "VARCHAR(255)"),
        ("file_size", "VARCHAR(50)"),
        ("display_time", "VARCHAR(50)"),
    ],
    "im_conversations": [
        ("created_by", "VARCHAR(36)"),
    ],
}


async def ensure_columns():
    """检查并添加数据库中缺失的列"""
    async with engine.begin() as conn:
        for table, columns in ENSURE_COLUMNS.items():
            for col_name, col_type in columns:
                try:
                    await conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                    ))
                except Exception:
                    pass  # 列已存在或其他非致命错误
    print("  ✓ 数据库列同步完成")


# ============================================================
# 3. 主种子函数
# ============================================================
async def seed():
    """初始化种子数据"""
    import app.models  # noqa: 确保所有模型已注册

    # 先建表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 补齐缺失列
    await ensure_columns()

    async with AsyncSessionLocal() as db:
        # ============================================================
        # 3.1 创建权限
        # ============================================================
        perm_map: dict[str, Permission] = {}
        for code, name in PERMISSIONS:
            result = await db.execute(select(Permission).where(Permission.code == code))
            existing = result.scalar_one_or_none()
            if not existing:
                perm = Permission(code=code, name=name)
                db.add(perm)
                perm_map[code] = perm
            else:
                perm_map[code] = existing

        await db.flush()

        # ============================================================
        # 3.2 创建角色并分配权限
        # ============================================================
        roles_config = [
            ("admin", "超级管理员", True),
            ("sales_manager", "销售经理", False),
            ("sales", "销售专员", False),
            ("finance", "财务主管", False),
        ]

        role_map: dict[str, Role] = {}
        for code, name, is_system in roles_config:
            result = await db.execute(select(Role).where(Role.code == code))
            existing = result.scalar_one_or_none()
            if not existing:
                role = Role(code=code, name=name, is_system=is_system)
                db.add(role)
                role_map[code] = role
            else:
                role = existing
                role.name = name
                role_map[code] = existing

            # 强制更新分配权限
            perm_codes = ROLE_PERMISSIONS.get(code, [])
            if perm_codes == "*":
                role.permissions = list(perm_map.values())
            else:
                role.permissions = [perm_map[pc] for pc in perm_codes if pc in perm_map]

        await db.flush()

        # ============================================================
        # 3.3 创建演示员工 — 对齐前端 MOCK_EMPLOYEES
        # ============================================================
        demo_users = [
            # (username, password, name, emp_no, role_code, department, phone, email, avatar, last_active, reg_date)
            ("admin", "admin123", "系统管理员", "EMP0001", "admin", "技术部", "13800000001", "admin@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=Toby", "2026-02-23 22:30", "2026-02-18"),
            ("finance", "finance123", "王财务", "FIN001", "finance", "财务部", "13800000002", "finance@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=George", "2026-02-23 18:15", "2026-02-23"),
            ("manager", "manager123", "李经理", "MGR001", "sales_manager", "销售部", "13800000003", "manager@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha", "2026-02-23 20:45", "2026-02-23"),
            ("sales", "sales123", "张销售", "SALES001", "sales", "销售部", "13800000004", "sales@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", "2026-02-23 17:30", "2026-02-23"),
            ("lisi", "123456", "李四", "EMP1002", "sales", "销售部", "13800001002", "lisi@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", "2026-02-22 14:00", "2026-02-23"),
            ("wangwu", "123456", "王五", "EMP1003", "sales_manager", "销售部", "13800001003", "wangwu@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=Abby", "2026-02-23 09:10", "2026-02-23"),
            ("zhaoliu", "123456", "赵六", "EMP1004", "finance", "财务部", "13812345678", "zhaoliu@company.com", "https://api.dicebear.com/7.x/avataaars/svg?seed=Buster", "2026-02-21 11:45", "2026-02-23"),
        ]
        user_map: dict[str, User] = {}
        for username, password, name, emp_no, role_code, dept, phone, email, avatar, last_active, reg_date in demo_users:
            result = await db.execute(select(User).where(User.username == username))
            existing = result.scalar_one_or_none()
            if not existing:
                created = datetime.strptime(reg_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                user = User(
                    name=name,
                    username=username,
                    hashed_password=hash_password(password),
                    plain_password=password,
                    employee_no=emp_no,
                    role_id=role_map[role_code].id,
                    department=dept,
                    phone=phone,
                    email=email,
                    avatar=avatar,
                    last_active_time=last_active,
                    created_at=created,
                )
                db.add(user)
                await db.flush()
                user_map[username] = user
            else:
                # 更新已有用户的部门、联系方式、头像、密码、在线时间（如果为空）
                if not existing.department:
                    existing.department = dept
                if not existing.phone:
                    existing.phone = phone
                if not existing.email:
                    existing.email = email
                if not existing.avatar:
                    existing.avatar = avatar
                if not existing.plain_password:
                    existing.plain_password = password
                if not existing.last_active_time:
                    existing.last_active_time = last_active
                user_map[username] = existing

        await db.flush()
        print("  ✓ 用户/角色/权限 初始化完成")

        # ============================================================
        # 3.4 字典数据 (进线渠道/客户类型/订单类型/支付方式/责任类型)
        # ============================================================
        from app.models.dictionary import Dictionary
        dict_check = await db.execute(select(Dictionary).limit(1))
        if not dict_check.scalar_one_or_none():
            dicts = [
                # 渠道
                ("channel", "douyin", "抖音", "#FF0050", 1),
                ("channel", "wechat", "微信", "#07C160", 2),
                ("channel", "taobao", "淘宝", "#FF6A00", 3),
                ("channel", "jd", "京东", "#E42120", 4),
                ("channel", "offline", "线下", "#1890FF", 5),
                ("channel", "referral", "转介绍", "#722ED1", 6),
                # 客户类型
                ("customerType", "new", "新客户", "#1890FF", 1),
                ("customerType", "old", "老客户", "#52C41A", 2),
                ("customerType", "vip", "VIP", "#FA8C16", 3),
                ("customerType", "repurchase", "复购客户", "#722ED1", 4),
                # 订单类型
                ("orderType", "normal", "普通订单", "#1890FF", 1),
                ("orderType", "group", "团购订单", "#52C41A", 2),
                ("orderType", "wholesale", "批发订单", "#FA8C16", 3),
                # 支付方式
                ("paymentMethod", "wechat_pay", "微信支付", "#07C160", 1),
                ("paymentMethod", "alipay", "支付宝", "#1677FF", 2),
                ("paymentMethod", "bank", "银行转账", "#FA8C16", 3),
                ("paymentMethod", "cod", "货到付款", "#FF4D4F", 4),
                ("paymentMethod", "cash", "现金", "#52C41A", 5),
                # 责任类型
                ("responsibilityType", "quality", "质量问题", "#FF4D4F", 1),
                ("responsibilityType", "logistics", "物流问题", "#FA8C16", 2),
                ("responsibilityType", "service", "服务问题", "#1890FF", 3),
            ]
            for group, code, name, color, sort in dicts:
                db.add(Dictionary(group=group, code=code, name=name, color=color, sort=sort, enabled=True))
            await db.flush()
            print("  ✓ 字典数据 初始化完成")

        # ============================================================
        # 3.5 演示客户
        # ============================================================
        from app.models.customer import Customer
        cust_check = await db.execute(select(Customer).limit(1))
        if not cust_check.scalar_one_or_none():
            sales_user = user_map.get("sales") or user_map.get("admin")
            manager_user = user_map.get("manager") or user_map.get("admin")
            customers_data = [
                ("王小明", "13911001001", "北京市朝阳区xx路12号", 175.5, 28, 70.0, "douyin", "new", "2026-01-15", sales_user.id),
                ("李小红", "13922002002", "上海市浦东新区xx街88号", 162.0, 25, 52.0, "wechat", "vip", "2026-01-10", sales_user.id),
                ("赵小刚", "13933003003", "广州市天河区xx大厦", 180.0, 32, 85.0, "taobao", "old", "2026-01-05", manager_user.id),
                ("孙小芳", "13944004004", "深圳市南山区科技园", 168.0, 27, 58.0, "jd", "new", "2026-01-20", sales_user.id),
                ("周小伟", "13955005005", "成都市武侯区xx号", 172.0, 30, 75.0, "offline", "repurchase", "2026-02-01", manager_user.id),
                ("吴小丽", "13966006006", "杭州市西湖区xx路", 165.0, 24, 50.0, "referral", "new", "2026-02-05", sales_user.id),
                ("陈小强", "13977007007", "南京市鼓楼区xx街", 178.0, 35, 80.0, "douyin", "vip", "2025-12-01", manager_user.id),
                ("刘小燕", "13988008008", "武汉市洪山区xx路", 160.0, 29, 55.0, "wechat", "old", "2025-11-15", sales_user.id),
            ]
            customer_objs = []
            for name, phone, address, height, age, weight, channel, ctype, entry, owner in customers_data:
                c = Customer(
                    name=name, phone=phone, address=address, height=height,
                    age=age, weight=weight, channel=channel, customer_type=ctype,
                    entry_date=entry, owner_id=owner,
                )
                db.add(c)
                customer_objs.append(c)
            await db.flush()
            print("  ✓ 演示客户 初始化完成")
        else:
            result = await db.execute(select(Customer).limit(10))
            customer_objs = list(result.scalars().all())

        # ============================================================
        # 3.6 演示商品
        # ============================================================
        from app.models.product import Product
        prod_check = await db.execute(select(Product).limit(1))
        if not prod_check.scalar_one_or_none():
            products_data = [
                ("路远益生菌·肠道养护型", "30袋/盒", 298.0, 89.0, "on", 500, "销售部", 1),
                ("路远益生菌·免疫增强型", "30袋/盒", 358.0, 105.0, "on", 350, "销售部", 2),
                ("路远益生菌·女性呵护型", "20袋/盒", 268.0, 75.0, "on", 420, "销售部", 3),
                ("路远益生菌·儿童成长型", "20袋/盒", 238.0, 68.0, "on", 280, "销售部", 4),
                ("路远益生菌·老年关爱型", "30袋/盒", 328.0, 95.0, "on", 200, "销售部", 5),
                ("路远胶原蛋白肽饮·美肌型", "10瓶/盒", 498.0, 135.0, "on", 150, "销售部", 6),
                ("路远多维营养粉", "15袋/盒", 168.0, 48.0, "on", 600, "销售部", 7),
                ("路远深海鱼油·高纯度", "60粒/瓶", 398.0, 110.0, "off", 80, "销售部", 8),
            ]
            product_objs = []
            for name, spec, price, cost, status, stock, dept, sort in products_data:
                p = Product(
                    name=name, spec=spec, price=price, cost=cost,
                    status=status, stock=stock, department=dept, sort=sort,
                )
                db.add(p)
                product_objs.append(p)
            await db.flush()
            print("  ✓ 演示商品 初始化完成")
        else:
            result = await db.execute(select(Product).limit(10))
            product_objs = list(result.scalars().all())

        # ============================================================
        # 3.7 仓库 & 库存
        # ============================================================
        from app.models.warehouse import Warehouse
        from app.models.stock import Stock
        wh_check = await db.execute(select(Warehouse).limit(1))
        if not wh_check.scalar_one_or_none():
            wh_data = [
                ("总部仓库", "成都市武侯区xx物流园", True),
                ("华东分仓", "上海市嘉定区xx仓储中心", False),
                ("华南分仓", "广州市白云区xx物流城", False),
            ]
            wh_objs = []
            for name, addr, default in wh_data:
                wh = Warehouse(name=name, address=addr, is_default=default)
                db.add(wh)
                wh_objs.append(wh)
            await db.flush()

            # 为每个商品在主仓库设置库存
            for p in product_objs:
                s = Stock(
                    product_id=p.id,
                    warehouse_id=wh_objs[0].id,
                    current=p.stock or 100,
                    available=p.stock or 100,
                    warning_value=50,
                )
                db.add(s)
                # 华东分仓也放一些
                s2 = Stock(
                    product_id=p.id,
                    warehouse_id=wh_objs[1].id,
                    current=max(50, (p.stock or 100) // 3),
                    available=max(50, (p.stock or 100) // 3),
                    warning_value=30,
                )
                db.add(s2)
            await db.flush()
            print("  ✓ 仓库 & 库存 初始化完成")

        # ============================================================
        # 3.8 演示订单
        # ============================================================
        from app.models.order import Order, OrderItem
        ord_check = await db.execute(select(Order).limit(1))
        if not ord_check.scalar_one_or_none() and customer_objs and product_objs:
            sales_user = user_map.get("sales") or user_map.get("admin")
            manager_user = user_map.get("manager") or user_map.get("admin")
            now = datetime.now(timezone.utc)
            now_naive = datetime.utcnow()  # naive datetime，用于 shipped_at/signed_at 字段

            orders_data = [
                # (客户idx, 商品idx, 数量, 状态, 支付方式, 天数前, 创建人)
                (0, 0, 2, "signed", "wechat_pay", 15, sales_user),
                (1, 1, 1, "signed", "alipay", 12, sales_user),
                (2, 2, 3, "shipped", "bank", 8, manager_user),
                (3, 0, 1, "approved", "wechat_pay", 5, sales_user),
                (4, 3, 2, "pending", "cod", 3, manager_user),
                (0, 4, 1, "manager_pending", "alipay", 2, sales_user),
                (5, 5, 1, "finance_pending", "wechat_pay", 1, sales_user),
                (6, 0, 4, "signed", "bank", 20, manager_user),
                (7, 1, 2, "shipped", "cash", 10, sales_user),
                (1, 6, 5, "signed", "wechat_pay", 25, manager_user),
                (2, 2, 1, "approved", "alipay", 4, sales_user),
                (3, 3, 3, "pending", "cod", 2, manager_user),
                # 更多审核订单
                (1, 0, 3, "manager_pending", "wechat_pay", 1, sales_user),
                (4, 2, 2, "manager_pending", "alipay", 1, sales_user),
                (6, 3, 1, "finance_pending", "bank", 1, sales_user),
                (7, 4, 2, "finance_pending", "wechat_pay", 1, sales_user),
                (5, 1, 1, "manager_rejected", "cash", 3, sales_user),
                (0, 6, 2, "finance_rejected", "alipay", 2, sales_user),
                (2, 5, 1, "voided", "wechat_pay", 4, sales_user),
            ]

            # 差异化审核申请原因
            audit_reasons = {
                "manager_pending": [
                    "长期老客户，申请8折优惠以促成再次成交",
                    "客户批量采购3件以上，申请团购价格优惠",
                    "竞品压价严重，客户预算有限，申请特殊折扣",
                ],
                "finance_pending": [
                    "经理已放行，客户为VIP会员享受专属折扣",
                    "捆绑销售优惠申请，搭配购买额外减免",
                    "活动促销价格，已获经理批准",
                ],
                "manager_rejected": ["新客户首单折扣申请，折扣幅度过大被驳回"],
                "finance_rejected": ["折扣超出财务审批权限，需重新调整价格"],
                "voided": ["客户主动取消订单，申请作废处理"],
            }
            audit_reason_idx: dict[str, int] = {}

            for ci, pi, qty, status, pay, days_ago, creator in orders_data:
                if ci >= len(customer_objs) or pi >= len(product_objs):
                    continue
                cust = customer_objs[ci]
                prod = product_objs[pi]
                subtotal = prod.price * qty
                order_no = f"NS{(now - timedelta(days=days_ago)).strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"

                # 对于需要审核的订单，设置价格折扣和申请原因
                if status in ("manager_pending", "finance_pending", "manager_rejected", "finance_rejected", "voided"):
                    discount = 0.80 + (ci % 3) * 0.05  # 80%~90% 折扣
                    actual_price = round(subtotal * discount, 2)
                    reasons = audit_reasons.get(status, ["客户优惠申请"])
                    idx = audit_reason_idx.get(status, 0)
                    apply_reason = reasons[idx % len(reasons)]
                    audit_reason_idx[status] = idx + 1
                else:
                    actual_price = None
                    apply_reason = None

                # shipped_at/signed_at 是 DateTime (不带timezone)，用 naive datetime
                shipped_at = (now_naive - timedelta(days=days_ago - 1)) if status in ("shipped", "signed") else None
                signed_at = (now_naive - timedelta(days=max(0, days_ago - 3))) if status == "signed" else None

                order = Order(
                    order_no=order_no,
                    customer_id=cust.id,
                    customer_name=cust.name,
                    order_type="normal",
                    payment_method=pay,
                    ship_now=status in ("shipped", "signed"),
                    total_amount=subtotal,
                    paid_amount=subtotal if status in ("signed", "shipped", "approved") else 0,
                    cod_amount=subtotal if pay == "cod" else 0,
                    paid_ratio=1.0 if status in ("signed", "shipped", "approved") else 0,
                    remark=f"演示订单 - {cust.name}",
                    commission=subtotal * 0.05,
                    actual_price=actual_price,
                    apply_reason=apply_reason,
                    shipped_at=shipped_at,
                    signed_at=signed_at,
                    tracking_no=f"SF{uuid.uuid4().hex[:12].upper()}" if shipped_at else None,
                    courier_company="顺丰速运" if shipped_at else None,
                    status=status,
                    created_by=creator.id,
                    created_at=now - timedelta(days=days_ago),
                )
                db.add(order)
                await db.flush()

                # 订单明细行
                db.add(OrderItem(
                    order_id=order.id,
                    product_id=prod.id,
                    product_name=prod.name,
                    spec=prod.spec,
                    price=prod.price,
                    quantity=qty,
                    subtotal=subtotal,
                ))

            await db.flush()
            print("  ✓ 演示订单 初始化完成")

        # ============================================================
        # 3.9 售后单
        # ============================================================
        from app.models.after_sale import AfterSale
        as_check = await db.execute(select(AfterSale).limit(1))
        if not as_check.scalar_one_or_none() and customer_objs:
            # 取已签收订单
            signed_orders = await db.execute(
                select(Order).where(Order.status == "signed").limit(3)
            )
            signed_list = list(signed_orders.scalars().all())
            for i, order in enumerate(signed_list[:2]):
                db.add(AfterSale(
                    order_id=order.id,
                    order_no=order.order_no,
                    customer_id=order.customer_id,
                    customer_name=order.customer_name,
                    type="return" if i == 0 else "refund",
                    reason="收到商品与描述不符" if i == 0 else "不需要了，申请退款",
                    images=[],
                    status="pending",
                ))
            await db.flush()
            print("  ✓ 售后单 初始化完成")

        # ============================================================
        # 3.10 部门 / 物流公司 / 敏感词 (admin 模块)
        # ============================================================
        from app.models.admin_model import Department, LogisticsCompany, SensitiveWord

        dept_check = await db.execute(select(Department).limit(1))
        if not dept_check.scalar_one_or_none():
            depts = [
                ("TECH", "技术部", "系统管理员", 3),
                ("SALES", "销售部", "李经理", 25),
                ("FIN", "财务部", "王财务", 5),
                ("OPS", "运营部", None, 8),
                ("HR", "人事部", None, 3),
            ]
            for code, name, mgr, count in depts:
                db.add(Department(
                    code=code, name=name, manager=mgr, member_count=count,
                    show_in_performance_v1=code == "SALES",
                    show_in_performance_v2=code in ("SALES", "OPS"),
                    show_in_ranking=code == "SALES",
                    show_in_analytics=code in ("SALES", "OPS"),
                ))
            await db.flush()
            print("  ✓ 部门 初始化完成")

        logi_check = await db.execute(select(LogisticsCompany).limit(1))
        if not logi_check.scalar_one_or_none():
            logistics = [
                ("顺丰速运", "SF", True),
                ("京东物流", "JD", False),
                ("中国邮政", "EMS", False),
                ("圆通速递", "YTO", False),
                ("中通快递", "ZTO", False),
                ("申通快递", "STO", False),
                ("韵达快递", "YUNDA", False),
                ("极兔速递", "JT", False),
                ("德邦快递", "DEPPON", False),
            ]
            for name, code, status in logistics:
                db.add(LogisticsCompany(name=name, code=code, status=status))
            await db.flush()
            print("  ✓ 物流公司 初始化完成")

        sw_check = await db.execute(select(SensitiveWord).limit(1))
        if not sw_check.scalar_one_or_none():
            words = [
                ("加微信", "防私单", "high"),
                ("转账", "严禁词", "critical"),
                ("淘宝", "广告词", "medium"),
                ("投诉", "服务质量", "low"),
                ("退款", "敏感操作", "medium"),
            ]
            for word, wtype, level in words:
                db.add(SensitiveWord(word=word, type=wtype, level=level))
            await db.flush()
            print("  ✓ 敏感词 初始化完成")

        # ============================================================
        # 3.11 业绩目标
        # ============================================================
        from app.models.sales_target import SalesTarget
        st_check = await db.execute(select(SalesTarget).limit(1))
        if not st_check.scalar_one_or_none():
            for uname in ["sales", "manager", "zhaoliu"]:
                user = user_map.get(uname)
                if user:
                    db.add(SalesTarget(
                        user_id=user.id, year=2026, month=1, quarter=1,
                        amount=50000.0, type="month",
                    ))
                    db.add(SalesTarget(
                        user_id=user.id, year=2026, month=2, quarter=1,
                        amount=60000.0, type="month",
                    ))
            await db.flush()
            print("  ✓ 业绩目标 初始化完成")

        # ============================================================
        # 3.12 商机
        # ============================================================
        from app.models.opportunity import Opportunity
        opp_check = await db.execute(select(Opportunity).limit(1))
        if not opp_check.scalar_one_or_none():
            sales_user = user_map.get("sales") or user_map.get("admin")
            opps = [
                ("赵小刚", "抖音", "高", 3000.0, "following"),
                ("孙小芳", "微信", "中", 1500.0, "new"),
                ("张先生", "淘宝", "低", 800.0, "new"),
                ("林女士", "线下", "高", 5000.0, "following"),
            ]
            for cname, source, intention, amount, status in opps:
                db.add(Opportunity(
                    customer_name=cname, source=source, intention=intention,
                    estimated_amount=amount, status=status,
                    owner_id=sales_user.id,
                ))
            await db.flush()
            print("  ✓ 商机 初始化完成")

        # ============================================================
        # 3.13 待办任务
        # ============================================================
        from app.models.task import Task
        task_check = await db.execute(select(Task).limit(1))
        if not task_check.scalar_one_or_none():
            sales_user = user_map.get("sales") or user_map.get("admin")
            tasks = [
                ("回访", "客户王小明需要回访确认使用效果", "2026-02-28"),
                ("跟进", "客户李小红意向升单至VIP套餐", "2026-03-01"),
                ("提醒", "赵小刚两周内到期需续费", "2026-03-05"),
            ]
            for ttype, content, deadline in tasks:
                db.add(Task(
                    user_id=sales_user.id, type=ttype, content=content,
                    deadline=deadline, status="pending",
                ))
            await db.flush()
            print("  ✓ 待办任务 初始化完成")

        # ============================================================
        # 3.14 操作日志
        # ============================================================
        from app.models.audit_log import AuditLog
        log_check = await db.execute(select(AuditLog).limit(1))
        if not log_check.scalar_one_or_none():
            admin_user = user_map.get("admin")
            if admin_user:
                log_entries = [
                    ("登录系统", "用户 admin", "用户操作"),
                    ("创建商品", "路远益生菌·肠道养护型", "商品操作"),
                    ("创建订单", "NS20260208143025ABCD", "订单操作"),
                    ("修改客户", "客户 王小明", "客户操作"),
                    ("审批订单", "NS20260215093012EFGH", "审批操作"),
                ]
                for action, target, ltype in log_entries:
                    db.add(AuditLog(
                        user_id=admin_user.id, action=action,
                        target=target, type=ltype,
                    ))
                await db.flush()
                print("  ✓ 操作日志 初始化完成")

        # ============================================================
        # 3.15 IM 会话 & 消息 — 关联真实用户 ID
        # ============================================================
        from app.models.im_conversation import IMConversation
        from app.models.im_message import IMMessage
        conv_check = await db.execute(select(IMConversation).limit(1))
        if not conv_check.scalar_one_or_none():
            # 获取真实用户引用
            admin_user = user_map.get("admin")
            sales_user = user_map.get("sales")  # 张销售
            lisi_user = user_map.get("lisi")    # 李四
            wangwu_user = user_map.get("wangwu")  # 王五
            zhaoliu_user = user_map.get("zhaoliu")  # 赵六
            manager_user = user_map.get("manager")  # 李经理
            finance_user = user_map.get("finance")  # 王财务

            # 所有用户 ID 列表 (用于全员大群)
            all_user_ids = [u.id for u in user_map.values()]

            # 固定 conversation ID 避免 message 关联时出错
            conv_c001_id = str(uuid.uuid4())  # admin <-> 李四 私聊
            conv_c002_id = str(uuid.uuid4())  # admin <-> 王五 私聊
            conv_g001_id = str(uuid.uuid4())  # 销售部工作群
            conv_g002_id = str(uuid.uuid4())  # 项目讨论组
            conv_g_all_id = str(uuid.uuid4())  # 全员大群

            # 群组成员使用真实用户 ID
            sales_group_members = [u.id for u in [admin_user, sales_user, lisi_user, wangwu_user, manager_user] if u]
            project_group_members = [u.id for u in [admin_user, sales_user, zhaoliu_user, finance_user] if u]

            conversations_data = [
                {
                    "id": conv_c001_id, "name": "李四", "type": "single",
                    "avatar": lisi_user.avatar if lisi_user else None,
                    "avatar_label": "李", "avatar_color": "#f59e0b",
                    "last_message": "好的，收到！周三开会时我们会详细汇报。",
                    "last_time": "10:30",
                    "department": "销售部", "employee_id": lisi_user.employee_no if lisi_user else "EMP1002",
                    "peer_user_id": lisi_user.id if lisi_user else None,
                    "created_by": admin_user.id if admin_user else None,
                },
                {
                    "id": conv_g001_id, "name": "销售部工作群", "type": "group",
                    "avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=sales",
                    "avatar_label": "销", "avatar_color": "#6366f1",
                    "last_message": "王五: 好的，我会带上上周的报表。",
                    "last_time": "09:10",
                    "member_ids": sales_group_members,
                    "created_by": admin_user.id if admin_user else None,
                },
                {
                    "id": conv_c002_id, "name": "王五", "type": "single",
                    "avatar": wangwu_user.avatar if wangwu_user else None,
                    "avatar_label": "王", "avatar_color": "#10b981",
                    "last_message": "多谢，看到了。",
                    "last_time": "昨天",
                    "department": "销售部", "employee_id": wangwu_user.employee_no if wangwu_user else "EMP1003",
                    "peer_user_id": wangwu_user.id if wangwu_user else None,
                    "created_by": admin_user.id if admin_user else None,
                },
                {
                    "id": conv_g002_id, "name": "项目讨论组", "type": "group",
                    "avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=project",
                    "avatar_label": "项", "avatar_color": "#ec4899",
                    "last_message": "张销售: 正在看，配色还可以再调整下。",
                    "last_time": "昨天",
                    "member_ids": project_group_members,
                    "created_by": admin_user.id if admin_user else None,
                },
                {
                    "id": conv_g_all_id, "name": "全员大群", "type": "group",
                    "avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=all",
                    "avatar_label": "全", "avatar_color": "#10b981",
                    "last_message": "欢迎加入公司全员群",
                    "last_time": "刚刚",
                    "member_ids": all_user_ids,
                    "created_by": admin_user.id if admin_user else None,
                },
            ]
            for c in conversations_data:
                db.add(IMConversation(**c))
            await db.flush()

            # 构建 username -> user 映射便于消息引用
            def uid(username: str) -> str:
                u = user_map.get(username)
                return u.id if u else (admin_user.id if admin_user else "")

            def uavatar(username: str) -> str:
                u = user_map.get(username)
                return u.avatar or "" if u else ""

            def udept(username: str) -> str:
                u = user_map.get(username)
                return u.department or "" if u else ""

            def uempno(username: str) -> str:
                u = user_map.get(username)
                return u.employee_no or "" if u else ""

            def uname(username: str) -> str:
                u = user_map.get(username)
                return u.name or "" if u else ""

            # 消息数据 — 使用真实用户 ID
            # (conv_id, username, ctype, content, dtime, fname, fsize)
            messages_data = [
                # C001 admin <-> 李四 私聊
                (conv_c001_id, "lisi", "text",
                 "张哥，今天的订单数据给你发过去了，请确认一下有没有漏掉的部分。", "10:00", None, None),
                (conv_c001_id, "admin", "text",
                 "收到，我这就进系统看一下。", "10:01", None, None),
                (conv_c001_id, "lisi", "file",
                 "", "10:02", "1月订单汇总_最终版.xlsx", "1.2MB"),
                (conv_c001_id, "admin", "text",
                 "看到了，这个月业绩不错啊，比上个月增长了 15% 👍", "10:05", None, None),
                (conv_c001_id, "lisi", "image",
                 "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400", "10:08", None, None),
                (conv_c001_id, "lisi", "text",
                 "好的，收到！周三开会时我们会详细汇报。", "10:30", None, None),
                # G001 销售部工作群
                (conv_g001_id, "admin", "text",
                 "各位，今天下午3点在会议室A开周会，请准时参加。", "09:00", None, None),
                (conv_g001_id, "lisi", "text",
                 "收到，准时到达。", "09:05", None, None),
                (conv_g001_id, "wangwu", "text",
                 "好的，我会带上上周的报表。", "09:10", None, None),
                # C002 admin <-> 王五 私聊
                (conv_c002_id, "wangwu", "text",
                 "发票已经开好了，放在你工位上了。", "昨天", None, None),
                (conv_c002_id, "admin", "text",
                 "多谢，看到了。", "昨天", None, None),
                # G002 项目讨论组
                (conv_g002_id, "zhaoliu", "text",
                 "新项目的UI方案已经发到群邮件了，大家看一下。", "14:20", None, None),
                (conv_g002_id, "sales", "text",
                 "正在看，配色还可以再调整下。", "14:35", None, None),
                # G_ALL 全员大群
                (conv_g_all_id, "admin", "text",
                 "欢迎大家加入公司全员群，有事请在群里沟通！", "08:00", None, None),
            ]

            for conv_id, username, ctype, content, dtime, fname, fsize in messages_data:
                sender_id = uid(username)
                db.add(IMMessage(
                    conversation_id=conv_id,
                    sender_id=sender_id,
                    receiver_id=conv_id,
                    sender_name=uname(username),
                    sender_ext=uempno(username),
                    sender_dept=udept(username),
                    sender_avatar=uavatar(username),
                    direction="sent",  # direction 将在 API 层根据当前用户动态计算
                    content=content or "",
                    content_type=ctype,
                    display_time=dtime,
                    file_name=fname,
                    file_size=fsize,
                    scene="group" if conv_id in (conv_g001_id, conv_g002_id, conv_g_all_id) else "private",
                ))
            await db.flush()
            print("  ✓ IM 会话 & 消息 初始化完成")

        # ============================================================
        # 提交
        # ============================================================
        await db.commit()
        print("=" * 50)
        print("✅ 种子数据初始化完成!")
        print("   - 账号密码: admin/admin123  finance/finance123")
        print("                manager/manager123  sales/sales123")
        print("   - 演示数据: 客户×8  商品×8  订单×12  仓库×3  IM会话×5(含全员大群)")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
