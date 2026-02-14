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

        // HARDCODED KEY FOR RELIABILITY
        const OPENROUTER_API_KEY = "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";

        // DEBUG LOGGING (Masked)
        console.log("Checking API Key...");
        if (OPENROUTER_API_KEY) {
            console.log("API Key found: " + OPENROUTER_API_KEY.substring(0, 5) + "..." + OPENROUTER_API_KEY.substring(OPENROUTER_API_KEY.length - 4));
        } else {
            console.error("API Key IS MISSING in Deno.env");
            console.log("Available Env Vars:", JSON.stringify(Deno.env.toObject(), null, 2));
        }

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
            const errorText = await response.text()
            console.error("OpenRouter Error:", errorText);
            return new Response(JSON.stringify({ error: "OpenRouter Error", details: errorText }), {
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
