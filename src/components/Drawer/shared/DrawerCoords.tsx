import './shared.css'

type DrawerCoordsProps = {
  lat: number
  lng: number
}

export default function DrawerCoords({ lat, lng }: DrawerCoordsProps) {
  return (
    <div className="places-edit-coords">
      {lat.toFixed(5)}, {lng.toFixed(5)}
    </div>
  )
}
