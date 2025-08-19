export type GeocodeResult = {
  address: string;
  lat: number;
  lng: number;
  precision?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function geocodeAddress(
  query: string,
  apiKey = import.meta.env.VITE_YMAPS_API_KEY
): Promise<GeocodeResult | null> {
  if (!apiKey) throw new Error("VITE_YMAPS_API_KEY is missing");
  const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${encodeURIComponent(
    apiKey
  )}&geocode=${encodeURIComponent(query)}`;

  const json: unknown = await fetch(url).then((r) => r.json());
  if (!isRecord(json)) return null;

  const response = isRecord(json.response) ? json.response : null;
  const collection =
    response && isRecord(response.GeoObjectCollection)
      ? response.GeoObjectCollection
      : null;
  const fm =
    collection && Array.isArray(collection.featureMember)
      ? collection.featureMember
      : null;
  const first = fm && fm.length > 0 && isRecord(fm[0]) ? fm[0] : null;
  const geo = first && isRecord(first.GeoObject) ? first.GeoObject : null;
  const point = geo && isRecord(geo.Point) ? geo.Point : null;
  const pos = point && typeof point.pos === "string" ? point.pos : null;
  const meta =
    geo && isRecord(geo.metaDataProperty) ? geo.metaDataProperty : null;
  const gdata =
    meta && isRecord(meta.GeocoderMetaData) ? meta.GeocoderMetaData : null;
  const text = gdata && typeof gdata.text === "string" ? gdata.text : null;
  const precision =
    gdata && typeof gdata.precision === "string" ? gdata.precision : undefined;

  if (!pos || !text) return null;
  const [lonStr, latStr] = pos.split(" ");
  const lng = Number(lonStr);
  const lat = Number(latStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { address: text, lat, lng, precision };
}
