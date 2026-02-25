import React, { useState } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    Space,
    Modal,
    Form,
    InputNumber,
    Select,
    Typography,
    message,
    Tag,
    Tooltip,
    Popconfirm,
    Switch,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faArrowRightArrowLeft,
    faArrowUpFromBracket,
    faClockRotateLeft,
    faGear,
    faMagnifyingGlass,
    faMinus,
    faPlus,
    faTrash,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import request from '../../../api/request';
import { useEffect } from 'react';
import styles from './warehouse.module.css';

const { Title, Text } = Typography;

// 仓库库存结构
interface WarehouseStock {
    warehouseName: string;
    current: number;
    available: number;
}

interface StockRecord {
    id: string;
    productName: string;
    spec: string;
    /** 多仓库库存明细 */
    warehouseStocks: WarehouseStock[];
    /** 当前库存汇总 */
    currentStock: number;
    /** 可用库存汇总 */
    availableStock: number;
    /** 库存预警值 */
    warningValue: number;
    inTotal: number;
    outTotal: number;
    status: 'on' | 'off';
}

// 模拟库存数据（多仓库维度，包含主仓、分仓1、分仓2、分仓3）
/*
const mockData: StockRecord[] = [
    { id: 'P001', productName: '瘦身胶囊A', spec: '60粒/盒', warehouseStocks: [{ warehouseName: '主仓', current: 200, available: 180 }, { warehouseName: '分仓1', current: 150, available: 130 }, { warehouseName: '分仓2', current: 100, available: 90 }, { warehouseName: '分仓3', current: 50, available: 50 }], currentStock: 500, availableStock: 450, warningValue: 100, inTotal: 1000, outTotal: 500, status: 'on' },
    { id: 'P002', productName: '瘦身胶囊B', spec: '90粒/盒', warehouseStocks: [{ warehouseName: '主仓', current: 120, available: 110 }, { warehouseName: '分仓1', current: 80, available: 70 }, { warehouseName: '分仓2', current: 60, available: 60 }, { warehouseName: '分仓3', current: 40, available: 40 }], currentStock: 300, availableStock: 280, warningValue: 100, inTotal: 600, outTotal: 300, status: 'on' },
    { id: 'P003', productName: '代餐粉', spec: '500g/罐', warehouseStocks: [{ warehouseName: '主仓', current: 20, available: 15 }, { warehouseName: '分仓1', current: 15, available: 15 }, { warehouseName: '分仓2', current: 10, available: 10 }], currentStock: 45, availableStock: 40, warningValue: 50, inTotal: 400, outTotal: 355, status: 'on' },
    { id: 'P004', productName: '酵素饮', spec: '30袋/盒', warehouseStocks: [{ warehouseName: '主仓', current: 0, available: 0 }, { warehouseName: '分仓1', current: 0, available: 0 }], currentStock: 0, availableStock: 0, warningValue: 50, inTotal: 300, outTotal: 300, status: 'on' },
    { id: 'P005', productName: '膳食纤维片', spec: '120片/瓶', warehouseStocks: [{ warehouseName: '主仓', current: 50, available: 40 }, { warehouseName: '分仓1', current: 30, available: 25 }, { warehouseName: '分仓2', current: 25, available: 20 }, { warehouseName: '分仓3', current: 15, available: 15 }], currentStock: 120, availableStock: 100, warningValue: 200, inTotal: 500, outTotal: 380, status: 'off' },
    { id: 'P006', productName: '左旋肉碱', spec: '60粒/瓶', warehouseStocks: [{ warehouseName: '主仓', current: 0, available: 0 }], currentStock: 0, availableStock: 0, warningValue: 50, inTotal: 200, outTotal: 200, status: 'on' },
    { id: 'P007', productName: '蛋白奶昔-香草味', spec: '750g/桶', warehouseStocks: [{ warehouseName: '主仓', current: 30, available: 28 }, { warehouseName: '分仓1', current: 25, available: 22 }, { warehouseName: '分仓2', current: 15, available: 15 }, { warehouseName: '分仓3', current: 10, available: 10 }], currentStock: 80, availableStock: 75, warningValue: 100, inTotal: 400, outTotal: 320, status: 'on' },
    { id: 'P008', productName: '蛋白奶昔-巧克力味', spec: '750g/桶', warehouseStocks: [{ warehouseName: '主仓', current: 40, available: 38 }, { warehouseName: '分仓1', current: 30, available: 27 }, { warehouseName: '分仓2', current: 15, available: 15 }, { warehouseName: '分仓3', current: 10, available: 10 }], currentStock: 95, availableStock: 90, warningValue: 100, inTotal: 420, outTotal: 325, status: 'on' },
    { id: 'P009', productName: '益生菌粉', spec: '2g*30袋', warehouseStocks: [{ warehouseName: '主仓', current: 250, available: 240 }, { warehouseName: '分仓1', current: 150, available: 145 }, { warehouseName: '分仓2', current: 120, available: 115 }, { warehouseName: '分仓3', current: 80, available: 80 }], currentStock: 600, availableStock: 580, warningValue: 200, inTotal: 1200, outTotal: 600, status: 'on' },
    { id: 'P010', productName: '燃脂咖啡', spec: '15袋/盒', warehouseStocks: [{ warehouseName: '主仓', current: 10, available: 8 }, { warehouseName: '分仓1', current: 8, available: 6 }, { warehouseName: '分仓2', current: 7, available: 6 }], currentStock: 25, availableStock: 20, warningValue: 50, inTotal: 300, outTotal: 275, status: 'on' },
    { id: 'P011', productName: '魔芋代餐饼干', spec: '200g/盒', warehouseStocks: [{ warehouseName: '主仓', current: 60, available: 55 }, { warehouseName: '分仓1', current: 40, available: 38 }, { warehouseName: '分仓2', current: 30, available: 27 }, { warehouseName: '分仓3', current: 20, available: 20 }], currentStock: 150, availableStock: 140, warningValue: 100, inTotal: 500, outTotal: 350, status: 'off' },
    { id: 'P012', productName: '胶原蛋白肽', spec: '5g*20袋', warehouseStocks: [{ warehouseName: '主仓', current: 0, available: 0 }], currentStock: 0, availableStock: 0, warningValue: 50, inTotal: 200, outTotal: 200, status: 'off' },
    { id: 'P013', productName: '维生素B族', spec: '60片/瓶', warehouseStocks: [{ warehouseName: '主仓', current: 120, available: 115 }, { warehouseName: '分仓1', current: 80, available: 78 }, { warehouseName: '分仓2', current: 60, available: 57 }, { warehouseName: '分仓3', current: 40, available: 40 }], currentStock: 300, availableStock: 290, warningValue: 50, inTotal: 600, outTotal: 300, status: 'on' },
    { id: 'P014', productName: '减脂套餐(30天)', spec: '套餐组合', warehouseStocks: [{ warehouseName: '主仓', current: 6, available: 6 }, { warehouseName: '分仓1', current: 4, available: 4 }], currentStock: 10, availableStock: 10, warningValue: 20, inTotal: 100, outTotal: 90, status: 'on' },
    { id: 'P015', productName: '减脂套餐(60天)', spec: '套餐组合', warehouseStocks: [{ warehouseName: '主仓', current: 3, available: 3 }, { warehouseName: '分仓1', current: 2, available: 2 }], currentStock: 5, availableStock: 5, warningValue: 10, inTotal: 50, outTotal: 45, status: 'on' },
];
*/

