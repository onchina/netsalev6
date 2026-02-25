import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Card } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBookOpen,
    faCrown,
    faLock,
    faUser,
    faUserGear,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores';
import request from '../../api/request';
import styles from './login.module.css';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const demoAccounts: { username: string; password: string }[] = [
    { username: 'admin', password: 'admin123' },
    { username: 'finance', password: 'finance123' },
    { username: 'manager', password: 'manager123' },
    { username: 'sales', password: 'sales123' },
];

interface LoginForm {
    username: string;
    password: string;
    remember: boolean;
}

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { login } = useUserStore();

    const handleLogin = async (values: LoginForm) => {
        setLoading(true);
        try {
            const res: any = await request.post('/auth/login', {
                username: values.username,
                password: values.password
            });
            if (res && res.token && res.user) {
                login(res.user, res.token);
                message.success(`欢迎回来，${res.user.name}！`);
                navigate('/');
            }
        } catch (error: any) {
            // 错误已经在 request 拦截器中处理，此处不需额外 message.error
        } finally {
            setLoading(false);
        }
    };

    // 快速填充演示账号
    const fillDemoAccount = (username: string, password: string) => {
        form.setFieldsValue({ username, password });
    };

    return (
        <div className={styles.container}>
            {/* 左侧科技感背景 */}
            <div className={styles.leftPanel}>
                <div className={styles.bgOverlay} />
                <div className={styles.gridPattern} />
                <div className={styles.particles}>
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className={styles.particle} style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }} />
                    ))}
                </div>
                <div className={styles.leftContent}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <span>江湖</span>
                        </div>
                        <h1 className={styles.logoText}>江湖路远v1.0</h1>
                    </div>
                    <p className={styles.slogan}>智能化销售管理平台</p>
                    <div className={styles.features}>
                        <div className={styles.featureItem}>
                            <div className={styles.featureDot} />
                            <span>全渠道客户管理</span>
                        </div>
                        <div className={styles.featureItem}>
                            <div className={styles.featureDot} />
                            <span>智能订单处理</span>
                        </div>
                        <div className={styles.featureItem}>
                            <div className={styles.featureDot} />
                            <span>实时数据分析</span>
                        </div>
                    </div>
                </div>
                <div className={styles.circleDecor1} />
                <div className={styles.circleDecor2} />
            </div>

            {/* 右侧登录表单 */}
            <div className={styles.rightPanel}>
                <div className={styles.formWrapper}>
                    <div className={styles.formHeader}>
                        <h2>欢迎回来</h2>
                        <p>请登录您的账户</p>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        initialValues={{ remember: true }}
                        onFinish={handleLogin}
                        size="large"
                        className={styles.loginForm}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: '请输入用户名' }]}
                        >
                            <Input
                                prefix={<FontAwesomeIcon icon={faUser} className={styles.inputIcon} />}
                                placeholder="用户名"
                                className={styles.input}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password
                                prefix={<FontAwesomeIcon icon={faLock} className={styles.inputIcon} />}
                                placeholder="密码"
                                className={styles.input}
                            />
                        </Form.Item>

                        <Form.Item>
                            <div className={styles.formOptions}>
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox>记住我</Checkbox>
                                </Form.Item>
                                <a className={styles.forgotLink}>忘记密码?</a>
                            </div>
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className={styles.loginBtn}
                                block
                            >
                                登 录
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* 演示账号 */}
                    <div className={styles.demoSection}>
                        <div className={styles.demoTitle}>演示账号（点击快速填充）</div>
                        <div className={styles.demoAccounts}>
                            <Card
                                className={styles.demoCard}
                                onClick={() => fillDemoAccount('admin', 'admin123')}
                            >
                                <FontAwesomeIcon icon={faCrown} className={styles.demoIcon} style={{ color: '#faad14' }} />
                                <div className={styles.demoInfo}>
                                    <span className={styles.demoRole}>超级管理员</span>
                                    <span className={styles.demoCred}>admin / admin123</span>
                                </div>
                            </Card>
                            <Card
                                className={styles.demoCard}
                                onClick={() => fillDemoAccount('finance', 'finance123')}
                            >
                                <FontAwesomeIcon icon={faBookOpen} className={styles.demoIcon} style={{ color: '#52c41a' }} />
                                <div className={styles.demoInfo}>
                                    <span className={styles.demoRole}>财务主管</span>
                                    <span className={styles.demoCred}>finance / finance123</span>
                                </div>
                            </Card>
                            <Card
                                className={styles.demoCard}
                                onClick={() => fillDemoAccount('manager', 'manager123')}
                            >
                                <FontAwesomeIcon icon={faUsers} className={styles.demoIcon} style={{ color: '#1677ff' }} />
                                <div className={styles.demoInfo}>
                                    <span className={styles.demoRole}>销售经理</span>
                                    <span className={styles.demoCred}>manager / manager123</span>
                                </div>
                            </Card>
                            <Card
                                className={styles.demoCard}
                                onClick={() => fillDemoAccount('sales', 'sales123')}
                            >
                                <FontAwesomeIcon icon={faUserGear} className={styles.demoIcon} style={{ color: '#722ed1' }} />
                                <div className={styles.demoInfo}>
                                    <span className={styles.demoRole}>销售专员</span>
                                    <span className={styles.demoCred}>sales / sales123</span>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <span>© 2026 江湖路远 v1.0</span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Login;

