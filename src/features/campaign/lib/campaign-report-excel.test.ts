import { describe, expect, it } from 'vitest';

import { createCampaignReportWorkbook } from './campaign-report-excel';

describe('createCampaignReportWorkbook', () => {
    it('renders the workbook with title, banner and Times New Roman size 13', async () => {
        const blob = await createCampaignReportWorkbook({
            campaignTitle: 'Chiến dịch Mùa hè xanh',
            campaignSlug: 'mua-he-xanh',
            campaignStatus: 'Đang diễn ra',
            organizationName: 'Đoàn trường',
            generatedAt: '2026-06-10T08:00:00.000Z',
            actor: {
                fullName: 'Nguyễn Văn A',
                roleLabel: 'Liên chi đoàn',
                organizationName: 'Đoàn trường',
            },
            summaryMetrics: [
                {
                    label: 'Tổng module',
                    value: '3',
                },
            ],
            moduleOverviewRows: [
                {
                    title: 'Hoạt động tình nguyện',
                    moduleType: 'Tuyển tình nguyện viên',
                    status: 'Đang diễn ra',
                    timeWindow: '01/06/2026 - 20/06/2026',
                    progress: '10/30',
                },
            ],
            moduleSheets: [
                {
                    name: 'TNV-1',
                    title: 'DANH SÁCH THAM GIA MODULE TUYỂN TÌNH NGUYỆN VIÊN',
                    subtitle: 'Hoạt động tình nguyện',
                    columns: ['Họ tên', 'MSSV'],
                    rows: [['Nguyễn Văn B', '102230103']],
                },
            ],
        });

        const xml = await blob.text();

        expect(xml).toContain('TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG');
        expect(xml).toContain('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
        expect(xml).toContain('BÁO CÁO CHIẾN DỊCH THEO THỜI GIAN THỰC');
        expect(xml).toContain('Times New Roman');
        expect(xml).toContain('ss:Size="13"');
    });
});
