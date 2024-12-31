/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getAnalytics } from "@/services/analytics";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

const Analytics = () => {
    const [activeCollection] = useLocalStorage("activeCollection");
    const { data: analytics, isLoading, error } = useQuery({
        queryKey: ["analytics", activeCollection],
        queryFn: async () => {
            const response = await getAnalytics({ collection_id: activeCollection });
            return response.data;
        },
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (error) {
            toast.error(error.message);
        }
    }, [error]);

    const handlePasswordSubmit = () => {
        const correctPassword = "jakkash@123"; // Set your desired password here
        console.log(passwordInput, correctPassword);
        if (passwordInput === correctPassword) {
            setIsAuthenticated(true);
        } else {
            setErrorMessage("Incorrect password. Please try again.");
        }
    };
    const form = useForm({
        defaultValues: {
            password: "",
        },
    });

    const onSubmit = (values) => {
        const correctPassword = "jakkash@123"; // Set your desired password here
        if (values.password === correctPassword) {
            setIsAuthenticated(true);
        } else {
            form.setError("password", {
                type: "manual",
                message: "Incorrect password. Please try again."
            });
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen tw-p-4">
                <Card className="tw-w-full tw-max-w-md tw-border tw-p-10">
                    <CardHeader>
                        <CardTitle>Enter Password</CardTitle>
                        <CardDescription>Please enter the password to view analytics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="tw-space-y-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password"  {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="tw-w-full">Submit</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            {isLoading ? (
                <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : (
                <main className="tw-container tw-mx-auto tw-px-6 tw-py-8">
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
                        <MetricCard
                            title="Total Investment"
                            value={analytics?.totalPurchaseAmount}
                            icon={<DollarSign size={24} />}
                            trend="up"
                            percentage="5.3%"
                        />
                        <MetricCard
                            title="Retail Sales"
                            value={analytics?.totalRetailSalesAmount}
                            icon={<ShoppingBag size={24} />}
                            trend="down"
                            percentage="2.1%"
                        />
                        <MetricCard
                            title="Wholesale Sales"
                            value={analytics?.totalWholesaleSalesAmount}
                            icon={<Package size={24} />}
                            trend="up"
                            percentage="7.8%"
                        />
                        <MetricCard
                            title="Total Profit"
                            value={analytics?.totalSalesAmount - analytics?.totalPurchaseAmount}
                            icon={<TrendingUp size={24} />}
                            trend="up"
                            percentage="3.2%"
                        />
                    </div>
                </main>
            )}
        </>
    );
};

function MetricCard({ title, value = 0, icon, trend, percentage }) {
    const animatedValue = useCountUp(value);

    return (
        <Card className="tw-transition-all tw-duration-300 tw-ease-in-out tw-transform hover:tw-scale-105 hover:tw-shadow-lg tw-border">
            <CardContent className="tw-flex tw-items-center tw-p-6">
                <div className="tw-mr-4 tw-rounded-full tw-p-3 tw-bg-indigo-100 tw-text-indigo-600 tw-transition-all tw-duration-300 tw-ease-in-out tw-transform group-hover:tw-scale-110">
                    {icon}
                </div>
                <div>
                    <p className="tw-text-sm tw-font-medium tw-text-gray-500">{title}</p>
                    <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-900">
                        ₹{animatedValue?.toLocaleString()}
                    </h3>
                    <p
                        className={`tw-text-sm ${trend === "up" ? "tw-text-green-600" : "tw-text-red-600"
                            }`}
                    >
                        {trend === "up" ? "↑" : "↓"} {percentage}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
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

export default Analytics;
