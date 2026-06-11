import { describe, expect, it } from 'vitest';

import {
    normalizeVietnameseText,
    toVietnameseSearchKey,
} from '@/utils/vietnamese-text';
import { toDisplayTitle } from '@/utils/display-text';

describe('vietnamese-text', () => {
    it('normalizes strings without diacritics', () => {
        expect(normalizeVietnameseText('Khong tim thay tai khoan')).toBe(
            'Không tìm thấy tài khoản',
        );
    });

    it('builds a comparable search key without accents', () => {
        expect(toVietnameseSearchKey('Tài khoản đã bị khóa')).toBe(
            'tai khoan da bi khoa',
        );
    });

    it('formats campaign titles with proper Vietnamese diacritics', () => {
        expect(toDisplayTitle('chien dich cong khai')).toBe(
            'Chiến dịch công khai',
        );
    });
});
