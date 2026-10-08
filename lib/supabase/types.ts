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
      get_cafes_near_point: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_meters: number;
          p_user_id?: string | null;
          p_sort?: string | null;
          p_tag_names?: string[] | null;
          p_query?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: CafeRpcRow[];
      };
      get_cafes_in_viewport: {
        Args: {
          p_min_lat: number;
          p_min_lng: number;
          p_max_lat: number;
          p_max_lng: number;
          p_user_id?: string | null;
          p_lat?: number | null;
          p_lng?: number | null;
          p_sort?: string | null;
          p_tag_names?: string[] | null;
          p_query?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: CafeRpcRow[];
      };
      get_menu_items: {
        Args: { p_cafe_id: string };
        Returns: MenuItemRpcRow[];
      };
      /** nook-supabase migration 20261005120000_public_profile.sql. Null
       * when the profile is unknown, suspended or hidden from the caller. */
      get_public_profile: {
        Args: { p_username?: string | null; p_user_id?: string | null };
        Returns: PublicProfileRpc | null;
      };
      /** Community crawls (nook-supabase docs/COMMUNITY_CRAWLS.md). Null for
       * private, archived, removed or unknown codes when called as anon. */
      get_community_crawl: {
        Args: { p_share_code: string };
        Returns: CommunityCrawlRpc | null;
      };
      /** A crew invite's landing preview. Null for unknown or removed. */
      get_community_crawl_run_preview: {
        Args: { p_invite_code: string };
        Returns: CrawlRunPreviewRpc | null;
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
  /** Returned by the map RPCs, and by get_cafes once migration
   * 20261003092000 is applied. Absent until then, so it stays optional. */
  operating_hours?: unknown;
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

/** What `get_public_profile` returns. No scores, buckets or ranking ever
 * arrive here (nook-supabase docs/PUBLIC_PROFILE.md). Older deployments also
 * return `top_cafes`; it is ignored, and newer ones leave it out. */
export type PublicProfileRpc = {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  joined_at: string;
  highlights_public: boolean;
  is_self: boolean;
  counts: { reviews: number; ranked: number | null; cups: number | null };
  photos: {
    id: string;
    cafe_id: string;
    cafe_name: string;
    cafe_area: string | null;
    image_url: string;
    drink_name: string | null;
    /** The owner's note on the photo. Absent before the photo-notes
     * migration. */
    caption?: string | null;
    taken_at: string;
    pin_order: number | null;
  }[];
  reviews: {
    id: string;
    cafe_id: string;
    cafe_name: string;
    cafe_area: string | null;
    cafe_image_url: string | null;
    rating: number;
    content: string | null;
    image_urls: string[] | null;
    created_at: string;
  }[];
};

/** What `get_community_crawl` returns (`_community_crawl_json`). It also
 * carries the crawl uuid, stop ids and `is_creator`; the web page renders
 * none of those. */
export type CommunityCrawlRpc = {
  id: string;
  title: string;
  description: string | null;
  share_code: string;
  visibility: "private" | "link";
  status: "active" | "archived" | "removed";
  stop_count: number;
  created_at: string;
  is_creator: boolean;
  creator: { username: string | null; avatar_url: string | null } | null;
  stops: {
    stop_id: string;
    stop_order: number;
    cafe_id: string;
    name: string;
    neighborhood: string | null;
    featured_image_url: string | null;
    lat: number | null;
    lng: number | null;
  }[];
  runs_started: number;
  completions: number;
};

/** What `get_community_crawl_run_preview` returns. */
export type CrawlRunPreviewRpc = {
  title: string;
  share_code: string;
  stop_count: number;
  planned_for: string | null;
  crew_size: number;
  crew_limit: number;
  starter_username: string | null;
  starter_avatar_url: string | null;
};
