export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  size: string;
  stock: number;
  price_override?: number | null;
}

export interface Product {
  id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  base_price: number;
  cost_usd?: number;
  images: string[];
  allows_custom_name?: boolean;
  is_preorder?: boolean;
  in_stock?: boolean;
  is_active: boolean;
  created_at?: string;
  product_variants?: ProductVariant[];
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  variantId?: string;
  name: string;
  size?: string;
  price: number;
  quantity: number;
  customizationText?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
  total_amount: number;
  estimated_cost_brl?: number;
  status: string;
  created_at: string;
}