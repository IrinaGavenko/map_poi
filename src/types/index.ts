export type Point = {
  id: string
  name: string
  type: string[]
  description: string
  icon: string
  picture: string[]
  link: string
  coordinates: {
    lat: number
    lng: number
  }
  /** Filename of nested points JSON, e.g. "FF.json" or "_FF.json" */
  isCollapsible?: string
}
