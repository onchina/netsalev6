/**
 * 排序工具函数
 * 用于列表中元素的上移、下移、置顶、置底操作
 */

export interface SortableItem {
    id: string;
    sort: number;
    [key: string]: any;
}

/**
 * 上移元素
 * @param list 数据列表
 * @param targetId 要移动的元素 ID
 * @param sortKey 排序字段名
 * @returns 排序后的新列表
 */
export function moveItemUp<T extends SortableItem>(list: T[], targetId: string): T[] {
    const sortedData = [...list].sort((a, b) => a.sort - b.sort);
    const index = sortedData.findIndex((item) => item.id === targetId);
    if (index <= 0) return list;

    const currentItem = sortedData[index];
    const prevItem = sortedData[index - 1];

    return list.map((item) => {
        if (item.id === targetId) return { ...item, sort: prevItem.sort };
        if (item.id === prevItem.id) return { ...item, sort: currentItem.sort };
        return item;
    }).sort((a, b) => a.sort - b.sort);
}

/**
 * 下移元素
 * @param list 数据列表
 * @param targetId 要移动的元素 ID
 * @returns 排序后的新列表
 */
export function moveItemDown<T extends SortableItem>(list: T[], targetId: string): T[] {
    const sortedData = [...list].sort((a, b) => a.sort - b.sort);
    const index = sortedData.findIndex((item) => item.id === targetId);
    if (index === -1 || index === sortedData.length - 1) return list;

    const currentItem = sortedData[index];
    const nextItem = sortedData[index + 1];

    return list.map((item) => {
        if (item.id === targetId) return { ...item, sort: nextItem.sort };
        if (item.id === nextItem.id) return { ...item, sort: currentItem.sort };
        return item;
    }).sort((a, b) => a.sort - b.sort);
}

/**
 * 置顶元素
 * @param list 数据列表
 * @param targetId 要置顶的元素 ID
 * @returns 排序后的新列表
 */
export function moveToTop<T extends SortableItem>(list: T[], targetId: string): T[] {
    const sortedData = [...list].sort((a, b) => a.sort - b.sort);
    const currentItem = sortedData.find((item) => item.id === targetId);
    if (!currentItem || sortedData[0].id === targetId) return list;

    const minSort = sortedData[0].sort;
    const newSort = minSort - 1;

    return list.map((item) => {
        if (item.id === targetId) return { ...item, sort: newSort };
        return item;
    }).sort((a, b) => a.sort - b.sort);
}

/**
 * 置底元素
 * @param list 数据列表
 * @param targetId 要置底的元素 ID
 * @returns 排序后的新列表
 */
export function moveToBottom<T extends SortableItem>(list: T[], targetId: string): T[] {
    const sortedData = [...list].sort((a, b) => a.sort - b.sort);
    const currentItem = sortedData.find((item) => item.id === targetId);
    if (!currentItem || sortedData[sortedData.length - 1].id === targetId) return list;

    const maxSort = sortedData[sortedData.length - 1].sort;
    const newSort = maxSort + 1;

    return list.map((item) => {
        if (item.id === targetId) return { ...item, sort: newSort };
        return item;
    }).sort((a, b) => a.sort - b.sort);
}
