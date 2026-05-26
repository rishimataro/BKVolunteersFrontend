import React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { getDonationById } from '@/features/campaign/api/fundraising'
import { paths } from '@/config/paths'

type Props = { donationId: string }

export const PaymentPanel: React.FC<Props> = ({ donationId }) => {
    const navigate = useNavigate()
    const [donation, setDonation] = React.useState<any | null>(null)
    const [loading, setLoading] = React.useState(true)

    const fetchDonation = React.useCallback(async () => {
        try {
            const data = await getDonationById(donationId)
            setDonation(data)
        } catch (e) {
            // ignore
        } finally {
            setLoading(false)
        }
    }, [donationId])

    React.useEffect(() => {
        let mounted = true
        fetchDonation()
        const iv = setInterval(() => {
            if (!mounted) return
            void fetchDonation()
        }, 5000)
        return () => {
            mounted = false
            clearInterval(iv)
        }
    }, [fetchDonation])

    React.useEffect(() => {
        if (!donation) return
        if (donation.status && donation.status !== 'PENDING') {
            // finished
            navigate(paths.app.myDonations.getHref())
        }
        if (donation.matched_transaction_id) {
            navigate(paths.app.myDonations.getHref())
        }
    }, [donation, navigate])

    if (loading) return <div>Đang tải thông tin thanh toán...</div>
    if (!donation) return <div>Không tìm thấy thông tin thanh toán.</div>

    const instr = donation.payment_instruction ?? {}
    const expiresAt = instr.expires_at ? new Date(instr.expires_at) : null
    const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : null

    return (
        <div className="space-y-4 p-4 rounded-md border bg-white">
            <h3 className="text-lg font-semibold">Hướng dẫn thanh toán</h3>

            {instr.vietqr_url ? (
                <div className="flex flex-col items-center">
                    <img src={instr.vietqr_url} alt="VietQR" className="h-48 w-48 object-contain" />
                    <p className="mt-2 text-sm text-slate-600">Quét mã QR bằng ứng dụng ngân hàng để thanh toán.</p>
                </div>
            ) : null}

            <div className="text-sm">
                <div>
                    <strong>Nội dung chuyển khoản:</strong> {instr.transfer_content ?? instr.payment_code ?? '-'}
                </div>
                <div>
                    <strong>Số tiền:</strong> {instr.amount ? new Intl.NumberFormat('vi-VN').format(instr.amount) + ' VND' : '-'}
                </div>
                <div>
                    <strong>Hạn chót:</strong> {timeLeft != null ? `${Math.floor(timeLeft/60)} phút ${timeLeft%60} giây` : 'Không xác định'}
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={() => navigate(paths.app.myDonations.getHref())}>Quay lại</Button>
            </div>
        </div>
    )
}

export default PaymentPanel
