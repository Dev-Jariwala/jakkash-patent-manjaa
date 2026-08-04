/* eslint-disable react/prop-types */
import React from "react";
import { Document } from "@react-pdf/renderer";
import SinglePagePDF from "./SinglePagePDF.jsx";
import DoublePagePDF from "./DoublePagePDF.jsx";
import { DOUBLE_PAGE_PRODUCT_THRESHOLD } from "./constants.js";

export { DOUBLE_PAGE_PRODUCT_THRESHOLD };

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
