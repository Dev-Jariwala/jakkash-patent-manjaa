import { LEGACY_PRODUCT_NAME_ORDER } from "../constants/legacyProductDisplayOrder.js";

const legacyNameIndex = new Map(
  LEGACY_PRODUCT_NAME_ORDER.map((name, index) => [name, index])
);

export function seedDisplayPositionRank(product) {
  const listIndex = legacyNameIndex.get(product.product_name);
  if (listIndex !== undefined) {
    return { tier: 0, listIndex, name: product.product_name, sr_no: product.sr_no };
  }
  return { tier: 1, listIndex: 0, name: product.product_name, sr_no: product.sr_no };
}

export function compareForSeedDisplayPosition(a, b) {
  const rankA = seedDisplayPositionRank(a);
  const rankB = seedDisplayPositionRank(b);
  if (rankA.tier !== rankB.tier) {
    return rankA.tier - rankB.tier;
  }
  if (rankA.tier === 0) {
    if (rankA.listIndex !== rankB.listIndex) {
      return rankA.listIndex - rankB.listIndex;
    }
    return rankA.sr_no - rankB.sr_no;
  }
  const byName = rankA.name.localeCompare(rankB.name);
  if (byName !== 0) {
    return byName;
  }
  return rankA.sr_no - rankB.sr_no;
}

export function sortProductsForSeed(products) {
  return [...products].sort(compareForSeedDisplayPosition);
}