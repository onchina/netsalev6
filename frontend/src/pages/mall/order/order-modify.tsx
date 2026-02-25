import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Space, Tag, Modal, Typography, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMagnifyingGlass,
    faPenToSquare,
    faRotateRight,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../../api/request';
import styles from './order-list.module.css';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const OrderModify: React.FC = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res: any = await request.get('/orders/modifiable');
            const list = res?.data?.data?.items || res?.data?.items || res?.data?.data || res?.data || [];
            setOrders(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Fetch modifiable orders failed', error);
        } finally {
            setLoading(false);
        }
    };

    const statusMap: Record<string, { color: string; text: string }> = {
        draft: { color: 'blue', text: '草稿' },
        approved: { color: 'green', text: '已通过' },
        manager_rejected: { color: 'red', text: '经理驳回' },
        finance_rejected: { color: 'red', text: '财务驳回' },
        pending: { color: 'orange', text: '待审核' },
    };

    const handleEdit = (record: any) => {
        navigate(`/mall/order/create?id=${record.id}`);
    };

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除订单 ${record.orderNo} 吗？`,
            okType: 'danger',
            onOk: async () => {
                try {
                    await request.delete(`/orders/${record.id}`);
                    message.success('删除成功');
                    fetchOrders();
                } catch (e) {
                    message.error('删除失败');
                }
            },
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
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const config = statusMap[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<FontAwesomeIcon icon={faPenToSquare} />}
                        onClick={() => handleEdit(record)}
                    >
                        修改
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<FontAwesomeIcon icon={faTrash} />}
                        onClick={() => handleDelete(record)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    const filteredOrders = orders.filter((o) => {
        if (!searchText) return true;
        const s = searchText.toLowerCase();
        return (o.orderNo || '').toLowerCase().includes(s) || (o.customerName || '').toLowerCase().includes(s);
    });

    return (
        <div>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>修改订单</Title>
            </div>

            <Card className={styles.card}>
                <div className={styles.searchArea}>
                    <Space>
                        <Input
                            placeholder="订单编号 / 客户姓名"
                            prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                            style={{ width: 250 }}
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

export default OrderModify;
