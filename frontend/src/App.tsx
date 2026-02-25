import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import 'dayjs/locale/zh-cn';

// Ant Design 主题配置 - 简洁蓝色风格
const themeConfig = {
    token: {
        // 主色调 - 蓝色
        colorPrimary: '#1677ff',
        colorLink: '#1677ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1677ff',

        // 圆角
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,

        // 字体
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif',

        // 阴影
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.12)',
    },
    components: {
        Button: {
            borderRadius: 8,
            controlHeight: 36,
        },
        Card: {
            borderRadiusLG: 12,
            paddingLG: 20,
        },
        Input: {
            borderRadius: 8,
            controlHeight: 36,
        },
        Select: {
            borderRadius: 8,
            controlHeight: 36,
        },
        Table: {
            borderRadius: 8,
            headerBg: '#fafafa',
        },
        Tag: {
            borderRadiusSM: 4,
        },
        Menu: {
            itemBorderRadius: 8,
            subMenuItemBorderRadius: 8,
        },
    },
};

function App() {
    return (
        <ConfigProvider locale={zhCN} theme={themeConfig}>
            <RouterProvider router={router} />
        </ConfigProvider>
    );
}

export default App;
