import * as React from 'react';
import {
    ArrowLeft,
    CalendarDays,
    Info,
    MapPin,
    Phone,
    Send,
    Users,
} from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import { createEventRegistration } from '@/features/campaign/api/events';
import { getPublicCampaignDetail } from '@/features/campaign/api/public';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { PublicCampaignDetail } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const campaignStatusLabels: Record<string, string> = {
    ONGOING: 'Đang diễn ra',
    PUBLISHED: 'Sắp diễn ra',
    ENDED: 'Đã kết thúc',
    ARCHIVED: 'Lưu trữ',
};

const textareaClassName =
    'min-h-32 w-full border border-input bg-white px-3 py-3 text-[16px] leading-7 text-primary outline-none transition focus:border-2 focus:border-primary';

const noteSurfaceClassName =
    'border border-input bg-muted p-4 text-[14px] leading-7 text-muted-foreground';

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return dateFormatter.format(date);
};

const readSettingText = (settings: Record<string, unknown>, key: string) => {
    const value = settings[key];
    return typeof value === 'string' ? value.trim() : '';
};

const readSettingNumber = (settings: Record<string, unknown>, key: string) => {
    const value = Number(settings[key] ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
};

const getStudentFullName = (
    user: ReturnType<typeof useUser>['data'] | null | undefined,
) => {
    const fullName = String(user?.fullName ?? '').trim();
    if (fullName) {
        return fullName;
    }

    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
};

const getStudentCode = (
    user: ReturnType<typeof useUser>['data'] | null | undefined,
) => String(user?.studentCode ?? user?.mssv ?? '').trim();

const parseSkills = (value: string) =>
    value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

export const CampaignRegistrationRoute = () => {
    const { slug, moduleId } = useParams();
    const user = useUser();
    const { addNotification } = useNotifications();
    const [campaign, setCampaign] = React.useState<PublicCampaignDetail | null>(
        null,
    );
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [form, setForm] = React.useState({
        phone: user.data?.phone ?? '',
        skillsNote: '',
        committed: false,
    });
    const [formErrors, setFormErrors] = React.useState({
        phone: '',
        committed: '',
    });

    const isStudent = user.data?.role === ROLES.SINHVIEN;
    const studentFullName = getStudentFullName(user.data);
    const studentCode = getStudentCode(user.data);

    React.useEffect(() => {
        setForm((current) => ({
            ...current,
            phone: current.phone || user.data?.phone || '',
        }));
    }, [user.data?.phone]);

    React.useEffect(() => {
        if (!slug) {
            setIsLoading(false);
            setError('Đường dẫn chiến dịch không hợp lệ.');
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        getPublicCampaignDetail(slug)
            .then((result) => {
                if (!isMounted) {
                    return;
                }

                setCampaign(result);
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }

                setError('Không thể tải phiếu đăng ký tham gia.');
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [slug]);

    const eventModule = React.useMemo(
        () =>
            campaign?.modules.find(
                (module) => module.id === moduleId && module.type === 'event',
            ) ?? null,
        [campaign, moduleId],
    );

    if (!isStudent) {
        return (
            <Navigate
                to={
                    slug
                        ? paths.app.campaigns.detail.getHref(slug)
                        : paths.app.campaigns.getHref()
                }
                replace
            />
        );
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!moduleId || !eventModule) {
            return;
        }

        const trimmedPhone = form.phone.trim();
        const trimmedSkillsNote = form.skillsNote.trim();
        const nextErrors = {
            phone: trimmedPhone ? '' : 'Vui lòng nhập số điện thoại liên lạc.',
            committed: form.committed
                ? ''
                : 'Bạn cần xác nhận cam kết trước khi gửi đăng ký.',
        };

        setFormErrors(nextErrors);

        if (nextErrors.phone || nextErrors.committed) {
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await createEventRegistration(moduleId, {
                answers: {
                    phone: trimmedPhone,
                    note: trimmedSkillsNote,
                    skills: parseSkills(trimmedSkillsNote),
                    student_name: studentFullName,
                    student_code: studentCode,
                },
            });

            addNotification({
                type: 'success',
                title: 'Gửi đăng ký thành công',
                message:
                    result.status === 'APPROVED'
                        ? 'Bạn đã được duyệt tham gia ngay.'
                        : 'Hồ sơ tham gia đã được ghi nhận và đang chờ xét duyệt.',
            });

            setForm({
                phone: trimmedPhone,
                skillsNote: '',
                committed: false,
            });
            setFormErrors({
                phone: '',
                committed: '',
            });
        } catch (submitError) {
            addNotification({
                type: 'error',
                title: 'Gửi đăng ký thất bại',
                message:
                    submitError instanceof Error
                        ? submitError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const location = eventModule
        ? readSettingText(eventModule.settings, 'location')
        : '';
    const quota = eventModule
        ? readSettingNumber(eventModule.settings, 'quota')
        : 0;
    const currentRegistrations = eventModule?.progress?.current ?? 0;
    const campaignQuote =
        toDisplayText(campaign?.summary ?? campaign?.description) ||
        'Hoàn tất hồ sơ để ban tổ chức xem xét và phản hồi trong đợt tuyển tình nguyện viên hiện tại.';

    return (
        <>
            <Head
                title={
                    campaign?.title
                        ? `Đăng ký tham gia | ${toDisplayTitle(campaign.title)}`
                        : 'Đăng ký tham gia'
                }
            />
            <div className="bg-white">
                <section className="border-b border-border pb-6">
                    <Link
                        to={
                            slug
                                ? paths.app.campaigns.detail.getHref(slug)
                                : paths.app.campaigns.getHref()
                        }
                        className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition hover:text-primary"
                    >
                        <ArrowLeft className="size-4" strokeWidth={1.75} />
                        Quay lại chi tiết chiến dịch
                    </Link>
                    <div className="mt-5 max-w-4xl">
                        <p className="broadsheet-kicker">Khu vực sinh viên</p>
                        <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-primary sm:text-[56px]">
                            Đăng ký tham gia
                        </h1>
                        <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">
                            Kiểm tra thông tin cá nhân và hoàn tất phiếu đăng ký
                            trước khi ban tổ chức chốt danh sách tình nguyện
                            viên.
                        </p>
                    </div>
                </section>

                <section className="pt-8">
                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && !campaign ? (
                        <EmptyState title="Không tìm thấy chiến dịch" />
                    ) : null}
                    {!isLoading && !error && campaign && !eventModule ? (
                        <EmptyState
                            title="Hạng mục không khả dụng"
                            description="Phiếu đăng ký này không còn tồn tại hoặc chiến dịch chưa mở tuyển tình nguyện viên."
                        />
                    ) : null}

                    {!isLoading &&
                    !error &&
                    campaign &&
                    eventModule &&
                    eventModule.cta.enabled ? (
                        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
                            <aside className="space-y-5">
                                <article className="border border-input bg-white">
                                    <div className="aspect-[4/3] border-b border-input bg-muted">
                                        {campaign.cover_image_url ? (
                                            <img
                                                src={campaign.cover_image_url}
                                                alt={toDisplayTitle(
                                                    campaign.title,
                                                )}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center px-6 text-center font-heading text-[28px] font-bold text-primary">
                                                BK Volunteers
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-5 p-5">
                                        <div className="border-b border-border pb-4">
                                            <span className="inline-flex border border-destructive px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-destructive">
                                                {campaignStatusLabels[
                                                    campaign.status
                                                ] ?? 'Đang mở đăng ký'}
                                            </span>
                                            <h2 className="mt-3 font-heading text-[30px] leading-[1.15] font-bold text-primary">
                                                {toDisplayTitle(campaign.title)}
                                            </h2>
                                            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                                                {toDisplayTitle(
                                                    eventModule.title,
                                                )}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <CalendarDays
                                                    className="mt-0.5 size-4 text-primary"
                                                    strokeWidth={1.75}
                                                />
                                                <div>
                                                    <p className="broadsheet-kicker">
                                                        Thời gian
                                                    </p>
                                                    <p className="mt-2 text-[15px] leading-7 text-primary">
                                                        {formatDate(
                                                            eventModule.start_at,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatDate(
                                                            eventModule.end_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <MapPin
                                                    className="mt-0.5 size-4 text-primary"
                                                    strokeWidth={1.75}
                                                />
                                                <div>
                                                    <p className="broadsheet-kicker">
                                                        Địa điểm
                                                    </p>
                                                    <p className="mt-2 text-[15px] leading-7 text-primary">
                                                        {location ||
                                                            'Theo thông báo từ ban tổ chức'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Users
                                                    className="mt-0.5 size-4 text-primary"
                                                    strokeWidth={1.75}
                                                />
                                                <div>
                                                    <p className="broadsheet-kicker">
                                                        Chỉ tiêu
                                                    </p>
                                                    <p className="mt-2 text-[15px] leading-7 text-primary">
                                                        {quota > 0
                                                            ? `${currentRegistrations.toLocaleString('vi-VN')}/${quota.toLocaleString('vi-VN')} tình nguyện viên`
                                                            : `${currentRegistrations.toLocaleString('vi-VN')} hồ sơ đã ghi nhận`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-4">
                                            <p className="text-[15px] leading-7 italic text-muted-foreground">
                                                "{campaignQuote}"
                                            </p>
                                        </div>
                                    </div>
                                </article>

                                <div className="border border-input bg-muted p-4">
                                    <p className="broadsheet-kicker">
                                        Đơn vị tổ chức
                                    </p>
                                    <p className="mt-2 text-[15px] font-semibold text-primary">
                                        {toDisplayTitle(
                                            campaign.organization.name,
                                        )}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                                        {toDisplayText(
                                            eventModule.description ??
                                                campaign.summary,
                                        )}
                                    </p>
                                </div>
                            </aside>

                            <section className="border border-input bg-white p-6 sm:p-8">
                                <div className="border-b border-border pb-6">
                                    <p className="broadsheet-kicker">
                                        Hồ sơ tham gia
                                    </p>
                                    <h2 className="mt-3 font-heading text-[32px] leading-[1.1] font-bold text-primary">
                                        Đăng ký tham gia
                                    </h2>
                                    <p className="mt-3 max-w-3xl text-[16px] leading-7 text-muted-foreground">
                                        Vui lòng kiểm tra thông tin cá nhân và
                                        cung cấp các ghi chú cần thiết để ban tổ
                                        chức sắp xếp tình nguyện viên phù hợp.
                                    </p>
                                </div>

                                <form
                                    className="space-y-6 pt-6"
                                    onSubmit={(event) => void onSubmit(event)}
                                >
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Họ và tên
                                            </p>
                                            <div className="mt-2 border border-input bg-muted px-4 py-3 text-[16px] leading-7 text-primary">
                                                {studentFullName ||
                                                    'Chưa cập nhật'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Mã số sinh viên
                                            </p>
                                            <div className="mt-2 border border-input bg-muted px-4 py-3 text-[16px] leading-7 text-primary">
                                                {studentCode || 'Chưa cập nhật'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="registration-phone"
                                            className="broadsheet-kicker"
                                        >
                                            Số điện thoại
                                        </label>
                                        <div className="relative mt-2">
                                            <Phone
                                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                                strokeWidth={1.75}
                                            />
                                            <Input
                                                id="registration-phone"
                                                type="tel"
                                                value={form.phone}
                                                error={formErrors.phone}
                                                onChange={(event) => {
                                                    setForm((current) => ({
                                                        ...current,
                                                        phone: event.target
                                                            .value,
                                                    }));
                                                    setFormErrors(
                                                        (current) => ({
                                                            ...current,
                                                            phone: '',
                                                        }),
                                                    );
                                                }}
                                                className="pl-10"
                                                placeholder="Nhập số điện thoại liên lạc"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="registration-skills-note"
                                            className="broadsheet-kicker"
                                        >
                                            Kỹ năng đặc biệt / ghi chú
                                        </label>
                                        <textarea
                                            id="registration-skills-note"
                                            value={form.skillsNote}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    skillsNote:
                                                        event.target.value,
                                                }))
                                            }
                                            className={`mt-2 ${textareaClassName}`}
                                            placeholder="Ví dụ: Kỹ năng quay phim, chụp ảnh, sơ cứu hoặc các lưu ý sức khỏe cần ban tổ chức biết."
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="registration-commitment"
                                            className="flex items-start gap-3 border border-input bg-muted p-4"
                                        >
                                            <input
                                                id="registration-commitment"
                                                type="checkbox"
                                                checked={form.committed}
                                                onChange={(event) => {
                                                    setForm((current) => ({
                                                        ...current,
                                                        committed:
                                                            event.target
                                                                .checked,
                                                    }));
                                                    setFormErrors(
                                                        (current) => ({
                                                            ...current,
                                                            committed: '',
                                                        }),
                                                    );
                                                }}
                                                className="mt-1 h-4 w-4 border border-input text-primary focus:ring-0"
                                            />
                                            <span className="text-[14px] leading-7 text-muted-foreground">
                                                Tôi cam kết tham gia đầy đủ các
                                                buổi tập huấn và các hoạt động
                                                chính thức của chiến dịch. Tôi
                                                sẽ chấp hành mọi quy định và
                                                hướng dẫn từ Ban Chỉ huy.
                                            </span>
                                        </label>
                                        {formErrors.committed ? (
                                            <p className="mt-2 text-[12px] leading-5 text-destructive">
                                                {formErrors.committed}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={isSubmitting}
                                            className="sm:min-w-52"
                                        >
                                            <Send
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                            Gửi đăng ký
                                        </Button>
                                        <Link
                                            to={paths.app.campaigns.detail.getHref(
                                                slug ?? '',
                                            )}
                                            className="inline-flex h-12 items-center justify-center border-2 border-primary px-8 text-[16px] font-semibold uppercase tracking-[0.08em] text-primary transition hover:bg-[#F3F4F6]"
                                        >
                                            Hủy bỏ
                                        </Link>
                                    </div>
                                </form>

                                <div
                                    className={`mt-8 flex gap-3 ${noteSurfaceClassName}`}
                                >
                                    <Info
                                        className="mt-1 size-4 shrink-0 text-primary"
                                        strokeWidth={1.75}
                                    />
                                    <p>
                                        Kết quả xét duyệt sẽ được gửi qua email
                                        sinh viên và thông báo trên ứng dụng
                                        trong vòng 3-5 ngày làm việc.
                                    </p>
                                </div>
                            </section>
                        </div>
                    ) : null}

                    {!isLoading &&
                    !error &&
                    campaign &&
                    eventModule &&
                    !eventModule.cta.enabled ? (
                        <EmptyState
                            title="Đợt đăng ký chưa mở"
                            description="Ban tổ chức hiện chưa nhận hồ sơ cho hạng mục này. Vui lòng theo dõi lại ở trang chi tiết chiến dịch."
                        />
                    ) : null}
                </section>
            </div>
        </>
    );
};
