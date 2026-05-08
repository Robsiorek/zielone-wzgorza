export type AspectRatio =
  | "square" | "portrait" | "photo" | "video" | "cinema"
  | number
  | string;

const NAMED: Record<string, string> = {
  square: "1 / 1",
  portrait: "3 / 4",
  photo: "4 / 3",
  video: "16 / 9",
  cinema: "21 / 9",
};

export function aspectToValue(ratio: AspectRatio): string {
  if (typeof ratio === "number") {
    if (!Number.isFinite(ratio) || ratio <= 0) return "4 / 3";
    return `${ratio}`;
  }
  if (NAMED[ratio]) return NAMED[ratio];
  const match = ratio.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (match) return `${match[1]} / ${match[2]}`;
  return "4 / 3";
}
