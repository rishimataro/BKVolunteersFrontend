import * as React from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, MapPin, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import {
    createManagedCampaign,
    getOrganizerPaymentAccounts,
} from '@/features/campaign/api/campaign';
import { LocationPickerDialog } from '@/features/locations/components/location-picker-dialog';
import { listOrganizations, type OrganizationCard } from '@/features/organizations/api/organizations';
import { uploadStorageFile, type StorageUploadResponse } from '@/features/storage/api/storage';
import type { LocationItem } from '@/types/api';

type TemplateKind = 'fundraising' | 'item_donation' | 'volunteer' | 'multi_stage';

type UploadedFileState = {
    id: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    accessUrl: string;
    publicUrl: string | null;
};

type LocationState = {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
};

type ItemTargetForm = {
    id: string;
    name: string;
    requirementDescription: string;
    acceptedCondition: 'NEW' | 'USED_GOOD' | 'BOTH';
    hasTarget: boolean;
    targetQuantity: string;
    unitName: string;
};

type PaymentAccountOption = {
    id: string;
    display_name: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_default: boolean;
};

const templateCards: Array<{
    id: TemplateKind;
    title: string;
    description: string;
}> = [
    {
        id: 'fundraising',
        title: 'Chiến dịch gây quỹ',
        description:
            'Phù hợp khi cần gây quỹ hiện kim, theo dõi giao dịch xác nhận và gửi hồ sơ duyệt đầy đủ.',
    },
    {
        id: 'item_donation',
        title: 'Chiến dịch quyên góp hiện vật',
        description:
            'Dùng cho các đợt tiếp nhận sách vở, quần áo, thực phẩm, vật dụng và ghi nhận số lượng thực tế.',
    },
    {
        id: 'volunteer',
        title: 'Chiến dịch tuyển tình nguyện viên',
        description:
            'Phù hợp với hoạt động cần mở đăng ký, xét duyệt, danh sách chờ và quản lý địa điểm triển khai.',
    },
    {
        id: 'multi_stage',
        title: 'Chiến dịch nhiều giai đoạn',
        description:
            'Giai đoạn 1 triển khai gây quỹ hoặc quyên góp hiện vật, giai đoạn 2 tuyển tình nguyện viên để thực thi.',
    },
];

const itemUnits = ['cái', 'bộ', 'quyển', 'kg', 'thùng', 'phần', 'chiếc', 'hộp', 'khác'];

