import axios from 'axios';
import { useUserStore } from '../stores';
import { message } from 'antd';

const request = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
});

request.interceptors.request.use((config) => {
    const token = useUserStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

request.interceptors.response.use(
    (response) => {
        const { code, data, message: msg, meta } = response.data;
        if (code === 200) {
            return meta ? { data, meta } : data;
        } else {
            message.error(msg || '系统错误');
            return Promise.reject(new Error(msg || 'Error'));
        }
    },
    (error) => {
        if (error.response?.status === 401) {
            useUserStore.getState().logout();
            window.location.href = '/login';
            message.error('登录失效，请重新登录');
        } else if (error.response?.data?.detail) {
            message.error(error.response.data.detail);
        } else {
            message.error(error.message || '网络异常');
        }
        return Promise.reject(error);
    }
);

export default request;
