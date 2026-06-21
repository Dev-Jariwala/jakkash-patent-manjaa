/* eslint-disable react/prop-types */
import React from "react";
import { Document } from "@react-pdf/renderer";
import SinglePagePDF from "./SinglePagePDF.jsx";
import DoublePagePDF from "./DoublePagePDF.jsx";

/** Product count at or above which the bill uses the two-page layout. */
export const DOUBLE_PAGE_PRODUCT_THRESHOLD = 18;

/**
 * Canonical React PDF bill document. Shared by the frontend bill viewer and
 * server-side PDF generation (later phases).
 */
const BillPDFDocument = ({ bill, qrCodeDataUrl }) => {
  const productCount = bill?.products?.length ?? 0;
  const useDoublePage = productCount >= DOUBLE_PAGE_PRODUCT_THRESHOLD;

  return (
    <Document>
      {useDoublePage ? (
        <DoublePagePDF bill={bill} qrCodeDataUrl={qrCodeDataUrl} />
      ) : (
        <SinglePagePDF bill={bill} qrCodeDataUrl={qrCodeDataUrl} />
      )}
    </Document>
  );
};

export default BillPDFDocument;
