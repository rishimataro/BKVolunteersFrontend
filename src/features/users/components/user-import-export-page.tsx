import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    CircleDashed,
    Download,
    FileSpreadsheet,
    FileUp,
    Search,
    ShieldCheck,
    Upload,
    Users,
} from 'lucide-react';
import { Link } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { Authorization, ROLES } from '@/features/auth';
import {
    createUser,
    getUserOptions,
    getUsers,
    type UserManagementItem,
} from '@/features/users/api/users';
import type { UserRole, UserStatus } from '@/types/api';
import {
    buildImportDrafts,
    convertCsvRowsToObjects,
    createEmptyImportMapping,
    createSuggestedImportMapping,
    getImportFieldConfigs,
    parseCsvText,
    type ImportDraftRow,
    type ImportMapping,
    type ParsedImportRow,
} from '@/features/users/lib/bulk-user-transfer';
import {
    convertXlsxRowsToObjects,
    createImportTemplateWorkbook,
    createUsersExportWorkbook,
    getWorkbookMimeType,
    parseXlsxRows,
} from '@/features/users/lib/bulk-user-transfer-xlsx';

type TransferTab = 'import' | 'export';
type ImportStep = 1 | 2 | 3;

type ImportResult = {
    successCount: number;
    failureCount: number;
    failures: Array<{
        rowNumber: number;
        identifier: string;
        message: string;
    }>;
};

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
    { value: 'SINHVIEN', label: 'Sinh viên' },
    { value: 'LCD', label: 'Liên chi đoàn khoa' },
    { value: 'CLB', label: 'Chủ nhiệm câu lạc bộ' },
    { value: 'DOANTRUONG', label: 'Đoàn trường (Quản trị viên)' },
];

const STATUS_OPTIONS: Array<{
    value: '' | 'ACTIVE' | 'LOCKED';
    label: string;
}> = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'LOCKED', label: 'Tạm khóa' },
];

const panelClassName =
    'rounded-xl border border-[#C3C6D2] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]';

const cardLabelClassName =
    'text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]';

const selectClassName =
    'h-12 w-full rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20 disabled:cursor-not-allowed disabled:opacity-60';

const inputClassName =
    'h-12 rounded-lg border-[#C3C6D2] bg-[#F3F4F5] text-[#191C1D] placeholder:text-[#737781] focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const tableCellClassName =
    'border-b border-[#E1E3E4] px-4 py-3 text-[14px] leading-6 text-[#191C1D] align-top';

const EXPORT_PAGE_SIZE = 100;

const getErrorMessage = (error: unknown) => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
    ) {
        return error.response.data.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Không thể xử lý yêu cầu.';
};

const downloadBinaryFile = (
    filename: string,
    content: Uint8Array,
    mimeType: string,
) => {
    const safeContent = new Uint8Array(content);
    const blob = new Blob([safeContent], {
        type: mimeType,
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

const readFileAsText = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Không đọc được tệp tải lên.'));
        reader.readAsText(file, 'utf-8');
    });

const readFileAsArrayBuffer = (file: File) =>
    new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () =>
            reject(new Error('Không đọc được tệp tải lên.'));
        reader.readAsArrayBuffer(file);
    });

const formatRoleLabel = (role: UserRole) =>
    ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;

const formatStatusLabel = (status: UserStatus) => {
    if (status === 'ACTIVE') {
        return 'Đang hoạt động';
    }

    if (status === 'LOCKED') {
        return 'Tạm khóa';
    }

    return 'Đã vô hiệu';
};

