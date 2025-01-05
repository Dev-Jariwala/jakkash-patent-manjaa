/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatCard({ title, value, icon }) {
    return (
        <Card>
            <CardHeader className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-space-y-0 tw-pb-2">
                <CardTitle className="tw-text-sm tw-font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="tw-text-2xl tw-font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

