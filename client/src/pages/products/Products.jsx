import ProductsTable from "./components/ProductsTable";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const navigate = useNavigate();
  return (
    <div className="">
      <div className="flex items-center justify-between px-5 border-b border-gray-200 py-3 mb-3">
        <div className="text-xl text-gray-700 font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/products", label: "Products" },
            ]}
          />
        </div>
        <Button
          variant="indigo"
          size="sm"
          onClick={() => navigate("/products/new")}
          // to={"/products/new"}
        >
          <Plus className="size-4" />
          <div className="">New Product</div>
        </Button>
      </div>
      <ProductsTable />
    </div>
  );
};

export default Products;
