export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cafes: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          address: string;
          neighborhood: string | null;
          city: string;
          lat: number;
          lng: number;
          featured_image_url: string | null;
          logo_url: string | null;
          photo_urls: string[] | null;
          rating: number | null;
          review_count: number | null;
          is_new: boolean | null;
          is_featured: boolean;
          is_claimed: boolean;
          operating_hours: Json | null;
          social_links: Json | null;
          status: "draft" | "active" | "inactive";
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      cafe_tags: {
        Row: {
          cafe_id: string;
          tag_id: string;
          is_featured: boolean | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          category: string;
          icon_name: string | null;
          created_at: string;
          is_active: boolean;
          sort_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          cafe_id: string;
          name: string;
          price: number;
          image_url: string | null;
          is_highlight: boolean | null;
          category_id: string | null;
          description: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      menu_item_variants: {
        Row: {
          id: string;
          menu_item_id: string;
          label: string;
          price_override: number | null;
          price_modifier: number;
          is_default: boolean | null;
          sort_order: number | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          is_global: boolean | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          cafe_id: string;
          user_id: string;
          rating: number;
          content: string | null;
          image_urls: string[] | null;
          created_at: string;
          updated_at: string;
          helpful_count: number;
          moderation_status: "visible" | "hidden" | "removed";
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_cafes: {
        Args: {
          p_query?: string | null;
          p_user_id?: string | null;
          p_sort?: string | null;
          p_tag_names?: string[] | null;
          p_lat?: number | null;
          p_lng?: number | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: CafeRpcRow[];
      };
      get_menu_items: {
        Args: { p_cafe_id: string };
        Returns: MenuItemRpcRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Row shape returned by the `get_cafes` RPC. Kept loose to match the
// existing mobile caller and the unknown column order in the SQL function.
export type CafeRpcRow = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  city: string | null;
  lat: number;
  lng: number;
  featured_image_url: string | null;
  photo_urls: string[] | null;
  rating: number | null;
  review_count: number | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  is_favorited: boolean | null;
  distance_meters: number | null;
  tags: CafeRpcTag[] | null;
  created_at?: string | null;
};

export type CafeRpcTag = {
  name: string;
  category: string;
  icon_name: string | null;
  is_matched: boolean | null;
  is_featured: boolean | null;
};

export type MenuItemRpcRow = {
  id: string;
  cafe_id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_highlight: boolean | null;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  variants: {
    id: string;
    label: string;
    price_override: number | null;
    price_modifier: number;
    is_default: boolean | null;
    sort_order: number | null;
  }[];
};
