import React, { useState } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    Space,
    Tag,
    Typography,
    Modal,
    Form,
    Select,
    InputNumber,
    message,
    Descriptions,
} from 'antd';
import request from '../../../api/request';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faMagnifyingGlass, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './warehouse.module.css';

const { Title, Text } = Typography;

// 退货商品明细
interface ReturnProduct {
    productName: string;
    spec: string;
    quantity: number;
}

interface ReturnOrderItem {
    id: string;
    /** 退货单号 */
    returnNo: string;
    /** 关联订单号 */
    orderNo: string;
    /** 客户姓名 */
    customerName: string;
    /** 退货商品列表 */
    products: ReturnProduct[];
    /** 退货原因 */
    reason: string;
    /** 入库状态 */
    status: 'pending' | 'completed';
    /** 创建时间 */
    createdAt: string;
}

// 模拟退货待入库数据（支持多产品）
/*
const mockData: ReturnOrderItem[] = [
    { id: '1', returnNo: 'RT2026013001', orderNo: 'ORD2026012501', customerName: '王小明', products: [{ productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 2 }, { productName: '代餐粉', spec: '500g/罐', quantity: 1 }], reason: '质量问题', status: 'pending', createdAt: '2026-01-30 10:30' },
    { id: '2', returnNo: 'RT2026012901', orderNo: 'ORD2026012301', customerName: '李小红', products: [{ productName: '益生菌粉', spec: '2g*30袋', quantity: 1 }], reason: '七天无理由', status: 'pending', createdAt: '2026-01-29 14:20' },
    { id: '3', returnNo: 'RT2026012801', orderNo: 'ORD2026012001', customerName: '赵小刚', products: [{ productName: '酵素饮', spec: '30袋/盒', quantity: 3 }, { productName: '燃脂咖啡', spec: '15袋/盒', quantity: 2 }], reason: '发错商品', status: 'completed', createdAt: '2026-01-28 09:15' },
    { id: '4', returnNo: 'RT2026012701', orderNo: 'ORD2026011901', customerName: '张美丽', products: [{ productName: '蛋白奶昔-香草味', spec: '750g/桶', quantity: 1 }, { productName: '蛋白奶昔-巧克力味', spec: '750g/桶', quantity: 1 }, { productName: '膳食纤维片', spec: '120片/瓶', quantity: 2 }], reason: '口味不合', status: 'pending', createdAt: '2026-01-27 16:45' },
    { id: '5', returnNo: 'RT2026012601', orderNo: 'ORD2026011801', customerName: '刘建国', products: [{ productName: '左旋肉碱', spec: '60粒/瓶', quantity: 2 }], reason: '过敏反应', status: 'pending', createdAt: '2026-01-26 11:20' },
    { id: '6', returnNo: 'RT2026012501', orderNo: 'ORD2026011701', customerName: '陈小华', products: [{ productName: '膳食纤维片', spec: '120片/瓶', quantity: 1 }, { productName: '维生素B族', spec: '60片/瓶', quantity: 1 }], reason: '七天无理由', status: 'completed', createdAt: '2026-01-25 09:00' },
    { id: '7', returnNo: 'RT2026012401', orderNo: 'ORD2026011601', customerName: '周文静', products: [{ productName: '燃脂咖啡', spec: '15袋/盒', quantity: 4 }], reason: '包装破损', status: 'pending', createdAt: '2026-01-24 15:30' },
    { id: '8', returnNo: 'RT2026012301', orderNo: 'ORD2026011501', customerName: '吴志强', products: [{ productName: '减脂套餐(30天)', spec: '套餐组合', quantity: 1 }], reason: '效果不佳', status: 'completed', createdAt: '2026-01-23 10:10' },
    { id: '9', returnNo: 'RT2026012201', orderNo: 'ORD2026011401', customerName: '杨秀英', products: [{ productName: '瘦身胶囊B', spec: '90粒/盒', quantity: 2 }, { productName: '瘦身胶囊A', spec: '60粒/盒', quantity: 1 }], reason: '质量问题', status: 'pending', createdAt: '2026-01-22 14:55' },
    { id: '10', returnNo: 'RT2026012101', orderNo: 'ORD2026011301', customerName: '黄大伟', products: [{ productName: '魔芋代餐饼干', spec: '200g/盒', quantity: 5 }, { productName: '代餐粉', spec: '500g/罐', quantity: 2 }], reason: '发错商品', status: 'completed', createdAt: '2026-01-21 08:40' },
    { id: '11', returnNo: 'RT2026012002', orderNo: 'ORD2026011202', customerName: '林小芳', products: [{ productName: '胶原蛋白肽', spec: '5g*20袋', quantity: 3 }], reason: '七天无理由', status: 'pending', createdAt: '2026-01-20 17:25' },
    { id: '12', returnNo: 'RT2026012001', orderNo: 'ORD2026011201', customerName: '郑明辉', products: [{ productName: '减脂套餐(60天)', spec: '套餐组合', quantity: 1 }, { productName: '益生菌粉', spec: '2g*30袋', quantity: 2 }], reason: '口味不合', status: 'pending', createdAt: '2026-01-20 11:15' },
];
*/

