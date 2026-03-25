import { useNavigate } from 'react-router';
import { Heart, Users, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/seo';
import { paths } from '@/config/paths';

export const LandingRoute = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate(paths.auth.login.getHref());
    };

    return (
        <>
            <Head title="Welcome | BK Volunteers" />
            <div className="flex flex-col min-h-screen bg-white">
                {/* Header/Navbar */}
                <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-white/80 backdrop-blur-sm z-50">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
                        <img
                            src="/logo-bkvolunteers.png"
                            alt="BK Volunteers Logo"
                            className="size-8 object-contain"
                        />
                        <span>BK Volunteers</span>
                    </div>
                    <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                        <a
                            className="text-sm font-medium hover:underline underline-offset-4"
                            href="#features"
                        >
                            Tính năng
                        </a>
                        <a
                            className="text-sm font-medium hover:underline underline-offset-4"
                            href="#about"
                        >
                            Về chúng tôi
                        </a>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105 border-none rounded-full px-5"
                            onClick={() => navigate(paths.auth.login.getHref())}
                        >
                            Đăng nhập
                        </Button>
                    </nav>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-blue-50 to-white">
                        <div className="container px-4 md:px-6 mx-auto">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-slate-900">
                                        Kết nối trái tim,{' '}
                                        <br className="hidden sm:inline" />
                                        lan tỏa yêu thương
                                    </h1>
                                    <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                        Nền tảng quản lý hoạt động tình nguyện
                                        hiệu quả dành cho sinh viên Bách Khoa.
                                        Tham gia ngay để cùng nhau tạo nên những
                                        thay đổi tích cực.
                                    </p>
                                </div>
                                <div className="space-x-4 pt-4">
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                                        onClick={handleGetStarted}
                                    >
                                        Bắt đầu ngay{' '}
                                        <ArrowRight className="ml-2 size-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-12 px-8 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md transition-all hover:scale-105"
                                        onClick={() =>
                                            navigate(
                                                paths.auth.register.getHref(),
                                            )
                                        }
                                    >
                                        Đăng ký tình nguyện viên
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section
                        id="features"
                        className="w-full py-12 md:py-24 lg:py-32 bg-slate-50"
                    >
                        <div className="container px-4 md:px-6 mx-auto">
                            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                        Tính năng nổi bật
                                    </h2>
                                    <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                        Mọi thứ bạn cần để quản lý và tham gia
                                        các hoạt động tình nguyện một cách
                                        chuyên nghiệp.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="flex flex-col items-center space-y-2 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
                                        <Calendar className="size-6" />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        Quản lý sự kiện
                                    </h3>
                                    <p className="text-center text-gray-500">
                                        Dễ dàng tạo, quản lý và theo dõi các
                                        chiến dịch tình nguyện tập trung.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center space-y-2 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-green-100 rounded-full text-green-600 mb-2">
                                        <Users className="size-6" />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        Kết nối thành viên
                                    </h3>
                                    <p className="text-center text-gray-500">
                                        Giao lưu và phối hợp cùng cộng đồng tình
                                        nguyện viên nhiệt huyết.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center space-y-2 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-purple-100 rounded-full text-purple-600 mb-2">
                                        <ShieldCheck className="size-6" />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        Ghi nhận đóng góp
                                    </h3>
                                    <p className="text-center text-gray-500">
                                        Chứng nhận hoạt động và tích lũy điểm
                                        rèn luyện minh bạch.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center space-y-2 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-orange-100 rounded-full text-orange-600 mb-2">
                                        <Heart className="size-6" />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        Lan tỏa giá trị
                                    </h3>
                                    <p className="text-center text-gray-500">
                                        Chia sẻ những câu chuyện ý nghĩa và cảm
                                        hứng đến mọi người.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="w-full py-12 md:py-24 lg:py-32 border-t">
                        <div className="container px-4 md:px-6 mx-auto">
                            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                        Sẵn sàng để tạo nên sự khác biệt?
                                    </h2>
                                    <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                        Tham gia cùng hàng nghìn sinh viên khác
                                        ngay hôm nay.
                                    </p>
                                </div>
                                <div className="w-full max-w-sm space-y-2">
                                    <Button
                                        size="lg"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-105 h-12"
                                        onClick={handleGetStarted}
                                    >
                                        Tham gia ngay
                                    </Button>
                                    <p className="text-xs text-gray-500">
                                        Hoàn toàn miễn phí cho sinh viên và các
                                        tổ chức phi lợi nhuận.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                    <p className="text-xs text-gray-500">
                        © 2026 BK Volunteers. Bảo lưu mọi quyền.
                    </p>
                    <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                        <a
                            className="text-xs hover:underline underline-offset-4"
                            href="#"
                        >
                            Điều khoản dịch vụ
                        </a>
                        <a
                            className="text-xs hover:underline underline-offset-4"
                            href="#"
                        >
                            Chính sách bảo mật
                        </a>
                    </nav>
                </footer>
            </div>
        </>
    );
};
