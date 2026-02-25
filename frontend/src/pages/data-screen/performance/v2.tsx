import React, { useState, useEffect, useMemo } from 'react';
import { Progress, Segmented, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faCompress,
    faExpand,
    faChartLine,
    faBagShopping,
    faRotateLeft,
    faBullseye,
    faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../stores';
import styles from './performance-v2.module.css';

// Mock Data (依赖于后台部门设置中启用“业绩 V2”功能的部门列表)
const availableDepartments = [
    { id: 'D002', name: '销售部', color: '#3b82f6' },
    { id: 'D003', name: '运营部', color: '#8b5cf6' },
];

type TimeDimension = '今日' | '本周' | '本月' | '本年';

const PerformanceScreenV2: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useUserStore();
    const [timeDimension, setTimeDimension] = useState<TimeDimension>('今日');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [updateTime, setUpdateTime] = useState(new Date());

    // Sync fullscreen state
    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Auth check
    useEffect(() => {
        if (!isLoggedIn || !user) navigate('/login', { replace: true });
    }, [isLoggedIn, user, navigate]);

    // Live update simulation
    useEffect(() => {
        const timer = setInterval(() => setUpdateTime(new Date()), 5000);
        return () => clearInterval(timer);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Derived Data
    const stats = useMemo(() => {
        const data = {
            '今日': { sales: 128400, orders: 452, refund: 2100, target: 150000, trend: 12.5 },
            '本周': { sales: 842000, orders: 2840, refund: 12500, target: 1000000, trend: 8.2 },
            '本月': { sales: 3250000, orders: 12400, refund: 45000, target: 4000000, trend: 15.4 },
            '本年': { sales: 38400000, orders: 145000, refund: 520000, target: 50000000, trend: 22.1 },
        };
        return data[timeDimension];
    }, [timeDimension]);

    // Main Chart Option
    const mainChartOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderWidth: 0,
            textStyle: { color: '#fff' },
            axisPointer: { type: 'cross', label: { backgroundColor: '#334155' } }
        },
        grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)' }
        },
        series: [
            {
                name: '实际销售',
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: [32000, 28000, 45000, 89000, 112000, 128000, 128400],
                lineStyle: { width: 4, color: '#3b82f6' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                            { offset: 1, color: 'transparent' }
                        ]
                    }
                }
            },
            {
                name: '昨日同期',
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: [28000, 25000, 38000, 75000, 98000, 110000, 115000],
                lineStyle: { width: 2, color: 'rgba(255,255,255,0.2)', type: 'dashed' }
            }
        ]
    };

    // Distribution Pie Option
    const pieOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['60%', '85%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#0f172a', borderWidth: 2 },
            label: { show: false },
            data: [
                { value: 65, name: '销售部', itemStyle: { color: '#3b82f6' } },
                { value: 35, name: '运营部', itemStyle: { color: '#8b5cf6' } }
            ]
        }]
    };

    return (
        <div className={styles.screen}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <div className={styles.logoBox}>江</div>
                    <div className={styles.titleText}>
                        <h1 className={styles.title}>江湖路远 作战大屏 <span className={styles.versionBadge}>v2.0 PRO</span></h1>
                        <div className={styles.liveIndicator}>
                            <span className={styles.liveDot}></span>
                            <span>实时监控中 • 更新于 {updateTime.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.dimensionSelector}>
                        <Segmented
                            options={['今日', '本周', '本月', '本年']}
                            value={timeDimension}
                            onChange={(v) => setTimeDimension(v as TimeDimension)}
                        />
                    </div>
                    <Tooltip title={isFullscreen ? "退出全屏" : "全屏展示"}>
                        <button className={styles.actionBtn} onClick={toggleFullscreen}>
                            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                        </button>
                    </Tooltip>
                </div>
            </header>

            {/* Top Stats */}
            <div className={styles.dashboardGrid}>
                {/* Sale Card */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>
                        今日销售净额
                        <div className={styles.cardIcon} style={{ color: '#3b82f6' }}><FontAwesomeIcon icon={faChartLine} /></div>
                    </div>
                    <div className={styles.cardValue}>¥ {stats.sales.toLocaleString()}</div>
                    <div className={`${styles.cardTrend} ${stats.trend > 0 ? styles.trendUp : styles.trendDown}`}>
                        <FontAwesomeIcon icon={faArrowTrendUp} />
                        <span>相比昨日 +{stats.trend}%</span>
                    </div>
                </div>

                {/* Orders Card */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>
                        实时订单总数
                        <div className={styles.cardIcon} style={{ color: '#10b981' }}><FontAwesomeIcon icon={faBagShopping} /></div>
                    </div>
                    <div className={styles.cardValue}>{stats.orders.toLocaleString()}</div>
                    <div className={styles.cardTrend}>
                        <span>平均客单价: ¥{Math.round(stats.sales / stats.orders)}</span>
                    </div>
                </div>

                {/* Refund Card */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>
                        售后退款额
                        <div className={styles.cardIcon} style={{ color: '#ef4444' }}><FontAwesomeIcon icon={faRotateLeft} /></div>
                    </div>
                    <div className={styles.cardValue}>¥ {stats.refund.toLocaleString()}</div>
                    <div className={styles.cardTrend} style={{ color: 'rgba(255,255,255,0.4)' }}>
                        退款率: {(stats.refund / stats.sales * 100).toFixed(1)}%
                    </div>
                </div>

                {/* Target Card */}
                <div className={`${styles.card} ${styles.achievementCard}`}>
                    <div className={styles.cardLabel}>
                        目标完成进度
                        <div className={styles.cardIcon} style={{ color: '#f59e0b' }}><FontAwesomeIcon icon={faBullseye} /></div>
                    </div>
                    <div className={styles.cardValue}>{Math.round(stats.sales / stats.target * 100)}%</div>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressLabel}>
                            <span>已完成 ¥{Math.round(stats.sales / 10000)}w</span>
                            <span>目标 ¥{Math.round(stats.target / 10000)}w</span>
                        </div>
                        <Progress
                            percent={Math.round(stats.sales / stats.target * 100)}
                            showInfo={false}
                            strokeColor={{ '0%': '#3b82f6', '100%': '#8b5cf6' }}
                            trailColor="rgba(255,255,255,0.1)"
                        />
                    </div>
                </div>

                {/* Main Trend Chart */}
                <div className={`${styles.card} ${styles.mainChartArea}`}>
                    <div className={styles.chartTitle}>
                        <h3><FontAwesomeIcon icon={faChartLine} /> 业绩波动态势</h3>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Realtime Data Stream</div>
                    </div>
                    <ReactECharts option={mainChartOption} style={{ height: '320px' }} />
                </div>

                {/* Side Stats */}
                <div className={styles.sideStatsArea}>
                    <div className={styles.card} style={{ flex: 1 }}>
                        <div className={styles.chartTitle}>
                            <h3><FontAwesomeIcon icon={faLayerGroup} /> 部门贡献值</h3>
                        </div>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <ReactECharts option={pieOption} style={{ width: '100%', height: '100%' }} />
                            <div style={{ position: 'absolute', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: '800' }}>100%</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>全站概览</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            {availableDepartments.map(dept => (
                                <div key={dept.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dept.color }}></span>
                                        {dept.name}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{dept.name === '销售部' ? '65%' : '35%'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceScreenV2;
