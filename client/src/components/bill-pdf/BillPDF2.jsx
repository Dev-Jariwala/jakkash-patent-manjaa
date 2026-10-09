/* eslint-disable react/prop-types */
import { PDFViewer } from "@react-pdf/renderer";
import BillPDFDocument from "@jakkash/bill-pdf";
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";

const BillPDF2 = ({ bill }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = bill?.order_id || "";
        const dataUrl = await QRCode.toDataURL(String(qrData), {
          width: 150,
          margin: 1,
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };
    if (bill?.order_no) {
      generateQRCode();
    }
  }, [bill?.order_no]);

  return (
    <>
      {bill && bill?.products?.length > 0 && qrCodeDataUrl &&
        <div className="h-[calc(100dvh-64px)] w-full">
          <PDFViewer height={"100%"} width={"100%"}>
            <BillPDFDocument bill={bill} qrCodeDataUrl={qrCodeDataUrl} />
          </PDFViewer>
        </div>
      }
    </>
  );
};

export default BillPDF2;
