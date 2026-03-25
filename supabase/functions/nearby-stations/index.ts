
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, radius = 20000 } = await req.json()
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const googleApiKey = 'AIzaSyCXo5DViPSCe7Ngv9xob9VaAS1kH7HyiPs'
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=gas_station&keyword=electric%20vehicle%20charging&key=${googleApiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results) {
      const formattedStations = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        price_per_kwh: 0.40,
        available: place.business_status === 'OPERATIONAL',
        rating: place.rating || 4.0,
        total_reviews: place.user_ratings_total || 0,
        connectors: [
          {
            id: `${place.place_id}_1`,
            station_id: place.place_id,
            connector_type: 'Type 2',
            power_output: 22,
            available: true,
            created_at: new Date().toISOString()
          }
        ]
      }))

      return new Response(
        JSON.stringify({ 
          status: 'OK', 
          results: formattedStations,
          count: formattedStations.length 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          status: data.status || 'ERROR', 
          results: [],
          count: 0,
          message: data.error_message || 'No stations found'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Error fetching nearby stations:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
