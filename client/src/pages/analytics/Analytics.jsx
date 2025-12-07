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
            <div className="flex items-center justify-center min-h-[calc(100dvh-64px)] p-4">
                <Card className="w-full max-w-md border p-10">
                    <CardHeader>
                        <CardTitle>Enter Password</CardTitle>
                        <CardDescription>Please enter the password to view analytics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                <Button type="submit" className="w-full">Submit</Button>
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
                <div className="flex justify-center items-center h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : (
                <main className="container mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <Card className="transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg border">
            <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full p-3 bg-indigo-100 text-indigo-600 transition-all duration-300 ease-in-out transform group-hover:scale-110">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-semibold text-gray-900">
                        ₹{animatedValue?.toLocaleString()}
                    </h3>
                    <p
                        className={`text-sm ${trend === "up" ? "text-green-600" : "text-red-600"
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
