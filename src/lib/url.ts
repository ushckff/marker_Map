export function buildAppUrl(path: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${location.origin}${base}${p}`;
}
