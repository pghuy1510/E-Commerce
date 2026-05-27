const CART_ITEM_KEYS = ["items", "cartItems", "cart_items"];

function looksLikeCartItem(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    "quantity" in candidate ||
    "product" in candidate ||
    "productId" in candidate ||
    "product_id" in candidate
  );
}

function findCartItems(
  data: unknown,
  depth = 0,
): unknown[] | undefined {
  if (!data || typeof data !== "object" || depth > 4) {
    return undefined;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return undefined;
    }
    return data.every(looksLikeCartItem) ? data : undefined;
  }

  const record = data as Record<string, unknown>;
  for (const key of CART_ITEM_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const value of Object.values(record)) {
    const found = findCartItems(value, depth + 1);
    if (found) {
      return found;
    }
  }

  return undefined;
}

export function normalizeCartItems(data: unknown): any[] {
  const record = data as Record<string, unknown> | undefined;
  for (const key of CART_ITEM_KEYS) {
    const value = record?.[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (record && "data" in record) {
    const nested = record.data as Record<string, unknown> | undefined;
    for (const key of CART_ITEM_KEYS) {
      const value = nested?.[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  const found = findCartItems(data);
  return found ?? [];
}
