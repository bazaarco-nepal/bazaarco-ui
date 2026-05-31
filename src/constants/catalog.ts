import type { Product, Seller, Category } from "@/types";

/* ============================================================
   BazaarCo — Catalog data (realistic Nepali products, Rs. prices)
   ============================================================ */
export const CATEGORIES = [
  { id: "fashion",     en: "Fashion",        ne: "पोशाक",          icon: "shirt",    tint: "red",     img: "https://picsum.photos/seed/cat-fashion/300/300" },
  { id: "home",        en: "Home & Living",  ne: "घरायसी",         icon: "home",     tint: "blue",    img: "https://picsum.photos/seed/cat-home/300/300" },
  { id: "handicraft",  en: "Handicrafts",    ne: "हस्तकला",        icon: "palette",  tint: "saffron", img: "https://picsum.photos/seed/cat-handicraft/300/300" },
  { id: "beauty",      en: "Beauty",         ne: "सौन्दर्य",        icon: "sparkles", tint: "purple",  img: "https://picsum.photos/seed/cat-beauty/300/300" },
  { id: "electronics", en: "Electronics",    ne: "इलेक्ट्रोनिक्स",  icon: "phone",    tint: "slate",   img: "https://picsum.photos/seed/cat-electronics/300/300" },
  { id: "grocery",     en: "Groceries",      ne: "किराना",         icon: "basket",   tint: "green",   img: "https://picsum.photos/seed/cat-grocery/300/300" },
  { id: "books",       en: "Books",          ne: "किताब",          icon: "book",     tint: "gold",    img: "https://picsum.photos/seed/cat-books/300/300" },
  { id: "sports",      en: "Sports",         ne: "खेलकुद",         icon: "dumbbell", tint: "teal",    img: "https://picsum.photos/seed/cat-sports/300/300" },
];

/* ============================================================
   Category-specific listing attributes (seller Add-product)
   Field shape: { k:key, en, ne, t:type, req?:mandatory,
                  o?:options[], u?:unit, help? }
   types: "select" | "multi" | "text" | "num" | "toggle" | "date"
   `req` fields drive the "missing detail" warning in Add-product.
   Options stay English (sizes/standards/proper nouns); labels bilingual.
   ============================================================ */
export const ATTR_CATEGORIES = [
  { id: "clothing",    en: "Fashion & Clothing", ne: "लुगाफाटा",        icon: "shirt" },
  { id: "footwear",    en: "Shoes & Footwear",   ne: "जुत्ता",          icon: "tag" },
  { id: "beauty",      en: "Beauty & Cosmetics", ne: "सौन्दर्य",        icon: "sparkles" },
  { id: "electronics", en: "Electronics",        ne: "इलेक्ट्रोनिक्स",  icon: "phone" },
  { id: "accessories", en: "Accessories",        ne: "सहायक सामान",     icon: "watch" },
  { id: "home",        en: "Home & Kitchen",     ne: "घर र भान्सा",     icon: "home" },
  { id: "furniture",   en: "Furniture",          ne: "फर्निचर",        icon: "home" },
  { id: "grocery",     en: "Groceries",          ne: "किराना",         icon: "basket" },
  { id: "books",       en: "Books & Stationery", ne: "किताब र स्टेसनरी", icon: "book" },
  { id: "handicraft",  en: "Nepali Handmade",    ne: "नेपाली हस्तकला",  icon: "palette" },
  { id: "baby",        en: "Baby Products",      ne: "बच्चाका सामान",   icon: "sparkles" },
  { id: "sports",      en: "Sports & Fitness",   ne: "खेलकुद",         icon: "dumbbell" },
];

