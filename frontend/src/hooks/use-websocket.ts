/**
 * WebSocket 连接 Hook
 * 接入点: ws://<host>/api/v1/ws/connect?token=<jwt>
 *
 * 功能:
 * - JWT 鉴权
 * - 心跳保活 (30s ping/pong)
 * - 自动重连 (指数退避, 最大 30s)
 * - 事件分发 (on/off/emit)
 */
import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../stores';

// WS 事件类型
export interface WSEvent {
    type: string;
    data: any;
    timestamp: number;
    eventId?: string;
}

type EventHandler = (data: any) => void;

// 全局单例, 避免多个组件各自创建连接
let globalWs: WebSocket | null = null;
let globalListeners: Map<string, Set<EventHandler>> = new Map();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
const MAX_RECONNECT_DELAY = 30000;
const HEARTBEAT_INTERVAL = 30000;
let isConnecting = false;

function getWsUrl(token: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1/ws/connect?token=${encodeURIComponent(token)}`;
}

function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
        if (globalWs?.readyState === WebSocket.OPEN) {
            globalWs.send(JSON.stringify({ type: 'ping' }));
        }
    }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

function emitToListeners(type: string, data: any) {
    const handlers = globalListeners.get(type);
    if (handlers) {
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error(`[WS] Handler error for ${type}:`, e);
            }
        });
    }
}

function connectWebSocket(token: string) {
    if (isConnecting || (globalWs && globalWs.readyState === WebSocket.OPEN)) {
        return;
    }

    isConnecting = true;
    const url = getWsUrl(token);

    try {
        globalWs = new WebSocket(url);
    } catch (e) {
        console.error('[WS] Failed to create WebSocket:', e);
        isConnecting = false;
        scheduleReconnect(token);
        return;
    }

    globalWs.onopen = () => {
        console.log('[WS] 连接已建立');
        isConnecting = false;
        reconnectAttempt = 0;
        startHeartbeat();
        emitToListeners('ws.connected', {});
    };

    globalWs.onmessage = (event) => {
        try {
            const msg: WSEvent = JSON.parse(event.data);
            const { type, data } = msg;

            // pong 心跳回复不需要分发
            if (type === 'pong') return;

            // 互踢通知
            if (type === 'sys.kick') {
                console.warn('[WS] 被踢下线:', data?.reason);
                stopHeartbeat();
                globalWs?.close();
                emitToListeners('sys.kick', data);
                return;
            }

            // 分发到所有监听器
            emitToListeners(type, data);
        } catch (e) {
            console.error('[WS] 消息解析失败:', e);
        }
    };

    globalWs.onclose = (event) => {
        console.log('[WS] 连接关闭:', event.code, event.reason);
        isConnecting = false;
        stopHeartbeat();
        emitToListeners('ws.disconnected', { code: event.code });

        // 非正常关闭/非互踢 → 自动重连
        if (event.code !== 1000) {
            scheduleReconnect(token);
        }
    };

    globalWs.onerror = (error) => {
        console.error('[WS] 连接错误:', error);
        isConnecting = false;
    };
}

function scheduleReconnect(token: string) {
    if (reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY);
    reconnectAttempt++;
    console.log(`[WS] ${delay / 1000}s 后重连 (第 ${reconnectAttempt} 次)`);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWebSocket(token);
    }, delay);
}

function disconnectWebSocket() {
    stopHeartbeat();
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (globalWs) {
        globalWs.onclose = null; // 阻止自动重连
        globalWs.close(1000);
        globalWs = null;
    }
    reconnectAttempt = 0;
    isConnecting = false;
}

/**
 * 通过 WebSocket 发送消息
 * @param type 消息类型, 如 'im.message'
 * @param data 消息数据
 * @returns 是否发送成功
 */
export function wsSend(type: string, data: any): boolean {
    if (globalWs?.readyState === WebSocket.OPEN) {
        globalWs.send(JSON.stringify({ type, data }));
        return true;
    }
    console.warn('[WS] 连接未就绪, 无法发送消息');
    return false;
}

/**
 * 注册 WS 事件监听
 */
export function wsOn(type: string, handler: EventHandler) {
    if (!globalListeners.has(type)) {
        globalListeners.set(type, new Set());
    }
    globalListeners.get(type)!.add(handler);
}

/**
 * 取消 WS 事件监听
 */
export function wsOff(type: string, handler: EventHandler) {
    globalListeners.get(type)?.delete(handler);
}

/**
 * 在组件中使用 WebSocket
 * - 自动建立/维持连接
 * - 组件卸载时不断开(全局单例)
 * - 提供便捷的 on/off/send 方法
 */
export function useWebSocket() {
    const token = useUserStore((s) => s.token);
    const connectedRef = useRef(false);

    // 建立连接
    useEffect(() => {
        if (!token) return;

        // 仅在首次或断开时连接
        if (!globalWs || globalWs.readyState === WebSocket.CLOSED) {
            connectWebSocket(token);
        }
        connectedRef.current = true;

        // 组件卸载时不断开连接 (全局单例保留)
        // 只在页面完全关闭时断开
        const handleUnload = () => disconnectWebSocket();
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [token]);

    const send = useCallback((type: string, data: any) => {
        return wsSend(type, data);
    }, []);

    const on = useCallback((type: string, handler: EventHandler) => {
        wsOn(type, handler);
    }, []);

    const off = useCallback((type: string, handler: EventHandler) => {
        wsOff(type, handler);
    }, []);

    return { send, on, off };
}
