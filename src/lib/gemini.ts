import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = "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";
const SITE_URL = "http://localhost:5173"; // Localhost for dev
const SITE_NAME = "Ramp Classroom";

export async function getGeminiInsight(prompt: string) {
  const models = [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free"
  ];

  for (const model of models) {
    try {
      console.log(`Trying AI model: ${model}...`);

      const body: any = {
        "model": model,
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      };

      // Enable reasoning for specific models
      if (model.includes("nemotron") || model.includes("mimo") || model.includes("gpt-oss")) {
        body["reasoning"] = { "enabled": true };
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Model ${model} failed (Status ${response.status}):`, errorData);
      }
    } catch (error) {
      console.warn(`Model ${model} network error:`, error);
    }
    // If we're here, the model failed. Wait 1s before trying the next one.
    if (model !== models[models.length - 1]) {
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  return "Извините, все AI сервисы сейчас перегружены. Попробуйте позже.";
}

export async function getChatResponse(messages: any[], model: string) {
  try {
    console.log(`Sending chat to model: ${model}...`);

    // Add reasoning capability if supported
    const body: any = {
      "model": model,
      "messages": messages
    };

    // Enable reasoning for supported models
    if (model.includes("nemotron") || model.includes("mimo") || model.includes("gpt-oss")) {
      body["reasoning"] = { "enabled": true };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) throw new Error("Empty response from AI");

    return {
      content: message.content,
      reasoning: message.reasoning_details || null // Capture reasoning if available
    };

  } catch (error: any) {
    console.error("Chat Request Failed:", error);
    throw error;
  }
}
