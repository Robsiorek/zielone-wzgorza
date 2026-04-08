/**
 * Timeline visual styles per reservation type + status.
 *
 * v5.0 — used by calendar components for entry rendering.
 *
 * Rules (from Master Plan):
 *   BLOCK → gray solid (always, regardless of status)
 *   OFFER → blue dashed (always, regardless of status)
 *   BOOKING → color depends on status:
 *     PENDING → orange solid
 *     CONFIRMED → green solid
 *     FINISHED → gray faded solid
 *     NO_SHOW → dark red dashed
 *     CANCELLED → not rendered (filtered out)
 */

export type TimelineStyle = {
  bg: string;       // background color class
  border: string;   // border color class
  text: string;     // text color class
  dashed: boolean;  // dashed border
  faded: boolean;   // reduced opacity
};

export function getTimelineStyle(
  type: "BOOKING" | "OFFER" | "BLOCK" | string,
  status: string,
): TimelineStyle {
  // BLOCK — always gray solid
  if (type === "BLOCK") {
    return {
      bg: "bg-gray-200 dark:bg-gray-700",
      border: "border-gray-400 dark:border-gray-500",
      text: "text-gray-700 dark:text-gray-300",
      dashed: false,
      faded: false,
    };
  }

  // OFFER — always blue dashed
  if (type === "OFFER") {
    return {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      border: "border-blue-500 dark:border-blue-400",
      text: "text-blue-800 dark:text-blue-300",
      dashed: true,
      faded: false,
    };
  }

  // BOOKING — depends on status
  switch (status) {
    case "PENDING":
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        border: "border-amber-500 dark:border-amber-400",
        text: "text-amber-800 dark:text-amber-300",
        dashed: false,
        faded: false,
      };

    case "CONFIRMED":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        border: "border-emerald-500 dark:border-emerald-400",
        text: "text-emerald-800 dark:text-emerald-300",
        dashed: false,
        faded: false,
      };

    case "FINISHED":
      return {
        bg: "bg-gray-100 dark:bg-gray-800/50",
        border: "border-gray-300 dark:border-gray-600",
        text: "text-gray-500 dark:text-gray-400",
        dashed: false,
        faded: true,
      };

    case "NO_SHOW":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        border: "border-red-700 dark:border-red-500",
        text: "text-red-800 dark:text-red-300",
        dashed: true,
        faded: false,
      };

    default:
      // fallback (unknown status)
      return {
        bg: "bg-gray-100 dark:bg-gray-800",
        border: "border-gray-300 dark:border-gray-600",
        text: "text-gray-600 dark:text-gray-400",
        dashed: false,
        faded: false,
      };
  }
}

/**
 * Payment badge config for timeline.
 * 4 variants only: PAID, PARTIAL, UNPAID, OVERDUE
 */
export type PaymentBadge = {
  label: string;
  cls: string;
};

export function getPaymentBadge(
  paymentStatus: string | null,
  overdue: boolean,
): PaymentBadge | null {
  if (overdue) {
    return { label: "Po terminie", cls: "bg-red-500 text-white" };
  }
  switch (paymentStatus) {
    case "PAID":
      return { label: "Opłacona", cls: "bg-emerald-500 text-white" };
    case "PARTIAL":
      return { label: "Częściowo", cls: "bg-amber-500 text-white" };
    case "UNPAID":
      return { label: "Brak", cls: "bg-gray-400 text-white" };
    default:
      return null;
  }
}