type OperationType = 'in' | 'out' | 'transfer';

// 仓库列表数据
interface Warehouse {
    id: string;
    name: string;
    address: string;
    isDefault: boolean;
}

const defaultWarehouses: Warehouse[] = [
    { id: 'W001', name: '主仓', address: '上海市浦东新区', isDefault: true },
    { id: 'W002', name: '分仓1', address: '南京市江宁区', isDefault: false },
    { id: 'W003', name: '分仓2', address: '杭州市余杭区', isDefault: false },
    { id: 'W004', name: '分仓3', address: '深圳市南山区', isDefault: false },
];

const StockManage: React.FC = () => {
    const navigate = useNavigate();
    const [modalVisible, setModalVisible] = useState(false);
    const [operationType, setOperationType] = useState<OperationType>('in');
    const [selectedProduct, setSelectedProduct] = useState<StockRecord | null>(null);
    const [form] = Form.useForm();
    const [warehouseForm] = Form.useForm();
    const [pageMockData, setPageMockData] = useState<StockRecord[]>([]);

    useEffect(() => {
        fetchData();
        fetchWarehouses();
    }, []);

    const fetchData = async () => {
        try {
            const res: any = await request.get('/warehouses/stock');
            setPageMockData(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Fetch stocks failed', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res: any = await request.get('/warehouses');
            const data = Array.isArray(res) ? res : res?.data?.items || res?.data || [];
            if (data.length > 0) {
                setWarehouses(data);
            }
        } catch (error) {
            console.error('Fetch warehouses failed', error);
        }
    };

    // 仓库设置状态
    const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>(defaultWarehouses);
    const [addWarehouseVisible, setAddWarehouseVisible] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

    // 库存显示模式: true=分仓明细, false=合计
    const [showWarehouseDetail, setShowWarehouseDetail] = useState(false);

    // 编辑预警值状态
    const [editingWarningId, setEditingWarningId] = useState<string | null>(null);
    const [editingWarningValue, setEditingWarningValue] = useState<number>(0);

    // 打开操作弹窗
    const handleOpenModal = (type: OperationType, product: StockRecord) => {
        setOperationType(type);
        setSelectedProduct(product);
        form.resetFields();
        setModalVisible(true);
    };

    // 执行操作
    const handleSubmit = () => {
        form.validateFields().then((values) => {
            const typeText = { in: '入库', out: '出库', transfer: '调库' }[operationType];
            console.log(`${typeText}操作:`, values);
            message.success(`${typeText}成功！`);
            setModalVisible(false);
        });
    };

    // 切换上架/下架状态
    const handleToggleStatus = (record: StockRecord) => {
        const newStatus = record.status === 'on' ? 'off' : 'on';
        const actionText = newStatus === 'on' ? '上架' : '下架';

        // 更新本地 Mock 数据状态
        const newData = pageMockData.map(item =>
            item.id === record.id ? { ...item, status: newStatus as 'on' | 'off' } : item
        );
        setPageMockData(newData);
        message.success(`商品已${actionText}`);
    };

    // 判断是否低于预警值
    const isLowStock = (record: StockRecord) => {
        return record.currentStock > 0 && record.currentStock <= record.warningValue;
    };

    // 统计预警商品数量
    const warningCount = pageMockData.filter(isLowStock).length;

    const columns: ColumnsType<StockRecord> = [
        {
            title: '商品名称',
            dataIndex: 'productName',
            key: 'productName',
            width: 150,
        },
        {
            title: '规格',
            dataIndex: 'spec',
            key: 'spec',
            width: 100,
        },
        {
            title: '仓库',
            key: 'warehouse',
            width: 100,
            render: (_, record) => {
                if (showWarehouseDetail) {
                    // 分仓模式：显示各仓库名称（纵向排列）
                    return (
                        <div style={{ fontSize: 12 }}>
                            {record.warehouseStocks.map((ws) => (
                                <div key={ws.warehouseName} style={{ marginBottom: 4, lineHeight: '20px' }}>
                                    {ws.warehouseName}
                                </div>
                            ))}
                        </div>
                    );
                }
                // 合计模式：显示"全仓"
                return <Text>全仓</Text>;
            },
        },
        {
            title: '库存（当前/可用）',
            key: 'stock',
            width: 160,
            render: (_, record) => {
                if (showWarehouseDetail) {
                    // 分仓模式：显示各仓库库存（纵向排列），每个仓库单独判断预警
                    return (
                        <div style={{ fontSize: 12 }}>
                            {record.warehouseStocks.map((ws) => {
                                const isZero = ws.current === 0 && ws.available === 0;
                                // 计算该仓库的预警比例（基于仓库在总库存中的占比）
                                const warehouseWarningValue = Math.ceil(record.warningValue / record.warehouseStocks.length);
                                const isWarehouseLowStock = ws.current > 0 && ws.current <= warehouseWarningValue;
                                return (
                                    <div key={ws.warehouseName} style={{ marginBottom: 4, lineHeight: '20px' }}>
                                        <Text type={isZero ? 'secondary' : (isWarehouseLowStock ? 'danger' : undefined)}>
                                            {ws.current} / {ws.available}
                                        </Text>
                                        {isWarehouseLowStock && (
                                            <Tag color="error" style={{ fontSize: 10, marginLeft: 4, padding: '0 4px' }}>
                                                预警
                                            </Tag>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                // 合计模式：显示总库存
                const isZero = record.currentStock === 0 && record.availableStock === 0;
                return (
                    <Space>
                        <Text strong type={isZero ? 'secondary' : (isLowStock(record) ? 'danger' : undefined)}>
                            {record.currentStock} / {record.availableStock}
                        </Text>
                        {isLowStock(record) && (
                            <Tooltip title={`低于预警值 ${record.warningValue}`}>
                                <Tag color="error" icon={<FontAwesomeIcon icon={faTriangleExclamation} />}>
                                    预警
                                </Tag>
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
        {
            title: '状态',
            key: 'status',
            width: 100,
            render: (_, record) => {
                if (record.currentStock === 0) {
                    return <Tag color="red">缺货</Tag>;
                }
                return record.status === 'on' ?
                    <Tag color="success">已上架</Tag> :
                    <Tag color="default">已下架</Tag>;
            },
        },
        {
            title: '预警值',
            dataIndex: 'warningValue',
            key: 'warningValue',
            width: 120,
            render: (value: number, record) => {
                if (editingWarningId === record.id) {
                    return (
                        <Space size={4}>
                            <InputNumber
                                size="small"
                                min={0}
                                value={editingWarningValue}
                                onChange={(v) => setEditingWarningValue(v || 0)}
                                style={{ width: 60 }}
                            />
                            <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                    const newData = pageMockData.map(item =>
                                        item.id === record.id ? { ...item, warningValue: editingWarningValue } : item
                                    );
                                    setPageMockData(newData);
                                    setEditingWarningId(null);
                                    message.success('预警值已更新');
                                }}
                            >
                                保存
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => setEditingWarningId(null)}
                            >
                                取消
                            </Button>
                        </Space>
                    );
                }
                return (
                    <Space>
                        <Text type="secondary">{value}</Text>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setEditingWarningId(record.id);
                                setEditingWarningValue(value);
                            }}
                        >
                            编辑
                        </Button>
                    </Space>
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 280,
            render: (_, record) => (
                <Space>
                    <Popconfirm
                        title={`确定要${record.status === 'on' ? '下架' : '上架'}该商品吗？`}
                        onConfirm={() => handleToggleStatus(record)}
                    >
                        <Button
                            size="small"
                            type={record.status === 'on' ? 'default' : 'primary'}
                            ghost={record.status === 'off'}
                            icon={record.status === 'on' ? <FontAwesomeIcon icon={faDownload} /> : <FontAwesomeIcon icon={faArrowUpFromBracket} />}
                        >
                            {record.status === 'on' ? '下架' : '上架'}
                        </Button>
                    </Popconfirm>
                    <Button
                        type="primary"
                        size="small"
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={() => handleOpenModal('in', record)}
                    >
                        入库
                    </Button>
                    <Button
                        size="small"
                        icon={<FontAwesomeIcon icon={faMinus} />}
                        onClick={() => handleOpenModal('out', record)}
                    >
                        出库
                    </Button>
                    <Button
                        size="small"
                        icon={<FontAwesomeIcon icon={faArrowRightArrowLeft} />}
                        onClick={() => handleOpenModal('transfer', record)}
                    >
                        调库
                    </Button>
                </Space>
            ),
        },
    ];

    // 弹窗标题
    const modalTitle = {
        in: '入库操作',
        out: '出库操作',
        transfer: '调库操作',
    }[operationType];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>产品库存</Title>
                <Space>
                    {warningCount > 0 && (
                        <Tag color="error" icon={<FontAwesomeIcon icon={faTriangleExclamation} />} style={{ padding: '4px 12px', fontSize: 14 }}>
                            {warningCount} 个商品库存预警
                        </Tag>
                    )}
                    <Button
                        icon={<FontAwesomeIcon icon={faGear} />}
                        onClick={() => setWarehouseModalVisible(true)}
                    >
                        仓库设置
                    </Button>
                    <Button
                        icon={<FontAwesomeIcon icon={faClockRotateLeft} />}
                        onClick={() => navigate('/mall/warehouse/stock-records')}
                    >
                        出入库记录
                    </Button>
                </Space>
            </div>

            <Card className={styles.card}>
                <div className={styles.searchArea}>
                    <Space>
                        <Input placeholder="商品名称" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 200 }} />
                        <Select
                            placeholder="库存状态"
                            style={{ width: 120 }}
                            allowClear
                            options={[
                                { value: 'all', label: '全部' },
                                { value: 'on', label: '已上架' },
                                { value: 'off', label: '已下架' },
                                { value: 'out', label: '缺货' },
                                { value: 'warning', label: '库存预警' },
                            ]}
                        />
                        <Button type="primary" icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>搜索</Button>
                        <span style={{ marginLeft: 16 }}>
                            <Text type="secondary" style={{ marginRight: 8 }}>显示模式:</Text>
                            <Switch
                                checkedChildren="分仓"
                                unCheckedChildren="合计"
                                checked={showWarehouseDetail}
                                onChange={setShowWarehouseDetail}
                            />
                        </span>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={pageMockData}
                    rowKey="id"
                    pagination={{
                        total: pageMockData.length,
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 操作弹窗 */}
            <Modal
                title={modalTitle}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit}
            >
                {selectedProduct && (
                    <div className={styles.productInfo}>
                        <Text>商品：</Text>
                        <Text strong>{selectedProduct.productName}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>{selectedProduct.spec}</Text>
                        <Text type="secondary" style={{ marginLeft: 16 }}>当前库存：{selectedProduct.currentStock}</Text>
                        {isLowStock(selectedProduct) && (
                            <Tag color="error" style={{ marginLeft: 8 }}>预警</Tag>
                        )}
                        {selectedProduct.currentStock === 0 && (
                            <Tag color="red" style={{ marginLeft: 8 }}>缺货</Tag>
                        )}
                    </div>
                )}
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        label="数量"
                        name="quantity"
                        rules={[{ required: true, message: '请输入数量' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
                    </Form.Item>
                    {/* 入库时显示入库单价 */}
                    {operationType === 'in' && (
                        <Form.Item
                            label="入库单价"
                            name="unitPrice"
                            rules={[{ required: true, message: '请输入入库单价' }]}
                        >
                            <InputNumber
                                min={0}
                                precision={2}
                                prefix="¥"
                                style={{ width: '100%' }}
                                placeholder="请输入入库单价"
                            />
                        </Form.Item>
                    )}
                    {operationType === 'transfer' && (
                        <Form.Item
                            label="目标仓库"
                            name="targetWarehouse"
                            rules={[{ required: true, message: '请选择目标仓库' }]}
                        >
                            <Select
                                placeholder="请选择目标仓库"
                                options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                            />
                        </Form.Item>
                    )}
                    <Form.Item label="备注" name="remark">
                        <Input.TextArea rows={2} placeholder="请输入备注" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 仓库设置模态框 */}
            <Modal
                title="仓库设置"
                open={warehouseModalVisible}
                onCancel={() => {
                    setWarehouseModalVisible(false);
                    setAddWarehouseVisible(false);
                    warehouseForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <Button
                        type="primary"
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={() => setAddWarehouseVisible(true)}
                    >
                        添加仓库
                    </Button>
                </div>

                {addWarehouseVisible && (
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Form form={warehouseForm} layout="inline">
                            <Form.Item
                                name="name"
                                rules={[{ required: true, message: '请输入仓库名称' }]}
                            >
                                <Input placeholder="仓库名称" style={{ width: 120 }} />
                            </Form.Item>
                            <Form.Item
                                name="address"
                                rules={[{ required: true, message: '请输入仓库地址' }]}
                            >
                                <Input placeholder="仓库地址" style={{ width: 180 }} />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => {
                                            warehouseForm.validateFields().then(values => {
                                                const newWarehouse: Warehouse = {
                                                    id: `W${Date.now()}`,
                                                    name: values.name,
                                                    address: values.address,
                                                    isDefault: false,
                                                };
                                                setWarehouses([...warehouses, newWarehouse]);
                                                warehouseForm.resetFields();
                                                setAddWarehouseVisible(false);
                                                message.success('仓库添加成功');
                                            });
                                        }}
                                    >
                                        确定
                                    </Button>
                                    <Button size="small" onClick={() => {
                                        setAddWarehouseVisible(false);
                                        warehouseForm.resetFields();
                                    }}>
                                        取消
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                )}

                <Table
                    dataSource={warehouses}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                        {
                            title: '仓库名称',
                            dataIndex: 'name',
                            key: 'name',
                            width: 120,
                            render: (text, record) => {
                                if (editingWarehouse?.id === record.id) {
                                    return (
                                        <Input
                                            size="small"
                                            defaultValue={text}
                                            onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                                        />
                                    );
                                }
                                return text;
                            }
                        },
                        {
                            title: '仓库地址',
                            dataIndex: 'address',
                            key: 'address',
                            render: (text, record) => {
                                if (editingWarehouse?.id === record.id) {
                                    return (
                                        <Input
                                            size="small"
                                            defaultValue={text}
                                            onChange={(e) => setEditingWarehouse({ ...editingWarehouse, address: e.target.value })}
                                        />
                                    );
                                }
                                return text;
                            }
                        },
                        {
                            title: '状态',
                            key: 'status',
                            width: 80,
                            render: (_, record) => record.isDefault ? <Tag color="blue">默认</Tag> : null
                        },
                        {
                            title: '操作',
                            key: 'action',
                            width: 140,
                            render: (_, record) => (
                                <Space>
                                    {editingWarehouse?.id === record.id ? (
                                        <>
                                            <Button
                                                type="link"
                                                size="small"
                                                onClick={() => {
                                                    setWarehouses(warehouses.map(w =>
                                                        w.id === editingWarehouse.id ? editingWarehouse : w
                                                    ));
                                                    setEditingWarehouse(null);
                                                    message.success('仓库信息已更新');
                                                }}
                                            >
                                                保存
                                            </Button>
                                            <Button
                                                type="link"
                                                size="small"
                                                onClick={() => setEditingWarehouse(null)}
                                            >
                                                取消
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={() => setEditingWarehouse(record)}
                                        >
                                            编辑
                                        </Button>
                                    )}
                                    {!record.isDefault && !editingWarehouse && (
                                        <Popconfirm
                                            title="确定删除该仓库？"
                                            onConfirm={() => {
                                                setWarehouses(warehouses.filter(w => w.id !== record.id));
                                                message.success('仓库删除成功');
                                            }}
                                        >
                                            <Button type="link" danger size="small" icon={<FontAwesomeIcon icon={faTrash} />}>
                                                删除
                                            </Button>
                                        </Popconfirm>
                                    )}
                                </Space>
                            ),
                        },
                    ]}
                />
            </Modal>
        </div>
    );
};

export default StockManage;
