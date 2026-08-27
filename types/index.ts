export interface Category {
  id: string;
  name: string;
  slug: string;
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
  is_preorder: boolean;
  in_stock: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  cost_usd?: number;
}

export interface Order {
  id: string;
  customer_name: string;
  items: CartItem[];
  total_amount: number;
  estimated_cost_brl: number;
  status: string;
  created_at: string;
}