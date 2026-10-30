# Bill Export stacks the printed Bill and uses a bill-number span

Export gathers many Bills into one PDF for the active collection. Each page is the printed Bill already shown when one Bill is opened on its own; the next Bill starts on the next page. Export does not join the live client, product, or tax code, and it does not invent a layout used only for Export.

A bill-number span types the series once as two parts and asks for From and To on the third part only. The third part is compared as an integer so `08` and `8` are the same number, while order among equal integers follows the stored third part as text. Leading zeros on the typed ends are allowed. From after To still runs the lower integer through the higher integer, inclusive.

The rejected alternatives were a zip of one file per Bill, a summary table like the order Report, sorting bill numbers alphabetically, and a printed layout used only for Export.
