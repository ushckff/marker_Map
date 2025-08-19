/// <reference types="yandex-maps" />

import "./YMap.css";
import { useEffect, useRef } from "react";
import type { PlaceTag } from "@/entities/point/types";

export type MapPoint = {
  lat: number;
  lng: number;
  title?: string;
  order?: number;
  category?: PlaceTag;
  address?: string;
  description?: string;
};

type Props = {
  points: MapPoint[];
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onMarkerClick?: (point: MapPoint) => void;

  height?: number | string;
  zoom?: number;
  city?: string;
  center?: { lat: number; lng: number };
  preserveViewport?: boolean;
  onViewportChange?: (v: {
    center: { lat: number; lng: number };
    zoom: number;
  }) => void;
};

const PRESET_BY_TAG: Record<PlaceTag, ymaps.PresetKey> = {
  architecture: "islands#lightBlueLeisureIcon",
  bar: "islands#pinkBarIcon",
  history: "islands#nightLeisureIcon",
  cafe: "islands#darkOrangeFoodIcon",
  picnic: "islands#oliveVegetationIcon",
  cuisine: "islands#darkBlueFoodIcon",
  museum: "islands#brownLeisureIcon",
  park: "islands#greenVegetationIcon",
  beach: "islands#yellowBeachIcon",
  restaurant: "islands#blueFoodIcon",
  theater: "islands#orangeTheaterIcon",
  photo: "islands#darkGreenObservationIcon",
  other: "islands#grayGovernmentIcon",
};

type PlacemarkProps = { hintContent?: string; iconCaption?: string };

function isPointGeometry(
  g: ymaps.IGeometry | null | undefined
): g is ymaps.IPointGeometry {
  return (
    !!g &&
    typeof (g as { getType?: unknown }).getType === "function" &&
    (g as { getType: () => string }).getType() === "Point"
  );
}

function waitForYMaps21(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    const t = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        window.ymaps &&
        typeof window.ymaps.ready === "function"
      ) {
        clearInterval(t);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        resolve(false);
      }
    }, 50);
  });
}

