


import { supabase } from './supabase';

// HARDCODED DEMO KEY (GROQ)
const GROQ_API_KEY = "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";

export async function getGeminiInsight(prompt: string, model: string = "openai/gpt-oss-120b") {
    try {
        console.log("Mobile calling Groq directly...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model, // Should be openai/gpt-oss-120b
                messages: [{ role: "user", content: prompt }],
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Groq Error:", err);
            return `Ошибка AI: ${err}`;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "AI молчит...";

    } catch (error) {
        console.error("AI Insight Error:", error);
        return "Сервис временно недоступен";
    }
}

export async function getChatResponse(messages: any[], model?: string) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model || "openai/gpt-oss-120b",
                messages: messages,
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq Error: ${err}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        if (!message) throw new Error("Empty response");

        return {
            content: message.content,
            reasoning: null
        };
    } catch (error) {
        console.error("Chat Error:", error);
        throw error;
    }
}

// AI Risk Assessment for individual student (Synced with Web)
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
    riskLevel: number; // 0-10
    status: 'critical' | 'warning' | 'attention' | 'normal';
    reason: string;
}> {
    if (!studentData.checkins || studentData.checkins.length === 0) {
        return {
            isRisk: false,
            riskLevel: 0,
            status: 'normal',
            reason: 'Нет данных для анализа'
        };
    }

    const checkinsText = studentData.checkins.map(c =>
        `[${c.date}] Настроение: ${c.mood}/5, Сон: ${c.sleep}ч, Энергия: ${c.energy}/5, Факторы: ${c.factors.join(', ') || 'нет'}, Комментарий: "${c.comment || 'нет'}"`
    ).join('\n');

    const prompt = `Роль: Школьный психолог. Задача: Оценить риск (0-10) для ученика.
Правила:
- 0-2 (НОРМА): Обычное настроение, усталость, стресс от учебы.
- 3-5 (ВНИМАНИЕ): Частая грусть.
- 6-7 (РИСК): Депрессия 5+ дней.
- 8-10 (КРИТИЧЕСКИ): Суицид.мысли, самоповреждение.
Данные "${studentData.name}":
${checkinsText}
Ответ JSON: {"riskLevel": number, "status": "normal"|"attention"|"warning"|"critical", "reason": "string"}`;

    try {
        // Teacher Analysis uses OpenAI/GPT-OSS model
        const response = await getGeminiInsight(prompt, "openai/gpt-oss-120b:free");

        // Parse JSON response key-value pair
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                isRisk: parsed.riskLevel >= 5,
                riskLevel: Math.min(10, Math.max(0, parsed.riskLevel)),
                status: parsed.status || (parsed.riskLevel >= 8 ? 'critical' : parsed.riskLevel >= 5 ? 'warning' : parsed.riskLevel >= 3 ? 'attention' : 'normal'),
                reason: parsed.reason || 'Анализ завершён'
            };
        }
    } catch (error) {
        console.error('AI Risk Assessment failed:', error);
    }

    // Fallback to rule-based assessment
    const recentCheckins = studentData.checkins.slice(-5);
    const avgMood = recentCheckins.reduce((sum, c) => sum + c.mood, 0) / recentCheckins.length;

    let riskLevel = 0;
    if (avgMood <= 2) riskLevel += 4;
    else if (avgMood <= 3) riskLevel += 2;

    return {
        isRisk: riskLevel >= 5,
        riskLevel: Math.min(10, riskLevel),
        status: riskLevel >= 8 ? 'critical' : riskLevel >= 5 ? 'warning' : riskLevel >= 3 ? 'attention' : 'normal',
        reason: 'Оценка на основе средних показателей'
    };
}
