import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { env } from '@/config/env';
import { paths } from '@/config/paths';

type MockStudent = {
    mssv: string;
    email: string;
    name: string;
};

const MOCK_STUDENTS: MockStudent[] = [
    {
        mssv: '102210001',
        email: '102210001@sv1.dut.udn.vn',
        name: 'Nguyen Van A',
    },
    {
        mssv: '102210002',
        email: '102210002@sv1.dut.udn.vn',
        name: 'Tran Thi B',
    },
];

export const MicrosoftMockLoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = useCallback(async (student: MockStudent) => {
        setLoading(student.mssv);
        setError(null);

        const apiUrl = env.API_URL.replace(/\/$/, '');
        try {
            const response = await fetch(
                `${apiUrl}/api/v1/auth/microsoft/mock-callback?email=${encodeURIComponent(student.email)}`,
                { redirect: 'manual' },
            );

            if (response.type === 'opaqueredirect' || response.status === 302) {
                const location = response.headers.get('Location');
                if (location) {
                    window.location.href = location;
                    return;
                }
            }

            if (response.ok) {
                const data = await response.json();
                const accessToken =
                    data?.data?.accessToken ?? data?.accessToken;
                if (accessToken) {
                    window.location.href = `${paths.auth.microsoftCallback.getHref()}?access_token=${accessToken}`;
                    return;
                }
            }

            const text = await response.text();
            setError(text || 'Không thể đăng nhập với tài khoản này.');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Lỗi kết nối đến máy chủ.',
            );
        } finally {
            setLoading(null);
        }
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">
                    Đăng nhập Microsoft
                </h1>
                <p className="mb-6 text-center text-slate-500">
                    (Chế độ mô phỏng) Chọn tài khoản sinh viên để đăng nhập
                </p>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {MOCK_STUDENTS.map((student) => (
                        <button
                            key={student.mssv}
                            type="button"
                            disabled={loading === student.mssv}
                            onClick={() => handleSelect(student)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:border-[#58aab3] hover:bg-[#f0fafb] disabled:opacity-50"
                        >
                            <div className="font-semibold text-slate-800">
                                {student.name}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                                {student.mssv}
                            </div>
                            <div className="text-sm text-slate-400">
                                {student.email}
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() =>
                        navigate(paths.auth.login.getHref(), {
                            replace: true,
                        })
                    }
                    className="mt-6 w-full text-center text-sm text-slate-400 underline underline-offset-2 hover:text-slate-600"
                >
                    Quay lại đăng nhập
                </button>
            </div>
        </div>
    );
};
