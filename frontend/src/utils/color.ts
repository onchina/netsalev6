/**
 * 颜色处理工具函数
 */
import { PRESET_COLORS } from '@/constants';

export const hexToRgba = (hex: string, alpha: number): string => {
    if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return `rgba(0, 0, 0, ${alpha})`;
    }

    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const num = parseInt(c.join(''), 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

export const getTagStyle = (color?: string): React.CSSProperties => {
    if (!color) return {};

    return {
        color: color,
        background: hexToRgba(color, 0.1),
        border: `1px solid ${hexToRgba(color, 0.2)}`,
    };
};

export { PRESET_COLORS };
