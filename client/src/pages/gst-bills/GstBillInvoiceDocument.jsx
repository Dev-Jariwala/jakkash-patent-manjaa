/* eslint-disable react/prop-types */
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  formatDiscountAmount,
  formatInvoiceDate,
  formatLineAmount,
  formatSummaryAmount,
  invoiceFigures,
  receiverContactPhone,
} from "@/pages/gst-bills/formatGstBillInvoice";

function fontSource(href) {
  if (href.startsWith("file://")) {
    return decodeURIComponent(href.slice("file://".length));
  }
  return href;
}

const notoRegular = fontSource(new URL("./fonts/NotoSans-Regular.ttf", import.meta.url).href);
const notoBold = fontSource(new URL("./fonts/NotoSans-Bold.ttf", import.meta.url).href);
const logoSrc = fontSource(new URL("./jakkash-logo.jpg", import.meta.url).href);

Font.register({
  family: "Noto Sans",
  fonts: [
    { src: notoRegular, fontWeight: 400 },
    { src: notoBold, fontWeight: 700 },
  ],
});

const SHOP_NAME = "JAKKASH PETANT MANJA";
const SHOP_ADDRESS = [
  "40, GaneshKrupa Society,Opp. GAIL Tower,",
  "Anandmahal Rd, Surat - 395009, Gujarat.",
];
const SHOP_GSTIN = "24AFYPC1088B1ZL";

const TERMS = [
  "- Goods once sold will not be taken back.",
  "- Goods will be dispatched at buyer's risk & responsibility.",
  "- Subject to Surat Jurisdiction.",
  "-Our responsiblity ceases on delivery of Goods to the party or carrier.",
  "-Transport & Unloading Charges Extra.",
];

const CERTIFICATION = "Certified that the perticulars given above are true and correct";

const BORDER = "#000000";

