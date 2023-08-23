import { useState, useEffect } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { getCurrentPosition } from '../utils/geolocation'
import { Map } from '../utils/map'

export function useMap(containerRef: React.RefObject<HTMLDivElement>): Map | undefined {
    const [map, setMap] = useState<Map>()

    useEffect(() => {
        (async () => {
            const loader = new Loader({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
                libraries: ['routes', 'geometry']
            })
            const [, , position] = await Promise.all([
                loader.importLibrary('routes'),
                loader.importLibrary('geometry'),
                getCurrentPosition({ enableHighAccuracy: true })
            ])
            const currentMap = new Map(containerRef.current!, {
                zoom: 15,
                center: position
            })
            setMap(currentMap)
        })()
    }, [containerRef])

    return map
}