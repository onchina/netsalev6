import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import styles from './notification-reminder.module.css';

// 模拟未读消息数据（后续替换为真实 API）
const mockFetchUnread = () => {
    return new Promise<{
        total: number;
        system: number;
        order: number;
        customer: number;
        previews: { text: string; time: string }[];
    }>((resolve) => {
        setTimeout(() => {
            // 模拟随机产生未读消息
            const system = Math.floor(Math.random() * 4);
            const order = Math.floor(Math.random() * 6);
            const customer = Math.floor(Math.random() * 3);
            const total = system + order + customer;
            const previews = [
                { text: '您有3个待审批订单需要处理', time: '刚刚' },
                { text: '新客户线索：抖音渠道张先生', time: '2分钟前' },
                { text: '系统将于今晚22:00进行维护升级', time: '5分钟前' },
            ].slice(0, Math.min(total, 3));
            resolve({ total, system, order, customer, previews });
        }, 300);
    });
};

// 轮询间隔：3分钟
const POLL_INTERVAL = 3 * 60 * 1000;

const NotificationReminder: React.FC = () => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [unreadData, setUnreadData] = useState({
        total: 0,
        system: 0,
        order: 0,
        customer: 0,
        previews: [] as { text: string; time: string }[],
    });
    // 用户手动关闭后，在本轮不再弹出，等下一轮拉取
    const [dismissed, setDismissed] = useState(false);

    const fetchUnread = useCallback(async () => {
        try {
            const data = await mockFetchUnread();
            setUnreadData(data);
            if (data.total > 0 && !dismissed) {
                setVisible(true);
            }
        } catch (err) {
            console.error('拉取未读消息失败:', err);
        }
    }, [dismissed]);

    useEffect(() => {
        // 首次延迟 5 秒后拉取，避免页面刚加载就弹出
        const initialTimer = setTimeout(() => {
            fetchUnread();
        }, 5000);

        // 每 3 分钟轮询
        const interval = setInterval(() => {
            setDismissed(false); // 新一轮允许弹出
            fetchUnread();
        }, POLL_INTERVAL);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [fetchUnread]);

    const handleClose = () => {
        setVisible(false);
        setDismissed(true);
    };

    const handleViewMessages = () => {
        setVisible(false);
        setDismissed(true);
        navigate('/message-center');
    };

    if (!visible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                {/* 头部 */}
                <div className={styles.cardHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.bellIconWrapper}>
                            <FontAwesomeIcon icon={faBell} />
                        </div>
                        <div className={styles.headerText}>
                            <div className={styles.headerTitle}>您有新的未读消息</div>
                            <div className={styles.headerSub}>
                                共 {unreadData.total} 条未读消息等待处理
                            </div>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* 内容 */}
                <div className={styles.cardBody}>
                    {/* 分类统计 */}
                    <div className={styles.unreadStats}>
                        <div className={styles.statItem}>
                            <div className={styles.statCount}>{unreadData.system}</div>
                            <div className={styles.statLabel}>系统通知</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statCount}>{unreadData.order}</div>
                            <div className={styles.statLabel}>订单消息</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statCount}>{unreadData.customer}</div>
                            <div className={styles.statLabel}>客户动态</div>
                        </div>
                    </div>

                    {/* 消息预览 */}
                    {unreadData.previews.length > 0 && (
                        <div className={styles.previewList}>
                            {unreadData.previews.map((item, index) => (
                                <div key={index} className={styles.previewItem}>
                                    <div className={styles.previewDot} />
                                    <span className={styles.previewText}>{item.text}</span>
                                    <span className={styles.previewTime}>{item.time}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 操作按钮 */}
                    <div className={styles.cardActions}>
                        <button className={styles.viewBtn} onClick={handleViewMessages}>
                            查看消息中心
                        </button>
                        <button className={styles.dismissBtn} onClick={handleClose}>
                            稍后再看
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationReminder;
