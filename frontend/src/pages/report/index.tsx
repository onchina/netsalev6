import React, { useState, useCallback, useRef } from 'react';
import { Typography, Button, Upload, Tag, message, Input, Space, Tabs, Popconfirm, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleCheck,
    faClock,
    faCompress,
    faDownload,
    faExpand,
    faFileExcel,
    faFileLines,
    faFloppyDisk,
    faPaperPlane,
    faPenToSquare,
    faPlus,
    faTrash,
    faUpload,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-regular-svg-icons';
import styles from './report.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============ 类型定义 ============
interface SheetData {
    name: string;
    headers: string[];
    rows: string[][];
}

interface Attachment {
    id: string;
    fileName: string;
    fileSize: string;
    uploadTime: string;
    sheets: SheetData[];
}

interface DailyReport {
    id: string;
    date: string;
    status: 'draft' | 'submitted';
    todayWork: string;
    tomorrowPlan: string;
    problems: string;
    attachments: Attachment[];
}

// ============ 演示用电子表格数据 ============
const demoSheets: Attachment[] = [
    {
        id: 'att1',
        fileName: '2月销售数据汇总.xlsx',
        fileSize: '24.5 KB',
        uploadTime: '2026-02-13 14:30',
        sheets: [
            {
                name: '销售明细',
                headers: ['日期', '客户名称', '产品', '数量', '单价(元)', '金额(元)', '状态', '备注'],
                rows: [
                    ['2026-02-01', '张三科技有限公司', 'A型号设备', '5', '12800', '64000', '已签约', '首批合作'],
                    ['2026-02-03', '李四贸易集团', 'B型号配件', '100', '280', '28000', '已签约', ''],
                    ['2026-02-05', '王五实业', 'C型号套装', '2', '45000', '90000', '洽谈中', '预计下周签约'],
                    ['2026-02-07', '赵六电子', 'A型号设备', '3', '12800', '38400', '已签约', '老客户复购'],
                    ['2026-02-10', '钱七制造', 'D型号组件', '50', '560', '28000', '待确认', '样品试用中'],
                    ['2026-02-12', '孙八商贸', 'B型号配件', '200', '260', '52000', '已签约', '量大优惠'],
                    ['2026-02-13', '周九工业', 'C型号套装', '1', '45000', '45000', '洽谈中', '初次接触'],
                ],
            },
            {
                name: '客户统计',
                headers: ['客户名称', '联系人', '电话', '累计订单', '累计金额(元)', '最近下单日', '客户等级'],
                rows: [
                    ['张三科技有限公司', '张总', '138****1001', '3', '192000', '2026-02-01', 'A级'],
                    ['李四贸易集团', '李经理', '139****2002', '5', '140000', '2026-02-03', 'A级'],
                    ['王五实业', '王工', '137****3003', '1', '90000', '2026-02-05', 'B级'],
                    ['赵六电子', '赵总', '136****4004', '8', '307200', '2026-02-07', 'S级'],
                    ['钱七制造', '钱主管', '135****5005', '2', '56000', '2026-02-10', 'C级'],
                ],
            },
        ],
    },
    {
        id: 'att2',
        fileName: '产品库存盘点表.xlsx',
        fileSize: '18.2 KB',
        uploadTime: '2026-02-13 15:10',
        sheets: [
            {
                name: '库存明细',
                headers: ['产品编号', '产品名称', '规格型号', '当前库存', '安全库存', '状态', '仓库位置'],
                rows: [
                    ['P001', 'A型号设备', 'A-2026', '15', '10', '正常', 'A区-01'],
                    ['P002', 'B型号配件', 'B-STD', '320', '200', '正常', 'B区-03'],
                    ['P003', 'C型号套装', 'C-PRO', '3', '5', '库存不足', 'A区-02'],
                    ['P004', 'D型号组件', 'D-MINI', '85', '100', '库存不足', 'C区-01'],
                    ['P005', 'E型号耗材', 'E-PACK', '500', '300', '正常', 'D区-05'],
                ],
            },
        ],
    },
];

// ============ 演示日报 ============
const createDemoReports = (): DailyReport[] => [
    {
        id: 'rpt1',
        date: '2026-02-13',
        status: 'draft',
        todayWork: '1. 回访客户张总，沟通新产品合作意向，获得初步签约意向\n2. 处理5笔新订单，全部完成发货和物流录入\n3. 协助仓库盘点库存，发现C型号和D型号库存不足\n4. 撰写春季推广文案3篇',
        tomorrowPlan: '1. 跟进张总合同签订\n2. 处理补货申请\n3. 联系新客户周九工业',
        problems: 'C型号套装库存紧张（仅剩3台），建议尽快补货',
        attachments: [...demoSheets],
    },
    {
        id: 'rpt2',
        date: '2026-02-12',
        status: 'submitted',
        todayWork: '1. 电话回访老客户李总，客户满意度较高\n2. 处理退货申请2笔，退款已到账\n3. 参加ERP系统新功能培训',
        tomorrowPlan: '1. 回访张总\n2. 处理积压订单',
        problems: '',
        attachments: [],
    },
    {
        id: 'rpt3',
        date: '2026-02-11',
        status: 'submitted',
        todayWork: '1. 拍摄新品展示短视频2条\n2. 拜访新客户王经理，演示产品',
        tomorrowPlan: '1. 发送报价单给王经理\n2. 处理退货',
        problems: '演示设备电池需要更换',
        attachments: [],
    },
];

// ============ 解析上传的 Excel 文件 ============
const parseExcelFile = async (file: File): Promise<SheetData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // 动态导入 xlsx 库
                const XLSX = await import('xlsx');
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheets: SheetData[] = workbook.SheetNames.map(name => {
                    const sheet = workbook.Sheets[name];
                    const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
                    const headers = (jsonData[0] || []).map(h => String(h || ''));
                    const rows = jsonData.slice(1).map(row =>
                        headers.map((_, i) => String((row as string[])[i] ?? ''))
                    );
                    return { name, headers, rows };
                });
                resolve(sheets);
            } catch {
                reject(new Error('文件解析失败，请确认为有效的Excel文件'));
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
    });
};