export default function YMap({
  points,
  onMapClick,
  onMarkerClick,
  height = 360,
  zoom = 13,
  city,
  center,
  preserveViewport = false,
  onViewportChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<ymaps.Map | null>(null);
  const markersRef = useRef<ymaps.GeoObjectCollection | null>(null);
  const polylineRef = useRef<ymaps.Polyline | null>(null);
  const tempPlacemarkRef = useRef<ymaps.Placemark | null>(null);

  const latestPointsRef = useRef(points);
  latestPointsRef.current = points;

  const mapClickRef = useRef<Props["onMapClick"]>(onMapClick);
  mapClickRef.current = onMapClick;

  const markerClickRef = useRef<Props["onMarkerClick"]>(onMarkerClick);
  markerClickRef.current = onMarkerClick;

  const viewportChangeRef = useRef<Props["onViewportChange"]>(onViewportChange);
  viewportChangeRef.current = onViewportChange;

  const userInteractedRef = useRef(false);
  const didInitialCenterRef = useRef(false);

  function renderOverlays() {
    const map = mapRef.current;
    const collection = markersRef.current;
    if (!map || !collection) return;

    collection.removeAll();

    const list = latestPointsRef.current;

    // метки
    for (const p of list) {
      const props: PlacemarkProps = {
        hintContent: p.title ?? "",
        iconCaption: typeof p.order === "number" ? `#${p.order}` : undefined,
      };
      const preset = PRESET_BY_TAG[p.category ?? "other"];
      const placemark = new window.ymaps.Placemark([p.lat, p.lng], props, {
        preset,
      });

      placemark.events.add("click", () => {
        markerClickRef.current?.(p);
      });

      collection.add(placemark);
    }

    if (polylineRef.current) {
      map.geoObjects.remove(polylineRef.current);
      polylineRef.current = null;
    }
    if (list.length >= 2) {
      const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const lineCoords = sorted.map((p) => [p.lat, p.lng]);
      const poly = new window.ymaps.Polyline(
        lineCoords,
        {},
        { strokeColor: "#2f8cf0", strokeWidth: 4, strokeOpacity: 0.9 }
      );
      polylineRef.current = poly;
      map.geoObjects.add(poly);
    }

    if (!preserveViewport && !userInteractedRef.current) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: [24, 24, 24, 24],
        });
        didInitialCenterRef.current = true;
      } else if (list.length === 1 && !didInitialCenterRef.current) {
        map.setCenter([list[0].lat, list[0].lng], Math.max(zoom, 13), {});
        didInitialCenterRef.current = true;
      }
    }
  }

  useEffect(() => {
    let disposed = false;

    (async () => {
      const ok = await waitForYMaps21(4000);
      if (!ok) {
        console.error("YMap: ymaps не успел загрузиться за 4000 мс");
      }
      if (!ok || !hostRef.current) return;

      window.ymaps.ready(() => {
        if (disposed || !hostRef.current) return;

        let map: ymaps.Map;
        try {
          map = new window.ymaps.Map(
            hostRef.current,
            { center: [55.751244, 37.618423], zoom, controls: [] },
            { suppressMapOpenBlock: true }
          );
        } catch (err) {
          console.error("YMap: ошибка при создании карты", err);
          return;
        }
        map.controls.add("zoomControl");
        mapRef.current = map;

        const permanent = new window.ymaps.GeoObjectCollection();
        markersRef.current = permanent;
        map.geoObjects.add(permanent);

        const fireViewportChange = () => {
          const m = mapRef.current;
          if (!m) return;
          const c = m.getCenter();
          const z = m.getZoom();
          viewportChangeRef.current?.({
            center: { lat: c[0], lng: c[1] },
            zoom: z,
          });
        };

        const clickHandler = (e: ymaps.IEvent) => {
          const coords = e.get("coords") as number[] | undefined;
          if (!coords) return;

          mapClickRef.current?.({ lat: coords[0], lng: coords[1] });

          if (!tempPlacemarkRef.current) {
            const tmp = new window.ymaps.Placemark(
              coords,
              {},
              { preset: "islands#blueIcon" }
            );
            tempPlacemarkRef.current = tmp;
            map.geoObjects.add(tmp);
          } else {
            const g = tempPlacemarkRef.current.geometry;
            if (isPointGeometry(g)) g.setCoordinates(coords);
          }
        };

        map.events.add("click", clickHandler);
        map.events.add("tap", clickHandler);
        map.events.add("actionend", () => {
          userInteractedRef.current = true;
          fireViewportChange();
        });
        map.events.add("boundschange", () => {
          userInteractedRef.current = true;
          fireViewportChange();
        });

        if (center) {
          map.setCenter([center.lat, center.lng], zoom, {});
          didInitialCenterRef.current = true;
        } else {
          const curr = latestPointsRef.current;
          if (curr.length === 0 && city && city.trim()) {
            window.ymaps
              .geocode(city.trim(), { results: 1, kind: "locality" })
              .then((res) => {
                if (disposed || !mapRef.current) return;
                const first = res.geoObjects.get(
                  0
                ) as ymaps.IGeoObject<ymaps.IGeometry> | null;
                if (!first) return;
                const geom = first.geometry;
                if (isPointGeometry(geom)) {
                  const c = geom.getCoordinates();
                  mapRef.current!.setCenter(c, Math.max(zoom, 13), {});
                } else {
                  const b = res.geoObjects.getBounds();
                  if (b) {
                    mapRef.current!.setBounds(b, {
                      checkZoomRange: true,
                      zoomMargin: [24, 24, 24, 24],
                    });
                  }
                }
                didInitialCenterRef.current = true;
              })
              .catch(() => {});
          } else if (curr.length > 0) {
            map.setCenter([curr[0].lat, curr[0].lng], zoom, {});
            didInitialCenterRef.current = true;
          }
        }

        renderOverlays();

        return () => {
          map.events.remove("click", clickHandler);
          map.events.remove("tap", clickHandler);
        };
      });
    })();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      markersRef.current = null;
      polylineRef.current = null;
      tempPlacemarkRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setCenter([center.lat, center.lng], zoom, {});
  }, [center, zoom]);

  useEffect(() => {
    if (mapRef.current && markersRef.current) {
      renderOverlays();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, preserveViewport]);

  return <div ref={hostRef} className="ymap" style={{ height }} />;
}
