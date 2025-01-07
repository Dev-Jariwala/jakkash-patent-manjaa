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
    { label: "Wholesale Amount", key: "wholesale_amount" },
    { label: "Retail Quantity", key: "retail_quantity" },
    { label: "Retail Amount", key: "retail_amount" },
    { label: "Total Quantity", key: "total_quantity" },
    { label: "Total Amount", key: "total_amount" },
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
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-h-full">
            {isProductsReportLoading ?
                <div className="tw-flex tw-items-center tw-justify-between tw-h-64">
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
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                            <h1 className="tw-text-lg tw-font-medium tw-text-center tw-text-gray-500">
                                No products found in the collection.
                            </h1>
                        </div>
                    )}
                </>}
        </div>
    );
};

export default ProductsReport;
