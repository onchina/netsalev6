import request from './request';

export interface ConfigItem {
    id: string;
    name: string;
    code: string;
    color?: string;
    sort: number;
    enabled: boolean;
    createdAt?: string;
    group?: string; // e.g. 'channel', 'customer_type', 'order_type', 'payment_method', 'responsibility_type'
}

export const dictionariesApi = {
    // 获取字典列表，支持按 group 过滤
    getDictionaries: (group?: string) => request.get('/dictionaries', { params: { group } }),
    createDictionary: (data: Partial<ConfigItem>) => request.post('/dictionaries', data),
    updateDictionary: (id: string, data: Partial<ConfigItem>) => request.patch(`/dictionaries/${id}`, data),
    deleteDictionary: (id: string) => request.delete(`/dictionaries/${id}`),
};
