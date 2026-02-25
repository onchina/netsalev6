import React, { useState } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    Space,
    Typography,
    Tabs,
    Modal,
    Form,
    Switch,
    Popconfirm,
    message,
    Select,
    Tag,
    Row,
    Col,
    InputNumber,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import { getTagStyle, PRESET_COLORS } from '../../utils/color';
import styles from './channel-manage.module.css';
import { Progress } from 'antd';
import request from '../../api/request';

import {
    ConfigItem
} from '../../api/dictionaries';
import { useDictionaryStore } from '../../stores/dictionary-store';
import { useEffect } from 'react';

// 模拟业绩目标数据
/*
const mockTargets = [
    { id: '1', name: '张三', role: '销售主管', monthTarget: 150000, quarterTarget: 450000, yearTarget: 1800000, currentAmount: 128600 },
    { id: '2', name: '李四', role: '销售', monthTarget: 120000, quarterTarget: 360000, yearTarget: 1440000, currentAmount: 98500 },
    { id: '3', name: '王五', role: '销售', monthTarget: 100000, quarterTarget: 300000, yearTarget: 1200000, currentAmount: 76800 },
    { id: '4', name: '赵六', role: '销售', monthTarget: 80000, quarterTarget: 240000, yearTarget: 960000, currentAmount: 65200 },
];
*/

const { Title, Text } = Typography;

type TabType = 'channel' | 'customerType' | 'orderType' | 'paymentMethod' | 'responsibilityType' | 'salesTarget' | 'systemParams';

