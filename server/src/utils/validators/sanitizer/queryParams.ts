// Helper to safely extract string query params
export function getStringQueryParam(param: unknown, defaultValue = ""): string | undefined {
    if (Array.isArray(param)) return param[0].trim() || undefined;
    if (typeof param === "string") return param.trim() || undefined;
    return defaultValue || undefined;
}

// Helper to safely extract number query params
export function getNumberQueryParam(param: unknown, defaultValue?: number): number | undefined {
    const str = getStringQueryParam(param);
    if (!str) return defaultValue;
    const num = Number(str);
    return isNaN(num) ? defaultValue : num;
}

// Helper to safely extract boolean query params
export function getBooleanQueryParam(param: unknown): boolean | undefined {
  const str = getStringQueryParam(param);
  if (!str) return undefined; // <--- don't default to false

  return ["true", "1", "yes"].includes(str.toLowerCase());
}