import { create } from 'zustand';
import { dictionariesApi, ConfigItem } from '../api/dictionaries';
import request from '../api/request';

interface DictionaryState {
    channels: ConfigItem[];
    customerTypes: ConfigItem[];
    orderTypes: ConfigItem[];
    paymentMethods: ConfigItem[];
    responsibilityTypes: ConfigItem[];
    employees: any[];
    loading: boolean;
    fetchDictionaries: () => Promise<void>;
}

export const useDictionaryStore = create<DictionaryState>((set) => ({
    channels: [],
    customerTypes: [],
    orderTypes: [],
    paymentMethods: [],
    responsibilityTypes: [],
    employees: [],
    loading: false,
    fetchDictionaries: async () => {
        set({ loading: true });
        try {
            const [dictRes, empRes] = await Promise.all([
                dictionariesApi.getDictionaries(),
                request.get('/users?page_size=1000') // Fetch employees as well
            ]);

            const dictionariesMap: Record<string, ConfigItem[]> = {
                channel: [],
                customerType: [],
                orderType: [],
                paymentMethod: [],
                responsibilityType: []
            };

            const data = (dictRes as any)?.data || dictRes || [];

            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.group && dictionariesMap[item.group]) {
                        dictionariesMap[item.group].push(item);
                    }
                });
            }

            const empData = (empRes as any)?.data || empRes || [];

            set({
                channels: dictionariesMap.channel || [],
                customerTypes: dictionariesMap.customerType || [],
                orderTypes: dictionariesMap.orderType || [],
                paymentMethods: dictionariesMap.paymentMethod || [],
                responsibilityTypes: dictionariesMap.responsibilityType || [],
                employees: Array.isArray(empData) ? empData : [],
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch dictionaries:', error);
            set({ loading: false });
        }
    }
}));