export const CATEGORY_ATTRIBUTES = {
  clothing: [
    { k: "department", en: "For whom", ne: "कसको लागि", t: "select", req: true, o: ["Men", "Women", "Kids", "Unisex"] },
    { k: "size", en: "Size", ne: "साइज", t: "multi", req: true, o: ["XS", "S", "M", "L", "XL", "XXL", "Free size"] },
    { k: "sizeFormat", en: "Size standard", ne: "साइज मानक", t: "select", o: ["IND", "UK", "US", "EU"] },
    { k: "color", en: "Colour", ne: "रङ", t: "multi", req: true, o: ["Black", "White", "Red", "Blue", "Green", "Maroon", "Beige", "Grey", "Yellow", "Pink", "Multi"] },
    { k: "fabric", en: "Fabric", ne: "कपडा", t: "select", req: true, o: ["Cotton", "Silk", "Pashmina", "Wool", "Polyester", "Denim", "Linen", "Hemp/Allo"] },
    { k: "fit", en: "Fit", ne: "फिट", t: "select", o: ["Slim", "Regular", "Relaxed", "Oversized"] },
    { k: "sleeve", en: "Sleeve", ne: "बाहुला", t: "select", o: ["Short", "Long", "Sleeveless", "3/4 sleeve"] },
    { k: "pattern", en: "Pattern", ne: "बुट्टा", t: "select", o: ["Solid", "Striped", "Floral", "Checked", "Printed"] },
    { k: "occasion", en: "Occasion", ne: "अवसर", t: "select", o: ["Casual", "Formal", "Party", "Office", "Festive"] },
    { k: "care", en: "Wash care", ne: "धुने तरिका", t: "select", o: ["Machine wash", "Hand wash", "Dry clean"] },
    { k: "season", en: "Season", ne: "मौसम", t: "select", o: ["Summer", "Winter", "Spring", "Autumn", "All season"] },
  ],
  footwear: [
    { k: "department", en: "For whom", ne: "कसको लागि", t: "select", req: true, o: ["Men", "Women", "Kids", "Unisex"] },
    { k: "size", en: "Size", ne: "साइज", t: "multi", req: true, o: ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44"] },
    { k: "sizeFormat", en: "Size standard", ne: "साइज मानक", t: "select", o: ["UK", "US", "EU", "CM"] },
    { k: "color", en: "Colour", ne: "रङ", t: "multi", req: true, o: ["Black", "White", "Brown", "Tan", "Blue", "Grey", "Red", "Multi"] },
    { k: "upper", en: "Upper material", ne: "माथिल्लो सामग्री", t: "select", req: true, o: ["Leather", "Suede", "Mesh", "Canvas", "Synthetic"] },
    { k: "sole", en: "Sole material", ne: "सोल सामग्री", t: "select", o: ["Rubber", "EVA", "Leather", "PU", "Synthetic"] },
    { k: "closure", en: "Closure", ne: "बन्द गर्ने", t: "select", o: ["Lace-up", "Slip-on", "Buckle", "Zipper", "Velcro"] },
    { k: "heel", en: "Heel height", ne: "हिल उचाइ", t: "select", o: ["Flat (0–2cm)", "Low (2–5cm)", "Medium (5–7cm)", "High (7cm+)"] },
    { k: "occasion", en: "Occasion", ne: "अवसर", t: "select", o: ["Casual", "Sports", "Formal", "Hiking", "Party"] },
    { k: "water", en: "Water resistance", ne: "पानी प्रतिरोध", t: "select", o: ["Waterproof", "Water-resistant", "Not waterproof"] },
  ],
  beauty: [
    { k: "type", en: "Product type", ne: "प्रकार", t: "select", req: true, o: ["Skincare", "Makeup", "Hair care", "Fragrance", "Personal care"] },
    { k: "volume", en: "Net volume / weight", ne: "मात्रा / तौल", t: "text", req: true, u: "ml / g", help: "Needed for delivery cost." },
    { k: "expiry", en: "Expiry / best before", ne: "म्याद सकिने मिति", t: "date", req: true, help: "Required for anything applied to skin." },
    { k: "skinType", en: "Skin type", ne: "छालाको प्रकार", t: "select", o: ["Normal", "Dry", "Oily", "Combination", "Sensitive", "All"] },
    { k: "form", en: "Form", ne: "रूप", t: "select", o: ["Liquid", "Cream", "Powder", "Gel", "Stick", "Spray"] },
    { k: "spf", en: "SPF", ne: "एसपीएफ", t: "text", help: "Leave blank if none." },
    { k: "ingredients", en: "Key ingredients", ne: "मुख्य सामग्री", t: "text", req: true, help: "List main ingredients — buyers with allergies check this." },
    { k: "crueltyFree", en: "Cruelty-free / vegan", ne: "क्रुअल्टी-फ्री", t: "toggle" },
    { k: "benefits", en: "Benefits", ne: "फाइदा", t: "multi", o: ["Hydrating", "Anti-aging", "Brightening", "Oil-control", "Soothing"] },
  ],
  electronics: [
    { k: "brand", en: "Brand & model", ne: "ब्रान्ड र मोडेल", t: "text", req: true },
    { k: "color", en: "Colour", ne: "रङ", t: "select", o: ["Black", "White", "Silver", "Blue", "Gold", "Grey"] },
    { k: "ram", en: "RAM", ne: "र्‍याम", t: "select", o: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "N/A"] },
    { k: "storage", en: "Storage", ne: "भण्डारण", t: "select", o: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "N/A"] },
    { k: "display", en: "Display size", ne: "स्क्रिन साइज", t: "text", help: "e.g. 6.5 inch AMOLED" },
    { k: "os", en: "Operating system", ne: "अपरेटिङ सिस्टम", t: "text", help: "e.g. Android 14, iOS 18" },
    { k: "battery", en: "Battery", ne: "ब्याट्री", t: "text", u: "mAh" },
    { k: "connectivity", en: "Connectivity", ne: "कनेक्टिभिटी", t: "multi", o: ["5G", "4G", "Wi-Fi", "Bluetooth", "NFC"] },
    { k: "warranty", en: "Warranty", ne: "वारेन्टी", t: "select", req: true, o: ["No warranty", "3 months", "6 months", "1 year", "2 years"], help: "Big trust signal — buyers fear fakes." },
    { k: "inBox", en: "What's in the box", ne: "बक्समा के छ", t: "text", help: "e.g. Charger, cable, earphones" },
  ],
  accessories: [
    { k: "type", en: "Type", ne: "प्रकार", t: "select", req: true, o: ["Watch", "Bag", "Sunglasses", "Belt", "Hat", "Jewellery", "Scarf"] },
    { k: "material", en: "Main material", ne: "मुख्य सामग्री", t: "select", req: true, o: ["Leather", "Metal", "Plastic", "Acetate", "Fabric", "Wood"] },
    { k: "color", en: "Colour", ne: "रङ", t: "multi", o: ["Black", "Brown", "Gold", "Silver", "Tan", "Multi"] },
    { k: "dimensions", en: "Size (L×W×H)", ne: "नाप", t: "text", help: "For bags & boxes." },
    { k: "movement", en: "Watch movement", ne: "घडी मुभमेन्ट", t: "select", o: ["Quartz", "Automatic", "Mechanical", "Digital", "N/A"] },
    { k: "uv", en: "UV protection", ne: "यूभी सुरक्षा", t: "select", o: ["UV400", "Polarised", "Anti-glare", "None", "N/A"] },
    { k: "adjustable", en: "Adjustable", ne: "समायोजन योग्य", t: "toggle" },
  ],
  home: [
    { k: "type", en: "Product type", ne: "प्रकार", t: "select", req: true, o: ["Cookware", "Bakeware", "Dinnerware", "Storage", "Cleaning", "Decor"] },
    { k: "material", en: "Material", ne: "सामग्री", t: "select", req: true, o: ["Stainless steel", "Cast iron", "Glass", "Ceramic", "Plastic", "Silicone", "Wood", "Brass", "Copper"] },
    { k: "dimensions", en: "Size (L×W×H)", ne: "नाप", t: "text" },
    { k: "capacity", en: "Capacity", ne: "क्षमता", t: "text", u: "litre / ml" },
    { k: "color", en: "Colour", ne: "रङ", t: "select", o: ["Silver", "Black", "White", "Gold", "Multi"] },
    { k: "care", en: "Care", ne: "हेरचाह", t: "multi", o: ["Dishwasher safe", "Hand wash", "Microwave safe", "Oven safe"] },
    { k: "compat", en: "Works with (cookware)", ne: "मिल्ने चुलो", t: "multi", o: ["Gas", "Induction", "Ceramic", "Halogen"] },
    { k: "setPieces", en: "Pieces in set", ne: "सेटका टुक्रा", t: "num" },
  ],
  furniture: [
    { k: "room", en: "Room", ne: "कोठा", t: "select", req: true, o: ["Living room", "Bedroom", "Dining", "Office", "Outdoor"] },
    { k: "type", en: "Type", ne: "प्रकार", t: "select", req: true, o: ["Sofa", "Chair", "Table", "Bed", "Cabinet", "Shelf"] },
    { k: "material", en: "Main material", ne: "मुख्य सामग्री", t: "select", req: true, o: ["Solid wood", "Engineered wood", "Metal", "Glass", "Rattan", "Fabric"] },
    { k: "dimensions", en: "Size (W×D×H)", ne: "नाप", t: "text", req: true, u: "cm" },
    { k: "color", en: "Colour / finish", ne: "रङ / फिनिश", t: "text" },
    { k: "assembly", en: "Needs assembly", ne: "जोड्नुपर्ने", t: "toggle" },
    { k: "wallFix", en: "Must fix to wall", ne: "भित्तामा कस्नुपर्ने", t: "toggle", help: "Show for tall cabinets/shelves — safety." },
    { k: "weightCap", en: "Weight it can hold", ne: "थेग्ने तौल", t: "text", u: "kg" },
  ],
  grocery: [
    { k: "foodType", en: "Food type", ne: "खानाको प्रकार", t: "select", req: true, o: ["Staples", "Snacks", "Beverages", "Dairy", "Spices", "Oil & ghee"] },
    { k: "brand", en: "Brand", ne: "ब्रान्ड", t: "text" },
    { k: "weight", en: "Net weight / volume", ne: "तौल / मात्रा", t: "text", req: true, u: "kg / g / L / ml" },
    { k: "mfgDate", en: "Made on", ne: "उत्पादन मिति", t: "date", req: true },
    { k: "expiry", en: "Best before / expiry", ne: "म्याद", t: "date", req: true },
    { k: "storage", en: "How to store", ne: "भण्डारण", t: "select", o: ["Cool & dry place", "Refrigerate", "Refrigerate after opening"] },
    { k: "ingredients", en: "Ingredients", ne: "सामग्री", t: "text", req: true, help: "Mark major allergens." },
    { k: "diet", en: "Dietary", ne: "आहार", t: "multi", o: ["Organic", "Gluten-free", "Sugar-free", "Vegan"] },
    { k: "origin", en: "Country of origin", ne: "उत्पादन देश", t: "text", help: "Needed for imported goods." },
    { k: "license", en: "Food licence no.", ne: "खाद्य इजाजत नं.", t: "text", help: "Required to sell packaged food in Nepal." },
  ],
  books: [
    { k: "type", en: "Type", ne: "प्रकार", t: "select", req: true, o: ["Book", "Notebook", "Pen", "Art supply", "Office supply"] },
    { k: "title", en: "Title", ne: "शीर्षक", t: "text", help: "For books." },
    { k: "author", en: "Author", ne: "लेखक", t: "text" },
    { k: "publisher", en: "Publisher", ne: "प्रकाशक", t: "text" },
    { k: "language", en: "Language", ne: "भाषा", t: "select", o: ["Nepali", "English", "Hindi", "Maithili", "Newari", "Other"] },
    { k: "isbn", en: "ISBN", ne: "आईएसबीएन", t: "text", help: "Required for books (10 or 13 digit)." },
    { k: "format", en: "Format", ne: "ढाँचा", t: "select", o: ["Paperback", "Hardcover", "eBook", "Audiobook"] },
    { k: "pages", en: "Pages", ne: "पृष्ठ", t: "num" },
    { k: "genre", en: "Genre / subject", ne: "विधा", t: "select", o: ["Fiction", "Non-fiction", "Biography", "Academic", "Children's", "Cookbook"] },
  ],
  handicraft: [
    { k: "craft", en: "Craft type", ne: "शिल्प प्रकार", t: "select", req: true, o: ["Pashmina / wool", "Lokta paper", "Pottery", "Wood carving", "Metal craft", "Thangka painting"] },
    { k: "material", en: "Main material", ne: "मुख्य सामग्री", t: "select", req: true, o: ["Wool", "Lokta fibre", "Clay", "Wood", "Brass", "Cotton"] },
    { k: "handmade", en: "Fully handmade", ne: "पूर्ण हस्तनिर्मित", t: "toggle", req: true },
    { k: "method", en: "How it's made", ne: "बनाउने तरिका", t: "select", o: ["Hand-woven", "Hand-knotted", "Hand-carved", "Hand-painted", "Hand-thrown"] },
    { k: "community", en: "Made in (district)", ne: "बनेको जिल्ला", t: "text", req: true, help: "e.g. Bhaktapur, Pokhara — buyers love local origin." },
    { k: "story", en: "Artisan story", ne: "कालिगढको कथा", t: "text", help: "A line about the maker builds trust." },
    { k: "dye", en: "Dye", ne: "रङ", t: "select", o: ["Natural dye", "Chemical dye"] },
    { k: "leadTime", en: "Days to make (custom)", ne: "बनाउन लाग्ने दिन", t: "num", help: "For made-to-order items." },
  ],
  baby: [
    { k: "type", en: "Product type", ne: "प्रकार", t: "select", req: true, o: ["Diapers", "Feeding bottle", "Baby gear", "Clothing", "Toys", "Skincare"] },
    { k: "ageRange", en: "Baby age", ne: "बच्चाको उमेर", t: "select", req: true, o: ["Newborn (0–3m)", "3–6m", "6–12m", "12–18m", "18–24m", "2–4 yr"] },
    { k: "material", en: "Material", ne: "सामग्री", t: "select", o: ["Cotton", "Silicone", "BPA-free plastic", "Wood", "Fabric"] },
    { k: "safetyCert", en: "Safety certificate", ne: "सुरक्षा प्रमाणपत्र", t: "text", req: true, help: "BIS / ISO / CE — required for child safety." },
    { k: "bpaFree", en: "BPA-free", ne: "बीपीए-मुक्त", t: "toggle" },
    { k: "hypoallergenic", en: "Hypoallergenic", ne: "एलर्जी-रहित", t: "toggle" },
    { k: "care", en: "Cleaning", ne: "सफा गर्ने", t: "select", o: ["Machine wash gentle", "Sterilise", "Hand wash"] },
  ],
  sports: [
    { k: "activity", en: "Sport / activity", ne: "खेल", t: "select", req: true, o: ["Football", "Cricket", "Basketball", "Yoga", "Running", "Gym", "Swimming", "Trekking"] },
    { k: "type", en: "Type", ne: "प्रकार", t: "select", req: true, o: ["Ball", "Shoes", "Clothing", "Racket", "Mat", "Weights", "Bottle", "Tracker"] },
    { k: "gender", en: "For whom", ne: "कसको लागि", t: "select", o: ["Men", "Women", "Unisex", "Kids"] },
    { k: "size", en: "Size / weight", ne: "साइज / तौल", t: "text", help: "e.g. 5kg dumbbell, Size 5 ball" },
    { k: "material", en: "Material", ne: "सामग्री", t: "select", o: ["Leather", "Synthetic", "Rubber", "Cotton", "Nylon", "Neoprene", "EVA"] },
    { k: "brand", en: "Brand", ne: "ब्रान्ड", t: "text" },
    { k: "skill", en: "Skill level", ne: "स्तर", t: "select", o: ["Beginner", "Intermediate", "Advanced", "Professional"] },
    { k: "warranty", en: "Warranty (equipment)", ne: "वारेन्टी", t: "select", o: ["No warranty", "6 months", "1 year", "2 years"] },
  ],
};

