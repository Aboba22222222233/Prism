import { supabase } from './supabase';

export async function getGeminiInsight(prompt: string, model: string = "openai/gpt-oss-120b") {
  try {
    console.log("Web calling Edge Function...");
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        model: model,
        messages: [{ role: "user", content: prompt }],
      }
    });

    if (error) {
      console.error("Edge Function Error:", error.message);
      return `Ошибка AI: ${error.message}`;
    }

    if (data?.error) {
      console.error("Provider Error:", data.error);
      return `Ошибка: ${data.error}`;
    }

    return data?.choices?.[0]?.message?.content || "AI молчит...";

  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Сервис временно недоступен";
  }
}

export async function getChatResponse(messages: any[], model?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        model: model || "openai/gpt-oss-120b",
        messages: messages,
      }
    });

    if (error) throw new Error(`Server Error: ${error.message}`);
    if (data?.error) throw new Error(data.error);

    const message = data?.choices?.[0]?.message;
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

// AI Risk Assessment for individual student
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
- 0-4 (НОРМА): Обычное настроение, усталость, лень, стресс от учебы — ЭТО НОРМА.
- 5-6 (ВНИМАНИЕ): Затяжная грусть (> 1 недели), апатия, изоляция.
- 7-8 (РИСК): Симптомы депрессии, сильная тревога.
- 9-10 (КРИТИЧЕСКИ): Суицид.мысли, самоповреждение, критический кризис.
Данные "${studentData.name}":
${checkinsText}
Ответ JSON: {"riskLevel": number, "status": "normal"|"attention"|"warning"|"critical", "reason": "string"}`;

  try {
    // Teacher Analysis uses OpenAI/GPT-OSS model
    const response = await getGeminiInsight(prompt, "openai/gpt-oss-120b");

    // Parse JSON response
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
  } catch (error) {
    console.error('AI Risk Assessment failed:', error);
  }

  // Fallback to rule-based assessment
  const recentCheckins = studentData.checkins.slice(-5);
  const avgMood = recentCheckins.reduce((sum, c) => sum + c.mood, 0) / recentCheckins.length;

  let riskLevel = 0;
  if (avgMood <= 1.5) riskLevel += 4;
  else if (avgMood <= 2.5) riskLevel += 2;

  return {
    isRisk: riskLevel >= 7,
    riskLevel: Math.min(10, riskLevel),
    status: riskLevel >= 9 ? 'critical' : riskLevel >= 7 ? 'warning' : riskLevel >= 5 ? 'attention' : 'normal',
    reason: 'Оценка на основе средних показателей'
  };
}
