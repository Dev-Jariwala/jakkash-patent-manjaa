export const handleDecimalInputChange = (e, field) => {
    // Allow only numbers, one decimal point, and up to two decimal places
    let value = e.target.value;

    // Replace invalid characters (anything other than digits and a single period)
    value = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point exists
    const parts = value.split('.');
    if (parts.length > 2) {
        value = `${parts[0]}.${parts[1]}`;
    }

    // Restrict to two digits after the decimal point
    if (parts.length === 2) {
        value = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    // Update the field with the sanitized value
    field.onChange(value);

    return value;
};

export const handleNumberInputChange = (e, field) => {
    const value = e.target.value.replace(/\D/g, '');
    field.onChange(value);
    return value;
};

export const productNamesOrder = [
    'ONLY FIRKI 1000',
    'ONLY FIRKI 2500',
    'ONLY FIRKI 5000',
    '6/250 READY FIRKI',
    '6/500 REDY FIRKI',
    '6/900 READY FIRKI',
    '9/250 READY FIRKI',
    '9/500 READY FIRKI',
    '9/900 READY FIRKI',
    '12/250 READY FIRKI',
    '12/500 READY FIRKI',
    '12/900 READY FIRKI',
    '9/250 BOBIN',
    '9/500 BOBIN',
    '9/900 BOBIN',
    '12/250 BOBIN',
    '12/500 BOBIN',
    '12/900 BOBIN',
    'LABOUR 250 GM RIL',
    'LABOUR 500 GM RIL',
    'LABOUR 900 MTR RIL',
    'BOX',
];

export function sortProductsByNames(products, productNamesOrder) {
    // Create a map for quick lookup of the index of each product name
    const nameIndexMap = new Map(productNamesOrder.map((name, index) => [name, index]));

    // Sort the products array
    products.sort((a, b) => {
        const indexA = nameIndexMap.has(a.product_name) ? nameIndexMap.get(a.product_name) : Infinity;
        const indexB = nameIndexMap.has(b.product_name) ? nameIndexMap.get(b.product_name) : Infinity;
        return indexA - indexB;
    });

    return products;
}
