Status: ready-for-agent

## What to build

An operator opens Bank details from the sidebar, after Masters and before Settings. The screen is one form for the shop bank account: bank name, bank address, account number, and IFSC. The code field is labeled IFSC. Before any save, the form is empty, and that is not an error. The first save creates the only account. Every later save updates that same account. A save is rejected unless all four fields are filled after trimming, the bank name is at most 120 characters, the bank address is at most 255 characters, the account number is 9 to 18 digits stored as text, and the IFSC is four letters, then 0, then six letters or digits, stored in uppercase. A rejection names the rule that failed. A later save cannot clear a field. There is no Add, no Delete, and no table. One shop-bank-account module is the only writer, and tests call it with an in-memory stand-in. The glossary records Shop bank account and Bill bank block. One decision record explains that a future Bill copies the four fields, stores no bank id, does not change that copy when the account or the Bill is edited later, cannot be raised until the account exists, and that the Order PDF is unchanged. This slice does not build the Bill. Orders stay Orders.

## Acceptance criteria

- [ ] Bank details is in the sidebar immediately after Masters and immediately before Settings, and the page heading reads Bank details
- [ ] The screen is one form with bank name, bank address, account number, and IFSC, and the code field is labeled IFSC
- [ ] Before any save, the form is empty and that empty form is not an error
- [ ] The first save creates the only account, a later save updates it, and a reload shows the latest bank name, bank address, account number, and IFSC
- [ ] A leading zero on the account number is kept, and a lowercase IFSC is stored in uppercase
- [ ] A blank field is rejected, and the message names that field; a bank name over 120 characters or a bank address over 255 characters is rejected
- [ ] An account number that is not 9 to 18 digits is rejected, and the message says it must be 9 to 18 digits
- [ ] An IFSC that is not four letters, then 0, then six letters or digits is rejected, including a space inside the code, and the message says it must be the standard 11-character IFSC
- [ ] A later save that clears a field is rejected
- [ ] There is no Add, no Delete, and no table of accounts
- [ ] Tests on the shop-bank-account module, using an in-memory stand-in, cover the empty read, a valid save, an uppercase IFSC, a leading zero, a second save that leaves one account, and the blank, account-number, and IFSC rejections
- [ ] The glossary records Shop bank account as the shop's one current account of those four fields, and Bill bank block as the copy stored on a Bill when it is raised and printed only on that Bill's PDF
- [ ] An ADR records that a future Bill stores the four strings and not a bank id, that a later edit of the account or of the Bill does not change that copy, that a Bill cannot be raised until a shop bank account has been saved, and that the Order PDF is unchanged
- [ ] No Bill screen is added, and the Order PDF, Orders, Masters, and Settings stay as they are

## Blocked by

None - can start immediately
