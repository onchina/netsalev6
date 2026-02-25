// 用户权限类型
export type UserRole = 'admin' | 'finance' | 'sales_manager' | 'sales';

// 用户/员工类型
export interface User {
    id: string;
    name: string;
    role: UserRole;
    roleLabel: string;
    employeeNo: string;
    email?: string;
    phone?: string;
    avatar?: string;
    // 权限列表 (新版)
    permissionList: string[];
}

// 菜单项类型
export interface MenuItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    path?: string;
}

// 客户类型
export interface Customer {
    id: string;
    name: string;
    phone: string;
    address?: string;
    height?: number;
    age?: number;
    weight?: number;
    channel?: string;
    entryDate?: string;
    ownerId?: string;
    createdAt: string;
}

// 商品类型
export interface Product {
    id: string;
    name: string;
    image?: string;
    spec: string;
    price: number;
    cost?: number;
    status: 'on' | 'off';
    stock?: number;
}

// 订单商品明细
export interface OrderItem {
    productId: string;
    productName: string;
    spec: string;
    price: number;
    quantity: number;
    subtotal: number;
}

// 订单类型
export interface Order {
    id: string;
    orderNo: string;
    customerId: string;
    customerName: string;
    orderType: string;
    paymentMethod: string;
    shipNow: boolean;
    items: OrderItem[];
    totalAmount: number;
    paidAmount: number;
    codAmount: number;
    paidRatio: number;
    remark?: string;
    commission?: number;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'shipped' | 'completed' | 'cancelled';
    createdAt: string;
    createdBy: string;
}

// 售后类型
export interface AfterSale {
    id: string;
    orderId: string;
    orderNo: string;
    customerId: string;
    customerName: string;
    type: 'refund' | 'return' | 'exchange';
    reason: string;
    images?: string[];
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    createdAt: string;
}

// 消息通知
export interface Notification {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    createdAt: string;
}

// 待办事项
export interface TodoItem {
    id: string;
    type: string;
    content: string;
    status: 'pending' | 'done';
    link?: string;
}
