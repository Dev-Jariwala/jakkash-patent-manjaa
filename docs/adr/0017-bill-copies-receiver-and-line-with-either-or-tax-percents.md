# Bill copies the receiver and the line, with either-or tax percents

A Bill stores a copy of the receiver's name, address, GST number, contact person, and contact number from the client chosen at save time. Each Bill line stores copies of the product name and the tax code's code and catalog description, plus the rate and CGST, SGST, and IGST percents charged on that line.

A saved line accepts only one tax shape: CGST equals SGST with IGST 0, or CGST and SGST both 0 with IGST carrying the tax. The catalog rule that IGST equals CGST plus SGST applies when maintaining tax codes, not when validating a line on the Bill.

The rejected alternatives were storing only the client id, joining live client or catalog rows at display time, and applying the catalog's three-rate equality to the line. Those would rewrite historical Bills when masters or clients change.
