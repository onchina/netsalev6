import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Tabs } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import request from '../../api/request';

interface AccountSettingsModalProps {
    open: boolean;
    onClose: () => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ open, onClose }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handlePasswordSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            // 调用后端API修改密码
            await request.put('/users/password', {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            });
            message.success('密码修改成功，请重新登录');
            setLoading(false);
            onClose();
            form.resetFields();
        } catch (error: any) {
            console.error('Validate Failed:', error);
            message.error(error.response?.data?.message || '密码修改失败，请稍后重试');
            setLoading(false);
        }
    };

    const items = [
        {
            key: 'password',
            label: '修改密码',
            children: (
                <Form
                    form={form}
                    layout="vertical"
                    style={{ paddingTop: 16 }}
                >
                    <Form.Item
                        name="oldPassword"
                        label="当前密码"
                        rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                        <Input.Password prefix={<FontAwesomeIcon icon={faLock} />} placeholder="请输入当前密码" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 6, message: '密码长度不能少于6位' }
                        ]}
                    >
                        <Input.Password prefix={<FontAwesomeIcon icon={faLock} />} placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="确认新密码"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: '请再次输入新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<FontAwesomeIcon icon={faLock} />} placeholder="请再次输入新密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={handlePasswordSubmit} loading={loading} block>
                            确认修改
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
    ];

    return (
        <Modal
            title="账号设置"
            open={open}
            onCancel={onClose}
            footer={null}
            width={500}
        >
            <Tabs defaultActiveKey="password" items={items} />
        </Modal>
    );
};

export default AccountSettingsModal;
