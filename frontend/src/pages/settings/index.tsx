import React, { useState, useEffect } from 'react';
import {
    Card,
    Tabs,
    Table,
    Button,
    Space,
    Tag,
    Form,
    Input,
    Switch,
    Typography,
    message,
    Popconfirm,
    Select,

    Avatar,
    Modal,
    Checkbox,
    Col, Row,
    Divider,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFile,
    faGear,
    faMagnifyingGlass,
    faPenToSquare,
    faPlus,
    faTrash,
    faUser,
    faKey,
} from '@fortawesome/free-solid-svg-icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../api/request';

// 时间格式处理函数
const formatDate = (dateString: string | Date): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};
import styles from './settings.module.css';

const { Title, Text } = Typography;

// 去除写死的 mockEmployees

// 模拟权限数据
// 权限模块定义
const ALL_PERMISSIONS = [
    {
        key: 'mall',
        label: '路远商城',
        children: [
            { key: 'customer:list', label: '客户列表' },
            { key: 'order:create', label: '创建订单' },
            { key: 'finance:audit', label: '审核订单' },
            { key: 'order:pending', label: '待发货订单' },
            { key: 'order:shipped', label: '已发货订单' },
            { key: 'finance:aftersale', label: '售后订单' },
            { key: 'order:modify', label: '修改订单' },
            { key: 'order:signed', label: '已签收订单' }
        ]
    },
    {
        key: 'office',
        label: '综合办公',
        children: [
            { key: 'office:analytics', label: '数据分析' },
            { key: 'office:report', label: '路远日报' },
        ]
    },
    {
        key: 'global',
        label: '全局独立控件',
        children: [
            { key: 'office:dashboard', label: '大屏系统' },
            { key: 'office:chat', label: '即时通讯' },
        ]
    },
    {
        key: 'warehouse',
        label: '仓储物流',
        children: [
            { key: 'warehouse:product', label: '商品管理' },
            { key: 'warehouse:stock', label: '产品库存' },
            { key: 'warehouse:return', label: '退货入库' },
            { key: 'warehouse:records', label: '出入库记录' }
        ]
    },
    {
        key: 'operation',
        label: '运营管理',
        children: [
            { key: 'operation:channel', label: '类型管理' },
            { key: 'operation:logs', label: '日志列表' }
        ]
    },
    {
        key: 'security',
        label: '安全设置',
        children: [
            { key: 'security:ip_whitelist', label: 'IP白名单验证' },
            { key: 'security:ip_whitelist_manage', label: 'IP白名单管理' }
        ]
    },
    {
        key: 'settings',
        label: '高级设置',
        children: [
            { key: 'settings:backend', label: '后台设置' },
            { key: 'settings:system', label: '系统设置' }
        ]
    }
];

// 去除写死的 mockPermissions

// 模拟业绩目标数据 (已移动到渠道管理)

