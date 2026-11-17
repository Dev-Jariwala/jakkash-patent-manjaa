Status: ready-for-agent

## Parent

[GST not applicable PRD](../PRD.md)

## What to build

A client profile's GST becomes one of three states: blank, a GSTIN, or GST not applicable. The new state is a mark on the client. The GST number stays empty while the mark is on, so many clients can be marked. A filled GST number stays a unique 15-character GSTIN. The letters N/A are not a GST number.

Existing clients stay blank. A row cannot hold both a GSTIN and the mark. Create and update accept the mark. When the mark is on, the stored GST number is empty. A payload that sends both a GSTIN and the mark is rejected.

Add and edit show a switch labeled **GST not applicable**. While it is on, the GST field is disabled and shows N/A, and that text is not what gets stored. Turning the switch on clears a GSTIN that was typed or already saved. Turning it off and leaving GST empty returns the client to blank. Typing a GSTIN turns the switch off. A cleared GSTIN is not put back unless the operator types it again.

The clients list, the client CSV, and the client report show N/A for a marked client and stay blank when the GST number is empty. A client search for N/A finds marked clients. A search for a real GSTIN still finds that client.

The glossary names GST not applicable, and Client profile and Receiver are sharpened so a Receiver is a client with a GSTIN or GST not applicable. A short decision record says the words N/A are not stored in the GST number, because a filled GST number is unique. The Bill does not offer these clients yet. That is the next slice.

Client save tests, through the existing in-memory client world, cover the three states, more than one marked client, rejection of a GSTIN plus the mark, rejection of the letters N/A as a GSTIN, and turning the mark off so the GST number is empty again.

## Acceptance criteria

- [x] Existing clients stay blank, and a new mark defaults off
- [x] A GSTIN and the mark cannot both be stored
- [x] Many clients can be GST not applicable, because the GST number stays empty
- [x] A real GSTIN stays unique, and the letters N/A are rejected as a GSTIN
- [x] Create and update accept the mark and store an empty GST number when it is on
- [x] A payload with both a GSTIN and the mark is rejected
- [x] Add and edit show a switch labeled GST not applicable
- [x] With the switch on, the GST field is disabled, shows N/A, and saves an empty GST number
- [x] Turning the switch on clears a typed or already saved GSTIN
- [x] Turning the switch off with an empty GST returns the client to blank
- [x] Typing a GSTIN turns the switch off, and a cleared GSTIN is not restored
- [x] The clients list, client CSV, and client report show N/A for a marked client and stay blank for an empty GST number
- [x] Searching clients for N/A finds marked clients, and searching a GSTIN still finds that client
- [x] Client save tests cover the three states, many marked clients, rejection of both together, rejection of the letters N/A, and clearing the mark
- [x] The glossary names GST not applicable and sharpens Client profile and Receiver
- [x] A decision record explains that N/A is not stored in the GST number because a filled GST number is unique

## Blocked by

None — can start immediately