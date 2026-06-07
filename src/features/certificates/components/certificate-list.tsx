import * as React from 'react';
import {
    Award,
    CalendarDays,
    Copy,
    Download,
    FileSearch,
    Search,
    SlidersHorizontal,
} from 'lucide-react';

import { Head } from '@/components/seo';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import {
    getStudentDashboard,
    type StudentDashboardSummary,
} from '@/features/campaign/api/student';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';
import { getMyCertificates } from '../api/certificates';
import type { CertificateItem } from '../api/certificates';

type SortOption = 'newest' | 'oldest' | 'title';

const sortOptions: Array<{ label: string; value: SortOption }> = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Cũ nhất', value: 'oldest' },
    { label: 'Theo tên chiến dịch', value: 'title' },
];

const statusLabel: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    RENDERING: 'Đang tạo',
    READY: 'Sẵn sàng',
    SIGNED: 'Đã cấp',
    REVOKED: 'Đã thu hồi',
    FAILED: 'Lỗi',
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
};

const getStatusClassName = (status: string) => {
    if (status === 'SIGNED' || status === 'READY') {
        return 'border-[#166534] text-[#166534]';
    }

    if (status === 'PENDING' || status === 'RENDERING') {
        return 'border-[#C2410C] text-[#C2410C]';
    }

    return 'border-destructive text-destructive';
};

const getCertificateYear = (certificate: CertificateItem) => {
    const source = certificate.issuedAt ?? certificate.createdAt;
    const date = new Date(source);

    return Number.isNaN(date.getTime()) ? 'Khác' : String(date.getFullYear());
};

const buildYearOptions = (certificates: CertificateItem[]) =>
    Array.from(new Set(certificates.map(getCertificateYear))).sort(
        (left, right) => right.localeCompare(left),
    );

const buildShareText = (certificateNo: string) => {
    const verifyPath = paths.certificates.verify.getHref();

    if (typeof window === 'undefined') {
        return `Tra cứu chứng nhận tại ${verifyPath} với mã ${certificateNo}`;
    }

    return `Tra cứu chứng nhận tại ${window.location.origin}${verifyPath} với mã ${certificateNo}`;
};

const getPreviewTone = (value: string) => {
    const tones = [
        {
            frame: 'border-[#8B5E3C]',
            surface: 'bg-[#F6F1E8]',
            accent: 'text-[#8B5E3C]',
            inner: 'border-[#D4AF37]',
        },
        {
            frame: 'border-[#0A3A5A]',
            surface: 'bg-[#EAF2F7]',
            accent: 'text-[#0A3A5A]',
            inner: 'border-[#0A3A5A]',
        },
        {
            frame: 'border-[#0F5132]',
            surface: 'bg-[#EEF8F1]',
            accent: 'text-[#0F5132]',
            inner: 'border-[#83C5A3]',
        },
    ];

    let total = 0;
    for (const char of value) {
        total += char.charCodeAt(0);
    }

    return tones[total % tones.length];
};

const sortCertificates = (
    certificates: CertificateItem[],
    sortBy: SortOption,
) => {
    return [...certificates].sort((left, right) => {
        if (sortBy === 'title') {
            return left.campaignTitle.localeCompare(right.campaignTitle, 'vi');
        }

        const leftTime = new Date(left.issuedAt ?? left.createdAt).getTime();
        const rightTime = new Date(right.issuedAt ?? right.createdAt).getTime();

        return sortBy === 'newest'
            ? rightTime - leftTime
            : leftTime - rightTime;
    });
};

