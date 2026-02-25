import { create } from 'zustand';

interface AppState {
    collapsed: boolean;
    toggleCollapsed: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

// 应用全局状态管理
export const useAppStore = create<AppState>((set) => ({
    collapsed: false,
    toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    setCollapsed: (collapsed) => set({ collapsed }),
}));
