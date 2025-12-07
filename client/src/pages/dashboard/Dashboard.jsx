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
        { title: 'Total Products', value: data?.totalProducts, link: '/products', icon: <ProductSvg />, color: "bg-blue-100 text-blue-600" },
        { title: 'Total Bills', value: data?.totalBills, link: '/bills', icon: <BillSvg />, color: "bg-green-100 text-green-600" },
        { title: 'Total Purchases', value: data?.totalPurchases, link: '/purchases', icon: <PurchaseSvg />, color: "bg-yellow-100 text-yellow-600" },
        { title: 'Total Clients', value: data?.totalClients, link: '/clients', icon: <ClientSvg />, color: "bg-purple-100 text-purple-600" },
        { title: 'Total Stocks', value: data?.totalStocks, link: '/stocks', icon: <StocksSvg />, color: "bg-red-100 text-red-600" },
        { title: 'Total Collections', value: data?.totalCollections, link: '/collections', icon: <CollectionsSvg />, color: "bg-indigo-100 text-indigo-600" },
    ]

    useEffect(() => {
        if (statsError) {
            toast.error(`Error getting stats data: ${statsError.message}`)
        }
    }, [statsError]);

    return (
        <div className="p-6 bg-gray-50">
            {isStatsLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : (
                <div
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105 cursor-pointer" onClick={() => navigate(link)} >
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 p-2 px-4 ${color} rounded-t-lg`}>
                <CardTitle className="text-sm font-semibold tracking-wide">{title}</CardTitle>
                <div className="p-2 bg-white rounded-full shadow-md">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="text-3xl font-bold mt-2 text-gray-800">
                    {/* {value?.toLocaleString() || '0'} */}
                    {useCountUp(value)}
                </div>
            </CardContent>
        </Card>
    )
}

export default Dashboard

