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