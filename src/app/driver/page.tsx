'use client'

import type { DirectionsResponseData, FindPlaceFromTextResponseData } from "@googlemaps/google-maps-services-js"
import { FormEvent, useRef, useState } from "react"
import { useMap } from "../hooks/useMap"
import useSwr from 'swr'
import { fetcher } from "../utils/http"
import { Route } from "../utils/map"
import { RouteDirections } from "../utils/models"

function DriverPage() {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const map = useMap(mapContainerRef)
    const [directionsData, setDirectionsData] = useState<DirectionsResponseData & { request: any }>()
    
    const { data: routes, error, isLoading } = useSwr<RouteDirections[]>('http://localhost:3001/routes', fetcher, {
        fallbackData: []
    })    
    const createRoute = async () => {
        const startAddress = directionsData!.routes[0].legs[0].start_address
        const endAddress = directionsData!.routes[0].legs[0].end_address        
        const response = await fetch('http://localhos:3001/routes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `${startAddress} - ${endAddress}`,
                source_id: directionsData!.request.origin.place_id,
                destination_id: directionsData!.request.destination.place_id
            })
        })
        const route = await response.json()
    }   
    
    const searchPlaces = async () => {
        const source = (document.getElementById('source') as HTMLInputElement).value
        const destination = (document.getElementById('destination') as HTMLInputElement).value
        const [sourceResponse, destinationResponse] = await Promise.all([
            fetch(`http://localhost:3001/places?text=${source}`),
            fetch(`http://localhost:3001/places?text=${destination}`)
        ])
        const [sourcePlace, destinationPlace]: FindPlaceFromTextResponseData[] = await Promise.all([
            sourceResponse.json(),
            destinationResponse.json()
        ])
        
        if (sourcePlace.status !== 'OK') {
            console.error(sourcePlace)
            alert('Não foi possível encontrar a origem')
            return
        }
        if (destinationPlace.status !== 'OK') {
            console.error(destinationPlace)
            alert('Não foi possível encontrar a origem')
            return
        }

        const sourcePlaceId = sourcePlace.candidates[0].place_id
        const destinationPlaceId = destinationPlace.candidates[0].place_id
        const directionsResponse = await fetch(`http://localhost:3001/directions?originId=${sourcePlaceId}&destinationId=${destinationPlaceId}`)
        const currentDirectionsData: DirectionsResponseData & { request: any } = await directionsResponse.json()
        setDirectionsData(currentDirectionsData)
        map?.removeAllRoutes()
        await map?.addRouteWithIcons({
            routeId: '1',
            startMarkerOptions: {
                position: directionsData?.routes[0].legs[0].start_location
            },
            endMarkerOptions: {
                position: directionsData?.routes[0].legs[0].end_location
            },
            carMarkerOptions: {}
        })
    }

    const startRoute = async () => {
        const routeId = (document.getElementById('route') as HTMLSelectElement).value
        const response = await fetch(`http://localhost:3000/routes/${routeId}`)
        const route: RouteDirections = await response.json()
        map?.removeAllRoutes()
        await map?.addRouteWithIcons({
            routeId,
            startMarkerOptions: {
                position: route.directions.routes[0].legs[0].start_location
            },
            endMarkerOptions: {
                position: route.directions.routes[0].legs[0].end_location
            },
            carMarkerOptions: {
                position: route.directions.routes[0].legs[0].start_location
            }
        })

        const { steps }= route.directions.routes[0].legs[0]
        for(const step of steps) {
            await sleep(1000)
            map?.moveCar(routeId, step.start_location)
            await sleep(1000)
            map?.moveCar(routeId, step.end_location)
        }
    }
    
    return (
        <div className="flex flex-row h-full w-full">
            <div>
                <h1>Minha viagem</h1>
                <div className="flex flex-col items-center">
                    <select id="route">
                        {isLoading && <option>Carregando rotas...</option>}
                        {routes!.map((route: RouteDirections) => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                        <option value=""></option>
                    </select>
                    <button onClick={() => startRoute()}>Iniciar a viagem</button>
                </div>
            </div>
            <div ref={mapContainerRef} className="h-full w-full"></div>
        </div>
    )
}

export default DriverPage

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
