export type Point = {
  id: string
  name: string
  /** Nested points file, e.g. "FF.json" → loads `collapse-FF.json` */
  isCollapsible?: string
  type: string[]
  description: string
  icon: string
  picture: string[]
  link: string
  coordinates: {
    lat: number
    lng: number
  }
}

export type LatLng = {
  lat: number
  lng: number
}

export type CollapsePolygon = {
  color: string
  coordinates: LatLng[]
}

/** Nested collapse file: `{ polygon, points }` (legacy: bare `Point[]`). */
export type CollapseDataset = {
  polygon: CollapsePolygon | null
  points: Point[]
}
