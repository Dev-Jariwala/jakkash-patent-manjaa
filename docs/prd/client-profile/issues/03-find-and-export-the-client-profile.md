Status: ready-for-agent

## What to build

An operator can find a client by the profile and take that profile off the screen. Search matches pincode, GST number, contact person, contact number, and city name as well as name, mobile, and address. The CSV export includes name, mobile, address, pincode, state, city, GST number, contact person, and contact number. The client report prints that profile under the client header. State and city appear by name. A client with an empty profile still exports and prints, with those fields blank. This slice does not add a second test suite; the client-maintenance tests stay on Add and Edit.

## Acceptance criteria

- [ ] Search matches name, mobile, address, pincode, GST number, contact person, contact number, and city name
- [ ] The CSV export includes name, mobile, address, pincode, state, city, GST number, contact person, and contact number
- [ ] The client report header prints that same profile
- [ ] State and city are shown by name
- [ ] A client with an empty profile still appears in search, the CSV, and the report, with profile fields blank
- [ ] The bill form and the bill PDF are unchanged

## Blocked by

- [01 — Add a client with a profile](01-add-a-client-with-a-profile.md)