const fileSizeText = (value: number) => {
    if (value < 1024 * 1024) {
        return `${Math.max(1, Math.round(value / 1024))} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatCurrency = (value: string) => {
    const digits = value.replace(/\D+/g, '');
    if (!digits) return '';
    return `${new Intl.NumberFormat('vi-VN').format(Number(digits))} ₫`;
};

const numericValue = (value: string) => Number(value.replace(/\D+/g, '') || '0');

const toIsoDateTime = (
    value: string,
    label: string,
    fallbackValue?: string,
) => {
    const candidate = String(value || fallbackValue || '').trim();

    if (!candidate) {
        throw new Error(`${label} không được để trống.`);
    }

    const parsed = new Date(candidate);

    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`${label} không hợp lệ.`);
    }

    return parsed.toISOString();
};

const toUploadedFileState = (file: StorageUploadResponse): UploadedFileState => ({
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    accessUrl: file.accessUrl,
    publicUrl: file.publicUrl,
});

const toLocationState = (location: LocationItem): LocationState => ({
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
});

const toDateTimeInput = (value: string) => value;

const buildItemTarget = (): ItemTargetForm => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    requirementDescription: '',
    acceptedCondition: 'BOTH',
    hasTarget: true,
    targetQuantity: '',
    unitName: 'cái',
});

const Field = ({
    label,
    error,
    children,
    hint,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) => (
    <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#002A58]">{label}</span>
        {children}
        {error ? (
            <span className="text-sm text-[#B42318]">{error}</span>
        ) : hint ? (
            <span className="text-sm text-[#667085]">{hint}</span>
        ) : null}
    </label>
);

const SectionCard = ({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <section className="rounded-2xl border border-[#D0D5DD] bg-white p-6 shadow-sm">
        <div className="pb-4 border-b border-[#EAECF0]">
            <h2 className="text-xl font-semibold text-[#002A58]">{title}</h2>
            {description ? (
                <p className="mt-2 text-sm leading-6 text-[#475467]">
                    {description}
                </p>
            ) : null}
        </div>
        <div className="pt-5">{children}</div>
    </section>
);

export const CampaignCreateFlowRoute = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const user = useUser();

    const [templateKind, setTemplateKind] = React.useState<TemplateKind | null>(
        null,
    );
    const [currentStep, setCurrentStep] = React.useState(0);
    const [submitting, setSubmitting] = React.useState(false);
    const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);
    const [locationDialogTarget, setLocationDialogTarget] = React.useState<
        'item' | 'volunteer' | 'phase2Volunteer' | null
    >(null);
    const [organizations, setOrganizations] = React.useState<OrganizationCard[]>(
        [],
    );
    const [paymentAccounts, setPaymentAccounts] = React.useState<
        PaymentAccountOption[]
    >([]);

    const [basic, setBasic] = React.useState({
        title: '',
        summary: '',
        slogan: '',
        description: '',
        beneficiary: '',
        startAt: '',
        endAt: '',
        coverFile: null as UploadedFileState | null,
        logoFile: null as UploadedFileState | null,
    });

    const [fundraising, setFundraising] = React.useState({
        title: 'Gây quỹ cho chiến dịch',
        description: '',
        startAt: '',
        endAt: '',
        useExistingAccount: true,
        paymentAccountId: '',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        qrFile: null as UploadedFileState | null,
        suggestedTransferContent: '',
        targetAmountText: '',
        allowAnonymousPublicDisplay: false,
    });

    const [itemDonation, setItemDonation] = React.useState({
        title: 'Quyên góp hiện vật',
        description: '',
        location: null as LocationState | null,
        receiverName: '',
        receiverPhone: '',
        receiverNotes: '',
        receiveScheduleType: 'RANGE' as 'RANGE' | 'SINGLE_DATE' | 'MULTIPLE_DATES',
        receiveRangeStart: '',
        receiveRangeEnd: '',
        receiveSingleDate: '',
        receiveMultipleDatesText: '',
        receiveTimeStart: '',
        receiveTimeEnd: '',
        targets: [buildItemTarget()],
    });

    const [volunteer, setVolunteer] = React.useState({
        title: 'Tuyển tình nguyện viên',
        description: '',
        requiredQuantity: '',
        registrationStartAt: '',
        registrationEndAt: '',
        activityStartAt: '',
        activityEndAt: '',
        location: null as LocationState | null,
        jobDescription: '',
        workItemsText: '',
        requirementsText: '',
        benefitsText: '',
        registrationApprovalRequired: true,
        bulkApprovalEnabled: true,
        waitlistEnabled: true,
        scopeMode: 'SCHOOL_WIDE',
        scopeTargetIds: [] as string[],
    });

    const [multiStage, setMultiStage] = React.useState({
        phaseOneType: 'fundraising' as 'fundraising' | 'item_donation',
    });

    const [documents, setDocuments] = React.useState({
        plan: null as UploadedFileState | null,
        budget: null as UploadedFileState | null,
        regulation: null as UploadedFileState | null,
        extras: [] as UploadedFileState[],
    });

    const role = user.data?.role;
    const canCreate =
        role === ROLES.CLB || role === ROLES.LCD || role === ROLES.DOANTRUONG;

    React.useEffect(() => {
        if (!canCreate) {
            navigate(paths.app.campaigns.getHref());
            return;
        }

        void Promise.allSettled([listOrganizations(), getOrganizerPaymentAccounts()]).then(
            (results) => {
                const organizationsResult = results[0];
                const paymentResult = results[1];

                if (organizationsResult.status === 'fulfilled') {
                    setOrganizations(organizationsResult.value);
                }

                if (paymentResult.status === 'fulfilled') {
                    setPaymentAccounts(paymentResult.value);
                    const defaultAccount =
                        paymentResult.value.find((account) => account.is_default) ??
                        paymentResult.value[0];
                    if (defaultAccount) {
                        setFundraising((current) => ({
                            ...current,
                            paymentAccountId: defaultAccount.id,
                        }));
                    }
                }
            },
        );
    }, [canCreate, navigate]);

    React.useEffect(() => {
        if (!basic.startAt || !basic.endAt) return;

        setFundraising((current) => ({
            ...current,
            startAt: current.startAt || basic.startAt,
            endAt: current.endAt || basic.endAt,
        }));
        setVolunteer((current) => ({
            ...current,
            activityStartAt: current.activityStartAt || basic.startAt,
            activityEndAt: current.activityEndAt || basic.endAt,
        }));
    }, [basic.endAt, basic.startAt]);

    const stepDefinitions = React.useMemo(() => {
        const base = [
            { id: 0, title: 'Mẫu chiến dịch' },
            { id: 1, title: 'Thông tin cơ bản' },
            {
                id: 2,
                title:
                    templateKind === 'multi_stage'
                        ? 'Cấu hình giai đoạn 1'
                        : 'Cấu hình module',
            },
        ];

        if (templateKind === 'volunteer' || templateKind === 'multi_stage') {
            base.push({
                id: 3,
                title:
                    templateKind === 'multi_stage'
                        ? 'Giai đoạn 2 tuyển TNV'
                        : 'Tuyển tình nguyện viên',
            });
        }

        base.push({
            id: 4,
            title: 'Hồ sơ, xem lại và gửi duyệt',
        });

        return base;
    }, [templateKind]);

    const currentStepIndex = React.useMemo(() => {
        const matchedIndex = stepDefinitions.findIndex(
            (step) => step.id === currentStep,
        );

        return matchedIndex >= 0 ? matchedIndex : 0;
    }, [currentStep, stepDefinitions]);

    React.useEffect(() => {
        if (stepDefinitions.some((step) => step.id === currentStep)) {
            return;
        }

        setCurrentStep(stepDefinitions[0]?.id ?? 0);
    }, [currentStep, stepDefinitions]);

    const basicErrors = React.useMemo(() => {
        const errors: Record<string, string> = {};

        if (!basic.title.trim()) errors.title = 'Tên chiến dịch là bắt buộc.';
        if (!basic.summary.trim()) errors.summary = 'Tóm tắt ngắn là bắt buộc.';
        if (basic.slogan.trim().length > 180) {
            errors.slogan = 'Slogan không được vượt quá 180 ký tự.';
        }
        if (!basic.description.trim()) {
            errors.description = 'Mô tả chi tiết là bắt buộc.';
        }
        if (!basic.startAt) errors.startAt = 'Vui lòng chọn thời gian bắt đầu.';
        if (!basic.endAt) errors.endAt = 'Vui lòng chọn thời gian kết thúc.';
        if (
            basic.startAt &&
            basic.endAt &&
            new Date(basic.endAt).getTime() < new Date(basic.startAt).getTime()
        ) {
            errors.endAt =
                'Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.';
        }
        if (!basic.coverFile) {
            errors.cover = 'Ảnh bìa là bắt buộc.';
        }

        return errors;
    }, [basic]);

    const fundraisingErrors = React.useMemo(() => {
        const errors: Record<string, string> = {};

        if (!fundraising.title.trim()) errors.title = 'Tên module gây quỹ là bắt buộc.';
        if (!fundraising.startAt) errors.startAt = 'Vui lòng chọn thời gian bắt đầu gây quỹ.';
        if (!fundraising.endAt) errors.endAt = 'Vui lòng chọn thời gian kết thúc gây quỹ.';
        if (
            fundraising.startAt &&
            fundraising.endAt &&
            new Date(fundraising.endAt).getTime() < new Date(fundraising.startAt).getTime()
        ) {
            errors.endAt = 'Thời gian kết thúc gây quỹ phải sau thời gian bắt đầu.';
        }
        if (!numericValue(fundraising.targetAmountText)) {
            errors.targetAmount = 'Mục tiêu gây quỹ phải lớn hơn 0.';
        }
        if (fundraising.useExistingAccount) {
            if (!fundraising.paymentAccountId) {
                errors.paymentAccountId = 'Vui lòng chọn tài khoản nhận tiền.';
            }
        } else {
            if (!fundraising.bankName.trim()) errors.bankName = 'Tên ngân hàng là bắt buộc.';
            if (!/^[0-9]{6,20}$/.test(fundraising.accountNumber.replace(/\s+/g, ''))) {
                errors.accountNumber = 'Số tài khoản phải gồm 6-20 chữ số.';
            }
            if (!fundraising.accountHolderName.trim()) {
                errors.accountHolderName = 'Tên người nhận là bắt buộc.';
            }
        }

        return errors;
    }, [fundraising]);

    const itemDonationErrors = React.useMemo(() => {
        const errors: Record<string, string> = {};

        if (!itemDonation.title.trim()) errors.title = 'Tên module hiện vật là bắt buộc.';
        if (!itemDonation.location) errors.location = 'Phải chọn địa điểm tiếp nhận trên bản đồ.';
        if (!itemDonation.receiverName.trim()) errors.receiverName = 'Người phụ trách là bắt buộc.';
        if (!/^(0|\\+84)[0-9]{8,10}$/.test(itemDonation.receiverPhone.trim())) {
            errors.receiverPhone = 'Số điện thoại người phụ trách không hợp lệ.';
        }
        if (
            itemDonation.receiveScheduleType === 'RANGE' &&
            (!itemDonation.receiveRangeStart || !itemDonation.receiveRangeEnd)
        ) {
            errors.schedule = 'Phải nhập khoảng thời gian tiếp nhận.';
        }
        if (
            itemDonation.receiveScheduleType === 'RANGE' &&
            itemDonation.receiveRangeStart &&
            itemDonation.receiveRangeEnd &&
            new Date(itemDonation.receiveRangeEnd).getTime() <
                new Date(itemDonation.receiveRangeStart).getTime()
        ) {
            errors.schedule = 'Ngày kết thúc tiếp nhận phải sau ngày bắt đầu.';
        }
        if (
            itemDonation.receiveScheduleType === 'SINGLE_DATE' &&
            !itemDonation.receiveSingleDate
        ) {
            errors.schedule = 'Phải nhập ngày tiếp nhận cố định.';
        }
        if (
            itemDonation.receiveScheduleType === 'MULTIPLE_DATES' &&
            !itemDonation.receiveMultipleDatesText.trim()
        ) {
            errors.schedule = 'Phải nhập ít nhất một ngày tiếp nhận.';
        }

        const invalidTarget = itemDonation.targets.find(
            (target) =>
                !target.name.trim() ||
                !target.unitName.trim() ||
                (target.hasTarget && Number(target.targetQuantity || '0') <= 0),
        );
        if (invalidTarget) {
            errors.targets =
                'Mỗi hiện vật phải có tên, đơn vị tính và số lượng mục tiêu hợp lệ nếu bật mục tiêu.';
        }

        return errors;
    }, [itemDonation]);

    const volunteerErrors = React.useMemo(() => {
        const errors: Record<string, string> = {};

        if (!volunteer.title.trim()) errors.title = 'Tên module tuyển TNV là bắt buộc.';
        if (Number(volunteer.requiredQuantity || '0') <= 0) {
            errors.requiredQuantity = 'Số lượng tình nguyện viên phải lớn hơn 0.';
        }
        if (!volunteer.registrationStartAt) {
            errors.registrationStartAt = 'Phải nhập thời gian mở đăng ký.';
        }
        if (!volunteer.registrationEndAt) {
            errors.registrationEndAt = 'Phải nhập hạn cuối đăng ký.';
        }
        if (
            volunteer.registrationStartAt &&
            volunteer.registrationEndAt &&
            new Date(volunteer.registrationEndAt).getTime() <
                new Date(volunteer.registrationStartAt).getTime()
        ) {
            errors.registrationEndAt =
                'Hạn cuối đăng ký phải sau thời gian mở đăng ký.';
        }
        if (!volunteer.activityStartAt) errors.activityStartAt = 'Phải nhập thời gian diễn ra hoạt động.';
        if (!volunteer.activityEndAt) errors.activityEndAt = 'Phải nhập thời gian kết thúc hoạt động.';
        if (
            volunteer.activityStartAt &&
            volunteer.activityEndAt &&
            new Date(volunteer.activityEndAt).getTime() <
                new Date(volunteer.activityStartAt).getTime()
        ) {
            errors.activityEndAt =
                'Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.';
        }
        if (!volunteer.location) errors.location = 'Phải chọn địa điểm hoạt động.';
        if (!volunteer.jobDescription.trim()) {
            errors.jobDescription = 'Mô tả công việc là bắt buộc.';
        }
        if (!volunteer.workItemsText.trim()) {
            errors.workItemsText = 'Phải nhập danh sách công việc cần làm.';
        }
        if (!volunteer.requirementsText.trim()) {
            errors.requirementsText = 'Phải nhập yêu cầu tham gia.';
        }
        if (
            (volunteer.scopeMode === 'SELECTED_FACULTIES' ||
                volunteer.scopeMode === 'SELECTED_CLUBS') &&
            volunteer.scopeTargetIds.length === 0
        ) {
            errors.scopeTargetIds = 'Phải chọn ít nhất một đơn vị trong phạm vi giới hạn.';
        }

        return errors;
    }, [volunteer]);

    const documentErrors = React.useMemo(() => {
        const errors: Record<string, string> = {};
        if (!documents.plan) {
            errors.plan = 'File kế hoạch PDF là bắt buộc trước khi gửi duyệt.';
        }

        return errors;
    }, [documents.plan]);

    const uploadAndStore = React.useCallback(
        async (
            key: string,
            file: File,
            kind: 'image' | 'document',
            onSuccess: (nextFile: UploadedFileState) => void,
        ) => {
            setUploadingKey(key);

            try {
                const uploaded = await uploadStorageFile({
                    file,
                    kind,
                    folder: `campaigns/${templateKind ?? 'draft'}`,
                });
                onSuccess(toUploadedFileState(uploaded));
                addNotification({
                    type: 'success',
                    title: 'Tải file thành công',
                    message: `${file.name} đã được lưu lên hệ thống.`,
                });
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Tải file thất bại',
                    message:
                        error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            } finally {
                setUploadingKey(null);
            }
        },
        [addNotification, templateKind],
    );

    const handleLocationSelected = React.useCallback((location: LocationItem) => {
        const nextLocation = toLocationState(location);

        if (locationDialogTarget === 'item') {
            setItemDonation((current) => ({
                ...current,
                location: nextLocation,
            }));
        }

        if (locationDialogTarget === 'volunteer') {
            setVolunteer((current) => ({
                ...current,
                location: nextLocation,
            }));
        }

        if (locationDialogTarget === 'phase2Volunteer') {
            setVolunteer((current) => ({
                ...current,
                location: nextLocation,
            }));
        }
    }, [locationDialogTarget]);

    const scopeOptions = React.useMemo(() => {
        if (role === ROLES.CLB) {
            return [
                { value: 'SCHOOL_WIDE', label: 'Không giới hạn sinh viên toàn trường' },
                { value: 'CLUB_MEMBERS_ONLY', label: 'Chỉ thành viên thuộc câu lạc bộ' },
            ];
        }

        if (role === ROLES.LCD) {
            return [
                { value: 'SCHOOL_WIDE', label: 'Không giới hạn sinh viên' },
                { value: 'FACULTY_ONLY', label: 'Chỉ sinh viên thuộc khoa quản lý' },
            ];
        }

        return [
            { value: 'SCHOOL_WIDE', label: 'Không giới hạn toàn trường' },
            { value: 'SELECTED_FACULTIES', label: 'Chỉ một số khoa' },
            { value: 'SELECTED_CLUBS', label: 'Chỉ một số câu lạc bộ' },
        ];
    }, [role]);

    const scopeOrganizations = React.useMemo(() => {
        if (volunteer.scopeMode === 'SELECTED_FACULTIES') {
            return organizations.filter((item) => item.type === 'FACULTY');
        }

        if (volunteer.scopeMode === 'SELECTED_CLUBS') {
            return organizations.filter((item) => item.type === 'CLUB');
        }

        return [];
    }, [organizations, volunteer.scopeMode]);

    const canGoNext = React.useMemo(() => {
        if (currentStep === 0) return Boolean(templateKind);
        if (currentStep === 1) return Object.keys(basicErrors).length === 0;
        if (currentStep === 2) {
            if (templateKind === 'fundraising') return Object.keys(fundraisingErrors).length === 0;
            if (templateKind === 'item_donation') return Object.keys(itemDonationErrors).length === 0;
            if (templateKind === 'volunteer') return Object.keys(volunteerErrors).length === 0;
            if (templateKind === 'multi_stage') {
                return multiStage.phaseOneType === 'fundraising'
                    ? Object.keys(fundraisingErrors).length === 0
                    : Object.keys(itemDonationErrors).length === 0;
            }
        }
        if (currentStep === 3) {
            return Object.keys(volunteerErrors).length === 0;
        }

        return true;
    }, [
        basicErrors,
        currentStep,
        fundraisingErrors,
        itemDonationErrors,
        multiStage.phaseOneType,
        templateKind,
        volunteerErrors,
    ]);

    const openLocationDialog = (target: 'item' | 'volunteer' | 'phase2Volunteer') =>
        setLocationDialogTarget(target);

    const goToPreviousStep = React.useCallback(() => {
        const previousStepId =
            stepDefinitions[Math.max(0, currentStepIndex - 1)]?.id ?? 0;

        setCurrentStep(previousStepId);
    }, [currentStepIndex, stepDefinitions]);

    const goToNextStep = React.useCallback(() => {
        const nextStepId =
            stepDefinitions[
                Math.min(stepDefinitions.length - 1, currentStepIndex + 1)
            ]?.id ?? currentStep;

        setCurrentStep(nextStepId);
    }, [currentStep, currentStepIndex, stepDefinitions]);

    const buildReceiveSchedule = () => {
        if (itemDonation.receiveScheduleType === 'SINGLE_DATE') {
            return {
                date: itemDonation.receiveSingleDate,
                time_start: itemDonation.receiveTimeStart || null,
                time_end: itemDonation.receiveTimeEnd || null,
            };
        }

        if (itemDonation.receiveScheduleType === 'MULTIPLE_DATES') {
            return {
                dates: itemDonation.receiveMultipleDatesText
                    .split('\n')
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                time_start: itemDonation.receiveTimeStart || null,
                time_end: itemDonation.receiveTimeEnd || null,
            };
        }

        return {
            start_at: itemDonation.receiveRangeStart,
            end_at: itemDonation.receiveRangeEnd,
            time_start: itemDonation.receiveTimeStart || null,
            time_end: itemDonation.receiveTimeEnd || null,
        };
    };

    const buildVolunteerScope = () => ({
        mode: volunteer.scopeMode,
        target_ids: volunteer.scopeTargetIds,
    });

    const buildModules = () => {
        const fundraisingModule = {
            type: 'fundraising' as const,
            title: fundraising.title.trim(),
            description: fundraising.description.trim() || undefined,
            start_at: toIsoDateTime(
                fundraising.startAt,
                'Thời gian bắt đầu gây quỹ',
                basic.startAt,
            ),
            end_at: toIsoDateTime(
                fundraising.endAt,
                'Thời gian kết thúc gây quỹ',
                basic.endAt,
            ),
            settings: {
                target_amount: numericValue(fundraising.targetAmountText),
                payment_account_id:
                    fundraising.useExistingAccount && fundraising.paymentAccountId
                        ? fundraising.paymentAccountId
                        : undefined,
                bank_name: fundraising.useExistingAccount
                    ? undefined
                    : fundraising.bankName.trim(),
                bank_account_no: fundraising.useExistingAccount
                    ? undefined
                    : fundraising.accountNumber.trim(),
                receiver_name: fundraising.useExistingAccount
                    ? undefined
                    : fundraising.accountHolderName.trim(),
                qr_file_id: fundraising.qrFile?.id,
                suggested_transfer_content:
                    fundraising.suggestedTransferContent.trim() || undefined,
                allow_anonymous_public_display:
                    fundraising.allowAnonymousPublicDisplay,
            },
        };

        const itemDonationModule = {
            type: 'item_donation' as const,
            title: itemDonation.title.trim(),
            description: itemDonation.description.trim() || undefined,
            start_at: toIsoDateTime(
                basic.startAt,
                'Thời gian bắt đầu chiến dịch',
            ),
            end_at: toIsoDateTime(
                basic.endAt,
                'Thời gian kết thúc chiến dịch',
            ),
            settings: {
                location: itemDonation.location
                    ? {
                          place_name: itemDonation.location.name,
                          address: itemDonation.location.address,
                          latitude: itemDonation.location.latitude,
                          longitude: itemDonation.location.longitude,
                      }
                    : undefined,
                receiver_name: itemDonation.receiverName.trim(),
                receiver_phone: itemDonation.receiverPhone.trim(),
                receiver_notes: itemDonation.receiverNotes.trim() || undefined,
                receive_schedule_type: itemDonation.receiveScheduleType,
                receive_schedule: buildReceiveSchedule(),
                targets: itemDonation.targets.map((target) => ({
                    name: target.name.trim(),
                    requirement_description:
                        target.requirementDescription.trim() || undefined,
                    accepted_condition: target.acceptedCondition,
                    has_target: target.hasTarget,
                    target_quantity: target.hasTarget
                        ? Number(target.targetQuantity || '0')
                        : undefined,
                    unit_name: target.unitName.trim(),
                })),
            },
        };

        const volunteerModule = {
            type: 'volunteer' as const,
            title: volunteer.title.trim(),
            description: volunteer.description.trim() || undefined,
            start_at: toIsoDateTime(
                volunteer.activityStartAt,
                'Thời gian bắt đầu hoạt động',
                basic.startAt,
            ),
            end_at: toIsoDateTime(
                volunteer.activityEndAt,
                'Thời gian kết thúc hoạt động',
                basic.endAt,
            ),
            registration_start_at: toIsoDateTime(
                volunteer.registrationStartAt,
                'Thời gian mở đăng ký',
                volunteer.activityStartAt || basic.startAt,
            ),
            registration_end_at: toIsoDateTime(
                volunteer.registrationEndAt,
                'Hạn cuối đăng ký',
                volunteer.activityEndAt || basic.endAt,
            ),
            settings: {
                required_quantity: Number(volunteer.requiredQuantity || '0'),
                location: volunteer.location
                    ? {
                          place_name: volunteer.location.name,
                          address: volunteer.location.address,
                          latitude: volunteer.location.latitude,
                          longitude: volunteer.location.longitude,
                      }
                    : undefined,
                job_description: volunteer.jobDescription.trim(),
                work_items: volunteer.workItemsText
                    .split('\n')
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                requirements_text: volunteer.requirementsText.trim(),
                benefits_text: volunteer.benefitsText.trim() || undefined,
                registration_approval_required:
                    volunteer.registrationApprovalRequired,
                bulk_approval_enabled: volunteer.bulkApprovalEnabled,
                waitlist_enabled: volunteer.waitlistEnabled,
                scope: buildVolunteerScope(),
            },
        };

        if (templateKind === 'fundraising') return [fundraisingModule];
        if (templateKind === 'item_donation') return [itemDonationModule];
        if (templateKind === 'volunteer') return [volunteerModule];
        if (multiStage.phaseOneType === 'fundraising') {
            return [fundraisingModule, volunteerModule];
        }

        return [itemDonationModule, volunteerModule];
    };

    const handleSubmit = async (submitForReview: boolean) => {
        if (!templateKind) {
            return;
        }

        if (submitForReview && Object.keys(documentErrors).length > 0) {
            addNotification({
                type: 'error',
                title: 'Thiếu hồ sơ gửi duyệt',
                message: documentErrors.plan,
            });
            return;
        }

        setSubmitting(true);

        try {
            const campaignDocuments: Array<{
                file_id: string;
                type: 'MASTER_PLAN' | 'BUDGET' | 'REGULATION' | 'OTHER';
            }> = [];

            if (documents.plan) {
                campaignDocuments.push({
                    file_id: documents.plan.id,
                    type: 'MASTER_PLAN',
                });
            }

            if (documents.budget) {
                campaignDocuments.push({
                    file_id: documents.budget.id,
                    type: 'BUDGET',
                });
            }

            if (documents.regulation) {
                campaignDocuments.push({
                    file_id: documents.regulation.id,
                    type: 'REGULATION',
                });
            }

            documents.extras.forEach((file) => {
                campaignDocuments.push({
                    file_id: file.id,
                    type: 'OTHER',
                });
            });

            const payload = {
                title: basic.title.trim(),
                summary: basic.summary.trim(),
                slogan: basic.slogan.trim() || undefined,
                description: basic.description.trim(),
                beneficiary: basic.beneficiary.trim() || undefined,
                cover_file_id: basic.coverFile!.id,
                logo_file_id: basic.logoFile?.id,
                start_at: toIsoDateTime(
                    basic.startAt,
                    'Thời gian bắt đầu chiến dịch',
                ),
                end_at: toIsoDateTime(
                    basic.endAt,
                    'Thời gian kết thúc chiến dịch',
                ),
                modules: buildModules(),
                documents: campaignDocuments,
                submit_for_review: submitForReview,
            };

            const created = await createManagedCampaign(payload);

            addNotification({
                type: 'success',
                title: submitForReview
                    ? 'Đã tạo và gửi duyệt chiến dịch'
                    : 'Đã lưu chiến dịch nháp',
                message: `Mã chiến dịch: ${created.id}`,
            });

            navigate(paths.app.campaigns.getHref());
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo chiến dịch thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const renderUploadTile = (
        label: string,
        file: UploadedFileState | null,
        accept: string,
        kind: 'image' | 'document',
        uploadKey: string,
        onUploaded: (nextFile: UploadedFileState | null) => void,
        optional?: boolean,
    ) => (
        <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#002A58]">
                        {label}
                    </p>
                    <p className="mt-1 text-sm text-[#667085]">
                        {optional ? 'Tùy chọn.' : 'Bắt buộc.'} Hỗ trợ `.jpg`,
                        `.jpeg`, `.png`, `.webp`.
                    </p>
                </div>
                {file ? (
                    <button
                        type="button"
                        onClick={() => onUploaded(null)}
                        className="inline-flex size-8 items-center justify-center rounded-full border border-[#D0D5DD] bg-white text-[#344054]"
                    >
                        <X className="size-4" />
                    </button>
                ) : null}
            </div>
            {file ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <img
                        src={file.publicUrl ?? file.accessUrl}
                        alt={label}
                        className="h-[120px] w-full rounded-xl object-cover"
                    />
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#101828]">
                            {file.originalName}
                        </p>
                        <p className="text-sm text-[#667085]">
                            {file.mimeType} · {fileSizeText(file.fileSize)}
                        </p>
                        <a
                            href={file.publicUrl ?? file.accessUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0E4686]"
                        >
                            Xem file
                        </a>
                    </div>
                </div>
            ) : null}
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#002A58] px-4 py-2 text-sm font-semibold text-white">
                {uploadingKey === uploadKey ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Upload className="size-4" />
                )}
                {file ? 'Thay file' : 'Tải file lên'}
                <input
                    accept={accept}
                    className="hidden"
                    type="file"
                    onChange={(event) => {
                        const selectedFile = event.target.files?.[0];
                        if (!selectedFile) return;
                        void uploadAndStore(
                            uploadKey,
                            selectedFile,
                            kind,
                            onUploaded,
                        );
                    }}
                />
            </label>
        </div>
    );

    const renderTemplateStep = () => (
        <SectionCard
            title="Bước 0: Chọn mẫu chiến dịch"
            description="Chọn đúng loại chiến dịch để hệ thống mở ra các trường nghiệp vụ phù hợp."
        >
            <div className="grid gap-4 lg:grid-cols-2">
                {templateCards.map((template) => {
                    const active = templateKind === template.id;

                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => {
                                setTemplateKind(template.id);
                                setCurrentStep(1);
                            }}
                            className={`rounded-2xl border p-5 text-left transition ${
                                active
                                    ? 'border-[#0E4686] bg-[#EEF3FB]'
                                    : 'border-[#D0D5DD] bg-white hover:border-[#98A2B3]'
                            }`}
                        >
                            <p className="text-lg font-semibold text-[#002A58]">
                                {template.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#475467]">
                                {template.description}
                            </p>
                        </button>
                    );
                })}
            </div>
        </SectionCard>
    );

    const renderBasicStep = () => (
        <SectionCard
            title="Bước 1: Thông tin cơ bản"
            description="Bổ sung đầy đủ ảnh bìa, logo, slogan, mô tả và thời gian chiến dịch. Phạm vi tham gia sẽ cấu hình trong từng module cần phạm vi."
        >
            <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Tên chiến dịch" error={basicErrors.title}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={basic.title}
                        onChange={(event) =>
                            setBasic((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Slogan chiến dịch" error={basicErrors.slogan} hint="Tối đa 180 ký tự, không bắt buộc.">
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={basic.slogan}
                        onChange={(event) =>
                            setBasic((current) => ({
                                ...current,
                                slogan: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Tóm tắt ngắn" error={basicErrors.summary}>
                    <textarea
                        className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                        value={basic.summary}
                        onChange={(event) =>
                            setBasic((current) => ({
                                ...current,
                                summary: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Đối tượng thụ hưởng" hint="Không bắt buộc.">
                    <textarea
                        className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                        value={basic.beneficiary}
                        onChange={(event) =>
                            setBasic((current) => ({
                                ...current,
                                beneficiary: event.target.value,
                            }))
                        }
                    />
                </Field>
                <div className="lg:col-span-2">
                    <Field label="Mô tả chi tiết / mục tiêu chiến dịch" error={basicErrors.description}>
                        <textarea
                            className="min-h-[160px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={basic.description}
                            onChange={(event) =>
                                setBasic((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                <Field label="Bắt đầu dự kiến" error={basicErrors.startAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={toDateTimeInput(basic.startAt)}
                        onChange={(event) =>
                            setBasic((current) => ({
                                ...current,
                                startAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Kết thúc dự kiến" error={basicErrors.endAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={toDateTimeInput(basic.endAt)}
                        onChange={(event) =>
                            setBasic((current) => ({
                                ...current,
                                endAt: event.target.value,
                            }))
                        }
                    />
                </Field>
            </div>
            <div className="grid gap-5 mt-6 lg:grid-cols-2">
                <div>
                    {renderUploadTile(
                        'Ảnh bìa / thumbnail',
                        basic.coverFile,
                        '.jpg,.jpeg,.png,.webp',
                        'image',
                        'cover',
                        (nextFile) =>
                            setBasic((current) => ({
                                ...current,
                                coverFile: nextFile,
                            })),
                    )}
                    {basicErrors.cover ? (
                        <p className="mt-2 text-sm text-[#B42318]">
                            {basicErrors.cover}
                        </p>
                    ) : null}
                </div>
                {renderUploadTile(
                    'Logo chiến dịch',
                    basic.logoFile,
                    '.jpg,.jpeg,.png,.webp',
                    'image',
                    'logo',
                    (nextFile) =>
                        setBasic((current) => ({
                            ...current,
                            logoFile: nextFile,
                        })),
                    true,
                )}
            </div>

            <div className="mt-6 rounded-2xl border border-[#D0D5DD] bg-[#F8FAFC] p-5">
                <p className="text-sm font-semibold text-[#002A58]">Preview chiến dịch</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white">
                        {basic.coverFile ? (
                            <img
                                src={basic.coverFile.publicUrl ?? basic.coverFile.accessUrl}
                                alt="Ảnh bìa chiến dịch"
                                className="h-[180px] w-full object-cover"
                            />
                        ) : (
                            <div className="grid h-[180px] place-items-center bg-[#EAECF0] text-sm text-[#667085]">
                                Chưa có ảnh bìa
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl border border-[#D0D5DD] bg-white p-5">
                        <div className="flex items-start gap-4">
                            {basic.logoFile ? (
                                <img
                                    src={basic.logoFile.publicUrl ?? basic.logoFile.accessUrl}
                                    alt="Logo chiến dịch"
                                    className="object-cover size-16 rounded-xl"
                                />
                            ) : (
                                <div className="grid size-16 place-items-center rounded-xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC] text-[#667085]">
                                    <ImagePlus className="size-5" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-xl font-semibold text-[#002A58]">
                                    {basic.title.trim() || 'Tên chiến dịch'}
                                </p>
                                {basic.slogan.trim() ? (
                                    <p className="mt-2 text-sm font-medium text-[#0E4686]">
                                        {basic.slogan.trim()}
                                    </p>
                                ) : null}
                                <p className="mt-3 text-sm leading-6 text-[#475467]">
                                    {basic.summary.trim() || 'Tóm tắt sẽ hiển thị ở đây khi bạn nhập.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SectionCard>
    );

    const renderFundraisingForm = () => (
        <SectionCard
            title={
                templateKind === 'multi_stage'
                    ? 'Bước 2: Giai đoạn 1 - Gây quỹ'
                    : 'Bước 2: Cấu hình module gây quỹ'
            }
            description="Thiết lập tài khoản nhận tiền, mục tiêu gây quỹ, QR ngân hàng và định dạng số tiền theo VND."
        >
            <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Tên module gây quỹ" error={fundraisingErrors.title}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={fundraising.title}
                        onChange={(event) =>
                            setFundraising((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Mục tiêu gây quỹ" error={fundraisingErrors.targetAmount}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={formatCurrency(fundraising.targetAmountText)}
                        onChange={(event) =>
                            setFundraising((current) => ({
                                ...current,
                                targetAmountText: event.target.value.replace(/\D+/g, ''),
                            }))
                        }
                        inputMode="numeric"
                    />
                </Field>
                <Field label="Bắt đầu gây quỹ" error={fundraisingErrors.startAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={fundraising.startAt}
                        onChange={(event) =>
                            setFundraising((current) => ({
                                ...current,
                                startAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Kết thúc gây quỹ" error={fundraisingErrors.endAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={fundraising.endAt}
                        onChange={(event) =>
                            setFundraising((current) => ({
                                ...current,
                                endAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <div className="lg:col-span-2">
                    <Field label="Mô tả module">
                        <textarea
                            className="min-h-[120px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={fundraising.description}
                            onChange={(event) =>
                                setFundraising((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D0D5DD] bg-[#F8FAFC] p-5">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            setFundraising((current) => ({
                                ...current,
                                useExistingAccount: true,
                            }))
                        }
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                            fundraising.useExistingAccount
                                ? 'border-[#0E4686] bg-[#EEF3FB] text-[#0E4686]'
                                : 'border-[#D0D5DD] bg-white text-[#344054]'
                        }`}
                    >
                        Chọn tài khoản đã lưu
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setFundraising((current) => ({
                                ...current,
                                useExistingAccount: false,
                            }))
                        }
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                            !fundraising.useExistingAccount
                                ? 'border-[#0E4686] bg-[#EEF3FB] text-[#0E4686]'
                                : 'border-[#D0D5DD] bg-white text-[#344054]'
                        }`}
                    >
                        Thêm tài khoản mới
                    </button>
                </div>

                {fundraising.useExistingAccount ? (
                    <div className="mt-4">
                        <Field label="Tài khoản nhận tiền" error={fundraisingErrors.paymentAccountId}>
                            <select
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                value={fundraising.paymentAccountId}
                                onChange={(event) =>
                                    setFundraising((current) => ({
                                        ...current,
                                        paymentAccountId: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Chọn tài khoản đã lưu</option>
                                {paymentAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.display_name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                ) : (
                    <div className="grid gap-5 mt-4 lg:grid-cols-3">
                        <Field label="Tên ngân hàng" error={fundraisingErrors.bankName}>
                            <input
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                value={fundraising.bankName}
                                onChange={(event) =>
                                    setFundraising((current) => ({
                                        ...current,
                                        bankName: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="Số tài khoản" error={fundraisingErrors.accountNumber}>
                            <input
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                inputMode="numeric"
                                value={fundraising.accountNumber}
                                onChange={(event) =>
                                    setFundraising((current) => ({
                                        ...current,
                                        accountNumber: event.target.value.replace(/[^0-9 ]+/g, ''),
                                    }))
                                }
                            />
                        </Field>
                        <Field label="Tên người nhận / chủ tài khoản" error={fundraisingErrors.accountHolderName}>
                            <input
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                value={fundraising.accountHolderName}
                                onChange={(event) =>
                                    setFundraising((current) => ({
                                        ...current,
                                        accountHolderName: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                )}
            </div>

            <div className="grid gap-5 mt-6 lg:grid-cols-2">
                <Field label="Nội dung chuyển khoản gợi ý">
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={fundraising.suggestedTransferContent}
                        onChange={(event) =>
                            setFundraising((current) => ({
                                ...current,
                                suggestedTransferContent: event.target.value,
                            }))
                        }
                    />
                </Field>
                <label className="flex items-center gap-3 rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 py-3 text-sm text-[#344054]">
                    <input
                        checked={fundraising.allowAnonymousPublicDisplay}
                        type="checkbox"
                        onChange={(event) =>
                            setFundraising((current) => ({
                                ...current,
                                allowAnonymousPublicDisplay: event.target.checked,
                            }))
                        }
                    />
                    Cho phép hiển thị ủng hộ ẩn danh nếu người dùng chọn.
                </label>
            </div>

            <div className="mt-6">
                {renderUploadTile(
                    'QR ngân hàng',
                    fundraising.qrFile,
                    '.jpg,.jpeg,.png,.webp',
                    'image',
                    'fundraising-qr',
                    (nextFile) =>
                        setFundraising((current) => ({
                            ...current,
                            qrFile: nextFile,
                        })),
                    true,
                )}
            </div>
        </SectionCard>
    );

    const renderItemDonationForm = () => (
        <SectionCard
            title={
                templateKind === 'multi_stage'
                    ? 'Bước 2: Giai đoạn 1 - Quyên góp hiện vật'
                    : 'Bước 2: Cấu hình module quyên góp hiện vật'
            }
            description="Thiết lập danh sách hiện vật, thời gian tiếp nhận, địa điểm trên bản đồ và người phụ trách."
        >
            <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Tên module hiện vật" error={itemDonationErrors.title}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={itemDonation.title}
                        onChange={(event) =>
                            setItemDonation((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Người phụ trách tiếp nhận" error={itemDonationErrors.receiverName}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={itemDonation.receiverName}
                        onChange={(event) =>
                            setItemDonation((current) => ({
                                ...current,
                                receiverName: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Số điện thoại liên hệ" error={itemDonationErrors.receiverPhone}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        inputMode="tel"
                        value={itemDonation.receiverPhone}
                        onChange={(event) =>
                            setItemDonation((current) => ({
                                ...current,
                                receiverPhone: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Kiểu thời gian tiếp nhận" error={itemDonationErrors.schedule}>
                    <select
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={itemDonation.receiveScheduleType}
                        onChange={(event) =>
                            setItemDonation((current) => ({
                                ...current,
                                receiveScheduleType: event.target.value as
                                    | 'RANGE'
                                    | 'SINGLE_DATE'
                                    | 'MULTIPLE_DATES',
                            }))
                        }
                    >
                        <option value="RANGE">Khoảng thời gian</option>
                        <option value="SINGLE_DATE">Một ngày cố định</option>
                        <option value="MULTIPLE_DATES">Nhiều ngày rời rạc</option>
                    </select>
                </Field>
                <div className="lg:col-span-2">
                    <Field label="Mô tả module hiện vật">
                        <textarea
                            className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={itemDonation.description}
                            onChange={(event) =>
                                setItemDonation((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                {itemDonation.receiveScheduleType === 'RANGE' ? (
                    <>
                        <Field label="Ngày bắt đầu tiếp nhận">
                            <input
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                type="date"
                                value={itemDonation.receiveRangeStart}
                                onChange={(event) =>
                                    setItemDonation((current) => ({
                                        ...current,
                                        receiveRangeStart: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="Ngày kết thúc tiếp nhận">
                            <input
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                type="date"
                                value={itemDonation.receiveRangeEnd}
                                onChange={(event) =>
                                    setItemDonation((current) => ({
                                        ...current,
                                        receiveRangeEnd: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </>
                ) : null}
                {itemDonation.receiveScheduleType === 'SINGLE_DATE' ? (
                    <div className="lg:col-span-2">
                        <Field label="Ngày tiếp nhận">
                            <input
                                className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                type="date"
                                value={itemDonation.receiveSingleDate}
                                onChange={(event) =>
                                    setItemDonation((current) => ({
                                        ...current,
                                        receiveSingleDate: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                ) : null}
                {itemDonation.receiveScheduleType === 'MULTIPLE_DATES' ? (
                    <div className="lg:col-span-2">
                        <Field label="Danh sách ngày tiếp nhận" hint="Mỗi dòng một ngày hoặc ghi chú thời gian tiếp nhận.">
                            <textarea
                                className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                                value={itemDonation.receiveMultipleDatesText}
                                onChange={(event) =>
                                    setItemDonation((current) => ({
                                        ...current,
                                        receiveMultipleDatesText: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                ) : null}
                <Field label="Giờ bắt đầu tiếp nhận">
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="time"
                        value={itemDonation.receiveTimeStart}
                        onChange={(event) =>
                            setItemDonation((current) => ({
                                ...current,
                                receiveTimeStart: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Giờ kết thúc tiếp nhận">
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="time"
                        value={itemDonation.receiveTimeEnd}
                        onChange={(event) =>
                            setItemDonation((current) => ({
                                ...current,
                                receiveTimeEnd: event.target.value,
                            }))
                        }
                    />
                </Field>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D0D5DD] bg-[#F8FAFC] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#002A58]">
                            Địa điểm tiếp nhận
                        </p>
                        <p className="mt-1 text-sm text-[#667085]">
                            Chọn bằng bản đồ để lưu đủ địa chỉ, kinh độ và vĩ độ.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openLocationDialog('item')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-semibold text-[#344054]"
                    >
                        <MapPin className="size-4" />
                        Chọn trên bản đồ
                    </button>
                </div>
                {itemDonation.location ? (
                    <div className="mt-4 rounded-xl border border-[#D0D5DD] bg-white p-4">
                        <p className="font-semibold text-[#101828]">
                            {itemDonation.location.name}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#475467]">
                            {itemDonation.location.address}
                        </p>
                    </div>
                ) : null}
                {itemDonationErrors.location ? (
                    <p className="mt-3 text-sm text-[#B42318]">
                        {itemDonationErrors.location}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-5 mt-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#002A58]">
                            Danh sách hiện vật cần quyên góp
                        </p>
                        <p className="mt-1 text-sm text-[#667085]">
                            Mỗi dòng có thể đặt hoặc không đặt mục tiêu số lượng.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            setItemDonation((current) => ({
                                ...current,
                                targets: [...current.targets, buildItemTarget()],
                            }))
                        }
                        className="rounded-xl bg-[#002A58] px-4 py-2 text-sm font-semibold text-white"
                    >
                        Thêm hiện vật
                    </button>
                </div>
                {itemDonation.targets.map((target, index) => (
                    <div
                        key={target.id}
                        className="rounded-2xl border border-[#D0D5DD] bg-white p-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-[#101828]">
                                Hiện vật #{index + 1}
                            </p>
                            {itemDonation.targets.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setItemDonation((current) => ({
                                            ...current,
                                            targets: current.targets.filter(
                                                (item) => item.id !== target.id,
                                            ),
                                        }))
                                    }
                                    className="text-sm font-semibold text-[#B42318]"
                                >
                                    Xóa
                                </button>
                            ) : null}
                        </div>
                        <div className="grid gap-4 mt-4 lg:grid-cols-2">
                            <Field label="Tên hiện vật">
                                <input
                                    className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                    value={target.name}
                                    onChange={(event) =>
                                        setItemDonation((current) => ({
                                            ...current,
                                            targets: current.targets.map((item) =>
                                                item.id === target.id
                                                    ? {
                                                          ...item,
                                                          name: event.target.value,
                                                      }
                                                    : item,
                                            ),
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Đơn vị tính">
                                <select
                                    className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                    value={target.unitName}
                                    onChange={(event) =>
                                        setItemDonation((current) => ({
                                            ...current,
                                            targets: current.targets.map((item) =>
                                                item.id === target.id
                                                    ? {
                                                          ...item,
                                                          unitName:
                                                              event.target.value,
                                                      }
                                                    : item,
                                            ),
                                        }))
                                    }
                                >
                                    {itemUnits.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Tình trạng chấp nhận">
                                <select
                                    className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                    value={target.acceptedCondition}
                                    onChange={(event) =>
                                        setItemDonation((current) => ({
                                            ...current,
                                            targets: current.targets.map((item) =>
                                                item.id === target.id
                                                    ? {
                                                          ...item,
                                                          acceptedCondition:
                                                              event.target
                                                                  .value as ItemTargetForm['acceptedCondition'],
                                                      }
                                                    : item,
                                            ),
                                        }))
                                    }
                                >
                                    <option value="NEW">Mới</option>
                                    <option value="USED_GOOD">
                                        Đã qua sử dụng nhưng còn tốt
                                    </option>
                                    <option value="BOTH">Cả hai</option>
                                </select>
                            </Field>
                            <Field label="Số lượng mục tiêu">
                                <div className="grid gap-3">
                                    <label className="flex items-center gap-3 text-sm text-[#344054]">
                                        <input
                                            checked={target.hasTarget}
                                            type="checkbox"
                                            onChange={(event) =>
                                                setItemDonation((current) => ({
                                                    ...current,
                                                    targets: current.targets.map(
                                                        (item) =>
                                                            item.id === target.id
                                                                ? {
                                                                      ...item,
                                                                      hasTarget:
                                                                          event
                                                                              .target
                                                                              .checked,
                                                                  }
                                                                : item,
                                                    ),
                                                }))
                                            }
                                        />
                                        Có đặt mục tiêu số lượng
                                    </label>
                                    <input
                                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                                        disabled={!target.hasTarget}
                                        inputMode="numeric"
                                        value={target.targetQuantity}
                                        onChange={(event) =>
                                            setItemDonation((current) => ({
                                                ...current,
                                                targets: current.targets.map(
                                                    (item) =>
                                                        item.id === target.id
                                                            ? {
                                                                  ...item,
                                                                  targetQuantity:
                                                                      event.target.value.replace(
                                                                          /\\D+/g,
                                                                          '',
                                                                      ),
                                                              }
                                                            : item,
                                                ),
                                            }))
                                        }
                                    />
                                </div>
                            </Field>
                            <div className="lg:col-span-2">
                                <Field label="Mô tả yêu cầu">
                                    <textarea
                                        className="min-h-[96px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                                        value={target.requirementDescription}
                                        onChange={(event) =>
                                            setItemDonation((current) => ({
                                                ...current,
                                                targets: current.targets.map(
                                                    (item) =>
                                                        item.id === target.id
                                                            ? {
                                                                  ...item,
                                                                  requirementDescription:
                                                                      event.target
                                                                          .value,
                                                              }
                                                            : item,
                                                ),
                                            }))
                                        }
                                    />
                                </Field>
                            </div>
                        </div>
                    </div>
                ))}
                {itemDonationErrors.targets ? (
                    <p className="text-sm text-[#B42318]">
                        {itemDonationErrors.targets}
                    </p>
                ) : null}
            </div>
        </SectionCard>
    );

    const renderVolunteerForm = (stepTitle: string) => (
        <SectionCard
            title={stepTitle}
            description="Thiết lập thời gian mở đăng ký, số lượng cần tuyển, phạm vi tham gia và địa điểm triển khai."
        >
            <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Tên module tuyển TNV" error={volunteerErrors.title}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={volunteer.title}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Số lượng cần tuyển" error={volunteerErrors.requiredQuantity}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        inputMode="numeric"
                        value={volunteer.requiredQuantity}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                requiredQuantity: event.target.value.replace(/\D+/g, ''),
                            }))
                        }
                    />
                </Field>
                <Field label="Mở đăng ký" error={volunteerErrors.registrationStartAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={volunteer.registrationStartAt}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                registrationStartAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Hạn cuối đăng ký" error={volunteerErrors.registrationEndAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={volunteer.registrationEndAt}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                registrationEndAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Bắt đầu hoạt động" error={volunteerErrors.activityStartAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={volunteer.activityStartAt}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                activityStartAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <Field label="Kết thúc hoạt động" error={volunteerErrors.activityEndAt}>
                    <input
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        type="datetime-local"
                        value={volunteer.activityEndAt}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                activityEndAt: event.target.value,
                            }))
                        }
                    />
                </Field>
                <div className="lg:col-span-2">
                    <Field label="Mô tả công việc" error={volunteerErrors.jobDescription}>
                        <textarea
                            className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={volunteer.jobDescription}
                            onChange={(event) =>
                                setVolunteer((current) => ({
                                    ...current,
                                    jobDescription: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                <div className="lg:col-span-2">
                    <Field label="Danh sách công việc cần làm" error={volunteerErrors.workItemsText} hint="Mỗi dòng là một đầu việc.">
                        <textarea
                            className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={volunteer.workItemsText}
                            onChange={(event) =>
                                setVolunteer((current) => ({
                                    ...current,
                                    workItemsText: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                <div className="lg:col-span-2">
                    <Field label="Yêu cầu tham gia" error={volunteerErrors.requirementsText}>
                        <textarea
                            className="min-h-[110px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={volunteer.requirementsText}
                            onChange={(event) =>
                                setVolunteer((current) => ({
                                    ...current,
                                    requirementsText: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                <div className="lg:col-span-2">
                    <Field label="Quyền lợi" hint="Không bắt buộc.">
                        <textarea
                            className="min-h-[96px] rounded-xl border border-[#D0D5DD] px-4 py-3"
                            value={volunteer.benefitsText}
                            onChange={(event) =>
                                setVolunteer((current) => ({
                                    ...current,
                                    benefitsText: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D0D5DD] bg-[#F8FAFC] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#002A58]">
                            Địa điểm hoạt động
                        </p>
                        <p className="mt-1 text-sm text-[#667085]">
                            Hoạt động offline bắt buộc phải có địa điểm và tọa độ.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            openLocationDialog(
                                templateKind === 'multi_stage'
                                    ? 'phase2Volunteer'
                                    : 'volunteer',
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-semibold text-[#344054]"
                    >
                        <MapPin className="size-4" />
                        Chọn trên bản đồ
                    </button>
                </div>
                {volunteer.location ? (
                    <div className="mt-4 rounded-xl border border-[#D0D5DD] bg-white p-4">
                        <p className="font-semibold text-[#101828]">
                            {volunteer.location.name}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#475467]">
                            {volunteer.location.address}
                        </p>
                    </div>
                ) : null}
                {volunteerErrors.location ? (
                    <p className="mt-3 text-sm text-[#B42318]">
                        {volunteerErrors.location}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-5 mt-6 lg:grid-cols-2">
                <Field label="Phạm vi tuyển tình nguyện viên" error={volunteerErrors.scopeTargetIds}>
                    <select
                        className="h-12 rounded-xl border border-[#D0D5DD] px-4"
                        value={volunteer.scopeMode}
                        onChange={(event) =>
                            setVolunteer((current) => ({
                                ...current,
                                scopeMode: event.target.value,
                                scopeTargetIds: [],
                            }))
                        }
                    >
                        {scopeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <div className="rounded-2xl border border-[#D0D5DD] bg-[#F8FAFC] p-4">
                    <p className="text-sm font-semibold text-[#002A58]">
                        Quy trình duyệt đăng ký
                    </p>
                    <div className="grid gap-3 mt-3">
                        <label className="flex items-center gap-3 text-sm text-[#344054]">
                            <input
                                checked={volunteer.registrationApprovalRequired}
                                type="checkbox"
                                onChange={(event) =>
                                    setVolunteer((current) => ({
                                        ...current,
                                        registrationApprovalRequired:
                                            event.target.checked,
                                    }))
                                }
                            />
                            Có cần duyệt đăng ký
                        </label>
                        <label className="flex items-center gap-3 text-sm text-[#344054]">
                            <input
                                checked={volunteer.bulkApprovalEnabled}
                                type="checkbox"
                                onChange={(event) =>
                                    setVolunteer((current) => ({
                                        ...current,
                                        bulkApprovalEnabled:
                                            event.target.checked,
                                    }))
                                }
                            />
                            Cho phép duyệt hàng loạt
                        </label>
                        <label className="flex items-center gap-3 text-sm text-[#344054]">
                            <input
                                checked={volunteer.waitlistEnabled}
                                type="checkbox"
                                onChange={(event) =>
                                    setVolunteer((current) => ({
                                        ...current,
                                        waitlistEnabled: event.target.checked,
                                    }))
                                }
                            />
                            Cho phép danh sách chờ
                        </label>
                    </div>
                </div>
            </div>

            {scopeOrganizations.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-[#D0D5DD] bg-white p-5">
                    <p className="text-sm font-semibold text-[#002A58]">
                        Chọn đơn vị trong phạm vi giới hạn
                    </p>
                    <div className="grid gap-3 mt-4 md:grid-cols-2 xl:grid-cols-3">
                        {scopeOrganizations.map((organization) => (
                            <label
                                key={organization.id}
                                className="flex items-start gap-3 rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] p-3 text-sm text-[#344054]"
                            >
                                <input
                                    checked={volunteer.scopeTargetIds.includes(
                                        organization.id,
                                    )}
                                    type="checkbox"
                                    onChange={(event) =>
                                        setVolunteer((current) => ({
                                            ...current,
                                            scopeTargetIds: event.target.checked
                                                ? [
                                                      ...current.scopeTargetIds,
                                                      organization.id,
                                                  ]
                                                : current.scopeTargetIds.filter(
                                                      (item) =>
                                                          item !== organization.id,
                                                  ),
                                        }))
                                    }
                                />
                                <span>{organization.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ) : null}
        </SectionCard>
    );

    const renderReviewStep = () => (
        <div className="space-y-6">
            <SectionCard
                title="Bước cuối: Hồ sơ gửi duyệt"
                description="Kế hoạch PDF là bắt buộc trước khi gửi duyệt. Dự trù và công văn là tùy chọn."
            >
                <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                        {renderUploadTile(
                            'Kế hoạch PDF',
                            documents.plan,
                            '.pdf',
                            'document',
                            'plan',
                            (nextFile) =>
                                setDocuments((current) => ({
                                    ...current,
                                    plan: nextFile,
                                })),
                        )}
                        {documentErrors.plan ? (
                            <p className="mt-2 text-sm text-[#B42318]">
                                {documentErrors.plan}
                            </p>
                        ) : null}
                    </div>
                    {renderUploadTile(
                        'Dự trù kinh phí PDF',
                        documents.budget,
                        '.pdf',
                        'document',
                        'budget',
                        (nextFile) =>
                            setDocuments((current) => ({
                                ...current,
                                budget: nextFile,
                            })),
                        true,
                    )}
                    {renderUploadTile(
                        'Công văn / tài liệu liên quan PDF',
                        documents.regulation,
                        '.pdf',
                        'document',
                        'regulation',
                        (nextFile) =>
                            setDocuments((current) => ({
                                ...current,
                                regulation: nextFile,
                            })),
                        true,
                    )}
                    <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC] p-4">
                        <p className="text-sm font-semibold text-[#002A58]">
                            File bổ sung
                        </p>
                        <p className="mt-1 text-sm text-[#667085]">
                            Có thể tải lên nhiều file PDF bổ sung nếu cần.
                        </p>
                        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#002A58] px-4 py-2 text-sm font-semibold text-white">
                            {uploadingKey === 'extra-doc' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Upload className="size-4" />
                            )}
                            Thêm file bổ sung
                            <input
                                accept=".pdf"
                                className="hidden"
                                type="file"
                                onChange={(event) => {
                                    const selectedFile = event.target.files?.[0];
                                    if (!selectedFile) return;
                                    void uploadAndStore(
                                        'extra-doc',
                                        selectedFile,
                                        'document',
                                        (nextFile) =>
                                            setDocuments((current) => ({
                                                ...current,
                                                extras: [
                                                    ...current.extras,
                                                    nextFile,
                                                ],
                                            })),
                                    );
                                }}
                            />
                        </label>
                        <div className="mt-4 space-y-3">
                            {documents.extras.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-[#D0D5DD] bg-white px-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#101828]">
                                            {file.originalName}
                                        </p>
                                        <p className="text-sm text-[#667085]">
                                            {fileSizeText(file.fileSize)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDocuments((current) => ({
                                                ...current,
                                                extras: current.extras.filter(
                                                    (item) => item.id !== file.id,
                                                ),
                                            }))
                                        }
                                        className="text-sm font-semibold text-[#B42318]"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                title="Xem lại trước khi gửi duyệt"
                description="Kiểm tra nhanh thông tin chiến dịch, module và hồ sơ trước khi lưu nháp hoặc gửi duyệt."
            >
                <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white">
                        {basic.coverFile ? (
                            <img
                                src={basic.coverFile.publicUrl ?? basic.coverFile.accessUrl}
                                alt="Ảnh bìa chiến dịch"
                                className="h-[180px] w-full object-cover"
                            />
                        ) : (
                            <div className="grid h-[180px] place-items-center bg-[#EAECF0] text-sm text-[#667085]">
                                Chưa có ảnh bìa
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 rounded-2xl border border-[#D0D5DD] bg-white p-5">
                        <div>
                            <p className="text-xl font-semibold text-[#002A58]">
                                {basic.title}
                            </p>
                            {basic.slogan.trim() ? (
                                <p className="mt-2 text-sm font-medium text-[#0E4686]">
                                    {basic.slogan}
                                </p>
                            ) : null}
                        </div>
                        <p className="text-sm leading-6 text-[#475467]">
                            {basic.summary}
                        </p>
                        <div className="grid gap-3 text-sm text-[#344054] lg:grid-cols-2">
                            <div>
                                <span className="font-semibold">Bắt đầu:</span>{' '}
                                {basic.startAt || 'Chưa nhập'}
                            </div>
                            <div>
                                <span className="font-semibold">Kết thúc:</span>{' '}
                                {basic.endAt || 'Chưa nhập'}
                            </div>
                            <div>
                                <span className="font-semibold">Mẫu chiến dịch:</span>{' '}
                                {
                                    templateCards.find(
                                        (item) => item.id === templateKind,
                                    )?.title
                                }
                            </div>
                            <div>
                                <span className="font-semibold">Hồ sơ kế hoạch:</span>{' '}
                                {documents.plan?.originalName ?? 'Chưa tải lên'}
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );

    return (
        <>
            <Head title="Tạo chiến dịch" />
            <ContentLayout title="Tạo chiến dịch">
                <div className="py-6 mx-auto space-y-6 max-w-7xl">
                    <section className="flex flex-col gap-4 rounded-2xl border border-[#D0D5DD] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
                                Khu vực quản lý chiến dịch
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold text-[#002A58]">
                                Hoàn thiện luồng tạo chiến dịch
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#475467]">
                                Wizard này dùng API backend thật, lưu file qua
                                Supabase Storage và chỉ cho phép gửi duyệt khi
                                hồ sơ, module và dữ liệu bắt buộc đã đầy đủ.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(paths.app.campaigns.getHref())}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#344054]"
                        >
                            <ArrowLeft className="size-4" />
                            Quay lại quản lý chiến dịch
                        </button>
                    </section>

                    <section className="rounded-2xl border border-[#D0D5DD] bg-white p-5">
                        <div className="flex flex-wrap gap-3">
                            {stepDefinitions.map((step, index) => {
                                const active = currentStepIndex === index;
                                const complete = currentStepIndex > index;

                                return (
                                    <div
                                        key={step.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                                                active
                                                    ? 'border-[#0E4686] bg-[#0E4686] text-white'
                                                    : complete
                                                      ? 'border-[#027A48] bg-[#027A48] text-white'
                                                      : 'border-[#D0D5DD] bg-white text-[#667085]'
                                            }`}
                                        >
                                            {complete ? (
                                                <Check className="size-4" />
                                            ) : (
                                                step.id
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#002A58]">
                                                {step.title}
                                            </p>
                                        </div>
                                        {index < stepDefinitions.length - 1 ? (
                                            <div className="hidden h-px w-10 bg-[#D0D5DD] md:block" />
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {currentStep === 0 ? renderTemplateStep() : null}
                    {currentStep === 1 ? renderBasicStep() : null}
                    {currentStep === 2 && templateKind === 'fundraising'
                        ? renderFundraisingForm()
                        : null}
                    {currentStep === 2 && templateKind === 'item_donation'
                        ? renderItemDonationForm()
                        : null}
                    {currentStep === 2 && templateKind === 'volunteer'
                        ? renderVolunteerForm('Bước 2: Cấu hình tuyển tình nguyện viên')
                        : null}
                    {currentStep === 2 &&
                    templateKind === 'multi_stage' &&
                    multiStage.phaseOneType === 'fundraising'
                        ? (
                              <div className="space-y-6">
                                  <SectionCard
                                      title="Chọn giai đoạn 1"
                                      description="Chiến dịch nhiều giai đoạn bắt đầu bằng gây quỹ hoặc quyên góp hiện vật."
                                  >
                                      <div className="flex flex-wrap gap-3">
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  setMultiStage({
                                                      phaseOneType:
                                                          'fundraising',
                                                  })
                                              }
                                              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                                                  multiStage.phaseOneType ===
                                                  ('fundraising' as 'fundraising' | 'item_donation')
                                                      ? 'border-[#0E4686] bg-[#EEF3FB] text-[#0E4686]'
                                                      : 'border-[#D0D5DD] bg-white text-[#344054]'
                                              }`}
                                          >
                                              Gây quỹ
                                          </button>
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  setMultiStage({
                                                      phaseOneType:
                                                          'item_donation',
                                                  })
                                              }
                                              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                                                  multiStage.phaseOneType ===
                                                  ('item_donation' as 'fundraising' | 'item_donation')
                                                      ? 'border-[#0E4686] bg-[#EEF3FB] text-[#0E4686]'
                                                      : 'border-[#D0D5DD] bg-white text-[#344054]'
                                              }`}
                                          >
                                              Quyên góp hiện vật
                                          </button>
                                      </div>
                                  </SectionCard>
                                  {renderFundraisingForm()}
                              </div>
                          )
                        : null}
                    {currentStep === 2 &&
                    templateKind === 'multi_stage' &&
                    multiStage.phaseOneType === 'item_donation'
                        ? (
                              <div className="space-y-6">
                                  <SectionCard
                                      title="Chọn giai đoạn 1"
                                      description="Chiến dịch nhiều giai đoạn bắt đầu bằng gây quỹ hoặc quyên góp hiện vật."
                                  >
                                      <div className="flex flex-wrap gap-3">
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  setMultiStage({
                                                      phaseOneType:
                                                          'fundraising',
                                                  })
                                              }
                                              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                                                  multiStage.phaseOneType ===
                                                  ('fundraising' as 'fundraising' | 'item_donation')
                                                      ? 'border-[#0E4686] bg-[#EEF3FB] text-[#0E4686]'
                                                      : 'border-[#D0D5DD] bg-white text-[#344054]'
                                              }`}
                                          >
                                              Gây quỹ
                                          </button>
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  setMultiStage({
                                                      phaseOneType:
                                                          'item_donation',
                                                  })
                                              }
                                              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                                                  multiStage.phaseOneType ===
                                                  ('item_donation' as 'fundraising' | 'item_donation')
                                                      ? 'border-[#0E4686] bg-[#EEF3FB] text-[#0E4686]'
                                                      : 'border-[#D0D5DD] bg-white text-[#344054]'
                                              }`}
                                          >
                                              Quyên góp hiện vật
                                          </button>
                                      </div>
                                  </SectionCard>
                                  {renderItemDonationForm()}
                              </div>
                          )
                        : null}
                    {currentStep === 3 &&
                    (templateKind === 'volunteer' ||
                        templateKind === 'multi_stage')
                        ? renderVolunteerForm(
                              templateKind === 'multi_stage'
                                  ? 'Bước 3: Giai đoạn 2 tuyển tình nguyện viên'
                                  : 'Bước 3: Tuyển tình nguyện viên',
                          )
                        : null}
                    {currentStep === 4 ? renderReviewStep() : null}

                    <section className="flex flex-col gap-3 rounded-2xl border border-[#D0D5DD] bg-white p-5 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-[#667085]">
                            {currentStep === 4
                                ? 'Có thể lưu nháp hoặc gửi duyệt ngay sau khi hồ sơ đã đủ.'
                                : 'Chỉ sang bước tiếp theo khi bước hiện tại không còn lỗi bắt buộc.'}
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {currentStep > 0 ? (
                                <button
                                    type="button"
                                    onClick={goToPreviousStep}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#344054]"
                                >
                                    <ArrowLeft className="size-4" />
                                    Quay lại
                                </button>
                            ) : null}
                            {currentStep < stepDefinitions[stepDefinitions.length - 1].id ? (
                                <button
                                    type="button"
                                    disabled={!canGoNext}
                                    onClick={goToNextStep}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98A2B3]"
                                >
                                    Tiếp theo
                                    <ArrowRight className="size-4" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => void handleSubmit(false)}
                                        className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#344054] disabled:opacity-60"
                                    >
                                        {submitting ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Lưu nháp
                                    </button>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => void handleSubmit(true)}
                                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#002A58] px-4 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {submitting ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Gửi duyệt chiến dịch
                                    </button>
                                </>
                            )}
                        </div>
                    </section>
                </div>

                <LocationPickerDialog
                    open={locationDialogTarget !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setLocationDialogTarget(null);
                        }
                    }}
                    onSelectLocation={handleLocationSelected}
                />
            </ContentLayout>
        </>
    );
};
