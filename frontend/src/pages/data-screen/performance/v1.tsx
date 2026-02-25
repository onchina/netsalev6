import React, { useState, useEffect } from 'react';
import { Typography, Progress, Segmented, Checkbox } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendDown,
    faArrowTrendUp,
    faCompress,
    faExpand,
} from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../stores';
import styles from './performance.module.css';

const { Title } = Typography;

// 可选部门列表（依赖于后台部门设置中启用“业绩 V1”功能的部门列表）
const availableDepartments = [
    { id: 'D002', name: '销售部' },
    { id: 'D003', name: '运营部' },
];

// 时间维度类型
type TimeDimension = '今日' | '本周' | '本月' | '本季度' | '本年';

// 环比对应的文本标签
const lastPeriodLabel: Record<TimeDimension, string> = {
    '今日': '昨日',
    '本周': '上周',
    '本月': '上月',
    '本季度': '上季',
    '本年': '去年',
};

// 模拟数据接口
interface DimensionStats {
    sales: number;
    orders: number;
    refund: number;
    target: number;
    lastSales: number;
    lastOrders: number;
    lastRefund: number;
}

// 模拟不同时间维度的数据
const dimensionData: Record<TimeDimension, DimensionStats> = {
    '今日': { sales: 89680, orders: 128, refund: 1200, target: 100000, lastSales: 79500, lastOrders: 110, lastRefund: 1500 },
    '本周': { sales: 456800, orders: 680, refund: 8500, target: 500000, lastSales: 423000, lastOrders: 650, lastRefund: 9200 },
    '本月': { sales: 1256800, orders: 3680, refund: 25000, target: 1500000, lastSales: 1180000, lastOrders: 3400, lastRefund: 22000 },
    '本季度': { sales: 3680000, orders: 10500, refund: 58000, target: 4500000, lastSales: 3450000, lastOrders: 9800, lastRefund: 62000 },
    '本年': { sales: 12680000, orders: 38000, refund: 210000, target: 15000000, lastSales: 11200000, lastOrders: 35000, lastRefund: 230000 },
};

