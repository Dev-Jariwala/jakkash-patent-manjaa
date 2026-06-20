/* eslint-disable react/prop-types */
import React from "react";
import {
  Page,
  View,
  Text,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { billPdfStyles as styles } from "./styles.js";

const DoublePagePDF = ({ bill, qrCodeDataUrl }) => {
  const {
    bill_no,
    name,
    order_date,
    mobile,
    address,
    delivery_date,
    products,
    total_firki,
    sub_total,
    discount,
    advance,
    total_due,
  } = bill;
  return (
    <>
      <Page size="A5">
        <View style={styles.billContainer}>
          <View style={styles.bill}>
            <View style={styles.billHead}>
              <Text>JAKKASH PATENT MANJA</Text>
            </View>
            <View style={styles.address}>
              <Text>
                40, GANESH KRUPA SOCIETY, NEAR JOGANI NAGAR, OPP GAIL TOWER,
                TADWADI, RANDER ROAD, SURAT.
              </Text>
            </View>
            <View style={styles.billdetails}>
              <View style={{ ...styles.bdRow, padding: "3px 10px" }}>
                <View
                  style={{
                    width: "40%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "space-between",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> NAME:</Text>
                    <Text style={styles.bdCol}>{name.toUpperCase()}</Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> ADDRESS:</Text>
                    <Text style={styles.bdCol}>{address.toUpperCase()}</Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> MOBILE:</Text>
                    <Text style={styles.bdCol}>{mobile}</Text>
                  </View>
                </View>
                <View
                  style={{
                    width: "40%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "space-between",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> bill_no:</Text>
                    <Text style={styles.bdCol}>{bill_no}</Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> DATE:</Text>
                    <Text style={styles.bdCol}>
                      {order_date ? format(new Date(order_date), "dd/MM/yyyy") : "-"}
                    </Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> DELIVERY DATE:</Text>
                    <Text style={styles.bdCol}>
                      {delivery_date ? format(new Date(delivery_date), "dd/MM/yyyy") : "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {
              <View style={styles.table}>
                <View
                  style={{
                    ...styles.tableRow,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <View
                    style={{
                      ...styles.tableCell,
                      flex: 4,
                      padding: "7px 10px",
                    }}
                  >
                    <Text>DESCRIPTION</Text>
                  </View>
                  <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                    <Text>QTY</Text>
                  </View>
                  <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                    <Text>RATE</Text>
                  </View>
                  <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                    <Text>TOTAL</Text>
                  </View>
                </View>

                {products?.slice(0, 20)?.map((product, index) => (
                  <>
                    <View
                      key={index}
                      style={{
                        ...styles.tableRow,
                        borderBottom: "1px solid #ccc",
                      }}
                    >
                      <View
                        style={{
                          ...styles.tableCell,
                          flex: 4,
                          textAlign: "left",
                        }}
                      >
                        <Text>{product?.product_name}</Text>
                      </View>
                      <View
                        style={{
                          ...styles.tableCell,
                        }}
                      >
                        <Text>{product?.quantity}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text>{product?.price}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text>{(product?.price * product?.quantity).toFixed(2)}</Text>
                      </View>
                    </View>
                  </>
                ))}
                <>
                  <View
                    style={{
                      ...styles.tableRow,
                      borderBottom: "1px solid #ccc",
                    }}
                  >
                    <View
                      style={{
                        ...styles.tableCell,
                        flex: 4,
                        textAlign: "left",
                      }}
                    >
                      <Text></Text>
                    </View>
                    <View
                      style={{
                        ...styles.tableCell,
                      }}
                    >
                      <Text></Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text></Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>Continue..</Text>
                    </View>
                  </View>
                </>
              </View>
            }
          </View>
          <View style={styles.notes}>
            <View style={{ alignItems: "center", marginVertical: 10, position: 'absolute', right: 8, top: 0 }}>
              {qrCodeDataUrl && (
                <Image
                  src={qrCodeDataUrl}
                  style={{ width: 50, height: 50 }}
                />
              )}
            </View>
            <Text
              style={{
                textAlign: "center",
                fontSize: 9,
                marginBottom: 5,
              }}
            >
              " Important Notes "
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * We are not responsible for breakage of firki.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * Delivery of firki will be taken according to own dates.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * We will not be responsible for loss of Firki after delivery date
              of Firki is late.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * Check and calculate your firkis. Any dispute will not be
              considered later.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * Bring the bobbin after proper inspection. We will not be
              responsible for bad or duplicate thread.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * If Firki is lost by us before the date of delivery, give details
              of Firki in writing and take signature and take delivery of Firki
              by 12 noon on 13th January.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * If firki or bobbin is taken from us then payment will be made
              first otherwise it will not be delivered.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * No goods will be issued without a receipt.
            </Text>
          </View>
        </View>
      </Page>
      <Page size="A5">
        <View style={styles.billContainer}>
          <View style={styles.bill}>
            <View style={styles.billHead}>
              <Text>JAKKASH PATENT MANJA</Text>
            </View>
            <View style={styles.address}>
              <Text>
                40, GANESH KRUPA SOCIETY, NEAR JOGANI NAGAR, OPP GAIL TOWER,
                TADWADI, RANDER ROAD, SURAT.
              </Text>
            </View>
            <View style={styles.billdetails}>
              <View style={{ ...styles.bdRow, padding: "3px 10px" }}>
                <View
                  style={{
                    width: "40%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "space-between",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> NAME:</Text>
                    <Text style={styles.bdCol}>{name.toUpperCase()}</Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> ADDRESS:</Text>
                    <Text style={styles.bdCol}>{address.toUpperCase()}</Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> MOBILE:</Text>
                    <Text style={styles.bdCol}>{mobile}</Text>
                  </View>
                </View>
                <View
                  style={{
                    width: "40%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "space-between",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> BILLNO:</Text>
                    <Text style={styles.bdCol}>{bill_no}</Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> DATE:</Text>
                    <Text style={styles.bdCol}>
                      {order_date ? format(new Date(order_date), "dd/MM/yyyy") : "-"}
                    </Text>
                  </View>
                  <View style={styles.bdRow}>
                    <Text style={styles.bdCol}> DELIVERY DATE:</Text>
                    <Text style={styles.bdCol}>
                      {delivery_date ? format(new Date(delivery_date), "dd/MM/yyyy") : "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {
              <View style={styles.table}>
                <View
                  style={{
                    ...styles.tableRow,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <View
                    style={{
                      ...styles.tableCell,
                      flex: 4,
                      padding: "7px 10px",
                    }}
                  >
                    <Text>DESCRIPTION</Text>
                  </View>
                  <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                    <Text>QTY</Text>
                  </View>
                  <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                    <Text>RATE</Text>
                  </View>
                  <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                    <Text>TOTAL</Text>
                  </View>
                </View>

                {products?.slice(20, products?.length)?.map((product, index) => (
                  <View
                    key={index}
                    style={{
                      ...styles.tableRow,
                      borderBottom: "1px solid #ccc",
                    }}
                  >
                    <View
                      style={{
                        ...styles.tableCell,
                        flex: 4,
                        textAlign: "left",
                      }}
                    >
                      <Text>{product?.product_name}</Text>
                    </View>
                    <View
                      style={{
                        ...styles.tableCell,
                      }}
                    >
                      <Text>{product?.quantity}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>{product?.price}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text>{(product?.price * product?.quantity).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
                <View
                  style={{
                    ...styles.tableRow,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <View
                    style={{
                      ...styles.tableCell,
                      flex: 4,
                      textAlign: "right",
                      fontSize: 10,
                    }}
                  >
                    <Text style={{ marginRight: "20px" }}>Total Firki</Text>
                  </View>
                  <View
                    style={{
                      ...styles.tableCell,
                      fontSize: 10,
                    }}
                  >
                    <Text>{total_firki}</Text>
                  </View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>Total</Text>
                  </View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>{sub_total}</Text>
                  </View>
                </View>
                <View
                  style={{
                    ...styles.tableRow,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <View
                    style={{
                      ...styles.tableCell,
                      flex: 4,
                      textAlign: "right",
                      fontSize: 10,
                    }}
                  ></View>
                  <View
                    style={{
                      ...styles.tableCell,
                      fontSize: 10,
                    }}
                  ></View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>Discount</Text>
                  </View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>{discount}</Text>
                  </View>
                </View>
                <View
                  style={{
                    ...styles.tableRow,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <View
                    style={{
                      ...styles.tableCell,
                      flex: 4,
                      textAlign: "right",
                      fontSize: 10,
                    }}
                  ></View>
                  <View
                    style={{
                      ...styles.tableCell,
                      fontSize: 10,
                    }}
                  ></View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>Advance</Text>
                  </View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>{advance}</Text>
                  </View>
                </View>
                <View
                  style={{
                    ...styles.tableRow,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  <View
                    style={{
                      ...styles.tableCell,
                      flex: 4,
                      textAlign: "right",
                      fontSize: 10,
                    }}
                  ></View>
                  <View
                    style={{
                      ...styles.tableCell,
                      fontSize: 10,
                    }}
                  ></View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>Due</Text>
                  </View>
                  <View style={{ ...styles.tableCell, fontSize: 10 }}>
                    <Text>{total_due}</Text>
                  </View>
                </View>
              </View>
            }
          </View>
          <View style={styles.notes}>
            <View style={{ alignItems: "center", marginVertical: 10, position: 'absolute', right: 8, top: 0 }}>
              {qrCodeDataUrl && (
                <Image
                  src={qrCodeDataUrl}
                  style={{ width: 50, height: 50 }}
                />
              )}
            </View>
            <Text
              style={{
                textAlign: "center",
                fontSize: 9,
                marginBottom: 5,
              }}
            >
              " Important Notes "
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * We are not responsible for breakage of firki.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * Delivery of firki will be taken according to own dates.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * We will not be responsible for loss of Firki after delivery date
              of Firki is late.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * Check and calculate your firkis. Any dispute will not be
              considered later.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * Bring the bobbin after proper inspection. We will not be
              responsible for bad or duplicate thread.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * If Firki is lost by us before the date of delivery, give details
              of Firki in writing and take signature and take delivery of Firki
              by 12 noon on 13th January.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * If firki or bobbin is taken from us then payment will be made
              first otherwise it will not be delivered.
            </Text>
            <Text style={{ marginBottom: 2 }}>
              * No goods will be issued without a receipt.
            </Text>
          </View>
        </View>
      </Page>
    </>
  );
};

export default DoublePagePDF;
