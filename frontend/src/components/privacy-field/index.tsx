import React, { useState } from 'react';
import { Tooltip, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { useUserStore } from '../../stores';
import styles from './privacy-field.module.css';

interface PrivacyFieldProps {
    /** 原始值 */
    value: string;
    /** 字段类型，用于显示不同的掩码格式 */
    type?: 'phone' | 'address' | 'default';
    /** 是否允许点击查看（需要权限） */
    allowReveal?: boolean;
}

/**
 * 隐私字段组件
 * 根据用户角色判断是否显示敏感数据
 * - 财务部、超级管理员角色：直接显示完整数据
 * - 其他角色：显示脱敏数据，可选择性允许临时查看
 */
const PrivacyField: React.FC<PrivacyFieldProps> = ({
    value,
    type = 'default',
    allowReveal = false,
}) => {
    const { user } = useUserStore();
    const [revealed, setRevealed] = useState(false);

    // 可查看敏感数据的角色列表
    const privilegedRoles = ['财务部', '财务', '超级管理员', '管理员'];
    const canView = privilegedRoles.some(role =>
        user?.role?.includes(role)
    );

    // 如果有权限，直接显示完整数据
    if (canView) {
        return <span>{value}</span>;
    }

    // 如果已点击显示，临时展示完整数据
    if (revealed && allowReveal) {
        return (
            <span className={styles.revealedField}>
                {value}
                <Button
                    type="text"
                    size="small"
                    icon={<FontAwesomeIcon icon={faEyeSlash} />}
                    onClick={() => setRevealed(false)}
                    className={styles.revealBtn}
                />
            </span>
        );
    }

    // 根据类型生成脱敏显示
    const getMaskedValue = () => {
        if (!value) return '-';

        switch (type) {
            case 'phone':
                // 手机号脱敏：138****1234
                if (value.length >= 11) {
                    return `${value.slice(0, 3)}****${value.slice(-4)}`;
                }
                return '***';
            case 'address':
                // 地址脱敏：只显示前几个字
                if (value.length > 6) {
                    return `${value.slice(0, 6)}***`;
                }
                return '***';
            default:
                return '***隐藏***';
        }
    };

    const maskedValue = getMaskedValue();

    // 显示脱敏数据
    return (
        <span className={styles.maskedField}>
            <Tooltip title={allowReveal ? '点击查看完整信息' : '敏感信息已隐藏'}>
                <span className={styles.maskedText}>{maskedValue}</span>
            </Tooltip>
            {allowReveal && (
                <Button
                    type="text"
                    size="small"
                    icon={<FontAwesomeIcon icon={faEye} />}
                    onClick={() => setRevealed(true)}
                    className={styles.revealBtn}
                />
            )}
        </span>
    );
};

export default PrivacyField;
