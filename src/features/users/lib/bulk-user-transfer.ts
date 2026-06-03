import type {
    ClubOption,
    CreateUserPayload,
    FacultyOption,
    UserManagementItem,
} from '@/features/users/api/users';
import type { UserRole } from '@/types/api';

export type ImportFieldKey =
    | 'username'
    | 'email'
    | 'password'
    | 'mssv'
    | 'fullName'
    | 'faculty'
    | 'className'
    | 'phone'
    | 'managedClub';

export type ImportFieldConfig = {
    key: ImportFieldKey;
    label: string;
    required: boolean;
    aliases: string[];
};

export type ImportMapping = Record<ImportFieldKey, string>;

export type ParsedImportRow = Record<string, string>;

export type ImportDraftRow = {
    rowNumber: number;
    source: ParsedImportRow;
    payload?: CreateUserPayload;
    identifier: string;
    isValid: boolean;
    message?: string;
};

export type ImportDraftResult = {
    validRows: ImportDraftRow[];
    invalidRows: ImportDraftRow[];
    previewRows: ImportDraftRow[];
};

const EMPTY_IMPORT_MAPPING: ImportMapping = {
    username: '',
    email: '',
    password: '',
    mssv: '',
    fullName: '',
    faculty: '',
    className: '',
    phone: '',
    managedClub: '',
};

const FIELD_CONFIGS: Record<UserRole, ImportFieldConfig[]> = {
    SINHVIEN: [
        {
            key: 'mssv',
            label: 'MSSV',
            required: true,
            aliases: ['mssv', 'ma so sinh vien', 'student id'],
        },
        {
            key: 'fullName',
            label: 'Họ và tên',
            required: true,
            aliases: ['ho va ten', 'full name', 'ten sinh vien'],
        },
        {
            key: 'email',
            label: 'Email',
            required: true,
            aliases: ['email', 'mail'],
        },
        {
            key: 'password',
            label: 'Mật khẩu',
            required: true,
            aliases: ['mat khau', 'password', 'mk'],
        },
        {
            key: 'faculty',
            label: 'Khoa',
            required: true,
            aliases: ['khoa', 'ma khoa', 'faculty', 'faculty code'],
        },
        {
            key: 'className',
            label: 'Lớp',
            required: false,
            aliases: ['lop', 'class', 'class name'],
        },
        {
            key: 'phone',
            label: 'Số điện thoại',
            required: false,
            aliases: ['so dien thoai', 'phone', 'sdt'],
        },
    ],
    LCD: [
        {
            key: 'username',
            label: 'Tên đăng nhập',
            required: true,
            aliases: ['ten dang nhap', 'username', 'tai khoan'],
        },
        {
            key: 'email',
            label: 'Email',
            required: true,
            aliases: ['email', 'mail'],
        },
        {
            key: 'password',
            label: 'Mật khẩu',
            required: true,
            aliases: ['mat khau', 'password', 'mk'],
        },
        {
            key: 'faculty',
            label: 'Khoa',
            required: true,
            aliases: ['khoa', 'ma khoa', 'faculty', 'faculty code'],
        },
    ],
    CLB: [
        {
            key: 'username',
            label: 'Tên đăng nhập',
            required: true,
            aliases: ['ten dang nhap', 'username', 'tai khoan'],
        },
        {
            key: 'email',
            label: 'Email',
            required: true,
            aliases: ['email', 'mail'],
        },
        {
            key: 'password',
            label: 'Mật khẩu',
            required: true,
            aliases: ['mat khau', 'password', 'mk'],
        },
        {
            key: 'faculty',
            label: 'Khoa',
            required: false,
            aliases: ['khoa', 'ma khoa', 'faculty', 'faculty code'],
        },
        {
            key: 'managedClub',
            label: 'Câu lạc bộ',
            required: false,
            aliases: ['cau lac bo', 'club', 'ten clb', 'club name'],
        },
    ],
    DOANTRUONG: [
        {
            key: 'username',
            label: 'Tên đăng nhập',
            required: true,
            aliases: ['ten dang nhap', 'username', 'tai khoan'],
        },
        {
            key: 'email',
            label: 'Email',
            required: true,
            aliases: ['email', 'mail'],
        },
        {
            key: 'password',
            label: 'Mật khẩu',
            required: true,
            aliases: ['mat khau', 'password', 'mk'],
        },
    ],
};

const ROLE_TEMPLATE_ROWS: Record<UserRole, string[]> = {
    SINHVIEN: [
        '2212345',
        'Nguyễn Văn A',
        '2212345@student.dut.udn.vn',
        'MatKhau@123',
        'CNTT',
        '22TCLC_DT3',
        '0901234567',
    ],
    LCD: ['lcd_cntt', 'lcd.cntt@dut.udn.vn', 'MatKhau@123', 'CNTT'],
    CLB: [
        'clb_xungkich',
        'clb.xungkich@dut.udn.vn',
        'MatKhau@123',
        'CNTT',
        'CLB Xung Kích',
    ],
    DOANTRUONG: ['doantruong.admin', 'doantruong@dut.udn.vn', 'MatKhau@123'],
};

