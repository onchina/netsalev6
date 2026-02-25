import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Space, Typography, Table, Tag, Statistic } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import styles from './analytics.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- 1. 结构化 Mock 数据生成 (Data Seeding) ---
interface Tag {
    tagName: string;
    createdAt: number;
}

interface Customer {
    id: string;
    name: string;
    tags: Tag[];
}

interface Order {
    orderId: string;
    customerId: string;
    amount: number;
    status: '有效' | '无效';
    createdAt: number;
    deptName: string;
    saleType?: '一卖' | '二卖'; // 计算层添加
}

const DEPARTMENTS = ['销售 A 部', '销售 B 部', '团队 C', '运营组'];

const generateMockSalesData = (count: number) => {
    const customers: Customer[] = [];
    const orders: Order[] = [];

    // 生成 50 个客户
    for (let i = 1; i <= 50; i++) {
        const tagDate = Date.now() - Math.floor(Math.random() * 30 * 24 * 3600 * 1000);
        customers.push({
            id: `C${i.toString().padStart(3, '0')}`,
            name: `客户 ${String.fromCharCode(65 + (i % 26))}${i}`,
            tags: [{ tagName: i % 2 === 0 ? '高潜意向' : '普通咨询', createdAt: tagDate }]
        });
    }

    // 为每个客户生成 1-3 个订单
    let orderIdCounter = 1;
    customers.forEach(cust => {
        const orderCount = Math.floor(Math.random() * 3) + 1;
        const custTagDate = cust.tags[0].createdAt;

        const tempOrders: Order[] = [];
        for (let j = 0; j < orderCount; j++) {
            // 订单日期必须晚于标签日期
            const orderDate = custTagDate + Math.floor(Math.random() * (Date.now() - custTagDate));
            tempOrders.push({
                orderId: `ORD${orderIdCounter++}`,
                customerId: cust.id,
                amount: Math.floor(Math.random() * 5000) + 500,
                status: Math.random() < 0.8 ? '有效' : '无效',
                createdAt: orderDate,
                deptName: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]
            });
        }

        // 排序以确定一卖/二卖
        tempOrders.sort((a, b) => a.createdAt - b.createdAt);
        orders.push(...tempOrders);
    });

    return { customers, orders };
};

// --- 2. 前端聚合计算逻辑 (Data Transformation) ---
interface FilterParams {
    tagDateRange: [number, number] | null;
    orderDateRange: [number, number] | null;
    deptId: string | null;
}

const processAnalyticsData = (data: { customers: Customer[], orders: Order[] }, filters: FilterParams) => {
    let filteredOrders = data.orders.filter(o => o.status === '有效');

    // 1. 基础过滤：部门 & 订单日期
    if (filters.deptId && filters.deptId !== 'all') {
        filteredOrders = filteredOrders.filter(o => o.deptName === filters.deptId);
    }
    if (filters.orderDateRange) {
        const [start, end] = filters.orderDateRange;
        filteredOrders = filteredOrders.filter(o => o.createdAt >= start && o.createdAt <= end);
    }

    // 2. 一卖/二卖识别（按 customerId 分组）
    const customerGroups: Record<string, Order[]> = {};
    data.orders.filter(o => o.status === '有效').forEach(o => {
        if (!customerGroups[o.customerId]) customerGroups[o.customerId] = [];
        customerGroups[o.customerId].push(o);
    });

    // 标注全量数据的类型，以便后续按部门聚合
    Object.values(customerGroups).forEach(group => {
        group.sort((a, b) => a.createdAt - b.createdAt);
        group.forEach((o, index) => {
            o.saleType = index === 0 ? '一卖' : '二卖';
        });
    });

    // 3. 计算指标 (KPIs)
    // 拥有该日期范围内标签的客户总数
    let targetCustomers = data.customers;
    if (filters.tagDateRange) {
        const [start, end] = filters.tagDateRange;
        targetCustomers = data.customers.filter(c =>
            c.tags.some(t => t.createdAt >= start && t.createdAt <= end)
        );
    }

    const buyingCustomerIds = new Set(filteredOrders.map(o => o.customerId));
    const firstSaleAmount = filteredOrders.filter(o => o.saleType === '一卖').reduce((sum, o) => sum + o.amount, 0);
    const repeatSaleAmount = filteredOrders.filter(o => o.saleType === '二卖').reduce((sum, o) => sum + o.amount, 0);

    const conversionRate = targetCustomers.length > 0
        ? (buyingCustomerIds.size / targetCustomers.length * 100).toFixed(1)
        : '0.0';

    const arpu = buyingCustomerIds.size > 0
        ? Math.round((firstSaleAmount + repeatSaleAmount) / buyingCustomerIds.size)
        : 0;

    // 4. 按部门分组的一卖/二卖堆栈数据
    const deptStats: Record<string, { first: number, repeat: number }> = {};
    DEPARTMENTS.forEach(d => deptStats[d] = { first: 0, repeat: 0 });

    filteredOrders.forEach(o => {
        if (deptStats[o.deptName]) {
            if (o.saleType === '一卖') deptStats[o.deptName].first += o.amount;
            else deptStats[o.deptName].repeat += o.amount;
        }
    });

    return {
        kpiCards: [
            { title: '成交转化率', value: `${conversionRate}%`, subtitle: '下单客户 / 目标范围标签客户' },
            { title: '单产 (ARPU)', value: `¥${arpu.toLocaleString()}`, subtitle: '平均每下单客户贡献' },
            { title: '一卖总额', value: `¥${firstSaleAmount.toLocaleString()}`, subtitle: '核心首单获客业绩' },
            { title: '二卖总额', value: `¥${repeatSaleAmount.toLocaleString()}`, subtitle: '复购深度转化业绩' },
        ],
        chartData: {
            depts: DEPARTMENTS,
            firstSales: DEPARTMENTS.map(d => deptStats[d].first),
            repeatSales: DEPARTMENTS.map(d => deptStats[d].repeat)
        },
        filteredOrders // 用于表格展示
    };
};