const COLS = {
  no: "6%",
  description: "38%",
  hsn: "16%",
  qty: "10%",
  rate: "15%",
  total: "15%",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans",
    fontSize: 8,
    color: "#000000",
    padding: 14,
    flexDirection: "column",
  },
  sheet: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "column",
  },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
  bold: { fontWeight: 700 },
  titleRow: {
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  shopRow: {
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 78,
    minHeight: 74,
    justifyContent: "center",
    position: "relative",
  },
  shopName: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
  },
  shopAddress: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 1,
  },
  gstin: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2,
  },
  logo: {
    position: "absolute",
    right: 8,
    top: 10,
    width: 68,
    height: 50,
    objectFit: "contain",
  },
  sectionBar: {
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontWeight: 700,
  },
  receiver: {
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  fieldLabel: {
    width: 58,
    fontWeight: 700,
  },
  fieldValue: {
    flex: 1,
  },
  receiverTax: {
    marginTop: 8,
  },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    minHeight: 28,
  },
  productRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    minHeight: 26,
  },
  cell: {
    borderRightWidth: 1,
    borderColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  filler: {
    flexGrow: 1,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    minHeight: 18,
  },
  footer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  bankCol: {
    width: "52%",
    borderRightWidth: 1,
    borderColor: BORDER,
    flexDirection: "column",
  },
  bankTitle: {
    textAlign: "center",
    fontWeight: 700,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  bankBody: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
    flexGrow: 1,
    flexDirection: "column",
  },
  bankText: {
    fontWeight: 700,
    marginBottom: 2,
  },
  wordsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  wordsLabel: {
    fontWeight: 700,
    marginRight: 4,
  },
  words: {
    flex: 1,
    fontWeight: 700,
    color: "#c00000",
  },
  summaryCol: {
    width: "48%",
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    minHeight: 16,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    width: "62%",
    borderRightWidth: 1,
    borderColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  summaryValue: {
    width: "38%",
    paddingVertical: 3,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  terms: {
    flexDirection: "row",
    minHeight: 108,
  },
  termsCol: {
    width: "52%",
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  signCol: {
    width: "48%",
  },
  termsTitle: {
    textAlign: "center",
    fontWeight: 700,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  termsBody: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  termLine: {
    marginBottom: 2,
  },
  signBody: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  certification: {
    textAlign: "center",
    fontWeight: 700,
  },
  signatory: {
    textAlign: "center",
    marginTop: 16,
  },
});

function colStyle(width, last = false) {
  return [styles.cell, { width }, last && styles.cellLast];
}

function HeaderCell({ width, lines, last = false }) {
  return (
    <View style={colStyle(width, last)}>
      {lines.map((line) => (
        <Text key={line} style={[styles.center, styles.bold]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function BodyCell({ width, children, last = false, align = "center", bold = false }) {
  const alignStyle = align === "right" ? styles.right : align === "left" ? undefined : styles.center;
  return (
    <View style={colStyle(width, last)}>
      <Text style={[alignStyle, bold && styles.bold]}>{children ?? ""}</Text>
    </View>
  );
}

function FieldRow({ label, value }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || ""}</Text>
    </View>
  );
}

function SummaryLine({ label, value, bold = false, last = false }) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <View style={styles.summaryLabel}>
        <Text style={bold ? styles.bold : undefined}>{label}</Text>
      </View>
      <View style={styles.summaryValue}>
        <Text style={[styles.right, bold && styles.bold]}>{value}</Text>
      </View>
    </View>
  );
}

function bankLines(bill) {
  const name = String(bill?.bank_name ?? "").trim();
  const address = String(bill?.bank_address ?? "").trim();
  return [name, address].filter(Boolean).join(", ");
}

const GstBillInvoiceDocument = ({ bill }) => {
  const lines = bill?.lines ?? [];
  const figures = invoiceFigures(bill);

  return (
    <Document title={bill?.bill_number ? `Tax invoice ${bill.bill_number}` : "Tax invoice"}>
      <Page size="A4" style={styles.page}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>TAX INVOICE</Text>
          </View>

          <View style={styles.metaRow}>
            <Text>DATE : {formatInvoiceDate(bill?.bill_date)}</Text>
            <Text>Invoice number : {bill?.bill_number || ""}</Text>
          </View>

          <View style={styles.shopRow}>
            <Text style={styles.shopName}>{SHOP_NAME}</Text>
            {SHOP_ADDRESS.map((line) => (
              <Text key={line} style={styles.shopAddress}>
                {line}
              </Text>
            ))}
            <Text style={styles.gstin}>GST IN : {SHOP_GSTIN}</Text>
            <Image src={logoSrc} style={styles.logo} />
          </View>

          <Text style={styles.sectionBar}>Details of Receiver ( Bill To )</Text>
          <View style={styles.receiver}>
            <FieldRow label="Name :" value={bill?.receiver_name} />
            <FieldRow label="Address :" value={bill?.receiver_address} />
            <View style={styles.receiverTax}>
              <FieldRow label="GST :" value={bill?.receiver_gst_number} />
              <FieldRow label="Contact :" value={receiverContactPhone(bill)} />
              <FieldRow label="Person:" value={bill?.receiver_contact_person} />
            </View>
          </View>

          <View style={styles.tableHead}>
            <HeaderCell width={COLS.no} lines={["No."]} />
            <HeaderCell width={COLS.description} lines={["Description"]} />
            <HeaderCell width={COLS.hsn} lines={["HSN/SAC"]} />
            <HeaderCell width={COLS.qty} lines={["QTY"]} />
            <HeaderCell width={COLS.rate} lines={["Rate", "( ₹ )"]} />
            <HeaderCell width={COLS.total} lines={["Total", "( ₹ )"]} last />
          </View>

          {lines.map((line, index) => (
            <View key={line.bill_line_id || `line-${index}`} style={styles.productRow} wrap={false}>
              <BodyCell width={COLS.no}>{String(index + 1)}</BodyCell>
              <BodyCell width={COLS.description} align="left" bold>
                {line.product_name}
              </BodyCell>
              <BodyCell width={COLS.hsn}>{line.tax_code}</BodyCell>
              <BodyCell width={COLS.qty}>{String(line.quantity ?? "")}</BodyCell>
              <BodyCell width={COLS.rate}>{formatLineAmount(line.rate)}</BodyCell>
              <BodyCell width={COLS.total} last>
                {formatLineAmount(line.price)}
              </BodyCell>
            </View>
          ))}

          <View style={styles.filler}>
            <View style={colStyle(COLS.no)} />
            <View style={colStyle(COLS.description)} />
            <View style={colStyle(COLS.hsn)} />
            <View style={colStyle(COLS.qty)} />
            <View style={colStyle(COLS.rate)} />
            <View style={colStyle(COLS.total, true)} />
          </View>

          <View style={styles.footer} wrap={false}>
            <View style={styles.bankCol}>
              <Text style={styles.bankTitle}>Bank Details</Text>
              <View style={styles.bankBody}>
                <Text style={styles.bankText}>{bankLines(bill)}</Text>
                <Text style={styles.bankText}>A/C No : {bill?.bank_account_number || ""}</Text>
                <Text style={styles.bankText}>IFS Code : {bill?.bank_ifsc || ""}</Text>
                <View style={{ flexGrow: 1 }} />
                <View style={styles.wordsRow}>
                  <Text style={styles.wordsLabel}>in words</Text>
                  <Text style={styles.words}>{figures.words}</Text>
                </View>
              </View>
            </View>
            <View style={styles.summaryCol}>
              <SummaryLine label="Total Taxable Value" value={formatSummaryAmount(figures.taxable)} bold />
              <SummaryLine label="CGST" value={formatSummaryAmount(figures.cgst)} />
              <SummaryLine label="SGST" value={formatSummaryAmount(figures.sgst)} />
              <SummaryLine label="IGST" value={formatSummaryAmount(figures.igst)} />
              <SummaryLine label="Discount" value={formatDiscountAmount(figures.discount)} />
              <SummaryLine
                label="Final Amount"
                value={formatSummaryAmount(figures.finalAmount)}
                bold
                last
              />
            </View>
          </View>

          <View style={styles.terms} wrap={false}>
            <View style={styles.termsCol}>
              <Text style={styles.termsTitle}>Terms & Conditions</Text>
              <View style={styles.termsBody}>
                {TERMS.map((term) => (
                  <Text key={term} style={styles.termLine}>
                    {term}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.signCol}>
              <Text style={styles.termsTitle}>{SHOP_NAME}</Text>
              <View style={styles.signBody}>
                <Text style={styles.certification}>{CERTIFICATION}</Text>
                <Text style={styles.signatory}>Authorized Signatory</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default GstBillInvoiceDocument;
