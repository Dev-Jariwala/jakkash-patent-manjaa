Status: ready-for-agent

## What to build

An operator can add a client who has never been billed. Add collects the name, mobile number, and address, and the client profile: pincode, state, city, GST number, contact person, and contact number. Country is always India and is not on the form. State and city are chosen from the shared location tables and are required. The city must belong to the selected state. If that mobile already exists, Add is rejected and nothing is merged. Optional profile fields may be left blank. When a GST number is entered it is stored once, in a normalized form, and no other client may use it. The new client shows on the clients list, including city, GST number, contact person, and contact number. Clients that do not have a profile yet show those cells blank. The glossary records the client as the person or business identified by mobile, and the client profile as the details a bill does not own.

## Acceptance criteria

- [ ] Add Client is available from the clients screen and saves a client whose mobile is not already stored
- [ ] Name, mobile, address, state, and city are required; pincode, GST number, contact person, and contact number are optional
- [ ] Country is not shown; states are limited to India; cities are limited to the selected state; only locations already in the shared tables are offered, and only active ones
- [ ] Changing state clears a city that does not belong to the new state
- [ ] A mobile that already exists is rejected with a clear message and the existing client is left unchanged
- [ ] A pincode, when present, is 6 digits; a contact number, when present, is 10 digits and may match the billing mobile; contact person is free text; blank optional fields are stored as empty rather than an empty string
- [ ] A GST number, when present, is a 15-character GSTIN stored in uppercase with spaces removed; it is unique; several clients may have no GST number; a GST number is not checked against the state code
- [ ] The clients list shows name, mobile, address, city, GST number, contact person, and contact number, with state and city displayed by name, and blank profile cells when the profile is empty
- [ ] The client-maintenance module is covered by tests that use an in-memory stand-in: create, duplicate mobile, required state and city, city not in state, optional blanks, formats, GST normalization, and a second client rejected for a GST number already stored
- [ ] The glossary describes the client profile in those terms

## Blocked by

None - can start immediately