// 模拟部门数据
/*
const mockDepartments = [
    { id: 'D001', name: '技术部', code: 'TECH', manager: '系统管理员', memberCount: 12, showInPerformanceV1: false, showInPerformanceV2: false, showInRanking: false, showInAnalytics: false, createdAt: '2024-01-01' },
    { id: 'D002', name: '销售部', code: 'SALES', manager: '李经理', memberCount: 25, showInPerformanceV1: true, showInPerformanceV2: true, showInRanking: true, showInAnalytics: true, createdAt: '2024-01-01' },
    { id: 'D003', name: '运营部', code: 'OPS', manager: '王五', memberCount: 8, showInPerformanceV1: true, showInPerformanceV2: true, showInRanking: true, showInAnalytics: true, createdAt: '2024-01-01' },
    { id: 'D004', name: '财务部', code: 'FIN', manager: '王财务', memberCount: 5, showInPerformanceV1: false, showInPerformanceV2: false, showInRanking: false, showInAnalytics: false, createdAt: '2024-01-01' },
    { id: 'D005', name: '人事部', code: 'HR', manager: '赵六', memberCount: 3, showInPerformanceV1: false, showInPerformanceV2: false, showInRanking: false, showInAnalytics: false, createdAt: '2024-06-01' },
];

// 模拟物流公司数据
const mockLogisticsCompanies = [
    { id: '1', name: '顺丰速运', code: 'SF', status: true },
    { id: '2', name: '京东物流', code: 'JD', status: false },
    { id: '3', name: '中国邮政', code: 'EMS', status: false },
    { id: '4', name: '圆通速递', code: 'YTO', status: false },
    { id: '5', name: '中通快递', code: 'ZTO', status: false },
    { id: '6', name: '申通快递', code: 'STO', status: false },
    { id: '7', name: '韵达快递', code: 'YUNDA', status: false },
    { id: '8', name: '极兔速递', code: 'J&T', status: false },
    { id: '9', name: '德邦快递', code: 'DEPPON', status: false },
];

// 模拟 IP 白名单数据
const mockIPWhitelist = [
    { id: '1', ip: '127.0.0.1/32', remark: '本地回环', status: true, createdAt: '2024-01-01' },
    { id: '2', ip: '192.168.1.0/24', remark: '公司内网段', status: true, createdAt: '2024-01-15' },
    { id: '3', ip: '113.89.23.45/32', remark: '王经理家动态 IP', status: false, createdAt: '2024-02-01' },
];

// 模拟 IM 审计数据
const mockIMConversations = [
    { id: 'C001', name: '李四', type: 'single', employeeId: 'NS-002', department: '销售部', lastMessage: '好的，收到！周三开会时我们会详细汇报。', time: '10:30', avatarLabel: '李' },
    { id: 'G001', name: '销售部工作群', type: 'group', lastMessage: '王五: 好的，我会带上上周的报表。', time: '09:10', avatarLabel: '销' },
    { id: 'C002', name: '王五', type: 'single', employeeId: 'NS-003', department: '财务部', lastMessage: '多谢，看到了。', time: '昨天', avatarLabel: '王' },
    { id: 'G002', name: '项目讨论组', type: 'group', lastMessage: '张三: 正在看，配色还可以再调整下。', time: '昨天', avatarLabel: '项' },
];

const mockIMMessages: Record<string, any[]> = {
    'C001': [
        { id: '1', senderName: '李四', senderExt: 'NS-002', senderDept: '销售部', direction: 'received', type: 'text', content: '张哥，今天的订单数据给你发过去了，请确认一下有没有漏掉的部分。', time: '10:00' },
        { id: '2', senderName: '张三', senderExt: 'NS-001', senderDept: '销售部', direction: 'sent', type: 'text', content: '收到，我这就进系统看一下。', time: '10:01' },
        { id: '3', senderName: '李四', senderExt: 'NS-002', senderDept: '销售部', direction: 'received', type: 'file', content: '', time: '10:02', fileName: '1月订单汇总_最终版.xlsx', fileSize: '1.2MB' },
        { id: '4', senderName: '张三', senderExt: 'NS-001', senderDept: '销售部', direction: 'sent', type: 'text', content: '看到了，这个月业绩不错啊，比上个月增长了 15% 👍', time: '10:05' },
        { id: '5', senderName: '李四', senderExt: 'NS-002', senderDept: '销售部', direction: 'received', type: 'image', content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', time: '10:08' },
    ],
    'G001': [
        { id: 'g1', senderName: '张三', senderExt: 'NS-001', senderDept: '销售部', direction: 'sent', type: 'text', content: '各位，今天下午3点在会议室A开周会，请准时参加。', time: '09:00' },
        { id: 'g2', senderName: '李四', senderExt: 'NS-002', senderDept: '销售部', direction: 'received', type: 'text', content: '收到，准时到达。', time: '09:05' },
        { id: 'g3', senderName: '王五', senderExt: 'NS-003', senderDept: '财务部', direction: 'received', type: 'text', content: '好的，我会带上上周的报表。', time: '09:10' },
    ]
};

const mockSensitiveWords = [
    { id: '1', word: '加微信', type: '防私单', level: 'high', createdAt: '2024-01-01' },
    { id: '2', word: '转账', type: '严禁词', level: 'critical', createdAt: '2024-01-05' },
    { id: '3', word: '淘宝', type: '广告词', level: 'medium', createdAt: '2024-01-10' },
    { id: '4', word: '投诉', type: '服务质量', level: 'low', createdAt: '2024-02-01' },
];
*/

