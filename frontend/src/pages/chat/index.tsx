/* 确认当前处于 Ubuntu 远程服务器环境，使用 1Panel/Docker 容器化管理。 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Layout,
    Avatar,
    Input,
    Button,
    Badge,
    Typography,
    Menu,
    Space,
    Popover,
    Tooltip,
    Image,
    message,
    Modal,
    Form,
    Select,
} from 'antd';
import type { MenuProps } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faComment,
    faDownload,
    faEllipsisVertical,
    faFaceSmile,
    faFile,
    faImage,
    faMagnifyingGlass,
    faMicrophone,
    faPaperPlane,
    faPhone,
    faPlus,
    faUser,
    faVideo,
} from '@fortawesome/free-solid-svg-icons';
import request from '../../api/request';
import { useUserStore } from '../../stores';
import { useWebSocket } from '../../hooks/use-websocket';
import styles from './chat.module.css';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

// --- TYPES ---
type MessageType = 'text' | 'image' | 'audio' | 'file';
type NavType = 'recent' | 'contacts';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    direction: 'sent' | 'received';
    type: MessageType;
    content: string;
    time: string;
    fileName?: string;
    fileSize?: string;
    senderExt?: string;
    senderDept?: string;
    senderAvatar?: string;
    duration?: number;
}

interface Conversation {
    id: string;
    name: string;
    type: 'single' | 'group';
    lastMessage: string;
    time: string;
    unread: number;
    avatarLabel?: string;
    avatarColor?: string;
    members?: string[];
    online?: boolean;
    department?: string;
    color?: string;
    avatar?: string;
    mobile?: string;
    employeeId?: string;
    employeeNo?: string;
    phone?: string;
    email?: string;
    role?: string;
}

const emojiList = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '🙂', '🤗', '🤔', '😐', '😑', '🙄', '😏', '😣', '😥', '😮', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '😢', '😭', '哼', '👍', '👌', '✌️', '🤝', '❤️', '🔥', '✅', '⭐', '🎉', '📢', '📌', '📎'];

// --- COMPONENT ---
const InternalChat: React.FC = () => {
    const currentUser = useUserStore((s) => s.user);
    const [navType, setNavType] = useState<NavType>('recent');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
    const [inputValue, setInputValue] = useState('');
    const [employees, setEmployees] = useState<Conversation[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [groups, setGroups] = useState<Conversation[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);

    // WebSocket 连接
    const { send: wsSend, on: wsOn, off: wsOff } = useWebSocket();

    // 加载数据
    const fetchListData = useCallback(async () => {
        try {
            const [empRes, convRes, grpRes]: any = await Promise.all([
                request.get('/chat/employees'),
                request.get('/chat/conversations'),
                request.get('/chat/groups'),
            ]);
            setEmployees(Array.isArray(empRes) ? empRes : empRes?.data || []);
            setConversations(Array.isArray(convRes) ? convRes : convRes?.data || []);
            setGroups(Array.isArray(grpRes) ? grpRes : grpRes?.data || []);
        } catch (e) {
            console.error('加载聊天数据失败:', e);
        }
    }, []);

    useEffect(() => {
        fetchListData();
    }, [fetchListData]);

    // 加载指定会话的消息
    const loadedConvRef = useRef<Set<string>>(new Set());
    const fetchMessages = useCallback(async (conversationId: string) => {
        if (!conversationId || loadedConvRef.current.has(conversationId)) return;
        loadedConvRef.current.add(conversationId);
        setLoadingMessages(true);
        try {
            const res: any = await request.get('/chat/messages', {
                params: { conversation_id: conversationId },
            });
            const msgs = Array.isArray(res) ? res : res?.data || [];
            setAllMessages(prev => ({ ...prev, [conversationId]: msgs }));
        } catch (e) {
            console.error('加载消息失败:', e);
            loadedConvRef.current.delete(conversationId); // 失败时允许重试
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // ============================================================
    // WebSocket 事件监听
    // ============================================================
    useEffect(() => {
        // 收到 IM 消息
        const handleImMessage = (data: any) => {
            if (!data?.conversationId) return;
            const incoming: Message = {
                id: data.id || Date.now().toString(),
                senderId: data.senderId || '',
                senderName: data.senderName || '',
                senderExt: data.senderExt || '',
                senderDept: data.senderDept || '',
                senderAvatar: data.senderAvatar || '',
                direction: 'received',
                type: data.type || data.contentType || 'text',
                content: data.content || '',
                time: data.time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                fileName: data.fileName,
                fileSize: data.fileSize,
            };
            setAllMessages(prev => ({
                ...prev,
                [data.conversationId]: [...(prev[data.conversationId] || []), incoming],
            }));

            // 更新会话列表的最后消息
            setConversations(prev =>
                prev.map(c => c.id === data.conversationId ? {
                    ...c,
                    lastMessage: data.type === 'file' ? `[文件] ${data.fileName || ''}` :
                        data.type === 'image' ? '[图片]' :
                            data.content?.substring(0, 50) || '',
                    time: data.time || '刚刚',
                } : c)
            );
        };

        // 在线状态变化
        const handleStatusChange = (data: any) => {
            if (!data?.userId) return;
            const isOnline = data.status === 'online';
            // 更新联系人列表
            setEmployees(prev =>
                prev.map(e => e.id === data.userId ? { ...e, online: isOnline } : e)
            );
            // 更新会话列表 (私聊)
            setConversations(prev =>
                prev.map(c => {
                    if (c.type === 'single' && (c.employeeId || c.employeeNo)) {
                        // 需要通过 members 或其他方式匹配 userId
                        // 简单处理：对所有 conversation 检查
                        return c;
                    }
                    return c;
                })
            );
        };

        // WS 连接状态
        const handleConnected = () => setWsConnected(true);
        const handleDisconnected = () => setWsConnected(false);

        wsOn('im.message', handleImMessage);
        wsOn('status.change', handleStatusChange);
        wsOn('ws.connected', handleConnected);
        wsOn('ws.disconnected', handleDisconnected);

        return () => {
            wsOff('im.message', handleImMessage);
            wsOff('status.change', handleStatusChange);
            wsOff('ws.connected', handleConnected);
            wsOff('ws.disconnected', handleDisconnected);
        };
    }, [wsOn, wsOff]);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [inputHeight, setInputHeight] = useState(240);
    const [isFileDragging, setIsFileDragging] = useState(false);
    const [form] = Form.useForm();
    const [burnAfterReading, setBurnAfterReading] = useState(false);
    const [burnTimeout, setBurnTimeout] = useState(10);
    const [autoClearDaily, setAutoClearDaily] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editableRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 阅后即焚
    useEffect(() => {
        if (!burnAfterReading || !selectedId) return;
        const currentMessages = allMessages[selectedId] || [];
        const timer = setTimeout(() => {
            if (currentMessages.length > 0) {
                setAllMessages(prev => ({ ...prev, [selectedId]: [] }));
                message.info('由于启用了阅后即焚，消息已清除');
            }
        }, burnTimeout * 1000);
        return () => clearTimeout(timer);
    }, [allMessages, burnAfterReading, selectedId, burnTimeout]);

    const activeMessages = selectedId ? (allMessages[selectedId] || []) : [];

    useEffect(() => {
        scrollToBottom();
    }, [allMessages, selectedId]);

    // 全局按键：自动聚焦输入框
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const isModalOpen = document.querySelector('.ant-modal');
            const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '') ||
                (document.activeElement as HTMLElement)?.isContentEditable;
            const isSpecialKey = e.ctrlKey || e.altKey || e.metaKey;
            if (selectedId && navType === 'recent' && !isModalOpen && !isInputFocused && !isSpecialKey && e.key.length === 1) {
                editableRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [selectedId, navType]);

    // 切换 nav 清空选中
    const handleNavChange = (type: NavType) => {
        setNavType(type);
        setSelectedId(null);
    };

    // 选中会话时加载消息
    const handleSelectConversation = useCallback((id: string) => {
        setSelectedId(id);
        if (navType === 'recent') {
            fetchMessages(id);
        }
    }, [navType, fetchMessages]);

    // 查找当前聊天对象
    const currentChat = selectedId ? (
        conversations.find(c => c.id === selectedId) ||
        groups.find(g => g.id === selectedId) ||
        employees.find(e => e.id === selectedId)
    ) : null;

    // 格式化名称
    const formatEmployeeName = (item: any) => {
        if (item.type === 'group') return item.name;
        const name = item.name || item.senderName;
        const ext = item.employeeId || item.employeeNo || item.senderExt || '';
        const dept = item.department || item.senderDept || '';
        if (!ext && !dept) return name;
        return `${name}(${ext})·${dept}`;
    };

    const renderFormattedName = (item: any) => {
        if (item.type === 'group') return item.name;
        const name = item.name || item.senderName;
        const ext = item.employeeId || item.employeeNo || item.senderExt || '';
        const dept = item.department || item.senderDept || '';
        return (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                {name}
                {(ext || dept) && (
                    <span style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 400 }}>({ext}) · {dept}</span>
                )}
            </span>
        );
    };

    const handleInputChange = () => {
        if (editableRef.current) {
            setInputValue(editableRef.current.innerText);
        }
    };

    const handleSend = () => {
        if (!selectedId || !currentUser) return;
        const text = editableRef.current?.innerText || '';
        if (!text.trim()) return;

        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const newMsg: Message = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderExt: currentUser.employeeNo || '',
            senderDept: '',
            senderAvatar: currentUser.avatar || '',
            direction: 'sent',
            type: 'text',
            content: text,
            time: timeStr,
        };

        // 乐观更新本地消息
        setAllMessages(prev => ({
            ...prev,
            [selectedId]: [...(prev[selectedId] || []), newMsg]
        }));

        // 通过 WebSocket 发送给后端
        wsSend('im.message', {
            conversationId: selectedId,
            content: text,
            contentType: 'text',
        });

        // 更新会话列表最后消息
        setConversations(prev =>
            prev.map(c => c.id === selectedId ? { ...c, lastMessage: text.substring(0, 50), time: timeStr } : c)
        );

        if (editableRef.current) {
            editableRef.current.innerText = '';
        }
        setInputValue('');
    };

    const handleSendFile = (file: File) => {
        if (!file || !selectedId || !currentUser) return;
        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const newMsg: Message = {
                    id: Date.now().toString(),
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    senderExt: currentUser.employeeNo || '',
                    senderDept: '',
                    senderAvatar: currentUser.avatar || '',
                    direction: 'sent',
                    type: 'image',
                    content: dataUrl,
                    time: timeStr,
                };
                setAllMessages(prev => ({
                    ...prev,
                    [selectedId]: [...(prev[selectedId] || []), newMsg]
                }));
                // 通过 WS 发送
                wsSend('im.message', {
                    conversationId: selectedId,
                    content: dataUrl,
                    contentType: 'image',
                });
            };
            reader.readAsDataURL(file);
        } else {
            const fileSizeStr = `${(file.size / 1024 / 1024).toFixed(2)}MB`;
            const newMsg: Message = {
                id: Date.now().toString(),
                senderId: currentUser.id,
                senderName: currentUser.name,
                senderExt: currentUser.employeeNo || '',
                senderDept: '',
                senderAvatar: currentUser.avatar || '',
                direction: 'sent',
                type: 'file',
                content: file.name,
                time: timeStr,
                fileName: file.name,
                fileSize: fileSizeStr,
            };
            setAllMessages(prev => ({
                ...prev,
                [selectedId]: [...(prev[selectedId] || []), newMsg]
            }));
            // 通过 WS 发送
            wsSend('im.message', {
                conversationId: selectedId,
                content: file.name,
                contentType: 'file',
                fileName: file.name,
                fileSize: fileSizeStr,
            });
            message.success('文件已发送');
        }
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => handleSendFile(file));
        }
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedId && navType === 'recent') setIsFileDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFileDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFileDragging(false);
        if (!selectedId || navType !== 'recent') return;
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => handleSendFile(file));
        }
    };

    const handleDragStartBar = (type: React.MouseEvent) => {
        type.preventDefault();
        const startY = type.clientY;
        const startHeight = inputHeight;
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newHeight = Math.min(Math.max(startHeight + deltaY, 100), 400);
            setInputHeight(newHeight);
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 联系人 → 发起私聊
    const handleStartChat = async (contact: Conversation) => {
        try {
            const res: any = await request.post('/chat/conversations', {
                peer_user_id: contact.id,
            });
            const convId = res?.id || res?.data?.id;
            if (convId) {
                // 刷新会话列表
                await fetchListData();
                setNavType('recent');
                setSelectedId(convId);
                fetchMessages(convId);
            }
        } catch (e) {
            console.error('创建会话失败:', e);
            message.error('创建会话失败');
        }
    };

    // 创建群聊
    const handleCreateGroup = async () => {
        try {
            const values = await form.validateFields();
            const res: any = await request.post('/chat/groups', {
                name: values.groupName,
                member_ids: values.members,
            });
            if (res?.id || res?.data?.id) {
                message.success(`群组 "${values.groupName}" 已成功创建`);
                setCreateGroupModalVisible(false);
                form.resetFields();
                // 刷新列表
                await fetchListData();
            }
        } catch (e: any) {
            if (e?.errorFields) return; // 表单验证失败
            console.error('创建群聊失败:', e);
            message.error('创建群聊失败');
        }
    };

    // 渲染消息内容
    const renderMessageContent = (msg: Message) => {
        switch (msg.type) {
            case 'text':
                return <Text style={{ color: msg.direction === 'sent' ? '#fff' : 'inherit' }}>{msg.content}</Text>;
            case 'image':
                return (
                    <Image
                        src={msg.content}
                        style={{ maxWidth: '100%', borderRadius: 8 }}
                        preview={{ visible: false }}
                        onClick={() => setPreviewImage(msg.content)}
                    />
                );
            case 'file':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 4, minWidth: 200 }}>
                        <div style={{ width: 40, height: 40, background: msg.direction === 'sent' ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            <FontAwesomeIcon icon={faFile} style={{ color: msg.direction === 'sent' ? '#fff' : '#6366f1' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong style={{ color: msg.direction === 'sent' ? '#fff' : 'inherit', display: 'block' }} ellipsis>{msg.fileName}</Text>
                            <Text style={{ fontSize: 11, opacity: 0.8, color: msg.direction === 'sent' ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{msg.fileSize}</Text>
                        </div>
                        <FontAwesomeIcon icon={faDownload} style={{ color: msg.direction === 'sent' ? '#fff' : '#6366f1', fontSize: 18, cursor: 'pointer' }} />
                    </div>
                );
            default:
                return null;
        }
    };

    // 获取左侧列表数据
    const getListData = () => {
        const keyword = searchKeyword.toLowerCase();
        if (navType === 'recent') {
            return conversations.filter(c => c.name.toLowerCase().includes(keyword));
        }
        const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(keyword));
        const filteredEmployees = employees.filter(e =>
            e.name.toLowerCase().includes(keyword) ||
            (e.department && e.department.toLowerCase().includes(keyword))
        );
        return [
            { type: 'header', label: '群聊' },
            ...filteredGroups,
            { type: 'header', label: '联系人' },
            ...filteredEmployees
        ];
    };

    const navMenuItems: MenuProps['items'] = [
        { key: 'recent', icon: <FontAwesomeIcon icon={faComment} />, title: '最近聊天' },
        { key: 'contacts', icon: <FontAwesomeIcon icon={faUser} />, title: '通讯录' },
    ];

    const renderEmptyState = () => (
        <div className={styles.emptyState}>
            <div className={styles.emptyLogo}>
                <svg viewBox="0 0 1024 1024" width="100%" height="100%">
                    <path d="M685.248 103.424c-220.032 0-398.4 153.28-398.4 342.336 0 105.792 55.424 200.576 142.976 264.96l-36.416 109.12 121.6-60.8a458.112 458.112 0 0 0 170.24 32.512c220.032 0 398.4-153.28 398.4-342.336S905.28 103.424 685.248 103.424z m166.4 461.696a1773.056 1773.056 0 0 1-52.096-7.808l-15.68 15.616a244.352 244.352 0 0 1-97.152 54.464l-11.84 3.904-4.8 11.456-14.784 35.392 3.968-15.488 17.6-68.416-5.824-3.52a233.024 233.024 0 0 1-91.008-164.864c0-117.76 111.936-213.632 249.6-213.632s249.6 95.808 249.6 213.632c0 48.704-19.136 93.952-53.568 129.28zM338.752 505.408c-143.744 0-260.672 101.568-260.672 226.816 0 70.08 36.608 132.864 94.464 175.552l-24.128 72.448 80.64-40.32c32.768 9.088 68.096 14.144 104.576 14.144 143.744 0 260.672-101.568 260.672-226.816S482.432 505.408 338.752 505.408z" fill="#cdcdcd"></path>
                </svg>
            </div>
            <Title level={5} className={styles.emptyTitle}>即时通讯内控系统</Title>
        </div>
    );

    const renderProfile = (contact: Conversation) => (
        <div className={styles.profileContainer}>
            <Avatar
                size={120}
                src={contact.avatar}
                className={styles.profileAvatar}
                style={{ backgroundColor: contact.color || contact.avatarColor || '#6366f1' }}
            >
                {contact.name.charAt(0)}
            </Avatar>
            <Title level={2} className={styles.profileName}>{contact.name}</Title>
            <div className={styles.profileDept}>{contact.department}</div>

            <div className={styles.profileInfoList}>
                <div className={styles.profileInfoItem}>
                    <span className={styles.profileInfoLabel}>员工编号</span>
                    <span className={styles.profileInfoValue}>{contact.employeeId || contact.employeeNo || '-'}</span>
                </div>
                <div className={styles.profileInfoItem}>
                    <span className={styles.profileInfoLabel}>手机号码</span>
                    <span className={styles.profileInfoValue}>{contact.phone || contact.mobile || '-'}</span>
                </div>
                <div className={styles.profileInfoItem}>
                    <span className={styles.profileInfoLabel}>部门</span>
                    <span className={styles.profileInfoValue}>{contact.department}</span>
                </div>
                <div className={styles.profileInfoItem}>
                    <span className={styles.profileInfoLabel}>在线状态</span>
                    <span className={styles.profileInfoValue} style={{ color: contact.online ? '#10b981' : '#94a3b8' }}>
                        {contact.online ? '✅ 在线' : '⚪ 离线'}
                    </span>
                </div>
            </div>

            <Button
                type="primary"
                size="large"
                icon={<FontAwesomeIcon icon={faComment} />}
                className={styles.profileActionBtn}
                onClick={() => handleStartChat(contact)}
            >
                发消息
            </Button>
        </div>
    );

    return (
        <Layout className={styles.chatLayout}>
            <Sider width={72} className={styles.navSider}>
                <Menu
                    mode="inline"
                    selectedKeys={[navType]}
                    items={navMenuItems}
                    onClick={({ key }) => handleNavChange(key as NavType)}
                    className={styles.navMenu}
                />
            </Sider>

            <Sider width={300} className={styles.listSider}>
                <div className={styles.listHeader}>
                    <div className={styles.listTitle}>
                        {navType === 'recent' ? '正在聊天' : '通讯录'}
                    </div>
                    {navType === 'contacts' && (
                        <Button
                            className={styles.createGroupBtn}
                            icon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => setCreateGroupModalVisible(true)}
                        >
                            创建群聊
                        </Button>
                    )}
                </div>

                <div className={styles.searchBox}>
                    <Input
                        placeholder="快速搜索..."
                        prefix={<FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: '#94a3b8' }} />}
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        allowClear
                    />
                </div>

                <div className={styles.conversationList}>
                    {getListData().map((item: any, idx) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`header-${idx}`} className={styles.listSectionHeader}>
                                    {item.label}
                                </div>
                            );
                        }

                        const itemId = item.id;
                        const isSelected = selectedId === itemId;

                        return (
                            <div
                                key={itemId}
                                className={`${styles.listItem} ${isSelected ? styles.listItemActive : ''}`}
                                onClick={() => handleSelectConversation(itemId)}
                            >
                                {isSelected && <div className={styles.listItemIndicator} />}
                                <Badge count={item.unread || 0} size="small" offset={[-2, 2]}>
                                    <Avatar
                                        size={44}
                                        src={item.avatar}
                                        style={{ backgroundColor: item.avatarColor || item.color || '#6366f1', fontSize: 18, fontWeight: 600 }}
                                    >
                                        {!item.avatar && (item.avatarLabel || item.name.charAt(0))}
                                    </Avatar>
                                </Badge>
                                <div className={styles.listItemContent}>
                                    <div className={styles.listItemHeader}>
                                        <div className={styles.listItemName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {renderFormattedName(item)}
                                        </div>
                                        {navType === 'recent' && item.time && <span className={styles.listItemTime}>{item.time}</span>}
                                    </div>
                                    <div className={styles.listItemDesc} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                        {navType === 'contacts' && item.type !== 'group' ? (
                                            <span style={{ color: item.online ? '#10b981' : '#94a3b8', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.online ? '#10b981' : '#94a3b8' }} />
                                                {item.online ? '在线' : '离线'}
                                            </span>
                                        ) : (
                                            <Text ellipsis style={{ width: '100%', fontSize: 12, color: '#94a3b8' }}>
                                                {item.lastMessage || (item.type === 'group' ? '群聊' : '联系人')}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Sider>

            <Content className={styles.chatContent}>
                {!selectedId ? (
                    renderEmptyState()
                ) : (
                    navType === 'contacts' ? (
                        currentChat ? renderProfile(currentChat) : renderEmptyState()
                    ) : (
                        <>
                            <div className={styles.chatHeader}>
                                <div className={styles.chatHeaderInfo}>
                                    <div className={styles.chatHeaderTitle}>
                                        {currentChat && renderFormattedName(currentChat)}
                                    </div>
                                    <div className={styles.chatHeaderStatus}>
                                        {currentChat?.type === 'single' && (
                                            <>
                                                <div className={`${styles.statusDot} ${currentChat?.online ? styles.statusOnline : styles.statusOffline}`} />
                                                <span className={styles.statusText}>{currentChat?.online ? '在线' : '离线'}</span>
                                            </>
                                        )}
                                        {currentChat?.type === 'group' && <span className={styles.statusText}>{currentChat?.members?.length || 0} 位成员</span>}
                                        <span style={{
                                            marginLeft: 12,
                                            fontSize: 11,
                                            color: wsConnected ? '#10b981' : '#ef4444',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                backgroundColor: wsConnected ? '#10b981' : '#ef4444',
                                                display: 'inline-block',
                                            }} />
                                            {wsConnected ? '实时连接' : '连接断开'}
                                        </span>
                                    </div>
                                </div>
                                <Space size={16} style={{ color: '#64748b', fontSize: 18 }}>
                                    <Tooltip title="语音通话"><FontAwesomeIcon icon={faPhone} style={{ cursor: 'pointer' }} /></Tooltip>
                                    <Tooltip title="视频会议"><FontAwesomeIcon icon={faVideo} style={{ cursor: 'pointer' }} /></Tooltip>
                                    <Popover
                                        content={
                                            <div style={{ width: 220, padding: '4px 0' }}>
                                                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
                                                    <Text strong>阅后即焚</Text>
                                                    <Select
                                                        size="small"
                                                        value={burnAfterReading ? 'on' : 'off'}
                                                        onChange={(val) => setBurnAfterReading(val === 'on')}
                                                        style={{ width: 70 }}
                                                        options={[
                                                            { value: 'on', label: '开启' },
                                                            { value: 'off', label: '关闭' },
                                                        ]}
                                                    />
                                                </div>
                                                {burnAfterReading && (
                                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
                                                        <div style={{ marginBottom: 8, fontSize: 12, color: '#64748b' }}>自动清除时间 (秒)</div>
                                                        <Select
                                                            size="small"
                                                            value={burnTimeout}
                                                            onChange={setBurnTimeout}
                                                            style={{ width: '100%' }}
                                                            options={[
                                                                { value: 5, label: '5 秒' },
                                                                { value: 10, label: '10 秒' },
                                                                { value: 30, label: '30 秒' },
                                                                { value: 60, label: '1 分钟' },
                                                            ]}
                                                        />
                                                    </div>
                                                )}
                                                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <Text strong>自动清理</Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>每天0点自动清空记录</Text>
                                                    </div>
                                                    <Select
                                                        size="small"
                                                        value={autoClearDaily ? 'on' : 'off'}
                                                        onChange={(val) => {
                                                            const isEnabled = val === 'on';
                                                            setAutoClearDaily(isEnabled);
                                                            if (isEnabled) {
                                                                message.success('已开启每日0点自动清理');
                                                            }
                                                        }}
                                                        style={{ width: 70 }}
                                                        options={[
                                                            { value: 'on', label: '开启' },
                                                            { value: 'off', label: '关闭' },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        }
                                        trigger="click"
                                        placement="bottomRight"
                                    >
                                        <Tooltip title="更多功能">
                                            <FontAwesomeIcon icon={faEllipsisVertical} style={{ cursor: 'pointer' }} />
                                        </Tooltip>
                                    </Popover>
                                </Space>
                            </div>

                            <div className={styles.messageArea}>
                                {loadingMessages && (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                                        加载消息中...
                                    </div>
                                )}
                                {activeMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`${styles.messageItem} ${msg.direction === 'sent' ? styles.messageSent : styles.messageReceived}`}
                                    >
                                        <Avatar
                                            size={36}
                                            src={msg.senderAvatar}
                                            style={{ backgroundColor: msg.direction === 'sent' ? '#6366f1' : '#e2e8f0', color: msg.direction === 'sent' ? '#fff' : '#64748b', marginRight: msg.direction === 'sent' ? 0 : 12, marginLeft: msg.direction === 'sent' ? 12 : 0 }}
                                        >
                                            {!msg.senderAvatar && msg.senderName?.charAt(0)}
                                        </Avatar>
                                        <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: msg.direction === 'sent' ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{formatEmployeeName(msg)}</div>
                                            <div className={`${styles.messageBubble} ${msg.type !== 'text' ? styles.mediaBubble : ''}`}>
                                                {renderMessageContent(msg)}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{msg.time}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className={styles.resizeHandle} onMouseDown={handleDragStartBar} />

                            <div className={styles.inputAreaContainer}>
                                {burnAfterReading && (
                                    <div style={{
                                        position: 'absolute',
                                        top: -36,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        padding: '4px 16px',
                                        borderRadius: '20px',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        zIndex: 10
                                    }}>
                                        <div style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                                        阅后即焚模式已开启：消息将在 {burnTimeout} 秒后自动销毁
                                    </div>
                                )}
                                <div
                                    className={`${styles.inputArea} ${isFileDragging ? styles.inputAreaDragging : ''}`}
                                    style={{ height: inputHeight }}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {isFileDragging && (
                                        <div className={styles.dragOverlay}>
                                            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 24, marginBottom: 8 }} />
                                            释放文件立即发送
                                        </div>
                                    )}
                                    <div className={styles.inputToolbar}>
                                        <Space size={4}>
                                            <Popover
                                                content={
                                                    <div className={styles.emojiPicker}>
                                                        {emojiList.map((e, i) => (
                                                            <span key={i} className={styles.emojiItem} onClick={() => {
                                                                if (editableRef.current) {
                                                                    editableRef.current.innerText += e;
                                                                    handleInputChange();
                                                                }
                                                                setShowEmojiPicker(false);
                                                            }}>{e}</span>
                                                        ))}
                                                    </div>
                                                }
                                                trigger="click"
                                                open={showEmojiPicker}
                                                onOpenChange={setShowEmojiPicker}
                                            >
                                                <Button type="text" icon={<FontAwesomeIcon icon={faFaceSmile} />} />
                                            </Popover>
                                            <Tooltip title="发送图片或文件">
                                                <Button type="text" icon={<FontAwesomeIcon icon={faImage} />} onClick={handleFileUpload} />
                                            </Tooltip>
                                            <Button type="text" icon={<FontAwesomeIcon icon={faMicrophone} />} />
                                        </Space>
                                        <div style={{ flex: 1 }} />
                                    </div>

                                    <div
                                        className={styles.inputEditable}
                                        contentEditable
                                        data-placeholder="输入消息，开启高效办公对话..."
                                        ref={editableRef}
                                        onInput={handleInputChange}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && e.ctrlKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />

                                    <div className={styles.inputActions}>
                                        <Button
                                            type="primary"
                                            className={styles.sendButton}
                                            icon={<FontAwesomeIcon icon={faPaperPlane} />}
                                            onClick={handleSend}
                                            disabled={!inputValue.trim()}
                                        >
                                            发送
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={onFileChange}
                                multiple
                            />
                        </>
                    )
                )}
            </Content>

            <Image
                style={{ display: 'none' }}
                preview={{
                    visible: !!previewImage,
                    src: previewImage || '',
                    onVisibleChange: (visible) => !visible && setPreviewImage(null),
                }}
            />

            <Modal
                title="创建新群聊"
                open={createGroupModalVisible}
                onOk={handleCreateGroup}
                onCancel={() => setCreateGroupModalVisible(false)}
                okText="立即创建"
                cancelText="取消"
                centered
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="groupName" label="群组名称" rules={[{ required: true, message: '请定义群组名称' }]}>
                        <Input placeholder="例如：Q1业绩冲刺组" />
                    </Form.Item>
                    <Form.Item name="members" label="邀请成员" rules={[{ required: true, message: '请至少邀请一位同事' }]}>
                        <Select
                            mode="multiple"
                            placeholder="搜索员工姓名或部门..."
                            style={{ width: '100%' }}
                            options={employees.map(e => ({
                                value: e.id,
                                label: e.name,
                                fullLabel: `${e.name} (${e.department})`,
                                avatar: e.avatar,
                                dept: e.department,
                                color: e.color || e.avatarColor
                            }))}
                            optionFilterProp="fullLabel"
                            optionRender={(option) => (
                                <Space align="center" style={{ padding: '4px 0' }}>
                                    <Avatar size="small" src={option.data.avatar} style={{ backgroundColor: option.data.color }}>
                                        {option.data.label?.toString().charAt(0)}
                                    </Avatar>
                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                        <Text strong style={{ fontSize: 13 }}>{option.data.label}</Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{option.data.dept}</Text>
                                    </div>
                                </Space>
                            )}
                            maxTagCount="responsive"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default InternalChat;
