import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import styles from './floating-chat.module.css';

interface FloatingChatProps {
    badgeCount?: number;
}

const BUTTON_SIZE = 52;
const EDGE_MARGIN = 16; // 吸附后距离边缘的距离
const DRAG_THRESHOLD = 5; // 拖动阈值，小于此值视为点击

const FloatingChat: React.FC<FloatingChatProps> = ({ badgeCount = 0 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ right: EDGE_MARGIN, bottom: 100 });

    // 用 ref 追踪拖动状态，避免闭包陷阱
    const dragState = useRef({
        startX: 0,
        startY: 0,
        startRight: 0,
        startBottom: 0,
        hasMoved: false,
    });

    // 限制位置在可视区域内
    const clampPosition = useCallback((right: number, bottom: number) => {
        return {
            right: Math.max(EDGE_MARGIN, Math.min(right, window.innerWidth - BUTTON_SIZE - EDGE_MARGIN)),
            bottom: Math.max(EDGE_MARGIN, Math.min(bottom, window.innerHeight - BUTTON_SIZE - EDGE_MARGIN)),
        };
    }, []);

    // 判断当前是否在屏幕左半部分
    const isOnLeft = position.right > (window.innerWidth - BUTTON_SIZE) / 2;

    // 鼠标拖动
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            startRight: position.right,
            startBottom: position.bottom,
            hasMoved: false,
        };

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - dragState.current.startX;
            const dy = e.clientY - dragState.current.startY;

            if (!dragState.current.hasMoved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
                dragState.current.hasMoved = true;
                setIsDragging(true);
            }

            if (dragState.current.hasMoved) {
                // 向右移动 (dx > 0) -> 距离右边减小
                // 向下移动 (dy > 0) -> 距离下边减小
                const newRight = dragState.current.startRight - dx;
                const newBottom = dragState.current.startBottom - dy;
                setPosition(clampPosition(newRight, newBottom));
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [position, clampPosition]);

    // 点击打开即时通讯窗口
    const handleClick = useCallback(() => {
        if (dragState.current.hasMoved) return; // 拖动了不触发点击

        const w = 1024;
        const h = 768;
        // 使用可用工作区计算位置，避开任务栏
        const left = (window.screen.availWidth - w) / 2;
        const top = (window.screen.availHeight - h) / 2;

        // 组合更完整的特性字符串
        const features = [
            `width=${w}`,
            `height=${h}`,
            `left=${left}`,
            `top=${top}`,
            'popup=yes',      // 现代浏览器中强制弹出窗口模式的关键
            'resizable=no',   // 尽力而为（部分系统可能忽略）
            'scrollbars=no',
            'status=no',
            'toolbar=no',
            'menubar=no',
            'location=no'
        ].join(',');

        const chatWin = window.open('/chat', 'NetsaleChat', features);

        if (chatWin) {
            chatWin.focus();
            // 针对部分浏览器（如 Edge）可能的初次尺寸渲染偏差，尝试微调
            try {
                setTimeout(() => {
                    if (!chatWin.closed) {
                        chatWin.resizeTo(w, h);
                    }
                }, 200);
            } catch (e) {
                // 忽略可能的权限警告
            }
        }
    }, []);

    // 窗口缩放时确保不超出边界
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => clampPosition(prev.right, prev.bottom));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [clampPosition]);

    const className = [
        styles.floatingChat,
        isDragging ? styles.dragging : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ right: position.right, bottom: position.bottom }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            <div className={styles.chatButton}>
                <FontAwesomeIcon icon={faComment} />
                {badgeCount > 0 && (
                    <span className={styles.badge}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                )}
            </div>
            <span className={`${styles.tooltip} ${isOnLeft ? styles.tooltipRight : styles.tooltipLeft}`}>
                即时通讯
            </span>
        </div>
    );
};

export default FloatingChat;
