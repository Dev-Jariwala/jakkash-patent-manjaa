import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientsTable from "./components/ClientsTable";

const Clients = () => {
    const navigate = useNavigate();
    return (
        <div className="">
            <div className="flex items-center justify-between px-5 border-b border-gray-200 py-3 mb-3">
                <div className="text-xl text-gray-700 font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/clients", label: "Clients" },
                        ]}
                    />
                </div>
                {/* <Button
                    variant="indigo"
                    size="sm"
                    onClick={() => navigate("/stocks/new")}
                >
                    <Plus className="size-4" />
                    <div className="">New Client</div>
                </Button> */}
            </div>
            <ClientsTable />
        </div>
    );
};

export default Clients;
