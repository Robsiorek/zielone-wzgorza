/**
 * B3: Amenity icons — typed vocabulary.
 *
 * Source of truth in code (B0.6 pattern).
 * Adding a new icon = code change, not DB migration.
 * Runtime validation in API: isValidIconKey().
 *
 * Icons curated for hospitality / accommodation industry.
 * UI icon picker reads EXCLUSIVELY from this registry.
 */

export interface AmenityIconDef {
  label: string;
  /** Category for grouping in icon picker */
  group: string;
}

/**
 * ~170 curated lucide icons for accommodation amenities.
 * Keys match lucide-react component names (kebab-case).
 */
export const AMENITY_ICONS: Record<string, AmenityIconDef> = {
  // ── ROOM FEATURES ──
  "bed-double": { label: "Łóżko podwójne", group: "Pokój" },
  "bed-single": { label: "Łóżko pojedyncze", group: "Pokój" },
  "lamp": { label: "Lampa", group: "Pokój" },
  "lamp-desk": { label: "Lampka biurkowa", group: "Pokój" },
  "sofa": { label: "Sofa", group: "Pokój" },
  "armchair": { label: "Fotel", group: "Pokój" },
  "door-open": { label: "Drzwi", group: "Pokój" },
  "door-closed": { label: "Drzwi zamknięte", group: "Pokój" },
  "lock": { label: "Zamek", group: "Pokój" },
  "key": { label: "Klucz", group: "Pokój" },
  "key-round": { label: "Klucz okrągły", group: "Pokój" },
  "archive": { label: "Szafa", group: "Pokój" },
  "fan": { label: "Wentylator", group: "Pokój" },
  "thermometer": { label: "Termometr", group: "Pokój" },
  "thermometer-sun": { label: "Ogrzewanie", group: "Pokój" },
  "thermometer-snowflake": { label: "Klimatyzacja", group: "Pokój" },
  "snowflake": { label: "Klimatyzacja", group: "Pokój" },
  "flame": { label: "Kominek", group: "Pokój" },
  "wind": { label: "Wentylacja", group: "Pokój" },
  "air-vent": { label: "Wentylacja", group: "Pokój" },
  "blinds": { label: "Żaluzje", group: "Pokój" },
  "ruler": { label: "Metraż", group: "Pokój" },
  "maximize": { label: "Przestronny", group: "Pokój" },
  "minimize": { label: "Kameralny", group: "Pokój" },
  "clock": { label: "Zegar", group: "Pokój" },
  "alarm-clock": { label: "Budzik", group: "Pokój" },
  "moon": { label: "Noc", group: "Pokój" },
  "sun": { label: "Słońce", group: "Pokój" },
  "baby": { label: "Łóżeczko dziecięce", group: "Pokój" },
  "accessibility": { label: "Dostęp dla niepełnosprawnych", group: "Pokój" },

  // ── KITCHEN ──
  "cooking-pot": { label: "Garnek", group: "Kuchnia" },
  "utensils": { label: "Sztućce", group: "Kuchnia" },
  "chef-hat": { label: "Kuchnia", group: "Kuchnia" },
  "microwave": { label: "Mikrofalówka", group: "Kuchnia" },
  "refrigerator": { label: "Lodówka", group: "Kuchnia" },
  "cup-soda": { label: "Napoje", group: "Kuchnia" },
  "coffee": { label: "Kawa", group: "Kuchnia" },
  "wine": { label: "Wino", group: "Kuchnia" },
  "beer": { label: "Piwo", group: "Kuchnia" },
  "glass-water": { label: "Woda", group: "Kuchnia" },
  "sandwich": { label: "Jedzenie", group: "Kuchnia" },
  "pizza": { label: "Pizza", group: "Kuchnia" },
  "cake": { label: "Ciasto", group: "Kuchnia" },
  "egg": { label: "Śniadanie", group: "Kuchnia" },
  "apple": { label: "Owoce", group: "Kuchnia" },
  "salad": { label: "Sałatka", group: "Kuchnia" },
  "flame-kindling": { label: "Grill", group: "Kuchnia" },
  "grape": { label: "Winogrona", group: "Kuchnia" },
  "wheat": { label: "Pieczywo", group: "Kuchnia" },

  // ── MEDIA & TECH ──
  "tv": { label: "Telewizor", group: "Media" },
  "monitor": { label: "Monitor", group: "Media" },
  "wifi": { label: "Wi-Fi", group: "Media" },
  "bluetooth": { label: "Bluetooth", group: "Media" },
  "radio": { label: "Radio", group: "Media" },
  "music": { label: "Muzyka", group: "Media" },
  "headphones": { label: "Słuchawki", group: "Media" },
  "speaker": { label: "Głośnik", group: "Media" },
  "volume-2": { label: "Dźwięk", group: "Media" },
  "smartphone": { label: "Telefon", group: "Media" },
  "phone": { label: "Telefon stacjonarny", group: "Media" },
  "laptop": { label: "Laptop", group: "Media" },
  "tablet-smartphone": { label: "Tablet", group: "Media" },
  "plug": { label: "Gniazdko", group: "Media" },
  "plug-zap": { label: "Ładowanie", group: "Media" },
  "cable": { label: "Kabel", group: "Media" },
  "printer": { label: "Drukarka", group: "Media" },
  "projector": { label: "Projektor", group: "Media" },
  "gamepad-2": { label: "Konsola", group: "Media" },
  "signal": { label: "Zasięg", group: "Media" },

  // ── BATHROOM ──
  "bath": { label: "Wanna", group: "Łazienka" },
  "shower-head": { label: "Prysznic", group: "Łazienka" },
  "droplets": { label: "Woda", group: "Łazienka" },
  "waves": { label: "Jacuzzi", group: "Łazienka" },
  "hand": { label: "Suszarka do rąk", group: "Łazienka" },
  "scissors": { label: "Kosmetyki", group: "Łazienka" },
  "pipette": { label: "Kosmetyki", group: "Łazienka" },
  "sparkles": { label: "Czystość", group: "Łazienka" },
  "shirt": { label: "Ręczniki", group: "Łazienka" },
  "spray-can": { label: "Odświeżacz", group: "Łazienka" },
  "washing-machine": { label: "Pralka", group: "Łazienka" },

  // ── OUTDOOR & VIEW ──
  "trees": { label: "Las", group: "Widok" },
  "tree-pine": { label: "Sosna", group: "Widok" },
  "tree-deciduous": { label: "Drzewo", group: "Widok" },
  "mountain": { label: "Góry", group: "Widok" },
  "mountain-snow": { label: "Góry ze śniegiem", group: "Widok" },
  "sunrise": { label: "Wschód słońca", group: "Widok" },
  "sunset": { label: "Zachód słońca", group: "Widok" },
  "cloud": { label: "Chmury", group: "Widok" },
  "rainbow": { label: "Tęcza", group: "Widok" },
  "flower": { label: "Kwiat", group: "Widok" },
  "flower-2": { label: "Ogród", group: "Widok" },
  "leaf": { label: "Liść", group: "Widok" },
  "palmtree": { label: "Palma", group: "Widok" },
  "fence": { label: "Ogrodzenie", group: "Widok" },
  "tent": { label: "Namiot", group: "Widok" },
  "home": { label: "Domek", group: "Widok" },
  "warehouse": { label: "Budynek", group: "Widok" },
  "eye": { label: "Widok panoramiczny", group: "Widok" },
  "map-pin": { label: "Lokalizacja", group: "Widok" },
  "map": { label: "Mapa", group: "Widok" },
  "compass": { label: "Kompas", group: "Widok" },
  "navigation": { label: "Nawigacja", group: "Widok" },
  "flag": { label: "Punkt widokowy", group: "Widok" },

  // ── SPORTS & ACTIVITIES ──
  "bike": { label: "Rower", group: "Aktywność" },
  "dumbbell": { label: "Siłownia", group: "Aktywność" },
  "trophy": { label: "Sport", group: "Aktywność" },
  "goal": { label: "Piłka nożna", group: "Aktywność" },
  "fish": { label: "Wędkarstwo", group: "Aktywność" },
  "anchor": { label: "Port", group: "Aktywność" },
  "sailboat": { label: "Żeglowanie", group: "Aktywność" },
  "ship": { label: "Statek", group: "Aktywność" },
  "footprints": { label: "Szlak pieszy", group: "Aktywność" },
  "route": { label: "Trasa", group: "Aktywność" },
  "swords": { label: "Gry planszowe", group: "Aktywność" },
  "puzzle": { label: "Puzzle", group: "Aktywność" },
  "dice-5": { label: "Gry", group: "Aktywność" },
  "target": { label: "Łucznictwo", group: "Aktywność" },
  "tent-tree": { label: "Kemping", group: "Aktywność" },

  // ── TRANSPORT & PARKING ──
  "car": { label: "Parking", group: "Transport" },
  "car-front": { label: "Samochód", group: "Transport" },
  "bus": { label: "Autobus", group: "Transport" },
  "train-front": { label: "Pociąg", group: "Transport" },
  "plane": { label: "Lotnisko", group: "Transport" },
  "parking-meter": { label: "Parking płatny", group: "Transport" },
  "circle-parking-off": { label: "Brak parkingu", group: "Transport" },
  "fuel": { label: "Stacja benzynowa", group: "Transport" },

  // ── SERVICES ──
  "concierge-bell": { label: "Recepcja", group: "Usługi" },
  "bell": { label: "Powiadomienia", group: "Usługi" },
  "shield-check": { label: "Bezpieczeństwo", group: "Usługi" },
  "shield": { label: "Ochrona", group: "Usługi" },
  "cctv": { label: "Monitoring", group: "Usługi" },
  "siren": { label: "Alarm", group: "Usługi" },
  "fire-extinguisher": { label: "Gaśnica", group: "Usługi" },
  "stethoscope": { label: "Lekarz", group: "Usługi" },
  "dog": { label: "Zwierzęta", group: "Usługi" },
  "cat": { label: "Kot", group: "Usługi" },
  "paw-print": { label: "Zwierzęta dozwolone", group: "Usługi" },
  "ban": { label: "Zakaz", group: "Usługi" },
  "cigarette": { label: "Strefa palenia", group: "Usługi" },
  "cigarette-off": { label: "Zakaz palenia", group: "Usługi" },
  "hand-helping": { label: "Pomoc", group: "Usługi" },
  "badge-check": { label: "Certyfikat", group: "Usługi" },
  "award": { label: "Nagroda", group: "Usługi" },
  "star": { label: "Gwiazdka", group: "Usługi" },
  "heart": { label: "Ulubione", group: "Usługi" },
  "gift": { label: "Prezent", group: "Usługi" },
  "calendar-check": { label: "Rezerwacja", group: "Usługi" },
  "mail": { label: "Poczta", group: "Usługi" },
  "info": { label: "Informacja", group: "Usługi" },
  "circle-help": { label: "Pomoc", group: "Usługi" },
  "newspaper": { label: "Gazeta", group: "Usługi" },
  "book-open": { label: "Książka", group: "Usługi" },
  "package": { label: "Pakiet", group: "Usługi" },
  "truck": { label: "Dostawa", group: "Usługi" },
  "store": { label: "Sklep", group: "Usługi" },
  "shopping-cart": { label: "Zakupy", group: "Usługi" },
  "credit-card": { label: "Karta płatnicza", group: "Usługi" },
  "banknote": { label: "Gotówka", group: "Usługi" },
  "receipt": { label: "Paragon", group: "Usługi" },
  "clipboard-list": { label: "Lista", group: "Usługi" },
  "check-circle": { label: "Zweryfikowane", group: "Usługi" },
  "users": { label: "Rodziny", group: "Usługi" },
  "user-check": { label: "Gość VIP", group: "Usługi" },
  "zap": { label: "Prąd", group: "Usługi" },
  "lightbulb": { label: "Oświetlenie", group: "Usługi" },
} as const;

export type AmenityIconKey = keyof typeof AMENITY_ICONS;

/** All valid icon keys */
export const AMENITY_ICON_KEYS = Object.keys(AMENITY_ICONS) as string[];

/** All unique groups (for icon picker grouping) */
export const AMENITY_ICON_GROUPS: string[] = [
  ...new Set(Object.values(AMENITY_ICONS).map((i) => i.group)),
];

/** Runtime validation — checks if a string is a valid icon key */
export function isValidIconKey(value: string): boolean {
  return value in AMENITY_ICONS;
}

/** Get label for an icon key (safe — returns key if unknown) */
export function getIconLabel(iconKey: string): string {
  if (isValidIconKey(iconKey)) {
    return (AMENITY_ICONS as Record<string, AmenityIconDef>)[iconKey].label;
  }
  return iconKey;
}
