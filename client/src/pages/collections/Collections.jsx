import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CollectionsTable from "./components/CollectionsTable";

const Collections = () => {
    const navigate = useNavigate();
    return (
        <div className="">
            <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-border-b tw-border-gray-200 tw-py-3 tw-mb-3">
                <div className="tw-text-xl tw-text-gray-700 tw-font-semibold">
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
                    <Plus className="tw-size-4" />
                    <div className="">New Collection</div>
                </Button>
            </div>
            <CollectionsTable />
        </div>
    );
};

export default Collections;
