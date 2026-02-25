import React, { useState } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    Space,
    Tag,
    Typography,
    DatePicker,
    Select,
    Row,
    Col,
    Tabs,
} from 'antd';
import request from '../../../api/request';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faMagnifyingGlass, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './warehouse.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface StockRecordItem {
    id: string;
    /** 操作类型 */
    type: 'in' | 'out' | 'transfer' | 'return';
    /** 仓库 */
    warehouse: string;
    /** 商品名称 */
    productName: string;
    /** 规格 */
    spec: string;
    /** 数量 */
    quantity: number;
    /** 操作前库存 */
    beforeStock: number;
    /** 操作后库存 */
    afterStock: number;
    /** 入库单价（仅入库时有） */
    unitPrice?: number;
    /** 关联单号（订单号/退货单号等） */
    relatedNo?: string;
    /** 目标仓库（调库时有） */
    targetWarehouse?: string;
    /** 操作人 */
    operator: string;
    /** 备注 */
    remark?: string;
    /** 操作时间 */
    createdAt: string;
}

// 模拟出入库记录数据
/*
const mockData: StockRecordItem[] = [
    // 多商品退货单 RT2026020101 (2个商品)
    { id: 'new1', type: 'return', warehouse: '主仓', productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 2, beforeStock: 500, afterStock: 502, relatedNo: 'RT2026020101', operator: '王五', remark: '质量问题退货', createdAt: '2026-02-01 10:30:00' },
    { id: 'new2', type: 'return', warehouse: '主仓', productName: '代餐粉', spec: '500g/罐', quantity: 1, beforeStock: 45, afterStock: 46, relatedNo: 'RT2026020101', operator: '王五', remark: '质量问题退货', createdAt: '2026-02-01 10:30:00' },

    // 多商品销售出库单 ORD2026020101 (3个商品)
    { id: 'new3', type: 'out', warehouse: '主仓', productName: '瘦身胶囊B', spec: '90粒/盒', quantity: 5, beforeStock: 300, afterStock: 295, relatedNo: 'ORD2026020101', operator: '李四', remark: '销售出库', createdAt: '2026-02-01 09:15:00' },
    { id: 'new4', type: 'out', warehouse: '主仓', productName: '酵素饮', spec: '30袋/盒', quantity: 10, beforeStock: 60, afterStock: 50, relatedNo: 'ORD2026020101', operator: '李四', remark: '销售出库', createdAt: '2026-02-01 09:15:00' },
    { id: 'new5', type: 'out', warehouse: '分仓1', productName: '益生菌粉', spec: '2g*30袋', quantity: 20, beforeStock: 150, afterStock: 130, relatedNo: 'ORD2026020101', operator: '李四', remark: '销售出库', createdAt: '2026-02-01 09:15:00' },

    { id: '1', type: 'in', warehouse: '主仓', productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 100, beforeStock: 400, afterStock: 500, unitPrice: 150, operator: '张三', remark: '采购入库', createdAt: '2026-01-30 10:30:15' },
    { id: '2', type: 'out', warehouse: '主仓', productName: '瘦身胶囊B', spec: '90粒/盒', quantity: 20, beforeStock: 320, afterStock: 300, relatedNo: 'ORD2026013001', operator: '李四', remark: '订单出库', createdAt: '2026-01-30 09:15:30' },
    { id: '3', type: 'return', warehouse: '主仓', productName: '代餐粉', spec: '500g/罐', quantity: 5, beforeStock: 40, afterStock: 45, relatedNo: 'RT2026012901', operator: '王五', remark: '退货入库', createdAt: '2026-01-29 16:45:00' },
    { id: '4', type: 'transfer', warehouse: '主仓', productName: '酵素饮', spec: '30袋/盒', quantity: 30, beforeStock: 60, afterStock: 30, targetWarehouse: '分仓1', operator: '张三', remark: '调拨至分仓1', createdAt: '2026-01-29 14:20:00' },
    { id: '5', type: 'in', warehouse: '分仓1', productName: '酵素饮', spec: '30袋/盒', quantity: 30, beforeStock: 0, afterStock: 30, operator: '张三', remark: '调拨入库', createdAt: '2026-01-29 14:20:00' },
    { id: '6', type: 'in', warehouse: '主仓', productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 200, beforeStock: 200, afterStock: 400, unitPrice: 145, operator: '张三', remark: '采购入库', createdAt: '2026-01-28 11:00:00' },
    { id: '7', type: 'out', warehouse: '分仓2', productName: '代餐粉', spec: '500g/罐', quantity: 10, beforeStock: 50, afterStock: 40, relatedNo: 'ORD2026012801', operator: '李四', createdAt: '2026-01-28 10:00:00' },
    { id: '8', type: 'in', warehouse: '主仓', productName: '蛋白奶昔-香草味', spec: '750g/桶', quantity: 50, beforeStock: 30, afterStock: 80, unitPrice: 88, operator: '张三', remark: '采购入库', createdAt: '2026-01-27 15:30:00' },
    { id: '9', type: 'out', warehouse: '主仓', productName: '益生菌粉', spec: '2g*30袋', quantity: 15, beforeStock: 120, afterStock: 105, relatedNo: 'ORD2026012702', operator: '赵六', remark: '订单出库', createdAt: '2026-01-27 14:20:00' },
    { id: '10', type: 'transfer', warehouse: '主仓', productName: '左旋肉碱', spec: '60粒/瓶', quantity: 20, beforeStock: 100, afterStock: 80, targetWarehouse: '分仓2', operator: '王五', remark: '调拨至分仓2', createdAt: '2026-01-27 11:00:00' },
    { id: '11', type: 'in', warehouse: '分仓2', productName: '左旋肉碱', spec: '60粒/瓶', quantity: 20, beforeStock: 0, afterStock: 20, operator: '王五', remark: '调拨入库', createdAt: '2026-01-27 11:00:00' },
    { id: '12', type: 'return', warehouse: '分仓1', productName: '燃脂咖啡', spec: '15袋/盒', quantity: 3, beforeStock: 45, afterStock: 48, relatedNo: 'RT2026012601', operator: '李四', remark: '质量问题退货', createdAt: '2026-01-26 16:30:00' },
    { id: '13', type: 'in', warehouse: '主仓', productName: '膳食纤维片', spec: '120片/瓶', quantity: 80, beforeStock: 50, afterStock: 130, unitPrice: 65, operator: '张三', remark: '采购入库', createdAt: '2026-01-26 10:15:00' },
    { id: '14', type: 'out', warehouse: '分仓3', productName: '蛋白奶昔-巧克力味', spec: '750g/桶', quantity: 8, beforeStock: 60, afterStock: 52, relatedNo: 'ORD2026012601', operator: '赵六', createdAt: '2026-01-26 09:30:00' },
    { id: '15', type: 'in', warehouse: '分仓1', productName: '维生素B族', spec: '60片/瓶', quantity: 100, beforeStock: 80, afterStock: 180, unitPrice: 35, operator: '王五', remark: '采购入库', createdAt: '2026-01-25 14:00:00' },
    { id: '16', type: 'transfer', warehouse: '主仓', productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 50, beforeStock: 200, afterStock: 150, targetWarehouse: '分仓3', operator: '张三', remark: '调拨至分仓3', createdAt: '2026-01-25 11:30:00' },
    { id: '17', type: 'in', warehouse: '分仓3', productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 50, beforeStock: 0, afterStock: 50, operator: '张三', remark: '调拨入库', createdAt: '2026-01-25 11:30:00' },
    { id: '18', type: 'out', warehouse: '主仓', productName: '胶原蛋白肽', spec: '5g*20袋', quantity: 12, beforeStock: 90, afterStock: 78, relatedNo: 'ORD2026012501', operator: '李四', remark: '订单出库', createdAt: '2026-01-25 10:00:00' },
    { id: '19', type: 'return', warehouse: '主仓', productName: '魔芋代餐饼干', spec: '200g/盒', quantity: 2, beforeStock: 35, afterStock: 37, relatedNo: 'RT2026012401', operator: '王五', remark: '包装破损退货', createdAt: '2026-01-24 15:45:00' },
    { id: '20', type: 'in', warehouse: '主仓', productName: '减脂套餐(30天)', spec: '套餐组合', quantity: 20, beforeStock: 10, afterStock: 30, unitPrice: 399, operator: '张三', remark: '套餐组装入库', createdAt: '2026-01-24 11:00:00' },
    { id: '21', type: 'out', warehouse: '分仓2', productName: '酵素饮', spec: '30袋/盒', quantity: 25, beforeStock: 85, afterStock: 60, relatedNo: 'ORD2026012401', operator: '赵六', createdAt: '2026-01-24 09:20:00' },
    { id: '22', type: 'in', warehouse: '主仓', productName: '益生菌粉', spec: '2g*30袋', quantity: 150, beforeStock: 0, afterStock: 150, unitPrice: 78, operator: '张三', remark: '紧急补货', createdAt: '2026-01-23 16:00:00' },
    { id: '23', type: 'out', warehouse: '主仓', productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 35, beforeStock: 235, afterStock: 200, relatedNo: 'ORD2026012301', operator: '李四', remark: '批量订单出库', createdAt: '2026-01-23 14:30:00' },
];
*/

