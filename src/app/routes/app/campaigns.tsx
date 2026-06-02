import * as React from 'react';
import {
    ClipboardList,
    Megaphone,
    RefreshCw,
    Send,
    ShieldCheck,
    Trash2,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { ActionDrawer } from '@/components/ui/action-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import {
    getPublicCampaigns,
    type PublicCampaignFilters,
} from '@/features/campaign/api/public';
import {
    createCampaignModule,
    createManagedCampaign,
    deleteManagedCampaign,
    getManagedCampaignDetail,
    getManagedCampaigns,
    publishCampaign,
    submitCampaignReview,
    type ManagedCampaignDetail,
    type ManagedCampaignItem,
} from '@/features/campaign/api/campaign';
import {
    attachFundraisingTransaction,
    getFundraisingDonations,
    getFundraisingModule,
    getFundraisingTransactions,
    rejectFundraisingDonation,
    unmatchFundraisingTransaction,
    updateFundraisingConfig,
    verifyFundraisingDonation,
    type FundraisingDonationItem,
    type FundraisingTransactionItem,
} from '@/features/campaign/api/fundraising';
import {
    approveEventRegistration,
    checkInEventRegistration,
    completeEventRegistration,
    getEventModule,
    getEventRegistrations,
    rejectEventRegistration,
    updateEventConfig,
    type EventRegistrationItem,
} from '@/features/campaign/api/events';
import {
    confirmItemPledge,
    createItemTarget,
    deleteItemTarget,
    getItemPledges,
    getItemTargets,
    handoverItemPledge,
    rejectItemPledge,
    updateItemTarget,
    updateItemDonationConfig,
    type ItemPledgeItem,
    type ItemTargetItem,
} from '@/features/campaign/api/item-donations';
import { FundraisingPanel } from '@/features/campaign/components/fundraising-panel';
import { ItemDonationPanel } from '@/features/campaign/components/item-donation-panel';
import { EventPanel } from '@/features/campaign/components/event-panel';
import { CampaignCard } from '@/features/campaign/components/campaign-card';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import type { Meta, ModuleType, PublicCampaignCard } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const moduleTypeLabel: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ hiện kim',
    item_donation: 'Quyên góp hiện vật',
    event: 'Tuyển tình nguyện viên',
};

const roleLabel: Record<string, string> = {
    SINHVIEN: 'Sinh viên',
    CLB: 'Quản trị đơn vị',
    LCD: 'Người duyệt cấp trường',
    DOANTRUONG: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

const publicModuleOptions: Array<{ value: ModuleType | ''; label: string }> = [
    { value: '', label: 'Tất cả hạng mục' },
    { value: 'fundraising', label: 'Gây quỹ' },
    { value: 'item_donation', label: 'Hiện vật' },
    { value: 'event', label: 'Tình nguyện' },
];

const publicStatusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ONGOING', label: 'Đang diễn ra' },
    { value: 'PUBLISHED', label: 'Đã công khai' },
] as const;

type CampaignActionDialogState =
    | {
          kind: 'reject-donation';
          targetId: string;
          value: string;
      }
    | {
          kind: 'reject-item-pledge';
          targetId: string;
          value: string;
      }
    | {
          kind: 'handover-item-pledge';
          targetId: string;
          value: string;
      }
    | {
          kind: 'reject-registration';
          targetId: string;
          value: string;
      }
    | {
          kind: 'complete-registration';
          targetId: string;
          value: string;
      };

