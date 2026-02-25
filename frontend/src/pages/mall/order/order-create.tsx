import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Form,
    Select,
    Radio,
    InputNumber,
    Typography,
    Modal,
    Row,
    Col,
    message,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

    faPlus,
    faTrash,
    faMinusCircle,
    faBoxOpen,
    faWallet,
    faSliders,
    faUser,
    faSave,
    faCheck,
    faSearch,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import styles from './order.module.css';
// import { MOCK_ORDER_TYPES, MOCK_EMPLOYEES, MOCK_PAYMENT_METHODS, MOCK_CUSTOMER_TYPES } from '../../../constants/dictionaries';
import { useDictionaryStore } from '../../../stores/dictionary-store';
import request from '../../../api/request';

const { Text } = Typography;

// 模拟客户数据
/*
const mockCustomers = [
    { id: 'C001', name: '王小明', phone: '138****1234', height: 170, age: 35, weight: 75, channel: '抖音' },
    { id: 'C002', name: '李小红', phone: '139****5678', height: 165, age: 28, weight: 55, channel: '快手' },
    { id: 'C003', name: '赵小刚', phone: '137****9012', height: 175, age: 42, weight: 80, channel: '微信' },
];
*/

// 模拟商品数据
/*
const mockProducts = [
    { id: 'P001', name: '瘦身胶囊A', spec: '60粒/盒', price: 298, stock: 500 },
    { id: 'P002', name: '瘦身胶囊B', spec: '90粒/盒', price: 398, stock: 300 },
    { id: 'P003', name: '代餐粉', spec: '500g/罐', price: 168, stock: 200 },
    { id: 'P004', name: '酵素饮', spec: '30袋/盒', price: 258, stock: 150 },
];
*/

// 渠道选项
/*
const channelOptions = [
    { value: 'douyin', label: '抖音' },
    { value: 'kuaishou', label: '快手' },
    { value: 'wechat', label: '微信' },
    { value: 'taobao', label: '淘宝' },
    { value: 'jd', label: '京东' },
    { value: 'offline', label: '线下' },
    { value: 'other', label: '其他' },
];
*/

interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    spec: string;
    price: number;
    quantity: number;
    subtotal: number;
}

// 绩效分成状态
interface ProfitShare {
    userId: string | undefined;
    department: string;
    percentage: number;
}

