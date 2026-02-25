/**
 * CSV 导出工具函数
 * 用于数据导出为 CSV 文件
 */

/**
 * 导出 CSV 文件
 * @param filename 文件名（不含扩展名）
 * @param headers 表头数组
 * @param rows 数据行数组
 */
export function exportToCSV(filename: string, headers: string[], rows: string[][]): void {
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * 导出带日期的 CSV 文件
 * @param filename 文件名（不含扩展名）
 * @param headers 表头数组
 * @param rows 数据行数组
 */
export function exportToCSVWithDate(filename: string, headers: string[], rows: string[][]): void {
    const date = new Date().toISOString().slice(0, 10);
    exportToCSV(`${filename}_${date}`, headers, rows);
}

/**
 * 将对象数组转换为 CSV 行
 * @param data 对象数组
 * @param keys 要导出的键名顺序
 */
export function convertToCSVRows<T extends Record<string, any>>(data: T[], keys: (keyof T)[]): string[][] {
    return data.map(item => keys.map(key => String(item[key] ?? '')));
}
