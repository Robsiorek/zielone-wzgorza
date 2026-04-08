export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Przegląd",
    items: [
      { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
      { title: "Kalendarz", href: "/calendar", iconName: "CalendarDays" },
    ],
  },
  {
    label: "Rezerwacje",
    items: [
      { title: "Oferty", href: "/offers", iconName: "Tag" },
      { title: "Rezerwacje", href: "/reservations", iconName: "BookOpen", badge: "Wkrótce" },
      { title: "Zasoby", href: "/resources", iconName: "Warehouse" },
    ],
  },
  {
    label: "Klienci & Finanse",
    items: [
      { title: "Klienci", href: "/clients", iconName: "Users" },
      { title: "Płatności", href: "/payments", iconName: "CreditCard", badge: "Wkrótce" },
      { title: "Dokumenty", href: "/documents", iconName: "FileText" },
      { title: "CRM", href: "/crm", iconName: "Contact", badge: "Wkrótce" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Ustawienia", href: "/settings", iconName: "Settings" },
    ],
  },
];
