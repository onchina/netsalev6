import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Segmented, Tabs } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompress, faExpand, faTrophy } from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../stores';
import styles from './ranking.module.css';

const { Title } = Typography;

// 模拟从后端获取的“已启用排行榜”的部门列表
const availableDepartments = [
    { id: 'ALL', name: '公司全员' },
    { id: 'D002', name: '销售部' },
    { id: 'D003', name: '运营部' },
];

// 时间维度类型
type TimeDimension = '今日' | '本周' | '本月' | '本季度' | '本年';

// 模拟排行榜数据
const rankData = [
    { rank: 1, name: '张三', department: '销售部', amount: 128600, orders: 86, refund: 1500, target: 150000 },
    { rank: 2, name: '李四', department: '运营部', amount: 98500, orders: 72, refund: 800, target: 120000 },
    { rank: 3, name: '王五', department: '销售部', amount: 76800, orders: 58, refund: 2100, target: 100000 },
    { rank: 4, name: '赵六', department: '运营部', amount: 65200, orders: 45, refund: 1100, target: 80000 },
    { rank: 5, name: '钱七', department: '销售部', amount: 54300, orders: 38, refund: 600, target: 70000 },
    { rank: 6, name: '孙八', department: '运营部', amount: 48200, orders: 32, refund: 900, target: 60000 },
    { rank: 7, name: '周九', department: '销售部', amount: 42100, orders: 28, refund: 400, target: 55000 },
    { rank: 8, name: '吴十', department: '运营部', amount: 36800, orders: 24, refund: 700, target: 50000 },
];

// 部门排行数据
const deptRankData = [
    { name: '销售部', amount: 302800, orders: 210, members: 4, target: 375000 },
    { name: '运营部', amount: 248700, orders: 173, members: 4, target: 310000 },
];