const Analytics: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState(() => generateMockSalesData(150));

    // --- 3. 筛选器联动与演示状态 (Component State) ---
    const [filters, setFilters] = useState<FilterParams>({
        tagDateRange: null,
        orderDateRange: null,
        deptId: 'all'
    });

    const analyticsResult = useMemo(() => processAnalyticsData(rawData, filters), [rawData, filters]);

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            setRawData(generateMockSalesData(150));
            setLoading(false);
        }, 800);
    };

    const barOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['一卖额', '二卖额'], bottom: 0 },
        grid: { top: '10%', left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', data: analyticsResult.chartData.depts },
        yAxis: { type: 'value', name: '业绩额' },
        series: [
            {
                name: '一卖额',
                type: 'bar',
                stack: 'total',
                emphasis: { focus: 'series' },
                data: analyticsResult.chartData.firstSales,
                itemStyle: { color: '#4facfe' }
            },
            {
                name: '二卖额',
                type: 'bar',
                stack: 'total',
                emphasis: { focus: 'series' },
                data: analyticsResult.chartData.repeatSales,
                itemStyle: { color: '#00f2fe' }
            },
        ]
    };

    const columns: ColumnsType<Order> = [
        { title: '订单编号', dataIndex: 'orderId', key: 'orderId' },
        { title: '客户 ID', dataIndex: 'customerId', key: 'customerId' },
        { title: '部门', dataIndex: 'deptName', key: 'deptName' },
        { title: '销售类型', dataIndex: 'saleType', key: 'saleType', render: (t) => <Tag color={t === '一卖' ? 'blue' : 'green'}>{t}</Tag> },
        { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v.toLocaleString()}` },
        { title: '状态', dataIndex: 'status', key: 'status' },
        { title: '日期', dataIndex: 'createdAt', key: 'createdAt', render: (t) => new Date(t).toLocaleDateString() },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>前端数据中心</Title>
                    <Tag color="processing">演示模式</Tag>
                </div>
                <div className={styles.headerExtra}>
                    <Space>
                        <Button
                            loading={loading}
                            onClick={handleRefresh}
                            icon={<FontAwesomeIcon icon={faRotateLeft} />}
                        >
                            随机刷新数据
                        </Button>
                        <Button icon={<FontAwesomeIcon icon={faDownload} />}>导出报表</Button>
                    </Space>
                </div>
            </div>

            {/* KPI Cards */}
            <Row gutter={16} className={styles.summaryRow}>
                {analyticsResult.kpiCards.map((card, idx) => (
                    <Col xs={12} sm={6} key={idx}>
                        <Card className={styles.summaryCard} loading={loading}>
                            <Statistic
                                title={card.title}
                                value={card.value}
                            />
                            <div className={styles.cardSubtitle}>{card.subtitle}</div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Filter Section */}
            <Card className={styles.filterCard}>
                <Row gutter={[24, 16]}>
                    <Col span={8}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>客户标签日期筛选 (Tag Range)：</Text>
                            <RangePicker
                                style={{ width: '100%' }}
                                onChange={(dates) => setFilters(prev => ({
                                    ...prev,
                                    tagDateRange: dates ? [dates[0]!.valueOf(), dates[1]!.valueOf()] : null
                                }))}
                            />
                        </Space>
                    </Col>
                    <Col span={8}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>业绩部门筛选 (Department)：</Text>
                            <Select
                                style={{ width: '100%' }}
                                value={filters.deptId}
                                onChange={(v) => setFilters(prev => ({ ...prev, deptId: v }))}
                                options={[
                                    { value: 'all', label: '全部部门' },
                                    ...DEPARTMENTS.map(d => ({ value: d, label: d }))
                                ]}
                            />
                        </Space>
                    </Col>
                    <Col span={8}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>订单日期筛选 (Order Range)：</Text>
                            <RangePicker
                                style={{ width: '100%' }}
                                onChange={(dates) => setFilters(prev => ({
                                    ...prev,
                                    orderDateRange: dates ? [dates[0]!.valueOf(), dates[1]!.valueOf()] : null
                                }))}
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={16}>
                    <Card title="部门销售结构 (一卖/二卖堆叠)" className={styles.chartCard} loading={loading}>
                        <ReactECharts option={barOption} style={{ height: 400 }} />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="分析建议" className={styles.chartCard} loading={loading}>
                        <div style={{ padding: '0 8px' }}>
                            <p>💡 <b>当前的单产 (ARPU) 比较:</b> ¥{analyticsResult.kpiCards[1].value}。如果单产过低，建议增加二次转化的跟进频率。</p>
                            <p>📊 <b>复购观察:</b> 二卖总额占比反映了存量客户的挖掘深度。如果二卖额远低于一卖额，说明后端转化能力有待加强。</p>
                            <div style={{ marginTop: 20 }}>
                                <Title level={5}>参与分析客户数</Title>
                                <Statistic value={analyticsResult.filteredOrders.length} suffix="有效订单" />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card
                title="本次筛选结果明细"
                className={styles.detailCard}
                style={{ marginTop: 16 }}
            >
                <Table
                    columns={columns}
                    dataSource={analyticsResult.filteredOrders}
                    rowKey="orderId"
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    size="small"
                />
            </Card>
        </div>
    );
};

export default Analytics;
