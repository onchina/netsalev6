import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface UserState {
    token: string | null;
    user: User | null;
    isLoggedIn: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    clearUser: () => void;
}

// 用户状态管理（持久化存储）
export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isLoggedIn: false,
            login: (user, token) => set({ user, token, isLoggedIn: true }),
            logout: () => set({ user: null, token: null, isLoggedIn: false }),
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null, token: null, isLoggedIn: false }),
        }),
        {
            name: 'user-storage',
        }
    )
);
