import React, { useState } from 'react';
import { Card, Table, Input, Button, Space, Tag, DatePicker, Row, Col, Typography, Modal, Form, Select, message } from 'antd';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import PrivacyField from '../../../components/privacy-field';
import { getTagStyle } from '../../../utils/color';
import styles from './customer.module.css';
import { useDictionaryStore } from '../../../stores/dictionary-store';
import { useEffect } from 'react';
import request from '../../../api/request';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface CustomerRecord {
    id: string;
    name: string;
    phone: string;
    channel: string;
    customerType?: string;
    entryDate: string;
    owner: string;
    createdAt: string;
}

const CustomerList: React.FC = () => {
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'edit' | 'view'>('view');
    const [currentCustomer, setCurrentCustomer] = useState<CustomerRecord | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [form] = Form.useForm();
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const { customerTypes, channels, fetchDictionaries } = useDictionaryStore();

    useEffect(() => {
        fetchDictionaries();
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res: any = await request.get('/customers');
            setCustomers(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const columns: ColumnsType<CustomerRecord> = [
        {
            title: '客户编号',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: '客户姓名',
            dataIndex: 'name',
            key: 'name',
            width: 120,
        },
        {
            title: '联系电话',
            dataIndex: 'phone',
            key: 'phone',
            width: 180,
            render: (phone: string) => (
                <PrivacyField type="phone" value={phone} allowReveal />
            ),
        },
        {
            title: '客户类型',
            dataIndex: 'customerType',
            key: 'customerType',
            width: 100,
            render: (type: string) => {
                const typeInfo = customerTypes.find(t => t.code === type);
                if (typeInfo) {
                    return (
                        <Tag color={typeInfo.color}>
                            {typeInfo.name}
                        </Tag>
                    );
                }
                return <Tag>{type || '-'}</Tag>;
            },
        },
        {
            title: '渠道来源',
            dataIndex: 'channel',
            key: 'channel',
            width: 100,
            render: (channel: string) => {
                const chInfo = channels.find(c => c.name === channel || c.code === channel);
                const color = chInfo?.color;

                // 这里使用后台配置的真实颜色值 (模拟数据)
                // const colorMap: Record<string, string> = {
                //     '抖音': '#000000',
                //     '快手': '#ff6600',
                //     '微信': '#07c160',
                //     '淘宝': '#ff4400',
                //     '京东': '#e4393c',
                // };
                // const color = colorMap[channel];

                if (color) {
                    return (
                        <Tag style={getTagStyle(color)}>
                            {channel}
                        </Tag>
                    );
                }
                return <Tag>{channel}</Tag>;
            },
        },
        {
            title: '进线日期',
            dataIndex: 'entryDate',
            key: 'entryDate',
            width: 120,
        },
        {
            title: '归属员工',
            dataIndex: 'owner',
            key: 'owner',
            width: 100,
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
                    <Button type="link" size="small" onClick={() => handleOpenView(record)}>查看</Button>
                </Space>
            ),
        },
    ];

    // 打开查看客户模态框
    const handleOpenView = (record: CustomerRecord) => {
        setModalMode('view');
        setCurrentCustomer(record);
        form.setFieldsValue({
            ...record,
            entryDate: record.entryDate ? dayjs(record.entryDate) : undefined,
        });
        setCreateModalVisible(true);
    };

    // 提交表单
    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();
            setCreateLoading(true);
            // 模拟 API 调用
            setTimeout(() => {
                console.log('更新客户:', { ...currentCustomer, ...values });
                message.success('客户信息已更新');
                setCreateLoading(false);
                setCreateModalVisible(false);
            }, 500);
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    // 切换到编辑模式
    const handleSwitchToEdit = () => {
        setModalMode('edit');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>客户列表</Title>
            </div>

            <Card className={styles.card}>
                {/* 搜索区 */}
                <div className={styles.searchArea}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Input placeholder="客户编号 / 姓名" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Input placeholder="联系电话" />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
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
                    dataSource={customers}
                    rowKey="id"
                    pagination={{
                        total: 100,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* 客户模态框 (新建/编辑/查看) */}
            <Modal
                title={
                    modalMode === 'edit' ? "编辑客户" : "查看客户"
                }
                open={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                onOk={handleModalSubmit}
                confirmLoading={createLoading}
                width={600}
                footer={[
                    <Button key="cancel" onClick={() => setCreateModalVisible(false)}>
                        {modalMode === 'view' ? '关闭' : '取消'}
                    </Button>,
                    modalMode === 'view' ? (
                        <Button key="edit" type="primary" onClick={handleSwitchToEdit}>
                            编辑
                        </Button>
                    ) : (
                        <Button key="submit" type="primary" loading={createLoading} onClick={handleModalSubmit}>
                            保存
                        </Button>
                    )
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 16 }}
                    disabled={modalMode === 'view'}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="客户姓名"
                                name="name"
                                rules={[{ required: true, message: '请输入客户姓名' }]}
                            >
                                <Input placeholder="请输入客户姓名" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="联系电话"
                                name="phone"
                                rules={[
                                    { required: true, message: '请输入联系电话' },
                                    { pattern: /^1\d{10}$/, message: '请输入正确的手机号码' },
                                ]}
                            >
                                <Input placeholder="请输入联系电话" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="渠道来源"
                                name="channel"
                                rules={[{ required: true, message: '请选择渠道来源' }]}
                            >
                                <Select placeholder="请选择渠道来源" options={channels.map(c => ({ value: c.code, label: c.name }))} disabled={modalMode === 'view'} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="客户类型"
                                name="customerType"
                                rules={[{ required: true, message: '请选择客户类型' }]}
                            >
                                <Select
                                    placeholder="请选择客户类型"
                                    options={customerTypes.map(t => ({ value: t.code, label: t.name }))}
                                    disabled={modalMode === 'view'}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="进线日期"
                                name="entryDate"
                                rules={[{ required: true, message: '请选择进线日期' }]}
                            >
                                <DatePicker style={{ width: '100%' }} placeholder="请选择进线日期" disabled={modalMode === 'view'} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="详细地址" name="address">
                        <TextArea rows={2} placeholder="请输入详细地址（选填）" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="身高(cm)" name="height">
                                <Input type="number" placeholder="身高" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="年龄" name="age">
                                <Input type="number" placeholder="年龄" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="体重(kg)" name="weight">
                                <Input type="number" placeholder="体重" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default CustomerList;

