import React from 'react';
import { Row, Col, Card, Tag, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faCartShopping,
    faCirclePlus,
    faClipboardCheck,
    faComment,
    faPaperPlane,
    faSquareCheck,
    faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import styles from './workbench.module.css';

const { Text } = Typography;

// 模拟待办数据
const todoData = [
    { id: '1', type: '订单审核', content: '客户张三的订单(OD2023102401)待审核', status: 'urgent', statusText: '紧急' },
    { id: '2', type: '售后处理', content: '订单 OD2023102205 发起退款申请', status: 'pending', statusText: '待办' },
    { id: '3', type: '库存预警', content: '商品"补水精华"库存不足5件', status: 'remind', statusText: '提醒' },
];

// 快捷入口配置
const quickEntries = [
    { key: 'newCustomer', icon: <FontAwesomeIcon icon={faUserPlus} />, label: '新建客户', path: '/mall/customer/list' },
    { key: 'newOrder', icon: <FontAwesomeIcon icon={faCirclePlus} />, label: '创建订单', path: '/mall/order/create' },
    { key: 'audit', icon: <FontAwesomeIcon icon={faSquareCheck} />, label: '订单审核', path: '/mall/order/audit' },
    { key: 'chat', icon: <FontAwesomeIcon icon={faComment} />, label: '即时通讯', path: '/chat', openInNewWindow: true },
];

// 状态标签配置
const statusConfig: Record<string, { color: string }> = {
    urgent: { color: 'error' },
    pending: { color: 'processing' },
    remind: { color: 'warning' },
};

const Workbench: React.FC = () => {
    const navigate = useNavigate();

    // 统计数据
    const statsData = [
        { title: '今日订单数', value: '128', trend: '+12%', trendType: 'up', icon: <FontAwesomeIcon icon={faCartShopping} />, iconClass: styles.statIconBlue },
        { title: '今日销售额', value: '¥42,850', trend: '+8%', trendType: 'up', icon: <FontAwesomeIcon icon={faArrowTrendUp} />, iconClass: styles.statIconGreen },
        { title: '待审核订单', value: '14', trend: '-2', trendType: 'down', icon: <FontAwesomeIcon icon={faClipboardCheck} />, iconClass: styles.statIconOrange },
        { title: '待发货订单', value: '32', trend: '+5', trendType: 'up', icon: <FontAwesomeIcon icon={faPaperPlane} />, iconClass: styles.statIconPurple },
    ];

    return (
        <div className={styles.dashboard}>
            {/* 数据统计卡片 */}
            <Row gutter={[16, 16]} className={styles.statsRow}>
                {statsData.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card className={styles.statCard} bordered={false}>
                            <div className={styles.statContent}>
                                <div className={styles.statTitle}>{stat.title}</div>
                                <div className={styles.statValue}>{stat.value}</div>
                                <div className={`${styles.statTrend} ${stat.trendType === 'up' ? styles.statTrendUp : styles.statTrendDown}`}>
                                    {stat.trend} 较昨日
                                </div>
                            </div>
                            <div className={`${styles.statIcon} ${stat.iconClass}`}>
                                {stat.icon}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                {/* 我的待办 */}
                <Col xs={24} lg={16}>
                    <Card
                        title="我的待办"
                        className={styles.todoCard}
                        extra={<a onClick={() => navigate('/opportunity')}>全部待办</a>}
                    >
                        {/* 表头 */}
                        <div className={styles.todoItem} style={{ background: '#fafafa', fontWeight: 500, color: '#666' }}>
                            <span className={styles.todoType}>类型</span>
                            <span className={styles.todoContent}>内容</span>
                            <span className={styles.todoStatus}>状态</span>
                            <span className={styles.todoAction}>操作</span>
                        </div>
                        {/* 待办列表 */}
                        {todoData.map((item) => (
                            <div key={item.id} className={styles.todoItem}>
                                <span className={styles.todoType}>{item.type}</span>
                                <span className={styles.todoContent}>{item.content}</span>
                                <Tag color={statusConfig[item.status]?.color} className={styles.todoStatus}>
                                    {item.statusText}
                                </Tag>
                                <span className={styles.todoAction}>去处理</span>
                            </div>
                        ))}
                    </Card>

                </Col>

                {/* 快捷入口 */}
                <Col xs={24} lg={8}>
                    <Card title="快捷入口" className={styles.quickCard}>
                        <Row gutter={[12, 12]}>
                            {quickEntries.map((entry) => (
                                <Col span={12} key={entry.key}>
                                    <div
                                        className={styles.quickEntry}
                                        onClick={() => {
                                            if (entry.openInNewWindow) {
                                                const w = 1280, h = 1024;
                                                const left = (screen.width - w) / 2, top = (screen.height - h) / 2;
                                                window.open(entry.path, '_blank', `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`);
                                            } else {
                                                navigate(entry.path);
                                            }
                                        }}
                                    >
                                        <div className={styles.quickIcon}>{entry.icon}</div>
                                        <Text className={styles.quickLabel}>{entry.label}</Text>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div >
    );
};

export default Workbench;
