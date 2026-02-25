import React, { useState, useMemo } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    Space,
    Modal,
    Form,
    InputNumber,
    Upload,
    Typography,
    Row,
    Col,
    message,
    Popconfirm,
    Select,
    Dropdown,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowDown,
    faArrowUp,
    faArrowUpFromBracket,
    faCopy,
    faDownload,
    faEllipsisVertical,
    faFileImport,
    faMagnifyingGlass,
    faPenToSquare,
    faPlus,
    faTrash,
    faUpload,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { useUserStore } from '../../../stores';
import request from '../../../api/request';
import { useEffect } from 'react';
import styles from './warehouse.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ProductRecord {
    id: string;
    image: string;
    name: string;
    spec: string;
    department: string;
    price: number;
    cost: number;
    // status: 'on' | 'off' | 'out'; // Removed status
    sort: number;
}

// 模拟商品数据（使用可靠的占位图服务）
/*
const mockData: ProductRecord[] = [
    { id: 'P001', image: 'https://picsum.photos/seed/p1/60/60', name: '瘦身胶囊A', spec: '60粒/盒', department: '销售部', price: 298, cost: 100, sort: 1 },
    { id: 'P002', image: 'https://picsum.photos/seed/p2/60/60', name: '瘦身胶囊B', spec: '90粒/盒', department: '销售部', price: 398, cost: 150, sort: 2 },
    { id: 'P003', image: 'https://picsum.photos/seed/p3/60/60', name: '代餐粉', spec: '500g/罐', department: '运营部', price: 168, cost: 60, sort: 3 },
    { id: 'P004', image: 'https://picsum.photos/seed/p4/60/60', name: '酵素饮', spec: '30袋/盒', department: '运营部', price: 258, cost: 80, sort: 4 },
    { id: 'P005', image: 'https://picsum.photos/seed/p5/60/60', name: '膳食纤维片', spec: '120片/瓶', department: '销售部', price: 188, cost: 65, sort: 5 },
    { id: 'P006', image: 'https://picsum.photos/seed/p6/60/60', name: '左旋肉碱', spec: '60粒/瓶', department: '销售部', price: 268, cost: 90, sort: 6 },
    { id: 'P007', image: 'https://picsum.photos/seed/p7/60/60', name: '蛋白奶昔-香草味', spec: '750g/桶', department: '运营部', price: 328, cost: 120, sort: 7 },
    { id: 'P008', image: 'https://picsum.photos/seed/p8/60/60', name: '蛋白奶昔-巧克力味', spec: '750g/桶', department: '运营部', price: 328, cost: 120, sort: 8 },
    { id: 'P009', image: 'https://picsum.photos/seed/p9/60/60', name: '益生菌粉', spec: '2g*30袋', department: '销售部', price: 198, cost: 70, sort: 9 },
    { id: 'P010', image: 'https://picsum.photos/seed/p10/60/60', name: '燃脂咖啡', spec: '15袋/盒', department: '运营部', price: 158, cost: 55, sort: 10 },
    { id: 'P011', image: 'https://picsum.photos/seed/p11/60/60', name: '魔芋代餐饼干', spec: '200g/盒', department: '销售部', price: 88, cost: 30, sort: 11 },
    { id: 'P012', image: 'https://picsum.photos/seed/p12/60/60', name: '胶原蛋白肽', spec: '5g*20袋', department: '运营部', price: 368, cost: 130, sort: 12 },
    { id: 'P013', image: 'https://picsum.photos/seed/p13/60/60', name: '维生素B族', spec: '60片/瓶', department: '销售部', price: 68, cost: 20, sort: 13 },
    { id: 'P014', image: 'https://picsum.photos/seed/p14/60/60', name: '减脂套餐(30天)', spec: '套餐组合', department: '销售部', price: 698, cost: 280, sort: 14 },
    { id: 'P015', image: 'https://picsum.photos/seed/p15/60/60', name: '减脂套餐(60天)', spec: '套餐组合', department: '销售部', price: 1298, cost: 500, sort: 15 },
];
*/

