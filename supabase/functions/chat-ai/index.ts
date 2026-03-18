import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getAuthToken(req: Request) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
        throw new Error('Missing authorization header')
    }

    const [bearer, token] = authHeader.split(' ')
    if (bearer !== 'Bearer' || !token) {
        throw new Error("Authorization header must be in the format 'Bearer <token>'")
    }

    return token
}

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SB_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const token = getAuthToken(req)
        const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)

        if (claimsError || !claimsData?.claims?.sub) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { messages, model, temperature } = await req.json()
        const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

        if (!GROQ_API_KEY) {
            console.error("CONFIG_ERROR: GROQ_API_KEY is missing");
            return new Response(JSON.stringify({
                error: "CONFIG_ERROR: API Key is missing on server."
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model || "openai/gpt-oss-120b",
                messages: messages,
                temperature: temperature || 0.7,
            })
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API Error (${response.status}):`, errorText);
            return new Response(JSON.stringify({
                error: `Groq API Error (${response.status})`,
                details: errorText
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 502
            })
        }

        const data = await response.json()
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Edge Function Exec Error:", error.message);
        return new Response(JSON.stringify({
            error: `Edge Function Exec Error: ${error.message}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
