import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, CheckCircle2, Search, XCircle } from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    verifyCertificate,
    type CertificateVerificationResult,
} from '@/features/certificates/api/verify';

export const CertificateVerifyRoute = () => {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<CertificateVerificationResult | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await verifyCertificate(code.trim());
            setResult(data);
        } catch {
            setError('Không thể kiểm tra chứng nhận. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head title="Kiểm tra chứng nhận" />
            <main className="min-h-screen bg-slate-50">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-bk-blue hover:text-blue-900"
                        >
                            <ArrowLeft className="size-4" />
                            Trang chủ
                        </Link>
                    </div>
                </section>

                <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-slate-950">
                            Kiểm tra chứng nhận
                        </h1>
                        <p className="mt-2 text-base text-slate-600">
                            Nhập mã chứng nhận để xác thực thông tin
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Nhập mã chứng nhận"
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !code.trim()}
                        >
                            {isLoading ? (
                                'Đang kiểm tra...'
                            ) : (
                                <>
                                    <Search className="mr-1 size-4" />
                                    Kiểm tra
                                </>
                            )}
                        </Button>
                    </form>

                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {result ? (
                        result.valid && result.certificate ? (
                            <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-center gap-3 text-emerald-600">
                                    <CheckCircle2 className="size-8" />
                                    <div>
                                        <h2 className="text-lg font-bold">
                                            Chứng nhận hợp lệ
                                        </h2>
                                        <p className="text-sm text-emerald-500">
                                            Mã:{' '}
                                            {result.certificate.certificate_no}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            Sinh viên
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            {result.certificate.student_name ??
                                                ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            Chiến dịch
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            {result.certificate
                                                .campaign_title ?? ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            Đơn vị tổ chức
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            {result.certificate.organization ??
                                                ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            Ngày cấp
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            {result.certificate.issued_at
                                                ? new Intl.DateTimeFormat(
                                                      'vi-VN',
                                                      {
                                                          day: '2-digit',
                                                          month: '2-digit',
                                                          year: 'numeric',
                                                      },
                                                  ).format(
                                                      new Date(
                                                          result.certificate
                                                              .issued_at,
                                                      ),
                                                  )
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            Trạng thái
                                        </span>
                                        <span className="font-medium text-emerald-600">
                                            Đã cấp
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3 text-red-600">
                                    <XCircle className="size-8" />
                                    <div>
                                        <h2 className="text-lg font-bold">
                                            Chứng nhận không hợp lệ
                                        </h2>
                                        <p className="text-sm text-red-500">
                                            Mã chứng nhận không tồn tại hoặc đã
                                            bị thu hồi
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : null}
                </section>
            </main>
        </>
    );
};
