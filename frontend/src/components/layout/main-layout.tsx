import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Layout, Menu, Avatar, Badge, Typography, message, Popover } from 'antd';
import type { MenuProps } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHouse,
    faUsers,
    faClipboardCheck,
    faPaperPlane,
    faStore,
    faInbox,
    faChartBar,
    faTrophy,
    faGrip,
    faRocket,
    faFileLines,
    faGear,
    faBell,
    faBarsStaggered,
    faBars,
    faRightFromBracket,
    faUser,
    faIdCard,
    faArrowRotateLeft,
    faClockRotateLeft,
    faTableCellsLarge,
    faScrewdriverWrench,
    faCirclePlus,
    faPenToSquare,
    faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore, useUserStore } from '../../stores';
import styles from './main-layout.module.css';
import ProfileModal from '../user/profile-modal';
import AccountSettingsModal from '../user/account-settings-modal';
import FloatingChat from './floating-chat';
import NotificationReminder from './notification-reminder';
import request from '../../api/request';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { collapsed, toggleCollapsed } = useAppStore();

    const { user, isLoggedIn, logout } = useUserStore();

    // 权限检查辅助函数
    const hasPermission = (permission: string) => {
        if (!user || !user.permissionList) return false;
        if (user.permissionList.includes('*')) return true;
        if (user.permissionList.includes(permission)) return true;
        // 检查通配符权限 (e.g. 'customer:*')
        const module = permission.split(':')[0];
        return user.permissionList.includes(`${module}:*`);
    };

    // 消息通知状态
    const [notifications, setNotifications] = useState<any[]>([]);

    // 弹窗状态
    const [profileVisible, setProfileVisible] = useState(false);
    const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);

    const [badgeCounts, setBadgeCounts] = useState({
        pending: 0,
        shipped: 0,
        chat: 0,
        audit: 0,
        aftersale: 0,
        notifications: 0,
    });

    // 从后端获取角标计数
    const fetchBadges = async () => {
        try {
            const res = await request.get('/badges');
            if (res.data?.data) {
                setBadgeCounts(res.data.data);
                // 同步通知数量作为简化数组
                const count = res.data.data.notifications || 0;
                setNotifications(count > 0 ? Array.from({ length: count }, (_, i) => ({ id: i + 1 })) : []);
            }
        } catch (e) {
            message.error('获取通知数据失败，请稍后重试');
            console.error('Fetch badges error:', e);
        }
    };

    // 登录后拉取 + 每60秒刷新
    useEffect(() => {
        if (isLoggedIn && user) {
            fetchBadges();
            const timer = setInterval(fetchBadges, 60000);
            return () => clearInterval(timer);
        }
    }, [isLoggedIn, user]);

    // 渲染带角标的菜单及
    const renderLabelWithBadge = (label: string, count: number) => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{label}</span>
                {count > 0 && <Badge count={count} size="small" offset={[0, 0]} />}
            </div>
        );
    };



    // 使用useRef记录重定向状态，避免重复执行
    const redirectRef = useRef(false);
    
    // 检查登录状态
    useEffect(() => {
        if (!isLoggedIn || !user) {
            if (!redirectRef.current) {
                redirectRef.current = true;
                navigate('/login', { replace: true });
            }
        } else {
            redirectRef.current = false;
        }
    }, [isLoggedIn, user, navigate]);

    // 根据权限生成菜单
    const menuItems: MenuProps['items'] = useMemo(() => {
        if (!user) return [];

        const items: MenuProps['items'] = [
            {
                key: 'home',
                icon: <FontAwesomeIcon icon={faHouse} />,
                label: '工作台首页',
            },

            {
                type: 'group' as const,
                label: '路远商城',
                children: [
                    { key: '/mall/customer/list', icon: <FontAwesomeIcon icon={faUsers} />, label: '客户列表' },
                    { key: '/mall/order/create', icon: <FontAwesomeIcon icon={faCirclePlus} />, label: '创建订单' },
                    ...(hasPermission('finance:audit') ? [{ key: '/mall/order/audit', icon: <FontAwesomeIcon icon={faClipboardCheck} />, label: renderLabelWithBadge('审核订单', badgeCounts.audit) }] : []),
                    { key: '/mall/order/pending', icon: <FontAwesomeIcon icon={faInbox} />, label: renderLabelWithBadge('待发货订单', badgeCounts.pending) },
                    { key: '/mall/order/shipped', icon: <FontAwesomeIcon icon={faPaperPlane} />, label: renderLabelWithBadge('已发货订单', badgeCounts.shipped) },
                    ...(hasPermission('finance:aftersale') ? [{ key: '/mall/order/aftersale', icon: <FontAwesomeIcon icon={faFileLines} />, label: renderLabelWithBadge('售后订单', badgeCounts.aftersale) }] : []),

                    // 新增：修改订单 和 已签收订单
                    { key: '/mall/order/modify', icon: <FontAwesomeIcon icon={faPenToSquare} />, label: '修改订单' },
                    { key: '/mall/order/signed', icon: <FontAwesomeIcon icon={faCircleCheck} />, label: '已签收订单' },
                ],
            },
            {
                type: 'group' as const,
                label: '综合办公',
                children: [



                    // 数据分析权限
                    ...(hasPermission('office:analytics')
                        ? [{ key: '/analytics', icon: <FontAwesomeIcon icon={faChartBar} />, label: '数据分析' }]
                        : []),
                    { key: '/report', icon: <FontAwesomeIcon icon={faFileLines} />, label: '路远日报' },
                ],
            },

            {
                type: 'group' as const,
                label: '仓储物流',
                children: [
                    { key: '/mall/warehouse/product', icon: <FontAwesomeIcon icon={faStore} />, label: '商品管理' },
                    ...(hasPermission('warehouse:stock') ? [{ key: '/mall/warehouse/stock', icon: <FontAwesomeIcon icon={faInbox} />, label: '产品库存' }] : []),
                    ...(hasPermission('warehouse:return') ? [{ key: '/mall/warehouse/return-stock', icon: <FontAwesomeIcon icon={faArrowRotateLeft} />, label: '退货入库' }] : []),
                    ...(hasPermission('warehouse:records') ? [{ key: '/mall/warehouse/stock-records', icon: <FontAwesomeIcon icon={faClockRotateLeft} />, label: '出入库记录' }] : []),
                ],
            },
            {
                type: 'group' as const,
                label: '运营管理',
                children: [
                    { key: '/operations/channel', icon: <FontAwesomeIcon icon={faTableCellsLarge} />, label: '类型管理' },
                    { key: '/operations/log-list', icon: <FontAwesomeIcon icon={faFileLines} />, label: '日志列表' },
                ],
            },
            // 高级设置（需要权限）
            // 高级设置
            ...(hasPermission('settings:backend') || hasPermission('settings:system')
                ? [{
                    type: 'group' as const,
                    label: '高级设置',
                    children: [
                        ...(hasPermission('settings:backend') ? [{ key: '/settings', icon: <FontAwesomeIcon icon={faGear} />, label: '后台设置' }] : []),
                        ...(hasPermission('settings:system') ? [{ key: '/system-settings', icon: <FontAwesomeIcon icon={faScrewdriverWrench} />, label: '系统设置' }] : []),
                    ],
                }]
                : []),
        ];

        return items;
    }, [user]);

    // 用户下拉菜单项配置
    const userMenuActions = [
        { key: 'message-center', icon: <FontAwesomeIcon icon={faBell} />, label: '消息中心', badge: notifications.length },
        { key: 'profile', icon: <FontAwesomeIcon icon={faIdCard} />, label: '个人档案' },
        { key: 'account', icon: <FontAwesomeIcon icon={faGear} />, label: '账号设置' },
    ];

    const handleMenuClick = ({ key }: { key: string }) => {
        if (key === 'home') {
            navigate('/');
        } else {
            navigate(key);
        }
    };

    // 处理用户菜单点击
    const handleUserMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            logout();
            message.success('已安全退出');
            navigate('/login', { replace: true });
        } else if (key === 'profile') {
            setProfileVisible(true);
        } else if (key === 'account') {
            setAccountSettingsVisible(true);
        } else if (key === 'message-center') {
            navigate('/message-center');
        }
    };

    // 获取当前选中的菜单项
    const getSelectedKey = () => {
        if (location.pathname === '/') return ['home'];
        return [location.pathname];
    };

    // 未登录时不渲染
    if (!isLoggedIn || !user) {
        return null;
    }

    return (
        <Layout className={styles.layout}>
            {/* 左侧导航栏 */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                className={styles.sider}
                width={220}
                theme="light"
            >
                {/* Logo */}
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>江</div>
                    <span className={styles.logoText}>江湖路远</span>
                </div>

                {/* 菜单 */}
                <Menu
                    mode="inline"
                    selectedKeys={getSelectedKey()}
                    items={menuItems}
                    onClick={handleMenuClick}
                    className={styles.menu}
                />
            </Sider>

            <Layout>
                {/* 顶部操作栏 */}
                <Header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.trigger} onClick={toggleCollapsed}>
                            {collapsed ? <FontAwesomeIcon icon={faBars} /> : <FontAwesomeIcon icon={faBarsStaggered} />}
                        </span>
                    </div>

                    <div className={styles.headerRight}>
                        {/* 大屏系统卡片下拉菜单 */}
                        {hasPermission('office:dashboard') && (
                            <Popover
                                placement="bottomRight"
                                trigger="hover"
                                arrow={false}
                                overlayInnerStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}
                                content={
                                    <div className={styles.screenCard}>
                                        <div className={styles.screenCardHeader}>大屏系统</div>
                                        <div className={styles.screenCardBody}>
                                            <div
                                                className={styles.screenCardItem}
                                                onClick={() => window.open('/data-screen/performance/v1', '_blank')}
                                            >
                                                <div className={`${styles.screenCardIcon} ${styles.screenIconGray}`}>
                                                    <FontAwesomeIcon icon={faChartBar} />
                                                </div>
                                                <div className={styles.screenCardInfo}>
                                                    <div className={styles.screenCardName}>作战大屏 v1.0</div>
                                                    <div className={styles.screenCardDesc}>经典版业绩看板</div>
                                                </div>
                                            </div>
                                            <div
                                                className={styles.screenCardItem}
                                                onClick={() => window.open('/data-screen/performance/v2', '_blank')}
                                            >
                                                <div className={`${styles.screenCardIcon} ${styles.screenIconBlue}`}>
                                                    <FontAwesomeIcon icon={faRocket} />
                                                </div>
                                                <div className={styles.screenCardInfo}>
                                                    <div className={styles.screenCardName}>作战大屏 v2.0</div>
                                                    <div className={styles.screenCardDesc}>全新视觉数据中心</div>
                                                </div>
                                            </div>
                                            <div
                                                className={styles.screenCardItem}
                                                onClick={() => window.open('/data-screen/ranking', '_blank')}
                                            >
                                                <div className={`${styles.screenCardIcon} ${styles.screenIconGold}`}>
                                                    <FontAwesomeIcon icon={faTrophy} />
                                                </div>
                                                <div className={styles.screenCardInfo}>
                                                    <div className={styles.screenCardName}>排行榜大屏</div>
                                                    <div className={styles.screenCardDesc}>团队与个人排行榜</div>
                                                </div>
                                            </div>
                                            <div
                                                className={`${styles.screenCardItem} ${styles.screenCardDisabled}`}
                                            >
                                                <div className={`${styles.screenCardIcon} ${styles.screenIconGray}`}>
                                                    <FontAwesomeIcon icon={faRocket} />
                                                </div>
                                                <div className={styles.screenCardInfo}>
                                                    <div className={styles.screenCardName}>待开发大屏</div>
                                                    <div className={styles.screenCardDesc}>敬请期待</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                <div className={styles.screenLink}>
                                    <FontAwesomeIcon icon={faGrip} />
                                    <span>大屏系统</span>
                                </div>
                            </Popover>
                        )}


                        {/* 用户信息 - 卡片式下拉 */}
                        <Popover
                            placement="bottomRight"
                            trigger="hover"
                            arrow={false}
                            overlayInnerStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}
                            content={
                                <div className={styles.userCard}>
                                    {/* 用户信息头部 */}
                                    <div className={styles.userCardHeader}>
                                        <Avatar size={44} src={user?.avatar || undefined} icon={!user?.avatar ? <FontAwesomeIcon icon={faUser} /> : undefined} className={styles.userAvatar} />
                                        <div className={styles.userCardMeta}>
                                            <div className={styles.userCardName}>{user?.name}</div>
                                            <div className={styles.userCardRole}>{user?.roleLabel}</div>
                                        </div>
                                    </div>
                                    {/* 功能菜单 */}
                                    <div className={styles.userCardBody}>
                                        {userMenuActions.map(item => (
                                            <div
                                                key={item.key}
                                                className={styles.userCardItem}
                                                onClick={() => handleUserMenuClick({ key: item.key })}
                                            >
                                                <span className={styles.userCardItemIcon}>{item.icon}</span>
                                                <span className={styles.userCardItemLabel}>{item.label}</span>
                                                {item.badge && item.badge > 0 && (
                                                    <Badge count={item.badge} size="small" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* 退出 */}
                                    <div className={styles.userCardFooter}>
                                        <div
                                            className={styles.userCardLogout}
                                            onClick={() => handleUserMenuClick({ key: 'logout' })}
                                        >
                                            <FontAwesomeIcon icon={faRightFromBracket} />
                                            <span>安全退出</span>
                                        </div>
                                    </div>
                                </div>
                            }
                        >
                            <div className={styles.userInfo}>
                                <Badge count={notifications.length} size="small" offset={[-4, 4]}>
                                    <Avatar size={32} src={user?.avatar || undefined} icon={!user?.avatar ? <FontAwesomeIcon icon={faUser} /> : undefined} className={styles.userAvatar} />
                                </Badge>
                                <div className={styles.userMeta}>
                                    <Text className={styles.userName}>{user?.name}</Text>
                                    <Text className={styles.userRole}>{user?.roleLabel}</Text>
                                </div>
                            </div>
                        </Popover>
                    </div>
                </Header>

                {/* 内容区 */}
                <Content className={styles.content}>
                    <Outlet />
                </Content>
            </Layout>

            {/* 个人档案弹窗 */}
            <ProfileModal
                open={profileVisible}
                onClose={() => setProfileVisible(false)}
                user={user}
            />

            {/* 账号设置弹窗 */}
            <AccountSettingsModal
                open={accountSettingsVisible}
                onClose={() => setAccountSettingsVisible(false)}
            />

            {/* 悬浮即时通讯按钮 */}
            {hasPermission('office:chat') && <FloatingChat badgeCount={badgeCounts.chat} />}

            {/* 未读消息提醒卡片 - 除管理员外的所有角色生效 */}
            {user?.role !== 'admin' && <NotificationReminder />}
        </Layout>
    );
};

export default MainLayout;
