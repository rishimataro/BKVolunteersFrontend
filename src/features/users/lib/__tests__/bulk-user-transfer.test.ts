import { describe, expect, it } from 'vitest';

import {
    buildImportDrafts,
    convertCsvRowsToObjects,
    createImportTemplateCsv,
    createSuggestedImportMapping,
    createUsersExportCsv,
    parseCsvText,
} from '../bulk-user-transfer';

describe('bulk-user-transfer', () => {
    it('parses CSV and builds valid student payloads from mapped headers', () => {
        const csv = [
            'MSSV,Họ và tên,Email,Mật khẩu,Khoa,Lớp,Số điện thoại',
            '2212345,Nguyễn Văn A,2212345@student.dut.udn.vn,MatKhau@123,CNTT,22TCLC_DT3,0901234567',
        ].join('\n');

        const parsedRows = parseCsvText(csv);
        const { headers, records } = convertCsvRowsToObjects(parsedRows);
        const mapping = createSuggestedImportMapping('SINHVIEN', headers);
        const draft = buildImportDrafts({
            role: 'SINHVIEN',
            rows: records,
            mapping,
            faculties: [
                {
                    id: 1,
                    code: 'CNTT',
                    name: 'Khoa Công nghệ Thông tin',
                },
            ],
            clubs: [],
        });

        expect(draft.validRows).toHaveLength(1);
        expect(draft.invalidRows).toHaveLength(0);
        expect(draft.validRows[0]?.payload).toEqual({
            role: 'SINHVIEN',
            email: '2212345@student.dut.udn.vn',
            password: 'MatKhau@123',
            mssv: '2212345',
            fullName: 'Nguyễn Văn A',
            facultyId: 1,
            className: '22TCLC_DT3',
            phone: '0901234567',
        });
    });

    it('marks rows invalid when faculty cannot be resolved', () => {
        const csv = [
            'Tên đăng nhập,Email,Mật khẩu,Khoa',
            'lcd_cntt,lcd.cntt@dut.udn.vn,MatKhau@123,KHONGTONTAI',
        ].join('\n');

        const parsedRows = parseCsvText(csv);
        const { headers, records } = convertCsvRowsToObjects(parsedRows);
        const mapping = createSuggestedImportMapping('LCD', headers);
        const draft = buildImportDrafts({
            role: 'LCD',
            rows: records,
            mapping,
            faculties: [
                {
                    id: 1,
                    code: 'CNTT',
                    name: 'Khoa Công nghệ Thông tin',
                },
            ],
            clubs: [],
        });

        expect(draft.validRows).toHaveLength(0);
        expect(draft.invalidRows).toHaveLength(1);
        expect(draft.invalidRows[0]?.message).toBe(
            'Không đối chiếu được khoa.',
        );
    });

    it('creates CSV templates and export files with Vietnamese headers', () => {
        const templateCsv = createImportTemplateCsv('DOANTRUONG');
        const exportCsv = createUsersExportCsv([
            {
                id: 'user-1',
                username: 'doantruong.admin',
                email: 'doantruong@dut.udn.vn',
                role: 'DOANTRUONG',
                status: 'ACTIVE',
                lastLoginAt: null,
                createdAt: '2026-06-01T08:00:00.000Z',
                updatedAt: '2026-06-01T08:00:00.000Z',
                facultyId: null,
                facultyName: null,
                managedClubId: null,
                managedClubName: null,
                mssv: null,
                fullName: 'Đoàn trường',
                className: null,
                phone: null,
            },
        ]);

        expect(templateCsv).toContain('Tên đăng nhập,Email,Mật khẩu');
        expect(exportCsv).toContain('Vai trò,Họ và tên,Tên đăng nhập,Email');
        expect(exportCsv).toContain('Đoàn trường');
    });
});
