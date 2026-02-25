import React, { useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Select,
    DatePicker,
    Typography,
    Row,
    Col,
    message,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faMagnifyingGlass, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../api/request';
import { useEffect } from 'react';
import styles from './log-list.module.css';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// 模拟日志数据
/*
const mockLogs = [
    { id: '1', user: '张三', action: '创建订单', target: 'ORD2026013001', type: '订单操作', time: '2026-01-30 10:30:15' },
    { id: '2', user: '李四', action: '审核通过', target: 'ORD2026012902', type: '审核操作', time: '2026-01-29 14:20:30' },
    { id: '3', user: '王五', action: '修改客户', target: 'C003', type: '客户操作', time: '2026-01-28 09:15:45' },
    { id: '4', user: '张三', action: '入库操作', target: 'P001', type: '库存操作', time: '2026-01-27 16:30:00' },
    { id: '5', user: '李四', action: '发货确认', target: 'ORD2026012701', type: '发货操作', time: '2026-01-27 11:20:00' },
    { id: '6', user: '王五', action: '退款审核', target: 'AS2026012601', type: '售后操作', time: '2026-01-26 15:45:30' },
];
*/

const LogList: React.FC = () => {
    const [logFilters, setLogFilters] = useState({
        user: undefined as string | undefined,
        type: undefined as string | undefined,
    });

    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res: any = await request.get('/logs');
            setLogs(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch logs failed', error);
        }
    };

    // 日志列
    const logColumns: ColumnsType<any> = [
        { title: '操作人', dataIndex: 'user', key: 'user', width: 80 },
        {
            title: '操作类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => {
                const colorMap: Record<string, string> = {
                    '订单操作': 'blue',
                    '审核操作': 'green',
                    '客户操作': 'purple',
                    '库存操作': 'orange',
                    '发货操作': 'cyan',
                    '售后操作': 'magenta',
                };
                return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
            },
        },
        { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
        { title: '操作对象', dataIndex: 'target', key: 'target', width: 140 },
        { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    ];

    // 导出日志
    const handleExportLogs = () => {
        console.log('导出日志', logFilters);
        message.success('日志导出成功！');
    };

    // 重置筛选
    const handleResetFilters = () => {
        setLogFilters({ user: undefined, type: undefined });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>日志列表</Title>
            </div>

            <Card className={styles.card}>
                <div className={styles.toolbar}>
                    <Row gutter={[16, 16]} style={{ width: '100%' }}>
                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="操作人"
                                style={{ width: '100%' }}
                                allowClear
                                value={logFilters.user}
                                onChange={(v) => setLogFilters({ ...logFilters, user: v })}
                                options={[
                                    { value: '张三', label: '张三' },
                                    { value: '李四', label: '李四' },
                                    { value: '王五', label: '王五' },
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="操作类型"
                                style={{ width: '100%' }}
                                allowClear
                                value={logFilters.type}
                                onChange={(v) => setLogFilters({ ...logFilters, type: v })}
                                options={[
                                    { value: '订单操作', label: '订单操作' },
                                    { value: '审核操作', label: '审核操作' },
                                    { value: '客户操作', label: '客户操作' },
                                    { value: '库存操作', label: '库存操作' },
                                    { value: '发货操作', label: '发货操作' },
                                    { value: '售后操作', label: '售后操作' },
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <RangePicker style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} showTime />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Space>
                                <Button type="primary" icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>搜索</Button>
                                <Button icon={<FontAwesomeIcon icon={faRotateRight} />} onClick={handleResetFilters}>重置</Button>
                                <Button icon={<FontAwesomeIcon icon={faDownload} />} onClick={handleExportLogs}>导出</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
                <Table
                    columns={logColumns}
                    dataSource={logs}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                />
            </Card>
        </div>
    );
};

export default LogList;
