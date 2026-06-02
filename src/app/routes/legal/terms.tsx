import { Head } from '@/components/seo';

export const TermsOfServiceRoute = () => {
    return (
        <>
            <Head title="Điều khoản dịch vụ | BK Volunteers" />
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
                    <header className="space-y-3">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#4DA1A9]">
                            BK Volunteers
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Điều khoản dịch vụ
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Nền tảng BK Volunteers phục vụ cho hoạt động điều
                            phối chiến dịch, ghi nhận tham gia và vận hành gây
                            quỹ trong phạm vi các đơn vị liên kết chính thức.
                        </p>
                    </header>

                    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                1. Phạm vi sử dụng
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Người dùng chỉ được sử dụng hệ thống cho mục
                                đích tham gia, quản lý hoặc vận hành các hoạt
                                động tình nguyện được nhà trường và đơn vị phụ
                                trách phê duyệt.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                2. Tài khoản và trách nhiệm
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Người dùng chịu trách nhiệm bảo mật thông tin
                                đăng nhập, không chia sẻ tài khoản, và phải đảm
                                bảo dữ liệu gửi lên hệ thống là chính xác, minh
                                bạch và phù hợp với vai trò được cấp.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                3. Dữ liệu chiến dịch và đóng góp
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                Mọi thông tin chiến dịch, giao dịch gây quỹ,
                                hiện vật, sự kiện và chứng nhận được lưu trữ để
                                phục vụ phê duyệt, đối soát và kiểm toán nội
                                bộ. Hệ thống có thể từ chối hoặc thu hồi dữ liệu
                                khi phát hiện sai lệch hoặc vi phạm quy trình.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                4. Giới hạn dịch vụ
                            </h2>
                            <p className="text-sm leading-6 text-slate-600">
                                BK Volunteers là nền tảng điều phối nghiệp vụ.
                                Việc xác minh cuối cùng cho chứng nhận, đối
                                soát gây quỹ và các quyết định vận hành vẫn
                                thuộc về cán bộ hoặc đơn vị có thẩm quyền.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};
