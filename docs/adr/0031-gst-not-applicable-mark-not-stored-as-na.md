# GST not applicable is a mark, not a stored GST number

A client who has no GSTIN is marked **GST not applicable** on the client profile. The GST number column stays empty. List, CSV, and client report show N/A for that mark. On a Bill, the words N/A are copied onto the receiver GST only when that client is chosen at save time.

The letters N/A are not stored in `clients.gst_number`. Every non-empty GST number must remain a unique 15-character GSTIN, so N/A cannot share the GST number column with real GSTINs. A database check refuses a row that has both a GST number and the mark.

The rejected alternative was storing the literal N/A in `gst_number`, which would break uniqueness for filled GST numbers and let operators type N/A without using the mark.