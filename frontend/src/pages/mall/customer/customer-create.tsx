import React from 'react';
import { Card, Form, Input, DatePicker, Select, Button, Space, Row, Col, Typography, Divider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import styles from './customer.module.css';

const { Title } = Typography;
const { TextArea } = Input;

const CustomerCreate: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // 渠道来源选项
    const channelOptions = [
        { value: 'douyin', label: '抖音' },
        { value: 'kuaishou', label: '快手' },
        { value: 'wechat', label: '微信' },
        { value: 'taobao', label: '淘宝' },
        { value: 'jd', label: '京东' },
        { value: 'offline', label: '线下' },
        { value: 'other', label: '其他' },
    ];

    const handleSubmit = (values: unknown) => {
        console.log('提交客户信息:', values);
        // TODO: 调用 API 保存客户
        navigate('/mall/customer/list');
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className={styles.container}>
            <Title level={4}>新建客户</Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    ownerId: 'EMP001 - 张三',
                }}
            >
                {/* 客户基础信息 */}
                <Card title="客户基础信息" className={styles.card}>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="姓名"
                                name="name"
                                rules={[{ required: true, message: '请输入客户姓名' }]}
                            >
                                <Input placeholder="请输入客户姓名" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="电话"
                                name="phone"
                                rules={[
                                    { required: true, message: '请输入联系电话' },
                                    { pattern: /^1\d{10}$/, message: '请输入正确的手机号码' },
                                ]}
                            >
                                <Input placeholder="请输入联系电话" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                label="地址"
                                name="address"
                            >
                                <TextArea rows={3} placeholder="请输入详细地址" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* 客户画像信息 */}
                <Card title="客户画像信息" className={styles.card}>
                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item label="身高（cm）" name="height">
                                <Input type="number" placeholder="请输入身高" suffix="cm" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="年龄" name="age">
                                <Input type="number" placeholder="请输入年龄" suffix="岁" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="体重（kg）" name="weight">
                                <Input type="number" placeholder="请输入体重" suffix="kg" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* 渠道与归属 */}
                <Card title="渠道与归属" className={styles.card}>
                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="渠道来源"
                                name="channel"
                                rules={[{ required: true, message: '请选择渠道来源' }]}
                            >
                                <Select placeholder="请选择渠道来源" options={channelOptions} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="进线日期"
                                name="entryDate"
                                rules={[{ required: true, message: '请选择进线日期' }]}
                            >
                                <DatePicker style={{ width: '100%' }} placeholder="请选择进线日期" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="归属员工" name="ownerId">
                                <Select disabled placeholder="归属员工" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Divider />

                {/* 底部按钮 */}
                <div className={styles.actions}>
                    <Space size="middle">
                        <Button icon={<FontAwesomeIcon icon={faXmark} />} onClick={handleCancel}>
                            取消
                        </Button>
                        <Button type="primary" icon={<FontAwesomeIcon icon={faFloppyDisk} />} htmlType="submit">
                            保存
                        </Button>
                    </Space>
                </div>
            </Form>
        </div>
    );
};

export default CustomerCreate;
