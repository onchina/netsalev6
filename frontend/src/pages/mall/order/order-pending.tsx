import React, { useState } from 'react';
import { Card, Table, Input, Button, Space, Modal, message, Typography, Tag, Tooltip, Select, DatePicker, Form } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleInfo,
    faFileExport,
    faMagnifyingGlass,
    faPaperPlane,
    faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../../api/request';
import { useEffect } from 'react';
import styles from './order-list.module.css';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
}

interface ShippingRecord {
    id: string;
    orderNo: string;
    customerName: string;
    customerPhone: string;
    address: string;
    totalAmount: number;
    orderType: string;
    staffName: string;
    items: OrderItem[];
    status: 'pending';
    createdAt: string;
}

// 演示数据
/*
const mockPendingData: ShippingRecord[] = [
    {
        id: '1001',
        orderNo: 'ORD202602130001',
        customerName: '王大锤',
        customerPhone: '13812345678',
        address: '北京市朝阳区三里屯街道15号',
        totalAmount: 1298.00,
        orderType: '新单',
        staffName: '张经理',
        items: [{ id: 'p1', productName: '经典瘦身装', quantity: 2 }],
        status: 'pending',
        createdAt: '2026-02-13 14:20:00'
    },
    {
        id: '1002',
        orderNo: 'ORD202602130002',
        customerName: '李美美',
        customerPhone: '13988887777',
        address: '上海市浦东新区张江高科纳贤路',
        totalAmount: 598.00,
        orderType: '升级单',
        staffName: '王主管',
        items: [{ id: 'p3', productName: '强力燃脂胶囊', quantity: 1 }],
        status: 'pending',
        createdAt: '2026-02-13 15:10:00'
    },
    {
        id: '1003',
        orderNo: 'ORD202602130003',
        customerName: '刘备',
        customerPhone: '13700001111',
        address: '四川省成都市武侯区锦绣路',
        totalAmount: 2450.00,
        orderType: '新单',
        staffName: '李老师',
        items: [{ id: 'p1', productName: '经典瘦身装', quantity: 3 }],
        status: 'pending',
        createdAt: '2026-02-13 16:05:00'
    }
];
*/

const OrderPending: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [loading, setLoading] = useState(false);
    const [shipModalVisible, setShipModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<ShippingRecord | null>(null);
    const [form] = Form.useForm();
    const [orders, setOrders] = useState<ShippingRecord[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res: any = await request.get('/orders?status=pending');
            setOrders(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch pending orders failed', error);
        }
    };

    const handleOpenShipModal = (record: ShippingRecord) => {
        setCurrentRecord(record);
        form.resetFields();
        setShipModalVisible(true);
    };

    const handleConfirmShip = async () => {
        try {
            await form.validateFields();
            setLoading(true);
            // 模拟发货逻辑
            setTimeout(() => {
                message.success(`订单 ${currentRecord?.orderNo} 已填单并已发货！`);
                setShipModalVisible(false);
                setLoading(false);
            }, 800);
        } catch (error) {
            // 验证失败
        }
    };

    const columns: ColumnsType<ShippingRecord> = [
        {
            title: '订单详情',
            dataIndex: 'orderNo',
            key: 'orderNo',
            width: 180,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong copyable>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.createdAt}</Text>
                    <Tag color="blue" style={{ marginTop: 4 }}>{record.orderType}</Tag>
                </Space>
            )
        },
        {
            title: '客户信息',
            key: 'customer',
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.customerName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.customerPhone}</Text>
                </Space>
            )
        },
        {
            title: '收货地址',
            dataIndex: 'address',
            key: 'address',
            ellipsis: true,
            render: (address) => <Tooltip title={address}>{address}</Tooltip>
        },
        {
            title: '商品明细',
            dataIndex: 'items',
            key: 'items',
            width: 160,
            render: (items: OrderItem[]) => (
                <div style={{ fontSize: 13 }}>
                    {items.map((item, idx) => (
                        <div key={idx}>• {item.productName} x{item.quantity}</div>
                    ))}
                </div>
            )
        },
        {
            title: '操作',
            key: 'action',
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        size="small"
                        icon={<FontAwesomeIcon icon={faPaperPlane} />}
                        onClick={() => handleOpenShipModal(record)}
                        style={{ padding: 0 }}
                    >
                        发货
                    </Button>

                    <Button
                        type="link"
                        size="small"
                        icon={<FontAwesomeIcon icon={faCircleInfo} />}
                        style={{ padding: 0 }}
                    >
                        详情
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Card className={styles.mainCard} size="small">
                <div className={styles.toolbar}>
                    <Space size="middle" wrap>
                        <Space>
                            <Input
                                placeholder="订单号/姓名/电话"
                                prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                                style={{ width: 220 }}
                            />
                            <RangePicker style={{ width: 260 }} />
                        </Space>
                        <Space>
                            <Button type="primary">查询</Button>
                            <Button icon={<FontAwesomeIcon icon={faRotateRight} />}>重置</Button>
                        </Space>
                    </Space>

                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Button icon={<FontAwesomeIcon icon={faFileExport} />} disabled={selectedRowKeys.length === 0}>批量导出</Button>
                        </Space>
                        <Text type="secondary">
                            待发货订单共 <Text strong>{orders.length}</Text> 笔
                        </Text>
                    </div>
                </div>

                <Table
                    rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    loading={loading}
                    size="small"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title="订单发货"
                open={shipModalVisible}
                onCancel={() => setShipModalVisible(false)}
                onOk={handleConfirmShip}
                confirmLoading={loading}
                okText="立即发货"
                cancelText="取消"
                width={500}
            >
                <div style={{ marginBottom: 20 }}>
                    <p>订单号: <Text strong>{currentRecord?.orderNo}</Text></p>
                    <p>收货人: <Text strong>{currentRecord?.customerName} ({currentRecord?.customerPhone})</Text></p>
                    <p>收货地址: <Text type="secondary">{currentRecord?.address}</Text></p>
                </div>

                <Form form={form} layout="vertical">
                    <Form.Item
                        name="courierCompany"
                        label="快递公司"
                        rules={[{ required: true, message: '请选择快递公司' }]}
                    >
                        <Select placeholder="请选择快递公司">
                            <Select.Option value="sf">顺丰速运</Select.Option>
                            <Select.Option value="yt">圆通快递</Select.Option>
                            <Select.Option value="zt">中通快递</Select.Option>
                            <Select.Option value="yd">韵达快递</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="trackingNo"
                        label="快递单号"
                        rules={[{ required: true, message: '请输入快递单号' }]}
                    >
                        <Input placeholder="请输入真实的运单号" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default OrderPending;
