/* eslint-disable react/prop-types */
import { Document } from "@react-pdf/renderer";
import { GstBillInvoicePage } from "@/pages/gst-bills/GstBillInvoiceDocument";

const GstBillsExportDocument = ({ bills }) => {
  const title =
    bills?.length === 1
      ? `Tax invoice ${bills[0].bill_number}`
      : bills?.length
        ? `Bill export (${bills.length})`
        : "Bill export";

  return (
    <Document title={title}>
      {bills.map((bill) => (
        <GstBillInvoicePage key={bill.bill_id} bill={bill} />
      ))}
    </Document>
  );
};

export default GstBillsExportDocument;
