import React from 'react';
import {
    Card,
    Tabs,
    Form,
    Input,
    Switch,
    Typography,
    Button,
    Select,
    InputNumber,
    message,
    Space,
    Divider,
    Alert,
    Row,
    Col,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import styles from './system-settings.module.css';

const { Title, Paragraph } = Typography;

// 系统设置页面 - 包含全局配置、安全设置、数据备份、邮件配置等
const SystemSettings: React.FC = () => {
    const [form] = Form.useForm();

    // 保存设置
    const handleSave = () => {
        form.validateFields()
            .then((values) => {
                console.log('保存系统设置:', values);
                message.success('系统设置已保存');
            })
            .catch(() => {
                message.error('请检查表单填写是否正确');
            });
    };

    // 全局设置 Tab
    const GlobalSettings = () => (
        <div className={styles.settingsSection}>
            <Alert
                message="全局设置会影响所有用户的使用体验，请谨慎修改"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    siteName: '江湖路远v1.0',
                    timezone: 'Asia/Shanghai',
                    language: 'zh-CN',
                    dateFormat: 'YYYY-MM-DD',
                    pageSize: 10,
                    enableMaintenance: false,
                    enableSelfDestruct: false,
                    selfDestructPassword: '',
                    enableABMode: false,
                    abModePassword: '',
                }}
            >
                <Form.Item label="系统名称" name="siteName" rules={[{ required: true }]}>
                    <Input placeholder="请输入系统名称" style={{ maxWidth: 400 }} />
                </Form.Item>

                <Form.Item label="时区设置" name="timezone">
                    <Select style={{ maxWidth: 300 }}>
                        <Select.Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Select.Option>
                        <Select.Option value="Asia/Tokyo">日本标准时间 (UTC+9)</Select.Option>
                        <Select.Option value="America/New_York">美国东部时间 (UTC-5)</Select.Option>
                        <Select.Option value="Europe/London">格林威治时间 (UTC+0)</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item label="系统语言" name="language">
                    <Select style={{ maxWidth: 300 }}>
                        <Select.Option value="zh-CN">简体中文</Select.Option>
                        <Select.Option value="en-US">English (US)</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item label="日期格式" name="dateFormat">
                    <Select style={{ maxWidth: 300 }}>
                        <Select.Option value="YYYY-MM-DD">2026-01-30</Select.Option>
                        <Select.Option value="DD/MM/YYYY">30/01/2026</Select.Option>
                        <Select.Option value="MM/DD/YYYY">01/30/2026</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item label="默认分页数量" name="pageSize">
                    <InputNumber min={5} max={100} style={{ width: 120 }} addonAfter="条/页" />
                </Form.Item>

                <Divider />

                <Form.Item label="维护模式" name="enableMaintenance" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 24 }}>
                    开启维护模式后，除管理员外的所有用户将无法访问系统
                </Paragraph>

                <Divider style={{ borderColor: '#ffa39e' }} />

                <Title level={5} style={{ color: '#ff4d4f' }}>极度安全选项</Title>

                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Form.Item label="系统自毁模式" name="enableSelfDestruct" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Paragraph type="secondary" style={{ marginTop: -8 }}>
                            开启后在紧急情况下可触发系统全面清空逻辑，请极其谨慎。
                        </Paragraph>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="自毁确认密码" name="selfDestructPassword">
                            <Input.Password placeholder="设置触发自毁的最高权限密码" style={{ maxWidth: 300 }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24} align="middle" style={{ marginTop: 24 }}>
                    <Col span={12}>
                        <Form.Item label="AB 数据模式" name="enableABMode" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Paragraph type="secondary" style={{ marginTop: -8 }}>
                            开启后整个系统进入完全隔离的 B 数据环境。
                        </Paragraph>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="B 模式激活密码" name="abModePassword">
                            <Input.Password placeholder="设置激活虚假/隔离数据的隐形密码" style={{ maxWidth: 300 }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Divider />
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={handleSave}>
                        保存全局设置
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );

    // 安全设置 Tab
    const SecuritySettings = () => (
        <div className={styles.settingsSection}>
            <Form layout="vertical">
                <Title level={5}>密码策略</Title>
                <Form.Item label="密码最小长度" initialValue={8}>
                    <InputNumber min={6} max={32} style={{ width: 120 }} addonAfter="位" />
                </Form.Item>
                <Form.Item label="密码必须包含数字" valuePropName="checked" initialValue={true}>
                    <Switch />
                </Form.Item>
                <Form.Item label="密码必须包含特殊字符" valuePropName="checked" initialValue={false}>
                    <Switch />
                </Form.Item>
                <Form.Item label="密码过期天数" initialValue={90}>
                    <InputNumber min={0} max={365} style={{ width: 120 }} addonAfter="天" />
                </Form.Item>

                <Divider />

                <Title level={5}>登录安全</Title>
                <Form.Item label="最大登录失败次数" initialValue={5}>
                    <InputNumber min={3} max={10} style={{ width: 120 }} addonAfter="次" />
                </Form.Item>
                <Form.Item label="账户锁定时间" initialValue={30}>
                    <InputNumber min={5} max={1440} style={{ width: 120 }} addonAfter="分钟" />
                </Form.Item>
                <Form.Item label="会话超时时间" initialValue={120}>
                    <InputNumber min={15} max={1440} style={{ width: 120 }} addonAfter="分钟" />
                </Form.Item>
                <Form.Item label="启用两步验证" valuePropName="checked" initialValue={false}>
                    <Switch />
                </Form.Item>
                <Divider />
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={() => message.success('安全设置已保存')}>
                        保存安全设置
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );

    // 数据备份 Tab
    const BackupSettings = () => (
        <div className={styles.settingsSection}>
            <Alert
                message="定期备份可以保护您的数据安全，建议开启自动备份功能"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Form layout="vertical">
                <Form.Item label="启用自动备份" valuePropName="checked" initialValue={true}>
                    <Switch />
                </Form.Item>
                <Form.Item label="备份频率">
                    <Select style={{ maxWidth: 300 }} defaultValue="daily">
                        <Select.Option value="hourly">每小时</Select.Option>
                        <Select.Option value="daily">每天</Select.Option>
                        <Select.Option value="weekly">每周</Select.Option>
                        <Select.Option value="monthly">每月</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item label="备份保留数量" initialValue={7}>
                    <InputNumber min={1} max={30} style={{ width: 120 }} addonAfter="个" />
                </Form.Item>
                <Form.Item label="备份存储路径">
                    <Input placeholder="/data/backups" style={{ maxWidth: 400 }} />
                </Form.Item>

                <Divider />

                <Space>
                    <Button type="primary" icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={() => message.success('备份设置已保存')}>
                        保存设置
                    </Button>
                    <Button>立即备份</Button>
                    <Button>恢复备份</Button>
                    <Button>查看备份历史</Button>
                </Space>
            </Form>
        </div>
    );

    // 邮件设置 Tab
    const EmailSettings = () => (
        <div className={styles.settingsSection}>
            <Form layout="vertical">
                <Title level={5}>SMTP 服务器配置</Title>
                <Form.Item label="SMTP 服务器地址" rules={[{ required: true }]}>
                    <Input placeholder="smtp.example.com" style={{ maxWidth: 400 }} />
                </Form.Item>
                <Form.Item label="SMTP 端口" initialValue={587}>
                    <InputNumber min={1} max={65535} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item label="发件人邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="noreply@example.com" style={{ maxWidth: 400 }} />
                </Form.Item>
                <Form.Item label="邮箱密码/授权码">
                    <Input.Password placeholder="请输入邮箱密码或授权码" style={{ maxWidth: 400 }} />
                </Form.Item>
                <Form.Item label="使用 SSL/TLS" valuePropName="checked" initialValue={true}>
                    <Switch />
                </Form.Item>

                <Divider />

                <Space>
                    <Button type="primary" icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={() => message.success('邮件配置已保存')}>保存配置</Button>
                    <Button>发送测试邮件</Button>
                </Space>
            </Form>
        </div>
    );

    const tabItems = [
        {
            key: 'global',
            label: '全局设置',
            children: <GlobalSettings />,
        },
        {
            key: 'security',
            label: '安全设置',
            children: <SecuritySettings />,
        },
        {
            key: 'backup',
            label: '数据备份',
            children: <BackupSettings />,
        },
        {
            key: 'email',
            label: '邮件配置',
            children: <EmailSettings />,
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={4} style={{ margin: 0 }}>系统设置</Title>
            </div>

            <Card className={styles.card}>
                <Tabs items={tabItems} />
            </Card>
        </div>
    );
};

export default SystemSettings;