interface StockRecordGroup {
    groupId: string;
    items: StockRecordItem[];
    type: string;
    relatedNo?: string;
    operator: string;
    createdAt: string;
    remark?: string;
}

const StockRecords: React.FC = () => {
    const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState('sales');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [data, setData] = useState<StockRecordItem[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res: any = await request.get('/warehouses/logs');
            setData(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch stock logs failed', error);
        }
    };

    // 切换 Tab 或 筛选条件时重置分页
    React.useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [activeTab, typeFilter]);

    // 操作类型映射
    const typeMap: Record<string, { color: string; text: string }> = {
        in: { color: 'success', text: '采购入库' },
        out: { color: 'processing', text: '销售出库' },
        transfer: { color: 'warning', text: '调库' },
        return: { color: 'purple', text: '退货入库' },
    };

    // 根据 Tab 筛选数据
    const displayData = React.useMemo(() => {
        let filtered = data.filter(item => {
            if (activeTab === 'sales') {
                return ['out', 'return'].includes(item.type);
            } else {
                return ['in', 'transfer'].includes(item.type);
            }
        });

        // 此处可以添加其他过滤逻辑（如 search inputs）
        if (typeFilter) {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        return filtered;
    }, [activeTab, typeFilter]);

    // 根据 Tab 获取下拉选项
    const typeOptions = React.useMemo(() => {
        if (activeTab === 'sales') {
            return [
                { value: 'out', label: '销售出库' },
                { value: 'return', label: '退货入库' },
            ];
        } else {
            return [
                { value: 'in', label: '采购入库' },
                { value: 'transfer', label: '调库' },
            ];
        }
    }, [activeTab]);

    // 数据分组逻辑
    const groupedData = React.useMemo(() => {
        const groups: StockRecordGroup[] = [];
        let currentGroup: StockRecordGroup | null = null;

        displayData.forEach((item) => {
            // 如果有关联单号，尝试合并
            if (item.relatedNo) {
                if (currentGroup && currentGroup.relatedNo === item.relatedNo && currentGroup.type === item.type) {
                    currentGroup.items.push(item);
                } else {
                    currentGroup = {
                        groupId: item.relatedNo,
                        items: [item],
                        type: item.type,
                        relatedNo: item.relatedNo,
                        operator: item.operator,
                        createdAt: item.createdAt,
                        remark: item.remark,
                    };
                    groups.push(currentGroup);
                }
            } else {
                groups.push({
                    groupId: item.id,
                    items: [item],
                    type: item.type,
                    operator: item.operator,
                    createdAt: item.createdAt,
                    remark: item.remark,
                    relatedNo: undefined,
                });
                currentGroup = null;
            }
        });
        return groups;
    }, [displayData]);

    const pageGroups = React.useMemo(() => {
        const { current, pageSize } = pagination;
        const start = (current - 1) * pageSize;
        return groupedData.slice(start, start + pageSize);
    }, [groupedData, pagination]);

    const showUnitPrice = activeTab !== 'sales';
    const showRelatedNo = activeTab === 'sales';

    const columns: ColumnsType<StockRecordGroup> = React.useMemo(() => {
        return [
            {
                title: '订单信息',
                key: 'info',
                width: 200,
                render: (_, group) => {
                    const t = typeMap[group.type] || { color: 'default', text: group.type };
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div><Tag color={t.color}>{t.text}</Tag></div>
                            {showRelatedNo && group.relatedNo && (
                                <div><Text type="secondary" copyable>{group.relatedNo}</Text></div>
                            )}
                            <div style={{ color: '#999', fontSize: 13 }}>{group.createdAt}</div>
                        </div>
                    );
                },
            },
            {
                title: (
                    <div style={{ display: 'flex', padding: '0 8px' }}>
                        <div style={{ flex: 1, minWidth: 160 }}>商品名称</div>
                        <div style={{ width: 100, textAlign: 'center' }}>仓库</div>
                        <div style={{ width: 60, textAlign: 'right' }}>数量</div>
                        <div style={{ width: 140, textAlign: 'right' }}>库存变更</div>
                        {showUnitPrice && <div style={{ width: 90, textAlign: 'right' }}>单价</div>}
                    </div>
                ),
                key: 'details',
                width: 750,
                render: (_, group) => (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {group.items.map((item, idx) => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    padding: '8px',
                                    borderBottom: idx === group.items.length - 1 ? 'none' : '1px dashed #f0f0f0',
                                    alignItems: 'center'
                                }}
                            >
                                {/* 商品 & 规格 */}
                                <div style={{ flex: 1, minWidth: 160 }}>
                                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                    <div style={{ fontSize: 12, color: '#999' }}>{item.spec}</div>
                                </div>

                                {/* 仓库 */}
                                <div style={{ width: 100, textAlign: 'center', color: '#666' }}>
                                    {item.type === 'transfer' && item.targetWarehouse ? (
                                        <span>{item.warehouse} <span style={{ color: '#faad14' }}>→</span> {item.targetWarehouse}</span>
                                    ) : (
                                        item.warehouse
                                    )}
                                </div>

                                {/* 数量 */}
                                <div style={{ width: 60, textAlign: 'right' }}>
                                    <Text strong type={item.type === 'out' || item.type === 'transfer' ? 'danger' : 'success'}>
                                        {item.type === 'out' || item.type === 'transfer' ? '-' : '+'}{item.quantity}
                                    </Text>
                                </div>

                                {/* 库存变更 */}
                                <div style={{ width: 140, textAlign: 'right' }}>
                                    <Text strong type={item.type === 'out' || item.type === 'transfer' ? 'danger' : 'success'}>
                                        {item.beforeStock} <span style={{ color: '#ccc' }}>→</span> {item.afterStock}
                                    </Text>
                                </div>

                                {/* 单价 */}
                                {showUnitPrice && (
                                    <div style={{ width: 90, textAlign: 'right' }}>
                                        {item.unitPrice ? `¥${item.unitPrice.toFixed(2)}` : '-'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ),
            },
            {
                title: '操作人',
                dataIndex: 'operator',
                key: 'operator',
                width: 100,
            },
            {
                title: '备注',
                dataIndex: 'remark',
                key: 'remark',
                render: (r) => <Text type="secondary" style={{ fontSize: 13 }}>{r || '-'}</Text>,
            },
        ];
    }, [pageGroups, activeTab, typeMap]); // typeMap ref dependency

    // 导出功能
    const handleExport = () => {
        console.log('导出出入库记录');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>出入库记录</Title>
                <Button icon={<FontAwesomeIcon icon={faDownload} />} onClick={handleExport}>
                    导出记录
                </Button>
            </div>

            <Card className={styles.card}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => {
                        setActiveTab(key);
                        setTypeFilter(undefined);
                    }}
                    items={[
                        { key: 'sales', label: '销售/退货记录' },
                        { key: 'others', label: '入库/出库记录' },
                    ]}
                    style={{ marginBottom: 16 }}
                />

                {/* 搜索区 */}
                <div className={styles.searchArea}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={5}>
                            <Input placeholder="商品名称" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                placeholder="操作类型"
                                style={{ width: '100%' }}
                                allowClear
                                value={typeFilter}
                                onChange={setTypeFilter}
                                options={typeOptions}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                placeholder="仓库"
                                style={{ width: '100%' }}
                                allowClear
                                options={[
                                    { value: '主仓', label: '主仓' },
                                    { value: '分仓1', label: '分仓1' },
                                    { value: '分仓2', label: '分仓2' },
                                    { value: '分仓3', label: '分仓3' },
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <Space>
                                <Button type="primary" icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>搜索</Button>
                                <Button icon={<FontAwesomeIcon icon={faRotateRight} />}>重置</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                {/* 表格区 */}
                <Table
                    columns={columns}
                    dataSource={pageGroups}
                    rowKey="groupId"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: groupedData.length,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 单记录`,
                    }}
                    onChange={(p) => setPagination({ current: p.current || 1, pageSize: p.pageSize || 10 })}
                    scroll={{ x: 1200 }}
                />
            </Card>
        </div>
    );
};

export default StockRecords;