const ProductManage: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [form] = Form.useForm();
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [dataSource, setDataSource] = useState<ProductRecord[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res: any = await request.get('/products');
            setDataSource(Array.isArray(res) ? res : res?.data?.items || res?.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    // 获取用户权限
    const user = useUserStore((state) => state.user);
    const canViewCost = user?.permissionList?.includes('canAccessAudit') || user?.role === 'admin';

    // 打开新增/编辑弹窗
    const handleOpenModal = (product?: ProductRecord) => {
        setEditingProduct(product || null);
        if (product) {
            form.setFieldsValue(product);
        } else {
            form.resetFields();
        }
        setModalVisible(true);
    };

    // 保存商品
    const handleSave = () => {
        form.validateFields().then((values) => {
            console.log('保存商品:', values);
            if (editingProduct) {
                // 编辑
                setDataSource((prev) => prev.map((item) => (item.id === editingProduct.id ? { ...item, ...values } : item)));
                message.success('商品已更新！');
            } else {
                // 新增
                const newProduct: ProductRecord = {
                    id: `P${Date.now()}`,
                    ...values,
                    sort: dataSource.length + 1,
                    image: 'https://picsum.photos/seed/new/60/60', // 默认图
                };
                setDataSource((prev) => [...prev, newProduct]);
                message.success('商品已添加！');
            }
            setModalVisible(false);
        });
    };

    // 置顶商品
    const handleSetToTop = (record: ProductRecord) => {
        const sortedData = [...dataSource].sort((a, b) => a.sort - b.sort);
        const currentIndex = sortedData.findIndex((item) => item.id === record.id);
        if (currentIndex === 0) return; // 已经是第一个

        // 重新计算 sort 值：当前最小 sort - 1
        const minSort = sortedData[0].sort;
        const newSort = minSort - 1;

        const newData = dataSource
            .map((item) => (item.id === record.id ? { ...item, sort: newSort } : item))
            .sort((a, b) => a.sort - b.sort);

        setDataSource(newData);
        message.success(`${record.name} 已置顶！`);
    };

    // 上移商品
    const handleMoveUp = (record: ProductRecord) => {
        const sortedData = [...dataSource].sort((a, b) => a.sort - b.sort);
        const index = sortedData.findIndex((item) => item.id === record.id);
        if (index === 0) return; // 已经是第一个

        const prevItem = sortedData[index - 1];

        // 交换 sort 值
        const newData = dataSource.map((item) => {
            if (item.id === record.id) return { ...item, sort: prevItem.sort };
            if (item.id === prevItem.id) return { ...item, sort: record.sort };
            return item;
        }).sort((a, b) => a.sort - b.sort);

        setDataSource(newData);
    };

    // 下移商品
    const handleMoveDown = (record: ProductRecord) => {
        const sortedData = [...dataSource].sort((a, b) => a.sort - b.sort);
        const index = sortedData.findIndex((item) => item.id === record.id);
        if (index === sortedData.length - 1) return; // 已经是最后一个

        const nextItem = sortedData[index + 1];

        // 交换 sort 值
        const newData = dataSource.map((item) => {
            if (item.id === record.id) return { ...item, sort: nextItem.sort };
            if (item.id === nextItem.id) return { ...item, sort: record.sort };
            return item;
        }).sort((a, b) => a.sort - b.sort);

        setDataSource(newData);
    };

    // 复制商品
    const handleCopy = (product: ProductRecord) => {
        form.setFieldsValue({
            ...product,
            name: `${product.name} - 副本`,
        });
        setEditingProduct(null);
        setModalVisible(true);
    };

    // 删除商品
    const handleDelete = (product: ProductRecord) => {
        setDataSource((prev) => prev.filter((item) => item.id !== product.id));
        message.success(`${product.name} 已删除！`);
    };

    // 批量删除
    const handleBatchDelete = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择要删除的商品');
            return;
        }
        setDataSource((prev) => prev.filter((item) => !selectedRowKeys.includes(item.id)));
        message.success(`已删除 ${selectedRowKeys.length} 个商品！`);
        setSelectedRowKeys([]);
    };

    // 导出商品
    const handleExport = () => {
        // 生成 CSV 内容
        const headers = ['商品ID', '商品名称', '规格', '部门', '售价', '成本'];
        const rows = dataSource.map(item => [
            item.id,
            item.name,
            item.spec,
            item.department,
            item.price,
            item.cost,
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `商品列表_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        message.success('商品数据已导出！');
    };

    // 下载导入模板
    const handleDownloadTemplate = () => {
        const headers = ['商品名称', '规格', '部门', '售价', '成本'];
        const example = ['示例商品', '100g/盒', '销售部', '199', '80'];
        const csvContent = [headers.join(','), example.join(',')].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '商品导入模板.csv';
        link.click();
        URL.revokeObjectURL(url);
        message.success('模板已下载！');
    };

    // 导入商品（提交）
    const handleImportSubmit = () => {
        setImportLoading(true);
        setTimeout(() => {
            message.success('成功导入 15 条商品数据！');
            setImportLoading(false);
            setImportModalVisible(false);
        }, 1500);
    };

    // 批量操作菜单
    const batchMenuItems: MenuProps['items'] = [
        { key: 'export', label: '导出选中商品', icon: <FontAwesomeIcon icon={faDownload} />, onClick: handleExport },
        { type: 'divider' },
        { key: 'delete', label: '批量删除', danger: true, onClick: handleBatchDelete },
    ];

    // 动态生成列（根据权限显示成本列）
    const columns: ColumnsType<ProductRecord> = useMemo(() => {
        const baseColumns: ColumnsType<ProductRecord> = [
            {
                title: '主图',
                dataIndex: 'image',
                key: 'image',
                width: 80,
                render: (url: string) => (
                    <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <img
                            src={url}
                            alt="商品图"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxMiI+5Zu+54mHPC90ZXh0Pjwvc3ZnPg==';
                            }}
                        />
                    </div>
                ),
            },
            {
                title: '排序',
                dataIndex: 'sort',
                key: 'sort',
                width: 140,
                sorter: (a, b) => a.sort - b.sort,
                render: (_, record) => (
                    <Space size={2}>
                        <Button
                            type="text"
                            size="small"
                            icon={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
                            title="置顶"
                            onClick={(e) => { e.stopPropagation(); handleSetToTop(record); }}
                        />
                        <Button
                            type="text"
                            size="small"
                            icon={<FontAwesomeIcon icon={faArrowUp} />}
                            title="上移"
                            onClick={(e) => { e.stopPropagation(); handleMoveUp(record); }}
                        />
                        <Button
                            type="text"
                            size="small"
                            icon={<FontAwesomeIcon icon={faArrowDown} />}
                            title="下移"
                            onClick={(e) => { e.stopPropagation(); handleMoveDown(record); }}
                        />
                    </Space>
                ),
            },
            {
                title: '商品名称',
                dataIndex: 'name',
                key: 'name',
                width: 150,
            },
            {
                title: '规格',
                dataIndex: 'spec',
                key: 'spec',
                width: 100,
            },
            {
                title: '部门',
                dataIndex: 'department',
                key: 'department',
                width: 90,
            },
            {
                title: '售价',
                dataIndex: 'price',
                key: 'price',
                width: 100,
                render: (price: number) => <Text strong>¥{price}</Text>,
            },
        ];

        // 财务权限才显示成本列
        if (canViewCost) {
            baseColumns.push({
                title: '成本',
                dataIndex: 'cost',
                key: 'cost',
                width: 100,
                render: (cost: number) => <Text type="secondary">¥{cost}</Text>,
            });
        }

        baseColumns.push(
            {
                title: '操作',
                key: 'action',
                width: 200,
                render: (_, record) => (
                    <Space>
                        <Button type="link" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => handleOpenModal(record)}>
                            编辑
                        </Button>
                        <Button type="link" size="small" icon={<FontAwesomeIcon icon={faCopy} />} onClick={() => handleCopy(record)}>
                            复制
                        </Button>
                        <Popconfirm title="确认删除此商品？" onConfirm={() => handleDelete(record)}>
                            <Button type="link" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />}>
                                删除
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            }
        );

        return baseColumns;
    }, [canViewCost]);

    // 表格行选择配置
    const rowSelection = {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>商品管理</Title>
                <Space>
                    <Button icon={<FontAwesomeIcon icon={faFileImport} />} onClick={() => setImportModalVisible(true)}>
                        导入商品
                    </Button>
                    <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => handleOpenModal()}>
                        新增商品
                    </Button>
                </Space>
            </div>

            <Card className={styles.card}>
                <div className={styles.searchArea}>
                    <Space wrap>
                        <Input placeholder="商品名称" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 200 }} />
                        <Select placeholder="部门" allowClear style={{ width: 120 }}>
                            <Select.Option value="销售部">销售部</Select.Option>
                            <Select.Option value="运营部">运营部</Select.Option>
                        </Select>
                        <Button type="primary" icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>搜索</Button>
                    </Space>
                    {selectedRowKeys.length > 0 && (
                        <Space style={{ marginLeft: 16 }}>
                            <Text type="secondary">已选 {selectedRowKeys.length} 项</Text>
                            <Dropdown menu={{ items: batchMenuItems }}>
                                <Button icon={<FontAwesomeIcon icon={faEllipsisVertical} />}>批量操作</Button>
                            </Dropdown>
                        </Space>
                    )}
                </div>

                <Table
                    columns={columns}
                    dataSource={dataSource}
                    rowKey="id"
                    rowSelection={rowSelection}
                    pagination={{
                        total: 20,
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 导入商品模态框 */}
            <Modal
                title="导入商品"
                open={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onOk={handleImportSubmit}
                confirmLoading={importLoading}
                width={500}
                okText="开始导入"
                cancelText="取消"
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Upload.Dragger accept=".csv,.xlsx" maxCount={1}>
                        <p className="ant-upload-drag-icon">
                            <FontAwesomeIcon icon={faFileImport} style={{ color: '#4096ff' }} />
                        </p>
                        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                        <p className="ant-upload-hint">支持扩展名：.csv .xlsx</p>
                    </Upload.Dragger>
                    <div style={{ marginTop: 20, textAlign: 'left' }}>
                        <Text type="secondary">提示：请先下载模板，按照格式填写后再上传。</Text>
                        <div style={{ marginTop: 8 }}>
                            <Button type="link" icon={<FontAwesomeIcon icon={faDownload} />} onClick={handleDownloadTemplate} style={{ paddingLeft: 0 }}>
                                下载导入模板
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* 新增/编辑弹窗 */}
            <Modal
                title={editingProduct ? '编辑商品' : '新增商品'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSave}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="商品主图" name="image">
                        <Upload listType="picture-card" maxCount={1}>
                            <div>
                                <FontAwesomeIcon icon={faUpload} />
                                <div style={{ marginTop: 8 }}>上传</div>
                            </div>
                        </Upload>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="商品名称"
                                name="name"
                                rules={[{ required: true, message: '请输入商品名称' }]}
                            >
                                <Input placeholder="请输入商品名称" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="规格"
                                name="spec"
                                rules={[{ required: true, message: '请输入规格' }]}
                            >
                                <Input placeholder="如：60粒/盒" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="部门"
                                name="department"
                                rules={[{ required: true, message: '请选择部门' }]}
                            >
                                <Select placeholder="选择部门">
                                    <Select.Option value="销售部">销售部</Select.Option>
                                    <Select.Option value="运营部">运营部</Select.Option>
                                    <Select.Option value="技术部">技术部</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="售价"
                                name="price"
                                rules={[{ required: true, message: '请输入售价' }]}
                            >
                                <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {canViewCost && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="成本" name="cost">
                                    <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    <Form.Item label="商品描述" name="description">
                        <TextArea rows={3} placeholder="请输入商品描述" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductManage;