export const SELLERS = {
  himalayan: { id: "himalayan", name: "Himalayan Handlooms", verified: true, rating: 4.8, reviews: 1240, city: "Bhaktapur", tint: "red", avatar: "https://picsum.photos/seed/seller-himalayan/200/200" },
  thimi: { id: "thimi", name: "Thimi Pottery Works", verified: true, rating: 4.7, reviews: 860, city: "Madhyapur Thimi", tint: "saffron", avatar: "https://picsum.photos/seed/seller-thimi/200/200" },
  pokhara: { id: "pokhara", name: "Pokhara Naturals", verified: true, rating: 4.9, reviews: 2110, city: "Pokhara", tint: "green", avatar: "https://picsum.photos/seed/seller-pokhara/200/200" },
  stylenp: { id: "stylenp", name: "StyleByNepal", verified: true, rating: 4.8, reviews: 1180, city: "Kathmandu", tint: "blue", avatar: "https://picsum.photos/seed/seller-stylenp/200/200" },
  everest: { id: "everest", name: "Everest Gear Co.", verified: false, rating: 4.5, reviews: 430, city: "Kathmandu", tint: "slate", avatar: "https://picsum.photos/seed/seller-everest/200/200" },
  lumbini: { id: "lumbini", name: "Lumbini Crafts", verified: true, rating: 4.6, reviews: 720, city: "Lumbini", tint: "gold", avatar: "https://picsum.photos/seed/seller-lumbini/200/200" },
};

