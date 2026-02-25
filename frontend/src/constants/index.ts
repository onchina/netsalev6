/**
 * 公共常量汇总
 * 所有模块共享的常量定义
 */
import { SelectProps } from 'antd';

export interface LabelItem {
    label: string;
    value: string;
}
/**
export const CHANNEL_OPTIONS: SelectProps['options'] = [
    { value: 'douyin', label: '抖音' },
    { value: 'kuaishou', label: '快手' },
    { value: 'wechat', label: '微信' },
    { value: 'taobao', label: '淘宝' },
    { value: 'jd', label: '京东' },
    { value: 'offline', label: '线下' },
    { value: 'other', label: '其他' },
];

export const CUSTOMER_TYPE_OPTIONS: SelectProps['options'] = [
    { value: 'new', label: '新2客户' },
    { value: 'old', label: '老3客户' },
    { value: 'vip', label: 'VIP客户' },
    { value: 'repurchase', label: '复购客户' },
];

export const STATUS_CONFIG: Record<string, { color: string }> = {
    urgent: { color: 'error' },
    pending: { color: 'processing' },
    remind: { color: 'warning' },
};

export const ORDER_STATUS_OPTIONS: SelectProps['options'] = [
    { value: 'pending', label: '待审核' },
    { value: 'shipped', label: '待发货' },
    { value: 'signed', label: '待签收' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
    { value: 'refund', label: '退款中' },
    { value: 'refunded', label: '已退款' },
];

export const ORDER_STATUS_COLOR_MAP: Record<string, string> = {
    pending: 'processing',
    shipped: 'warning',
    signed: 'cyan',
    completed: 'success',
    cancelled: 'default',
    refund: 'error',
    refunded: 'default',
};
 */
export const PRESET_COLORS = [
    '#F5222D', '#FA541C', '#FA8C16', '#FAAD14', '#FADB14',
    '#A0D911', '#52C41A', '#13C2C2', '#1890FF', '#2F54EB',
    '#722ED1', '#EB2F96', '#ff4d4f', '#ffec3d', '#73d13d',
    '#40a9ff', '#9254de', '#f759ab', '#000000', '#8c8c8c',
    '#595959', '#1f1f1f', '#d4380d', '#d4b106',
];
