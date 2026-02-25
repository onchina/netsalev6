import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';

// 页面懒加载
import Workbench from './pages/workbench';
import PerformanceScreenV1 from './pages/data-screen/performance/v1';
import PerformanceScreenV2 from './pages/data-screen/performance/v2';
import RankingScreen from './pages/data-screen/ranking';
import { CustomerList } from './pages/mall/customer';
import { OrderCreate, OrderPending, OrderShipped, OrderModify, OrderSigned, OrderAudit, OrderAfterSale } from './pages/mall/order';
import { ProductManage, StockManage, ReturnStock, StockRecords } from './pages/mall/warehouse';
import Chat from './pages/chat';
import Analytics from './pages/analytics';
import Report from './pages/report';
import Settings from './pages/settings';
import SystemSettings from './pages/system-settings';
import { ChannelManage, LogList } from './pages/operations';
import Login from './pages/login';
import MessageCenter from './pages/message-center';

export const router = createBrowserRouter([
    // 登录页面（独立路由）
    {
        path: '/login',
        element: <Login />,
    },
    // 作战大屏 v1.0
    {
        path: '/data-screen/performance/v1',
        element: <PerformanceScreenV1 />,
    },
    // 作战大屏 v2.0
    {
        path: '/data-screen/performance/v2',
        element: <PerformanceScreenV2 />,
    },
    // 为了兼容旧路由，默认指向 v2
    {
        path: '/data-screen/performance',
        element: <Navigate to="/data-screen/performance/v2" replace />,
    },
    // 排行榜大屏（独立页面，无导航栏和侧边栏）
    {
        path: '/data-screen/ranking',
        element: <RankingScreen />,
    },
    // 即时通讯（独立页面，新窗口打开，无导航栏和侧边栏）
    {
        path: '/chat',
        element: <Chat />,
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            // 首页/工作台
            {
                index: true,
                element: <Workbench />,
            },
            // 消息中心
            {
                path: 'message-center',
                element: <MessageCenter />,
            },
            // 路远商城
            {
                path: 'mall',
                children: [
                    // 客户管理
                    {
                        path: 'customer',
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/mall/customer/list" replace />,
                            },
                            {
                                path: 'list',
                                element: <CustomerList />,
                            },
                        ],
                    },
                    // 订单管理
                    {
                        index: true,
                        element: <Navigate to="/mall/order/pending" replace />,
                    },
                    {
                        path: 'order',
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/mall/order/pending" replace />,
                            },
                            {
                                path: 'create',
                                element: <OrderCreate />,
                            },
                            {
                                path: 'pending',
                                element: <OrderPending />,
                            },
                            {
                                path: 'shipped',
                                element: <OrderShipped />,
                            },
                            {
                                path: 'modify',
                                element: <OrderModify />,
                            },
                            {
                                path: 'signed',
                                element: <OrderSigned />,
                            },
                            {
                                path: 'audit',
                                element: <OrderAudit />,
                            },
                            {
                                path: 'aftersale',
                                element: <OrderAfterSale />,
                            },
                        ],
                    },
                    // 仓储管理
                    {
                        path: 'warehouse',
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/mall/warehouse/product" replace />,
                            },
                            {
                                path: 'product',
                                element: <ProductManage />,
                            },
                            {
                                path: 'stock',
                                element: <StockManage />,
                            },
                            {
                                path: 'return-stock',
                                element: <ReturnStock />,
                            },
                            {
                                path: 'stock-records',
                                element: <StockRecords />,
                            },
                        ],
                    },
                ],
            },




            // 数据分析
            {
                path: 'analytics',
                element: <Analytics />,
            },
            // 路远日报
            {
                path: 'report',
                element: <Report />,
            },
            // 后台设置
            {
                path: 'settings',
                element: <Settings />,
            },
            // 系统设置
            {
                path: 'system-settings',
                element: <SystemSettings />,
            },
            // 运营管理
            {
                path: 'operations',
                children: [
                    {
                        index: true,
                        element: <Navigate to="/operations/channel" replace />,
                    },
                    {
                        path: 'channel',
                        element: <ChannelManage />,
                    },
                    {
                        path: 'log-list',
                        element: <LogList />,
                    },
                ],
            },
        ],
    },
]);

