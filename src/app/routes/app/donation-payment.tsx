import React from 'react'
import { useParams } from 'react-router'
import { ContentLayout } from '@/components/layouts'
import PaymentPanel from '@/features/campaign/components/payment-panel/PaymentPanel'

export const DonationPaymentRoute: React.FC = () => {
    const { donationId } = useParams()
    if (!donationId) return <ContentLayout title="Thanh toán">Không tìm thấy giao dịch.</ContentLayout>

    return (
        <ContentLayout title="Thanh toán">
            <div className="mx-auto max-w-md">
                <PaymentPanel donationId={donationId} />
            </div>
        </ContentLayout>
    )
}

export default DonationPaymentRoute