const OrderCreate: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const [form] = Form.useForm();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [productModalVisible, setProductModalVisible] = useState(false);

    // 初始化绩效分成，默认包含当前用户（张三）
    const [profitSharing, setProfitSharing] = useState<ProfitShare[]>([
        { userId: '1001', department: '销售一部', percentage: 100 }
    ]);

    const { orderTypes, paymentMethods, customerTypes, channels, employees, fetchDictionaries } = useDictionaryStore();
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchDictionaries();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res: any = await request.get('/products');
            setProducts(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    // 获取订单回显数据
    useEffect(() => {
        if (orderId) {
            const fetchOrderDetails = async () => {
                try {
                    const res: any = await request.get(`/orders/${orderId}`);
                    const orderData = res?.data || res;
                    if (orderData) {
                        form.setFieldsValue({
                            orderType: orderData.orderType,
                            shipNow: orderData.shipNow,
                            paymentMethod: orderData.paymentMethod,
                            paidAmount: orderData.paidAmount,
                            remark: orderData.remark,
                            customerName: orderData.customer?.name,
                            customerPhone: orderData.customer?.phone,
                            customerChannel: orderData.customer?.channel,
                            customerType: orderData.customer?.type,
                            customerAddress: orderData.customer?.address,
                            customerHeight: orderData.customer?.height,
                            customerAge: orderData.customer?.age,
                            customerWeight: orderData.customer?.weight,
                        });
                        setOrderItems(orderData.items || []);
                        message.info('正在编辑订单：' + orderId);
                    }
                } catch (error) {
                    console.error('Fetch order details failed:', error);
                }
            };
            fetchOrderDetails();
        }
    }, [orderId, form]);

    // 订单类型选项
    const orderTypeOptions = orderTypes.filter(t => t.enabled).map(t => ({
        value: t.code,
        label: t.name,
    }));

    // 收款方式选项
    const paymentOptions = paymentMethods.filter(t => t.enabled).map(t => ({
        value: t.code,
        label: t.name,
    }));

    // 计算金额
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const actualAmount = Form.useWatch('actualAmount', form) || 0;
    const paidAmount = Form.useWatch('paidAmount', form) || 0;
    const paymentMethod = Form.useWatch('paymentMethod', form);
    const pendingAmount = actualAmount - paidAmount;
    const paidRatio = actualAmount > 0 ? ((paidAmount / actualAmount) * 100).toFixed(1) : '0';

    // 监听商品总额变化，同步更新实际成交价
    useEffect(() => {
        if (!orderId && totalAmount > 0) {
            form.setFieldValue('actualAmount', totalAmount);
        }
    }, [totalAmount, form, orderId]);

    // 监听实际成交价变化，同步更新已收金额（用户要求联动）
    useEffect(() => {
        if (paymentMethod === 'cod') {
            form.setFieldValue('paidAmount', 0);
        } else if (actualAmount !== undefined) {
            form.setFieldValue('paidAmount', actualAmount);
        }
    }, [actualAmount, paymentMethod, form]);

    // 添加商品
    const handleAddProduct = (product: any) => {
        const existingItem = orderItems.find((item) => item.productId === product.id);
        if (existingItem) {
            setOrderItems(
                orderItems.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                        : item
                )
            );
        } else {
            setOrderItems([
                ...orderItems,
                {
                    id: `OI${Date.now()}`,
                    productId: product.id,
                    productName: product.name,
                    spec: product.spec,
                    price: product.price,
                    quantity: 1,
                    subtotal: product.price,
                },
            ]);
        }
        message.success(`已添加 ${product.name}`);
    };

    // 删除商品
    const handleRemoveProduct = (itemId: string) => {
        setOrderItems(orderItems.filter((item) => item.id !== itemId));
    };

    // 修改数量
    const handleQuantityChange = (itemId: string, quantity: number) => {
        setOrderItems(
            orderItems.map((item) =>
                item.id === itemId ? { ...item, quantity, subtotal: quantity * item.price } : item
            )
        );
    };

    // 添加绩效分成人员
    const handleAddShare = () => {
        if (profitSharing.length < 2) {
            setProfitSharing([...profitSharing, { userId: undefined, department: '', percentage: 0 }]);
        }
    };

    // 移除绩效分成人员
    const handleRemoveShare = (index: number) => {
        const newSharing = [...profitSharing];
        newSharing.splice(index, 1);
        setProfitSharing(newSharing);
    };

    // 更新绩效分成信息
    const handleShareChange = (index: number, field: keyof ProfitShare, value: any) => {
        const newSharing = [...profitSharing];
        if (field === 'userId') {
            const employee = employees.find(e => e.id === value);
            newSharing[index].userId = value;
            newSharing[index].department = employee?.department || '';
        } else {
            // @ts-ignore
            newSharing[index][field] = value;
        }
        setProfitSharing(newSharing);
    };

    // 提交订单
    const handleSubmit = () => {
        const totalPercentage = profitSharing.reduce((sum, item) => sum + (item.percentage || 0), 0);
        if (totalPercentage !== 100) {
            message.error('绩效分成比例总和必须为100%');
            return;
        }
        if (profitSharing.some(item => !item.userId)) {
            message.error('请选择绩效分成人员');
            return;
        }

        form.validateFields().then((values) => {
            const submitOrder = (isAudit = false) => {
                console.log(isAudit ? '申请批准:' : (orderId ? '更新订单:' : '提交订单:'), {
                    id: orderId,
                    items: orderItems,
                    ...values,
                    totalAmount,
                    actualAmount,
                    pendingAmount,
                    paidRatio,
                    profitSharing,
                    status: isAudit ? 'pending_audit' : 'pending_shipment'
                });

                if (isAudit) {
                    message.success('订单已提交申请批准，请等待审核');
                    navigate('/mall/order/audit');
                } else {
                    message.success(orderId ? '订单更新成功！' : '订单创建成功！');
                    navigate('/mall/order/pending');
                }
            };

            // 如果实际成交价低于订单总额，弹出审批提示
            if (actualAmount < totalAmount) {
                Modal.confirm({
                    title: '折扣审批提醒',
                    icon: <FontAwesomeIcon icon={faWallet} style={{ color: '#faad14', marginRight: 8 }} />,
                    content: (
                        <div>
                            <p style={{ marginBottom: 16 }}>当前实际成交价 (<Text type="danger" strong>¥{actualAmount.toFixed(2)}</Text>) 低于订单总额 (¥{totalAmount.toFixed(2)})。</p>
                            <p>此订单需要申请经理批准后方可生效。您是否确认提交申请？</p>
                        </div>
                    ),
                    okText: '申请批准',
                    cancelText: '返回修改',
                    centered: true,
                    onOk: () => {
                        submitOrder(true);
                    }
                });
                return;
            }

            submitOrder(false);
        });
    };

    // 保存草稿
    const handleSaveDraft = () => {
        message.success('草稿已保存');
    };

    // 订单商品列配置
    const orderItemColumns: ColumnsType<OrderItem> = [
        { title: '商品名称', dataIndex: 'productName', key: 'productName', width: 140, ellipsis: true, align: 'center' },
        { title: '规格', dataIndex: 'spec', key: 'spec', width: 100, ellipsis: true },
        {
            title: '单价',
            dataIndex: 'price',
            key: 'price',
            width: 90,
            align: 'right',
            render: (price: number) => `¥${price.toFixed(2)}`,
        },
        {
            title: '数量',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center',
            render: (quantity: number, record) => (
                <InputNumber
                    min={1}
                    value={quantity}
                    onChange={(value) => handleQuantityChange(record.id, value || 1)}
                    size="small"
                    style={{ width: 60 }}
                />
            ),
        },
        {
            title: '小计',
            dataIndex: 'subtotal',
            key: 'subtotal',
            width: 100,
            align: 'right',
            render: (subtotal: number) => <Text strong type="danger">¥{subtotal.toFixed(2)}</Text>,
        },
        {
            title: '操作',
            key: 'action',
            width: 60,
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    size="small"
                    icon={<FontAwesomeIcon icon={faTrash} />}
                    onClick={() => handleRemoveProduct(record.id)}
                />
            ),
        },
    ];

    // 商品选择弹窗列配置
    const productColumns: ColumnsType<any> = [
        { title: '商品名称', dataIndex: 'name', key: 'name' },
        { title: '规格', dataIndex: 'spec', key: 'spec', width: 120 },
        {
            title: '单价',
            dataIndex: 'price',
            key: 'price',
            width: 100,
            render: (price: number) => `¥${price.toFixed(2)}`,
        },
        { title: '库存', dataIndex: 'stock', key: 'stock', width: 80 },
        {
            title: '操作',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <Button type="primary" size="small" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => handleAddProduct(record)}>
                    添加
                </Button>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            {/* Main Content */}
            <div className={styles.mainContent}>
                <Form
                    form={form}
                    layout="horizontal"
                    labelAlign="left"
                    size="small"
                    className={styles.formContainer}
                    style={{ width: '100%' }}
                >
                    {/* 内容滚动区域 */}
                    <div className={styles.scrollWrapper}>
                        <Row gutter={8}>
                            {/* 左侧：客户与商品 (Left Panel) */}
                            <Col xs={24} lg={16} xl={17} className={styles.leftPanel}>
                                {/* 1. 客户信息 - 紧凑排版 */}
                                <Card
                                    title={<Space size={4}><FontAwesomeIcon icon={faUser} /><span>客户信息</span></Space>}
                                    className={styles.panelCard}
                                    size="small"
                                    bodyStyle={{ padding: '8px 12px' }}
                                >
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item label="客户姓名" name="customerName" rules={[{ required: true, message: '请输入姓名' }]}>
                                                <Input placeholder="姓名" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="联系电话" name="customerPhone" rules={[{ required: true, message: '请输入电话' }]}>
                                                <Input placeholder="电话" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="渠道来源" name="customerChannel" rules={[{ required: true, message: '请选择渠道' }]}>
                                                <Select placeholder="渠道" options={channels.map(c => ({ value: c.code, label: c.name }))} />
                                            </Form.Item>
                                        </Col>

                                        <Col span={8}>
                                            <Form.Item label="身高(cm)" name="customerHeight" rules={[{ required: true, message: '请输入身高' }]}>
                                                <InputNumber placeholder="cm" style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="体重(kg)" name="customerWeight" rules={[{ required: true, message: '请输入体重' }]}>
                                                <InputNumber placeholder="kg" style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="年龄" name="customerAge" rules={[{ required: true, message: '请输入年龄' }]}>
                                                <InputNumber placeholder="岁" style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>

                                        <Col span={8}>
                                            <Form.Item label="客户类型" name="customerType" initialValue="new" rules={[{ required: true, message: '请选择类型' }]}>
                                                <Select placeholder="类型" options={customerTypes.map(t => ({ value: t.code, label: t.name }))} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={16}>
                                            <Form.Item label="收货地址" name="customerAddress" rules={[{ required: true, message: '请输入地址' }]} style={{ marginBottom: 0 }}>
                                                <Input placeholder="请输入详细收货地址" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* 2. 商品明细 */}
                                <Card
                                    title={<Space size={4}><FontAwesomeIcon icon={faBoxOpen} /><span>商品明细</span></Space>}
                                    className={styles.panelCard}
                                    size="small"
                                    style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}
                                    bodyStyle={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                    extra={
                                        <Space size={8}>
                                            <Button
                                                onClick={() => setOrderItems([])}
                                                disabled={orderItems.length === 0}
                                                danger
                                                size="small"
                                                type="text"
                                            >
                                                清空
                                            </Button>
                                            <Button
                                                type="primary"
                                                icon={<FontAwesomeIcon icon={faPlus} />}
                                                onClick={() => setProductModalVisible(true)}
                                                size="small"
                                            >
                                                添加
                                            </Button>
                                        </Space>
                                    }
                                >
                                    <Table
                                        columns={orderItemColumns}
                                        dataSource={orderItems}
                                        rowKey="id"
                                        pagination={false}
                                        locale={{ emptyText: <span style={{ color: '#999' }}>暂无商品，请点击右上角添加</span> }}
                                        scroll={{ y: '100%' }}
                                        size="small"
                                        style={{ flex: 1, overflow: 'hidden' }}
                                    />
                                </Card>

                                {/* 3. 备注 - 压缩高度 */}
                                <Card title="订单备注" className={styles.panelCard} size="small" bodyStyle={{ padding: '8px 12px' }}>
                                    <Form.Item name="remark" noStyle>
                                        <Input
                                            placeholder="输入订单备注信息..."
                                            style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
                                        />
                                    </Form.Item>
                                </Card>
                            </Col>

                            {/* 右侧：设置与结算 (Right Panel) */}
                            <Col xs={24} lg={8} xl={7} className={styles.rightPanel}>
                                {/* 4. 订单设置 */}
                                <Card title={<Space size={4}><FontAwesomeIcon icon={faSliders} /><span>订单设置</span></Space>} className={styles.panelCard} size="small">
                                    <Form.Item label="订单类型" name="orderType" rules={[{ required: true }]} initialValue="new">
                                        <Select options={orderTypeOptions} placeholder="请选择类型" />
                                    </Form.Item>
                                    <Form.Item label="是否发货" name="shipNow" initialValue={true} style={{ marginBottom: 0 }}>
                                        <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                                            <Radio.Button value={true} style={{ flex: 1, textAlign: 'center' }}>立即发货</Radio.Button>
                                            <Radio.Button value={false} style={{ flex: 1, textAlign: 'center' }}>暂不发货</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                </Card>

                                {/* 5. 结算信息 */}
                                <Card title={<Space size={4}><FontAwesomeIcon icon={faWallet} /><span>结算信息</span></Space>} className={styles.panelCard} size="small" style={{ flex: 1 }}>
                                    <Form.Item label="支付方式" name="paymentMethod" rules={[{ required: true }]} initialValue="wechat">
                                        <Select options={paymentOptions} />
                                    </Form.Item>

                                    <div className={styles.moneyBlock}>
                                        <span className={styles.moneyBlockLabel}>订单总额</span>
                                        <span className={styles.moneyBlockValue} style={{ color: '#ff4d4f' }}>¥{totalAmount.toFixed(2)}</span>
                                    </div>

                                    <Form.Item label="实际成交价" name="actualAmount" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                        <InputNumber
                                            min={0}
                                            precision={2}
                                            prefix="¥"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>

                                    <Form.Item label="已收金额" name="paidAmount" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                        <InputNumber
                                            min={0}
                                            max={actualAmount}
                                            precision={2}
                                            prefix="¥"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>

                                    <div className={styles.moneyBlock}>
                                        <span className={styles.moneyBlockLabel}>收款比例</span>
                                        <span className={styles.moneyBlockValue} style={{ color: '#475569' }}>{paidRatio}%</span>
                                    </div>

                                    <div className={styles.moneyBlock} style={{ borderBottom: 'none' }}>
                                        <span className={styles.moneyBlockLabel}>待收金额</span>
                                        <span className={styles.moneyBlockValue} style={{ color: '#1f1f1f' }}>
                                            ¥{pendingAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </Card>

                                {/* 6. 绩效分成 */}
                                <Card
                                    title={<Space size={4}><FontAwesomeIcon icon={faUsers} /><span>绩效分成</span></Space>}
                                    className={styles.panelCard}
                                    size="small"
                                    bodyStyle={{ padding: '8px 12px' }}
                                    extra={
                                        <Button type="link" size="small" onClick={handleAddShare} disabled={profitSharing.length >= 2} icon={<FontAwesomeIcon icon={faPlus} />}>
                                        </Button>
                                    }
                                >
                                    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                                        {profitSharing.map((share, index) => (
                                            <div key={index} className={styles.performanceRow}>
                                                <Row gutter={4} align="middle">
                                                    <Col span={12}>
                                                        <Select
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                            placeholder="员工"
                                                            value={share.userId}
                                                            onChange={(val) => handleShareChange(index, 'userId', val)}
                                                            options={employees.map(e => ({ value: e.id, label: e.name }))}
                                                            disabled={index === 0}
                                                            suffixIcon={null}
                                                            bordered={false}
                                                        />
                                                    </Col>
                                                    <Col span={9}>
                                                        <InputNumber
                                                            size="small"
                                                            min={0}
                                                            max={100}
                                                            value={share.percentage}
                                                            onChange={(val) => handleShareChange(index, 'percentage', val)}
                                                            formatter={value => `${value}%`}
                                                            parser={value => value?.replace('%', '') as unknown as number}
                                                            style={{ width: '100%' }}
                                                            bordered={false}
                                                        />
                                                    </Col>
                                                    <Col span={3} style={{ textAlign: 'center' }}>
                                                        {index > 0 && (
                                                            <FontAwesomeIcon
                                                                icon={faMinusCircle}
                                                                onClick={() => handleRemoveShare(index)}
                                                                style={{ color: '#ff4d4f', cursor: 'pointer' }}
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* 底部操作栏 */}
                    <div className={styles.submitBar}>
                        <Button onClick={handleSaveDraft} size="middle">保存草稿</Button>
                        <Button
                            type="primary"
                            icon={<FontAwesomeIcon icon={orderId ? faSave : faCheck} />}
                            onClick={handleSubmit}
                            style={{ width: 120 }}
                            size="middle"
                        >
                            {orderId ? '保存更新' : '立即创建'}
                        </Button>
                    </div>
                </Form>
            </div>

            {/* 商品选择弹窗 */}
            <Modal
                title="添加商品"
                open={productModalVisible}
                onCancel={() => setProductModalVisible(false)}
                footer={null}
                width={700}
                centered
            >
                <div style={{ marginBottom: 16 }}>
                    <Input placeholder="搜索商品名称" prefix={<FontAwesomeIcon icon={faSearch} color="#bfbfbf" />} style={{ width: '100%' }} size="large" />
                </div>
                <Table
                    columns={productColumns}
                    dataSource={products}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ y: 400 }}
                />
            </Modal>
        </div>
    );
};

export default OrderCreate;
