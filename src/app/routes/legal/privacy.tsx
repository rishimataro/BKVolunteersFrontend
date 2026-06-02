import { Head } from '@/components/seo';

export const PrivacyPolicyRoute = () => {
    return (
        <>
            <Head title="Chính sách bảo mật | BK Volunteers" />
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
                    <header className="space-y-3">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#4DA1A9]">
                            BK Volunteers
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Chính sách bảo mật
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Hệ thống chỉ thu thập và xử lý dữ liệu cần thiết để
                            xác thực tài khoản, vận hành chiến dịch, ghi nhận
                            tham gia và đối soát các nghiệp vụ liên quan.
                        </p>
                    </header>

                    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                1. Dữ liệu được xử lý
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Dữ liệu có thể bao gồm thông tin tài khoản,
                                hồ sơ sinh viên, nhật ký hoạt động, thông tin
                                chiến dịch, giao dịch gây quỹ, và bằng chứng
                                cần thiết cho việc xác minh nghiệp vụ.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                2. Mục đích sử dụng
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Dữ liệu được dùng để xác thực quyền truy cập,
                                thực hiện phê duyệt, vận hành thông báo, cấp
                                chứng nhận, thống kê báo cáo và hỗ trợ kiểm tra
                                lịch sử nghiệp vụ khi cần.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                3. Chia sẻ và lưu giữ
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Dữ liệu không được công khai ngoài phạm vi đã
                                công bố bởi từng tính năng. Các bản ghi audit,
                                giao dịch và chứng nhận có thể được lưu giữ để
                                phục vụ trách nhiệm giải trình nội bộ.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                4. Liên hệ vận hành
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Nếu phát hiện sai lệch thông tin hoặc cần yêu
                                cầu hỗ trợ về dữ liệu cá nhân, người dùng cần
                                liên hệ đơn vị quản trị hệ thống hoặc tổ chức
                                phụ trách chiến dịch tương ứng.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};
