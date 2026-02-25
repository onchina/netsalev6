
import React, { useState, useMemo } from 'react';
import { Badge, Button, Empty, Popconfirm, message, Tabs, Tooltip, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faBroom,
    faCheck,
    faCircleExclamation,
    faCommentDots,
    faTrash,
    faVolumeHigh,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import styles from './message-center.module.css';

interface NotificationItem {
    id: string;
    type: 'warning' | 'system' | 'reminder';
    title: string;
    content: string;
    time: string;
    isRead: boolean;
    level?: 'high' | 'normal' | 'low';
}

const initialData: NotificationItem[] = [
    { id: '1', type: 'warning', title: '库存不足预警', content: '商品"极光精华"库存仅剩 5 件，请及时补货。如果不及时处理可能会导致订单流失。', time: '10分钟前', isRead: false, level: 'high' },
    { id: '2', type: 'warning', title: '业绩异动提醒', content: '今日销售额同比下降 15%，请关注', time: '1小时前', isRead: false, level: 'normal' },
    { id: '3', type: 'system', title: '系统维护通知', content: '系统将于今晚 00:00 进行例行维护，预计耗时 30 分钟。维护期间将无法访问系统，请您提前做好准备。', time: '2小时前', isRead: false, level: 'normal' },
    { id: '4', type: 'system', title: '版本更新公告', content: 'V2.1 版本已上线，新增报表导出功能', time: '昨天', isRead: true, level: 'normal' },
    { id: '5', type: 'reminder', title: '客户跟进提醒', content: '重点客户"王总"超过 7 天未跟进，建议您可以拨打电话或发送邮件进行回访。', time: '3天前', isRead: true, level: 'normal' },
    { id: '6', type: 'reminder', title: '待办事项提醒', content: '您有 3 个待审批的报销单，请尽快前往审核中心处理。', time: '4天前', isRead: false, level: 'normal' },
    { id: '7', type: 'system', title: '安全登录提醒', content: '您的账号在新的设备上登录 IP: 192.168.1.100', time: '5天前', isRead: true, level: 'high' },
];

type CategoryType = 'all' | 'warning' | 'system' | 'reminder';
type StatusTab = 'unread' | 'all';

const MessageCenter: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>(initialData);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('warning');
    const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('unread');

    // 计算各分类未读数量
    const unreadCounts = useMemo(() => {
        return {
            warning: notifications.filter(n => n.type === 'warning' && !n.isRead).length,
            system: notifications.filter(n => n.type === 'system' && !n.isRead).length,
            reminder: notifications.filter(n => n.type === 'reminder' && !n.isRead).length,
        };
    }, [notifications]);

    // Derived Data: Current Category List
    const currentCategoryList = useMemo(() => {
        if (activeCategory === 'all') return notifications;
        return notifications.filter(item => item.type === activeCategory);
    }, [notifications, activeCategory]);

    // Derived Data: Current Unread List Only
    const currentUnreadList = useMemo(() => {
        return currentCategoryList.filter(item => !item.isRead);
    }, [currentCategoryList]);

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setNotifications(prev => prev.filter(item => item.id !== id));
        message.success('消息已删除');
    };

    const handleMarkRead = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setNotifications(prev => prev.map(item =>
            item.id === id ? { ...item, isRead: true } : item
        ));
        message.success('已标记为已读');
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(item => {
            if (activeCategory === 'all' || item.type === activeCategory) {
                return { ...item, isRead: true };
            }
            return item;
        }));
        message.success('已全部标记为已读');
    };

    const handleClearAll = () => {
        setNotifications(prev => prev.filter(item => {
            if (activeCategory === 'all') return false;
            return item.type !== activeCategory;
        }));
        message.success('消息已清空');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <FontAwesomeIcon icon={faCircleExclamation} />;
            case 'system': return <FontAwesomeIcon icon={faVolumeHigh} />;
            case 'reminder': return <FontAwesomeIcon icon={faBell} />;
            default: return <FontAwesomeIcon icon={faVolumeHigh} />;
        }
    };

    const getIconClass = (type: string) => {
        switch (type) {
            case 'warning': return styles.iconWarning;
            case 'system': return styles.iconSystem;
            case 'reminder': return styles.iconReminder;
            default: return styles.iconSystem;
        }
    };

    const categories = [
        { key: 'warning', label: '预警信息', icon: <FontAwesomeIcon icon={faCircleExclamation} /> },
        { key: 'reminder', label: '工作提醒', icon: <FontAwesomeIcon icon={faBell} /> },
        { key: 'system', label: '系统通知', icon: <FontAwesomeIcon icon={faVolumeHigh} /> },
    ];

    // Internal component for simpler rendering
    const MessageList = ({ list }: { list: NotificationItem[] }) => {
        if (!list || list.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无相关消息" />
                </div>
            );
        }
        return (
            <div className={styles.messageList}>
                {list.map(item => (
                    <div
                        key={item.id}
                        className={`${styles.messageCard} ${item.isRead ? styles.read : styles.unread}`}
                    >
                        <div className={`${styles.cardIcon} ${getIconClass(item.type)}`}>
                            {getIcon(item.type)}
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    {item.level === 'high' && !item.isRead && (
                                        <Tag color="error" style={{ margin: 0 }}>紧急</Tag>
                                    )}
                                    {item.title}
                                    {!item.isRead && <Badge color="#ff4d4f" />}
                                </div>
                                <span className={styles.cardTime}>{item.time}</span>
                            </div>
                            <div className={styles.cardBody}>
                                {item.content}
                            </div>

                            <div className={styles.cardFooter} onClick={e => e.stopPropagation()}>
                                {!item.isRead && (
                                    <Button
                                        size="small"
                                        className={styles.actionBtn}
                                        icon={<FontAwesomeIcon icon={faCheck} />}
                                        onClick={(e) => handleMarkRead(item.id, e)}
                                    >
                                        标为已读
                                    </Button>
                                )}
                                <Popconfirm
                                    title="确定删除这条消息吗？"
                                    onConfirm={(e) => handleDelete(item.id, e as unknown as React.MouseEvent)}
                                    okText="删除"
                                    cancelText="取消"
                                >
                                    <Button
                                        size="small"
                                        className={styles.deleteBtn}
                                        icon={<FontAwesomeIcon icon={faTrash} />}
                                    >
                                        删除
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Calculate lists
    const items = [
        {
            key: 'unread',
            label: `未读消息 ${currentUnreadList.length > 0 ? `(${currentUnreadList.length})` : ''}`,
            children: <MessageList list={currentUnreadList} />
        },
        {
            key: 'all',
            label: '全部消息',
            children: <MessageList list={currentCategoryList} />
        }
    ];

    const operations = (
        <div className={styles.toolbar}>
            <Tooltip title="标记当前分类所有消息为已读">
                <Button size="small" className={styles.actionBtn} onClick={handleMarkAllRead} icon={<FontAwesomeIcon icon={faCheck} />}>
                    全部已读
                </Button>
            </Tooltip>

            <Popconfirm
                title="确定清空当前分类所有消息吗？"
                onConfirm={handleClearAll}
                okText="确定"
                cancelText="取消"
            >
                <Button size="small" className={styles.deleteBtn} icon={<FontAwesomeIcon icon={faBroom} />}>
                    清空
                </Button>
            </Popconfirm>
        </div>
    );

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.mainContainer}>
                {/* 左侧：类型选择 */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>
                        <FontAwesomeIcon icon={faCommentDots} style={{ color: '#1890ff' }} />
                        消息中心
                    </div>
                    <div className={styles.navMenu}>
                        {categories.map(cat => (
                            <div
                                key={cat.key}
                                className={`${styles.navItem} ${activeCategory === cat.key ? styles.navItemActive : ''}`}
                                onClick={() => setActiveCategory(cat.key as CategoryType)}
                            >
                                <div className={styles.navLabel}>
                                    {cat.icon}
                                    {cat.label}
                                </div>
                                {unreadCounts[cat.key as keyof typeof unreadCounts] > 0 && (
                                    <Badge
                                        count={unreadCounts[cat.key as keyof typeof unreadCounts]}
                                        style={{ backgroundColor: '#ff4d4f' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右侧：状态 Tabs + 列表 */}
                <div className={styles.contentArea}>
                    <div className={styles.contentHeader}>
                        <div className={styles.headerTitle}>
                            {categories.find(c => c.key === activeCategory)?.label}
                        </div>
                        <Tooltip title="关闭页面 (ESC)">
                            <div className={styles.closeBtn} onClick={() => navigate(-1)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </div>
                        </Tooltip>
                    </div>

                    <div className={styles.tabsBody}>
                        <Tabs
                            activeKey={activeStatusTab}
                            onChange={(key) => setActiveStatusTab(key as StatusTab)}
                            items={items}
                            tabBarExtraContent={operations}
                            className={styles.tabsContainer}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageCenter;
