export type Point = {
  id: string
  name: string
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
