import request from './request';

// ==========================
// 组织架构与部门管理 (Departments)
// ==========================

export interface Department {
    id: string;
    code: string;
    name: string;
    manager?: string;
    memberCount: number;
    showInPerformanceV1: boolean;
    showInPerformanceV2: boolean;
    showInRanking: boolean;
    showInAnalytics: boolean;
    createdAt?: string;
}

export const adminApi = {
    // 部门管理
    getDepartments: () => request.get('/admin/departments'),
    createDepartment: (data: Partial<Department>) => request.post('/admin/departments', data),
    updateDepartment: (id: string, data: Partial<Department>) => request.put(`/admin/departments/${id}`, data),
    deleteDepartment: (id: string) => request.delete(`/admin/departments/${id}`),

    // 角色管理
    getRoles: () => request.get('/admin/roles'),
    updateRole: (id: string, data: { name: string; permissions: string[] }) => request.put(`/admin/roles/${id}`, data),

    // 物流配置
    getLogistics: () => request.get('/admin/logistics'),
    updateLogisticsStatus: (id: string, status: boolean) => request.put(`/admin/logistics/${id}/status?status=${status}`),

    // IP 白名单
    getIpWhitelist: () => request.get('/admin/ip-whitelist'),
    createIpWhitelist: (data: { ip: string; remark?: string; status?: boolean }) => request.post('/admin/ip-whitelist', data),
    updateIpWhitelist: (id: string, data: { ip?: string; remark?: string; status?: boolean }) => request.put(`/admin/ip-whitelist/${id}`, data),
    deleteIpWhitelist: (id: string) => request.delete(`/admin/ip-whitelist/${id}`),
    updateIpWhitelistStatus: (id: string, status: boolean) => request.put(`/admin/ip-whitelist/${id}/status?status=${status}`),

    // 敏感词管理
    getSensitiveWords: () => request.get('/admin/sensitive-words'),
    addSensitiveWord: (data: { word: string; type: string; level: string }) => request.post('/admin/sensitive-words', data),
    deleteSensitiveWord: (id: string) => request.delete(`/admin/sensitive-words/${id}`)
};
