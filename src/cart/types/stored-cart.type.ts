export type StoredCartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
};

export type StoredCart = {
  items: StoredCartItem[];
  appliedCouponCode?: string | null;
};

export type CartValidationIssue = {
  itemId: string;
  productId: string;
  code:
    | 'CART_EMPTY'
    | 'PRODUCT_NOT_FOUND'
    | 'PRODUCT_INACTIVE'
    | 'INSUFFICIENT_STOCK'
    | 'COUPON_INVALID';
  message: string;
};
