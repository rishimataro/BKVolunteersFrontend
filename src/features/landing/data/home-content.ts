export type LandingMetric = {
    label: string;
    note: string;
    value: string;
};

export type LandingCampaign = {
    description: string;
    imageAlt: string;
    imageSrc: string;
    progress: number;
    raised: string;
    status: string;
    statusTone: 'primary' | 'secondary';
    target: string;
    title: string;
};

export type LandingLeaderboardEntry = {
    change: string;
    code: string;
    codeTone: 'primary' | 'secondary' | 'tertiary' | 'neutral';
    hours: string;
    name: string;
    rank: string;
};

export const landingMetrics: LandingMetric[] = [
    {
        value: '48.320+',
        label: 'Giờ tình nguyện',
        note: 'đã được xác nhận và lưu vết',
    },
    {
        value: '1,38 tỷ',
        label: 'Nguồn lực huy động',
        note: 'cho các chiến dịch sinh viên',
    },
    {
        value: '132',
        label: 'Đơn vị đang hoạt động',
        note: 'từ khoa, câu lạc bộ đến liên chi đoàn',
    },
    {
        value: '8.640+',
        label: 'Người tham gia',
        note: 'được điều phối trên một nền tảng',
    },
];

export const featuredCampaigns: LandingCampaign[] = [
    {
        title: 'Mùa hè xanh số',
        description:
            'Tập trung điều phối đội hình, nhu cầu địa phương và nhật ký triển khai trên cùng một mặt tiền số.',
        imageSrc: '/landing/3.jpg',
        imageAlt:
            'Sinh viên tình nguyện đang cùng nhau làm đường bê tông tại khu dân cư.',
        status: 'Đang triển khai',
        statusTone: 'secondary',
        progress: 72,
        raised: '432 triệu',
        target: '600 triệu',
    },
    {
        title: 'Biển xanh cuối tuần',
        description:
            'Theo dõi điểm tập kết, ca trực và khối lượng rác thu gom cho các hoạt động làm sạch bờ biển.',
        imageSrc: '/landing/2.jpg',
        imageAlt: 'Nhóm sinh viên tình nguyện đang thu gom rác trên bờ biển.',
        status: 'Mở đăng ký',
        statusTone: 'primary',
        progress: 44,
        raised: '176 triệu',
        target: '400 triệu',
    },
    {
        title: 'Đường quê tiếp sức',
        description:
            'Chuẩn hóa quy trình vật tư, điểm danh đội nhóm và báo cáo ngày công cho các chặng công trình nông thôn.',
        imageSrc: '/landing/4.jpg',
        imageAlt:
            'Tình nguyện viên đang làm việc ngoài đồng trong chiến dịch hỗ trợ cộng đồng.',
        status: 'Đủ nguồn lực',
        statusTone: 'secondary',
        progress: 91,
        raised: '455 triệu',
        target: '500 triệu',
    },
];

export const leaderboardEntries: LandingLeaderboardEntry[] = [
    {
        rank: '01',
        code: 'CN',
        codeTone: 'primary',
        name: 'Khoa Khoa học và Kỹ thuật Máy tính',
        hours: '12.450 giờ',
        change: '+12%',
    },
    {
        rank: '02',
        code: 'CK',
        codeTone: 'secondary',
        name: 'Khoa Cơ khí',
        hours: '10.220 giờ',
        change: '+8,4%',
    },
    {
        rank: '03',
        code: 'ĐT',
        codeTone: 'tertiary',
        name: 'Liên chi Đoàn Điện - Điện tử',
        hours: '9.870 giờ',
        change: '+15,1%',
    },
    {
        rank: '04',
        code: 'SV',
        codeTone: 'neutral',
        name: 'Hội Sinh viên trường',
        hours: '7.400 giờ',
        change: '0%',
    },
];

export const partnerLogos = [
    'Đoàn trường',
    'Hội Sinh viên',
    'BK Holdings',
    'Doanh nghiệp đồng hành',
    'Câu lạc bộ chuyên môn',
];

export const supportPoints = [
    'Theo dõi ca trực và giờ công theo từng đội hình.',
    'Tổng hợp gây quỹ, hiện vật và đầu việc trên một bảng điều phối.',
    'Giữ lịch sử minh bạch để báo cáo nhanh với nhà trường và đối tác.',
];

export const leaderboardFilters = [
    'Theo giờ công',
    'Theo gây quỹ',
    'Theo chiến dịch',
] as const;