const Settings: React.FC = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [rolesList, setRolesList] = useState<any[]>([]);
    const [activeIMChatId, setActiveIMChatId] = useState<string | null>(null);

    const [departments, setDepartments] = useState<any[]>([]);
    const [logisticsList, setLogisticsList] = useState<any[]>([]);
    const [ipWhitelist, setIpWhitelist] = useState<any[]>([]);
    const [imConversations, setImConversations] = useState<any[]>([]);
    const [imMessages, setImMessages] = useState<Record<string, any[]>>({});
    const [sensitiveWords, setSensitiveWords] = useState<any[]>([]);
    const [ipModalVisible, setIpModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes, depRes, logiRes, ipRes, imCRes, imMRes, swRes]: any = await Promise.all([
                request.get('/users?page_size=100'),
                request.get('/admin/roles'),
                request.get('/settings/departments'),
                request.get('/settings/logistics'),
                request.get('/settings/ip-whitelist'),
                request.get('/settings/im-conversations'),
                request.get('/settings/im-messages'),
                request.get('/settings/sensitive-words'),
            ]);
            setEmployees(Array.isArray(usersRes) ? usersRes : usersRes?.data || []);
            setRolesList(Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || []);
            setDepartments(Array.isArray(depRes) ? depRes : depRes?.data?.items || depRes?.data || []);
            setLogisticsList(Array.isArray(logiRes) ? logiRes : logiRes?.data?.items || logiRes?.data || []);
            setIpWhitelist(Array.isArray(ipRes) ? ipRes : ipRes?.data?.items || ipRes?.data || []);
            setImConversations(Array.isArray(imCRes) ? imCRes : imCRes?.data?.items || imCRes?.data || []);
            setImMessages(imMRes?.data || imMRes || {});
            // 自动选中第一个 IM 会话
            const convList = Array.isArray(imCRes) ? imCRes : imCRes?.data?.items || imCRes?.data || [];
            if (convList.length > 0) {
                setActiveIMChatId(prev => prev || convList[0].id);
            }
            setSensitiveWords(Array.isArray(swRes) ? swRes : swRes?.data?.items || swRes?.data || []);
        } catch (e) {
            console.error('Fetch error:', e);
            message.error('数据获取失败，请稍后重试');
        }
    };
    const [editingIP, setEditingIP] = useState<any>(null);

    // ====== 成员管理 新增/编辑/删除 ======
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [employeeForm] = Form.useForm();

    const [addEmployeeVisible, setAddEmployeeVisible] = useState(false);
    const [addEmployeeForm] = Form.useForm();

    const handleAddEmployeeOpen = () => {
        addEmployeeForm.resetFields();
        setAddEmployeeVisible(true);
    };

    const handleAddEmployeeSave = async () => {
        try {
            const values = await addEmployeeForm.validateFields();
            await request.post('/users', values);
            message.success('员工创建成功');
            setAddEmployeeVisible(false);
            fetchData();
        } catch (e: any) {
            if (e?.errorFields) return;
            message.error(e?.response?.data?.detail || '创建失败');
        }
    };

    const handleEditEmployee = (record: any) => {
        setEditingEmployee(record);
        employeeForm.setFieldsValue({
            employeeNo: record.employeeNo,
            username: record.username,
            name: record.name,
            roleId: record.roleId,
            department: record.department,
            phone: record.phone,
            email: record.email,
        });
        setEmployeeModalVisible(true);
    };

    const handleEmployeeSave = () => {
        employeeForm.validateFields().then(async (values) => {
            try {
                await request.put(`/users/${editingEmployee.id}`, values);
                message.success('员工信息已更新');
                setEmployeeModalVisible(false);
                setEditingEmployee(null);
                fetchData();
            } catch (e) {
                message.error('更新失败');
            }
        });
    };

    const handleDeleteEmployee = async (id: string) => {
        try {
            await request.delete(`/users/${id}`);
            message.success('已删除员工');
            fetchData();
        } catch (e) {
            message.error('删除失败');
        }
    };

    const handleToggleStatus = async (record: any) => {
        const newActive = record.status !== 'active';
        try {
            await request.put(`/users/${record.id}/status`, { isActive: newActive });
            message.success(newActive ? `${record.name} 已启用` : `${record.name} 已禁用`);
            fetchData();
        } catch (e) {
            message.error('状态切换失败');
        }
    };

    // ====== 部门管理 编辑/删除 ======
    const [deptModalVisible, setDeptModalVisible] = useState(false);
    const [editingDept, setEditingDept] = useState<any>(null);
    const [deptForm] = Form.useForm();

    const handleEditDept = async (record: any) => {
        try {
            // 调用后端API获取部门详情
            const deptDetail = await request.get(`/admin/departments/${record.id}`);
            setEditingDept(deptDetail);
            deptForm.setFieldsValue({
                name: deptDetail.name,
                code: deptDetail.code,
                manager: deptDetail.manager,
            });
            setDeptModalVisible(true);
        } catch (e) {
            message.error('获取部门详情失败');
        }
    };

    const handleDeptSave = () => {
        deptForm.validateFields().then(async (values) => {
            try {
                await request.put(`/admin/departments/${editingDept.id}`, values);
                message.success('部门信息已更新');
                setDeptModalVisible(false);
                setEditingDept(null);
                fetchData();
            } catch (e) {
                message.error('更新失败');
            }
        });
    };

    const handleDeleteDept = async (id: string) => {
        try {
            await request.delete(`/admin/departments/${id}`);
            message.success('已删除部门');
            fetchData();
        } catch (e) {
            message.error('删除失败');
        }
    };

    // ====== 敏感词 删除 ======
    const handleDeleteSensitiveWord = async (id: string) => {
        try {
            await request.delete(`/admin/sensitive-words/${id}`);
            message.success('已删除敏感词');
            fetchData();
        } catch (e) {
            message.error('删除失败');
        }
    };

    // ====== 密码修改 ======
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordTarget, setPasswordTarget] = useState<any>(null);
    const [passwordForm] = Form.useForm();

    const handleOpenPasswordModal = (record: any) => {
        setPasswordTarget(record);
        passwordForm.resetFields();
        setPasswordModalVisible(true);
    };

    const handlePasswordChange = async () => {
        try {
            const values = await passwordForm.validateFields();
            if (values.newPassword !== values.confirmPassword) {
                message.error('两次输入的密码不一致');
                return;
            }
            await request.put(`/users/${passwordTarget.id}/password`, {
                newPassword: values.newPassword,
            });
            message.success(`已成功修改 ${passwordTarget.name} 的密码`);
            setPasswordModalVisible(false);
            setPasswordTarget(null);
        } catch (e: any) {
            if (e?.errorFields) return; // form validation error
            message.error('密码修改失败');
        }
    };

    // IP 白名单状态切换
    const handleIPStatusChange = async (id: string, checked: boolean) => {
        try {
            await request.put(`/admin/ip-whitelist/${id}/status`, { status: checked });
            setIpWhitelist(prev => prev.map(item =>
                item.id === id ? { ...item, status: checked } : item
            ));
            message.success(`已${checked ? '启用' : '停用'}该 IP`);
        } catch (e) {
            message.error('状态更新失败');
        }
    };

    // 删除 IP
    const handleDeleteIP = async (id: string) => {
        try {
            await request.delete(`/admin/ip-whitelist/${id}`);
            setIpWhitelist(prev => prev.filter(item => item.id !== id));
            message.success('已移除该 IP 地址');
        } catch (e) {
            message.error('删除失败');
        }
    };

    // 添加/编辑 IP
    const [ipForm] = Form.useForm();
    const handleAddIP = async () => {
        try {
            const values = await ipForm.validateFields();
            if (editingIP) {
                // 编辑逻辑
                await request.put(`/admin/ip-whitelist/${editingIP.id}`, values);
                setIpWhitelist(prev => prev.map(item =>
                    item.id === editingIP.id ? { ...item, ...values } : item
                ));
                message.success('已更新 IP 配置');
            } else {
                // 新增逻辑
                const newIP = await request.post('/admin/ip-whitelist', {
                    ip: values.ip,
                    remark: values.remark || '-',
                    status: true
                });
                setIpWhitelist([newIP, ...ipWhitelist]);
                message.success('已添加新 IP 地址');
            }
            ipForm.resetFields();
            setEditingIP(null);
            setIpModalVisible(false);
        } catch (e: any) {
            if (e?.errorFields) return;
            message.error('操作失败');
        }
    };

    const handleEditIP = (record: any) => {
        setEditingIP(record);
        ipForm.setFieldsValue({
            ip: record.ip,
            remark: record.remark
        });
        setIpModalVisible(true);
    };

    // 物流状态切换
    const handleLogisticsStatusChange = async (id: string, checked: boolean) => {
        try {
            await request.put(`/settings/logistics/${id}/status`, { status: checked });
            setLogisticsList(prev => prev.map(item =>
                item.id === id ? { ...item, status: checked } : item
            ));
            message.success(`已${checked ? '启用' : '停用'}该物流公司`);
        } catch (e) {
            message.error('状态更新失败');
        }
    };

    // 顺丰接口配置模态框
    const [sfConfigVisible, setSfConfigVisible] = useState(false);
    const [sfConfigForm] = Form.useForm();

    // 角色编辑
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [roleForm] = Form.useForm();

    const handleEditRole = (record: any) => {
        setEditingRole(record);
        let permissions = record.permissions || [];

        // 如果是超级管理员，显示为所有权限选中
        if (record.code === 'admin' || (permissions.length === 1 && permissions[0] === '*')) {
            permissions = ALL_PERMISSIONS.reduce((acc: string[], module) => {
                return acc.concat(module.children.map(c => c.key));
            }, []);
        }

        roleForm.setFieldsValue({
            name: record.name,
            description: record.description,
            permissions: permissions
        });
        setRoleModalVisible(true);
    };

    const handleRoleSave = () => {
        roleForm.validateFields().then(async values => {
            try {
                await request.put(`/admin/roles/${editingRole.id}`, {
                    name: values.name,
                    permissions: values.permissions
                });
                message.success('角色权限已更新');
                setRoleModalVisible(false);
                fetchData();
            } catch (e) {
                // error Handled by interceptor
            }
        });
    };

    // 获取权限名称
    const getPermissionLabel = (key: string) => {
        if (key === '*') return '所有权限';
        if (key.endsWith(':*')) {
            const module = ALL_PERMISSIONS.find(m => m.key === key.split(':')[0]);
            return module ? `${module.label} (全选)` : key;
        }
        for (const module of ALL_PERMISSIONS) {
            const found = module.children.find(c => c.key === key);
            if (found) return found.label;
        }
        return key;
    };

    const handleSfConfigSave = () => {
        sfConfigForm.validateFields().then((values) => {
            console.log('顺丰接口配置:', values);
            message.success('顺丰接口配置已保存');
            setSfConfigVisible(false);
        });
    };

    // 成员列
    const employeeColumns: ColumnsType<any> = [
        { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
        {
            title: '头像',
            dataIndex: 'avatar',
            key: 'avatar',
            width: 60,
            render: (avatar: string) => (
                <Avatar
                    size={36}
                    src={avatar || undefined}
                    icon={!avatar ? <FontAwesomeIcon icon={faUser} /> : undefined}
                    style={{
                        backgroundColor: avatar ? 'transparent' : '#f0f0f0',
                        color: '#8c8c8c'
                    }}
                />
            ),
        },
        { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
        {
            title: '账号', dataIndex: 'username', key: 'username', width: 100,
            render: (username: string) => <Text code>{username}</Text>
        },
        {
            title: '密码', dataIndex: 'maskedPassword', key: 'maskedPassword', width: 110,
            render: (pwd: string) => <Text type="secondary" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{pwd || '******'}</Text>
        },
        { title: '部门', dataIndex: 'department', key: 'department', width: 90 },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (roleCode: string, record: any) => {
                if (record.roleLabel) return record.roleLabel;
                const roleObj = rolesList.find(r => r.code === roleCode || r.id === roleCode);
                return roleObj ? roleObj.name : roleCode;
            }
        },
        { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 180,
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string, record: any) => (
                <Popconfirm
                    title={status === 'active' ? `确定禁用 ${record.name}？` : `确定启用 ${record.name}？`}
                    description={status === 'active' ? '禁用后该用户无法登录，在线时将被立即踢下线' : ''}
                    onConfirm={() => handleToggleStatus(record)}
                    okText="确定"
                    cancelText="取消"
                >
                    <Switch
                        checked={status === 'active'}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                        size="small"
                    />
                </Popconfirm>
            ),
        },
        { title: '注册日期', dataIndex: 'registrationDate', key: 'registrationDate', width: 120 },
        { title: '上次在线', dataIndex: 'lastActiveTime', key: 'lastActiveTime', width: 160 },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_: any, record: any) => (
                <Space>
                    <Button type="link" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => handleEditEmployee(record)}>编辑</Button>
                    <Button type="link" size="small" icon={<FontAwesomeIcon icon={faKey} />} onClick={() => handleOpenPasswordModal(record)}>改密</Button>
                    {record.username !== 'admin' && (
                        <Popconfirm title="确认删除该员工？" onConfirm={() => handleDeleteEmployee(record.id)}>
                            <Button type="link" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />}>删除</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // 权限列
    const permissionColumns: ColumnsType<any> = [
        { title: '角色名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '描述', dataIndex: 'description', key: 'description', width: 200 },
        {
            title: '权限概要',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (permissions: string[]) => (
                <Space wrap style={{ maxWidth: 600 }}>
                    {permissions.includes('*') ? (
                        <Tag color="red">超级管理员</Tag>
                    ) : (
                        permissions.slice(0, 8).map((p) => (
                            <Tag key={p} color="blue">{getPermissionLabel(p)}</Tag>
                        ))
                    )}
                    {permissions.length > 8 && <Tag>...等{permissions.length}项</Tag>}
                </Space>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => <Button type="link" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => handleEditRole(record)}>配置</Button>,
        },
    ];

    // 物流公司列
    const logisticsColumns: ColumnsType<any> = [
        { title: '物流公司', dataIndex: 'name', key: 'name', width: 150 },
        { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
        {
            title: '启用状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: boolean, record) => (
                <Switch
                    checked={status}
                    onChange={(checked) => handleLogisticsStatusChange(record.id, checked)}
                />
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                record.code === 'SF' ? (
                    <Button
                        type="link"
                        size="small"
                        icon={<FontAwesomeIcon icon={faGear} />}
                        onClick={() => setSfConfigVisible(true)}
                    >
                        接口设置
                    </Button>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>功能开发中</Text>
                )
            ),
        },
    ];

    // Tab 内容
    const tabItems = [
        {
            key: 'employees',
            label: '成员管理',
            children: (
                <div>
                    <div className={styles.toolbar}>
                        <Space>
                            <Input placeholder="搜索员工" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 200 }} />
                            <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={handleAddEmployeeOpen}>添加员工</Button>
                        </Space>
                    </div>
                    <Table columns={employeeColumns} dataSource={employees} rowKey="id" pagination={false} scroll={{ x: 1500 }} />
                </div>
            ),
        },
        {
            key: 'departments',
            label: '部门设置',
            children: (
                <div>
                    <div className={styles.toolbar}>
                        <Space>
                            <Input placeholder="搜索部门" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 200 }} />
                            <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />}>新增部门</Button>
                        </Space>
                    </div>
                    <Table
                        columns={[
                            { title: '部门编码', dataIndex: 'code', key: 'code', width: 100 },
                            { title: '部门名称', dataIndex: 'name', key: 'name', width: 120 },
                            { title: '负责人', dataIndex: 'manager', key: 'manager', width: 100 },
                            { title: '成员数量', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
                            {
                                title: '业绩 V1',
                                dataIndex: 'showInPerformanceV1',
                                key: 'showInPerformanceV1',
                                width: 80,
                                render: (show: boolean) => (
                                    <Switch checked={show} size="small" />
                                ),
                            },
                            {
                                title: '业绩 V2',
                                dataIndex: 'showInPerformanceV2',
                                key: 'showInPerformanceV2',
                                width: 80,
                                render: (show: boolean) => (
                                    <Switch checked={show} size="small" />
                                ),
                            },
                            {
                                title: '排行榜',
                                dataIndex: 'showInRanking',
                                key: 'showInRanking',
                                width: 80,
                                render: (show: boolean) => (
                                    <Switch checked={show} size="small" />
                                ),
                            },
                            {
                                title: '数据分析',
                                dataIndex: 'showInAnalytics',
                                key: 'showInAnalytics',
                                width: 100,
                                render: (show: boolean) => (
                                    <Switch checked={show} size="small" />
                                ),
                            },
                            { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
                            {
                                title: '操作',
                                key: 'action',
                                width: 150,
                                render: (_: any, record: any) => (
                                    <Space>
                                        <Button type="link" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => handleEditDept(record)}>编辑</Button>
                                        <Popconfirm title="确认删除该部门？" onConfirm={() => handleDeleteDept(record.id)}>
                                            <Button type="link" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />}>删除</Button>
                                        </Popconfirm>
                                    </Space>
                                ),
                            },
                        ]}
                        dataSource={departments}
                        rowKey="id"
                        pagination={false}
                    />
                </div>
            ),
        },
        {
            key: 'permissions',
            label: '权限配置',
            children: (
                <div>
                    <div className={styles.toolbar}>
                        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />}>添加角色</Button>
                    </div>
                    <Table columns={permissionColumns} dataSource={rolesList} rowKey="id" pagination={false} />
                </div>
            ),
        },

        {
            key: 'logistics',
            label: '物流设置',
            children: (
                <div>
                    <div className={styles.toolbar}>
                        <Text type="secondary">
                            * 系统内置主流快递公司接口，顺丰速运默认优先排序。仅支持启用/停用操作。
                        </Text>
                    </div>
                    <Table
                        columns={logisticsColumns}
                        dataSource={logisticsList}
                        rowKey="id"
                        pagination={false}
                    />
                </div>
            ),
        },
        {
            key: 'im-audit',
            label: '即时通讯',
            children: (
                <Tabs
                    type="card"
                    size="small"
                    items={[
                        {
                            key: 'chat-logs',
                            label: '聊天记录',
                            children: (
                                <div style={{ display: 'flex', height: 600, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                    {/* 左侧会话列表 */}
                                    <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                                        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
                                            <Input placeholder="搜索记录" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} />
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto' }}>
                                            {imConversations.map(chat => (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => setActiveIMChatId(chat.id)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        background: activeIMChatId === chat.id ? '#fff' : 'transparent',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {activeIMChatId === chat.id && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#1890ff' }} />}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <Text strong>{chat.name}{chat.type === 'single' ? `(${chat.employeeId})` : ''}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{chat.time}</Text>
                                                    </div>
                                                    <Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block', width: '100%' }}>{chat.lastMessage}</Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 右侧消息内容 */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                                        {!activeIMChatId ? (
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#999' }}>请在左侧选择会话查看内容</div>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text strong>对话详情 - {imConversations.find(c => c.id === activeIMChatId)?.name}</Text>
                                                    <Button size="small" danger ghost icon={<FontAwesomeIcon icon={faTrash} />}>删除该记录</Button>
                                                </div>
                                                <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#f5f7fa' }}>
                                                    {(imMessages[activeIMChatId] || []).map(msg => (
                                                        <div key={msg.id} style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: msg.direction === 'sent' ? 'flex-end' : 'flex-start' }}>
                                                            <div style={{ marginBottom: 4, fontSize: 12, color: '#999' }}>
                                                                {msg.senderName}({msg.senderExt}) · {msg.senderDept} {msg.time}
                                                            </div>
                                                            <div style={{
                                                                padding: '8px 12px',
                                                                borderRadius: 8,
                                                                maxWidth: '70%',
                                                                background: msg.direction === 'sent' ? '#91d5ff' : '#fff',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                                wordBreak: 'break-word'
                                                            }}>
                                                                {msg.type === 'text' && msg.content}
                                                                {msg.type === 'file' && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <FontAwesomeIcon icon={faFile} style={{ fontSize: 24, color: '#1890ff' }} />
                                                                        <div>
                                                                            <div>{msg.fileName}</div>
                                                                            <div style={{ fontSize: 11, color: '#999' }}>{msg.fileSize}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {msg.type === 'image' && (
                                                                    <img src={msg.content} alt="img" style={{ maxWidth: '100%', borderRadius: 4 }} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'sensitive-words',
                            label: '敏感词库',
                            children: (
                                <div style={{ padding: '16px 0' }}>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            <Input placeholder="搜索敏感词" prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />} style={{ width: 220 }} />
                                            <Select defaultValue="all" style={{ width: 120 }}>
                                                <Select.Option value="all">全部类型</Select.Option>
                                                <Select.Option value="private">防私单</Select.Option>
                                                <Select.Option value="forbidden">严禁词</Select.Option>
                                            </Select>
                                        </Space>
                                        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />}>添加敏感词</Button>
                                    </div>
                                    <Table
                                        size="small"
                                        rowKey="id"
                                        dataSource={sensitiveWords}
                                        pagination={{ pageSize: 8 }}
                                        columns={[
                                            { title: '敏感词', dataIndex: 'word', key: 'word' },
                                            {
                                                title: '违规类型',
                                                dataIndex: 'type',
                                                key: 'type',
                                                render: (type) => <Tag color="orange">{type}</Tag>
                                            },
                                            {
                                                title: '告警等级',
                                                dataIndex: 'level',
                                                key: 'level',
                                                render: (level) => {
                                                    const colors: any = { critical: 'red', high: 'volcano', medium: 'gold', low: 'blue' };
                                                    const labels: any = { critical: '极其严重', high: '严重', medium: '中度', low: '低危' };
                                                    return <Tag color={colors[level]}>{labels[level]}</Tag>
                                                }
                                            },
                                            { 
                                                title: '添加时间', 
                                                dataIndex: 'createdAt', 
                                                key: 'createdAt',
                                                render: (createdAt) => formatDate(createdAt)
                                            },
                                            {
                                                title: '操作',
                                                key: 'action',
                                                width: 120,
                                                render: (_: any, record: any) => (
                                                    <Space>
                                                        <Button type="link" size="small">编辑</Button>
                                                        <Popconfirm title="确认删除该敏感词？" onConfirm={() => handleDeleteSensitiveWord(record.id)}>
                                                            <Button type="link" size="small" danger>删除</Button>
                                                        </Popconfirm>
                                                    </Space>
                                                )
                                            }
                                        ]}
                                    />
                                </div>
                            )
                        }
                    ]}
                />
            ),
        },
        {
            key: 'ip-whitelist',
            label: 'IP 白名单',
            children: (
                <div>
                    <div className={styles.toolbar} style={{ marginBottom: 20 }}>
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => {
                                setEditingIP(null);
                                ipForm.resetFields();
                                setIpModalVisible(true);
                            }}>
                                添加白名单
                            </Button>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                <FontAwesomeIcon icon={faGear} style={{ marginRight: 8 }} />
                                温馨提示：此处配置的 CIDR 地址池，仅对在“权限配置”中开启了“IP 白名单验证”的角色成员生效。
                            </Text>
                        </Space>
                    </div>
                    <Table
                        columns={[
                            { title: 'CIDR 地址', dataIndex: 'ip', key: 'ip', width: 180 },
                            { title: '备注', dataIndex: 'remark', key: 'remark', width: 300, ellipsis: true },
                            {
                                title: '状态',
                                dataIndex: 'status',
                                key: 'status',
                                width: 80,
                                render: (status: boolean, record) => (
                                    <Switch
                                        size="small"
                                        checked={status}
                                        onChange={(checked) => handleIPStatusChange(record.id, checked)}
                                    />
                                )
                            },
                            { 
                                title: '添加时间', 
                                dataIndex: 'createdAt', 
                                key: 'createdAt', 
                                width: 120,
                                render: (createdAt) => formatDate(createdAt)
                            },
                            {
                                title: '操作',
                                key: 'action',
                                render: (_, record) => (
                                    <Space size="middle">
                                        <Button type="link" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => handleEditIP(record)}>编辑</Button>
                                        <Popconfirm title="确认删除？" onConfirm={() => handleDeleteIP(record.id)}>
                                            <Button type="link" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />}>删除</Button>
                                        </Popconfirm>
                                    </Space>
                                )
                            }
                        ]}
                        dataSource={ipWhitelist}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Title level={4}>后台设置</Title>

            <Card className={styles.card}>
                <Tabs items={tabItems} />
            </Card>

            <Modal
                title="顺丰速运接口配置"
                open={sfConfigVisible}
                onOk={handleSfConfigSave}
                onCancel={() => setSfConfigVisible(false)}
                width={500}
            >
                <Form
                    form={sfConfigForm}
                    layout="vertical"
                    initialValues={{
                        partnerId: '',
                        checkWord: '',
                        env: 'prod'
                    }}
                >
                    <Form.Item
                        label="顾客编码 (Partner ID)"
                        name="partnerId"
                        rules={[{ required: true, message: '请输入顾客编码' }]}
                    >
                        <Input placeholder="请输入月结卡号对应的顾客编码" />
                    </Form.Item>
                    <Form.Item
                        label="校验码 (Check Word)"
                        name="checkWord"
                        rules={[{ required: true, message: '请输入校验码' }]}
                    >
                        <Input.Password placeholder="请输入接口校验码" />
                    </Form.Item>
                    <Form.Item
                        label="环境"
                        name="env"
                        rules={[{ required: true, message: '请选择环境' }]}
                    >
                        <Select options={[
                            { label: '生产环境', value: 'prod' },
                            { label: '沙箱环境', value: 'dev' }
                        ]} />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="角色权限配置"
                open={roleModalVisible}
                onOk={handleRoleSave}
                onCancel={() => setRoleModalVisible(false)}
                width={800}
            >
                <Form form={roleForm} layout="vertical">
                    <Form.Item name="name" label="角色名称" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                        <Input disabled={editingRole?.code === 'admin'} />
                    </Form.Item>
                    <Form.Item name="description" label="角色描述" style={{ marginBottom: 12 }}>
                        <Input />
                    </Form.Item>
                    <Divider style={{ marginTop: 8, marginBottom: 12 }}>预警配置</Divider>

                    <Card size="small" bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16 }}>
                        <Row gutter={[8, 12]} align="middle">
                            <Col span={3}>
                                <Text strong>登录预警</Text>
                            </Col>
                            <Col span={10}>
                                <Space>
                                    <Form.Item name={['alertConfig', 'login', 'receive']} label="接收预警信息" valuePropName="checked" noStyle>
                                        <Switch disabled={editingRole?.code === 'admin'} size="small" />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 11 }}>接收异常预警</Text>
                                </Space>
                            </Col>
                            <Col span={11}>
                                <Space>
                                    <Form.Item name={['alertConfig', 'login', 'isTarget']} label="被预警对象" valuePropName="checked" noStyle>
                                        <Switch disabled={editingRole?.code === 'admin'} size="small" />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 11 }}>作为监测对象</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <Card size="small" bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16 }}>
                        <Row gutter={[8, 12]} align="middle">
                            <Col span={3}>
                                <Text strong>通讯预警</Text>
                            </Col>
                            <Col span={10}>
                                <Space>
                                    <Form.Item name={['alertConfig', 'im', 'receive']} label="接收铭感预警" valuePropName="checked" noStyle>
                                        <Switch disabled={editingRole?.code === 'admin'} size="small" />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 11 }}>接收敏感词预警</Text>
                                </Space>
                            </Col>
                            <Col span={11}>
                                <Space>
                                    <Form.Item name={['alertConfig', 'im', 'isTarget']} label="监测对象" valuePropName="checked" noStyle>
                                        <Switch disabled={editingRole?.code === 'admin'} size="small" />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 11 }}>作为敏感词监测对象</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <Divider style={{ marginTop: 8, marginBottom: 12 }}>高级配置</Divider>

                    <Card size="small" bodyStyle={{ padding: '12px 16px' }} style={{ marginBottom: 16 }}>
                        <Row gutter={[8, 12]} align="middle">
                            <Col span={3}>
                                <Text strong>访问限制</Text>
                            </Col>
                            <Col span={21}>
                                <Space>
                                    <Form.Item name={['alertConfig', 'security', 'enableIPWhitelist']} label="IP 白名单" valuePropName="checked" noStyle>
                                        <Switch disabled={editingRole?.code === 'admin'} size="small" />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 11 }}>开启 IP 白名单验证</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <Divider style={{ marginTop: 8, marginBottom: 12 }}>权限分配</Divider>

                    <Form.Item name="permissions" noStyle>
                        <Checkbox.Group style={{ width: '100%' }} disabled={editingRole?.code === 'admin'}>
                            <Row gutter={[12, 12]}>
                                {ALL_PERMISSIONS.map(module => (
                                    <Col span={12} key={module.key}>
                                        <Card
                                            size="small"
                                            title={<Text style={{ fontSize: 13 }}>{module.label}</Text>}
                                            extra={
                                                editingRole?.code !== 'admin' && (
                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        style={{ padding: 0 }}
                                                        onClick={() => {
                                                            const current = roleForm.getFieldValue('permissions') || [];
                                                            const moduleKeys = module.children.map(c => c.key);
                                                            const isAllChecked = moduleKeys.every(k => current.includes(k));
                                                            let nextValues = [...current];

                                                            if (isAllChecked) {
                                                                nextValues = nextValues.filter(k => !moduleKeys.includes(k));
                                                            } else {
                                                                moduleKeys.forEach(k => {
                                                                    if (!nextValues.includes(k)) nextValues.push(k);
                                                                });
                                                            }
                                                            roleForm.setFieldsValue({ permissions: nextValues });
                                                        }}
                                                    >
                                                        全选/反选
                                                    </Button>
                                                )
                                            }
                                            bodyStyle={{ padding: '8px 12px' }}
                                        >
                                            <Row gutter={[4, 8]}>
                                                {module.children.map(perm => (
                                                    <Col span={12} key={perm.key}>
                                                        <Checkbox value={perm.key} style={{ fontSize: 12 }}>{perm.label}</Checkbox>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editingIP ? "编辑 IP 白名单" : "添加 IP 白名单"}
                open={ipModalVisible}
                onOk={handleAddIP}
                onCancel={() => {
                    setIpModalVisible(false);
                    setEditingIP(null);
                    ipForm.resetFields();
                }}
                destroyOnClose
                width={480}
            >
                <Form form={ipForm} layout="vertical">
                    <Form.Item
                        name="ip"
                        label="CIDR 地址"
                        rules={[
                            { required: true, message: '请输入 CIDR 格式地址' },
                            { pattern: /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/, message: '请输入正确的 CIDR 格式 (如: 192.168.1.0/24)' }
                        ]}
                    >
                        <Input placeholder="例如: 192.168.1.0/24 或 127.0.0.1/32" />
                    </Form.Item>
                    <Form.Item name="remark" label="备注说明">
                        <Input.TextArea rows={3} placeholder="请输入备注，方便后期维护" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 新增员工弹窗 */}
            <Modal
                title="添加员工"
                open={addEmployeeVisible}
                onOk={handleAddEmployeeSave}
                onCancel={() => setAddEmployeeVisible(false)}
                destroyOnClose
                width={500}
                okText="创建"
            >
                <Form form={addEmployeeForm} layout="vertical">
                    <Form.Item name="employeeNo" label="工号" rules={[{ required: true, message: '请输入工号' }]}>
                        <Input placeholder="如 EMP2001" />
                    </Form.Item>
                    <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入登录账号' }]}>
                        <Input placeholder="用于系统登录" />
                    </Form.Item>
                    <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '密码不少于6位' }]}>
                        <Input.Password placeholder="不少于6位" />
                    </Form.Item>
                    <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="roleId" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                        <Select placeholder="请选择角色">
                            {rolesList.map((r: any) => (
                                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="department" label="部门">
                        <Select placeholder="请选择部门">
                            {departments.map((d: any) => (
                                <Select.Option key={d.code} value={d.name}>{d.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="phone" label="手机号">
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 员工编辑弹窗 */}
            <Modal
                title="编辑员工"
                open={employeeModalVisible}
                onOk={handleEmployeeSave}
                onCancel={() => { setEmployeeModalVisible(false); setEditingEmployee(null); }}
                destroyOnClose
                width={500}
            >
                <Form form={employeeForm} layout="vertical">
                    <Form.Item name="employeeNo" label="工号">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="username" label="账号">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="roleId" label="角色">
                        <Select>
                            {rolesList.map((r: any) => (
                                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="department" label="部门">
                        <Select>
                            {departments.map((d: any) => (
                                <Select.Option key={d.code} value={d.name}>{d.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="phone" label="手机号">
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 密码修改弹窗 */}
            <Modal
                title={`修改密码 — ${passwordTarget?.name || ''} (${passwordTarget?.username || ''})`}
                open={passwordModalVisible}
                onOk={handlePasswordChange}
                onCancel={() => { setPasswordModalVisible(false); setPasswordTarget(null); }}
                destroyOnClose
                width={420}
                okText="确认修改"
            >
                <Form form={passwordForm} layout="vertical">
                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 6, message: '密码不少于6位' },
                        ]}
                    >
                        <Input.Password placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="确认密码"
                        rules={[
                            { required: true, message: '请再次输入密码' },
                        ]}
                    >
                        <Input.Password placeholder="请再次输入密码" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 部门编辑弹窗 */}
            <Modal
                title="编辑部门"
                open={deptModalVisible}
                onOk={handleDeptSave}
                onCancel={() => { setDeptModalVisible(false); setEditingDept(null); }}
                destroyOnClose
                width={500}
            >
                <Form form={deptForm} layout="vertical">
                    <Form.Item name="name" label="部门名称" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="code" label="部门编码" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="manager" label="负责人">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Settings;
