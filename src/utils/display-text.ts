const replacementPairs: Array<[RegExp, string]> = [
    [
        /\bcampaign for sprint2 end to end smoke test\b/gi,
        'chiến dịch cho sprint 2 kiểm thử smoke end-to-end',
    ],
    [/\bmoney_donation\b/gi, 'đóng góp tiền'],
    [/\bitem_pledge\b/gi, 'quyên góp hiện vật'],
    [/\bevent_registration\b/gi, 'đăng ký sự kiện'],
    [/\bcheck[_ -]?in\b/gi, 'check-in'],
    [/\btime range\b/gi, 'khung thời gian'],
    [/\bcampaign modules\b/gi, 'hạng mục chiến dịch'],
    [/\bcampaign module\b/gi, 'hạng mục chiến dịch'],
    [/\bmodule\b/gi, 'hạng mục'],
    [/\bcampaign\b/gi, 'chiến dịch'],
    [/\bsummary\b/gi, 'tóm tắt'],
    [/\bready\b/gi, 'sẵn sàng'],
    [/\bcontract\b/gi, 'đặc tả'],
    [/\bvalidation\b/gi, 'kiểm tra'],
    [/\bde kiem thu\b/gi, 'để kiểm thử'],
    [/\bmau\b/gi, 'mẫu'],
    [/\bva\b/gi, 'và'],
    [/\bend to end\b/gi, 'end-to-end'],
    [/\bsmoke test\b/gi, 'kiểm thử smoke'],
    [/\bno module\b/gi, 'chưa có hạng mục'],
    [/\bchien dich\b/gi, 'chiến dịch'],
    [/\bthien nguyen\b/gi, 'thiện nguyện'],
    [/\blien chi doan\b/gi, 'liên chi đoàn'],
    [/\bkhoa cong nghe thong tin\b/gi, 'Khoa Công nghệ Thông tin'],
    [/\blcd cntt\b/gi, 'LCĐ CNTT'],
    [/\bcong khai\b/gi, 'công khai'],
    [/\bdang dien ra\b/gi, 'đang diễn ra'],
];

export const toDisplayText = (value: string | null | undefined) => {
    if (!value) return '';
    let next = value.trim();

    for (const [pattern, replacement] of replacementPairs) {
        next = next.replace(pattern, replacement);
    }

    return next.replace(/\s+/g, ' ').trim();
};

export const toDisplayTitle = (value: string | null | undefined) => {
    const text = toDisplayText(value);
    if (!text) return '';
    return text.charAt(0).toLocaleUpperCase('vi-VN') + text.slice(1);
};
