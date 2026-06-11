import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import type { UserManagementItem } from '@/features/users/api/users';

import {
    convertXlsxRowsToObjects,
    createImportTemplateWorkbook,
    createUsersExportWorkbook,
    parseXlsxRows,
} from '../bulk-user-transfer-xlsx';

const toArrayBuffer = (bytes: Uint8Array) => new Uint8Array(bytes).buffer;

const createUser = (index: number): UserManagementItem => ({
    id: `user-${index}`,
    username: `sv${index.toString().padStart(4, '0')}`,
    email: `sv${index.toString().padStart(4, '0')}@dut.udn.vn`,
    role: 'SINHVIEN',
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: '2026-06-08T08:00:00.000Z',
    updatedAt: '2026-06-08T08:00:00.000Z',
    facultyId: 1,
    facultyName: 'Khoa Công nghệ Thông tin',
    managedClubId: null,
    managedClubName: null,
    mssv: `10${index.toString().padStart(6, '0')}`,
    fullName: `Sinh viên ${index}`,
    className: '22TCLC_DT3',
    phone: '0901234567',
});

describe('bulk-user-transfer-xlsx', () => {
    it('creates import template workbook with expected headers', () => {
        const workbook = createImportTemplateWorkbook('SINHVIEN');
        const files = unzipSync(workbook);
        const rows = parseXlsxRows(toArrayBuffer(workbook));
        const contentTypesXml = strFromU8(files['[Content_Types].xml']);
        const { headers, records } = convertXlsxRowsToObjects(rows);
        const stylesXml = strFromU8(files['xl/styles.xml']);

        expect(headers).toEqual([
            'MSSV',
            'Họ và tên',
            'Email',
            'Mật khẩu',
            'Khoa',
            'Lớp',
            'Số điện thoại',
        ]);
        expect(records).toHaveLength(0);
        expect(contentTypesXml).toContain(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
        );
        expect(contentTypesXml).toContain(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml',
        );
        expect(contentTypesXml).toContain(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml',
        );
        expect(stylesXml).toContain('Times New Roman');
        expect(stylesXml).toContain('<sz val="12"/>');
        expect(stylesXml).toContain(
            '<font><b/><sz val="15"/><name val="Times New Roman"/></font>',
        );
    });

    it('splits export workbook into multiple sheets after 24 users', () => {
        const workbook = createUsersExportWorkbook(
            Array.from({ length: 25 }, (_, index) => createUser(index + 1)),
            {
                roleFilter: 'SINHVIEN',
                statusFilter: 'ACTIVE',
            },
        );
        const files = unzipSync(workbook);
        const workbookXml = strFromU8(files['xl/workbook.xml']);
        const sharedStringsXml = strFromU8(files['xl/sharedStrings.xml']);
        const contentTypesXml = strFromU8(files['[Content_Types].xml']);
        const stylesXml = strFromU8(files['xl/styles.xml']);

        expect(workbookXml).toContain('sheet name="DanhSach1"');
        expect(workbookXml).toContain('sheet name="DanhSach2"');
        expect(contentTypesXml).toContain(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
        );
        expect(contentTypesXml).toContain(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
        );
        expect(sharedStringsXml).toContain(
            'DANH SÁCH TÀI KHOẢN ĐƯỢC CẤP',
        );
        expect(sharedStringsXml).toContain(
            'TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG',
        );
        expect(sharedStringsXml).toContain('Trang 1/2');
        expect(sharedStringsXml).toContain('Trang 2/2');
        expect(stylesXml).toContain(
            '<font><b/><sz val="15"/><name val="Times New Roman"/></font>',
        );
    });
});