const PerformanceScreenV1: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useUserStore();
    const [updateTime, setUpdateTime] = useState(new Date());
    const [timeDimension, setTimeDimension] = useState<TimeDimension>('今日');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
        availableDepartments.map(d => d.name)
    );
    const [isFullscreen, setIsFullscreen] = useState(false);

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
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const totalDeptSales = availableDepartments.reduce((sum, dept) => {
        // 简化比例计算，实际业务应由后端返回
        return sum + (dept.name === '销售部' ? 302800 : 248700);
    }, 0);
    const selectedDeptSales = availableDepartments
        .filter(dept => selectedDepartments.includes(dept.name))
        .reduce((sum, dept) => sum + (dept.name === '销售部' ? 302800 : 248700), 0);
    const ratio = totalDeptSales > 0 ? selectedDeptSales / totalDeptSales : 0;

    // 当前维度数据（根据部门筛选按比例缩放）
    const baseData = dimensionData[timeDimension];
    const currentData = {
        sales: Math.round(baseData.sales * ratio),
        orders: Math.round(baseData.orders * ratio),
        refund: Math.round(baseData.refund * ratio),
        target: Math.round(baseData.target * ratio),
        lastSales: Math.round(baseData.lastSales * ratio),
        lastOrders: Math.round(baseData.lastOrders * ratio),
        lastRefund: Math.round(baseData.lastRefund * ratio),
    };

    // 计算达成率
    const achievementRate = currentData.target > 0 ? Math.round((currentData.sales / currentData.target) * 100) : 0;

    // 计算环比增长函数
    const calcGrowth = (current: number, last: number) => {
        if (last === 0) return { rate: '0.0', isUp: true };
        const rate = ((current - last) / last * 100).toFixed(1);
        return { rate, isUp: current >= last };
    };

    const salesGrowth = calcGrowth(currentData.sales, currentData.lastSales);
    const ordersGrowth = calcGrowth(currentData.orders, currentData.lastOrders);
    const refundGrowth = calcGrowth(currentData.refund, currentData.lastRefund);

    const deptDistribution = availableDepartments.map(dept => {
        const isSelected = selectedDepartments.includes(dept.name);
        const deptSalesSum = dept.name === '销售部' ? 302800 : 248700;
        const allDeptSales = 302800 + 248700;
        const deptRatio = isSelected ? deptSalesSum / allDeptSales : 0;

        return {
            name: dept.name,
            ratio: deptRatio,
            isSelected,
            amount: isSelected ? Math.round(currentData.sales * (deptSalesSum / (selectedDeptSales || 1))) : 0
        };
    });

    // 根据时间维度获取 X 轴数据和模拟数据
    const getTrendConfig = (dimension: TimeDimension) => {
        switch (dimension) {
            case '今日':
                return {
                    categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    dataLen: 24,
                    label: '24小时趋势'
                };
            case '本周':
                return {
                    categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    dataLen: 7,
                    label: '7天趋势'
                };
            case '本月':
                return {
                    categories: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
                    dataLen: 30,
                    label: '30天趋势'
                };
            case '本季度':
                return {
                    categories: ['第一月', '第二月', '第三月'],
                    dataLen: 3,
                    label: '季度月份趋势'
                };
            case '本年':
                return {
                    categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                    dataLen: 12,
                    label: '12个月趋势'
                };
            default:
                return { categories: [], dataLen: 0, label: '' };
        }
    };

    const trendConfig = getTrendConfig(timeDimension);

    // 销售趋势图配置（动态堆叠显示部门）
    const trendOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: [...deptDistribution.map(d => d.name), '总订单数'],
            textStyle: { color: 'rgba(255,255,255,0.7)' },
            bottom: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: trendConfig.categories,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
            axisLabel: {
                color: 'rgba(255,255,255,0.6)',
                interval: timeDimension === '今日' || timeDimension === '本月' ? 'auto' : 0
            },
        },
        yAxis: [
            {
                type: 'value',
                name: '销售额',
                nameTextStyle: { color: 'rgba(255,255,255,0.6)' },
                axisLine: { show: false },
                axisLabel: { color: 'rgba(255,255,255,0.6)' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
            },
            {
                type: 'value',
                name: '订单数',
                nameTextStyle: { color: 'rgba(255,255,255,0.6)' },
                axisLine: { show: false },
                axisLabel: { color: 'rgba(255,255,255,0.6)' },
                splitLine: { show: false },
            },
        ],
        series: [
            ...deptDistribution.map((dept, idx) => ({
                name: dept.name,
                type: 'bar',
                stack: 'total',
                // 生成对应长度的模拟数据
                data: Array.from({ length: trendConfig.dataLen }, (_, i) => {
                    const base = [120000, 135000, 98000, 145000, 168000, 198000, 220000, 180000, 210000, 250000, 230000, 270000][i % 12];
                    return dept.isSelected ? Math.round(base * dept.ratio * (0.8 + Math.random() * 0.4)) : 0;
                }),
                itemStyle: {
                    borderRadius: idx === deptDistribution.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
                },
            })),
            {
                name: '总订单数',
                type: 'line',
                yAxisIndex: 1,
                data: Array.from({ length: trendConfig.dataLen }, (_, i) => {
                    const base = [320, 380, 280, 420, 480, 560, 620, 500, 580, 650, 600, 700][i % 12];
                    return Math.round(base * ratio * (0.8 + Math.random() * 0.4));
                }),
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#22d3ee' },
                lineStyle: { width: 2, color: '#22d3ee' },
            },
        ],
    };

    // 部门业绩占比饼图
    const deptPieOption = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: ¥{c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: { color: 'rgba(255,255,255,0.7)' },
            itemWidth: 12,
            itemHeight: 12,
        },
        series: [
            {
                name: '部门分布',
                type: 'pie',
                radius: ['45%', '65%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#1a1a2e',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '14',
                        fontWeight: 'bold',
                        color: '#fff',
                        formatter: '{b}\n{d}%'
                    }
                },
                data: deptDistribution.map((d, idx) => ({
                    value: d.amount,
                    name: d.name,
                    itemStyle: {
                        color: idx === 0 ? '#a855f7' : idx === 1 ? '#ec4899' : '#22c55e'
                    }
                })),
            },
        ],
    };

    // 渠道分布饼图（静态展示渠道详情）
    const channelOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: { color: 'rgba(255,255,255,0.7)' },
            itemWidth: 12,
            itemHeight: 12,
        },
        series: [
            {
                type: 'pie',
                radius: ['45%', '65%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                label: { show: false },
                data: [
                    { value: Math.round(35 * ratio), name: '抖音', itemStyle: { color: '#a855f7' } },
                    { value: Math.round(25 * ratio), name: '快手', itemStyle: { color: '#ec4899' } },
                    { value: Math.round(20 * ratio), name: '微信', itemStyle: { color: '#22c55e' } },
                    { value: Math.round(12 * ratio), name: '淘宝', itemStyle: { color: '#f97316' } },
                    { value: Math.round(8 * ratio), name: '其他', itemStyle: { color: '#6366f1' } },
                ].filter(d => d.value > 0),
            },
        ],
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

    // 获取达成率进度条颜色
    const getAchievementColor = (rate: number) => {
        if (rate >= 100) return '#52c41a';
        if (rate >= 80) return '#1677ff';
        if (rate >= 60) return '#faad14';
        return '#ff4d4f';
    };

    return (
        <div className={styles.screen}>
            {/* 顶部 */}
            <div className={styles.header}>
                <Title level={4} className={styles.title}>江湖路远 作战大屏 v1.0</Title>
                <div className={styles.headerCenter}>
                    <Segmented
                        options={['今日', '本周', '本月', '本季度', '本年']}
                        value={timeDimension}
                        onChange={(value) => setTimeDimension(value as TimeDimension)}
                        className={styles.dimensionSelector}
                    />
                    <div className={styles.departmentFilter}>
                        <span className={styles.filterLabel}>部门：</span>
                        <Checkbox.Group
                            options={availableDepartments.map(d => ({ label: d.name, value: d.name }))}
                            value={selectedDepartments}
                            onChange={(values) => setSelectedDepartments(values as string[])}
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

            {/* 统计卡片 */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{timeDimension}销售额</div>
                    <div className={styles.statValue}>
                        <span className={styles.statNumber}>¥ {currentData.sales.toLocaleString()}</span>
                    </div>
                    <div className={styles.statSub}>
                        <span className={styles.subLabel}>{lastPeriodLabel[timeDimension]} ¥{currentData.lastSales.toLocaleString()}</span>
                        <span className={`${styles.statTrend} ${salesGrowth.isUp ? styles.trendUp : styles.trendDown} ${styles.subTrend}`}>
                            {salesGrowth.isUp ? <FontAwesomeIcon icon={faArrowTrendUp} /> : <FontAwesomeIcon icon={faArrowTrendDown} />} {salesGrowth.isUp ? '+' : ''}{salesGrowth.rate}%
                        </span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{timeDimension}订单数</div>
                    <div className={styles.statValue}>
                        <span className={styles.statNumber}>{currentData.orders.toLocaleString()}</span>
                    </div>
                    <div className={styles.statSub}>
                        <span className={styles.subLabel}>{lastPeriodLabel[timeDimension]} {currentData.lastOrders.toLocaleString()}</span>
                        <span className={`${styles.statTrend} ${ordersGrowth.isUp ? styles.trendUp : styles.trendDown} ${styles.subTrend}`}>
                            {ordersGrowth.isUp ? <FontAwesomeIcon icon={faArrowTrendUp} /> : <FontAwesomeIcon icon={faArrowTrendDown} />} {ordersGrowth.isUp ? '+' : ''}{ordersGrowth.rate}%
                        </span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{timeDimension}退款额</div>
                    <div className={styles.statValue}>
                        <span className={styles.statNumber}>¥ {currentData.refund.toLocaleString()}</span>
                    </div>
                    <div className={styles.statSub}>
                        <span className={styles.subLabel}>{lastPeriodLabel[timeDimension]} ¥{currentData.lastRefund.toLocaleString()}</span>
                        <span className={`${styles.statTrend} ${!refundGrowth.isUp ? styles.trendUp : styles.trendDown} ${styles.subTrend}`}>
                            {refundGrowth.isUp ? <FontAwesomeIcon icon={faArrowTrendUp} /> : <FontAwesomeIcon icon={faArrowTrendDown} />} {refundGrowth.isUp ? '+' : ''}{refundGrowth.rate}%
                        </span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.achievementCard}`}>
                    <div className={styles.statLabel}>目标达成率</div>
                    <div className={styles.achievementContent}>
                        <div className={styles.achievementRate}>
                            <span className={styles.rateNumber} style={{ color: getAchievementColor(achievementRate) }}>
                                {achievementRate}%
                            </span>
                        </div>
                        <Progress
                            percent={Math.min(achievementRate, 100)}
                            showInfo={false}
                            strokeColor={getAchievementColor(achievementRate)}
                            trailColor="rgba(255,255,255,0.1)"
                            size="small"
                        />
                        <div className={styles.targetInfo}>
                            目标: ¥{currentData.target.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* 图表 */}
            <div className={styles.chartRow}>
                <div className={`${styles.chartCard} ${styles.fullWidthChart}`} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.chartTitle}>{timeDimension}销售趋势 ({trendConfig.label})</div>
                    <ReactECharts option={trendOption} style={{ height: 350 }} />
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>部门业绩占比</div>
                    <ReactECharts option={deptPieOption} style={{ height: 280 }} />
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>渠道分布 (所选部门)</div>
                    <ReactECharts option={channelOption} style={{ height: 280 }} />
                </div>
            </div>
        </div>
    );
};

export default PerformanceScreenV1;
