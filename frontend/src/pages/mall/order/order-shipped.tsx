import React, { useState } from 'react';
import {
    Card, Table, Input, Button, Space, Tag, Modal,
    Typography, Tooltip
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleCheck,
    faClockRotateLeft,
    faFileExport,
    faMagnifyingGlass,
    faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../../api/request';
import { useEffect } from 'react';
import styles from './order-list.module.css';

const { Text } = Typography;

interface ShippingRecord {
    id: string;
    orderNo: string;
    customerName: string;
    customerPhone: string;
    address: string;
    totalAmount: number;
    trackingNo: string;
    courierCompany: string;
    status: 'shipped';
    createdAt: string;
    shippedAt: string;
}

// 演示数据 (仅包含已发货)
/*
const mockShippedData: ShippingRecord[] = [
    {
        id: 's3',
        orderNo: 'ORD202602110008',
        customerName: '陈好',
        customerPhone: '13311112222',
        address: '湖北省武汉市江汉区解放大道',
        totalAmount: 880.00,
        trackingNo: 'YT2345678901',
        courierCompany: '圆通快递',
        status: 'shipped',
        createdAt: '2026-02-11 15:45',
        shippedAt: '2026-02-12 10:00'
    },
    {
        id: 's4',
        orderNo: 'ORD202602100012',
        customerName: '张伟',
        customerPhone: '13599990000',
        address: '广东省广州市天河区花城大道',
        totalAmount: 1560.00,
        trackingNo: 'SF9876543210',
        courierCompany: '顺丰速运',
        status: 'shipped',
        createdAt: '2026-02-10 11:30',
        shippedAt: '2026-02-11 09:15'
    }
];
*/

const OrderShipped: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [orders, setOrders] = useState<ShippingRecord[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res: any = await request.get('/orders?status=shipped');
            setOrders(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch shipped orders failed', error);
        }
    };

    const handleViewTrack = (record: ShippingRecord) => {
        Modal.info({
            title: '物流追踪',
            width: 600,
            content: (
                <div style={{ marginTop: 16 }}>
                    <p>订单号: <Text strong>{record.orderNo}</Text></p>
                    <p>物流公司: <Tag color="blue">{record.courierCompany}</Tag></p>
                    <p>运单号: <Text strong>{record.trackingNo}</Text></p>
                    <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: 8, marginTop: 16 }}>
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">[2026-02-13 10:00]</Text> 快递已到达上海分拨中心
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary">[2026-02-12 18:30]</Text> 您的包裹已由快递公司收入
                        </div>
                        <div>
                            <Text type="secondary">[2026-02-12 10:00]</Text> 商家已发货，待揽收
                        </div>
                    </div>
                </div>
            ),
            okText: '已阅',
        });
    };

    const columns: ColumnsType<ShippingRecord> = [
        {
            title: '订单信息',
            key: 'order',
            width: 180,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong copyable>{record.orderNo}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>下单: {record.createdAt}</Text>
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
            render: (text) => <Tooltip title={text}>{text}</Tooltip>
        },
        {
            title: '物流详情',
            key: 'logistics',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color="cyan" style={{ border: 'none' }}>{record.courierCompany}</Tag>
                    <Text strong style={{ fontSize: 13 }}>{record.trackingNo}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>发货: {record.shippedAt}</Text>
                </Space>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: () => <Tag icon={<FontAwesomeIcon icon={faCircleCheck} />} color="success">已发货</Tag>
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        size="small"
                        icon={<FontAwesomeIcon icon={faClockRotateLeft} />}
                        onClick={() => handleViewTrack(record)}
                        style={{ padding: 0 }}
                    >
                        轨迹
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Space>
                            <Input placeholder="订单号/手机号/物流号" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 220 }} />
                            <Button type="primary">查询</Button>
                            <Button icon={<FontAwesomeIcon icon={faRotateRight} />}>刷新</Button>
                        </Space>
                        <Space>
                            <Button icon={<FontAwesomeIcon icon={faFileExport} />} disabled={selectedRowKeys.length === 0}>导出记录</Button>
                        </Space>
                    </div>

                    <Table
                        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                        columns={columns}
                        dataSource={orders}
                        rowKey="id"
                        size="small"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `共 ${total} 条发货记录`,
                        }}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default OrderShipped;
