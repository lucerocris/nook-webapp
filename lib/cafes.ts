export type Cafe = {
  slug: string;
  name: string;
  area: string;
  address: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  price: string;
  image: string;
  gallery: string[];
  tags: string[];
  menu: {
    name: string;
    price: string;
    image: string;
  }[];
  description: string;
  amenities: string[];
  hours: string;
  locationNote: string;
  reviews: {
    name: string;
    date: string;
    text: string;
    rating: number;
  }[];
};

const latteImage =
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80";

export const cafes: Cafe[] = [
  {
    slug: "tadaima-inner-sunset",
    name: "Tadaima - Inner Sunset",
    area: "San Francisco, CA",
    address: "San Francisco, CA 94122",
    distance: "2.1 km",
    rating: 4.9,
    reviewsCount: 32,
    price: "$",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Student Friendly", "High-speed WiFi"],
    menu: [
      { name: "Iced Spanish Latte", price: "P150.00", image: latteImage },
      { name: "Iced Spanish Latte", price: "P150.00", image: latteImage },
      { name: "Iced Spanish Latte", price: "P150.00", image: latteImage },
      { name: "Iced Spanish Latte", price: "P150.00", image: latteImage },
    ],
    description:
      "A refined retreat in the heart of Tayud, Liloan. Cafe Summit Galleria blends contemporary elegance with warm hospitality, featuring plush seating, polished interiors, and ambient lighting.",
    amenities: [
      "Free WiFi",
      "Free WiFi",
      "Free WiFi",
      "Free WiFi",
      "Power Method",
      "Free WiFi",
      "Free WiFi",
      "Free WiFi",
    ],
    hours: "7:00 AM - 10:00 PM",
    locationNote: "Somewhere down the road",
    reviews: [
      {
        name: "angel",
        date: "May 23, 2024",
        text: "Best tambayan and so so nice jud better!",
        rating: 4,
      },
      {
        name: "angel",
        date: "May 23, 2024",
        text: "Best tambayan and so so nice jud better!",
        rating: 4,
      },
      {
        name: "angel",
        date: "May 23, 2024",
        text: "Best tambayan and so so nice jud better!",
        rating: 4,
      },
      {
        name: "angel",
        date: "May 23, 2024",
        text: "Best tambayan and so so nice jud better!",
        rating: 4,
      },
    ],
  },
  {
    slug: "coffee-madness-tayud",
    name: "Coffee Madness",
    area: "Tayud, Liloan",
    address: "Tayud, Liloan, Cebu",
    distance: "3.4 km",
    rating: 4.8,
    reviewsCount: 21,
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1461988625982-7e46a099bf4f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Outlets", "Quiet"],
    menu: [
      { name: "Cold Brew", price: "P140.00", image: latteImage },
      { name: "Cappuccino", price: "P135.00", image: latteImage },
      { name: "Mocha Latte", price: "P155.00", image: latteImage },
      { name: "Americano", price: "P120.00", image: latteImage },
    ],
    description:
      "A hillside coffee stop with cozy corners, steady Wi-Fi, and enough outlets for long study sessions or relaxed weekend catchups.",
    amenities: ["Free WiFi", "Outlets", "Quiet", "Parking", "Aircon", "Outdoor Seats"],
    hours: "8:00 AM - 9:00 PM",
    locationNote: "Near the main road",
    reviews: [
      {
        name: "mika",
        date: "June 2, 2024",
        text: "Cozy place and reliable Wi-Fi.",
        rating: 5,
      },
      {
        name: "renz",
        date: "May 18, 2024",
        text: "Good coffee and peaceful tables.",
        rating: 4,
      },
    ],
  },
];

export function getCafe(slug: string) {
  return cafes.find((cafe) => cafe.slug === slug);
}
