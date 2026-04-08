import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rezerwacja online — Zielone Wzgórza",
  description: "Zarezerwuj domek lub pokój w ośrodku Zielone Wzgórza. Sprawdź dostępność i cenę online.",
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
