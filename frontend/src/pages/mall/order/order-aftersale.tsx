import React, { useState } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    Space,
    Tag,
    Modal,
    Descriptions,
    Image,
    Typography,
    Row,
    Col,
    message,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleCheck,
    faCircleXmark,
    faDollarSign,
    faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../../api/request';
import { useEffect } from 'react';
import styles from './order-aftersale.module.css';

const { Title, Text } = Typography;

interface AfterSaleRecord {
    id: string;
    orderNo: string;
    customerName: string;
    type: 'refund' | 'return' | 'exchange';
    reason: string;
    amount: number;
    images: string[];
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    createdAt: string;
}

// 模拟售后数据
/*
const mockData: AfterSaleRecord[] = [
    { id: 'AS001', orderNo: 'ORD2026013001', customerName: '王小明', type: 'refund', reason: '产品过敏', amount: 298, images: ['https://via.placeholder.com/100'], status: 'pending', createdAt: '2026-01-30 10:30' },
    { id: 'AS002', orderNo: 'ORD2026012902', customerName: '李小红', type: 'return', reason: '效果不佳', amount: 398, images: [], status: 'approved', createdAt: '2026-01-29 14:20' },
    { id: 'AS003', orderNo: 'ORD2026012803', customerName: '赵小刚', type: 'exchange', reason: '发错商品', amount: 0, images: ['https://via.placeholder.com/100', 'https://via.placeholder.com/100'], status: 'completed', createdAt: '2026-01-28 09:15' },
];
*/

const OrderAfterSale: React.FC = () => {
    const [detailVisible, setDetailVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<AfterSaleRecord | null>(null);
    const [data, setData] = useState<AfterSaleRecord[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res: any = await request.get('/after-sales');
            setData(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch after-sales failed', error);
        }
    };

    // 类型映射
    const typeMap: Record<string, { color: string; text: string }> = {
        refund: { color: 'orange', text: '退款' },
        return: { color: 'blue', text: '退货' },
        exchange: { color: 'purple', text: '换货' },
    };

    // 状态映射
    const statusMap: Record<string, { color: string; text: string }> = {
        pending: { color: 'orange', text: '待处理' },
        approved: { color: 'blue', text: '已审核' },
        rejected: { color: 'red', text: '已驳回' },
        completed: { color: 'green', text: '已完成' },
    };

    // 查看详情
    const handleViewDetail = (record: AfterSaleRecord) => {
        setCurrentRecord(record);
        setDetailVisible(true);
    };

    // 审核通过
    const handleApprove = () => {
        message.success('审核通过！');
        setDetailVisible(false);
    };

    // 驳回
    const handleReject = () => {
        Modal.confirm({
            title: '确认驳回？',
            content: '请输入驳回原因',
            onOk: () => {
                message.warning('已驳回！');
                setDetailVisible(false);
            },
        });
    };

    // 执行退款
    const handleRefund = () => {
        Modal.confirm({
            title: '确认退款？',
            content: `将退款 ¥${currentRecord?.amount} 给客户`,
            onOk: () => {
                message.success('退款成功！');
                setDetailVisible(false);
            },
        });
    };

    const columns: ColumnsType<AfterSaleRecord> = [
        {
            title: '售后单号',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: '订单编号',
            dataIndex: 'orderNo',
            key: 'orderNo',
            width: 150,
        },
        {
            title: '客户姓名',
            dataIndex: 'customerName',
            key: 'customerName',
            width: 100,
        },
        {
            title: '售后类型',
            dataIndex: 'type',
            key: 'type',
            width: 80,
            render: (type: string) => {
                const t = typeMap[type] || { color: 'default', text: type };
                return <Tag color={t.color}>{t.text}</Tag>;
            },
        },
        {
            title: '退款金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 100,
            render: (amount: number) => amount > 0 ? <Text type="danger">¥{amount}</Text> : '-',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
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
                <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
                    查看详情
                </Button>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Title level={4}>订单售后</Title>

            <Card className={styles.card}>
                <div className={styles.searchArea}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                            <Input placeholder="订单编号 / 客户姓名" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Button type="primary" icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>搜索</Button>
                        </Col>
                    </Row>
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
                />
            </Card>

            {/* 详情弹窗 */}
            <Modal
                title="售后详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                width={700}
                footer={
                    currentRecord?.status === 'pending' ? (
                        <Space>
                            <Button icon={<FontAwesomeIcon icon={faCircleXmark} />} onClick={handleReject}>
                                驳回
                            </Button>
                            <Button type="primary" icon={<FontAwesomeIcon icon={faCircleCheck} />} onClick={handleApprove}>
                                审核通过
                            </Button>
                        </Space>
                    ) : currentRecord?.status === 'approved' && currentRecord?.type === 'refund' ? (
                        <Button type="primary" icon={<FontAwesomeIcon icon={faDollarSign} />} onClick={handleRefund}>
                            执行退款
                        </Button>
                    ) : null
                }
            >
                {currentRecord && (
                    <>
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="售后单号">{currentRecord.id}</Descriptions.Item>
                            <Descriptions.Item label="订单编号">{currentRecord.orderNo}</Descriptions.Item>
                            <Descriptions.Item label="客户姓名">{currentRecord.customerName}</Descriptions.Item>
                            <Descriptions.Item label="售后类型">
                                <Tag color={typeMap[currentRecord.type]?.color}>
                                    {typeMap[currentRecord.type]?.text}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="退款金额">
                                <Text type="danger">¥{currentRecord.amount}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="状态">
                                <Tag color={statusMap[currentRecord.status]?.color}>
                                    {statusMap[currentRecord.status]?.text}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="售后原因" span={2}>{currentRecord.reason}</Descriptions.Item>
                        </Descriptions>

                        {currentRecord.images.length > 0 && (
                            <div className={styles.imageSection}>
                                <Text strong>凭证图片：</Text>
                                <div className={styles.imageList}>
                                    <Image.PreviewGroup>
                                        {currentRecord.images.map((img, index) => (
                                            <Image key={index} src={img} width={80} height={80} style={{ borderRadius: 8, marginRight: 8 }} />
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default OrderAfterSale;
