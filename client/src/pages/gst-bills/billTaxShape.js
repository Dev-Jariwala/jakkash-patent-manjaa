export const TAX_SHAPE_WITHIN_STATE = "within-state";
export const TAX_SHAPE_INTERSTATE = "interstate";
export const LEGACY_BILL_SHAPE_MIXED = "mixed";

export function chargedPercentsFromTaxCodeForLineShape(taxCode, lineShape) {
  if (lineShape === TAX_SHAPE_INTERSTATE) {
    return { cgst: 0, sgst: 0, igst: taxCode.igst };
  }
  return {
    cgst: taxCode.cgst,
    sgst: taxCode.sgst,
    igst: 0,
  };
}

export function chargedLinePercentFieldsFromTaxCodeForLineShape(taxCode, lineShape) {
  const percents = chargedPercentsFromTaxCodeForLineShape(taxCode, lineShape);
  return {
    cgst_percent: percents.cgst,
    sgst_percent: percents.sgst,
    igst_percent: percents.igst,
  };
}

export function chargedPercentsForTaxShape(copyTrio, taxShape) {
  if (taxShape === TAX_SHAPE_WITHIN_STATE) {
    return { cgst: copyTrio.cgst, sgst: copyTrio.sgst, igst: 0 };
  }
  if (taxShape === TAX_SHAPE_INTERSTATE) {
    return { cgst: 0, sgst: 0, igst: copyTrio.igst };
  }
  return {
    cgst: copyTrio.cgst,
    sgst: copyTrio.sgst,
    igst: copyTrio.igst,
  };
}

export function displayPercentsForLine(line, taxShape) {
  const copy = {
    cgst: Number(line.cgst_percent) || 0,
    sgst: Number(line.sgst_percent) || 0,
    igst: Number(line.igst_percent) || 0,
  };
  if (!taxShape) {
    return copy;
  }
  return chargedPercentsForTaxShape(copy, taxShape);
}

function parsePercentAmount(raw) {
  const text = String(raw ?? "").trim();
  if (text === "") {
    return 0;
  }
  return Math.round((Number(text) + Number.EPSILON) * 100) / 100;
}

export function isExemptChargedPercents(cgstPercent, sgstPercent, igstPercent) {
  const cgst = parsePercentAmount(cgstPercent);
  const sgst = parsePercentAmount(sgstPercent);
  const igst = parsePercentAmount(igstPercent);
  return cgst === 0 && sgst === 0 && igst === 0;
}

export function chargedShapeFromLegacyPercents(cgstPercent, sgstPercent, igstPercent) {
  if (isExemptChargedPercents(cgstPercent, sgstPercent, igstPercent)) {
    return "exempt";
  }
  const cgst = parsePercentAmount(cgstPercent);
  const sgst = parsePercentAmount(sgstPercent);
  const igst = parsePercentAmount(igstPercent);
  if (cgst === sgst && igst === 0) {
    return TAX_SHAPE_WITHIN_STATE;
  }
  if (cgst === 0 && sgst === 0 && igst > 0) {
    return TAX_SHAPE_INTERSTATE;
  }
  return null;
}

function lineHasStoredTaxAmounts(line) {
  return (
    line.cgst_amount !== undefined &&
    line.cgst_amount !== null &&
    line.sgst_amount !== undefined &&
    line.sgst_amount !== null &&
    line.igst_amount !== undefined &&
    line.igst_amount !== null
  );
}

function chargedShapeFromLineAmounts(line) {
  const cgstAmount = Number(line.cgst_amount) || 0;
  const sgstAmount = Number(line.sgst_amount) || 0;
  const igstAmount = Number(line.igst_amount) || 0;
  if (cgstAmount > 0 || sgstAmount > 0) {
    return TAX_SHAPE_WITHIN_STATE;
  }
  if (igstAmount > 0) {
    return TAX_SHAPE_INTERSTATE;
  }
  return "exempt";
}

export function inferLegacyBillSharedShape(lines, rememberedSharedShape = null) {
  if (!lines || lines.length === 0) {
    return null;
  }
  const nonExemptShapes = [];
  let skippedCopyWithoutAmounts = 0;
  for (const line of lines) {
    let shape;
    if (line.tax_rates_are_copy) {
      if (lineHasStoredTaxAmounts(line)) {
        shape = chargedShapeFromLineAmounts(line);
      } else {
        skippedCopyWithoutAmounts += 1;
        continue;
      }
    } else {
      shape = chargedShapeFromLegacyPercents(
        line.cgst_percent,
        line.sgst_percent,
        line.igst_percent
      );
      if (shape === null) {
        return LEGACY_BILL_SHAPE_MIXED;
      }
    }
    if (shape !== "exempt") {
      nonExemptShapes.push(shape);
    }
  }
  if (nonExemptShapes.length === 0) {
    const everyLineIsCopyWithoutAmounts =
      lines.length > 0 && skippedCopyWithoutAmounts === lines.length;
    if (everyLineIsCopyWithoutAmounts && rememberedSharedShape) {
      return rememberedSharedShape;
    }
    return TAX_SHAPE_WITHIN_STATE;
  }
  const first = nonExemptShapes[0];
  if (nonExemptShapes.some((s) => s !== first)) {
    return LEGACY_BILL_SHAPE_MIXED;
  }
  return first;
}
