import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CollectionsTable from "./components/CollectionsTable";

const Collections = () => {
    const navigate = useNavigate();
    return (
        <div className="">
            <div className="flex items-center justify-between px-5 border-b border-gray-200 py-3 mb-3">
                <div className="text-xl text-gray-700 font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/collections", label: "Collections" },
                        ]}
                    />
                </div>
                <Button
                    variant="indigo"
                    size="sm"
                    onClick={() => navigate("/collections/new")}
                >
                    <Plus className="size-4" />
                    <div className="">New Collection</div>
                </Button>
            </div>
            <CollectionsTable />
        </div>
    );
};

export default Collections;
