/**
 * 将 Hex 颜色转换为 Rgba 格式
 * @param hex 十六进制颜色值 (例如: #FF0000)
 * @param alpha 透明度 (0-1)
 * @returns rgba 字符串 (例如: rgba(255, 0, 0, 0.5))
 */
export const hexToRgba = (hex: string, alpha: number): string => {
    // 简单的 hex 校验
    if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return `rgba(0, 0, 0, ${alpha})`; // 默认返回黑色
    }

    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const num = parseInt(c.join(''), 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

/**
 * 根据 Hex 主色生成带有浅色背景的样式对象（主要用于进线渠道的标签展示）
 * @param color 主色调 Hex 值
 * @returns React.CSSProperties
 * 包含:
 * - color: 主色 (100% 不透明)
 * - background: 主色 (10% 透明度)
 * - border: 主色 (20% 透明度) 为 1px 实线
 */
export const getTagStyle = (color?: string): React.CSSProperties => {
    if (!color) return {};

    return {
        color: color,
        background: hexToRgba(color, 0.1),
        border: `1px solid ${hexToRgba(color, 0.2)}`,
    };

};

// 预设的24种颜色选择
export const PRESET_COLORS = [
    '#F5222D', // 薄暮 (Dust Red)
    '#FA541C', // 火山 (Volcano)
    '#FA8C16', // 日暮 (Sunset Orange)
    '#FAAD14', // 金盏花 (Calendula Gold)
    '#FADB14', // 日出 (Sunrise Yellow)
    '#A0D911', // 青柠 (Lime)
    '#52C41A', // 极光绿 (Polar Green)
    '#13C2C2', // 明青 (Cyan)
    '#1890FF', // 拂晓蓝 (Daybreak Blue)
    '#2F54EB', // 极客蓝 (Geek Blue)
    '#722ED1', // 酱紫 (Golden Purple)
    '#EB2F96', // 法式洋红 (Magenta)
    '#ff4d4f', // 红色
    '#ffec3d', // 黄色
    '#73d13d', // 绿色
    '#40a9ff', // 蓝色
    '#9254de', // 紫色
    '#f759ab', // 粉色
    '#000000', // 黑色
    '#8c8c8c', // 灰色
    '#595959', // 深灰
    '#1f1f1f', // 暗黑
    '#d4380d', // 橘红
    '#d4b106', // 暗黄
];
