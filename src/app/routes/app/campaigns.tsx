import * as React from 'react';
import {
    CircleDollarSign,
    Megaphone,
    RefreshCw,
    Rocket,
    Send,
    Settings2,
    ShieldCheck,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    createCampaignModule,
    createManagedCampaign,
    getFundraisingDonations,
    getFundraisingModule,
    getManagedCampaignDetail,
    getManagedCampaigns,
    publishCampaign,
    rejectFundraisingDonation,
    submitCampaignReview,
    updateFundraisingConfig,
    verifyFundraisingDonation,
    type FundraisingDonationItem,
    type ManagedCampaignDetail,
    type ManagedCampaignItem,
} from '@/features/campaign/api/sprint2';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import type { ModuleType } from '@/types/api';

const moduleTypeLabel: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ hiện kim',
    item_donation: 'Quyên góp hiện vật',
    event: 'Tuyển tình nguyện viên',
};

const roleLabel: Record<string, string> = {
    STUDENT: 'Sinh viên',
    ORG_ADMIN: 'Quản trị đơn vị',
    ORG_MEMBER: 'Thành viên đơn vị',
    SCHOOL_REVIEWER: 'Người duyệt cấp trường',
    SCHOOL_ADMIN: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

export const CampaignsRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();

    const [campaigns, setCampaigns] = React.useState<ManagedCampaignItem[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);
    const [detail, setDetail] = React.useState<ManagedCampaignDetail | null>(null);
    const [loadingList, setLoadingList] = React.useState(false);

    const [fundraisingModuleId, setFundraisingModuleId] = React.useState('');
    const [fundraisingDonations, setFundraisingDonations] = React.useState<FundraisingDonationItem[]>(
        [],
    );
    const [fundraisingConfig, setFundraisingConfig] = React.useState({
        target_amount: 0,
        receiver_name: '',
        bank_name: '',
        bank_account_no: '',
        currency: 'VND',
        sepay_enabled: false,
        sepay_account_id: '',
    });

    const [createForm, setCreateForm] = React.useState({
        title: '',
        summary: '',
        description: '',
        scope_type: 'PUBLIC' as 'FACULTY' | 'SCHOOL' | 'PUBLIC',
        start_at: '',
        end_at: '',
    });

    const [moduleForm, setModuleForm] = React.useState({
        type: 'fundraising' as ModuleType,
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        target_amount: 0,
        receiver_name: '',
        bank_name: '',
        bank_account_no: '',
        receiver_address: '',
        receiver_contact: '',
        quota: 0,
        location: '',
    });

    const role = user.data?.role;
    const canManageCampaign = role === ROLES.ORG_ADMIN || role === ROLES.ORG_MEMBER;
    const canMutateCampaign = role === ROLES.ORG_ADMIN;

    const loadCampaigns = React.useCallback(async () => {
        if (!canManageCampaign) return;
        setLoadingList(true);
        try {
            const data = await getManagedCampaigns({ page: 1, limit: 50 });
            setCampaigns(data);
            if (!selectedCampaignId && data.length > 0) {
                setSelectedCampaignId(data[0].id);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không tải được danh sách chiến dịch',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        } finally {
            setLoadingList(false);
        }
    }, [addNotification, canManageCampaign, selectedCampaignId]);

    const loadCampaignDetail = React.useCallback(
        async (campaignId: string) => {
            try {
                const data = await getManagedCampaignDetail(campaignId);
                setDetail(data);
                const fundraisingModule = data.modules.find((item) => item.type === 'fundraising');
                setFundraisingModuleId(fundraisingModule?.id ?? '');
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Không tải được chi tiết chiến dịch',
                    message: error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            }
        },
        [addNotification],
    );

    const loadFundraisingData = React.useCallback(
        async (moduleId: string) => {
            if (!moduleId) return;
            try {
                const [moduleDetail, donations] = await Promise.all([
                    getFundraisingModule(moduleId),
                    getFundraisingDonations(moduleId, { page: 1, limit: 100 }),
                ]);

                setFundraisingDonations(donations);

                const config = moduleDetail.config ?? {};
                setFundraisingConfig({
                    target_amount: Number(config.target_amount ?? 0),
                    receiver_name: String(config.receiver_name ?? ''),
                    bank_name: String(config.bank_name ?? ''),
                    bank_account_no: String(config.bank_account_no ?? ''),
                    currency: String(config.currency ?? 'VND'),
                    sepay_enabled: Boolean(config.sepay_enabled),
                    sepay_account_id: String(config.sepay_account_id ?? ''),
                });
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Không tải được hạng mục gây quỹ',
                    message: error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            }
        },
        [addNotification],
    );

    React.useEffect(() => {
        void loadCampaigns();
    }, [loadCampaigns]);

    React.useEffect(() => {
        if (!selectedCampaignId) return;
        void loadCampaignDetail(selectedCampaignId);
    }, [loadCampaignDetail, selectedCampaignId]);

    React.useEffect(() => {
        if (!fundraisingModuleId) {
            setFundraisingDonations([]);
            return;
        }
        void loadFundraisingData(fundraisingModuleId);
    }, [fundraisingModuleId, loadFundraisingData]);

    const onCreateCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canMutateCampaign) return;

        try {
            const payload = {
                ...createForm,
                start_at: new Date(createForm.start_at).toISOString(),
                end_at: new Date(createForm.end_at).toISOString(),
            };
            const created = await createManagedCampaign(payload);
            addNotification({
                type: 'success',
                title: 'Đã tạo chiến dịch',
                message: `Mã chiến dịch: #${created.id}`,
            });
            setCreateForm((current) => ({
                ...current,
                title: '',
                summary: '',
                description: '',
            }));
            await loadCampaigns();
            setSelectedCampaignId(created.id);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo chiến dịch thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onCreateModule = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canMutateCampaign || !detail) return;

        const settings =
            moduleForm.type === 'fundraising'
                ? {
                      target_amount: moduleForm.target_amount,
                      receiver_name: moduleForm.receiver_name,
                      bank_name: moduleForm.bank_name,
                      bank_account_no: moduleForm.bank_account_no,
                  }
                : moduleForm.type === 'item_donation'
                  ? {
                        receiver_address: moduleForm.receiver_address,
                        receiver_contact: moduleForm.receiver_contact,
                    }
                  : {
                        quota: moduleForm.quota,
                        location: moduleForm.location,
                    };

        try {
            await createCampaignModule(detail.id, {
                type: moduleForm.type,
                title: moduleForm.title,
                description: moduleForm.description,
                start_at: new Date(moduleForm.start_at).toISOString(),
                end_at: new Date(moduleForm.end_at).toISOString(),
                settings,
            });
            addNotification({
                type: 'success',
                title: 'Đã thêm hạng mục',
                message: 'Cấu hình hạng mục đã được lưu',
            });
            await loadCampaignDetail(detail.id);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo hạng mục thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSubmitReview = async () => {
        if (!canMutateCampaign || !detail) return;
        try {
            await submitCampaignReview(detail.id);
            addNotification({
                type: 'success',
                title: 'Đã gửi duyệt',
                message: 'Chiến dịch đã chuyển sang trạng thái đã gửi duyệt',
            });
            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gửi duyệt thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onPublish = async () => {
        if (!canMutateCampaign || !detail) return;
        try {
            await publishCampaign(detail.id);
            addNotification({
                type: 'success',
                title: 'Đã công khai chiến dịch',
                message: 'Chiến dịch đã chuyển sang trạng thái công khai',
            });
            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Công khai chiến dịch thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSaveFundraisingConfig = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canMutateCampaign || !fundraisingModuleId) return;

        try {
            await updateFundraisingConfig(fundraisingModuleId, {
                ...fundraisingConfig,
                sepay_account_id: fundraisingConfig.sepay_enabled
                    ? fundraisingConfig.sepay_account_id
                    : null,
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu cấu hình gây quỹ',
                message: 'Cập nhật thành công hạng mục gây quỹ',
            });
            await loadFundraisingData(fundraisingModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Lưu cấu hình thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onVerifyDonation = async (donationId: string) => {
        try {
            await verifyFundraisingDonation(donationId);
            addNotification({
                type: 'success',
                title: 'Xác minh thành công',
                message: `Khoản đóng góp #${donationId} đã được xác minh`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xác minh thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectDonation = async (donationId: string) => {
        const reason = window.prompt('Nhập lý do từ chối khoản đóng góp:');
        if (!reason) return;
        try {
            await rejectFundraisingDonation(donationId, reason);
            addNotification({
                type: 'success',
                title: 'Đã từ chối khoản đóng góp',
                message: `Khoản đóng góp #${donationId} đã bị từ chối`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Từ chối thất bại',
                message: error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    if (!user.data) return null;

    if (!canManageCampaign) {
        return (
            <ContentLayout title="Vận Hành Chiến Dịch">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền truy cập khu vực quản trị chiến dịch.
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Vận Hành Chiến Dịch">
            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Tổng chiến dịch
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{campaigns.length}</p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Trạng thái hiện tại
                        </p>
                        <div className="mt-2">
                            {detail ? <StatusBadge status={detail.status} /> : <span className="text-sm text-slate-600">-</span>}
                        </div>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Vai trò vận hành
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {roleLabel[role ?? ''] ?? role}
                        </p>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900">Danh sách chiến dịch</h2>
                            <Button type="button" variant="outline" onClick={() => void loadCampaigns()}>
                                <RefreshCw className="mr-1 size-4" />
                                Làm mới
                            </Button>
                        </div>
                        {loadingList ? <p className="text-sm text-slate-600">Đang tải...</p> : null}
                        <div className="space-y-2">
                            {campaigns.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    onClick={() => setSelectedCampaignId(campaign.id)}
                                    className={`w-full rounded-lg border p-3 text-left transition ${
                                        selectedCampaignId === campaign.id
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                        {campaign.title}
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        {canMutateCampaign ? (
                            <form
                                onSubmit={onCreateCampaign}
                                className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <Megaphone className="size-4 text-blue-700" />
                                    <h3 className="text-sm font-semibold text-slate-900">Tạo chiến dịch nháp</h3>
                                </div>
                                <div className="grid gap-3">
                                    <Input
                                        placeholder="Tiêu đề chiến dịch"
                                        value={createForm.title}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                title: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Tóm tắt chiến dịch"
                                        value={createForm.summary}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                summary: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Mô tả"
                                        value={createForm.description}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                description: event.target.value,
                                            }))
                                        }
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            type="datetime-local"
                                            value={createForm.start_at}
                                            onChange={(event) =>
                                                setCreateForm((current) => ({
                                                    ...current,
                                                    start_at: event.target.value,
                                                }))
                                            }
                                        />
                                        <Input
                                            type="datetime-local"
                                            value={createForm.end_at}
                                            onChange={(event) =>
                                                setCreateForm((current) => ({
                                                    ...current,
                                                    end_at: event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <Button type="submit">Tạo chiến dịch</Button>
                                </div>
                            </form>
                        ) : null}

                        {detail ? (
                            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{detail.title}</h3>
                                        <p className="mt-1 text-sm text-slate-600">{detail.summary}</p>
                                    </div>
                                    <StatusBadge status={detail.status} />
                                </div>

                                {canMutateCampaign ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" onClick={onSubmitReview}>
                                            <Send className="mr-1 size-4" />
                                            Gửi duyệt
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onPublish}
                                            disabled={detail.status !== 'APPROVED'}
                                        >
                                            <Rocket className="mr-1 size-4" />
                                            Công khai
                                        </Button>
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900">Danh sách hạng mục</h4>
                                    {detail.modules.map((module) => (
                                        <div
                                            key={module.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {module.title}
                                                </p>
                                                <StatusBadge status={module.status} />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {moduleTypeLabel[module.type]}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {canMutateCampaign ? (
                                    <form onSubmit={onCreateModule} className="space-y-3 border-t border-slate-200 pt-4">
                                        <div className="flex items-center gap-2">
                                            <Settings2 className="size-4 text-blue-700" />
                                            <h4 className="text-sm font-semibold text-slate-900">Thêm hạng mục</h4>
                                        </div>
                                        <select
                                            value={moduleForm.type}
                                            onChange={(event) =>
                                                setModuleForm((current) => ({
                                                    ...current,
                                                    type: event.target.value as ModuleType,
                                                }))
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                        >
                                            <option value="fundraising">Gây quỹ hiện kim</option>
                                            <option value="item_donation">Quyên góp hiện vật</option>
                                            <option value="event">Tuyển tình nguyện viên</option>
                                        </select>
                                        <Input
                                            placeholder="Tiêu đề hạng mục"
                                            value={moduleForm.title}
                                            onChange={(event) =>
                                                setModuleForm((current) => ({
                                                    ...current,
                                                    title: event.target.value,
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="Mô tả hạng mục"
                                            value={moduleForm.description}
                                            onChange={(event) =>
                                                setModuleForm((current) => ({
                                                    ...current,
                                                    description: event.target.value,
                                                }))
                                            }
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Input
                                                type="datetime-local"
                                                value={moduleForm.start_at}
                                                onChange={(event) =>
                                                    setModuleForm((current) => ({
                                                        ...current,
                                                        start_at: event.target.value,
                                                    }))
                                                }
                                            />
                                            <Input
                                                type="datetime-local"
                                                value={moduleForm.end_at}
                                                onChange={(event) =>
                                                    setModuleForm((current) => ({
                                                        ...current,
                                                        end_at: event.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        {moduleForm.type === 'fundraising' ? (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Mục tiêu gây quỹ"
                                                    value={moduleForm.target_amount || ''}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            target_amount: Number(event.target.value || 0),
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Tên người thụ hưởng"
                                                    value={moduleForm.receiver_name}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            receiver_name: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Ngân hàng"
                                                    value={moduleForm.bank_name}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            bank_name: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Số tài khoản"
                                                    value={moduleForm.bank_account_no}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            bank_account_no: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        ) : null}

                                        {moduleForm.type === 'item_donation' ? (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    placeholder="Địa chỉ tiếp nhận"
                                                    value={moduleForm.receiver_address}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            receiver_address: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Liên hệ tiếp nhận"
                                                    value={moduleForm.receiver_contact}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            receiver_contact: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        ) : null}

                                        {moduleForm.type === 'event' ? (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Số lượng quota"
                                                    value={moduleForm.quota || ''}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            quota: Number(event.target.value || 0),
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Địa điểm"
                                                    value={moduleForm.location}
                                                    onChange={(event) =>
                                                        setModuleForm((current) => ({
                                                            ...current,
                                                            location: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        ) : null}

                                        <Button type="submit">Tạo hạng mục</Button>
                                    </form>
                                ) : null}

                                {detail.modules.some((module) => module.type === 'fundraising') ? (
                                    <div className="space-y-4 border-t border-slate-200 pt-4">
                                        <div className="flex items-center gap-2">
                                            <CircleDollarSign className="size-4 text-blue-700" />
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Vận hành gây quỹ
                                            </h4>
                                        </div>
                                        <select
                                            value={fundraisingModuleId}
                                            onChange={(event) => setFundraisingModuleId(event.target.value)}
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                        >
                                            <option value="">Chọn hạng mục gây quỹ</option>
                                            {detail.modules
                                                .filter((module) => module.type === 'fundraising')
                                                .map((module) => (
                                                    <option key={module.id} value={module.id}>
                                                        {module.title}
                                                    </option>
                                                ))}
                                        </select>

                                        {fundraisingModuleId && canMutateCampaign ? (
                                            <form
                                                onSubmit={onSaveFundraisingConfig}
                                                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                            >
                                                <Input
                                                    type="number"
                                                    placeholder="Mục tiêu gây quỹ"
                                                    value={fundraisingConfig.target_amount || ''}
                                                    onChange={(event) =>
                                                        setFundraisingConfig((current) => ({
                                                            ...current,
                                                            target_amount: Number(event.target.value || 0),
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Tên người nhận"
                                                    value={fundraisingConfig.receiver_name}
                                                    onChange={(event) =>
                                                        setFundraisingConfig((current) => ({
                                                            ...current,
                                                            receiver_name: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Ngân hàng"
                                                    value={fundraisingConfig.bank_name}
                                                    onChange={(event) =>
                                                        setFundraisingConfig((current) => ({
                                                            ...current,
                                                            bank_name: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <Input
                                                    placeholder="Số tài khoản"
                                                    value={fundraisingConfig.bank_account_no}
                                                    onChange={(event) =>
                                                        setFundraisingConfig((current) => ({
                                                            ...current,
                                                            bank_account_no: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={fundraisingConfig.sepay_enabled}
                                                        onChange={(event) =>
                                                            setFundraisingConfig((current) => ({
                                                                ...current,
                                                                sepay_enabled: event.target.checked,
                                                            }))
                                                        }
                                                    />
                                                    Bật SePay
                                                </label>
                                                {fundraisingConfig.sepay_enabled ? (
                                                    <Input
                                                        placeholder="Mã tài khoản SePay"
                                                        value={fundraisingConfig.sepay_account_id}
                                                        onChange={(event) =>
                                                            setFundraisingConfig((current) => ({
                                                                ...current,
                                                                sepay_account_id: event.target.value,
                                                            }))
                                                        }
                                                    />
                                                ) : null}
                                                <Button type="submit">Lưu cấu hình</Button>
                                            </form>
                                        ) : null}

                                        <div className="space-y-2">
                                            {fundraisingDonations.map((donation) => (
                                                <div
                                                    key={donation.id}
                                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {donation.donor_name}
                                                            </p>
                                                            <p className="text-xs text-slate-600">
                                                                {formatCurrency(donation.amount)}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={donation.status} />
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                !canMutateCampaign ||
                                                                !['PENDING', 'MATCHED'].includes(donation.status)
                                                            }
                                                            onClick={() => void onVerifyDonation(donation.id)}
                                                        >
                                                            <ShieldCheck className="mr-1 size-4" />
                                                            Xác minh
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                !canMutateCampaign ||
                                                                !['PENDING', 'MATCHED'].includes(donation.status)
                                                            }
                                                            onClick={() => void onRejectDonation(donation.id)}
                                                        >
                                                            Từ chối
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {fundraisingDonations.length === 0 ? (
                                                <p className="text-sm text-slate-600">
                                                    Chưa có khoản đóng góp trong hạng mục này.
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                                Chưa có chiến dịch để vận hành. Hãy tạo chiến dịch mới hoặc chọn chiến dịch từ danh sách.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </ContentLayout>
    );
};
