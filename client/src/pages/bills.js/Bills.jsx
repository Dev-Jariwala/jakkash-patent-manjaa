import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BillsTable from "./components/BillsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Bills = () => {
    const navigate = useNavigate();
    const { billType } = useParams();

    const handleTabChange = (tab) => {
        navigate(`/bills/${tab}`);
    }
    return (
        <div className="">
            <div className="flex items-center justify-between px-5 border-b border-gray-200 py-3 mb-3">
                <div className="text-xl text-gray-700 font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/bills", label: "Bills" },
                        ]}
                    />
                </div>
                <Button
                    variant="indigo"
                    size="sm"
                    onClick={() => navigate(`/bills/new?bill_type=${billType}`)}
                >
                    <Plus className="size-4" />
                    <div className="">New {billType} bill</div>
                </Button>
            </div>
            <Tabs value={billType} onValueChange={handleTabChange}>
                <TabsList className='w-1/2 gap-2 border-b pb-0 border-gray-300'>
                    <TabsTrigger className='border-b-2 w-1/2 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500' variant='sliding' value="retail">Retail Bills</TabsTrigger>
                    <TabsTrigger className='border-b-2 w-1/2 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500' variant='sliding' value="wholesale">Wholesale Bills</TabsTrigger>
                </TabsList>
                <TabsContent value={billType} >
                    <BillsTable />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Bills;