const StudentCampaignDiscovery = () => {
    const [filters, setFilters] = React.useState<PublicCampaignFilters>({
        page: 1,
        limit: 9,
    });
    const [campaignItems, setCampaignItems] = React.useState<
        PublicCampaignCard[]
    >([]);
    const [meta, setMeta] = React.useState<Meta | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setError(null);

        getPublicCampaigns(filters)
            .then((result) => {
                if (!mounted) return;
                setCampaignItems(result.items);
                setMeta(result.meta);
            })
            .catch(() => {
                if (!mounted) return;
                setError('Không thể tải danh sách chiến dịch.');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [filters]);

    const totalPages = meta?.total_pages ?? meta?.totalPages ?? 1;

    return (
        <ContentLayout title="Chiến Dịch Công Khai">
            <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
                        <Input
                            value={filters.q ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    q: event.target.value,
                                    page: 1,
                                }))
                            }
                            placeholder="Tìm theo tên chiến dịch hoặc đơn vị"
                        />
                        <select
                            value={filters.module_type ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    module_type: event.target.value as
                                        | ModuleType
                                        | '',
                                    page: 1,
                                }))
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                            {publicModuleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.status ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: event.target.value as
                                        | 'PUBLISHED'
                                        | 'ONGOING'
                                        | '',
                                    page: 1,
                                }))
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                            {publicStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}
                {!isLoading && !error && campaignItems.length === 0 ? (
                    <EmptyState
                        title="Chưa có chiến dịch phù hợp"
                        description="Thử thay đổi bộ lọc hoặc quay lại sau."
                    />
                ) : null}

                {!isLoading && !error && campaignItems.length > 0 ? (
                    <>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {campaignItems.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    detailHref={paths.app.campaigns.detail.getHref(
                                        campaign.slug,
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                Trang {meta?.page ?? 1}/{totalPages || 1} - tổng{' '}
                                {meta?.total ?? campaignItems.length} chiến dịch
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={(filters.page ?? 1) <= 1}
                                    onClick={() =>
                                        setFilters((current) => ({
                                            ...current,
                                            page: Math.max(
                                                1,
                                                (current.page ?? 1) - 1,
                                            ),
                                        }))
                                    }
                                >
                                    Trước
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={(filters.page ?? 1) >= totalPages}
                                    onClick={() =>
                                        setFilters((current) => ({
                                            ...current,
                                            page: (current.page ?? 1) + 1,
                                        }))
                                    }
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </ContentLayout>
    );
};

export const CampaignsRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();

    const [campaigns, setCampaigns] = React.useState<ManagedCampaignItem[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = React.useState<
        string | null
    >(null);
    const [detail, setDetail] = React.useState<ManagedCampaignDetail | null>(
        null,
    );
    const [loadingList, setLoadingList] = React.useState(false);

    const [fundraisingModuleId, setFundraisingModuleId] = React.useState('');
    const [fundraisingDonations, setFundraisingDonations] = React.useState<
        FundraisingDonationItem[]
    >([]);
    const [fundraisingTransactions, setFundraisingTransactions] =
        React.useState<FundraisingTransactionItem[]>([]);
    const [fundraisingConfig, setFundraisingConfig] = React.useState({
        target_amount: 0,
        receiver_name: '',
        bank_name: '',
        bank_account_no: '',
        currency: 'VND',
        sepay_enabled: false,
        sepay_account_id: '',
    });

    const [itemModuleId, setItemModuleId] = React.useState('');
    const [itemConfig, setItemConfig] = React.useState({
        receiver_address: '',
        receiver_contact: '',
        allow_over_target: false,
        handover_note: '',
    });
    const [itemTargets, setItemTargets] = React.useState<ItemTargetItem[]>([]);
    const [itemTargetForm, setItemTargetForm] = React.useState({
        name: '',
        unit: '',
        target_quantity: 0,
        description: '',
    });
    const [itemPledges, setItemPledges] = React.useState<ItemPledgeItem[]>([]);

    const [eventModuleId, setEventModuleId] = React.useState('');
    const [eventConfig, setEventConfig] = React.useState({
        location: '',
        quota: 0,
        registration_required: true,
        checkin_required: true,
        benefits_text: '',
    });
    const [eventRegistrations, setEventRegistrations] = React.useState<
        EventRegistrationItem[]
    >([]);
    const [actionDialog, setActionDialog] =
        React.useState<CampaignActionDialogState | null>(null);
    const [submittingActionDialog, setSubmittingActionDialog] =
        React.useState(false);

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
    const isStudent = role === ROLES.SINHVIEN;
    const canManageCampaign = role === ROLES.CLB;
    const canMutateCampaign = role === ROLES.CLB;
    const canDeleteDraft =
        canMutateCampaign &&
        !!detail &&
        ['DRAFT', 'REVISION_REQUIRED'].includes(detail.status);

    const closeActionDialog = React.useCallback(() => {
        setActionDialog(null);
        setSubmittingActionDialog(false);
    }, []);

    const loadCampaigns = React.useCallback(async () => {
        if (!canManageCampaign) return;
        setLoadingList(true);
        try {
            const data = await getManagedCampaigns({ page: 1, limit: 50 });
            setCampaigns(data);
            if (data.length === 0) {
                setSelectedCampaignId(null);
                return;
            }
            if (
                !selectedCampaignId ||
                !data.some((campaign) => campaign.id === selectedCampaignId)
            ) {
                setSelectedCampaignId(data[0].id);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không tải được danh sách chiến dịch',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
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
                setFundraisingModuleId(
                    data.modules.find((module) => module.type === 'fundraising')
                        ?.id ?? '',
                );
                setItemModuleId(
                    data.modules.find(
                        (module) => module.type === 'item_donation',
                    )?.id ?? '',
                );
                setEventModuleId(
                    data.modules.find((module) => module.type === 'event')
                        ?.id ?? '',
                );
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Không tải được chi tiết chiến dịch',
                    message:
                        error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            }
        },
        [addNotification],
    );

    const loadFundraisingData = React.useCallback(async (moduleId: string) => {
        if (!moduleId) return;
        const [moduleDetail, donationsPage, transactionsPage] =
            await Promise.all([
                getFundraisingModule(moduleId),
                getFundraisingDonations(moduleId, { page: 1, limit: 100 }),
                getFundraisingTransactions({
                    module_id: moduleId,
                    page: 1,
                    limit: 100,
                }),
            ]);

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
        setFundraisingDonations(donationsPage.items);
        setFundraisingTransactions(transactionsPage.items);
    }, []);

    const loadItemData = React.useCallback(
        async (moduleId: string) => {
            if (!moduleId) return;
            const [targets, pledges, moduleDetail] = await Promise.all([
                getItemTargets(moduleId),
                getItemPledges(moduleId, { page: 1, limit: 100 }),
                detail?.modules.find((module) => module.id === moduleId)
                    ? Promise.resolve(
                          detail.modules.find(
                              (module) => module.id === moduleId,
                          ),
                      )
                    : Promise.resolve(undefined),
            ]);

            const config = (moduleDetail?.settings ?? {}) as Record<
                string,
                unknown
            >;
            setItemConfig({
                receiver_address: String(config.receiver_address ?? ''),
                receiver_contact: String(config.receiver_contact ?? ''),
                allow_over_target: Boolean(config.allow_over_target),
                handover_note: String(config.handover_note ?? ''),
            });
            setItemTargets(targets);
            setItemPledges(pledges);
        },
        [detail?.modules],
    );

    const loadEventData = React.useCallback(async (moduleId: string) => {
        if (!moduleId) return;
        const [registrations, moduleDetail] = await Promise.all([
            getEventRegistrations(moduleId, { page: 1, limit: 100 }),
            getEventModule(moduleId),
        ]);
        setEventConfig({
            location: moduleDetail.config.location,
            quota: moduleDetail.config.quota,
            registration_required: moduleDetail.config.registration_required,
            checkin_required: moduleDetail.config.checkin_required,
            benefits_text: moduleDetail.config.benefits_text,
        });
        setEventRegistrations(registrations);
    }, []);

    React.useEffect(() => {
        void loadCampaigns();
    }, [loadCampaigns]);

    React.useEffect(() => {
        if (!selectedCampaignId) {
            setDetail(null);
            setFundraisingModuleId('');
            setItemModuleId('');
            setEventModuleId('');
            return;
        }
        void loadCampaignDetail(selectedCampaignId);
    }, [loadCampaignDetail, selectedCampaignId]);

    React.useEffect(() => {
        if (!fundraisingModuleId) {
            setFundraisingDonations([]);
            setFundraisingTransactions([]);
            return;
        }
        loadFundraisingData(fundraisingModuleId).catch((error) => {
            addNotification({
                type: 'error',
                title: 'Không tải được dữ liệu gây quỹ',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        });
    }, [addNotification, fundraisingModuleId, loadFundraisingData]);

    React.useEffect(() => {
        if (!itemModuleId) {
            setItemTargets([]);
            setItemPledges([]);
            return;
        }
        loadItemData(itemModuleId).catch((error) => {
            addNotification({
                type: 'error',
                title: 'Không tải được dữ liệu hiện vật',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        });
    }, [addNotification, itemModuleId, loadItemData]);

    React.useEffect(() => {
        if (!eventModuleId) {
            setEventRegistrations([]);
            return;
        }
        loadEventData(eventModuleId).catch((error) => {
            addNotification({
                type: 'error',
                title: 'Không tải được dữ liệu sự kiện',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        });
    }, [addNotification, eventModuleId, loadEventData]);

    const onCreateCampaign = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
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
                        registration_required: true,
                        checkin_required: true,
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onDeleteDraftCampaign = async () => {
        if (!canDeleteDraft || !detail) return;
        const confirmed = window.confirm(
            'Xóa mềm chiến dịch nháp này? Thao tác này sẽ ẩn campaign khỏi danh sách quản trị.',
        );
        if (!confirmed) return;

        try {
            await deleteManagedCampaign(detail.id);
            addNotification({
                type: 'success',
                title: 'Đã xóa chiến dịch nháp',
                message: 'Chiến dịch đã được gỡ khỏi danh sách quản trị.',
            });
            await loadCampaigns();
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xóa chiến dịch thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSaveFundraisingConfig = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onVerifyDonation = async (donationId: string) => {
        const donation = fundraisingDonations.find(
            (item) => item.id === donationId,
        );
        try {
            await verifyFundraisingDonation(
                donationId,
                donation?.matched_transaction_id
                    ? {
                          transaction_id: donation.matched_transaction_id,
                          note: 'verify_from_campaign_management',
                      }
                    : undefined,
            );
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectDonation = async (donationId: string) => {
        setActionDialog({
            kind: 'reject-donation',
            targetId: donationId,
            value: '',
        });
    };

    const onAttachTransaction = async (
        transactionId: string,
        donationId: string,
    ) => {
        try {
            await attachFundraisingTransaction(transactionId, donationId);
            addNotification({
                type: 'success',
                title: 'Đã gắn transaction',
                message: `Transaction #${transactionId} đã được đối soát thủ công.`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gắn transaction thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onUnmatchTransaction = async (transactionId: string) => {
        try {
            await unmatchFundraisingTransaction(transactionId);
            addNotification({
                type: 'success',
                title: 'Đã gỡ đối soát',
                message: `Transaction #${transactionId} đã trở về trạng thái unmatched.`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gỡ đối soát thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSaveItemConfig = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !itemModuleId) return;
        try {
            await updateItemDonationConfig(itemModuleId, {
                receiver_address: itemConfig.receiver_address,
                receiver_contact: itemConfig.receiver_contact,
                allow_over_target: itemConfig.allow_over_target,
                handover_note: itemConfig.handover_note || null,
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu cấu hình hiện vật',
                message: 'Cập nhật cấu hình thành công',
            });
            await loadItemData(itemModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Lưu cấu hình thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onCreateItemTarget = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !itemModuleId) return;
        try {
            await createItemTarget(itemModuleId, {
                name: itemTargetForm.name,
                unit: itemTargetForm.unit,
                target_quantity: itemTargetForm.target_quantity,
                description: itemTargetForm.description || undefined,
            });
            addNotification({
                type: 'success',
                title: 'Đã thêm nhu cầu hiện vật',
                message: 'Mục tiêu hiện vật đã được tạo',
            });
            setItemTargetForm({
                name: '',
                unit: '',
                target_quantity: 0,
                description: '',
            });
            await loadItemData(itemModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo nhu cầu hiện vật thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onUpdateItemTarget = async (
        targetId: string,
        payload: {
            name: string;
            unit: string;
            target_quantity: number;
            description: string;
            status: 'ACTIVE' | 'CLOSED';
        },
    ) => {
        try {
            await updateItemTarget(targetId, {
                name: payload.name,
                unit: payload.unit,
                target_quantity: payload.target_quantity,
                description: payload.description || undefined,
                status: payload.status,
            });
            addNotification({
                type: 'success',
                title: 'Đã cập nhật nhu cầu hiện vật',
                message: `Target #${targetId} đã được cập nhật`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Cập nhật target thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
            throw error;
        }
    };

    const onDeleteItemTarget = async (targetId: string) => {
        try {
            await deleteItemTarget(targetId);
            addNotification({
                type: 'success',
                title: 'Đã xóa nhu cầu hiện vật',
                message: `Target #${targetId} đã được xóa`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xóa target thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
            throw error;
        }
    };

    const onConfirmItemPledge = async (pledgeId: string) => {
        try {
            await confirmItemPledge(pledgeId);
            addNotification({
                type: 'success',
                title: 'Đã xác nhận đăng ký hiện vật',
                message: `Pledge #${pledgeId} đã được xác nhận`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xác nhận pledge thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectItemPledge = async (pledgeId: string) => {
        setActionDialog({
            kind: 'reject-item-pledge',
            targetId: pledgeId,
            value: '',
        });
    };

    const onHandoverItemPledge = async (pledgeId: string, quantity: number) => {
        setActionDialog({
            kind: 'handover-item-pledge',
            targetId: pledgeId,
            value: String(quantity),
        });
    };

    const onSaveEventConfig = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !eventModuleId) return;
        try {
            await updateEventConfig(eventModuleId, {
                location: eventConfig.location,
                quota: eventConfig.quota,
                registration_required: eventConfig.registration_required,
                checkin_required: eventConfig.checkin_required,
                benefits: eventConfig.benefits_text
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu cấu hình sự kiện',
                message: 'Cập nhật cấu hình thành công',
            });
            await loadEventData(eventModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Lưu cấu hình thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onApproveRegistration = async (registrationId: string) => {
        try {
            await approveEventRegistration(registrationId);
            addNotification({
                type: 'success',
                title: 'Đã duyệt đăng ký sự kiện',
                message: `Registration #${registrationId} đã được duyệt`,
            });
            if (eventModuleId) {
                await loadEventData(eventModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Duyệt đăng ký thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectRegistration = async (registrationId: string) => {
        setActionDialog({
            kind: 'reject-registration',
            targetId: registrationId,
            value: '',
        });
    };

    const onCheckInRegistration = async (registrationId: string) => {
        try {
            await checkInEventRegistration(registrationId);
            addNotification({
                type: 'success',
                title: 'Đã check-in',
                message: `Registration #${registrationId} đã được check-in`,
            });
            if (eventModuleId) {
                await loadEventData(eventModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Check-in thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onCompleteRegistration = async (registrationId: string) => {
        setActionDialog({
            kind: 'complete-registration',
            targetId: registrationId,
            value: '',
        });
    };

    const actionDialogConfig = React.useMemo(() => {
        if (!actionDialog) return null;

        switch (actionDialog.kind) {
            case 'reject-donation':
                return {
                    title: 'Từ chối khoản đóng góp',
                    description:
                        'Nhập lý do để lưu vào lịch sử xử lý khoản đóng góp này.',
                    label: 'Lý do từ chối',
                    placeholder: 'VD: Nội dung chuyển khoản không hợp lệ',
                    submitLabel: 'Xác nhận từ chối',
                    fieldType: 'textarea' as const,
                    required: true,
                };
            case 'reject-item-pledge':
                return {
                    title: 'Từ chối pledge hiện vật',
                    description:
                        'Giải thích ngắn gọn để sinh viên biết vì sao pledge bị từ chối.',
                    label: 'Lý do từ chối',
                    placeholder: 'VD: Nhu cầu hiện tại đã đủ số lượng',
                    submitLabel: 'Xác nhận từ chối',
                    fieldType: 'textarea' as const,
                    required: true,
                };
            case 'handover-item-pledge':
                return {
                    title: 'Ghi nhận bàn giao hiện vật',
                    description:
                        'Nhập số lượng thực nhận để cập nhật tiến độ nhận hiện vật.',
                    label: 'Số lượng thực nhận',
                    placeholder: 'VD: 10',
                    submitLabel: 'Lưu bàn giao',
                    fieldType: 'number' as const,
                    required: true,
                };
            case 'reject-registration':
                return {
                    title: 'Từ chối đăng ký sự kiện',
                    description:
                        'Nhập lý do để phản hồi rõ ràng cho sinh viên.',
                    label: 'Lý do từ chối',
                    placeholder: 'VD: Sự kiện đã đủ số lượng tham gia',
                    submitLabel: 'Xác nhận từ chối',
                    fieldType: 'textarea' as const,
                    required: true,
                };
            case 'complete-registration':
                return {
                    title: 'Hoàn thành tham gia sự kiện',
                    description:
                        'Bạn có thể nhập số giờ tham gia, hoặc để trống nếu không cần ghi nhận giờ.',
                    label: 'Số giờ tham gia',
                    placeholder: 'VD: 4',
                    submitLabel: 'Ghi nhận hoàn thành',
                    fieldType: 'number' as const,
                    required: false,
                };
        }
    }, [actionDialog]);

    const submitActionDialog = async () => {
        if (!actionDialog) return;

        const trimmedValue = actionDialog.value.trim();
        setSubmittingActionDialog(true);

        try {
            switch (actionDialog.kind) {
                case 'reject-donation': {
                    if (!trimmedValue) {
                        throw new Error('Vui lòng nhập lý do từ chối.');
                    }
                    await rejectFundraisingDonation(
                        actionDialog.targetId,
                        trimmedValue,
                    );
                    addNotification({
                        type: 'success',
                        title: 'Đã từ chối khoản đóng góp',
                        message: `Khoản đóng góp #${actionDialog.targetId} đã bị từ chối`,
                    });
                    if (fundraisingModuleId) {
                        await loadFundraisingData(fundraisingModuleId);
                    }
                    break;
                }
                case 'reject-item-pledge': {
                    if (!trimmedValue) {
                        throw new Error('Vui lòng nhập lý do từ chối.');
                    }
                    await rejectItemPledge(actionDialog.targetId, trimmedValue);
                    addNotification({
                        type: 'success',
                        title: 'Đã từ chối pledge hiện vật',
                        message: `Pledge #${actionDialog.targetId} đã bị từ chối`,
                    });
                    if (itemModuleId) {
                        await loadItemData(itemModuleId);
                    }
                    break;
                }
                case 'handover-item-pledge': {
                    const parsedQuantity = Number(trimmedValue);
                    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
                        throw new Error(
                            'Số lượng thực nhận phải lớn hơn 0.',
                        );
                    }
                    await handoverItemPledge(actionDialog.targetId, {
                        received_quantity: parsedQuantity,
                    });
                    addNotification({
                        type: 'success',
                        title: 'Đã ghi nhận bàn giao',
                        message: `Pledge #${actionDialog.targetId} đã cập nhật trạng thái đã nhận`,
                    });
                    if (itemModuleId) {
                        await loadItemData(itemModuleId);
                    }
                    break;
                }
                case 'reject-registration': {
                    if (!trimmedValue) {
                        throw new Error('Vui lòng nhập lý do từ chối.');
                    }
                    await rejectEventRegistration(
                        actionDialog.targetId,
                        trimmedValue,
                    );
                    addNotification({
                        type: 'success',
                        title: 'Đã từ chối đăng ký sự kiện',
                        message: `Registration #${actionDialog.targetId} đã bị từ chối`,
                    });
                    if (eventModuleId) {
                        await loadEventData(eventModuleId);
                    }
                    break;
                }
                case 'complete-registration': {
                    const hours =
                        trimmedValue.length > 0
                            ? Number(trimmedValue)
                            : undefined;
                    if (
                        typeof hours !== 'undefined' &&
                        (!Number.isFinite(hours) || hours < 0)
                    ) {
                        throw new Error(
                            'Số giờ tham gia phải là số hợp lệ từ 0 trở lên.',
                        );
                    }
                    await completeEventRegistration(actionDialog.targetId, {
                        hours,
                    });
                    addNotification({
                        type: 'success',
                        title: 'Đã ghi nhận hoàn thành sự kiện',
                        message: `Registration #${actionDialog.targetId} đã hoàn thành`,
                    });
                    if (eventModuleId) {
                        await loadEventData(eventModuleId);
                    }
                    break;
                }
            }

            closeActionDialog();
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Thao tác thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
            setSubmittingActionDialog(false);
        }
    };

    if (!user.data) return null;

    if (isStudent) {
        return <StudentCampaignDiscovery />;
    }

    if (!canManageCampaign) {
        return (
            <ContentLayout title="Vận Hành Chiến Dịch">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                    Vai trò hiện tại không có quyền truy cập khu vực quản trị
                    chiến dịch.
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
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {campaigns.length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Trạng thái hiện tại
                        </p>
                        <div className="mt-2">
                            {detail ? (
                                <StatusBadge status={detail.status} />
                            ) : (
                                <span className="text-sm text-slate-600">
                                    -
                                </span>
                            )}
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

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900">
                                Danh sách chiến dịch
                            </h2>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void loadCampaigns()}
                            >
                                <RefreshCw className="mr-1 size-4" />
                                Làm mới
                            </Button>
                        </div>
                        {loadingList ? (
                            <p className="text-sm text-slate-600">
                                Đang tải...
                            </p>
                        ) : null}
                        <div className="space-y-2">
                            {campaigns.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCampaignId(campaign.id)
                                    }
                                    className={`w-full rounded-lg border p-3 text-left transition ${
                                        selectedCampaignId === campaign.id
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                        {toDisplayTitle(campaign.title)}
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
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Tạo chiến dịch nháp
                                    </h3>
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
                                        placeholder="Mô tả ngắn"
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
                                                    start_at:
                                                        event.target.value,
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
                                    <Button type="submit">
                                        Tạo chiến dịch
                                    </Button>
                                </div>
                            </form>
                        ) : null}

                        {detail ? (
                            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {toDisplayTitle(detail.title)}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {toDisplayText(detail.summary)}
                                        </p>
                                    </div>
                                    <StatusBadge status={detail.status} />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            window.open(
                                                paths.app.campaigns.preview.getHref(
                                                    detail.id,
                                                ),
                                                '_blank',
                                                'noopener,noreferrer',
                                            )
                                        }
                                    >
                                        <Megaphone className="mr-1 size-4" />
                                        Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void onSubmitReview()}
                                    >
                                        <Send className="mr-1 size-4" />
                                        Gửi duyệt
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void onPublish()}
                                    >
                                        <ShieldCheck className="mr-1 size-4" />
                                        Công khai
                                    </Button>
                                    {canDeleteDraft ? (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() =>
                                                void onDeleteDraftCampaign()
                                            }
                                        >
                                            <Trash2 className="mr-1 size-4" />
                                            Xóa nháp
                                        </Button>
                                    ) : null}
                                </div>

                                {canMutateCampaign ? (
                                    <form
                                        onSubmit={onCreateModule}
                                        className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ClipboardList className="size-4 text-blue-700" />
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Thêm hạng mục vào chiến dịch
                                            </h4>
                                        </div>
                                        <select
                                            value={moduleForm.type}
                                            onChange={(event) =>
                                                setModuleForm((current) => ({
                                                    ...current,
                                                    type: event.target
                                                        .value as ModuleType,
                                                }))
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="fundraising">
                                                Gây quỹ hiện kim
                                            </option>
                                            <option value="item_donation">
                                                Quyên góp hiện vật
                                            </option>
                                            <option value="event">
                                                Tuyển tình nguyện viên
                                            </option>
                                        </select>
                                        <Input
                                            placeholder="Tên hạng mục"
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
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Input
                                                type="datetime-local"
                                                value={moduleForm.start_at}
                                                onChange={(event) =>
                                                    setModuleForm(
                                                        (current) => ({
                                                            ...current,
                                                            start_at:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                            />
                                            <Input
                                                type="datetime-local"
                                                value={moduleForm.end_at}
                                                onChange={(event) =>
                                                    setModuleForm(
                                                        (current) => ({
                                                            ...current,
                                                            end_at: event.target
                                                                .value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </div>
                                        {moduleForm.type === 'fundraising' ? (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Mục tiêu gây quỹ"
                                                    value={
                                                        moduleForm.target_amount ||
                                                        ''
                                                    }
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                target_amount:
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value ||
                                                                            0,
                                                                    ),
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    placeholder="Tên người thụ hưởng"
                                                    value={
                                                        moduleForm.receiver_name
                                                    }
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                receiver_name:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    placeholder="Ngân hàng"
                                                    value={moduleForm.bank_name}
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                bank_name:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    placeholder="Số tài khoản"
                                                    value={
                                                        moduleForm.bank_account_no
                                                    }
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                bank_account_no:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                        {moduleForm.type === 'item_donation' ? (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    placeholder="Địa chỉ tiếp nhận"
                                                    value={
                                                        moduleForm.receiver_address
                                                    }
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                receiver_address:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    placeholder="Liên hệ tiếp nhận"
                                                    value={
                                                        moduleForm.receiver_contact
                                                    }
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                receiver_contact:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                        {moduleForm.type === 'event' ? (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Số lượng quota"
                                                    value={
                                                        moduleForm.quota || ''
                                                    }
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                quota: Number(
                                                                    event.target
                                                                        .value ||
                                                                        0,
                                                                ),
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    placeholder="Địa điểm"
                                                    value={moduleForm.location}
                                                    onChange={(event) =>
                                                        setModuleForm(
                                                            (current) => ({
                                                                ...current,
                                                                location:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                        <Button type="submit">
                                            Tạo hạng mục
                                        </Button>
                                    </form>
                                ) : null}

                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        Các hạng mục đã tạo
                                    </h4>
                                    {detail.modules.map((module) => (
                                        <div
                                            key={module.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {toDisplayTitle(
                                                        module.title,
                                                    )}
                                                </p>
                                                <StatusBadge
                                                    status={module.status}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {moduleTypeLabel[module.type]}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {detail.modules.some(
                                    (module) => module.type === 'fundraising',
                                ) ? (
                                    <FundraisingPanel
                                        fundraisingModuleId={
                                            fundraisingModuleId
                                        }
                                        modules={detail.modules.filter(
                                            (module) =>
                                                module.type === 'fundraising',
                                        )}
                                        config={fundraisingConfig}
                                        donations={fundraisingDonations}
                                        transactions={fundraisingTransactions}
                                        canMutateCampaign={canMutateCampaign}
                                        onModuleChange={(id) =>
                                            setFundraisingModuleId(id)
                                        }
                                        onConfigChange={(patch) =>
                                            setFundraisingConfig((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onSaveConfig={onSaveFundraisingConfig}
                                        onVerifyDonation={onVerifyDonation}
                                        onRejectDonation={onRejectDonation}
                                        onAttachTransaction={
                                            onAttachTransaction
                                        }
                                        onUnmatchTransaction={
                                            onUnmatchTransaction
                                        }
                                    />
                                ) : null}

                                {detail.modules.some(
                                    (module) => module.type === 'item_donation',
                                ) ? (
                                    <ItemDonationPanel
                                        itemModuleId={itemModuleId}
                                        modules={detail.modules.filter(
                                            (module) =>
                                                module.type === 'item_donation',
                                        )}
                                        config={itemConfig}
                                        targetForm={itemTargetForm}
                                        targets={itemTargets}
                                        pledges={itemPledges}
                                        canMutateCampaign={canMutateCampaign}
                                        onModuleChange={(id) =>
                                            setItemModuleId(id)
                                        }
                                        onConfigChange={(patch) =>
                                            setItemConfig((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onSaveConfig={onSaveItemConfig}
                                        onTargetFormChange={(patch) =>
                                            setItemTargetForm((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onCreateTarget={onCreateItemTarget}
                                        onUpdateTarget={onUpdateItemTarget}
                                        onDeleteTarget={onDeleteItemTarget}
                                        onConfirmPledge={onConfirmItemPledge}
                                        onRejectPledge={onRejectItemPledge}
                                        onHandoverPledge={onHandoverItemPledge}
                                    />
                                ) : null}

                                {detail.modules.some(
                                    (module) => module.type === 'event',
                                ) ? (
                                    <EventPanel
                                        eventModuleId={eventModuleId}
                                        modules={detail.modules.filter(
                                            (module) => module.type === 'event',
                                        )}
                                        config={eventConfig}
                                        registrations={eventRegistrations}
                                        canMutateCampaign={canMutateCampaign}
                                        onModuleChange={(id) =>
                                            setEventModuleId(id)
                                        }
                                        onConfigChange={(patch) =>
                                            setEventConfig((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onSaveConfig={onSaveEventConfig}
                                        onApproveRegistration={
                                            onApproveRegistration
                                        }
                                        onRejectRegistration={
                                            onRejectRegistration
                                        }
                                        onCheckInRegistration={
                                            onCheckInRegistration
                                        }
                                        onCompleteRegistration={
                                            onCompleteRegistration
                                        }
                                    />
                                ) : null}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                                Chưa có chiến dịch để vận hành. Hãy tạo chiến
                                dịch mới hoặc chọn chiến dịch từ danh sách.
                            </div>
                        )}
                    </section>
                </div>
                {actionDialog && actionDialogConfig ? (
                    <ActionDrawer
                        open
                        onOpenChange={(open) => {
                            if (!open) {
                                closeActionDialog();
                            }
                        }}
                        title={actionDialogConfig.title}
                        description={actionDialogConfig.description}
                        label={actionDialogConfig.label}
                        value={actionDialog.value}
                        onValueChange={(value) =>
                            setActionDialog((current) =>
                                current ? { ...current, value } : current,
                            )
                        }
                        submitLabel={actionDialogConfig.submitLabel}
                        placeholder={actionDialogConfig.placeholder}
                        fieldType={actionDialogConfig.fieldType}
                        required={actionDialogConfig.required}
                        isSubmitting={submittingActionDialog}
                        onSubmit={submitActionDialog}
                    />
                ) : null}
            </div>
        </ContentLayout>
    );
};
