// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { messages, model, temperature } = await req.json()

        // Retrieve the secret API key from Supabase secrets
        const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
        if (!OPENROUTER_API_KEY) {
            throw new Error('Missing OPENROUTER_API_KEY')
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://prism.app", // Optional
                "X-Title": "Prism", // Optional
            },
            body: JSON.stringify({
                model: model || "openai/gpt-oss-120b:free",
                messages: messages,
                temperature: temperature || 0.7,
            })
        })

        if (!response.ok) {
            const error = await response.text()
            return new Response(JSON.stringify({ error }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const data = await response.json()
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
