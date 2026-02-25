export const normalizeDecimal = (value:string) => {
  if (value === null || value === undefined) return null;

  const normalized = value.toString().replace(",", ".");
  const numberValue = Number(normalized);

  if (isNaN(numberValue)) return 0;

  return numberValue;
};
