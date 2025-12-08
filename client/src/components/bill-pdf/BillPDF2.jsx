/* eslint-disable react/prop-types */
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFViewer,
  Font,
} from "@react-pdf/renderer";
import React, { useState, useEffect } from "react";
import SinglePagePDF from "./SinglePagePDF";
import DoublePagePDF from "./DoublePagePDF";
import QRCode from "qrcode";
// import Font from "@react-pdf/font";

const styles = StyleSheet.create({
  // Add a new style for bold text within billHead
  boldText: {
    fontWeight: "bold",
  },
  billContainer: {
    // backgroundColor: "yellow",
    width: "90%",
    margin: "0 auto",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0 10px",
  },
  bill: {
    // backgroundColor: "red",
    width: "100%",
    margin: "0 auto",
    // minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 0 0",
  },
  billHead: {
    width: "100%",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    padding: "5px 0",
    border: "1px solid black",
  },
  address: {
    width: "100%",
    fontSize: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 7px",
    border: "1px solid black",
    borderTop: "none",
  },
  billdetails: {
    width: "100%",
    // backgroundColor: "red",
    fontSize: 8,
    border: "1px solid black",
    borderTop: "none",
  },
  bdRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "3px 0",
  },
  bdCol: {
    // backgroundColor: "yellow",
    width: "50%",
  },
  table: {
    width: "100%",
    fontSize: 9,
    // marginBottom: 10,
    border: "1px solid black",
    borderTop: "none",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 8,
    padding: "2px 10px",
    borderRight: "1px solid #ccc",
  },
  notes: {
    width: "100%",
    // backgroundColor: "green",
    fontSize: 8,
    border: "1px solid black",
    padding: "3px 10px",
  },
});

const BillPDF2 = ({ bill }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  useEffect(() => {
    // Generate QR code as data URL
    const generateQRCode = async () => {
      try {
        const qrData = bill?.bill_id || "";
        const dataUrl = await QRCode.toDataURL(String(qrData), {
          width: 150,
          margin: 1,
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };
    if (bill?.bill_no) {
      generateQRCode();
    }
  }, [bill?.bill_no]);

  return (
    <>
      {bill && bill?.products?.length > 0 && qrCodeDataUrl &&
        <div className="h-[calc(100dvh-64px)] w-full">
          <PDFViewer height={"100%"} width={"100%"}>
            <Document>
              {bill?.products?.length < 18 && <SinglePagePDF bill={bill} qrCodeDataUrl={qrCodeDataUrl} />}
              {bill?.products?.length >= 18 && <DoublePagePDF bill={bill} qrCodeDataUrl={qrCodeDataUrl} />}
            </Document>
          </PDFViewer>
        </div>
      }
    </>
  );
};

export default BillPDF2;