// 仓库列表（与仓库设置保持一致）
const warehouses = [
    { id: 'WH001', name: '主仓', isDefault: true },
    { id: 'WH002', name: '分仓1', isDefault: false },
    { id: 'WH003', name: '分仓2', isDefault: false },
    { id: 'WH004', name: '分仓3', isDefault: false },
];

const ReturnStock: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ReturnOrderItem | null>(null);
    const [form] = Form.useForm();
    const [data, setData] = useState<ReturnOrderItem[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res: any = await request.get('/warehouses/returns');
            setData(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch returns failed', error);
        }
    };

    // 打开入库弹窗
    const handleOpenModal = (item: ReturnOrderItem) => {
        setSelectedItem(item);
        form.resetFields();
        setModalVisible(true);
    };

    // 确认入库
    const handleConfirm = () => {
        form.validateFields().then((values) => {
            console.log('退货入库:', { ...selectedItem, ...values });
            message.success('退货入库成功！');
            setModalVisible(false);
        });
    };

    // 状态映射
    const statusMap: Record<string, { color: string; text: string }> = {
        pending: { color: 'orange', text: '待入库' },
        completed: { color: 'green', text: '已入库' },
    };

    const columns: ColumnsType<ReturnOrderItem> = [
        {
            title: '退货单号',
            dataIndex: 'returnNo',
            key: 'returnNo',
            width: 140,
        },
        {
            title: '关联订单',
            dataIndex: 'orderNo',
            key: 'orderNo',
            width: 140,
            render: (no: string) => (
                <Button type="link" size="small" style={{ padding: 0 }}>{no}</Button>
            ),
        },
        {
            title: '客户姓名',
            dataIndex: 'customerName',
            key: 'customerName',
            width: 100,
        },
        {
            title: '退货商品',
            key: 'products',
            width: 280,
            render: (_, record) => (
                <div style={{ fontSize: 12 }}>
                    {record.products.map((p, idx) => (
                        <div key={idx} style={{ marginBottom: idx < record.products.length - 1 ? 4 : 0 }}>
                            <Text>{p.productName}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>{p.spec}</Text>
                            <Text strong style={{ marginLeft: 8 }}>×{p.quantity}</Text>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: '退货原因',
            dataIndex: 'reason',
            key: 'reason',
            width: 100,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const s = statusMap[status] || { color: 'default', text: status };
                return <Tag color={s.color}>{s.text}</Tag>;
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' ? (
                        <Button
                            type="primary"
                            size="small"
                            icon={<FontAwesomeIcon icon={faArrowRotateLeft} />}
                            onClick={() => handleOpenModal(record)}
                        >
                            确认入库
                        </Button>
                    ) : (
                        <Button type="link" size="small">查看详情</Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Title level={4}>退货入库</Title>

            <Card className={styles.card}>
                {/* 搜索区 */}
                <div className={styles.searchArea}>
                    <Space>
                        <Input placeholder="退货单号 / 订单号" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 200 }} />
                        <Select
                            placeholder="入库状态"
                            style={{ width: 120 }}
                            allowClear
                            options={[
                                { value: 'pending', label: '待入库' },
                                { value: 'completed', label: '已入库' },
                            ]}
                        />
                        <Button type="primary" icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>搜索</Button>
                        <Button icon={<FontAwesomeIcon icon={faRotateRight} />}>重置</Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    pagination={{
                        total: data.length,
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    scroll={{ x: 1300 }}
                />
            </Card>

            {/* 入库确认弹窗 */}
            <Modal
                title="退货入库确认"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleConfirm}
                okText="确认入库"
            >
                {selectedItem && (
                    <>
                        <Descriptions column={2} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="退货单号">{selectedItem.returnNo}</Descriptions.Item>
                            <Descriptions.Item label="关联订单">{selectedItem.orderNo}</Descriptions.Item>
                            <Descriptions.Item label="客户姓名">{selectedItem.customerName}</Descriptions.Item>
                            <Descriptions.Item label="退货原因">{selectedItem.reason}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>退货商品明细（支持部分入库）：</Text>
                            <Form form={form} layout="vertical">
                                <Table
                                    size="small"
                                    dataSource={selectedItem.products.map((p, idx) => ({ ...p, key: idx, idx }))}
                                    columns={[
                                        { title: '商品名称', dataIndex: 'productName', key: 'productName', width: 140 },
                                        { title: '规格', dataIndex: 'spec', key: 'spec', width: 80 },
                                        {
                                            title: '退货数量',
                                            dataIndex: 'quantity',
                                            key: 'quantity',
                                            width: 70,
                                            render: (qty: number) => <Text type="secondary">{qty}</Text>
                                        },
                                        {
                                            title: '入库数量',
                                            key: 'stockInQty',
                                            width: 90,
                                            render: (_, record: { idx: number; quantity: number }) => (
                                                <Form.Item
                                                    name={['products', record.idx, 'stockInQty']}
                                                    initialValue={record.quantity}
                                                    style={{ margin: 0 }}
                                                    rules={[{ required: true, message: '必填' }]}
                                                >
                                                    <InputNumber min={0} max={record.quantity} size="small" style={{ width: 60 }} />
                                                </Form.Item>
                                            ),
                                        },
                                        {
                                            title: '商品状态',
                                            key: 'condition',
                                            width: 120,
                                            render: (_, record: { idx: number }) => (
                                                <Form.Item
                                                    name={['products', record.idx, 'condition']}
                                                    initialValue="good"
                                                    style={{ margin: 0 }}
                                                    rules={[{ required: true, message: '必选' }]}
                                                >
                                                    <Select
                                                        size="small"
                                                        style={{ width: 100 }}
                                                        options={[
                                                            { value: 'good', label: '完好' },
                                                            { value: 'damaged', label: '轻微损坏' },
                                                            { value: 'broken', label: '严重损坏' },
                                                        ]}
                                                    />
                                                </Form.Item>
                                            ),
                                        },
                                    ]}
                                    pagination={false}
                                />
                                <Form.Item
                                    label="入库仓库"
                                    name="warehouseId"
                                    rules={[{ required: true, message: '请选择入库仓库' }]}
                                    initialValue="WH001"
                                    style={{ marginTop: 16 }}
                                >
                                    <Select
                                        placeholder="请选择入库仓库"
                                        options={warehouses.map(w => ({ value: w.id, label: w.name + (w.isDefault ? '（默认）' : '') }))}
                                    />
                                </Form.Item>
                                <Form.Item label="入库备注" name="remark">
                                    <Input.TextArea rows={2} placeholder="请输入入库备注" />
                                </Form.Item>
                            </Form>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default ReturnStock;
