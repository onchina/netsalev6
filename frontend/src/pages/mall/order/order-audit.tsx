import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    List,
    Button,
    Tag,
    Space,
    Descriptions,
    Table,
    Typography,
    Divider,
    Modal,
    Input,
    message,
    Alert,
    Spin,
    Empty,
} from 'antd';
import request from '../../../api/request';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBan,
    faCircleCheck,
    faCircleInfo,
    faCircleXmark,
    faClockRotateLeft,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useUserStore } from '../../../stores';
import styles from './order-audit.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

type AuditStatus = 'manager_pending' | 'finance_pending' | 'completed' | 'manager_rejected' | 'finance_rejected' | 'voided';

interface AuditOrder {
    id: string;
    orderNo: string;
    customerName: string;
    totalAmount: number;
    actualPrice: number;
    salesName: string;
    status: AuditStatus;
    createdAt: string;
    applyReason: string;
    items?: any[];
}

const OrderAudit: React.FC = () => {
    const { user } = useUserStore();
    const currentRole = user?.role || 'sales';

    const [orders, setOrders] = useState<AuditOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'reject' | 'void'>('reject');
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res: any = await request.get('/orders/audit');
            const list = res?.data?.data?.items || res?.data?.items || res?.data?.data || res?.data || [];
            const data = Array.isArray(list) ? list : [];
            setOrders(data);
            if (data.length > 0 && !selectedOrderId) {
                setSelectedOrderId(data[0].id);
            }
        } catch (error) {
            console.error('Fetch audit orders failed', error);
        } finally {
            setLoading(false);
        }
    };

    const currentOrder = orders.find(o => o.id === selectedOrderId);

    const getStatusInfo = (status: AuditStatus) => {
        const configs: Record<AuditStatus, { color: string, text: string }> = {
            manager_pending: { color: 'orange', text: '待经理放行' },
            finance_pending: { color: 'processing', text: '待财务过审' },
            completed: { color: 'success', text: '核销通过' },
            manager_rejected: { color: 'error', text: '经理驳回' },
            finance_rejected: { color: 'warning', text: '财务驳回' },
            voided: { color: 'default', text: '已作废' },
        };
        return configs[status] || { color: 'default', text: status };
    };

    // 获取当前角色可操作的提示
    const getRoleHint = () => {
        if (currentRole === 'admin') return '超级管理员 — 可查看和操作所有审核订单';
        if (currentRole === 'sales_manager') return '经理 — 审核差价申请并放行';
        if (currentRole === 'finance') return '财务 — 最终审核并核销';
        return '销售 — 查看已提交审核订单的进度';
    };

    // 是否可以操作审批
    const canApprove = () => {
        if (!currentOrder) return false;
        if (currentRole === 'admin') {
            return currentOrder.status === 'manager_pending' || currentOrder.status === 'finance_pending';
        }
        if (currentRole === 'sales_manager') return currentOrder.status === 'manager_pending';
        if (currentRole === 'finance') return currentOrder.status === 'finance_pending';
        return false;
    };

    const handleApprove = async () => {
        if (!currentOrder) return;
        Modal.confirm({
            title: currentOrder.status === 'manager_pending' ? '确认放行此订单？' : '确认审核通过？',
            content: currentOrder.status === 'manager_pending'
                ? '经理批准后，订单将转交财务审核。'
                : '财务审核通过后，订单将正式核销。',
            onOk: async () => {
                const action = currentOrder.status === 'manager_pending' ? 'manager_approve' : 'finance_approve';
                try {
                    await request.put(`/orders/${currentOrder.id}/audit`, { action });
                    message.success('审核通过');
                    fetchOrders();
                } catch (e: any) {
                    message.error(e?.response?.data?.detail || '操作失败');
                }
            },
        });
    };

    const handleRejectOrVoid = async () => {
        if (!reason.trim()) return message.warning('请输入原因');
        setActionLoading(true);
        const action = modalType === 'reject'
            ? (currentOrder?.status === 'manager_pending' ? 'manager_reject' : 'finance_reject')
            : 'void';
        try {
            await request.put(`/orders/${currentOrder!.id}/audit`, { action, reason });
            message.success('操作成功');
            setModalVisible(false);
            setReason('');
            fetchOrders();
        } catch (e: any) {
            message.error(e?.response?.data?.detail || '操作失败');
        } finally {
            setActionLoading(false);
        }
    };

    const renderActions = () => {
        if (!currentOrder) return null;

        // 销售只能看进度
        if (currentRole === 'sales') {
            return (
                <Alert
                    message="当前状态"
                    description={
                        currentOrder.status === 'manager_pending' || currentOrder.status === 'finance_pending'
                            ? '订单正在审核中，请耐心等待审批。'
                            : `订单审核已结束，结果：${getStatusInfo(currentOrder.status).text}`
                    }
                    type="info"
                    showIcon
                />
            );
        }

        if (!canApprove()) {
            return <Text type="secondary">该订单当前状态无需操作</Text>;
        }

        const isManager = currentOrder.status === 'manager_pending';
        return (
            <Space>
                <Button danger icon={<FontAwesomeIcon icon={faCircleXmark} />} onClick={() => { setModalType('reject'); setModalVisible(true); }}>
                    {isManager ? '拒绝放行' : '驳回申请'}
                </Button>
                {!isManager && (
                    <Button icon={<FontAwesomeIcon icon={faBan} />} onClick={() => { setModalType('void'); setModalVisible(true); }}>
                        订单作废
                    </Button>
                )}
                <Button type="primary" icon={<FontAwesomeIcon icon={faCircleCheck} />} onClick={handleApprove}>
                    {isManager ? '允许放行' : '审核通过'}
                </Button>
            </Space>
        );
    };

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Title level={4} style={{ margin: 0 }}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 8, color: '#1677ff' }} />
                    订单审核中心
                </Title>
                <Tag color="blue">{getRoleHint()}</Tag>
            </div>

            <Row gutter={16} style={{ height: 'calc(100vh - 160px)' }}>
                <Col span={8} style={{ height: '100%' }}>
                    <Card
                        title={`审核队列 (${orders.length})`}
                        size="small"
                        className={styles.listCard}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Spin spinning={loading}>
                            {orders.length === 0 ? (
                                <Empty description="暂无审核订单" style={{ padding: 40 }} />
                            ) : (
                                <List
                                    dataSource={orders}
                                    renderItem={item => (
                                        <List.Item
                                            className={`${styles.listItem} ${item.id === selectedOrderId ? styles.listItemActive : ''}`}
                                            onClick={() => setSelectedOrderId(item.id)}
                                        >
                                            <div style={{ width: '100%' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Text strong>{item.orderNo}</Text>
                                                    <Tag color={getStatusInfo(item.status).color}>{getStatusInfo(item.status).text}</Tag>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text type="secondary">{item.customerName}</Text>
                                                    <Text type="danger" strong>¥{(item.actualPrice ?? item.totalAmount ?? 0).toFixed(2)}</Text>
                                                </div>
                                                <div style={{ fontSize: 12, marginTop: 4, color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>销售: {item.salesName || '-'}</span>
                                                    <span>{item.createdAt}</span>
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Spin>
                    </Card>
                </Col>

                <Col span={16} style={{ height: '100%', overflow: 'auto' }}>
                    {currentOrder ? (
                        <div className={styles.detailArea}>
                            <Card title="核价详情" size="small" className={styles.card} extra={<Tag color="red">差价申请</Tag>}>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Card size="small" style={{ background: '#f8fafc', textAlign: 'center' }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>订单总计 (原价)</Text>
                                            <div style={{ fontSize: 20, fontWeight: 700 }}>¥{(currentOrder.totalAmount ?? 0).toFixed(2)}</div>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size="small" style={{ background: '#fff1f0', textAlign: 'center', borderColor: '#ffccc7' }}>
                                            <Text type="danger" style={{ fontSize: 12 }}>实际成交价</Text>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5222d' }}>¥{(currentOrder.actualPrice ?? currentOrder.totalAmount ?? 0).toFixed(2)}</div>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size="small" style={{ background: '#f6ffed', textAlign: 'center' }}>
                                            <Text type="success" style={{ fontSize: 12 }}>优惠力度</Text>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>
                                                {currentOrder.totalAmount > 0
                                                    ? `${((1 - (currentOrder.actualPrice ?? currentOrder.totalAmount) / currentOrder.totalAmount) * 100).toFixed(0)}% OFF`
                                                    : '0% OFF'}
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                                <Divider style={{ margin: '16px 0' }} />
                                <Descriptions column={2} size="small">
                                    <Descriptions.Item label="申请人">{currentOrder.salesName || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="申请日期">{currentOrder.createdAt}</Descriptions.Item>
                                    <Descriptions.Item label="客户姓名">{currentOrder.customerName}</Descriptions.Item>
                                    <Descriptions.Item label="申请原因" span={2}>
                                        <div style={{ background: '#fff7e6', padding: '8px 12px', borderRadius: 4, border: '1px solid #ffe7ba' }}>
                                            <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: 8, color: '#fa8c16' }} />
                                            {currentOrder.applyReason || '未填写申请原因'}
                                        </div>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>

                            <Card title="商品明细" size="small" className={styles.card}>
                                <Table
                                    size="small"
                                    pagination={false}
                                    rowKey="productId"
                                    columns={[
                                        { title: '商品名', dataIndex: 'productName', key: 'productName' },
                                        { title: '规格', dataIndex: 'spec', key: 'spec', width: 100 },
                                        { title: '单价', dataIndex: 'price', key: 'price', width: 100, render: (v: number) => `¥${(v ?? 0).toFixed(2)}` },
                                        { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
                                        { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 100, align: 'right' as const, render: (v: number) => `¥${(v ?? 0).toFixed(2)}` },
                                    ]}
                                    dataSource={currentOrder.items || []}
                                />
                            </Card>

                            <Card title="审核操作" size="small" className={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <FontAwesomeIcon icon={faClockRotateLeft} style={{ color: '#8c8c8c' }} />
                                        <Text type="secondary">流程: 销售提报 → 经理放行 → 财务过审</Text>
                                    </div>
                                    {renderActions()}
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className={styles.empty}>请选择要审核的订单</div>
                    )}
                </Col>
            </Row>

            <Modal
                title={modalType === 'reject' ? '确认驳回' : '确认作废'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleRejectOrVoid}
                confirmLoading={actionLoading}
                okButtonProps={{ danger: true }}
                okText="确认提交"
            >
                <div style={{ marginBottom: 12 }}>
                    请输入{modalType === 'reject' ? '驳回' : '作废'}原因说明：
                </div>
                <TextArea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="必填" />
            </Modal>
        </div>
    );
};

export default OrderAudit;
