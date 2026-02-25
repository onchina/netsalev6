import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Typography } from 'antd';
import request from '../../api/request';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './opportunity.module.css';

const { Title } = Typography;

// 模拟待办工单数据
/*
const mockTodoList = [
    { id: '1', type: '回访', content: '客户王小明需要回访', status: 'pending', deadline: '2026-01-31' },
    { id: '2', type: '跟进', content: '客户李小红意向升单', status: 'pending', deadline: '2026-02-01' },
];

// 模拟我的订单数据
const mockMyOrders = [
    { id: 'ORD2026013001', customerName: '王小明', amount: 596, status: 'completed', createdAt: '2026-01-30' },
    { id: 'ORD2026012902', customerName: '李小红', amount: 398, status: 'pending', createdAt: '2026-01-29' },
];

// 模拟待办审批数据
const mockApprovals = [
    { id: '1', type: '退款审批', content: '订单 ORD2026013001 申请退款', status: 'pending', createdAt: '2026-01-30' },
];

// 模拟商机订单数据
const mockOpportunities = [
    { id: '1', customerName: '赵小刚', source: '抖音', intention: '高', estimatedAmount: 1000, status: 'following', createdAt: '2026-01-30' },
    { id: '2', customerName: '孙小芳', source: '微信', intention: '中', estimatedAmount: 500, status: 'new', createdAt: '2026-01-29' },
];
*/

const Opportunity: React.FC = () => {
    const [todoList, setTodoList] = useState<any[]>([]);
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [opportunities, setOpportunities] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [todoRes, orderRes, approvalRes, oppRes]: any = await Promise.all([
                request.get('/opportunity/todo'),
                request.get('/opportunity/orders'),
                request.get('/opportunity/approvals'),
                request.get('/opportunity/list')
            ]);
            setTodoList(Array.isArray(todoRes) ? todoRes : todoRes?.data?.items || todoRes?.data || []);
            setMyOrders(Array.isArray(orderRes) ? orderRes : orderRes?.data?.items || orderRes?.data || []);
            setApprovals(Array.isArray(approvalRes) ? approvalRes : approvalRes?.data?.items || approvalRes?.data || []);
            setOpportunities(Array.isArray(oppRes) ? oppRes : oppRes?.data?.items || oppRes?.data || []);
        } catch (error) {
            console.error('Fetch dashboard data failed', error);
        }
    };

    // 待办工单列
    const todoColumns: ColumnsType<any> = [
        { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (type: string) => <Tag color="blue">{type}</Tag> },
        { title: '内容', dataIndex: 'content', key: 'content' },
        { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: () => <Tag color="orange">待处理</Tag> },
        { title: '截止日期', dataIndex: 'deadline', key: 'deadline', width: 120 },
        { title: '操作', key: 'action', width: 100, render: () => <Button type="link" size="small">处理</Button> },
    ];

    // 我的订单列
    const orderColumns: ColumnsType<any> = [
        { title: '订单编号', dataIndex: 'id', key: 'id', width: 150 },
        { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 100 },
        { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => `¥${v}` },
        {
            title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => (
                <Tag color={status === 'completed' ? 'green' : 'orange'}>
                    {status === 'completed' ? '已完成' : '待处理'}
                </Tag>
            )
        },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    ];

    // 待办审批列
    const approvalColumns: ColumnsType<any> = [
        { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag color="purple">{type}</Tag> },
        { title: '内容', dataIndex: 'content', key: 'content' },
        { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: () => <Tag color="orange">待审批</Tag> },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
        {
            title: '操作', key: 'action', width: 120, render: () => (
                <Space>
                    <Button type="link" size="small">通过</Button>
                    <Button type="link" size="small" danger>驳回</Button>
                </Space>
            )
        },
    ];

    // 商机订单列
    const opportunityColumns: ColumnsType<any> = [
        { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 100 },
        { title: '来源', dataIndex: 'source', key: 'source', width: 80, render: (v: string) => <Tag>{v}</Tag> },
        {
            title: '意向度', dataIndex: 'intention', key: 'intention', width: 80, render: (v: string) => {
                const colors: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' };
                return <Tag color={colors[v]}>{v}</Tag>;
            }
        },
        { title: '预估金额', dataIndex: 'estimatedAmount', key: 'estimatedAmount', width: 100, render: (v: number) => `¥${v}` },
        {
            title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => (
                <Tag color={status === 'new' ? 'green' : 'blue'}>
                    {status === 'new' ? '新商机' : '跟进中'}
                </Tag>
            )
        },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
        {
            title: '操作', key: 'action', width: 150, render: () => (
                <Space>
                    <Button type="link" size="small">跟进</Button>
                    <Button type="primary" size="small">转订单</Button>
                </Space>
            )
        },
    ];

    const tabItems = [
        {
            key: 'todo',
            label: '待办工单',
            children: <Table columns={todoColumns} dataSource={todoList} rowKey="id" pagination={false} />,
        },
        {
            key: 'orders',
            label: '我的订单',
            children: <Table columns={orderColumns} dataSource={myOrders} rowKey="id" pagination={false} />,
        },
        {
            key: 'approvals',
            label: '待办审批',
            children: <Table columns={approvalColumns} dataSource={approvals} rowKey="id" pagination={false} />,
        },
        {
            key: 'opportunities',
            label: '商机订单',
            children: <Table columns={opportunityColumns} dataSource={opportunities} rowKey="id" pagination={false} />,
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>我的商机</Title>
                <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />}>新建商机</Button>
            </div>

            <Card className={styles.card}>
                <Tabs items={tabItems} />
            </Card>
        </div>
    );
};

export default Opportunity;
