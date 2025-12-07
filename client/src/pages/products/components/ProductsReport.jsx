import ExportPDF from "@/components/bill-pdf/ExportPDF";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { productNamesOrder, sortProductsByNames } from "@/helper/formHelper";
import { getProductsReport } from "@/services/products";
import { PDFViewer } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { toast } from "react-toastify";

const headers = [
    // { label: "Product Name", key: "product_id" },
    { label: "Product Name", key: "product_name" },
    { label: "Wholesale Quantity", key: "wholesale_quantity" },
    { label: "Wholesale Amount", key: "wholesale_amount", price: true },
    { label: "Retail Quantity", key: "retail_quantity" },
    { label: "Retail Amount", key: "retail_amount", price: true },
    { label: "Total Quantity", key: "total_quantity" },
    { label: "Total Amount", key: "total_amount", price: true },
];

const ProductsReport = () => {
    const [activeCollection] = useLocalStorage("activeCollection");

    const { data: prodcutsReport, isLoading: isProductsReportLoading, error: productsReportError } = useQuery({
        queryKey: ["prodcutsReport", { collection_id: activeCollection }],
        queryFn: async () => {
            const res = await getProductsReport({ collection_id: activeCollection });
            const showProducts = res.data?.products?.map(product => {
                return {
                    ...product,
                    total_quantity: Number(product.wholesale_quantity) + Number(product.retail_quantity),
                    total_amount: Number(product.wholesale_amount) + Number(product.retail_amount),
                }
            }) || [];
            return sortProductsByNames(showProducts, productNamesOrder)
        }
    });

    useEffect(() => {
        if (productsReportError) {
            toast.error(productsReportError?.message || "An error occurred while fetching the report.");
        }
    }, [productsReportError])

    return (
        <div className="w-full flex flex-col items-center h-full">
            {isProductsReportLoading ?
                <div className="flex items-center justify-between h-64">
                    <TypeWritterLoader />
                </div>
                : <>
                    {prodcutsReport?.length > 0 ? (
                        <PDFViewer width="100%" height="100%">
                            <ExportPDF
                                exportData={prodcutsReport}
                                headers={headers}
                                title={`Products Report`}
                            />
                        </PDFViewer>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <h1 className="text-lg font-medium text-center text-gray-500">
                                No products found in the collection.
                            </h1>
                        </div>
                    )}
                </>}
        </div>
    );
};

export default ProductsReport;
