'use client'

import type { DirectionsResponseData, FindPlaceFromTextResponseData } from "@googlemaps/google-maps-services-js"
import { FormEvent, useRef, useState } from "react"
import { useMap } from "../hooks/useMap"
import { start } from "repl"

function NewRoutePage() {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const map = useMap(mapContainerRef)
    const [directionsData, setDirectionsData] = useState<DirectionsResponseData & { request: any }>()
    
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

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault()
        await searchPlaces()
    }

    
    return (
        <div className="flex flex-row h-full w-full">
            <div>
                <h1>Nova Rota</h1>
                <form onSubmit={onSubmit} className="flex flex-col items-center">
                    <div>
                        <input type="text" placeholder="origem" name="" id="source" className="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500"/>
                        <input type="text" placeholder="destino" name="" id="destination" className="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500"/>
                    </div>
                    <button type="submit">Pesquisar</button>
                </form>
                {directionsData && (
                    <ul>
                        <li>Origem {directionsData.routes[0].legs[0].start_address}</li>
                        <li>Origem {directionsData.routes[0].legs[0].end_address}</li>
                        <li>
                            <button onClick={() => createRoute()}>Iniciar trajeto</button>
                        </li>
                    </ul>
                )}
            </div>
            <div ref={mapContainerRef} className="h-full w-full"></div>
        </div>
    )
}

export default NewRoutePage