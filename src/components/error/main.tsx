import { Button } from '../ui/button';

export const MainErrorFallback = () => {
    return (
        <div
            className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 px-6 text-center"
            role="alert"
        >
            <h2 className="text-lg font-semibold text-slate-900">Đã xảy ra lỗi hệ thống.</h2>
            <p className="mt-2 text-sm text-slate-600">Vui lòng tải lại trang để tiếp tục.</p>
            <Button
                className="mt-4"
                onClick={() => window.location.assign(window.location.origin)}
            >
                Tải lại
            </Button>
        </div>
    );
};