const RankingScreen: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useUserStore();
    const [updateTime, setUpdateTime] = useState(new Date());
    const [timeDimension, setTimeDimension] = useState<TimeDimension>('今日');
    const [activeDeptKey, setActiveDeptKey] = useState<string>('ALL');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rankType, setRankType] = useState<'个人' | '部门'>('个人');

    // 监听全屏状态变化
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // 检查登录状态
    useEffect(() => {
        if (!isLoggedIn || !user) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, user, navigate]);

    // 模拟实时刷新
    useEffect(() => {
        const timer = setInterval(() => {
            setUpdateTime(new Date());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    // 格式化时间
    const formatTime = (date: Date) => {
        return date.toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    };

    // 筛选后的排行榜数据
    const filteredRankData = useMemo(() => {
        if (activeDeptKey === 'ALL') return rankData;
        const deptName = availableDepartments.find(d => d.id === activeDeptKey)?.name;
        return rankData.filter(item => item.department === deptName);
    }, [activeDeptKey]);

    const filteredDeptRankData = useMemo(() => {
        if (activeDeptKey === 'ALL') return deptRankData;
        const deptName = availableDepartments.find(d => d.id === activeDeptKey)?.name;
        return deptRankData.filter(item => item.name === deptName);
    }, [activeDeptKey]);

    // 获取排行榜最大值用于进度条
    const maxAmount = Math.max(...filteredRankData.map(item => item.amount), 1);
    const maxDeptAmount = Math.max(...filteredDeptRankData.map(item => item.amount), 1);

    // 获取达成率进度条颜色
    const getAchievementColor = (rate: number) => {
        if (rate >= 100) return '#52c41a';
        if (rate >= 80) return '#1677ff';
        if (rate >= 60) return '#faad14';
        return '#ff4d4f';
    };

    // 获取排名样式
    const getRankBadgeClass = (rank: number) => {
        if (rank === 1) return `${styles.rankBadge} ${styles.rank1}`;
        if (rank === 2) return `${styles.rankBadge} ${styles.rank2}`;
        if (rank === 3) return `${styles.rankBadge} ${styles.rank3}`;
        return styles.rankDefault;
    };

    // 获取进度条颜色
    const getProgressColor = (rank: number) => {
        if (rank === 1) return '#ffd700';
        if (rank === 2) return '#c0c0c0';
        if (rank === 3) return '#cd7f32';
        return '#6366f1';
    };

    // 切换全屏
    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen?.();
        }
    };

    // 个人排行榜 横向柱状图
    const personalBarOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const item = params[0];
                return `${item.name}<br/>销售额：¥${item.value.toLocaleString()}`;
            }
        },
        grid: { left: '3%', right: '8%', top: '5%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: (v: number) => `¥${(v / 10000).toFixed(0)}万` },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
        },
        yAxis: {
            type: 'category',
            data: [...filteredRankData].reverse().map(item => item.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 },
        },
        series: [{
            type: 'bar',
            data: [...filteredRankData].reverse().map((item, idx) => ({
                value: item.amount,
                itemStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: idx >= filteredRankData.length - 1 ? '#fbbf24' : idx >= filteredRankData.length - 2 ? '#94a3b8' : idx >= filteredRankData.length - 3 ? '#d97706' : '#6366f1' },
                            { offset: 1, color: idx >= filteredRankData.length - 1 ? '#f59e0b' : idx >= filteredRankData.length - 2 ? '#cbd5e1' : idx >= filteredRankData.length - 3 ? '#b45309' : '#818cf8' },
                        ]
                    },
                    borderRadius: [0, 6, 6, 0],
                }
            })),
            barWidth: 20,
            label: {
                show: true,
                position: 'right',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                formatter: (params: any) => `¥${params.value.toLocaleString()}`
            }
        }]
    };

    // 部门对比柱状图
    const deptBarOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: ['销售额', '目标额'],
            textStyle: { color: 'rgba(255,255,255,0.7)' },
            bottom: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: filteredDeptRankData.map(d => d.name),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
            axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: (v: number) => `¥${(v / 10000).toFixed(0)}万` },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        },
        series: [
            {
                name: '销售额',
                type: 'bar',
                data: filteredDeptRankData.map(d => d.amount),
                barWidth: 40,
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#6366f1' }] }
                },
                label: { show: true, position: 'top', color: 'rgba(255,255,255,0.7)', formatter: (p: any) => `¥${p.value.toLocaleString()}` }
            },
            {
                name: '目标额',
                type: 'bar',
                data: filteredDeptRankData.map(d => d.target),
                barWidth: 40,
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderWidth: 1,
                },
                label: { show: true, position: 'top', color: 'rgba(255,255,255,0.4)', formatter: (p: any) => `¥${p.value.toLocaleString()}` }
            },
        ],
    };

    return (
        <div className={styles.screen}>
            {/* 顶部 */}
            <div className={styles.header}>
                <Title level={4} className={styles.title}>
                    <FontAwesomeIcon icon={faTrophy} style={{ color: '#fbbf24', marginRight: 8 }} />
                    排行榜大屏
                </Title>
                <div className={styles.headerCenter}>
                    <Segmented
                        options={['今日', '本周', '本月', '本季度', '本年']}
                        value={timeDimension}
                        onChange={(value) => setTimeDimension(value as TimeDimension)}
                        className={styles.dimensionSelector}
                    />
                    <div className={styles.departmentTabs}>
                        <Tabs
                            activeKey={activeDeptKey}
                            onChange={setActiveDeptKey}
                            items={availableDepartments.map(d => ({
                                key: d.id,
                                label: d.name
                            }))}
                            className={styles.customTabs}
                        />
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.updateInfo}>
                        数据更新于: {formatTime(updateTime)}
                    </span>
                    <span className={styles.syncStatus}>
                        <span className={styles.syncDot}></span>
                        实时同步中
                    </span>
                    <button className={styles.actionBtn} onClick={handleFullscreen}>
                        {isFullscreen ? (
                            <><FontAwesomeIcon icon={faCompress} /> 退出</>
                        ) : (
                            <><FontAwesomeIcon icon={faExpand} /> 全屏</>
                        )}
                    </button>
                </div>
            </div>

            {/* 排行类型切换 */}
            <div className={styles.rankTypeSwitch}>
                <Segmented
                    options={['个人', '部门']}
                    value={rankType}
                    onChange={(value) => setRankType(value as '个人' | '部门')}
                    className={styles.rankTypeSelector}
                />
            </div>

            {rankType === '个人' ? (
                /* 个人排行 */
                <div className={styles.mainContent}>
                    {/* 左侧：图表 */}
                    <div className={styles.chartSection}>
                        <div className={styles.chartCard}>
                            <div className={styles.chartTitle}>个人销售额排行</div>
                            <ReactECharts option={personalBarOption} style={{ height: 400 }} />
                        </div>
                    </div>
                    {/* 右侧：详细排行榜 */}
                    <div className={styles.rankSection}>
                        <div className={styles.rankCard}>
                            <div className={styles.rankTitle}>销售排行榜（{timeDimension}）</div>
                            <div className={styles.rankTableContainer}>
                                <div className={styles.rankTable}>
                                    <div className={styles.rankHeader}>
                                        <span>排名</span>
                                        <span>姓名 / 部门</span>
                                        <span>销售额</span>
                                        <span>达成率</span>
                                        <span>订单数</span>
                                    </div>
                                    {filteredRankData.map((item, index) => {
                                        const personalRate = Math.round((item.amount / item.target) * 100);
                                        return (
                                            <div key={item.rank} className={styles.rankRow}>
                                                <span className={styles.rankCell}>
                                                    {index + 1 <= 3 ? (
                                                        <span className={getRankBadgeClass(index + 1)}>
                                                            <FontAwesomeIcon icon={faTrophy} />
                                                        </span>
                                                    ) : (
                                                        <span className={styles.rankDefault}>{index + 1}</span>
                                                    )}
                                                </span>
                                                <div className={styles.rankInfoCell}>
                                                    <div className={styles.rankName}>{item.name}</div>
                                                    <div className={styles.rankDept}>{item.department}</div>
                                                </div>
                                                <span className={styles.rankAmountCell}>
                                                    <div className={styles.amountWrapper}>
                                                        <span className={styles.amountText}>¥{item.amount.toLocaleString()}</span>
                                                        <div className={styles.progressBar}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{
                                                                    width: `${(item.amount / maxAmount) * 100}%`,
                                                                    background: getProgressColor(item.rank),
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </span>
                                                <span className={styles.rankCell}>
                                                    <span style={{ color: getAchievementColor(personalRate) }}>
                                                        {personalRate}%
                                                    </span>
                                                </span>
                                                <span className={styles.rankCell}>{item.orders}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* 部门排行 */
                <div className={styles.mainContent}>
                    <div className={styles.chartSection}>
                        <div className={styles.chartCard}>
                            <div className={styles.chartTitle}>部门业绩对比</div>
                            <ReactECharts option={deptBarOption} style={{ height: 400 }} />
                        </div>
                    </div>
                    <div className={styles.rankSection}>
                        <div className={styles.rankCard}>
                            <div className={styles.rankTitle}>部门排行榜（{timeDimension}）</div>
                            <div className={styles.rankTableContainer}>
                                <div className={styles.rankTable}>
                                    <div className={styles.rankHeader}>
                                        <span>排名</span>
                                        <span>部门名称</span>
                                        <span>销售额</span>
                                        <span>达成率</span>
                                        <span>人均销售</span>
                                    </div>
                                    {filteredDeptRankData.map((item, index) => {
                                        const deptRate = Math.round((item.amount / item.target) * 100);
                                        const perCapita = Math.round(item.amount / item.members);
                                        return (
                                            <div key={item.name} className={styles.rankRow}>
                                                <span className={styles.rankCell}>
                                                    {index + 1 <= 3 ? (
                                                        <span className={getRankBadgeClass(index + 1)}>
                                                            <FontAwesomeIcon icon={faTrophy} />
                                                        </span>
                                                    ) : (
                                                        <span className={styles.rankDefault}>{index + 1}</span>
                                                    )}
                                                </span>
                                                <div className={styles.rankInfoCell}>
                                                    <div className={styles.rankName}>{item.name}</div>
                                                    <div className={styles.rankDept}>{item.members}人</div>
                                                </div>
                                                <span className={styles.rankAmountCell}>
                                                    <div className={styles.amountWrapper}>
                                                        <span className={styles.amountText}>¥{item.amount.toLocaleString()}</span>
                                                        <div className={styles.progressBar}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{
                                                                    width: `${(item.amount / maxDeptAmount) * 100}%`,
                                                                    background: getProgressColor(index + 1),
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </span>
                                                <span className={styles.rankCell}>
                                                    <span style={{ color: getAchievementColor(deptRate) }}>
                                                        {deptRate}%
                                                    </span>
                                                </span>
                                                <span className={styles.rankCell}>¥{perCapita.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingScreen;
