const mojibakePattern =
    /(?:Ã.|Ä.|Å.|Æ.|Ç.|È.|É.|Ê.|Ë.|Ì.|Í.|Î.|Ï.|Ð.|Ñ.|Ò.|Ó.|Ô.|Õ.|Ö.|Ø.|Ù.|Ú.|Û.|Ü.|Ý.|Þ.|ß.|áº|á»|â€|Â)/u;

const replacementPairs: Array<[RegExp, string]> = [
    [/\bkhong tim thay\b/gi, 'không tìm thấy'],
    [/\bkhong the\b/gi, 'không thể'],
    [/\bkhong hop le\b/gi, 'không hợp lệ'],
    [/\bkhong ton tai\b/gi, 'không tồn tại'],
    [/\bda ton tai\b/gi, 'đã tồn tại'],
    [/\bchua xac thuc nguoi dung\b/gi, 'chưa xác thực người dùng'],
    [/\bnguoi dung khong hop le\b/gi, 'người dùng không hợp lệ'],
    [/\btai khoan da bi khoa hoac vo hieu hoa\b/gi, 'tài khoản đã bị khóa hoặc vô hiệu hóa'],
    [/\bidentifier hoac mat khau khong hop le\b/gi, 'định danh hoặc mật khẩu không hợp lệ'],
    [/\bidentifier va mat khau la bat buoc\b/gi, 'định danh và mật khẩu là bắt buộc'],
    [/\brefresh token khong hop le\b/gi, 'refresh token không hợp lệ'],
    [/\btoken khong hop le\b/gi, 'token không hợp lệ'],
    [/\bthanh cong\b/gi, 'thành công'],
    [/\btai khoan\b/gi, 'tài khoản'],
    [/\bnguoi dung\b/gi, 'người dùng'],
    [/\bmat khau\b/gi, 'mật khẩu'],
    [/\bthong tin\b/gi, 'thông tin'],
    [/\bdu lieu\b/gi, 'dữ liệu'],
    [/\bdanh sach\b/gi, 'danh sách'],
    [/\bho so\b/gi, 'hồ sơ'],
    [/\bsinh vien\b/gi, 'sinh viên'],
    [/\bchung nhan\b/gi, 'chứng nhận'],
    [/\bchien dich\b/gi, 'chiến dịch'],
    [/\bhang muc\b/gi, 'hạng mục'],
    [/\bhien vat\b/gi, 'hiện vật'],
    [/\bgay quy\b/gi, 'gây quỹ'],
    [/\bsu kien\b/gi, 'sự kiện'],
    [/\bdang ky\b/gi, 'đăng ký'],
    [/\bdong gop\b/gi, 'đóng góp'],
    [/\bthong bao\b/gi, 'thông báo'],
    [/\bto chuc\b/gi, 'tổ chức'],
    [/\bdon vi\b/gi, 'đơn vị'],
    [/\btai lieu\b/gi, 'tài liệu'],
    [/\bbao cao\b/gi, 'báo cáo'],
    [/\bdoi soat\b/gi, 'đối soát'],
    [/\bphe duyet\b/gi, 'phê duyệt'],
    [/\btrang thai\b/gi, 'trạng thái'],
    [/\btong quan\b/gi, 'tổng quan'],
    [/\blich su\b/gi, 'lịch sử'],
    [/\bcong khai\b/gi, 'công khai'],
    [/\bhoan thanh\b/gi, 'hoàn thành'],
];

const capitalizeFirst = (value: string) =>
    value.charAt(0).toLocaleUpperCase('vi-VN') + value.slice(1);

const preserveMatchCase = (match: string, replacement: string) =>
    /^[A-Z]/.test(match) ? capitalizeFirst(replacement) : replacement;

const repairMojibake = (value: string) => {
    if (!mojibakePattern.test(value)) {
        return value;
    }

    try {
        const bytes = Uint8Array.from(value, (character) =>
            character.charCodeAt(0),
        );

        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    } catch {
        return value;
    }
};

export const normalizeVietnameseText = (value: string | null | undefined) => {
    if (!value) {
        return '';
    }

    let next = repairMojibake(value).replace(/\s+/g, ' ').trim();

    for (const [pattern, replacement] of replacementPairs) {
        next = next.replace(pattern, (match) =>
            preserveMatchCase(match, replacement),
        );
    }

    return next.replace(/\s+/g, ' ').trim();
};

export const toVietnameseSearchKey = (value: string | null | undefined) =>
    normalizeVietnameseText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .toLowerCase()
        .trim();
