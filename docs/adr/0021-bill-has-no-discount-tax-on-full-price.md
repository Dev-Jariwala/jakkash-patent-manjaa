# Bill has no discount; tax on full Price

Status: accepted

Supersedes [0019-bill-discount-before-tax-per-line.md](./0019-bill-discount-before-tax-per-line.md).

A Bill does not store or accept a discount percent. Tax rupees are computed from the full Price (quantity times rate, rounded half up to the paise). Total value is the sum of Prices. Total bill is total value plus total tax. A save whose Total bill is 0 is rejected.

The rejected alternatives were keeping the percent before tax, spreading a rupee cut across lines before tax, and copying the Order so the cut comes off Total bill after tax.