let _id = 0;
export const P = (o) => ({ id: "bz-" + (++_id), reviews: 120, rating: 4.6, ...o });

export const PRODUCTS = [
  P({ name: "Handmade Pashmina Shawl", ne: "हस्तनिर्मित पस्मिना", price: 2450, original: 3200, cat: "fashion", seller: "himalayan", icon: "shirt", tint: "red", rating: 4.8, reviews: 248, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-pashmina/400/600", eta: "Sat, May 30", tag: "Bestseller", img: "https://picsum.photos/seed/pashmina/600/600" }),
  P({ name: "Thimi Ceramic Tea Set", ne: "माटोको चिया सेट", price: 1800, original: 2400, cat: "home", seller: "thimi", icon: "bowl", tint: "saffron", rating: 4.7, reviews: 132, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-ceramic/400/600", eta: "Sun, May 31", img: "https://picsum.photos/seed/ceramic/600/600" }),
  P({ name: "Tibetan Singing Bowl", ne: "गाउने कचौरा", price: 2900, cat: "handicraft", seller: "lumbini", icon: "bowl", tint: "gold", rating: 4.9, reviews: 410, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-bowl/400/600", eta: "Mon, Jun 1", lowStock: 3, img: "https://picsum.photos/seed/bowl/600/600" }),
  P({ name: "Lokta Paper Journal", ne: "लोक्ता कागज डायरी", price: 650, original: 850, cat: "books", seller: "lumbini", icon: "book", tint: "gold", rating: 4.6, reviews: 96, eta: "Sat, May 30", img: "https://picsum.photos/seed/journal/600/600" }),
  P({ name: "Dhaka Topi — Classic", ne: "ढाका टोपी", price: 850, cat: "fashion", seller: "himalayan", icon: "shirt", tint: "blue", rating: 4.7, reviews: 188, eta: "Sat, May 30", img: "https://picsum.photos/seed/topi/600/600" }),
  P({ name: "Himalayan Wool Socks (3 pk)", ne: "ऊनी मोजा", price: 450, original: 600, cat: "fashion", seller: "everest", icon: "shirt", tint: "slate", rating: 4.5, reviews: 312, eta: "Sun, May 31", img: "https://picsum.photos/seed/socks/600/600" }),
  P({ name: "Allo Nettle Fibre Scarf", ne: "अल्लोको स्कार्फ", price: 1200, cat: "handicraft", seller: "himalayan", icon: "palette", tint: "green", rating: 4.8, reviews: 74, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-scarf/400/600", eta: "Mon, Jun 1", img: "https://picsum.photos/seed/scarf/600/600" }),
  P({ name: "Wild Mountain Honey 500g", ne: "जंगली मह", price: 720, cat: "grocery", seller: "pokhara", icon: "leaf", tint: "gold", rating: 4.9, reviews: 520, eta: "Sat, May 30", tag: "Made in Nepal", img: "https://picsum.photos/seed/honey/600/600" }),
  P({ name: "Hemp Crossbody Backpack", ne: "भांगो ब्याग", price: 1650, original: 2100, cat: "fashion", seller: "stylenp", icon: "tag", tint: "green", rating: 4.6, reviews: 143, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-backpack/400/600", eta: "Sun, May 31", img: "https://picsum.photos/seed/backpack/600/600" }),
  P({ name: "Handcrafted Khukuri (decor)", ne: "खुकुरी", price: 3200, cat: "handicraft", seller: "everest", icon: "palette", tint: "red", rating: 4.7, reviews: 89, eta: "Wed, Jun 3", img: "https://picsum.photos/seed/khukuri/600/600" }),
  P({ name: "Yak Cheese Wheel 250g", ne: "याक चीज", price: 980, cat: "grocery", seller: "pokhara", icon: "leaf", tint: "saffron", rating: 4.7, reviews: 167, eta: "Sat, May 30", img: "https://picsum.photos/seed/cheese/600/600" }),
  P({ name: "Thanka Painting — Mandala", ne: "थान्का चित्र", price: 5500, original: 7000, cat: "handicraft", seller: "lumbini", icon: "palette", tint: "purple", rating: 4.9, reviews: 58, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-thanka/400/600", eta: "Fri, Jun 5", tag: "Premium", img: "https://picsum.photos/seed/thanka/600/600" }),
  P({ name: "Organic Argan Hair Serum", ne: "आर्गन सिरम", price: 1250, original: 1600, cat: "beauty", seller: "pokhara", icon: "sparkles", tint: "purple", rating: 4.6, reviews: 204, eta: "Sun, May 31", img: "https://picsum.photos/seed/serum/600/600" }),
  P({ name: "Polarised Sunglasses", ne: "चस्मा", price: 1450, original: 1900, cat: "fashion", seller: "stylenp", icon: "tag", tint: "slate", rating: 4.5, reviews: 276, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-sunglasses/400/600", eta: "Sun, May 31", img: "https://picsum.photos/seed/sunglasses/600/600" }),
  P({ name: "Everyday Canvas Sneakers", ne: "स्निकर्स", price: 2100, original: 2800, cat: "fashion", seller: "stylenp", icon: "tag", tint: "blue", rating: 4.6, reviews: 388, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-sneakers/400/600", eta: "Mon, Jun 1", tag: "Trending", img: "https://picsum.photos/seed/sneakers/600/600" }),
  P({ name: "Brass Diyo Oil Lamp (pair)", ne: "पित्तलको दियो", price: 1350, cat: "home", seller: "thimi", icon: "home", tint: "gold", rating: 4.8, reviews: 112, eta: "Tue, Jun 2", img: "https://picsum.photos/seed/diyo/600/600" }),
  P({ name: "Bluetooth Earbuds Pro", ne: "इयरबड्स", price: 2990, original: 4200, cat: "electronics", seller: "everest", icon: "phone", tint: "slate", rating: 4.4, reviews: 642, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-earbuds/400/600", eta: "Sun, May 31", tag: "Flash", img: "https://picsum.photos/seed/earbuds/600/600" }),
  P({ name: "Stainless Steel Water Bottle", ne: "पानी बोतल", price: 780, original: 1050, cat: "sports", seller: "everest", icon: "dumbbell", tint: "teal", rating: 4.5, reviews: 198, eta: "Sun, May 31", img: "https://picsum.photos/seed/bottle/600/600" }),
  P({ name: "Leather Sling Bag", ne: "छालाको झोला", price: 2350, original: 3100, cat: "fashion", seller: "stylenp", icon: "tag", tint: "saffron", rating: 4.7, reviews: 156, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-slingbag/400/600", eta: "Mon, Jun 1", img: "https://picsum.photos/seed/slingbag/600/600" }),
  P({ name: "Felt Wool Slippers", ne: "ऊनी चप्पल", price: 690, cat: "fashion", seller: "himalayan", icon: "shirt", tint: "red", rating: 4.6, reviews: 221, eta: "Sat, May 30", img: "https://picsum.photos/seed/slippers/600/600" }),
  P({ name: "Ceramic Planter — Glazed", ne: "गमला", price: 920, original: 1200, cat: "home", seller: "thimi", icon: "home", tint: "teal", rating: 4.7, reviews: 87, eta: "Tue, Jun 2", img: "https://picsum.photos/seed/planter/600/600" }),
  P({ name: "Himalayan Herbal Soap (4 pk)", ne: "जडिबुटी साबुन", price: 540, cat: "beauty", seller: "pokhara", icon: "sparkles", tint: "green", rating: 4.8, reviews: 340, eta: "Sat, May 30", img: "https://picsum.photos/seed/soap/600/600" }),
  P({ name: "Smart Fitness Watch", ne: "स्मार्ट घडी", price: 3490, original: 4990, cat: "electronics", seller: "everest", icon: "watch", tint: "blue", rating: 4.3, reviews: 415, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-watch/400/600", eta: "Sun, May 31", tag: "Flash", img: "https://picsum.photos/seed/watch/600/600" }),
  P({ name: "Handwoven Dhaka Cushion", ne: "ढाका कुसन", price: 1100, original: 1450, cat: "home", seller: "himalayan", icon: "home", tint: "red", rating: 4.7, reviews: 64, eta: "Mon, Jun 1", img: "https://picsum.photos/seed/cushion/600/600" }),
  P({ name: "Pure Mustard Oil 1L", ne: "तोरीको तेल", price: 420, cat: "grocery", seller: "pokhara", icon: "leaf", tint: "gold", rating: 4.8, reviews: 290, eta: "Sat, May 30", img: "https://picsum.photos/seed/mustardoil/600/600" }),
  P({ name: "Cotton Daura Suruwal", ne: "दौरा सुरुवाल", price: 3200, original: 3900, cat: "fashion", seller: "himalayan", icon: "shirt", tint: "blue", rating: 4.7, reviews: 78, eta: "Wed, Jun 3", tag: "Festive", img: "https://picsum.photos/seed/daura/600/600" }),
  P({ name: "Copper Water Jug 1.5L", ne: "तामाको गाग्री", price: 1480, original: 1850, cat: "home", seller: "thimi", icon: "home", tint: "saffron", rating: 4.6, reviews: 134, eta: "Tue, Jun 2", img: "https://picsum.photos/seed/copperjug/600/600" }),
  P({ name: "Nepali Tea Sampler (5 pk)", ne: "चिया सेट", price: 980, original: 1300, cat: "grocery", seller: "pokhara", icon: "leaf", tint: "green", rating: 4.9, reviews: 412, eta: "Sat, May 30", tag: "Made in Nepal", img: "https://picsum.photos/seed/teasampler/600/600" }),
  P({ name: "Woollen Pashmina Beanie", ne: "ऊनी टोपी", price: 690, cat: "fashion", seller: "everest", icon: "shirt", tint: "red", rating: 4.5, reviews: 167, eta: "Sun, May 31", img: "https://picsum.photos/seed/beanie/600/600" }),
  P({ name: "Hand-carved Wooden Mask", ne: "काठको मुकुन्डो", price: 2750, cat: "handicraft", seller: "lumbini", icon: "palette", tint: "saffron", rating: 4.7, reviews: 52, eta: "Fri, Jun 5", img: "https://picsum.photos/seed/woodmask/600/600" }),
  P({ name: "Aloe Vera Face Gel 200ml", ne: "एलोभेरा जेल", price: 560, original: 720, cat: "beauty", seller: "pokhara", icon: "sparkles", tint: "green", rating: 4.6, reviews: 233, eta: "Sun, May 31", img: "https://picsum.photos/seed/alovera/600/600" }),
  P({ name: "Portable Bluetooth Speaker", ne: "स्पिकर", price: 2290, original: 2990, cat: "electronics", seller: "everest", icon: "phone", tint: "slate", rating: 4.4, reviews: 388, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-speaker/400/600", eta: "Sun, May 31", tag: "Flash", img: "https://picsum.photos/seed/speaker/600/600" }),
  P({ name: "Yoga Mat — Anti-slip", ne: "योग म्याट", price: 1150, original: 1500, cat: "sports", seller: "everest", icon: "dumbbell", tint: "teal", rating: 4.5, reviews: 176, eta: "Mon, Jun 1", img: "https://picsum.photos/seed/yogamat/600/600" }),
  P({ name: "Folk Tales of Nepal (book)", ne: "नेपाली लोककथा", price: 480, cat: "books", seller: "lumbini", icon: "book", tint: "gold", rating: 4.7, reviews: 94, eta: "Sat, May 30", img: "https://picsum.photos/seed/folktales/600/600" }),
  P({ name: "Brass Singing Bell", ne: "पित्तलको घण्टी", price: 1650, cat: "handicraft", seller: "lumbini", icon: "palette", tint: "gold", rating: 4.8, reviews: 61, eta: "Wed, Jun 3", img: "https://picsum.photos/seed/singingbell/600/600" }),
  P({ name: "Linen Kurta — Summer", ne: "लिनेन कुर्ता", price: 1850, original: 2400, cat: "fashion", seller: "stylenp", icon: "shirt", tint: "blue", rating: 4.6, reviews: 205, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-kurta/400/600", eta: "Sun, May 31", img: "https://picsum.photos/seed/kurta/600/600" }),
  P({ name: "Ceramic Coffee Mug Set (2)", ne: "कफी मग सेट", price: 880, original: 1100, cat: "home", seller: "thimi", icon: "bowl", tint: "saffron", rating: 4.7, reviews: 118, eta: "Tue, Jun 2", img: "https://picsum.photos/seed/mugset/600/600" }),
  P({ name: "Himalayan Pink Salt 1kg", ne: "गुलाबी नुन", price: 320, cat: "grocery", seller: "pokhara", icon: "leaf", tint: "red", rating: 4.8, reviews: 367, eta: "Sat, May 30", img: "https://picsum.photos/seed/pinksalt/600/600" }),
  P({ name: "USB-C Fast Charger 30W", ne: "चार्जर", price: 1290, original: 1690, cat: "electronics", seller: "everest", icon: "phone", tint: "slate", rating: 4.3, reviews: 512, eta: "Sun, May 31", img: "https://picsum.photos/seed/charger/600/600" }),
  P({ name: "Beaded Tribal Necklace", ne: "गहना", price: 1450, cat: "fashion", seller: "stylenp", icon: "tag", tint: "purple", rating: 4.7, reviews: 89, eta: "Mon, Jun 1", img: "https://picsum.photos/seed/necklace/600/600" }),
  P({ name: "Bamboo Cutting Board", ne: "बाँसको चपिङ बोर्ड", price: 740, original: 950, cat: "home", seller: "thimi", icon: "home", tint: "green", rating: 4.6, reviews: 142, eta: "Tue, Jun 2", img: "https://picsum.photos/seed/cuttingboard/600/600" }),
  P({ name: "Trekking Day Pack 25L", ne: "ट्रेकिङ ब्याग", price: 2650, original: 3400, cat: "sports", seller: "everest", icon: "tag", tint: "blue", rating: 4.6, reviews: 224, hasVideo: true, videoThumb: "https://picsum.photos/seed/video-daypack/400/600", eta: "Mon, Jun 1", tag: "Trending", img: "https://picsum.photos/seed/daypack/600/600" }),
  P({ name: "Sandalwood Incense (50 pc)", ne: "धूप", price: 290, cat: "handicraft", seller: "lumbini", icon: "leaf", tint: "saffron", rating: 4.7, reviews: 198, eta: "Sat, May 30", img: "https://picsum.photos/seed/incense/600/600" }),
  P({ name: "Matte Lipstick — Tihar Red", ne: "लिपस्टिक", price: 650, original: 850, cat: "beauty", seller: "stylenp", icon: "sparkles", tint: "red", rating: 4.5, reviews: 276, eta: "Sun, May 31", img: "https://picsum.photos/seed/lipstick/600/600" }),
  P({ name: "Wireless Mouse — Silent", ne: "माउस", price: 890, original: 1200, cat: "electronics", seller: "everest", icon: "phone", tint: "teal", rating: 4.4, reviews: 301, eta: "Sun, May 31", img: "https://picsum.photos/seed/mouse/600/600" }),
  P({ name: "Cotton Bedsheet — Queen", ne: "तन्ना", price: 1980, original: 2600, cat: "home", seller: "himalayan", icon: "home", tint: "blue", rating: 4.7, reviews: 156, eta: "Wed, Jun 3", img: "https://picsum.photos/seed/bedsheet/600/600" }),
  P({ name: "Roasted Soybean Snack 200g", ne: "भटमास", price: 240, cat: "grocery", seller: "pokhara", icon: "leaf", tint: "gold", rating: 4.6, reviews: 188, eta: "Sat, May 30", img: "https://picsum.photos/seed/soybean/600/600" }),
  P({ name: "Leather Wallet — Bifold", ne: "वालेट", price: 1350, original: 1750, cat: "fashion", seller: "stylenp", icon: "tag", tint: "saffron", rating: 4.7, reviews: 213, eta: "Mon, Jun 1", img: "https://picsum.photos/seed/wallet/600/600" }),
  P({ name: "Kids' Story Picture Book", ne: "बाल किताब", price: 380, cat: "books", seller: "lumbini", icon: "book", tint: "red", rating: 4.8, reviews: 102, eta: "Sat, May 30", img: "https://picsum.photos/seed/kidsbook/600/600" }),
  P({ name: "Stainless Steel Lunch Box", ne: "खाजा बाकस", price: 920, original: 1200, cat: "home", seller: "thimi", icon: "home", tint: "slate", rating: 4.6, reviews: 134, eta: "Tue, Jun 2", img: "https://picsum.photos/seed/lunchbox/600/600" }),
  P({ name: "Resistance Band Set (5)", ne: "ब्यान्ड सेट", price: 850, original: 1100, cat: "sports", seller: "everest", icon: "dumbbell", tint: "purple", rating: 4.5, reviews: 167, eta: "Mon, Jun 1", img: "https://picsum.photos/seed/bands/600/600" }),
  P({ name: "Handmade Felt Coasters (6)", ne: "फेल्ट कोस्टर", price: 540, cat: "handicraft", seller: "himalayan", icon: "palette", tint: "teal", rating: 4.7, reviews: 73, eta: "Wed, Jun 3", img: "https://picsum.photos/seed/coasters/600/600" }),

  // Books — topped up so the 5-up "Customers also bought" rail and 4-up browse row fill.
  P({ name: "Everest Base Camp Trek Guide", ne: "ट्रेक गाइड किताब", price: 720, original: 950, cat: "books", seller: "lumbini", icon: "book", tint: "blue", rating: 4.7, reviews: 138, eta: "Sat, May 30", img: "https://picsum.photos/seed/trekguide/600/600" }),
  P({ name: "Learn Nepali Script Workbook", ne: "नेपाली लिपि अभ्यास", price: 350, cat: "books", seller: "lumbini", icon: "book", tint: "saffron", rating: 4.6, reviews: 84, eta: "Sat, May 30", img: "https://picsum.photos/seed/scriptbook/600/600" }),
  P({ name: "Newari Kitchen Cookbook", ne: "नेवारी भान्सा किताब", price: 890, original: 1150, cat: "books", seller: "lumbini", icon: "book", tint: "red", rating: 4.8, reviews: 112, eta: "Sun, May 31", tag: "Made in Nepal", img: "https://picsum.photos/seed/cookbook/600/600" }),

  // Beauty — topped up to fill the related rail.
  P({ name: "Yak Milk Body Butter 150g", ne: "याक दूध बडी बटर", price: 780, original: 980, cat: "beauty", seller: "pokhara", icon: "sparkles", tint: "gold", rating: 4.7, reviews: 196, eta: "Sun, May 31", img: "https://picsum.photos/seed/bodybutter/600/600" }),
  P({ name: "Bamboo Charcoal Face Wash", ne: "बाँस चारकोल फेसवास", price: 490, cat: "beauty", seller: "stylenp", icon: "sparkles", tint: "slate", rating: 4.5, reviews: 251, eta: "Sun, May 31", img: "https://picsum.photos/seed/facewash/600/600" }),

  // Sports — topped up to fill the related rail.
  P({ name: "Adjustable Dumbbell 5kg", ne: "डम्बल ५ केजी", price: 1980, original: 2500, cat: "sports", seller: "everest", icon: "dumbbell", tint: "slate", rating: 4.5, reviews: 143, eta: "Mon, Jun 1", img: "https://picsum.photos/seed/dumbbell/600/600" }),
  P({ name: "Insulated Trek Flask 750ml", ne: "ट्रेक फ्लास्क", price: 1150, original: 1450, cat: "sports", seller: "everest", icon: "dumbbell", tint: "blue", rating: 4.6, reviews: 207, eta: "Sun, May 31", img: "https://picsum.photos/seed/flask/600/600" }),
];

export const byId = (id) => PRODUCTS.find(p => p.id === id);
export const sellerOf = (p) => SELLERS[p.seller];
export const inCat = (cat) => PRODUCTS.filter(p => p.cat === cat);
export const videoProducts = () => PRODUCTS.filter(p => p.hasVideo);
export const flashProducts = () => PRODUCTS.filter(p => p.original);

// Category-aware product attributes — a book must not show "100% wool / 200×70cm / size XL".
// Each profile decides which variants, specs, and description copy make sense for its category.
const _sku = (p) => p.id.toUpperCase();
export const CATEGORY_PROFILES = {
  fashion: {
    variants: [
      { name: "Colour", kind: "swatch", options: [{ label: "Crimson", tint: "red" }, { label: "Indigo", tint: "blue" }, { label: "Charcoal", tint: "slate" }] },
      { name: "Size", kind: "pill", options: ["S", "M", "L", "XL"], default: 1 },
    ],
    specs: (p, s) => [["Material", "Hand-loomed natural fibre"], ["Fit", "Regular"], ["Origin", `Handmade in ${s.city}, Nepal`], ["Care", "Hand wash cold"], ["Weight", "320 g"], ["Item code", _sku(p)]],
    desc: (p, s) => `Hand-loomed by artisans in ${s.city}, this ${p.name.toLowerCase()} uses techniques passed down for generations. Slight variations in weave and colour are the mark of genuine handwork, not a defect. Buying direct means more of your rupee reaches the maker.`,
  },
  books: {
    variants: [
      { name: "Format", kind: "pill", options: ["Paperback", "Hardcover", "eBook"] },
      { name: "Language", kind: "pill", options: ["Nepali", "English"] },
    ],
    specs: (p, s) => [["Author", "Various contributors"], ["Language", "Nepali / English"], ["Pages", "200"], ["Publisher", s.name], ["ISBN", "978-9937-0-1234-5"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name} is brought to print by ${s.name} in ${s.city}, available in Nepali and English editions on quality paper. Buying direct supports local publishers and writers.`,
  },
  electronics: {
    variants: [
      { name: "Colour", kind: "swatch", options: [{ label: "Black", tint: "slate" }, { label: "Blue", tint: "blue" }] },
    ],
    specs: (p, s) => [["Brand", s.name], ["Warranty", "1 year seller warranty"], ["In the box", "Device, cable, manual"], ["Power", "5V / 2A"], ["Origin", "Imported, sold by Nepal seller"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name}, stocked and shipped by ${s.name} in ${s.city}. Comes with a 1-year seller warranty and local after-sales support — no shipping the unit abroad for repair.`,
  },
  home: {
    variants: [
      { name: "Colour", kind: "swatch", options: [{ label: "Natural", tint: "saffron" }, { label: "Charcoal", tint: "slate" }, { label: "Indigo", tint: "blue" }] },
    ],
    specs: (p, s) => [["Material", "Handmade ceramic / clay"], ["Dimensions", "Approx. 18 × 12 cm"], ["Origin", `Handmade in ${s.city}, Nepal`], ["Care", "Wipe clean, not dishwasher safe"], ["Weight", "600 g"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name}, hand-finished by makers in ${s.city}. Each piece varies slightly — a sign of real handwork. Made for everyday Nepali homes.`,
  },
  handicraft: {
    variants: [],
    specs: (p, s) => [["Material", "Traditional handcraft materials"], ["Technique", "Hand-finished by a single artisan"], ["Origin", `Handmade in ${s.city}, Nepal`], ["Dimensions", "Approx. 15 × 15 cm"], ["Weight", "450 g"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name}, crafted by hand in ${s.city}. No two pieces are identical. Buying direct means more of your rupee reaches the artisan.`,
  },
  beauty: {
    variants: [
      { name: "Size", kind: "pill", options: ["50 ml", "100 ml"], default: 1 },
    ],
    specs: (p, s) => [["Type", "Natural / herbal"], ["Volume", "100 ml"], ["Key ingredients", "Himalayan botanicals"], ["Skin type", "All types"], ["Shelf life", "24 months"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name} from ${s.name}, made with Himalayan botanicals in ${s.city}. Free from harsh additives and suitable for all skin types.`,
  },
  grocery: {
    variants: [
      { name: "Pack size", kind: "pill", options: ["250 g", "500 g", "1 kg"], default: 1 },
    ],
    specs: (p, s) => [["Net weight", "500 g"], ["Type", "Natural / unprocessed"], ["Origin", `Sourced in ${s.city}, Nepal`], ["Storage", "Cool, dry place"], ["Best before", "12 months from packing"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name}, sourced and packed by ${s.name} in ${s.city}. Natural and unprocessed, sealed for freshness and delivered across Nepal.`,
  },
  sports: {
    variants: [
      { name: "Colour", kind: "swatch", options: [{ label: "Red", tint: "red" }, { label: "Charcoal", tint: "slate" }] },
      { name: "Size", kind: "pill", options: ["S", "M", "L", "XL"], default: 1 },
    ],
    specs: (p, s) => [["Material", "Performance fabric / alloy"], ["Use", "Training & outdoor"], ["Origin", "Imported, sold by Nepal seller"], ["Care", "Wipe or hand wash"], ["Weight", "400 g"], ["Item code", _sku(p)]],
    desc: (p, s) => `${p.name}, stocked by ${s.name}. Built for training and Nepal's outdoors, with local seller support and easy returns.`,
  },
};
// Returns { variants, specs, desc } resolved for one product, never the wrong category's attributes.
export const productProfile = (p) => {
  const s = sellerOf(p);
  const prof = CATEGORY_PROFILES[p.cat] || CATEGORY_PROFILES.handicraft;
  return { variants: prof.variants, specs: prof.specs(p, s), desc: prof.desc(p, s) };
};

// reviews for PDP
export const REVIEWS = [
  { name: "Sita Maharjan", city: "Pokhara", rating: 5, date: "2 weeks ago", text: "Soft and warm, exactly as shown in the video. Delivery was faster than expected. Paid by COD with no issues.", photos: 2, photoUrls: ["https://picsum.photos/seed/review-sita-1/400/400", "https://picsum.photos/seed/review-sita-2/400/400"], avatar: "https://picsum.photos/seed/user-sita/100/100", tint: "red" },
  { name: "Raj Shrestha", city: "Kathmandu", rating: 5, date: "3 weeks ago", text: "Bargained a little and the seller agreed. Quality is genuine pashmina. Highly recommend this store.", photos: 1, photoUrls: ["https://picsum.photos/seed/review-raj-1/400/400"], avatar: "https://picsum.photos/seed/user-raj/100/100", tint: "blue" },
  { name: "Anjali Gurung", city: "Lalitpur", rating: 4, date: "1 month ago", text: "Beautiful colour. Slightly smaller than I imagined but the material is excellent. Will buy again.", photos: 0, photoUrls: [], avatar: "https://picsum.photos/seed/user-anjali/100/100", tint: "gold" },
];
export const RATING_DIST = [ { s: 5, pct: 78 }, { s: 4, pct: 14 }, { s: 3, pct: 5 }, { s: 2, pct: 2 }, { s: 1, pct: 1 } ];

export const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
