import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// This function is deprecated and replaced by chat-ai. 
// Function body cleared to remove exposed API keys.
serve(() => {
    return new Response(
        JSON.stringify({ error: "This endpoint is deprecated. Use chat-ai." }),
        { status: 410, headers: { "Content-Type": "application/json" } }
    )
})
