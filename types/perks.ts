import { Merchant } from "./user";

// types/perks.ts
export interface PerksCategory {
    _id: string;
    name: string;
    description: string;
    parent_id: string | null;
    path: string;
    icon: string;
  }
  
  export interface PerksImage {
    src: string;
    image_id: string;
  }
  
  export interface Perk {
    _id: string;
    perks_name: string;
    perks_type: string;
    perks_category: PerksCategory;
    discount_type: string;
    discount: string;
    start_date: string;
    end_date: string;
    merchant_id: Merchant;
    perks_image: PerksImage[];
    perks_description: string;
    original_amount: string;
    additional_info: string;
    sale_type: string;
    publish: boolean;
    update_date: string;
    sort_score: number;
  }