// ============ Excel 预览器组件 ============
interface SpreadsheetViewerProps {
    attachment: Attachment;
    onClose: () => void;
    onUpdate: (sheets: SheetData[]) => void;
    editable?: boolean;
}

const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ attachment, onClose, onUpdate, editable = false }) => {
    const [activeSheet, setActiveSheet] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [sheets, setSheets] = useState<SheetData[]>(attachment.sheets);
    const editInputRef = useRef<HTMLInputElement>(null);

    const currentSheet = sheets[activeSheet];

    const handleCellClick = (rowIdx: number, colIdx: number) => {
        if (editMode && editable) {
            setEditingCell({ row: rowIdx, col: colIdx });
            setTimeout(() => editInputRef.current?.focus(), 0);
        }
    };

    const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
        const newSheets = sheets.map((s, si) => {
            if (si !== activeSheet) return s;
            const newRows = s.rows.map((r, ri) => {
                if (ri !== rowIdx) return r;
                const newRow = [...r];
                newRow[colIdx] = value;
                return newRow;
            });
            return { ...s, rows: newRows };
        });
        setSheets(newSheets);
    };

    const handleCellBlur = () => {
        setEditingCell(null);
        onUpdate(sheets);
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setEditingCell(null);
            onUpdate(sheets);
            // 跳到下一行
            if (rowIdx < currentSheet.rows.length - 1) {
                setEditingCell({ row: rowIdx + 1, col: colIdx });
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            setEditingCell(null);
            onUpdate(sheets);
            // 跳到下一列
            if (colIdx < currentSheet.headers.length - 1) {
                setEditingCell({ row: rowIdx, col: colIdx + 1 });
            } else if (rowIdx < currentSheet.rows.length - 1) {
                setEditingCell({ row: rowIdx + 1, col: 0 });
            }
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const addRow = () => {
        const newSheets = sheets.map((s, si) => {
            if (si !== activeSheet) return s;
            return { ...s, rows: [...s.rows, new Array(s.headers.length).fill('')] };
        });
        setSheets(newSheets);
    };

    const deleteRow = (rowIdx: number) => {
        const newSheets = sheets.map((s, si) => {
            if (si !== activeSheet) return s;
            return { ...s, rows: s.rows.filter((_, i) => i !== rowIdx) };
        });
        setSheets(newSheets);
        onUpdate(newSheets);
    };

    const handleExport = async () => {
        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            sheets.forEach(s => {
                const wsData = [s.headers, ...s.rows];
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                XLSX.utils.book_append_sheet(wb, ws, s.name);
            });
            XLSX.writeFile(wb, attachment.fileName);
            message.success('导出成功');
        } catch {
            message.error('导出失败，请确认 xlsx 库已安装');
        }
    };

    const toggleFullscreen = () => setIsFullscreen(prev => !prev);

    const sheetTabs = sheets.map((s, i) => ({
        key: String(i),
        label: s.name,
    }));

    return (
        <div className={`${styles.viewerOverlay} ${isFullscreen ? styles.viewerFullscreen : ''}`}>
            <div className={styles.viewerPanel}>
                {/* 查看器头部 */}
                <div className={styles.viewerHeader}>
                    <div className={styles.viewerHeaderLeft}>
                        <FontAwesomeIcon icon={faFileExcel} className={styles.viewerFileIcon} />
                        <div>
                            <div className={styles.viewerFileName}>{attachment.fileName}</div>
                            <div className={styles.viewerFileMeta}>
                                {attachment.fileSize} · {currentSheet?.rows.length || 0} 行 × {currentSheet?.headers.length || 0} 列
                            </div>
                        </div>
                    </div>
                    <Space>
                        {editable && (
                            <Button
                                size="small"
                                type={editMode ? 'primary' : 'default'}
                                icon={editMode ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faPenToSquare} />}
                                onClick={() => { setEditMode(prev => !prev); setEditingCell(null); }}
                            >
                                {editMode ? '完成编辑' : '编辑表格'}
                            </Button>
                        )}
                        <Button size="small" icon={<FontAwesomeIcon icon={faDownload} />} onClick={handleExport}>导出</Button>
                        <Button
                            size="small"
                            icon={isFullscreen ? <FontAwesomeIcon icon={faCompress} /> : <FontAwesomeIcon icon={faExpand} />}
                            onClick={toggleFullscreen}
                        />
                        <Button size="small" icon={<FontAwesomeIcon icon={faXmark} />} onClick={onClose} />
                    </Space>
                </div>

                {/* Sheet 标签页 */}
                {sheets.length > 1 && (
                    <Tabs
                        activeKey={String(activeSheet)}
                        onChange={(key) => { setActiveSheet(Number(key)); setEditingCell(null); }}
                        items={sheetTabs}
                        size="small"
                        className={styles.sheetTabs}
                    />
                )}

                {/* 表格区域 */}
                <div className={styles.viewerBody}>
                    {currentSheet ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.excelTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.rowNumHeader}></th>
                                        {currentSheet.headers.map((h, i) => (
                                            <th key={i}>{h}</th>
                                        ))}
                                        {editMode && <th className={styles.actionHeader}>操作</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSheet.rows.map((row, ri) => (
                                        <tr key={ri} className={styles.excelRow}>
                                            <td className={styles.rowNum}>{ri + 1}</td>
                                            {row.map((cell, ci) => {
                                                const isEditing = editingCell?.row === ri && editingCell?.col === ci;
                                                return (
                                                    <td
                                                        key={ci}
                                                        className={`${styles.excelCell} ${isEditing ? styles.cellEditing : ''} ${editMode ? styles.cellClickable : ''}`}
                                                        onClick={() => handleCellClick(ri, ci)}
                                                    >
                                                        {isEditing ? (
                                                            <input
                                                                ref={editInputRef}
                                                                className={styles.cellInput}
                                                                value={cell}
                                                                onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                                                                onBlur={handleCellBlur}
                                                                onKeyDown={(e) => handleKeyDown(e, ri, ci)}
                                                            />
                                                        ) : (
                                                            <span className={styles.cellContent}>{cell}</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {editMode && (
                                                <td className={styles.rowAction}>
                                                    <Button type="text" danger size="small" icon={<FontAwesomeIcon icon={faTrash} />}
                                                        onClick={() => deleteRow(ri)} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {editMode && (
                                <button className={styles.addRowBtn} onClick={addRow}>
                                    <FontAwesomeIcon icon={faPlus} /> 添加行
                                </button>
                            )}
                        </div>
                    ) : (
                        <Empty description="暂无数据" />
                    )}
                </div>

                {/* 底部状态栏 */}
                <div className={styles.viewerFooter}>
                    <span>共 {sheets.length} 个工作表</span>
                    <span>当前：{currentSheet?.name} | {currentSheet?.rows.length} 行数据</span>
                    {editMode && <Tag color="blue">编辑模式 — 点击单元格编辑，Enter 下一行，Tab 下一列</Tag>}
                </div>
            </div>
        </div>
    );
};

// ============ 主组件 ============
const Report: React.FC = () => {
    const [reports, setReports] = useState<DailyReport[]>(createDemoReports);
    const [selectedReportId, setSelectedReportId] = useState<string>('rpt1');
    const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);

    const currentReport = reports.find(r => r.id === selectedReportId);
    const isEditable = currentReport?.status !== 'submitted';

    // 更新日报文本字段
    const updateField = useCallback((field: 'todayWork' | 'tomorrowPlan' | 'problems', value: string) => {
        setReports(prev => prev.map(r =>
            r.id === selectedReportId ? { ...r, [field]: value } : r
        ));
    }, [selectedReportId]);

    // 上传 Excel 文件
    const handleUpload = useCallback(async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const allowed = ['xlsx', 'xls', 'et', 'csv'];
        if (!ext || !allowed.includes(ext)) {
            message.error('仅支持 .xlsx .xls .et .csv 格式的电子表格文件');
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            message.error('文件大小不能超过 10MB');
            return false;
        }
        try {
            const sheets = await parseExcelFile(file);
            const attachment: Attachment = {
                id: `att_${Date.now()}`,
                fileName: file.name,
                fileSize: file.size < 1024 ? `${file.size} B`
                    : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB`
                        : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                uploadTime: new Date().toLocaleString('zh-CN'),
                sheets,
            };
            setReports(prev => prev.map(r =>
                r.id === selectedReportId ? { ...r, attachments: [...r.attachments, attachment] } : r
            ));
            message.success(`${file.name} 上传成功，共${sheets.length}个工作表`);
        } catch (err: any) {
            message.error(err.message || '文件解析失败');
        }
        return false;
    }, [selectedReportId]);

    // 删除附件
    const removeAttachment = useCallback((attId: string) => {
        setReports(prev => prev.map(r =>
            r.id === selectedReportId
                ? { ...r, attachments: r.attachments.filter(a => a.id !== attId) }
                : r
        ));
        if (viewingAttachment?.id === attId) setViewingAttachment(null);
        message.success('附件已删除');
    }, [selectedReportId, viewingAttachment]);

    // 更新附件表格数据
    const handleUpdateSheets = useCallback((attId: string, sheets: SheetData[]) => {
        setReports(prev => prev.map(r =>
            r.id === selectedReportId
                ? { ...r, attachments: r.attachments.map(a => a.id === attId ? { ...a, sheets } : a) }
                : r
        ));
        setViewingAttachment(prev => prev?.id === attId ? { ...prev, sheets } : prev);
    }, [selectedReportId]);

    // 提交日报
    const submitReport = useCallback(() => {
        if (!currentReport?.todayWork.trim()) {
            message.warning('请填写今日工作内容');
            return;
        }
        setReports(prev => prev.map(r =>
            r.id === selectedReportId ? { ...r, status: 'submitted' as const } : r
        ));
        message.success('日报已提交');
    }, [selectedReportId, currentReport]);

    // 保存草稿
    const saveDraft = useCallback(() => {
        message.success('草稿已保存');
    }, []);

    // 新建日报
    const createNew = useCallback(() => {
        const newId = `rpt_${Date.now()}`;
        const today = new Date().toISOString().slice(0, 10);
        if (reports.some(r => r.date === today)) {
            const existing = reports.find(r => r.date === today);
            if (existing) setSelectedReportId(existing.id);
            message.info('今日日报已存在');
            return;
        }
        setReports(prev => [{
            id: newId,
            date: today,
            status: 'draft' as const,
            todayWork: '',
            tomorrowPlan: '',
            problems: '',
            attachments: [],
        }, ...prev]);
        setSelectedReportId(newId);
        message.success('已创建今日日报');
    }, [reports]);

    return (
        <div className={styles.container}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <FontAwesomeIcon icon={faFileLines} className={styles.headerIcon} />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>路远日报</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>支持上传和在线查看 Excel / WPS 电子表格附件</Text>
                    </div>
                </div>
                <Button icon={<FontAwesomeIcon icon={faPlus} />} type="primary" onClick={createNew}>新建今日日报</Button>
            </div>

            <div className={styles.mainLayout}>
                {/* 左侧日报列表 */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>日报列表</div>
                    <div className={styles.reportList}>
                        {reports.map(r => (
                            <div
                                key={r.id}
                                className={`${styles.reportItem} ${r.id === selectedReportId ? styles.reportItemActive : ''}`}
                                onClick={() => { setSelectedReportId(r.id); setViewingAttachment(null); }}
                            >
                                <div className={styles.reportItemTop}>
                                    <span className={styles.reportDate}>{r.date}</span>
                                    {r.status === 'submitted' ? (
                                        <Tag icon={<FontAwesomeIcon icon={faCircleCheck} />} color="success" style={{ margin: 0, fontSize: 11 }}>已提交</Tag>
                                    ) : (
                                        <Tag icon={<FontAwesomeIcon icon={faClock} />} color="warning" style={{ margin: 0, fontSize: 11 }}>草稿</Tag>
                                    )}
                                </div>
                                <div className={styles.reportPreview}>
                                    {r.todayWork.split('\n')[0]?.slice(0, 30) || '暂无内容'}
                                </div>
                                {r.attachments.length > 0 && (
                                    <div className={styles.reportAttCount}>
                                        <FontAwesomeIcon icon={faFileExcel} /> {r.attachments.length} 个附件
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右侧内容 */}
                <div className={styles.contentArea}>
                    {currentReport ? (
                        <>
                            {/* 工具栏 */}
                            <div className={styles.toolbar}>
                                <span className={styles.toolbarTitle}>
                                    {currentReport.date} 工作日报
                                    {currentReport.status === 'submitted' ? (
                                        <Tag icon={<FontAwesomeIcon icon={faCircleCheck} />} color="success" style={{ marginLeft: 8 }}>已提交</Tag>
                                    ) : (
                                        <Tag icon={<FontAwesomeIcon icon={faClock} />} color="warning" style={{ marginLeft: 8 }}>草稿</Tag>
                                    )}
                                </span>
                                <Space>
                                    {isEditable ? (
                                        <>
                                            <Button size="small" icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={saveDraft}>保存草稿</Button>
                                            <Popconfirm title="确认提交日报？" onConfirm={submitReport}>
                                                <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faPaperPlane} />}>提交日报</Button>
                                            </Popconfirm>
                                        </>
                                    ) : (
                                        <Tag color="default">已提交，仅可查看</Tag>
                                    )}
                                </Space>
                            </div>

                            {/* 日报表单 */}
                            <div className={styles.formArea}>
                                <div className={styles.formSection}>
                                    <label className={styles.formLabel}>
                                        <span className={styles.required}>*</span> 今日工作内容
                                    </label>
                                    {isEditable ? (
                                        <TextArea
                                            value={currentReport.todayWork}
                                            onChange={(e) => updateField('todayWork', e.target.value)}
                                            rows={5}
                                            placeholder="请详细描述今日完成的工作内容，每项一行..."
                                            className={styles.formTextarea}
                                        />
                                    ) : (
                                        <div className={styles.formReadonly}>{currentReport.todayWork}</div>
                                    )}
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formSection}>
                                        <label className={styles.formLabel}>📋 明日工作计划</label>
                                        {isEditable ? (
                                            <TextArea
                                                value={currentReport.tomorrowPlan}
                                                onChange={(e) => updateField('tomorrowPlan', e.target.value)}
                                                rows={3}
                                                placeholder="请填写明日计划..."
                                                className={styles.formTextarea}
                                            />
                                        ) : (
                                            <div className={styles.formReadonly}>{currentReport.tomorrowPlan || '暂无'}</div>
                                        )}
                                    </div>
                                    <div className={styles.formSection}>
                                        <label className={styles.formLabel}>⚠️ 问题与反馈</label>
                                        {isEditable ? (
                                            <TextArea
                                                value={currentReport.problems}
                                                onChange={(e) => updateField('problems', e.target.value)}
                                                rows={3}
                                                placeholder="遇到的问题或需要反馈的事项（选填）..."
                                                className={styles.formTextarea}
                                            />
                                        ) : (
                                            <div className={styles.formReadonly}>{currentReport.problems || '暂无'}</div>
                                        )}
                                    </div>
                                </div>

                                {/* 附件区域 */}
                                <div className={styles.attachSection}>
                                    <div className={styles.attachHeader}>
                                        <label className={styles.formLabel}>
                                            <FontAwesomeIcon icon={faFileExcel} style={{ marginRight: 6 }} /> 电子表格附件
                                        </label>
                                        {isEditable && (
                                            <Upload
                                                accept=".xlsx,.xls,.et,.csv"
                                                showUploadList={false}
                                                beforeUpload={(file) => { handleUpload(file as unknown as File); return false; }}
                                                multiple
                                            >
                                                <Button size="small" icon={<FontAwesomeIcon icon={faUpload} />} type="primary" ghost>
                                                    上传电子表格
                                                </Button>
                                            </Upload>
                                        )}
                                    </div>

                                    {currentReport.attachments.length > 0 ? (
                                        <div className={styles.attachList}>
                                            {currentReport.attachments.map(att => (
                                                <div key={att.id} className={styles.attachItem}>
                                                    <div className={styles.attachIcon}>
                                                        <FontAwesomeIcon icon={faFileExcel} />
                                                    </div>
                                                    <div className={styles.attachInfo}>
                                                        <div className={styles.attachName}>{att.fileName}</div>
                                                        <div className={styles.attachMeta}>
                                                            {att.fileSize} · {att.sheets.length} 个工作表 · {att.uploadTime}
                                                        </div>
                                                    </div>
                                                    <Space>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            icon={<FontAwesomeIcon icon={faEye} />}
                                                            onClick={() => setViewingAttachment(att)}
                                                        >
                                                            查看
                                                        </Button>
                                                        {isEditable && (
                                                            <Popconfirm title="确认删除附件？" onConfirm={() => removeAttachment(att.id)}>
                                                                <Button size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                                                            </Popconfirm>
                                                        )}
                                                    </Space>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.attachEmpty}>
                                            <FontAwesomeIcon icon={faFileExcel} style={{ fontSize: 32, color: '#d1d5db' }} />
                                            <span>暂无电子表格附件</span>
                                            {isEditable && <span className={styles.attachHint}>支持 .xlsx .xls .et .csv 格式，最大 10MB</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <FontAwesomeIcon icon={faFileLines} style={{ fontSize: 64, color: '#d1d5db' }} />
                            <div>请选择或创建日报</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Excel 查看器 */}
            {viewingAttachment && (
                <SpreadsheetViewer
                    attachment={viewingAttachment}
                    onClose={() => setViewingAttachment(null)}
                    onUpdate={(sheets) => handleUpdateSheets(viewingAttachment.id, sheets)}
                    editable={isEditable}
                />
            )}
        </div>
    );
};

export default Report;
