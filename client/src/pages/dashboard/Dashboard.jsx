'use client'

import { getTotalCounts } from '@/services/analytics'
import { useQuery } from '@tanstack/react-query'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ClientSvg from '@/components/svgs/ClientSvg'
import ProductSvg from '@/components/svgs/ProductSvg'
import BillSvg from '@/components/svgs/BillSvg'
import PurchaseSvg from '@/components/svgs/PurchaseSvg'
import StocksSvg from '@/components/svgs/StocksSvg'
import CollectionsSvg from '@/components/svgs/Collections'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
    const [activeCollection] = useLocalStorage('activeCollection');
    const { data, isLoading: isStatsLoading, error: statsError } = useQuery({
        queryKey: ['stats', activeCollection],
        queryFn: async () => {
            const res = await getTotalCounts({ collection_id: activeCollection });
            return res.data;
        },
        enabled: !!activeCollection
    });

    const stats = [
        { title: 'Total Products', value: data?.totalProducts, link: '/products', icon: <ProductSvg />, color: "tw-bg-blue-100 tw-text-blue-600" },
        { title: 'Total Bills', value: data?.totalBills, link: '/bills', icon: <BillSvg />, color: "tw-bg-green-100 tw-text-green-600" },
        { title: 'Total Purchases', value: data?.totalPurchases, link: '/purchases', icon: <PurchaseSvg />, color: "tw-bg-yellow-100 tw-text-yellow-600" },
        { title: 'Total Clients', value: data?.totalClients, link: '/clients', icon: <ClientSvg />, color: "tw-bg-purple-100 tw-text-purple-600" },
        { title: 'Total Stocks', value: data?.totalStocks, link: '/stocks', icon: <StocksSvg />, color: "tw-bg-red-100 tw-text-red-600" },
        { title: 'Total Collections', value: data?.totalCollections, link: '/collections', icon: <CollectionsSvg />, color: "tw-bg-indigo-100 tw-text-indigo-600" },
    ]

    useEffect(() => {
        if (statsError) {
            toast.error(`Error getting stats data: ${statsError.message}`)
        }
    }, [statsError]);

    return (
        <div className="tw-p-6 tw-bg-gray-50">
            {isStatsLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : (
                <div
                    className="tw-grid tw-gap-6 md:tw-grid-cols-2 lg:tw-grid-cols-3"
                >
                    {stats.map((stat, index) => (
                        <StatCard key={stat.title} {...stat} index={index} />
                    ))}
                </div>
            )}
        </div>
    )
}

function useCountUp(end, duration = 500) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            setCount(Math.floor(end * percentage));

            if (percentage < 1) {
                requestAnimationFrame(animateCount);
            }
        };

        requestAnimationFrame(animateCount);
    }, [end, duration]);

    return count;
}

function StatCard({ title, value, icon, color, index, link }) {
    const navigate = useNavigate();
    return (

        <Card className="tw-overflow-hidden tw-transition-all tw-duration-300 hover:tw-shadow-lg hover:tw-transform hover:tw-scale-105 tw-cursor-pointer" onClick={() => navigate(link)} >
            <CardHeader className={`tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-p-2 tw-px-4 ${color} tw-rounded-t-lg`}>
                <CardTitle className="tw-text-sm tw-font-semibold tw-tracking-wide">{title}</CardTitle>
                <div className="tw-p-2 tw-bg-white tw-rounded-full tw-shadow-md">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="tw-p-4">
                <div className="tw-text-3xl tw-font-bold tw-mt-2 tw-text-gray-800">
                    {/* {value?.toLocaleString() || '0'} */}
                    {useCountUp(value)}
                </div>
            </CardContent>
        </Card>
    )
}

export default Dashboard

