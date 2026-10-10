# Tax code default rates and Bill line snapshot

Each tax code stores three default rates—CGST, SGST, and IGST—and a save is accepted only when CGST equals SGST and IGST equals their sum. Zero is allowed; negative rates and more than two decimal places are rejected. That keeps intrastate and interstate defaults consistent on the catalog row an operator maintains on Masters.

The rejected alternatives were a single combined GST rate on the catalog row, deriving CGST, SGST, and IGST from one operator input, and accepting any three percentages without the equality rule. Those would either hide the split the GST document needs or allow defaults that do not add up.

When a Bill line is built later, it will store the tax code id and a copy of the code, description, and the CGST, SGST, and IGST rates actually charged. It will not read those fields from the live catalog at display time, so editing a tax code after a Bill is raised does not rewrite historical lines.
