export function normalizeCartItems(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  if (Array.isArray(data?.cart?.items)) {
    return data.cart.items;
  }

  if (Array.isArray(data?.cart)) {
    return data.cart;
  }

  return [];
}
