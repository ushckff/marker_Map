export type LatLng = { lat: number; lng: number };

function toRad(x: number): number {
  return (x * Math.PI) / 180;
}
function toDeg(x: number): number {
  return (x * 180) / Math.PI;
}

export function bearing(p1: LatLng, p2: LatLng): number {
  const φ1 = toRad(p1.lat);
  const φ2 = toRad(p2.lat);
  const Δλ = toRad(p2.lng - p1.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const deg = (toDeg(θ) + 360) % 360;
  return deg;
}

export function midpoint(p1: LatLng, p2: LatLng): LatLng {
  return { lat: (p1.lat + p2.lat) / 2, lng: (p1.lng + p2.lng) / 2 };
}
