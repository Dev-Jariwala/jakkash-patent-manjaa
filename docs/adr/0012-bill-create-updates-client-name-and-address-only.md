# Bill create updates client name and address only

Bill creation remains one of two writers to the client row, alongside Add and Edit on the clients screen. For a new mobile it still inserts only name, mobile, and address, leaving pincode, state, city, GST number, contact person, and contact number empty until an operator saves Edit. For an existing mobile it replaces only name and address, using the value already on the client when the bill omits one. It never writes profile columns, so a later bill cannot wipe a profile the operator filled in on Edit.

Add and Edit go through the same client-maintenance module. Add creates a row only when the mobile is new; an existing mobile is rejected with a clear message instead of merging into the stored client. That rejected alternative was a silent merge on Add, which would have let one operator overwrite another client's profile without choosing Edit.

Editing a bill updates that bill only and does not touch the client. The bill form and bill PDF stay limited to name, mobile number, and address.