const normalizeText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const getRoleExportLabel = (role: UserRole) => {
    if (role === 'SINHVIEN') {
        return 'Sinh viên';
    }

    if (role === 'LCD') {
        return 'Liên chi đoàn khoa';
    }

    if (role === 'CLB') {
        return 'Chủ nhiệm câu lạc bộ';
    }

    return 'Đoàn trường';
};

const getStatusExportLabel = (status: UserManagementItem['status']) => {
    if (status === 'ACTIVE') {
        return 'Đang hoạt động';
    }

    if (status === 'LOCKED') {
        return 'Tạm khóa';
    }

    return 'Đã vô hiệu';
};

const escapeCsvCell = (value: string) => {
    const normalized = value.replace(/"/g, '""');
    if (/[",\n]/.test(normalized)) {
        return `"${normalized}"`;
    }

    return normalized;
};

const buildIdentifier = (
    row: ParsedImportRow,
    mapping: ImportMapping,
    fallbackRowNumber: number,
) => {
    const values = [
        mapping.fullName ? row[mapping.fullName] : '',
        mapping.username ? row[mapping.username] : '',
        mapping.email ? row[mapping.email] : '',
        mapping.mssv ? row[mapping.mssv] : '',
    ]
        .map((value) => value?.trim())
        .filter(Boolean);

    return values[0] || `Dòng ${fallbackRowNumber}`;
};

const resolveFacultyId = (
    rawValue: string,
    faculties: FacultyOption[],
): number | null => {
    const normalized = normalizeText(rawValue);
    if (!normalized) {
        return null;
    }

    const faculty = faculties.find((item) => {
        return (
            normalizeText(String(item.id)) === normalized ||
            normalizeText(item.code) === normalized ||
            normalizeText(item.name) === normalized
        );
    });

    return faculty?.id ?? null;
};

const resolveClubId = (
    rawValue: string,
    clubs: ClubOption[],
): string | null => {
    const normalized = normalizeText(rawValue);
    if (!normalized) {
        return null;
    }

    const club = clubs.find((item) => {
        return (
            normalizeText(item.id) === normalized ||
            normalizeText(item.name) === normalized
        );
    });

    return club?.id ?? null;
};

const hasMappedRequiredFields = (role: UserRole, mapping: ImportMapping) =>
    FIELD_CONFIGS[role]
        .filter((field) => field.required)
        .every((field) => Boolean(mapping[field.key]));

export const getImportFieldConfigs = (role: UserRole) => FIELD_CONFIGS[role];

export const createEmptyImportMapping = (): ImportMapping => ({
    ...EMPTY_IMPORT_MAPPING,
});

export const createSuggestedImportMapping = (
    role: UserRole,
    headers: string[],
): ImportMapping => {
    const mapping = createEmptyImportMapping();

    FIELD_CONFIGS[role].forEach((field) => {
        const matchedHeader = headers.find((header) => {
            const normalizedHeader = normalizeText(header);
            return field.aliases.some(
                (alias) => normalizeText(alias) === normalizedHeader,
            );
        });

        mapping[field.key] = matchedHeader ?? '';
    });

    return mapping;
};

export const parseCsvText = (content: string) => {
    const rows: string[][] = [];
    let currentCell = '';
    let currentRow: string[] = [];
    let isInsideQuotes = false;

    for (let index = 0; index < content.length; index += 1) {
        const character = content[index];
        const nextCharacter = content[index + 1];

        if (character === '"') {
            if (isInsideQuotes && nextCharacter === '"') {
                currentCell += '"';
                index += 1;
            } else {
                isInsideQuotes = !isInsideQuotes;
            }
            continue;
        }

        if (character === ',' && !isInsideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
            continue;
        }

        if ((character === '\n' || character === '\r') && !isInsideQuotes) {
            if (character === '\r' && nextCharacter === '\n') {
                index += 1;
            }

            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentCell = '';
            currentRow = [];
            continue;
        }

        currentCell += character;
    }

    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }

    return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
};

export const convertCsvRowsToObjects = (rows: string[][]) => {
    if (rows.length < 2) {
        return {
            headers: [] as string[],
            records: [] as ParsedImportRow[],
        };
    }

    const headers = rows[0].map((header) => header.trim());
    const records = rows.slice(1).map((row) => {
        return headers.reduce<ParsedImportRow>((accumulator, header, index) => {
            accumulator[header] = row[index]?.trim() ?? '';
            return accumulator;
        }, {});
    });

    return { headers, records };
};

const buildPayloadForRow = ({
    role,
    row,
    mapping,
    faculties,
    clubs,
}: {
    role: UserRole;
    row: ParsedImportRow;
    mapping: ImportMapping;
    faculties: FacultyOption[];
    clubs: ClubOption[];
}): CreateUserPayload => {
    const read = (field: ImportFieldKey) =>
        (mapping[field] ? row[mapping[field]] : '')?.trim() ?? '';

    const email = read('email');
    const password = read('password');
    const username = read('username');
    const mssv = read('mssv');
    const fullName = read('fullName');
    const className = read('className');
    const phone = read('phone');
    const facultyValue = read('faculty');
    const managedClubValue = read('managedClub');

    if (!email || !email.includes('@')) {
        throw new Error('Email không hợp lệ.');
    }

    if (!password) {
        throw new Error('Thiếu mật khẩu.');
    }

    if (role === 'SINHVIEN') {
        const facultyId = resolveFacultyId(facultyValue, faculties);
        if (!mssv) {
            throw new Error('Thiếu MSSV.');
        }
        if (!fullName) {
            throw new Error('Thiếu họ và tên.');
        }
        if (!facultyId) {
            throw new Error('Không đối chiếu được khoa.');
        }

        return {
            role: 'SINHVIEN',
            email,
            password,
            mssv,
            fullName,
            facultyId,
            className: className || undefined,
            phone: phone || undefined,
        };
    }

    if (!username) {
        throw new Error('Thiếu tên đăng nhập.');
    }

    if (role === 'LCD') {
        const facultyId = resolveFacultyId(facultyValue, faculties);
        if (!facultyId) {
            throw new Error('Không đối chiếu được khoa.');
        }

        return {
            role: 'LCD',
            username,
            email,
            password,
            facultyId,
        };
    }

    if (role === 'CLB') {
        const facultyId = facultyValue
            ? resolveFacultyId(facultyValue, faculties)
            : null;
        const managedClubId = managedClubValue
            ? resolveClubId(managedClubValue, clubs)
            : null;

        if (facultyValue && !facultyId) {
            throw new Error('Không đối chiếu được khoa.');
        }

        if (managedClubValue && !managedClubId) {
            throw new Error('Không đối chiếu được câu lạc bộ.');
        }

        return {
            role: 'CLB',
            username,
            email,
            password,
            facultyId: facultyId ?? undefined,
            managedClubId: managedClubId ?? undefined,
        };
    }

    return {
        role: 'DOANTRUONG',
        username,
        email,
        password,
    };
};

export const buildImportDrafts = ({
    role,
    rows,
    mapping,
    faculties,
    clubs,
}: {
    role: UserRole;
    rows: ParsedImportRow[];
    mapping: ImportMapping;
    faculties: FacultyOption[];
    clubs: ClubOption[];
}): ImportDraftResult => {
    if (!hasMappedRequiredFields(role, mapping)) {
        return {
            validRows: [],
            invalidRows: [],
            previewRows: [],
        };
    }

    const previewRows = rows.map((row, index) => {
        const rowNumber = index + 2;
        const identifier = buildIdentifier(row, mapping, rowNumber);

        try {
            const payload = buildPayloadForRow({
                role,
                row,
                mapping,
                faculties,
                clubs,
            });

            return {
                rowNumber,
                source: row,
                payload,
                identifier,
                isValid: true,
            } satisfies ImportDraftRow;
        } catch (error) {
            return {
                rowNumber,
                source: row,
                identifier,
                isValid: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Dòng dữ liệu không hợp lệ.',
            } satisfies ImportDraftRow;
        }
    });

    return {
        validRows: previewRows.filter((row) => row.isValid),
        invalidRows: previewRows.filter((row) => !row.isValid),
        previewRows,
    };
};

export const serializeCsv = (rows: string[][]) =>
    rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');

export const createImportTemplateCsv = (role: UserRole) => {
    const headers = FIELD_CONFIGS[role].map((field) => field.label);
    const sampleRow = ROLE_TEMPLATE_ROWS[role];
    return serializeCsv([headers, sampleRow]);
};

export const createUsersExportCsv = (users: UserManagementItem[]) => {
    const headers = [
        'Vai trò',
        'Họ và tên',
        'Tên đăng nhập',
        'Email',
        'MSSV',
        'Khoa',
        'Đơn vị quản lý',
        'Lớp',
        'Số điện thoại',
        'Trạng thái',
        'Lần đăng nhập gần nhất',
        'Ngày tạo',
    ];

    const rows = users.map((user) => [
        getRoleExportLabel(user.role),
        user.fullName ?? '',
        user.username,
        user.email,
        user.mssv ?? '',
        user.facultyName ?? '',
        user.managedClubName ?? '',
        user.className ?? '',
        user.phone ?? '',
        getStatusExportLabel(user.status),
        user.lastLoginAt ?? '',
        user.createdAt,
    ]);

    return serializeCsv([headers, ...rows]);
};
