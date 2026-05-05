import * as React from 'react';
import {
    CircleDollarSign,
    ClipboardList,
    HandHelping,
    Megaphone,
    RefreshCw,
    Send,
    ShieldCheck,
    TicketCheck,
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
import {
    approveEventRegistration,
    checkInEventRegistration,
    completeEventRegistration,
    confirmItemPledge,
    createItemTarget,
    getEventRegistrations,
    getItemPledges,
    getItemTargets,
    handoverItemPledge,
    rejectEventRegistration,
    rejectItemPledge,
    updateEventConfig,
    updateItemDonationConfig,
    type EventRegistrationItem,
    type ItemPledgeItem,
    type ItemTargetItem,
} from '@/features/campaign/api/sprint3';
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
    const canManageCampaign =
        role === ROLES.ORG_ADMIN || role === ROLES.ORG_MEMBER;
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
        const [moduleDetail, donations] = await Promise.all([
            getFundraisingModule(moduleId),
            getFundraisingDonations(moduleId, { page: 1, limit: 100 }),
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
        setFundraisingDonations(donations);
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

    const loadEventData = React.useCallback(
        async (moduleId: string) => {
            if (!moduleId) return;
            const [registrations, moduleDetail] = await Promise.all([
                getEventRegistrations(moduleId, { page: 1, limit: 100 }),
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
            setEventConfig({
                location: String(config.location ?? ''),
                quota: Number(config.quota ?? 0),
                registration_required: config.registration_required !== false,
                checkin_required: config.checkin_required !== false,
                benefits_text: Array.isArray(config.benefits)
                    ? config.benefits
                          .map((benefit) => String(benefit))
                          .join('\n')
                    : '',
            });
            setEventRegistrations(registrations);
        },
        [detail?.modules],
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
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
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
        const reason = window.prompt('Nhập lý do từ chối pledge hiện vật:');
        if (!reason) return;
        try {
            await rejectItemPledge(pledgeId, reason);
            addNotification({
                type: 'success',
                title: 'Đã từ chối pledge hiện vật',
                message: `Pledge #${pledgeId} đã bị từ chối`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Từ chối pledge thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onHandoverItemPledge = async (pledgeId: string, quantity: number) => {
        const input = window.prompt(
            'Nhập số lượng thực nhận',
            String(quantity),
        );
        if (!input) return;
        const parsed = Number(input);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            addNotification({
                type: 'error',
                title: 'Số lượng không hợp lệ',
                message: 'Số lượng thực nhận phải lớn hơn 0.',
            });
            return;
        }
        try {
            await handoverItemPledge(pledgeId, {
                received_quantity: parsed,
            });
            addNotification({
                type: 'success',
                title: 'Đã ghi nhận bàn giao',
                message: `Pledge #${pledgeId} đã cập nhật trạng thái đã nhận`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Bàn giao thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
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
        const reason = window.prompt('Nhập lý do từ chối đăng ký sự kiện:');
        if (!reason) return;
        try {
            await rejectEventRegistration(registrationId, reason);
            addNotification({
                type: 'success',
                title: 'Đã từ chối đăng ký sự kiện',
                message: `Registration #${registrationId} đã bị từ chối`,
            });
            if (eventModuleId) {
                await loadEventData(eventModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Từ chối đăng ký thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
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
        const hoursText = window.prompt('Nhập số giờ tham gia (tùy chọn):');
        const hours =
            hoursText && Number.isFinite(Number(hoursText))
                ? Number(hoursText)
                : undefined;
        try {
            await completeEventRegistration(registrationId, {
                hours,
            });
            addNotification({
                type: 'success',
                title: 'Đã ghi nhận hoàn thành sự kiện',
                message: `Registration #${registrationId} đã hoàn thành`,
            });
            if (eventModuleId) {
                await loadEventData(eventModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Hoàn thành sự kiện thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    if (!user.data) return null;

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
                                            {detail.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {detail.summary}
                                        </p>
                                    </div>
                                    <StatusBadge status={detail.status} />
                                </div>

                                <div className="flex flex-wrap gap-2">
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
                                                    {module.title}
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
                                    <div className="space-y-4 border-t border-slate-200 pt-4">
                                        <div className="flex items-center gap-2">
                                            <CircleDollarSign className="size-4 text-blue-700" />
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Vận hành gây quỹ
                                            </h4>
                                        </div>
                                        <select
                                            value={fundraisingModuleId}
                                            onChange={(event) =>
                                                setFundraisingModuleId(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="">
                                                Chọn hạng mục gây quỹ
                                            </option>
                                            {detail.modules
                                                .filter(
                                                    (module) =>
                                                        module.type ===
                                                        'fundraising',
                                                )
                                                .map((module) => (
                                                    <option
                                                        key={module.id}
                                                        value={module.id}
                                                    >
                                                        {module.title}
                                                    </option>
                                                ))}
                                        </select>
                                        {fundraisingModuleId &&
                                        canMutateCampaign ? (
                                            <form
                                                onSubmit={
                                                    onSaveFundraisingConfig
                                                }
                                                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                            >
                                                <Input
                                                    type="number"
                                                    placeholder="Mục tiêu gây quỹ"
                                                    value={
                                                        fundraisingConfig.target_amount ||
                                                        ''
                                                    }
                                                    onChange={(event) =>
                                                        setFundraisingConfig(
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
                                                    placeholder="Tên người nhận"
                                                    value={
                                                        fundraisingConfig.receiver_name
                                                    }
                                                    onChange={(event) =>
                                                        setFundraisingConfig(
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
                                                    value={
                                                        fundraisingConfig.bank_name
                                                    }
                                                    onChange={(event) =>
                                                        setFundraisingConfig(
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
                                                        fundraisingConfig.bank_account_no
                                                    }
                                                    onChange={(event) =>
                                                        setFundraisingConfig(
                                                            (current) => ({
                                                                ...current,
                                                                bank_account_no:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            fundraisingConfig.sepay_enabled
                                                        }
                                                        onChange={(event) =>
                                                            setFundraisingConfig(
                                                                (current) => ({
                                                                    ...current,
                                                                    sepay_enabled:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    Bật SePay
                                                </label>
                                                {fundraisingConfig.sepay_enabled ? (
                                                    <Input
                                                        placeholder="Mã tài khoản SePay"
                                                        value={
                                                            fundraisingConfig.sepay_account_id
                                                        }
                                                        onChange={(event) =>
                                                            setFundraisingConfig(
                                                                (current) => ({
                                                                    ...current,
                                                                    sepay_account_id:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                ) : null}
                                                <Button type="submit">
                                                    Lưu cấu hình
                                                </Button>
                                            </form>
                                        ) : null}

                                        <div className="space-y-2">
                                            {fundraisingDonations.map(
                                                (donation) => (
                                                    <div
                                                        key={donation.id}
                                                        className="rounded-lg border border-slate-200 bg-white p-3"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {
                                                                        donation.donor_name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-600">
                                                                    {formatCurrency(
                                                                        donation.amount,
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <StatusBadge
                                                                status={
                                                                    donation.status
                                                                }
                                                            />
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !canMutateCampaign ||
                                                                    ![
                                                                        'PENDING',
                                                                        'MATCHED',
                                                                    ].includes(
                                                                        donation.status,
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    void onVerifyDonation(
                                                                        donation.id,
                                                                    )
                                                                }
                                                            >
                                                                Xác minh
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !canMutateCampaign ||
                                                                    ![
                                                                        'PENDING',
                                                                        'MATCHED',
                                                                    ].includes(
                                                                        donation.status,
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    void onRejectDonation(
                                                                        donation.id,
                                                                    )
                                                                }
                                                            >
                                                                Từ chối
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                {detail.modules.some(
                                    (module) => module.type === 'item_donation',
                                ) ? (
                                    <div className="space-y-4 border-t border-slate-200 pt-4">
                                        <div className="flex items-center gap-2">
                                            <HandHelping className="size-4 text-blue-700" />
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Vận hành hiện vật
                                            </h4>
                                        </div>
                                        <select
                                            value={itemModuleId}
                                            onChange={(event) =>
                                                setItemModuleId(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="">
                                                Chọn hạng mục hiện vật
                                            </option>
                                            {detail.modules
                                                .filter(
                                                    (module) =>
                                                        module.type ===
                                                        'item_donation',
                                                )
                                                .map((module) => (
                                                    <option
                                                        key={module.id}
                                                        value={module.id}
                                                    >
                                                        {module.title}
                                                    </option>
                                                ))}
                                        </select>

                                        {itemModuleId && canMutateCampaign ? (
                                            <form
                                                onSubmit={onSaveItemConfig}
                                                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                            >
                                                <Input
                                                    placeholder="Địa chỉ tiếp nhận"
                                                    value={
                                                        itemConfig.receiver_address
                                                    }
                                                    onChange={(event) =>
                                                        setItemConfig(
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
                                                        itemConfig.receiver_contact
                                                    }
                                                    onChange={(event) =>
                                                        setItemConfig(
                                                            (current) => ({
                                                                ...current,
                                                                receiver_contact:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    placeholder="Ghi chú bàn giao"
                                                    value={
                                                        itemConfig.handover_note
                                                    }
                                                    onChange={(event) =>
                                                        setItemConfig(
                                                            (current) => ({
                                                                ...current,
                                                                handover_note:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            itemConfig.allow_over_target
                                                        }
                                                        onChange={(event) =>
                                                            setItemConfig(
                                                                (current) => ({
                                                                    ...current,
                                                                    allow_over_target:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    Cho phép vượt mục tiêu
                                                </label>
                                                <Button type="submit">
                                                    Lưu cấu hình hiện vật
                                                </Button>
                                            </form>
                                        ) : null}

                                        {itemModuleId && canMutateCampaign ? (
                                            <form
                                                onSubmit={onCreateItemTarget}
                                                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                            >
                                                <h5 className="text-sm font-semibold text-slate-900">
                                                    Thêm nhu cầu hiện vật
                                                </h5>
                                                <Input
                                                    placeholder="Tên vật phẩm"
                                                    value={itemTargetForm.name}
                                                    onChange={(event) =>
                                                        setItemTargetForm(
                                                            (current) => ({
                                                                ...current,
                                                                name: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <Input
                                                        placeholder="Đơn vị"
                                                        value={
                                                            itemTargetForm.unit
                                                        }
                                                        onChange={(event) =>
                                                            setItemTargetForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    unit: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Số lượng mục tiêu"
                                                        value={
                                                            itemTargetForm.target_quantity ||
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            setItemTargetForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    target_quantity:
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
                                                </div>
                                                <Input
                                                    placeholder="Mô tả"
                                                    value={
                                                        itemTargetForm.description
                                                    }
                                                    onChange={(event) =>
                                                        setItemTargetForm(
                                                            (current) => ({
                                                                ...current,
                                                                description:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Button type="submit">
                                                    Thêm nhu cầu
                                                </Button>
                                            </form>
                                        ) : null}

                                        <div className="space-y-2">
                                            {itemTargets.map((target) => (
                                                <div
                                                    key={target.id}
                                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {target.name}
                                                        </p>
                                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                                            {
                                                                target.received_quantity
                                                            }
                                                            /
                                                            {
                                                                target.target_quantity
                                                            }{' '}
                                                            {target.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            {itemPledges.map((pledge) => (
                                                <div
                                                    key={pledge.id}
                                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {
                                                                    pledge
                                                                        .student
                                                                        .full_name
                                                                }{' '}
                                                                -{' '}
                                                                {
                                                                    pledge
                                                                        .item_target
                                                                        .name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-slate-600">
                                                                {
                                                                    pledge.quantity
                                                                }{' '}
                                                                {
                                                                    pledge
                                                                        .item_target
                                                                        .unit
                                                                }
                                                            </p>
                                                        </div>
                                                        <StatusBadge
                                                            status={
                                                                pledge.status
                                                            }
                                                        />
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                !canMutateCampaign ||
                                                                pledge.status !==
                                                                    'PLEDGED'
                                                            }
                                                            onClick={() =>
                                                                void onConfirmItemPledge(
                                                                    pledge.id,
                                                                )
                                                            }
                                                        >
                                                            Xác nhận
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                !canMutateCampaign ||
                                                                pledge.status !==
                                                                    'PLEDGED'
                                                            }
                                                            onClick={() =>
                                                                void onRejectItemPledge(
                                                                    pledge.id,
                                                                )
                                                            }
                                                        >
                                                            Từ chối
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                !canMutateCampaign ||
                                                                pledge.status !==
                                                                    'CONFIRMED'
                                                            }
                                                            onClick={() =>
                                                                void onHandoverItemPledge(
                                                                    pledge.id,
                                                                    pledge.quantity,
                                                                )
                                                            }
                                                        >
                                                            Ghi nhận bàn giao
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {detail.modules.some(
                                    (module) => module.type === 'event',
                                ) ? (
                                    <div className="space-y-4 border-t border-slate-200 pt-4">
                                        <div className="flex items-center gap-2">
                                            <TicketCheck className="size-4 text-blue-700" />
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Vận hành tuyển TNV
                                            </h4>
                                        </div>
                                        <select
                                            value={eventModuleId}
                                            onChange={(event) =>
                                                setEventModuleId(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="">
                                                Chọn hạng mục sự kiện
                                            </option>
                                            {detail.modules
                                                .filter(
                                                    (module) =>
                                                        module.type === 'event',
                                                )
                                                .map((module) => (
                                                    <option
                                                        key={module.id}
                                                        value={module.id}
                                                    >
                                                        {module.title}
                                                    </option>
                                                ))}
                                        </select>

                                        {eventModuleId && canMutateCampaign ? (
                                            <form
                                                onSubmit={onSaveEventConfig}
                                                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                            >
                                                <Input
                                                    placeholder="Địa điểm"
                                                    value={eventConfig.location}
                                                    onChange={(event) =>
                                                        setEventConfig(
                                                            (current) => ({
                                                                ...current,
                                                                location:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Quota"
                                                    value={
                                                        eventConfig.quota || ''
                                                    }
                                                    onChange={(event) =>
                                                        setEventConfig(
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
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            eventConfig.registration_required
                                                        }
                                                        onChange={(event) =>
                                                            setEventConfig(
                                                                (current) => ({
                                                                    ...current,
                                                                    registration_required:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    Cần duyệt đăng ký
                                                </label>
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            eventConfig.checkin_required
                                                        }
                                                        onChange={(event) =>
                                                            setEventConfig(
                                                                (current) => ({
                                                                    ...current,
                                                                    checkin_required:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    Bắt buộc check-in
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={
                                                        eventConfig.benefits_text
                                                    }
                                                    onChange={(event) =>
                                                        setEventConfig(
                                                            (current) => ({
                                                                ...current,
                                                                benefits_text:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Mỗi quyền lợi một dòng"
                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                                />
                                                <Button type="submit">
                                                    Lưu cấu hình sự kiện
                                                </Button>
                                            </form>
                                        ) : null}

                                        <div className="space-y-2">
                                            {eventRegistrations.map(
                                                (registration) => (
                                                    <div
                                                        key={registration.id}
                                                        className="rounded-lg border border-slate-200 bg-white p-3"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {
                                                                        registration
                                                                            .student
                                                                            .full_name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-600">
                                                                    {
                                                                        registration
                                                                            .student
                                                                            .student_code
                                                                    }{' '}
                                                                    -{' '}
                                                                    {
                                                                        registration
                                                                            .student
                                                                            .email
                                                                    }
                                                                </p>
                                                            </div>
                                                            <StatusBadge
                                                                status={
                                                                    registration.status
                                                                }
                                                            />
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !canMutateCampaign ||
                                                                    registration.status !==
                                                                        'PENDING'
                                                                }
                                                                onClick={() =>
                                                                    void onApproveRegistration(
                                                                        registration.id,
                                                                    )
                                                                }
                                                            >
                                                                Duyệt
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !canMutateCampaign ||
                                                                    ![
                                                                        'PENDING',
                                                                        'APPROVED',
                                                                    ].includes(
                                                                        registration.status,
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    void onRejectRegistration(
                                                                        registration.id,
                                                                    )
                                                                }
                                                            >
                                                                Từ chối
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !canMutateCampaign ||
                                                                    registration.status !==
                                                                        'APPROVED'
                                                                }
                                                                onClick={() =>
                                                                    void onCheckInRegistration(
                                                                        registration.id,
                                                                    )
                                                                }
                                                            >
                                                                Check-in
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    !canMutateCampaign ||
                                                                    ![
                                                                        'APPROVED',
                                                                        'CHECKED_IN',
                                                                    ].includes(
                                                                        registration.status,
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    void onCompleteRegistration(
                                                                        registration.id,
                                                                    )
                                                                }
                                                            >
                                                                Hoàn thành
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
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
            </div>
        </ContentLayout>
    );
};
