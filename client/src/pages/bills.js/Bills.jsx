import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BillsTable from "./components/BillsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Bills = () => {
    const navigate = useNavigate();
    const { orderType } = useParams();

    const handleTabChange = (tab) => {
        navigate(`/orders/${tab}`);
    }
    return (
        <div className="">
            <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
                <div className="text-xl text-foreground font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/orders", label: "Orders" },
                        ]}
                    />
                </div>
                <Button
                    variant="indigo"
                    size="sm"
                    onClick={() => navigate(`/orders/new?order_type=${orderType}`)}
                >
                    <Plus className="size-4" />
                    <div className="">New {orderType} order</div>
                </Button>
            </div>
            <Tabs value={orderType} onValueChange={handleTabChange}>
                <TabsList className='w-1/2 gap-2 border-b pb-0 border-border'>
                    <TabsTrigger className='border-b-2 w-1/2 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500' variant='sliding' value="retail">Retail Orders</TabsTrigger>
                    <TabsTrigger className='border-b-2 w-1/2 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500' variant='sliding' value="wholesale">Wholesale Orders</TabsTrigger>
                </TabsList>
                <TabsContent value={orderType} >
                    <BillsTable />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Bills;
