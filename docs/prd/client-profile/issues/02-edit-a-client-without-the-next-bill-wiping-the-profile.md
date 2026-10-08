Status: ready-for-agent

## What to build

An operator can open a client, including one that a bill created with only name, mobile, and address, and save the client profile. The mobile number cannot be changed. State and city are required before save. The same client's own GST number can be saved again; another client's GST number cannot. The edit form tells the operator that name and address can change the next time a bill is created for this mobile. Creating a bill still inserts a client for a new mobile with an empty profile, and for an existing mobile replaces only name and address. Editing a bill does not change the client. There is no delete and no merge. One decision record explains why bills do not write the profile.

## Acceptance criteria

- [ ] Edit opens from the clients list, loads the current name, address, and profile, and saves them
- [ ] Mobile is read-only; a wrong mobile is a new client, and existing bills stay on the old number
- [ ] Edit cannot save until state and city are chosen; optional profile fields may stay blank
- [ ] Saving the client's own GST number succeeds; saving a GST number that belongs to another client fails
- [ ] If a saved state or city is later inactive, Edit still shows its name
- [ ] The form states that name and address can change the next time a bill is created for this mobile
- [ ] A bill for a new mobile still creates the client with name, mobile, and address only, and an empty profile
- [ ] A later bill for an existing mobile replaces only name and address, and leaves pincode, state, city, GST number, contact person, and contact number as saved, including when they are empty
- [ ] Editing a bill does not change the client; the bill form still autofills only name and address; the bill PDF does not gain profile fields
- [ ] There is no way to delete or merge a client
- [ ] Tests on the same client-maintenance module cover edit with mobile fixed, a repeated save of the client's own GST number, bill insert with an empty profile, and a later bill replacing name and address while the profile stays
- [ ] An ADR records that bill create updates name and address only, and that Add rejects an existing mobile instead of merging

## Blocked by

- [01 — Add a client with a profile](01-add-a-client-with-a-profile.md)
