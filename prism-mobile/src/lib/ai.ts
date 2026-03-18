import { supabase } from './supabase';

const DEFAULT_MODEL = "openai/gpt-oss-120b";

export async function getGeminiInsight(prompt: string, model: string = DEFAULT_MODEL) {
    try {
        const { data, error } = await supabase.functions.invoke('chat-ai', {
            body: {
                messages: [{ role: "user", content: prompt }],
                model,
            }
        });

        if (error) return "AI service error";
        if (data.error) return `Error: ${data.error}`;

        return data.choices?.[0]?.message?.content || "No AI response.";
    } catch {
        return "The service is temporarily unavailable.";
    }
}

export async function getChatResponse(messages: any[], model?: string) {
    const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
            messages,
            model: model || DEFAULT_MODEL,
        }
    });

    if (error) throw new Error(`Edge Function Error: ${error.message}`);
    if (data.error) throw new Error(data.error);

    const message = data.choices?.[0]?.message;
    if (!message) throw new Error("Empty response");

    return {
        content: message.content,
        reasoning: null
    };
}

export async function assessStudentRisk(studentData: {
    name: string;
    checkins: Array<{
        date: string;
        mood: number;
        sleep: number;
        energy: number;
        factors: string[];
        comment: string;
    }>;
}): Promise<{
    isRisk: boolean;
    riskLevel: number;
    status: 'critical' | 'warning' | 'attention' | 'normal';
    reason: string;
}> {
    if (!studentData.checkins || studentData.checkins.length === 0) {
        return { isRisk: false, riskLevel: 0, status: 'normal', reason: 'No data available for analysis.' };
    }

    const checkinsText = studentData.checkins.map(c =>
        `[${c.date}] Mood: ${c.mood}/5, Sleep: ${c.sleep}h, Energy: ${c.energy}/5, Factors: ${c.factors.join(', ') || 'none'}, Comment: "${c.comment || 'none'}"`
    ).join('\n');

    const prompt = `Role: School counselor. Task: assess the student's risk level from 0 to 10.
Rules:
- 0-4 (NORMAL): ordinary mood changes, tiredness, laziness, and study stress are normal.
- 5-6 (ATTENTION): prolonged sadness for more than one week, apathy, withdrawal.
- 7-8 (RISK): depression symptoms, strong anxiety.
- 9-10 (CRITICAL): suicidal thoughts, self-harm, or an acute crisis.
Data for "${studentData.name}":
${checkinsText}
Return JSON: {"riskLevel": number, "status": "normal"|"attention"|"warning"|"critical", "reason": "string"}`;

    try {
        const response = await getGeminiInsight(prompt, DEFAULT_MODEL);
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const rawRisk = Number(parsed.riskLevel);
            const safeRisk = isNaN(rawRisk) ? 0 : Math.min(10, Math.max(0, rawRisk));

            return {
                isRisk: safeRisk >= 7,
                riskLevel: safeRisk,
                status: parsed.status || (safeRisk >= 9 ? 'critical' : safeRisk >= 7 ? 'warning' : safeRisk >= 5 ? 'attention' : 'normal'),
                reason: parsed.reason || 'Analysis completed.'
            };
        }
    } catch {
        // AI unavailable
    }

    return { isRisk: false, riskLevel: 0, status: 'normal', reason: 'AI analysis is temporarily unavailable.' };
}
