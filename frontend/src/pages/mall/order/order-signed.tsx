import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Space, Tag, Modal, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faMagnifyingGlass, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-regular-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../../api/request';
import styles from './order-list.module.css';

const { Title } = Typography;

const OrderSigned: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res: any = await request.get('/orders', { params: { status: 'signed' } });
            const list = res?.data?.data?.items || res?.data?.items || res?.data?.data || res?.data || [];
            setOrders(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Fetch signed orders failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (record: any) => {
        Modal.info({
            title: '订单详情',
            width: 500,
            content: (
                <div style={{ lineHeight: 2 }}>
                    <p>订单编号：{record.orderNo}</p>
                    <p>客户姓名：{record.customerName}</p>
                    <p>销售：{record.salesName || '-'}</p>
                    <p>订单金额：¥{(record.totalAmount ?? 0).toFixed(2)}</p>
                    <p>快递公司：{record.courierCompany || '-'}</p>
                    <p>快递单号：{record.trackingNo || '-'}</p>
                    <p>签收时间：{record.signedAt || '-'}</p>
                </div>
            )
        });
    };

    const columns: ColumnsType<any> = [
        { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
        { title: '客户姓名', dataIndex: 'customerName', key: 'customerName', width: 100 },
        { title: '销售', dataIndex: 'salesName', key: 'salesName', width: 80 },
        {
            title: '订单金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 110,
            render: (val: number) => `¥${(val ?? 0).toFixed(2)}`,
        },
        { title: '快递公司', dataIndex: 'courierCompany', key: 'courierCompany', width: 100 },
        { title: '快递单号', dataIndex: 'trackingNo', key: 'trackingNo', width: 150 },
        {
            title: '状态',
            key: 'status',
            width: 100,
            render: () => <Tag color="green"><FontAwesomeIcon icon={faCircleCheck} /> 已签收</Tag>,
        },
        { title: '签收时间', dataIndex: 'signedAt', key: 'signedAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    icon={<FontAwesomeIcon icon={faEye} />}
                    onClick={() => handleView(record)}
                >
                    查看
                </Button>
            ),
        },
    ];

    const filteredOrders = orders.filter((o) => {
        if (!searchText) return true;
        const s = searchText.toLowerCase();
        return (
            (o.orderNo || '').toLowerCase().includes(s) ||
            (o.customerName || '').toLowerCase().includes(s) ||
            (o.trackingNo || '').toLowerCase().includes(s)
        );
    });

    return (
        <div>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>已签收订单</Title>
            </div>

            <Card className={styles.card}>
                <div className={styles.searchArea}>
                    <Space>
                        <Input
                            placeholder="订单编号 / 客户姓名 / 快递单号"
                            prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                            style={{ width: 280 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                        <Button icon={<FontAwesomeIcon icon={faRotateRight} />} onClick={() => { setSearchText(''); fetchOrders(); }}>重置</Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        total: filteredOrders.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                />
            </Card>
        </div>
    );
};

export default OrderSigned;
