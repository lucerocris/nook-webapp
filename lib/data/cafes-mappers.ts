import type { CafeRpcRow, MenuItemRpcRow } from "@/lib/supabase/types";

export type CafeSummary = {
  id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  coverImage: string | null;
  photoUrls: string[];
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  isFavorited: boolean;
  tags: string[];
  lat: number | null;
  lng: number | null;
  distanceMeters: number | null;
};

export type Tag = {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  isFeatured: boolean;
};

export type MenuItemVariant = {
  id: string;
  label: string;
  priceOverride: number | null;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  cafeId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isHighlight: boolean;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  variants: MenuItemVariant[];
};

export type Review = {
  id: string;
  cafeId: string;
  userId: string;
  rating: number;
  content: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  helpfulCount: number;
  moderationStatus: "visible" | "hidden" | "removed";
  authorName: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
};

export type CafeDetails = {
  id: string;
  createdAt: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  lat: number;
  lng: number;
  featuredImageUrl: string | null;
  logoUrl: string | null;
  photoUrls: string[];
  rating: number;
  reviewCount: number;
  isNew: boolean;
  operatingHours: CafeSummary["address"] extends string ? unknown : unknown;
  socialLinks: unknown;
  status: "draft" | "active" | "inactive";
  isClaimed: boolean;
  tags: Tag[];
  reviews: Review[];
};

type RawCafeTagJoin = {
  is_featured: boolean | null;
  tags:
    | {
        id: string;
        name: string;
        category: string;
        created_at: string;
      }
    | {
        id: string;
        name: string;
        category: string;
        created_at: string;
      }[]
    | null;
};

type RawReviewRow = {
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
  profile:
    | {
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
      }
    | {
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
};

type RawCafeDetailsRow = {
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
  operating_hours: unknown;
  social_links: unknown;
  status: "draft" | "active" | "inactive";
  is_claimed: boolean;
  cafe_tags: RawCafeTagJoin[] | null;
  reviews?: RawReviewRow[] | null;
};

export function mapCafeSummary(row: CafeRpcRow): CafeSummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    coverImage: row.featured_image_url,
    photoUrls: row.photo_urls ?? [],
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    isNew: row.is_new ?? false,
    isFeatured: row.is_featured ?? false,
    isFavorited: row.is_favorited ?? false,
    tags: (row.tags ?? []).map((tag) => tag.name),
    lat: row.lat,
    lng: row.lng,
    distanceMeters: row.distance_meters,
  };
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function mapTag(join: RawCafeTagJoin): Tag | null {
  const tag = asArray(join.tags)[0];
  if (!tag) return null;
  return {
    id: tag.id,
    name: tag.name,
    category: tag.category,
    createdAt: tag.created_at,
    isFeatured: join.is_featured ?? false,
  };
}

function mapReview(row: RawReviewRow): Review {
  const profile = asArray(row.profile)[0];
  return {
    id: row.id,
    cafeId: row.cafe_id,
    userId: row.user_id,
    rating: row.rating,
    content: row.content,
    imageUrls: row.image_urls ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    helpfulCount: row.helpful_count,
    moderationStatus: row.moderation_status,
    authorName: profile?.full_name ?? profile?.username ?? "Anonymous",
    authorUsername: profile?.username ?? null,
    authorAvatarUrl: profile?.avatar_url ?? null,
  };
}

export function mapCafeDetails(row: RawCafeDetailsRow): CafeDetails {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    description: row.description,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    featuredImageUrl: row.featured_image_url,
    logoUrl: row.logo_url,
    photoUrls: row.photo_urls ?? [],
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    isNew: row.is_new ?? false,
    operatingHours: row.operating_hours,
    socialLinks: row.social_links,
    status: row.status,
    isClaimed: row.is_claimed,
    tags: (row.cafe_tags ?? [])
      .map(mapTag)
      .filter((tag): tag is Tag => tag !== null),
    reviews: (row.reviews ?? []).map(mapReview),
  };
}

export function mapMenuItem(row: MenuItemRpcRow): MenuItem {
  return {
    id: row.id,
    cafeId: row.cafe_id,
    name: row.name,
    price: row.price,
    imageUrl: row.image_url,
    isHighlight: row.is_highlight ?? false,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name,
    variants: (row.variants ?? []).map((variant) => ({
      id: variant.id,
      label: variant.label,
      priceOverride: variant.price_override,
      priceModifier: variant.price_modifier,
      isDefault: variant.is_default ?? false,
      sortOrder: variant.sort_order ?? 0,
    })),
  };
}
