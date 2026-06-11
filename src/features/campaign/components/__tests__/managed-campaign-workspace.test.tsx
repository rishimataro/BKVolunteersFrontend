import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ManagedCampaignWorkspace } from '../managed-campaign-workspace';

const pendingRequest = () => new Promise<never>(() => undefined);

vi.mock('@/features/campaign/api/events', () => ({
    getEventRegistrations: vi.fn(() => pendingRequest()),
}));

vi.mock('@/features/campaign/api/fundraising', () => ({
    getFundraisingDonations: vi.fn(() => pendingRequest()),
    getFundraisingTransactions: vi.fn(() => pendingRequest()),
}));

vi.mock('@/features/campaign/api/item-donations', () => ({
    getItemPledges: vi.fn(() => pendingRequest()),
    getItemTargets: vi.fn(() => pendingRequest()),
}));

vi.mock('@/features/campaign/lib/campaign-report-excel', () => ({
    downloadCampaignReportWorkbook: vi.fn(),
}));

const noop = () => undefined;
const noopAsync = async () => {};
const noopAsyncWithArgs = async (..._args: unknown[]) => {};

const detail = {
    id: 'campaign-1',
    slug: 'chien-dich-mau',
    title: 'Chiến dịch mẫu',
    summary: 'Tóm tắt chiến dịch',
    slogan: 'Kết nối cộng đồng',
    description: 'Mô tả chiến dịch',
    beneficiary: 'Sinh viên',
    status: 'ONGOING',
    start_at: '2026-06-01T00:00:00.000Z',
    end_at: '2026-07-01T00:00:00.000Z',
    organization: {
        name: 'Đoàn trường',
    },
    documents: [],
    status_history: [],
    completion_report: null,
    modules: [
        {
            id: 'module-event',
            type: 'EVENT',
            title: 'Hoạt động tình nguyện',
            status: 'ACTIVE',
            start_at: '2026-06-05T00:00:00.000Z',
            end_at: '2026-06-20T00:00:00.000Z',
            registration_start_at: '2026-06-01T00:00:00.000Z',
            registration_end_at: '2026-06-10T00:00:00.000Z',
            progress: { current: 10, target: 30, percent: 33 },
        },
        {
            id: 'module-fundraising',
            type: 'FUNDRAISING_MONEY',
            title: 'Gây quỹ học bổng',
            status: 'ACTIVE',
            start_at: '2026-06-03T00:00:00.000Z',
            end_at: '2026-06-25T00:00:00.000Z',
            progress: { current: 2000000, target: 10000000, percent: 20 },
        },
        {
            id: 'module-item',
            type: 'ITEM_DONATION',
            title: 'Quyên góp hiện vật',
            status: 'ACTIVE',
            start_at: '2026-06-02T00:00:00.000Z',
            end_at: '2026-06-22T00:00:00.000Z',
            progress: { current: 12, target: 50, percent: 24 },
        },
    ],
};

describe('ManagedCampaignWorkspace report actions', () => {
    it('keeps refresh and export actions clickable while the report snapshot is loading', async () => {
        render(
            <ManagedCampaignWorkspace
                detail={detail}
                canMutateCampaign={true}
                canDeleteDraft={false}
                reportActor={{
                    fullName: 'Nguyễn Văn A',
                    roleLabel: 'Liên chi đoàn',
                    organizationName: 'Đoàn trường',
                }}
                fundraisingModuleId="module-fundraising"
                fundraisingConfig={{}}
                fundraisingDonations={[]}
                fundraisingTransactions={[]}
                itemModuleId="module-item"
                itemConfig={{}}
                itemTargets={[]}
                itemTargetForm={{}}
                itemPledges={[]}
                eventModuleId="module-event"
                eventConfig={{}}
                eventRegistrations={[]}
                setFundraisingModuleId={noop}
                setFundraisingConfig={noop}
                setItemModuleId={noop}
                setItemConfig={noop}
                setItemTargetForm={noop}
                setEventModuleId={noop}
                setEventConfig={noop}
                onSaveFundraisingConfig={noop}
                onVerifyDonation={noop}
                onRejectDonation={noop}
                onAttachTransaction={noop}
                onUnmatchTransaction={noop}
                onSaveItemConfig={noop}
                onCreateItemTarget={noop}
                onUpdateItemTarget={noopAsyncWithArgs}
                onDeleteItemTarget={noopAsyncWithArgs}
                onConfirmItemPledge={noop}
                onRejectItemPledge={noop}
                onHandoverItemPledge={noopAsyncWithArgs}
                onSaveEventConfig={noop}
                onApproveRegistration={noop}
                onRejectRegistration={noopAsyncWithArgs}
                onCheckInRegistration={noopAsyncWithArgs}
                onCompleteRegistration={noopAsyncWithArgs}
                onBulkApproveRegistrations={noop}
                onExtendVolunteerDeadline={noop}
                onEndVolunteerEarly={noop}
                onExtendFundraisingDeadline={noop}
                onEndFundraisingEarly={noop}
                onExtendItemDeadline={noop}
                onEndItemEarly={noop}
                onSubmitReview={noop}
                onPublish={noop}
                onDeleteDraftCampaign={noop}
                onUpdateCampaign={noopAsync}
                onExtendCampaign={noopAsync}
                onEndCampaignEarly={noopAsync}
                onSaveCompletionReport={noopAsync}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Báo cáo / kết thúc' }),
        );

        await waitFor(() => {
            expect(screen.getByText('Đang tổng hợp số liệu chiến dịch từ các module...')).toBeTruthy();
        });

        const refreshButton = screen.getByRole('button', {
            name: 'Làm mới số liệu',
        });
        const exportButton = screen.getByRole('button', {
            name: 'Xuất Excel theo chiến dịch',
        });

        expect(refreshButton.hasAttribute('disabled')).toBe(false);
        expect(exportButton.hasAttribute('disabled')).toBe(false);

        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Đang làm mới...' }),
            ).toBeTruthy();
        });
    });
});
