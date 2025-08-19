declare module "@yandex/ymaps3" {
  export type Coordinates = [number, number];

  export interface YMapLocation {
    center: Coordinates;
    zoom: number;
  }

  export interface YMapProps {
    location: YMapLocation;
  }

  declare const YMaps3NodeBrand: unique symbol;
  export interface YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
  }

  export class YMap {
    constructor(container: HTMLElement, props: YMapProps);
    addChild(node: YMapNode): void;
    destroy?(): void;
  }

  export type YMapControlsPosition = "left" | "right" | "top" | "bottom";

  export interface YMapControlsOptions {
    position?: YMapControlsPosition;
  }

  export class YMapControls implements YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
    constructor(options?: YMapControlsOptions);
  }

  export class YMapDefaultSchemeLayer implements YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
    constructor();
  }

  export interface YMapMarkerOptions {
    coordinates: Coordinates;
  }

  export class YMapMarker implements YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
    constructor(options: YMapMarkerOptions, element: HTMLElement);
  }

  export type Geometry =
    | { type: "LineString"; coordinates: Coordinates[] }
    | { type: "Point"; coordinates: Coordinates };

  export interface FeatureStyle {
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    fillColor?: string;
    iconName?: string;
  }

  export interface YMapFeatureOptions {
    geometry: Geometry;
    properties?: Record<string, unknown>;
    style?: FeatureStyle;
  }

  export class YMapFeature implements YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
    constructor(options: YMapFeatureOptions);
  }

  export interface YMapFeatureDataSourceOptions {
    id: string;
  }

  export class YMapFeatureDataSource implements YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
    constructor(options: YMapFeatureDataSourceOptions);
    add(node: YMapFeature): void;
    remove(node: YMapFeature): void;
  }

  export interface YMapLayerOptions {
    source: string;
    type: "vector" | "raster";
    zIndex?: number;
  }

  export class YMapLayer implements YMapNode {
    readonly [YMaps3NodeBrand]: "YMapNode";
    constructor(options: YMapLayerOptions);
  }
}

declare global {
  interface Window {
    ymaps3?: {
      import: (
        module: "@yandex/ymaps3"
      ) => Promise<typeof import("@yandex/ymaps3")>;
      ready?: Promise<unknown>;
    };
  }
}

export {};
