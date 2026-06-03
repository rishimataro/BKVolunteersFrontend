import { paths } from '@/config/paths';

export const LandingFooter = () => {
    return (
        <footer id="ve-nen-tang" className="bg-[#EDEEEF] py-10">
            <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr] lg:px-8">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        BK Volunteers
                    </p>
                    <h2 className="mt-3 text-[32px] font-semibold leading-10 text-[#002A58]">
                        Giao diện bám đúng tinh thần hệ thống học thuật số.
                    </h2>
                    <p className="mt-4 max-w-[52ch] text-[15px] leading-6 text-[#424750]">
                        Trang chủ dùng lại cấu trúc hero, ticker, campaign card,
                        bảng xếp hạng và khối CTA theo Stitch, đồng thời giữ
                        nguyên luồng điều hướng và business logic hiện có.
                    </p>
                </div>

                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Tài nguyên
                    </p>
                    <div className="mt-4 space-y-3">
                        <a
                            href={paths.campaigns.getHref()}
                            className="block text-[15px] leading-6 text-[#191C1D] hover:text-[#002A58]"
                        >
                            Danh sách chiến dịch
                        </a>
                        <a
                            href={paths.organizations.getHref()}
                            className="block text-[15px] leading-6 text-[#191C1D] hover:text-[#002A58]"
                        >
                            Đơn vị đồng hành
                        </a>
                        <a
                            href={paths.certificates.verify.getHref()}
                            className="block text-[15px] leading-6 text-[#191C1D] hover:text-[#002A58]"
                        >
                            Tra cứu chứng nhận
                        </a>
                    </div>
                </div>

                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Hỗ trợ
                    </p>
                    <div className="mt-4 space-y-3">
                        <a
                            href={paths.auth.login.getHref()}
                            className="block text-[15px] leading-6 text-[#191C1D] hover:text-[#002A58]"
                        >
                            Đăng nhập hệ thống
                        </a>
                        <a
                            href="#tac-dong"
                            className="block text-[15px] leading-6 text-[#191C1D] hover:text-[#002A58]"
                        >
                            Cách theo dõi tác động
                        </a>
                        <a
                            href="#chien-dich"
                            className="block text-[15px] leading-6 text-[#191C1D] hover:text-[#002A58]"
                        >
                            Các chiến dịch đang mở
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
