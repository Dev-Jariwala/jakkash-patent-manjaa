import { getWholeSaleBillsByMobile } from '@/services/bills';
import { PDFViewer } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '@uidotdev/usehooks'
import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ClientReportPDF from './ClientReportPDF';

const ClientReport = () => {
    const [activeCollection] = useLocalStorage("activeCollection");
    const [searchParams] = useSearchParams();
    const mobile = searchParams.get('mobile');

    const { data: billData, isLoading: isBillDataLoading, error: billDataError } = useQuery({
        queryKey: ['billsDataReport', { mobile, collection_id: activeCollection }],
        queryFn: async () => {
            const response = await getWholeSaleBillsByMobile({ mobile, collection_id: activeCollection });
            return response.data || {};
        }
    });
    useEffect(() => {
        if (billDataError) {
            toast.error(`Error getting bills`)
        }
    }, [billDataError]);
    return (
        <div className="my-3 tw-h-full tw-w-full tw-flex tw-justify-center tw-items-center">
            <PDFViewer width="100%" height="100%">
                <ClientReportPDF client={billData || { name: "", address: "", mobile: "", bills: [] }} />
            </PDFViewer>
        </div>
    )
}

export default ClientReport