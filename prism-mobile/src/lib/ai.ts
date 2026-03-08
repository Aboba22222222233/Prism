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

        if (error) return "Ошибка AI сервиса";
        if (data.error) return `Ошибка: ${data.error}`;

        return data.choices?.[0]?.message?.content || "AI молчит...";
    } catch {
        return "Сервис временно недоступен";
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
        return { isRisk: false, riskLevel: 0, status: 'normal', reason: 'Нет данных для анализа' };
    }

    const checkinsText = studentData.checkins.map(c =>
        `[${c.date}] Настроение: ${c.mood}/5, Сон: ${c.sleep}ч, Энергия: ${c.energy}/5, Факторы: ${c.factors.join(', ') || 'нет'}, Комментарий: "${c.comment || 'нет'}"`
    ).join('\n');

    const prompt = `Роль: Школьный психолог. Задача: Оценить риск (0-10) для ученика.
Правила:
- 0-4 (НОРМА): Обычное настроение, усталость, лень, стресс от учебы — ЭТО НОРМА.
- 5-6 (ВНИМАНИЕ): Затяжная грусть (> 1 недели), апатия, изоляция.
- 7-8 (РИСК): Симптомы депрессии, сильная тревога.
- 9-10 (КРИТИЧЕСКИ): Суицид.мысли, самоповреждение, критический кризис.
Данные "${studentData.name}":
${checkinsText}
Ответ JSON: {"riskLevel": number, "status": "normal"|"attention"|"warning"|"critical", "reason": "string"}`;

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
                reason: parsed.reason || 'Анализ завершён'
            };
        }
    } catch {
        // AI unavailable
    }

    return { isRisk: false, riskLevel: 0, status: 'normal', reason: 'AI-анализ временно недоступен' };
}
