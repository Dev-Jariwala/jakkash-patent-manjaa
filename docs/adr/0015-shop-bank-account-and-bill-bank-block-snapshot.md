# Shop bank account and Bill bank block snapshot

The shop maintains one shop bank account on Bank details: bank name, bank address, account number, and IFSC. When a Bill is raised later, it will copy those four strings into a Bill bank block on the Bill record. The Bill will not store a bank id or join back to the live account when the Bill is shown or when the Bill PDF is generated.

The rejected alternatives were storing a foreign key to the shop bank account, reading the live account at PDF time, allowing a Bill with no bank block, and printing the account on the Order PDF. A foreign key or live lookup would change what an old Bill shows after the operator updates Bank details. An empty bank block would send customers a GST document with nowhere to pay. Putting the block on the Order PDF would change the WhatsApp order document, which must stay as it is today.

A Bill cannot be raised until a shop bank account has been saved at least once. Editing the shop bank account after a Bill is raised does not change that Bill's bank block. Editing the Bill later does not refresh the bank block. The Bill screen will not show the block; only the Bill PDF will. That Bill flow is not implemented in the shop-bank-account slice.

The Order PDF is unchanged. Orders, Masters, and Settings behavior stay as they are.
