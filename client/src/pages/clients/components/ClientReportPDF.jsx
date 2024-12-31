/* eslint-disable react/prop-types */
import { Document, Page, Text, StyleSheet, View } from "@react-pdf/renderer";
import React from "react";
const styles = StyleSheet.create({
    page: {
        padding: "20px 0 20px",
    },
    billContainer: {
        // backgroundColor: "yellow",
        width: "90%",
        margin: "0 auto",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        // justifyContent: "space-between",
        alignItems: "center",
    },
    billHead: {
        width: "100%",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        padding: "5px 0",
        border: "1px solid black",
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
});
const ClientReportPDF = ({ client }) => {
    const { name = "", mobile = "", address = "", bills = [] } = client;
    const getProductArray = () => {
        const productArray = [];

        // Iterate through each bill
        bills?.forEach((bill) => {
            // Iterate through each product in the bill
            bill?.bill_items?.forEach((prod) => {
                const existingProduct = productArray.find(
                    (product) => product.product_id === prod.product_id && product.price === prod.price
                );
                if (existingProduct) {
                    // Product already exists, update quantity and total sell quantity
                    existingProduct.quantity += prod.quantity;
                    existingProduct.totalSales += prod.price * prod.quantity;
                } else {
                    // Product doesn't exist, add a new entry
                    productArray.push({
                        product_id: prod.product_id,
                        product_name: prod.product_name,
                        price: prod.price,
                        quantity: prod.quantity,
                        totalSales: prod.price * prod.quantity,
                    });
                }
            });
        });

        return productArray;
    };

    const productsArray = getProductArray();
    return (
        <>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.billContainer}>
                        {/* Name */}
                        <View style={styles.billHead}>
                            <Text>{name?.toUpperCase()}</Text>
                        </View>
                        {/* Details */}
                        <View style={styles.billdetails}>
                            <View style={{ ...styles.bdRow, padding: "3px 10px" }}>
                                <View
                                    style={{
                                        width: "40%",
                                        height: "100%",
                                        // backgroundColor: "yellowgreen",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "space-between",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <View style={styles.bdRow}>
                                        <Text style={styles.bdCol}> MOBILE NUMBER:</Text>
                                        <Text style={styles.bdCol}>{mobile}</Text>
                                    </View>
                                </View>
                                <View
                                    style={{
                                        width: "40%",
                                        height: "100%",
                                        // backgroundColor: "yellowgreen",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "space-between",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <View style={styles.bdRow}>
                                        <Text style={styles.bdCol}> ADDRESS:</Text>
                                        <Text style={styles.bdCol}>{address}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        {/* Products Table */}
                        <View
                            style={{
                                ...styles.billHead,
                                marginTop: 20,
                                borderTop: "1px solid black",
                            }}
                        >
                            <Text>PRODUCTS TABLE</Text>
                        </View>
                        <View
                            style={{
                                ...styles.table,
                            }}
                        >
                            {/* Table Header */}
                            <View
                                style={{
                                    ...styles.tableRow,
                                    borderBottom: "1px solid #ccc",
                                }}
                            >
                                <View
                                    style={{
                                        ...styles.tableCell,

                                        padding: "7px 10px",
                                    }}
                                >
                                    <Text>No.</Text>
                                </View>
                                <View
                                    style={{ ...styles.tableCell, flex: 3, padding: "7px 10px" }}
                                >
                                    <Text>PRODUCT NAME</Text>
                                </View>
                                <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                                    <Text>T.QTY</Text>
                                </View>
                                <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                                    <Text>RATE</Text>
                                </View>
                                <View style={{ ...styles.tableCell, padding: "7px 10px" }}>
                                    <Text>TOTAL</Text>
                                </View>
                                {/* Add more headers as needed */}
                            </View>
                            {/* Space */}
                            <View
                                style={{
                                    ...styles.tableRow,
                                    borderBottom: "1px solid #ccc",
                                    //   padding: "1px 0",
                                }}
                            >
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        flex: 3,
                                        textAlign: "right",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text style={{ marginRight: "20px" }}></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                {/* Add more cells for additional data */}
                            </View>
                            {/* Table Rows */}
                            {productsArray?.map((prod, index) => (
                                <View
                                    style={{
                                        ...styles.tableRow,
                                        borderBottom: "1px solid #ccc",
                                    }}
                                    key={index}
                                >
                                    <View
                                        style={{
                                            ...styles.tableCell,
                                        }}
                                    >
                                        <Text>{index + 1}</Text>
                                    </View>
                                    <View
                                        style={{
                                            ...styles.tableCell,
                                            flex: 3,
                                            textAlign: "left",
                                        }}
                                    >
                                        <Text>{prod?.product_name}</Text>
                                    </View>
                                    <View style={{ ...styles.tableCell }}>
                                        <Text>{prod?.quantity}</Text>
                                    </View>
                                    <View style={{ ...styles.tableCell }}>
                                        <Text>{prod?.price}</Text>
                                    </View>
                                    <View style={{ ...styles.tableCell }}>
                                        <Text>{prod?.totalSales}</Text>
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
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        fontSize: 10,
                                        flex: 3,
                                        textAlign: "right",
                                    }}
                                >
                                    <Text>Total Firki</Text>
                                </View>
                                <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                    <Text>
                                        {productsArray?.reduce((acc, curr) => {
                                            return acc + curr?.quantity;
                                        }, 0)}
                                    </Text>
                                </View>
                                <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                    <Text>G.Total</Text>
                                </View>
                                <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                    <Text>
                                        {productsArray.reduce((acc, curr) => {
                                            return acc + curr?.totalSales;
                                        }, 0)}
                                    </Text>
                                </View>
                            </View>
                            {/* Space */}
                            <View
                                style={{
                                    ...styles.tableRow,
                                    borderBottom: "1px solid #ccc",
                                    //   padding: "1px 0",
                                }}
                            >
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        flex: 3,
                                        textAlign: "right",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text style={{ marginRight: "20px" }}></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                {/* Add more cells for additional data */}
                            </View>
                        </View>
                        {/* Bill Table */}
                        <View
                            style={{
                                ...styles.billHead,
                                marginTop: 20,
                                borderTop: "1px solid black",
                            }}
                        >
                            <Text>BILL TABLE</Text>
                        </View>
                        <View
                            style={{
                                ...styles.table,
                            }}
                        >
                            {/* Table Header */}
                            <View
                                style={{
                                    ...styles.tableRow,
                                    borderBottom: "1px solid #ccc",
                                }}
                            >
                                <View
                                    style={{
                                        ...styles.tableCell,

                                        padding: "7px 10px",
                                    }}
                                >
                                    <Text>BILL NO</Text>
                                </View>
                                <View
                                    style={{ ...styles.tableCell, flex: 3, padding: "7px 10px" }}
                                >
                                    <Text>PRODUCT NAME</Text>
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
                                {/* Add more headers as needed */}
                            </View>
                            <View
                                style={{
                                    ...styles.tableRow,
                                    borderBottom: "1px solid #ccc",
                                    //   padding: "1px 0",
                                }}
                            >
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        flex: 3,
                                        textAlign: "right",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text style={{ marginRight: "20px" }}></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                <View
                                    style={{
                                        ...styles.tableCell,
                                        padding: "7px 10px",
                                        fontSize: 10,
                                        borderRight: "none",
                                    }}
                                >
                                    <Text></Text>
                                </View>
                                {/* Add more cells for additional data */}
                            </View>
                            {/* Table Rows */}
                            {bills?.map((bill, index) => (
                                <View key={index}>
                                    {bill?.bill_items?.map((prod, prodIndex) => {
                                        return (
                                            <View
                                                style={{
                                                    ...styles.tableRow,
                                                    borderBottom: "1px solid #ccc",
                                                }}
                                                key={prodIndex}
                                            >
                                                <View
                                                    style={{
                                                        ...styles.tableCell,
                                                    }}
                                                >
                                                    <Text>{prodIndex === 0 && bill?.bill_no}</Text>
                                                </View>
                                                <View
                                                    style={{
                                                        ...styles.tableCell,
                                                        flex: 3,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    <Text>{prod?.product_name}</Text>
                                                </View>
                                                <View style={{ ...styles.tableCell }}>
                                                    <Text>{prod?.quantity}</Text>
                                                </View>
                                                <View style={{ ...styles.tableCell }}>
                                                    <Text>{prod?.price}</Text>
                                                </View>
                                                <View style={{ ...styles.tableCell }}>
                                                    <Text>{prod?.price * prod?.quantity}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    {/* Total */}
                                    <View
                                        style={{
                                            ...styles.tableRow,
                                            borderBottom: "1px solid #ccc",
                                            //   padding: "1px 0",
                                        }}
                                    >
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                            }}
                                        >
                                            <Text></Text>
                                        </View>
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                                flex: 3,
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
                                            <Text>{bill?.total_firki}</Text>
                                        </View>
                                        <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                            <Text>Total</Text>
                                        </View>
                                        <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                            <Text>{bill?.sub_total}</Text>
                                        </View>
                                        {/* Add more cells for additional data */}
                                    </View>
                                    {/* Discount */}
                                    {bill?.discount > 0 && (
                                        <View
                                            style={{
                                                ...styles.tableRow,
                                                borderBottom: "1px solid #ccc",
                                                //   padding: "1px 0",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    flex: 3,
                                                    textAlign: "right",
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>Discount</Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>{bill?.discount}</Text>
                                            </View>
                                            {/* Add more cells for additional data */}
                                        </View>
                                    )}
                                    {/* Advance */}
                                    {bill?.advance > 0 && (
                                        <View
                                            style={{
                                                ...styles.tableRow,
                                                borderBottom: "1px solid #ccc",
                                                //   padding: "1px 0",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    flex: 3,
                                                    textAlign: "right",
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>Advance</Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>{bill?.advance}</Text>
                                            </View>
                                            {/* Add more cells for additional data */}
                                        </View>
                                    )}
                                    {/* Paid */}
                                    {bill?.paid && (
                                        <View
                                            style={{
                                                ...styles.tableRow,
                                                borderBottom: "1px solid #ccc",
                                                //   padding: "1px 0",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    flex: 3,
                                                    textAlign: "right",
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>Paid</Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>{bill?.paid}/-</Text>
                                            </View>
                                            {/* Add more cells for additional data */}
                                        </View>
                                    )}
                                    {/* Total Due */}
                                    {bill?.total_due && (
                                        <View
                                            style={{
                                                ...styles.tableRow,
                                                borderBottom: "1px solid #ccc",
                                                //   padding: "1px 0",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    flex: 3,
                                                    textAlign: "right",
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View
                                                style={{
                                                    ...styles.tableCell,
                                                    fontSize: 10,
                                                }}
                                            >
                                                <Text></Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>Due</Text>
                                            </View>
                                            <View style={{ ...styles.tableCell, fontSize: 10 }}>
                                                <Text>{bill?.total_due}</Text>
                                            </View>
                                            {/* Add more cells for additional data */}
                                        </View>
                                    )}

                                    <View
                                        style={{
                                            ...styles.tableRow,
                                            borderBottom: "1px solid #ccc",
                                            //   padding: "1px 0",
                                        }}
                                    >
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                                padding: "7px 10px",
                                                borderRight: "none",
                                            }}
                                        >
                                            <Text></Text>
                                        </View>
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                                padding: "7px 10px",
                                                flex: 3,
                                                textAlign: "right",
                                                fontSize: 10,
                                                borderRight: "none",
                                            }}
                                        >
                                            <Text style={{ marginRight: "20px" }}></Text>
                                        </View>
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                                padding: "7px 10px",
                                                fontSize: 10,
                                                borderRight: "none",
                                            }}
                                        >
                                            <Text></Text>
                                        </View>
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                                padding: "7px 10px",
                                                fontSize: 10,
                                                borderRight: "none",
                                            }}
                                        >
                                            <Text></Text>
                                        </View>
                                        <View
                                            style={{
                                                ...styles.tableCell,
                                                padding: "7px 10px",
                                                fontSize: 10,
                                                borderRight: "none",
                                            }}
                                        >
                                            <Text></Text>
                                        </View>
                                        {/* Add more cells for additional data */}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </Page>
            </Document>
        </>
    );
};

export default ClientReportPDF;
