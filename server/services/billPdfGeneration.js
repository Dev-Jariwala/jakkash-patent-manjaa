import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import BillPDFDocument from "@jakkash/bill-pdf";
import QRCode from "qrcode";

export async function generateBillPdfBuffer(bill) {
  if (!bill?.products?.length) {
    const error = new Error("Bill has no line items for PDF generation");
    error.code = "BILL_PDF_NO_PRODUCTS";
    throw error;
  }

  const qrCodeDataUrl = await QRCode.toDataURL(String(bill.bill_id || ""), {
    width: 150,
    margin: 1,
  });

  const document = React.createElement(BillPDFDocument, {
    bill,
    qrCodeDataUrl,
  });

  return renderToBuffer(document);
}

export function buildBillPdfFilename(bill) {
  const billNo = bill?.bill_no ?? "unknown";
  return `Jakkash-Bill-${billNo}.pdf`;
}
