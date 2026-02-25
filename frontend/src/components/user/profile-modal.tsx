import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Avatar, Tag, Button, Form, Input, Upload, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPenToSquare, faFloppyDisk, faUpload } from '@fortawesome/free-solid-svg-icons';
import type { RcFile } from 'antd/es/upload';
import type { User } from '../../types';
import { useUserStore } from '../../stores';
import request from '../../api/request';

interface ProfileModalProps {
    open: boolean;
    onClose: () => void;
    user: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, user }) => {
    const { setUser } = useUserStore();
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [avatarUrl, setAvatarUrl] = useState(user.avatar);

    useEffect(() => {
        if (open) {
            setIsEditing(false);
            setAvatarUrl(user.avatar);
            form.setFieldsValue(user);
        }
    }, [open, user, form]);

    const handleEdit = () => {
        setIsEditing(true);
        form.setFieldsValue(user);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setAvatarUrl(user.avatar);
        form.resetFields();
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const newUser = { ...user, ...values, avatar: avatarUrl };
            // 调用后端API保存修改
            await request.put(`/users/${user.id}`, newUser);
            setUser(newUser);
            message.success('个人档案已更新');
            setIsEditing(false);
        } catch (error) {
            console.error('Validate Failed:', error);
            message.error('更新失败，请稍后重试');
        }
    };

    const getBase64 = (img: RcFile, callback: (url: string) => void) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result as string));
        reader.readAsDataURL(img);
    };

    const handleUpload = async (file: RcFile) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await request.post('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setAvatarUrl(response.data.avatarUrl);
            message.success('头像上传成功');
        } catch (error) {
            message.error('头像上传失败，请稍后重试');
        }
    };

    const beforeUpload = (file: RcFile) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('只支持 JPG/PNG 格式图片!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片大小不能超过 2MB!');
            return false;
        }

        getBase64(file, (url) => {
            setAvatarUrl(url);
        });
        // 调用上传函数
        handleUpload(file);
        return false;
    };

    return (
        <Modal
            title="个人档案"
            open={open}
            onCancel={onClose}
            footer={
                isEditing ? (
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                            取消
                        </Button>
                        <Button type="primary" icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={handleSave}>
                            保存
                        </Button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <Button type="primary" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={handleEdit}>
                            编辑资料
                        </Button>
                    </div>
                )
            }
            width={500}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                    <Avatar size={80} icon={<FontAwesomeIcon icon={faUser} />} src={avatarUrl} style={{ marginBottom: 16 }} />
                    {isEditing && (
                        <Upload
                            name="avatar"
                            showUploadList={false}
                            beforeUpload={beforeUpload}
                            style={{ position: 'absolute', bottom: 16, right: -10 }}
                        >
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faUpload} />}
                                size="small"
                                style={{ position: 'absolute', bottom: 16, right: -8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                            />
                        </Upload>
                    )}
                </div>
                <div style={{ fontSize: 20, fontWeight: 500 }}>{user.name}</div>
                <div style={{ color: '#666' }}>{user.employeeNo}</div>
            </div>

            {isEditing ? (
                <Form form={form} layout="vertical">
                    <Form.Item label="工号">
                        <Input value={user.employeeNo} disabled />
                    </Form.Item>
                    <Form.Item label="姓名">
                        <Input value={user.name} disabled />
                    </Form.Item>
                    <Form.Item
                        label="手机号"
                        name="phone"
                        rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
                    >
                        <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                    >
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item label="角色">
                        <Tag>{user.roleLabel}</Tag>
                    </Form.Item>
                </Form>
            ) : (
                <Descriptions column={1} bordered>
                    <Descriptions.Item label="工号">{user.employeeNo}</Descriptions.Item>
                    <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
                    <Descriptions.Item label="手机号">{user.phone || '未设置'}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{user.email || '未设置'}</Descriptions.Item>
                    <Descriptions.Item label="角色">{user.roleLabel}</Descriptions.Item>
                    <Descriptions.Item label="权限">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {user.permissions.canAccessSettings && <Tag color="blue">系统设置</Tag>}
                            {user.permissions.canAccessAudit && <Tag color="green">财务审核</Tag>}
                            {user.permissions.canAccessAnalytics && <Tag color="orange">数据分析</Tag>}
                            {user.permissions.canManageEmployees && <Tag color="purple">员工管理</Tag>}
                        </div>
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Modal>
    );
};

export default ProfileModal;
