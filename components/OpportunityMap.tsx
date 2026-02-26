'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type Opportunity = {
  id: string
  title: string
  business: {
    name: string
    latitude: number
    longitude: number
    city: string
  }
}

export default function OpportunityMap({ opportunities }: { opportunities: Opportunity[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map centered on Toronto, Ontario
    const map = L.map(mapRef.current).setView([43.6532, -79.3832], 11)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current!.removeLayer(layer)
      }
    })

    // Add markers for each opportunity
    opportunities.forEach((opp) => {
      if (opp.business.latitude && opp.business.longitude) {
        const marker = L.marker([opp.business.latitude, opp.business.longitude])
          .addTo(mapInstanceRef.current!)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-lg">${opp.business.name}</h3>
              <p class="text-sm text-gray-600">${opp.title}</p>
              <p class="text-xs text-gray-500 mt-1">${opp.business.city}</p>
              <a href="/opportunities/${opp.id}" class="text-blue-600 text-sm hover:underline mt-2 inline-block">View Details</a>
            </div>
          `)
      }
    })

    // Fit bounds to show all markers
    if (opportunities.length > 0) {
      const bounds = L.latLngBounds(
        opportunities
          .filter(opp => opp.business.latitude && opp.business.longitude)
          .map(opp => [opp.business.latitude, opp.business.longitude] as [number, number])
      )
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [opportunities])

  return <div ref={mapRef} className="w-full h-96 rounded-lg" />
}