export const CertificateList = () => {
    const { addNotification } = useNotifications();
    const [summary, setSummary] =
        React.useState<StudentDashboardSummary | null>(null);
    const [certificates, setCertificates] = React.useState<CertificateItem[]>(
        [],
    );
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedYear, setSelectedYear] = React.useState('');
    const [sortBy, setSortBy] = React.useState<SortOption>('newest');

    React.useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        Promise.allSettled([getMyCertificates(), getStudentDashboard()])
            .then((results) => {
                if (!mounted) {
                    return;
                }

                const [certificatesResult, summaryResult] = results;

                if (certificatesResult.status !== 'fulfilled') {
                    throw new Error('Không thể tải danh sách chứng nhận.');
                }

                setCertificates(certificatesResult.value);

                if (summaryResult.status === 'fulfilled') {
                    setSummary(summaryResult.value);
                }
            })
            .catch((error) => {
                if (!mounted) {
                    return;
                }

                addNotification({
                    type: 'error',
                    title: 'Không thể tải chứng nhận',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Không thể tải danh sách chứng nhận.',
                });
            })
            .finally(() => {
                if (mounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [addNotification]);

    const yearOptions = React.useMemo(
        () => buildYearOptions(certificates),
        [certificates],
    );

    const visibleCertificates = React.useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return sortCertificates(
            certificates.filter((certificate) => {
                const matchesYear =
                    !selectedYear ||
                    getCertificateYear(certificate) === selectedYear;
                const matchesQuery =
                    !normalizedQuery ||
                    certificate.certificateNo
                        .toLowerCase()
                        .includes(normalizedQuery) ||
                    certificate.campaignTitle
                        .toLowerCase()
                        .includes(normalizedQuery) ||
                    certificate.templateName
                        .toLowerCase()
                        .includes(normalizedQuery) ||
                    String(certificate.moduleTitle ?? '')
                        .toLowerCase()
                        .includes(normalizedQuery);

                return matchesYear && matchesQuery;
            }),
            sortBy,
        );
    }, [certificates, searchQuery, selectedYear, sortBy]);

    const latestIssuedCertificate = React.useMemo(
        () => sortCertificates(certificates, 'newest')[0] ?? null,
        [certificates],
    );

    const pendingCertificates = Math.max(
        0,
        (summary?.event_completed_count ?? 0) -
            (summary?.certificates_count ?? certificates.length),
    );

    const totalCertifiedHours = summary?.event_hours ?? 0;
    const totalIssuedCertificates =
        summary?.certificates_count ?? certificates.length;
    const totalCampaigns = summary?.campaigns_count ?? 0;

    const handleShare = async (certificateNo: string) => {
        if (!navigator?.clipboard?.writeText) {
            addNotification({
                type: 'error',
                title: 'Không thể chia sẻ',
                message: 'Trình duyệt hiện không hỗ trợ sao chép tự động.',
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(buildShareText(certificateNo));
            addNotification({
                type: 'success',
                title: 'Đã sao chép thông tin',
                message: `Mã chứng nhận ${certificateNo} đã được sao chép để chia sẻ.`,
            });
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể chia sẻ',
                message: 'Vui lòng sao chép mã chứng nhận thủ công.',
            });
        }
    };

    return (
        <>
            <Head title="Giấy chứng nhận" />
            <div className="bg-white">
                <section className="border-b border-border pb-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-4xl">
                            <p className="broadsheet-kicker">
                                Khu vực sinh viên
                            </p>
                            <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-primary sm:text-[56px]">
                                Giấy chứng nhận
                            </h1>
                            <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">
                                Theo dõi toàn bộ chứng nhận điện tử đã được cấp,
                                tra cứu lại mã xác thực và tải bản PDF khi cần
                                nộp hồ sơ học tập hoặc hoạt động ngoại khóa.
                            </p>
                        </div>

                        <div className="grid w-full gap-3 xl:max-w-[520px] xl:grid-cols-[minmax(0,1fr)_180px]">
                            <label className="relative">
                                <span className="sr-only">
                                    Tìm kiếm chứng nhận
                                </span>
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                    strokeWidth={1.75}
                                />
                                <input
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    placeholder="Tìm theo mã hoặc tên chiến dịch"
                                    className="broadsheet-input h-12 w-full pl-10"
                                    type="text"
                                />
                            </label>

                            <label className="inline-flex items-center gap-2 border border-input px-4 py-3 text-[14px] text-primary">
                                <SlidersHorizontal
                                    className="size-4"
                                    strokeWidth={1.75}
                                />
                                <span className="broadsheet-kicker text-primary">
                                    Năm cấp
                                </span>
                                <select
                                    aria-label="Lọc theo năm"
                                    value={selectedYear}
                                    onChange={(event) =>
                                        setSelectedYear(event.target.value)
                                    }
                                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none"
                                >
                                    <option value="">Tất cả năm</option>
                                    {yearOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="border-b border-border py-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="border border-input p-4">
                                <p className="broadsheet-kicker">
                                    Đã phát hành
                                </p>
                                <p className="mt-3 text-[34px] font-bold text-primary">
                                    {totalIssuedCertificates}
                                </p>
                                <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                                    Chứng nhận đang có hiệu lực trong hồ sơ sinh
                                    viên
                                </p>
                            </div>

                            <div className="border border-input p-4">
                                <p className="broadsheet-kicker">
                                    Giờ ghi nhận
                                </p>
                                <p className="mt-3 text-[34px] font-bold text-primary">
                                    {totalCertifiedHours}
                                </p>
                                <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                                    Tổng giờ tình nguyện đã được xác thực
                                </p>
                            </div>

                            <div className="border border-input p-4">
                                <p className="broadsheet-kicker">Chờ cấp mới</p>
                                <p className="mt-3 text-[34px] font-bold text-destructive">
                                    {pendingCertificates}
                                </p>
                                <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                                    Hoạt động đã hoàn thành nhưng chưa phát hành
                                    chứng nhận
                                </p>
                            </div>
                        </div>

                        <label className="inline-flex items-center gap-2 border border-input px-4 py-3 text-[14px] text-primary">
                            <Award className="size-4" strokeWidth={1.75} />
                            <span className="broadsheet-kicker text-primary">
                                Sắp xếp
                            </span>
                            <select
                                aria-label="Sắp xếp chứng nhận"
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(event.target.value as SortOption)
                                }
                                className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none"
                            >
                                {sortOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                <section className="pt-8">
                    {isLoading ? (
                        <CertificateLoadingState />
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="text-[14px] leading-6 text-muted-foreground">
                                    Hiển thị {visibleCertificates.length} trên{' '}
                                    {certificates.length} chứng nhận đã ghi
                                    nhận.
                                </div>
                                <div className="text-[14px] leading-6 text-muted-foreground">
                                    Cấp gần nhất:{' '}
                                    <span className="font-semibold text-primary">
                                        {latestIssuedCertificate
                                            ? formatDate(
                                                  latestIssuedCertificate.issuedAt ??
                                                      latestIssuedCertificate.createdAt,
                                              )
                                            : 'Chưa có dữ liệu'}
                                    </span>
                                </div>
                            </div>

                            {visibleCertificates.length > 0 ? (
                                <div className="grid gap-6 pt-8 md:grid-cols-2 xl:grid-cols-3">
                                    {visibleCertificates.map((certificate) => (
                                        <CertificateCard
                                            key={certificate.id}
                                            certificate={certificate}
                                            onShare={handleShare}
                                        />
                                    ))}
                                    {pendingCertificates > 0 ? (
                                        <PendingCard
                                            count={pendingCertificates}
                                        />
                                    ) : null}
                                </div>
                            ) : (
                                <CertificateEmptyState />
                            )}

                            <section className="mt-10 border border-primary bg-primary p-6 text-white">
                                <p className="broadsheet-kicker text-white/70">
                                    Tổng kết thành tích
                                </p>
                                <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
                                    <div>
                                        <h2 className="font-heading text-[36px] leading-[1.1] font-bold">
                                            Hồ sơ của bạn đang ghi nhận{' '}
                                            {totalCertifiedHours} giờ tình
                                            nguyện từ {totalCampaigns} chiến
                                            dịch đã tham gia.
                                        </h2>
                                        <p className="mt-4 max-w-3xl text-[16px] leading-7 text-white/80">
                                            Giữ lại các mã chứng nhận này để tra
                                            cứu, nộp minh chứng rèn luyện và bổ
                                            sung vào hồ sơ ứng tuyển học bổng
                                            hoặc hoạt động Đoàn - Hội.
                                        </p>
                                        <a
                                            href={paths.app.myImpact.getHref()}
                                            className="mt-6 inline-flex h-12 items-center justify-center border border-white bg-white px-6 text-[16px] font-semibold text-primary transition hover:bg-transparent hover:text-white"
                                        >
                                            Mở lịch sử hoạt động
                                        </a>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="border border-white/20 p-4">
                                            <p className="broadsheet-kicker text-white/70">
                                                Chứng nhận
                                            </p>
                                            <p className="mt-3 text-[32px] font-bold">
                                                {totalIssuedCertificates}
                                            </p>
                                        </div>
                                        <div className="border border-white/20 p-4">
                                            <p className="broadsheet-kicker text-white/70">
                                                Chờ cấp
                                            </p>
                                            <p className="mt-3 text-[32px] font-bold">
                                                {pendingCertificates}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </section>
            </div>
        </>
    );
};

const CertificateCard = ({
    certificate,
    onShare,
}: {
    certificate: CertificateItem;
    onShare: (certificateNo: string) => Promise<void>;
}) => {
    const tone = getPreviewTone(certificate.certificateNo);
    const statusText =
        statusLabel[certificate.status] ?? toDisplayText(certificate.status);
    const issuedLabel = formatDate(
        certificate.issuedAt ?? certificate.createdAt,
    );
    const canDownload = Boolean(
        certificate.fileUrl && certificate.status !== 'REVOKED',
    );

    return (
        <article className="border border-input bg-white">
            <div
                className={`aspect-[1.414/1] border-b ${tone.frame} ${tone.surface} p-4`}
            >
                <div
                    className={`flex h-full flex-col justify-between border ${tone.inner} bg-white p-5`}
                >
                    <div className="flex items-start justify-between">
                        <p
                            className={`text-[12px] font-semibold uppercase tracking-[0.16em] ${tone.accent}`}
                        >
                            BK Volunteers
                        </p>
                        <Award
                            className={`size-5 ${tone.accent}`}
                            strokeWidth={1.5}
                        />
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Giấy chứng nhận điện tử
                        </p>
                        <p className="text-[20px] font-bold leading-8 text-primary">
                            {toDisplayTitle(certificate.campaignTitle)}
                        </p>
                        <p className="text-[13px] leading-6 text-muted-foreground">
                            {certificate.templateName}
                        </p>
                    </div>
                    <div className="flex items-end justify-between text-[12px] text-muted-foreground">
                        <span>{issuedLabel}</span>
                        <span className="font-semibold">
                            {certificate.certificateNo}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div>
                    <h3 className="text-[28px] font-semibold leading-[1.2] text-primary">
                        {toDisplayTitle(certificate.campaignTitle)}
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-[14px] leading-6 text-muted-foreground">
                        <CalendarDays className="size-4" strokeWidth={1.75} />
                        Ngày cấp: {issuedLabel}
                    </div>
                    {certificate.moduleTitle ? (
                        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                            Hạng mục: {toDisplayTitle(certificate.moduleTitle)}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 border border-input bg-muted px-4 py-3">
                    <div>
                        <p className="broadsheet-kicker">Mã chứng chỉ</p>
                        <p className="mt-2 text-[24px] font-bold tracking-[0.08em] text-primary">
                            {certificate.certificateNo}
                        </p>
                    </div>
                    <span
                        className={`inline-flex border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] ${getStatusClassName(
                            certificate.status,
                        )}`}
                    >
                        {statusText}
                    </span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-3">
                    {canDownload ? (
                        <a
                            href={certificate.fileUrl ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-12 items-center justify-center gap-2 border border-primary bg-primary px-5 text-[16px] font-semibold text-white transition hover:bg-[#1F2937]"
                        >
                            <Download className="size-4" strokeWidth={1.75} />
                            Tải PDF
                        </a>
                    ) : (
                        <div className="inline-flex h-12 items-center justify-center border border-input bg-muted px-5 text-[14px] font-semibold text-muted-foreground">
                            Chưa khả dụng
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => void onShare(certificate.certificateNo)}
                        className="inline-flex h-12 w-14 items-center justify-center border border-input bg-white text-primary transition hover:bg-muted"
                        aria-label={`Chia sẻ ${certificate.certificateNo}`}
                    >
                        <Copy className="size-4" strokeWidth={1.75} />
                    </button>
                </div>
            </div>
        </article>
    );
};

const PendingCard = ({ count }: { count: number }) => (
    <article className="flex min-h-[520px] flex-col items-center justify-center border border-dashed border-input bg-muted p-6 text-center">
        <FileSearch className="size-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-5 text-[28px] font-semibold leading-[1.2] text-primary">
            Đang chờ cấp mới
        </p>
        <p className="mt-3 max-w-sm text-[16px] leading-7 text-muted-foreground">
            Hiện có {count} hoạt động đã hoàn thành nhưng chứng nhận điện tử
            chưa được phát hành.
        </p>
    </article>
);

const CertificateLoadingState = () => (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
            <div
                key={index}
                className="min-h-[520px] animate-pulse border border-border bg-muted"
            />
        ))}
    </div>
);

const CertificateEmptyState = () => (
    <div className="flex flex-col items-center justify-center border border-dashed border-input bg-muted px-6 py-16 text-center">
        <Award className="size-10 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="mt-5 text-[32px] font-semibold leading-[1.2] text-primary">
            Chưa có chứng nhận phù hợp
        </h2>
        <p className="mt-3 max-w-xl text-[16px] leading-7 text-muted-foreground">
            Hãy thử thay đổi bộ lọc tìm kiếm hoặc hoàn thành thêm chiến dịch để
            hệ thống phát hành chứng nhận điện tử mới cho hồ sơ của bạn.
        </p>
    </div>
);
