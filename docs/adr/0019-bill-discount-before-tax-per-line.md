# Bill discount before tax on each line

Status: superseded by [0021-bill-has-no-discount-tax-on-full-price.md](./0021-bill-has-no-discount-tax-on-full-price.md).

The bill discount is a required percent from 0 to 100 with at most two decimal places. It reduces each kept line's price before that line's tax, rounded half up to the paise. Price on the form stays quantity times rate; tax rupees and the footer totals use the discounted price and sum already-rounded amounts.

The rejected alternatives were taking the percent off the grand total after tax and dropping the discount entirely. Those would disagree with the GST line math operators expect and with the reference totals in the Bill PRD.
