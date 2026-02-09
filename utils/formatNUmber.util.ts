export function formatNumber(value:number) {
  if (typeof value !== "number") return "0.00";

  // toFixed(2) force 2 décimales
  return value.toFixed(2);
}