const ImportStepIndicator = ({
    currentStep,
    onSelect,
    canOpenStep,
}: {
    currentStep: ImportStep;
    onSelect: (step: ImportStep) => void;
    canOpenStep: (step: ImportStep) => boolean;
}) => {
    const steps: Array<{ id: ImportStep; label: string }> = [
        { id: 1, label: 'Tải tệp lên' },
        { id: 2, label: 'Ánh xạ cột' },
        { id: 3, label: 'Hoàn tất' },
    ];

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isEnabled = canOpenStep(step.id);

                return (
                    <React.Fragment key={step.id}>
                        <button
                            type="button"
                            onClick={() => {
                                if (isEnabled) {
                                    onSelect(step.id);
                                }
                            }}
                            className="flex items-center gap-3 text-left disabled:cursor-not-allowed"
                            disabled={!isEnabled}
                        >
                            <span
                                className={`flex h-11 w-11 items-center justify-center rounded-full text-[18px] font-semibold ${
                                    isActive || isCompleted
                                        ? 'bg-[#002A58] text-white shadow-[0_8px_24px_rgba(0,42,88,0.2)]'
                                        : 'bg-[#E1E3E4] text-[#737781]'
                                }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="size-5" />
                                ) : (
                                    step.id
                                )}
                            </span>
                            <span
                                className={`text-[15px] font-semibold ${
                                    isActive
                                        ? 'text-[#002A58]'
                                        : 'text-[#424750]'
                                }`}
                            >
                                {step.label}
                            </span>
                        </button>
                        {index < steps.length - 1 ? (
                            <div className="hidden h-px flex-1 bg-[#E1E3E4] lg:block" />
                        ) : null}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const SummaryCard = ({
    label,
    value,
    note,
    tone = 'default',
}: {
    label: string;
    value: string;
    note: string;
    tone?: 'default' | 'success' | 'danger';
}) => {
    const toneClassName =
        tone === 'success'
            ? 'border-[#D6F2E1] bg-[#F1FBF5]'
            : tone === 'danger'
              ? 'border-[#F6D4D2] bg-[#FFF5F5]'
              : 'border-[#E1E3E4] bg-[#F8F9FA]';

    return (
        <section className={`rounded-xl border p-4 ${toneClassName}`}>
            <p className={cardLabelClassName}>{label}</p>
            <p className="mt-3 text-[28px] font-semibold leading-8 text-[#002A58]">
                {value}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[#424750]">{note}</p>
        </section>
    );
};

const ExportPreviewTable = ({ users }: { users: UserManagementItem[] }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-[#E1E3E4]">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-[#F3F4F5]">
                        <tr>
                            <th
                                className={`${tableCellClassName} min-w-[220px] text-left font-semibold text-[#424750]`}
                            >
                                Người dùng
                            </th>
                            <th
                                className={`${tableCellClassName} min-w-[160px] text-left font-semibold text-[#424750]`}
                            >
                                Vai trò
                            </th>
                            <th
                                className={`${tableCellClassName} min-w-[180px] text-left font-semibold text-[#424750]`}
                            >
                                Đơn vị
                            </th>
                            <th
                                className={`${tableCellClassName} min-w-[150px] text-left font-semibold text-[#424750]`}
                            >
                                Trạng thái
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-[#F8FBFF]">
                                <td className={tableCellClassName}>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-[#191C1D]">
                                            {user.fullName ||
                                                user.username ||
                                                user.email}
                                        </p>
                                        <p className="text-[13px] text-[#737781]">
                                            {user.email}
                                        </p>
                                    </div>
                                </td>
                                <td className={tableCellClassName}>
                                    {formatRoleLabel(user.role)}
                                </td>
                                <td className={tableCellClassName}>
                                    {user.managedClubName ||
                                        user.facultyName ||
                                            'Chưa gán đơn vị'}
                                </td>
                                <td className={tableCellClassName}>
                                    {formatStatusLabel(user.status)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const UserImportExportPage = () => {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const queryClient = useQueryClient();
    const { addNotification } = useNotifications();

    const [activeTab, setActiveTab] = React.useState<TransferTab>('import');
    const [currentStep, setCurrentStep] = React.useState<ImportStep>(1);
    const [importRole, setImportRole] = React.useState<UserRole>('SINHVIEN');
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [importHeaders, setImportHeaders] = React.useState<string[]>([]);
    const [importRows, setImportRows] = React.useState<ParsedImportRow[]>([]);
    const [mapping, setMapping] = React.useState<ImportMapping>(
        createEmptyImportMapping(),
    );
    const [isImporting, setIsImporting] = React.useState(false);
    const [importResult, setImportResult] = React.useState<ImportResult | null>(
        null,
    );
    const [exportSearch, setExportSearch] = React.useState('');
    const [exportRoleFilter, setExportRoleFilter] = React.useState<
        UserRole | ''
    >('');
    const [exportStatusFilter, setExportStatusFilter] = React.useState<
        '' | 'ACTIVE' | 'LOCKED'
    >('');
    const [isExporting, setIsExporting] = React.useState(false);

    const optionsQuery = useQuery({
        queryKey: ['users-options'],
        queryFn: getUserOptions,
    });

    const exportPreviewQuery = useQuery({
        queryKey: [
            'users-import-export-preview',
            exportSearch,
            exportRoleFilter,
            exportStatusFilter,
        ],
        queryFn: () =>
            getUsers({
                page: 1,
                limit: 8,
                search: exportSearch || undefined,
                role: exportRoleFilter,
                status: exportStatusFilter,
            }),
    });

    const fieldConfigs = React.useMemo(
        () => getImportFieldConfigs(importRole),
        [importRole],
    );

    const importDraft = React.useMemo(
        () =>
            buildImportDrafts({
                role: importRole,
                rows: importRows,
                mapping,
                faculties: optionsQuery.data?.faculties ?? [],
                clubs: optionsQuery.data?.clubs ?? [],
            }),
        [
            importRole,
            importRows,
            mapping,
            optionsQuery.data?.clubs,
            optionsQuery.data?.faculties,
        ],
    );

    const canOpenStep = React.useCallback(
        (step: ImportStep) => {
            if (step === 1) {
                return true;
            }

            if (step === 2) {
                return importHeaders.length > 0 && importRows.length > 0;
            }

            return importDraft.previewRows.length > 0;
        },
        [
            importDraft.previewRows.length,
            importHeaders.length,
            importRows.length,
        ],
    );

    const resetImportFlow = React.useCallback(() => {
        setCurrentStep(1);
        setSelectedFile(null);
        setImportHeaders([]);
        setImportRows([]);
        setMapping(createEmptyImportMapping());
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleRoleChange = (role: UserRole) => {
        setImportRole(role);
        resetImportFlow();
    };

    const handleTemplateDownload = () => {
        downloadBinaryFile(
            `mau-nhap-du-lieu-${importRole.toLowerCase()}.xlsx`,
            createImportTemplateWorkbook(importRole),
            getWorkbookMimeType(),
        );

        addNotification({
            type: 'success',
            title: 'Đã tải mẫu Excel',
            message: 'Biểu mẫu nhập dữ liệu đã được tải xuống thiết bị của bạn.',
        });
    };

    const handleBrowseFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const lowerName = file.name.toLowerCase();
            const isWorkbook = lowerName.endsWith('.xlsx');
            const { headers, records } = isWorkbook
                ? convertXlsxRowsToObjects(
                      parseXlsxRows(await readFileAsArrayBuffer(file)),
                  )
                : convertCsvRowsToObjects(
                      parseCsvText(await readFileAsText(file)),
                  );

            if (!headers.length || !records.length) {
                throw new Error(
                    'Tệp không có dữ liệu hợp lệ. Hãy kiểm tra lại dòng tiêu đề và ít nhất một bản ghi.',
                );
            }

            setSelectedFile(file);
            setImportHeaders(headers);
            setImportRows(records);
            setMapping(createSuggestedImportMapping(importRole, headers));
            setImportResult(null);
            setCurrentStep(2);

            addNotification({
                type: 'success',
                title: isWorkbook ? 'Đã đọc tệp Excel' : 'Đã đọc tệp CSV',
                message: `Hệ thống đã nhận ${records.length.toLocaleString('vi-VN')} dòng dữ liệu để đối chiếu.`,
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không thể đọc tệp',
                message: getErrorMessage(error),
            });
            event.target.value = '';
        }
    };

    const handleStartImport = async () => {
        if (!importDraft.validRows.length) {
            addNotification({
                type: 'warning',
                title: 'Chưa có dòng hợp lệ',
                message:
                    'Hãy kiểm tra lại bước ánh xạ cột trước khi nhập dữ liệu.',
            });
            return;
        }

        setIsImporting(true);
        const failures: ImportResult['failures'] = [];
        let successCount = 0;

        try {
            for (const row of importDraft.validRows) {
                if (!row.payload) {
                    continue;
                }

                try {
                    await createUser(row.payload);
                    successCount += 1;
                } catch (error) {
                    failures.push({
                        rowNumber: row.rowNumber,
                        identifier: row.identifier,
                        message: getErrorMessage(error),
                    });
                }
            }

            const result = {
                successCount,
                failureCount: failures.length,
                failures,
            } satisfies ImportResult;

            setImportResult(result);
            await queryClient.invalidateQueries({ queryKey: ['users'] });

            addNotification({
                type: failures.length ? 'warning' : 'success',
                title: failures.length
                    ? 'Nhập dữ liệu hoàn tất có cảnh báo'
                    : 'Nhập dữ liệu thành công',
                message: failures.length
                    ? `Đã tạo ${successCount} tài khoản, ${failures.length} dòng còn lỗi cần xử lý lại.`
                    : `Đã tạo ${successCount} tài khoản mới từ tệp đã tải lên.`,
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const total = exportPreviewQuery.data?.meta.total ?? 0;
            if (!total) {
                addNotification({
                    type: 'warning',
                    title: 'Không có dữ liệu để xuất',
                    message:
                        'Bộ lọc hiện tại chưa trả về tài khoản nào để tạo tệp Excel.',
                });
                return;
            }

            const totalPages = Math.max(
                1,
                Math.ceil(total / EXPORT_PAGE_SIZE),
            );
            const pages = await Promise.all(
                Array.from({ length: totalPages }, (_, index) =>
                    getUsers({
                        page: index + 1,
                        limit: EXPORT_PAGE_SIZE,
                        search: exportSearch || undefined,
                        role: exportRoleFilter,
                        status: exportStatusFilter,
                    }),
                ),
            );
            const exportUsers = pages.flatMap((page) => page.data);

            downloadBinaryFile(
                'danh-sach-nguoi-dung.xlsx',
                createUsersExportWorkbook(exportUsers, {
                    roleFilter: exportRoleFilter,
                    statusFilter: exportStatusFilter,
                }),
                getWorkbookMimeType(),
            );

            addNotification({
                type: 'success',
                title: 'Đã xuất dữ liệu',
                message: `Tệp Excel chứa ${exportUsers.length.toLocaleString('vi-VN')} tài khoản đã được tạo.`,
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xuất dữ liệu thất bại',
                message: getErrorMessage(error),
            });
        } finally {
            setIsExporting(false);
        }
    };

    const exportPreviewUsers = exportPreviewQuery.data?.data ?? [];
    const exportPreviewMeta = exportPreviewQuery.data?.meta;

    return (
        <Authorization
            allowedRoles={[ROLES.DOANTRUONG]}
            forbiddenFallback={
                <ContentLayout title="Nhập và xuất dữ liệu người dùng">
                    <div className={`${panelClassName} p-6`}>
                        <p className="text-sm leading-6 text-[#D97706]">
                            Chỉ tài khoản Đoàn trường mới được phép thao tác dữ
                            liệu người dùng ở cấp hệ thống.
                        </p>
                    </div>
                </ContentLayout>
            }
        >
            <>
                <Head title="Nhập và xuất dữ liệu người dùng" />
                <div className="space-y-6 font-sans">
                    <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-3">
                            <p className={cardLabelClassName}>
                                Quản trị hệ thống
                            </p>
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#002A58]">
                                    <FileUp
                                        className="size-7"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-[40px] font-bold leading-[48px] text-[#002A58]">
                                        Nhập và xuất dữ liệu người dùng
                                    </h2>
                                    <p className="max-w-3xl text-[16px] leading-6 text-[#424750]">
                                        Giữ nguyên API hiện tại, nhập dữ liệu
                                        bằng biểu mẫu Excel hoặc CSV theo mẫu hệ
                                        thống và xuất danh sách tài khoản theo
                                        bộ lọc quản trị.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to={paths.app.users.getHref()}
                                className={buttonVariants({
                                    variant: 'outline',
                                    className:
                                        'rounded-lg border-[#C3C6D2] bg-white normal-case tracking-normal text-[#424750] hover:bg-[#F3F4F5]',
                                })}
                            >
                                <ArrowLeft
                                    className="size-4"
                                    strokeWidth={1.5}
                                />
                                Quay lại quản lý tài khoản
                            </Link>
                            <Button
                                type="button"
                                className="rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                onClick={handleTemplateDownload}
                            >
                                <Download
                                    className="size-4"
                                    strokeWidth={1.5}
                                />
                                Tải mẫu Excel
                            </Button>
                        </div>
                    </section>

                    <section className={`${panelClassName} overflow-hidden`}>
                        <div className="border-b border-[#E1E3E4] px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className={`border-b-2 px-1 pb-3 text-[18px] font-semibold transition ${
                                        activeTab === 'import'
                                            ? 'border-[#002A58] text-[#002A58]'
                                            : 'border-transparent text-[#737781] hover:text-[#002A58]'
                                    }`}
                                    onClick={() => setActiveTab('import')}
                                >
                                    Nhập dữ liệu
                                </button>
                                <button
                                    type="button"
                                    className={`border-b-2 px-1 pb-3 text-[18px] font-semibold transition ${
                                        activeTab === 'export'
                                            ? 'border-[#002A58] text-[#002A58]'
                                            : 'border-transparent text-[#737781] hover:text-[#002A58]'
                                    }`}
                                    onClick={() => setActiveTab('export')}
                                >
                                    Xuất dữ liệu
                                </button>
                            </div>
                        </div>

                        {activeTab === 'import' ? (
                            <div className="p-5 space-y-6 sm:p-6">
                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                                    <div
                                        className={`${panelClassName} border-dashed p-5 shadow-none`}
                                    >
                                        <ImportStepIndicator
                                            currentStep={currentStep}
                                            onSelect={setCurrentStep}
                                            canOpenStep={canOpenStep}
                                        />
                                    </div>
                                    <div className={`${panelClassName} p-5`}>
                                        <p className={cardLabelClassName}>
                                            Cấu hình tệp nhập
                                        </p>
                                        <div className="mt-4 space-y-4">
                                            <label className="grid gap-2">
                                                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Loại tài khoản
                                                </span>
                                                <select
                                                    className={selectClassName}
                                                    value={importRole}
                                                    onChange={(event) =>
                                                        handleRoleChange(
                                                            event.target
                                                                .value as UserRole,
                                                        )
                                                    }
                                                >
                                                    {ROLE_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </label>
                                            <div className="rounded-xl bg-[#F3F4F5] p-4 text-[14px] leading-6 text-[#424750]">
                                                Tệp import hỗ trợ cả Excel
                                                (`.xlsx`) và CSV theo mẫu hệ
                                                thống. Hệ thống sẽ đọc tệp,
                                                đối chiếu cột và rà soát lỗi
                                                trước khi tạo tài khoản.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {currentStep === 1 ? (
                                    <>
                                        <section className="rounded-xl border-2 border-dashed border-[#C3C6D2] bg-[#FCFCFD] px-6 py-12 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D6E3FF] text-[#002A58]">
                                                <Upload
                                                    className="size-9"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <h3 className="mt-6 text-[32px] font-semibold leading-10 text-[#002A58]">
                                                Tải tệp dữ liệu người dùng
                                            </h3>
                                            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-7 text-[#424750]">
                                                Chọn đúng biểu mẫu theo vai trò,
                                                sau đó hệ thống sẽ hỗ trợ ánh xạ
                                                cột và rà soát lỗi trước khi tạo
                                                tài khoản.
                                            </p>
                                            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                                                <Button
                                                    type="button"
                                                    className="rounded-lg bg-[#002A58] px-6 normal-case tracking-normal text-white hover:bg-[#004080]"
                                                    onClick={handleBrowseFile}
                                                >
                                                    <Upload
                                                        className="size-4"
                                                        strokeWidth={1.5}
                                                    />
                                                    Chọn tệp Excel hoặc CSV
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-lg border-[#002A58] bg-white px-6 normal-case tracking-normal text-[#002A58] hover:bg-[#EEF3FB]"
                                                    onClick={
                                                        handleTemplateDownload
                                                    }
                                                >
                                                    <Download
                                                        className="size-4"
                                                        strokeWidth={1.5}
                                                    />
                                                    Tải mẫu theo vai trò
                                                </Button>
                                            </div>
                                            {selectedFile ? (
                                                <p className="mt-5 text-[14px] leading-6 text-[#424750]">
                                                    Tệp đã chọn:{' '}
                                                    <strong>
                                                        {selectedFile.name}
                                                    </strong>
                                                </p>
                                            ) : null}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv,.xlsx"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </section>
                                    </>
                                ) : null}

                                {currentStep === 2 ? (
                                    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                                        <section
                                            className={`${panelClassName} p-5`}
                                        >
                                            <div className="flex items-start justify-between gap-4 border-b border-[#E1E3E4] pb-4">
                                                <div>
                                                    <p
                                                        className={
                                                            cardLabelClassName
                                                        }
                                                    >
                                                        Tệp đang xử lý
                                                    </p>
                                                    <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#191C1D]">
                                                        Ánh xạ cột dữ liệu
                                                    </h3>
                                                </div>
                                                <FileSpreadsheet
                                                    className="size-6 text-[#002A58]"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <div className="mt-5 space-y-4">
                                                {fieldConfigs.map((field) => (
                                                    <label
                                                        key={field.key}
                                                        className="grid gap-2"
                                                    >
                                                        <span
                                                            className={
                                                                cardLabelClassName
                                                            }
                                                        >
                                                            {field.label}
                                                            {field.required
                                                                ? ' *'
                                                                : ''}
                                                        </span>
                                                        <select
                                                            className={
                                                                selectClassName
                                                            }
                                                            value={
                                                                mapping[
                                                                    field.key
                                                                ]
                                                            }
                                                            onChange={(event) =>
                                                                setMapping(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [field.key]:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                {field.required
                                                                    ? 'Chọn cột bắt buộc'
                                                                    : 'Không dùng cột này'}
                                                            </option>
                                                            {importHeaders.map(
                                                                (header) => (
                                                                    <option
                                                                        key={
                                                                            header
                                                                        }
                                                                        value={
                                                                            header
                                                                        }
                                                                    >
                                                                        {header}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </label>
                                                ))}
                                            </div>
                                        </section>

                                        <section
                                            className={`${panelClassName} overflow-hidden`}
                                        >
                                            <div className="border-b border-[#E1E3E4] px-5 py-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                                            Xem trước dữ liệu
                                                        </h3>
                                                        <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                            Hệ thống hiển thị
                                                            các dòng đầu tiên
                                                            sau khi đối chiếu
                                                            cột để bạn kiểm tra
                                                            trước khi nhập thật.
                                                        </p>
                                                    </div>
                                                    <div className="rounded-full bg-[#F3F4F5] px-4 py-2 text-[13px] font-semibold text-[#424750]">
                                                        {importRows.length.toLocaleString(
                                                            'vi-VN',
                                                        )}{' '}
                                                        dòng
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border-collapse">
                                                    <thead className="bg-[#F8F9FA]">
                                                        <tr>
                                                            <th
                                                                className={`${tableCellClassName} min-w-[88px] text-left font-semibold text-[#424750]`}
                                                            >
                                                                Dòng
                                                            </th>
                                                            {fieldConfigs.map(
                                                                (field) => (
                                                                    <th
                                                                        key={
                                                                            field.key
                                                                        }
                                                                        className={`${tableCellClassName} min-w-[180px] text-left font-semibold text-[#424750]`}
                                                                    >
                                                                        {
                                                                            field.label
                                                                        }
                                                                    </th>
                                                                ),
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {importRows
                                                            .slice(0, 5)
                                                            .map(
                                                                (
                                                                    row,
                                                                    index,
                                                                ) => (
                                                                    <tr
                                                                        key={`preview-${index}`}
                                                                        className="hover:bg-[#F8FBFF]"
                                                                    >
                                                                        <td
                                                                            className={
                                                                                tableCellClassName
                                                                            }
                                                                        >
                                                                            {index +
                                                                                2}
                                                                        </td>
                                                                        {fieldConfigs.map(
                                                                            (
                                                                                field,
                                                                            ) => (
                                                                                <td
                                                                                    key={
                                                                                        field.key
                                                                                    }
                                                                                    className={
                                                                                        tableCellClassName
                                                                                    }
                                                                                >
                                                                                    {mapping[
                                                                                        field
                                                                                            .key
                                                                                    ]
                                                                                        ? row[
                                                                                              mapping[
                                                                                                  field
                                                                                                      .key
                                                                                              ]
                                                                                          ] ||
                                                                                                                                                                                    'Chưa có dữ liệu'
                                                                                                                                                                                : 'Chưa ánh xạ'}
                                                                                </td>
                                                                            ),
                                                                        )}
                                                                    </tr>
                                                                ),
                                                            )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    </div>
                                ) : null}

                                {currentStep === 3 ? (
                                    <div className="space-y-6">
                                        <div className="grid gap-4 lg:grid-cols-4">
                                            <SummaryCard
                                                label="Tổng số dòng"
                                                value={importDraft.previewRows.length.toLocaleString(
                                                    'vi-VN',
                                                )}
                                                note="Không tính dòng tiêu đề."
                                            />
                                            <SummaryCard
                                                label="Hợp lệ"
                                                value={importDraft.validRows.length.toLocaleString(
                                                    'vi-VN',
                                                )}
                                                note="Sẵn sàng gọi API tạo tài khoản."
                                                tone="success"
                                            />
                                            <SummaryCard
                                                label="Cần xử lý"
                                                value={importDraft.invalidRows.length.toLocaleString(
                                                    'vi-VN',
                                                )}
                                                note="Dòng lỗi sẽ không được gửi lên hệ thống."
                                                tone="danger"
                                            />
                                            <SummaryCard
                                                label="Vai trò nhập"
                                                value={formatRoleLabel(
                                                    importRole,
                                                )}
                                                note="Tất cả dòng trong tệp sẽ dùng cùng loại tài khoản này."
                                            />
                                        </div>

                                        <section
                                            className={`${panelClassName} p-5 sm:p-6`}
                                        >
                                            <div className="flex flex-col gap-3 border-b border-[#E1E3E4] pb-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                                        Rà soát trước khi nhập
                                                    </h3>
                                                    <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                        Chỉ các dòng hợp lệ mới
                                                        được tạo tài khoản. Bạn
                                                        có thể tải lại tệp để
                                                        sửa nếu còn lỗi đối
                                                        chiếu khoa hoặc câu lạc
                                                        bộ.
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-lg border-[#C3C6D2] bg-white normal-case tracking-normal text-[#424750] hover:bg-[#F3F4F5]"
                                                        onClick={
                                                            resetImportFlow
                                                        }
                                                    >
                                                        Làm lại từ đầu
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        className="rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                                        onClick={
                                                            handleStartImport
                                                        }
                                                        disabled={
                                                            isImporting ||
                                                            !importDraft
                                                                .validRows
                                                                .length
                                                        }
                                                    >
                                                        {isImporting ? (
                                                            <CircleDashed className="size-4 animate-spin" />
                                                        ) : (
                                                            <ShieldCheck
                                                                className="size-4"
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                        )}
                                                        Bắt đầu nhập dữ liệu
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                                                <div className="rounded-xl border border-[#E1E3E4]">
                                                    <div className="border-b border-[#E1E3E4] px-4 py-3">
                                                        <p className="text-[15px] font-semibold text-[#191C1D]">
                                                            Dòng hợp lệ đầu tiên
                                                        </p>
                                                    </div>
                                                    <div className="divide-y divide-[#E1E3E4]">
                                                        {importDraft.validRows
                                                            .slice(0, 5)
                                                            .map(
                                                                (
                                                                    row: ImportDraftRow,
                                                                ) => (
                                                                    <div
                                                                        key={`valid-${row.rowNumber}`}
                                                                        className="flex items-start gap-3 px-4 py-4"
                                                                    >
                                                                        <CheckCircle2 className="mt-0.5 size-5 text-[#006D37]" />
                                                                        <div>
                                                                            <p className="font-semibold text-[#191C1D]">
                                                                                Dòng{' '}
                                                                                {
                                                                                    row.rowNumber
                                                                                }
                                                                                :{' '}
                                                                                {
                                                                                    row.identifier
                                                                                }
                                                                            </p>
                                                                            <p className="mt-1 text-[13px] leading-5 text-[#424750]">
                                                                                Sẵn
                                                                                sàng
                                                                                gọi
                                                                                API
                                                                                tạo
                                                                                tài
                                                                                khoản.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        {!importDraft.validRows
                                                            .length ? (
                                                            <div className="px-4 py-5 text-[14px] leading-6 text-[#737781]">
                                                                Chưa có dòng hợp
                                                                lệ.
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-[#F2B8B5] bg-[#FFF8F8]">
                                                    <div className="border-b border-[#F2B8B5] px-4 py-3">
                                                        <p className="text-[15px] font-semibold text-[#93000A]">
                                                            Dòng cần xử lý lại
                                                        </p>
                                                    </div>
                                                    <div className="divide-y divide-[#F2B8B5]">
                                                        {importDraft.invalidRows
                                                            .slice(0, 6)
                                                            .map(
                                                                (
                                                                    row: ImportDraftRow,
                                                                ) => (
                                                                    <div
                                                                        key={`invalid-${row.rowNumber}`}
                                                                        className="flex items-start gap-3 px-4 py-4"
                                                                    >
                                                                        <CircleAlert className="mt-0.5 size-5 text-[#BA1A1A]" />
                                                                        <div>
                                                                            <p className="font-semibold text-[#191C1D]">
                                                                                Dòng{' '}
                                                                                {
                                                                                    row.rowNumber
                                                                                }
                                                                                :{' '}
                                                                                {
                                                                                    row.identifier
                                                                                }
                                                                            </p>
                                                                            <p className="mt-1 text-[13px] leading-5 text-[#93000A]">
                                                                                {
                                                                                    row.message
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        {!importDraft
                                                            .invalidRows
                                                            .length ? (
                                                            <div className="px-4 py-5 text-[14px] leading-6 text-[#006D37]">
                                                                Không phát hiện
                                                                lỗi dữ liệu
                                                                trong lượt rà
                                                                soát này.
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {importResult ? (
                                                <div className="mt-5 rounded-xl border border-[#E1E3E4] bg-[#F8F9FA] p-5">
                                                    <p
                                                        className={
                                                            cardLabelClassName
                                                        }
                                                    >
                                                        Kết quả lần nhập gần
                                                        nhất
                                                    </p>
                                                    <div className="grid gap-4 mt-4 sm:grid-cols-2 xl:grid-cols-3">
                                                        <SummaryCard
                                                            label="Tạo thành công"
                                                            value={importResult.successCount.toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                            note="Số tài khoản đã được ghi nhận."
                                                            tone="success"
                                                        />
                                                        <SummaryCard
                                                            label="Thất bại"
                                                            value={importResult.failureCount.toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                            note="Các dòng thất bại cần sửa trong tệp gốc."
                                                            tone="danger"
                                                        />
                                                        <SummaryCard
                                                            label="Dòng lỗi lưu ý"
                                                            value={
                                                                importResult
                                                                    .failures[0]
                                                                    ? `#${importResult.failures[0].rowNumber}`
                                                                    : 'Không có'
                                                            }
                                                            note={
                                                                importResult
                                                                    .failures[0]
                                                                    ?.message ||
                                                                'Không phát sinh lỗi trong lần nhập này.'
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}
                                        </section>
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E3E4] pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-lg border-[#C3C6D2] bg-white normal-case tracking-normal text-[#424750] hover:bg-[#F3F4F5]"
                                        onClick={() =>
                                            setCurrentStep((previous) =>
                                                previous > 1
                                                    ? ((previous -
                                                          1) as ImportStep)
                                                    : previous,
                                            )
                                        }
                                        disabled={currentStep === 1}
                                    >
                                        Quay lại bước trước
                                    </Button>
                                    <div className="flex flex-wrap gap-3">
                                        {currentStep < 3 ? (
                                            <Button
                                                type="button"
                                                className="rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                                onClick={() =>
                                                    setCurrentStep(
                                                        (previous) =>
                                                            (previous +
                                                                1) as ImportStep,
                                                    )
                                                }
                                                disabled={
                                                    !canOpenStep(
                                                        (currentStep +
                                                            1) as ImportStep,
                                                    )
                                                }
                                            >
                                                Tiếp tục
                                                <ChevronRight
                                                    className="size-4"
                                                    strokeWidth={1.5}
                                                />
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-6 sm:p-6">
                                <section
                                    className={`${panelClassName} p-5 sm:p-6`}
                                >
                                    <div className="flex flex-col gap-3 border-b border-[#E1E3E4] pb-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                                Bộ lọc xuất dữ liệu
                                            </h3>
                                            <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                Chọn phạm vi dữ liệu cần xuất.
                                                Tệp Excel sẽ được tạo từ danh
                                                sách khớp với bộ lọc này.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            className="rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                            onClick={handleExport}
                                            disabled={
                                                isExporting ||
                                                exportPreviewQuery.isLoading
                                            }
                                        >
                                            <Download
                                                className="size-4"
                                                strokeWidth={1.5}
                                            />
                                            {isExporting
                                                ? 'Đang xuất dữ liệu...'
                                                : 'Xuất tệp Excel'}
                                        </Button>
                                    </div>

                                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
                                        <label className="grid gap-2">
                                            <span
                                                className={cardLabelClassName}
                                            >
                                                Tìm kiếm
                                            </span>
                                            <div className="relative">
                                                <Search
                                                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#737781]"
                                                    strokeWidth={1.5}
                                                />
                                                <Input
                                                    value={exportSearch}
                                                    onChange={(event) =>
                                                        setExportSearch(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Email, MSSV hoặc tên đăng nhập"
                                                    className={`${inputClassName} pl-11`}
                                                />
                                            </div>
                                        </label>
                                        <label className="grid gap-2">
                                            <span
                                                className={cardLabelClassName}
                                            >
                                                Vai trò
                                            </span>
                                            <select
                                                className={selectClassName}
                                                value={exportRoleFilter}
                                                onChange={(event) =>
                                                    setExportRoleFilter(
                                                        event.target.value as
                                                            | UserRole
                                                            | '',
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Tất cả vai trò
                                                </option>
                                                {ROLE_OPTIONS.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="grid gap-2">
                                            <span
                                                className={cardLabelClassName}
                                            >
                                                Trạng thái
                                            </span>
                                            <select
                                                className={selectClassName}
                                                value={exportStatusFilter}
                                                onChange={(event) =>
                                                    setExportStatusFilter(
                                                        event.target.value as
                                                            | ''
                                                            | 'ACTIVE'
                                                            | 'LOCKED',
                                                    )
                                                }
                                            >
                                                {STATUS_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={
                                                                option.value ||
                                                                'all-status'
                                                            }
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>
                                    </div>
                                </section>

                                <section
                                    className={`${panelClassName} overflow-hidden`}
                                >
                                    <div className="border-b border-[#E1E3E4] px-5 py-5">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                                    Xem trước dữ liệu sẽ xuất
                                                </h3>
                                                <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                    Bảng xem trước này dùng
                                                    cùng bộ lọc với tệp Excel
                                                    tải xuống.
                                                </p>
                                            </div>
                                            <div className="rounded-full bg-[#F3F4F5] px-4 py-2 text-[13px] font-semibold text-[#424750]">
                                                {exportPreviewMeta?.total ?? 0}{' '}
                                                tài khoản phù hợp
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        {exportPreviewUsers.length ? (
                                            <ExportPreviewTable
                                                users={exportPreviewUsers}
                                            />
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-[#C3C6D2] bg-[#FCFCFD] px-6 py-12 text-center">
                                                <Users className="mx-auto size-10 text-[#737781]" />
                                                <p className="mt-4 text-[18px] font-semibold text-[#191C1D]">
                                                    Không có dữ liệu để xem
                                                    trước
                                                </p>
                                                <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                    Hãy điều chỉnh bộ lọc hoặc
                                                    tìm kiếm để lấy danh sách
                                                    người dùng phù hợp.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </section>
                </div>
            </>
        </Authorization>
    );
};