const ChannelManage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('channel');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
    const [form] = Form.useForm();
    const { channels, customerTypes, orderTypes, paymentMethods, responsibilityTypes, fetchDictionaries } = useDictionaryStore();

    const [salesTargets, setSalesTargets] = useState<any[]>([]);

    useEffect(() => {
        fetchDictionaries();
        fetchSalesTargets();
    }, []);

    const fetchSalesTargets = async () => {
        try {
            const res: any = await request.get('/sales-targets');
            setSalesTargets(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch sales targets failed', error);
        }
    };

    const getCurrentData = (): ConfigItem[] => {
        switch (activeTab) {
            case 'channel':
                return channels;
            case 'customerType':
                return customerTypes;
            case 'orderType':
                return orderTypes;
            case 'paymentMethod':
                return paymentMethods;
            case 'responsibilityType':
                return responsibilityTypes;
            case 'salesTarget':
                return []; // 业绩目标使用单独的数据源
            case 'systemParams':
                return []; // 系统参数是表单配置
            default:
                return [];
        }
    };

    // 获取当前 Tab 的标题
    const getCurrentTitle = (): string => {
        switch (activeTab) {
            case 'channel':
                return '进线渠道';
            case 'customerType':
                return '客户类型';
            case 'orderType':
                return '订单类型';
            case 'paymentMethod':
                return '支付类型';
            case 'responsibilityType':
                return '判责类型';
            case 'salesTarget':
                return '业绩目标';
            case 'systemParams':
                return '系统参数';
            default:
                return '';
        }
    };

    // 打开新增/编辑弹窗
    const handleOpenModal = (item?: ConfigItem) => {
        setEditingItem(item || null);
        form.resetFields();
        if (item) {
            form.setFieldsValue({
                name: item.name,
                code: item.code,
                color: item.color,
                sort: item.sort,
                enabled: item.enabled,
            });
        } else {
            form.setFieldsValue({
                sort: getCurrentData().length + 1,
                enabled: true,
            });
        }
        setModalVisible(true);
    };

    // 保存
    const handleSave = () => {
        form.validateFields().then((values) => {
            console.log('保存配置:', values);
            message.success(editingItem ? '编辑成功！' : '新增成功！');
            setModalVisible(false);
        });
    };

    // 删除
    const handleDelete = (item: ConfigItem) => {
        console.log('删除:', item);
        message.success('删除成功！');
    };

    // 切换启用状态
    const handleToggleEnabled = (item: ConfigItem, enabled: boolean) => {
        console.log('切换状态:', item.id, enabled);
        message.success(enabled ? '已启用' : '已禁用');
    };

    // 表格列配置
    const columns: ColumnsType<ConfigItem> = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            render: (name: string, record) => (
                <Space>
                    {record.color ? (
                        <Tag style={getTagStyle(record.color)}>
                            {name}
                        </Tag>
                    ) : (
                        <Tag>{name}</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            width: 120,
            render: (code: string) => <Text type="secondary">{code}</Text>,
        },
        {
            title: '排序',
            dataIndex: 'sort',
            key: 'sort',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 100,
            render: (enabled: boolean, record) => (
                <Switch
                    checked={enabled}
                    onChange={(checked) => handleToggleEnabled(record, checked)}
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        size="small"
                        icon={<FontAwesomeIcon icon={faPenToSquare} />}
                        onClick={() => handleOpenModal(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确认删除？"
                        description="删除后将无法恢复"
                        onConfirm={() => handleDelete(record)}
                    >
                        <Button type="link" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 业绩目标列
    const targetColumns: ColumnsType<any> = [
        { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
        { title: '角色', dataIndex: 'role', key: 'role', width: 100 },
        {
            title: '月目标',
            dataIndex: 'monthTarget',
            key: 'monthTarget',
            width: 120,
            render: (v: number) => `¥${v.toLocaleString()}`,
        },
        {
            title: '季目标',
            dataIndex: 'quarterTarget',
            key: 'quarterTarget',
            width: 120,
            render: (v: number) => `¥${v.toLocaleString()}`,
        },
        {
            title: '年目标',
            dataIndex: 'yearTarget',
            key: 'yearTarget',
            width: 120,
            render: (v: number) => `¥${v.toLocaleString()}`,
        },
        {
            title: '月度达成率',
            key: 'achievementRate',
            width: 180,
            render: (_, record) => {
                const rate = Math.round((record.currentAmount / record.monthTarget) * 100);
                const color = rate >= 100 ? '#52c41a' : rate >= 80 ? '#1677ff' : rate >= 60 ? '#faad14' : '#ff4d4f';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Progress
                            percent={Math.min(rate, 100)}
                            size="small"
                            strokeColor={color}
                            style={{ flex: 1, marginBottom: 0 }}
                            showInfo={false}
                        />
                        <Text style={{ color, minWidth: 40 }}>{rate}%</Text>
                    </div>
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: () => <Button type="link" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />}>编辑目标</Button>,
        },
    ];

    // Tab 配置
    const tabItems = [
        {
            key: 'channel',
            label: '进线渠道',
            children: (
                <Table
                    columns={columns}
                    dataSource={channels}
                    rowKey="id"
                    pagination={false}
                />
            ),
        },
        {
            key: 'customerType',
            label: '客户类型',
            children: (
                <Table
                    columns={columns}
                    dataSource={customerTypes}
                    rowKey="id"
                    pagination={false}
                />
            ),
        },
        {
            key: 'orderType',
            label: '订单类型',
            children: (
                <Table
                    columns={columns}
                    dataSource={orderTypes}
                    rowKey="id"
                    pagination={false}
                />
            ),
        },
        {
            key: 'paymentMethod',
            label: '支付类型',
            children: (
                <Table
                    columns={columns}
                    dataSource={paymentMethods}
                    rowKey="id"
                    pagination={false}
                />
            ),
        },
        {
            key: 'responsibilityType',
            label: '判责类型',
            children: (
                <Table
                    columns={columns}
                    dataSource={responsibilityTypes}
                    rowKey="id"
                    pagination={false}
                />
            ),
        },
        {
            key: 'salesTarget',
            label: '业绩目标',
            children: (
                <div style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                        <Space>
                            <Select
                                placeholder="选择维度"
                                style={{ width: 120 }}
                                defaultValue="month"
                                options={[
                                    { value: 'month', label: '月度目标' },
                                    { value: 'quarter', label: '季度目标' },
                                    { value: 'year', label: '年度目标' },
                                ]}
                            />
                            <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />}>批量设置目标</Button>
                        </Space>
                    </div>
                    <Table columns={targetColumns} dataSource={salesTargets} rowKey="id" pagination={false} />
                </div>
            ),
        },
        {
            key: 'systemParams',
            label: '系统参数',
            children: (
                <div style={{ padding: 24 }}>
                    <Form layout="vertical" style={{ maxWidth: 800 }}>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label="默认提成比例（%）" name="commissionRate" initialValue={10}>
                                    <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="%" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="最低发货金额" name="minShipAmount" initialValue={100}>
                                    <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label="订单自动完成天数" name="autoCompleteDays" initialValue={15}>
                                    <InputNumber min={1} max={90} style={{ width: '100%' }} suffix="天" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="启用代收款" name="enableCOD" valuePropName="checked" initialValue={true}>
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item>
                            <Button type="primary" onClick={() => message.success('配置已保存！')}>
                                保存配置
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>类型管理</Title>
                <Button
                    type="primary"
                    icon={<FontAwesomeIcon icon={faPlus} />}
                    onClick={() => handleOpenModal()}
                >
                    新增{getCurrentTitle()}
                </Button>
            </div>

            <Card className={styles.card}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as TabType)}
                    items={tabItems}
                />
            </Card>

            {/* 新增/编辑弹窗 */}
            <Modal
                title={`${editingItem ? '编辑' : '新增'}${getCurrentTitle()}`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSave}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        label="名称"
                        name="name"
                        rules={[{ required: true, message: '请输入名称' }]}
                    >
                        <Input placeholder="请输入名称" />
                    </Form.Item>
                    <Form.Item
                        label="编码"
                        name="code"
                        rules={[
                            { required: true, message: '请输入编码' },
                            { pattern: /^[a-z_]+$/, message: '编码只能包含小写字母和下划线' },
                        ]}
                    >
                        <Input placeholder="请输入编码（小写字母）" disabled={!!editingItem} />
                    </Form.Item>
                    <Form.Item label="标签颜色" name="color">
                        <Select placeholder="请选择标签颜色">
                            {PRESET_COLORS.map((color) => (
                                <Select.Option key={color} value={color}>
                                    <Tag style={getTagStyle(color)}>{color}</Tag>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="排序"
                        name="sort"
                        rules={[{ required: true, message: '请输入排序' }]}
                    >
                        <Input type="number" placeholder="数字越小越靠前" />
                    </Form.Item>
                    <Form.Item label="启用状态" name="enabled" valuePropName="checked">
                        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChannelManage;
