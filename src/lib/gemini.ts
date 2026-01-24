import { OpenRouter } from "@openrouter/sdk";

const OPENROUTER_API_KEY = "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";
const SITE_URL = "http://localhost:5173"; // Localhost for dev
const SITE_NAME = "Prism Classroom";

export async function getGeminiInsight(prompt: string) {
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1-0528:free",
    "nvidia/nemotron-3-nano-30b-a3b:free"
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
      if (model.includes("nemotron") || model.includes("gpt-oss")) {
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
    if (model.includes("nemotron") || model.includes("gpt-oss")) {
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

// AI Risk Assessment for individual student
export async function assessStudentRisk(studentData: {
  name: string;
  checkins: Array<{
    date: string;
    mood: number;
    stress: number;
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
    `[${c.date}] Настроение: ${c.mood}/5, Стресс: ${c.stress}/10, Сон: ${c.sleep}ч, Энергия: ${c.energy}/5, Факторы: ${c.factors.join(', ') || 'нет'}, Комментарий: "${c.comment || 'нет'}"`
  ).join('\n');

  const prompt = `Ты — доброжелательный школьный психолог-аналитик. Твоя задача — оценить уровень психологического риска ученика, НО ты должен быть МЯГКИМ и НЕ паниковать из-за мелочей.

ДАННЫЕ УЧЕНИКА "${studentData.name}":
${checkinsText}

ВАЖНО: Большинство учеников — в норме! Не ищи проблемы там, где их нет.

КРИТЕРИИ ОЦЕНКИ РИСКА (будь мягким!):

🔴 КРИТИЧЕСКИЙ РИСК (8-10 баллов) — ОЧЕНЬ РЕДКО:
- Настроение 1-2 на протяжении 5+ дней подряд
- Комментарии о суициде, самоповреждении, безнадёжности
- Явные признаки буллинга или насилия
- Полный отказ от общения несколько дней

🟠 РИСК (6-7 баллов) — РЕДКО:
- Настроение ≤2 на протяжении 4+ дней подряд
- Серьёзные семейные проблемы в комментариях
- Резкое падение с 5 до 1 без восстановления

🟡 ВНИМАНИЕ (3-5 баллов) — ИНОГДА:
- Настроение 2-3 несколько дней, но есть хорошие дни
- Усталость из-за учёбы (СОР, СОЧ, экзамены) — это НОРМАЛЬНО
- Небольшие колебания настроения — это НОРМАЛЬНО

🟢 НОРМА (0-2 балла) — БОЛЬШИНСТВО УЧЕНИКОВ:
- Настроение 3, 4, 5 — это ВСЁ норма
- Один плохой день — НОРМА
- Два плохих дня — ещё НОРМА
- Стресс из-за учёбы — НОРМА для школьников
- Усталость — НОРМА
- Настроение "так себе" — НОРМА

СТРОГИЕ ПРАВИЛА:
1. Настроение 3/5 — это НОРМА, не риск!
2. Один-два плохих дня — АБСОЛЮТНО НОРМАЛЬНО
3. Стресс из-за СОР/СОЧ — НОРМАЛЬНО, не риск
4. Усталость от учёбы — НОРМАЛЬНО
5. Если нет ЯВНЫХ тревожных сигналов — ставь НОРМУ (0-2)
6. Большинство учеников должны получать статус НОРМА

Не паникуй! Школьники часто устают, и это нормально.

ФОРМАТ ОТВЕТА (строго JSON, без markdown):
{
  "riskLevel": <число от 0 до 10>,
  "status": "<critical|warning|attention|normal>",
  "reason": "<краткое объяснение на русском, 1-2 предложения>"
}

Ответь ТОЛЬКО валидным JSON без лишнего текста.`;

  try {
    const response = await getGeminiInsight(prompt);

    // Parse JSON response
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
  const avgStress = recentCheckins.reduce((sum, c) => sum + c.stress, 0) / recentCheckins.length;

  let riskLevel = 0;
  if (avgMood <= 2) riskLevel += 4;
  else if (avgMood <= 3) riskLevel += 2;
  if (avgStress >= 8) riskLevel += 4;
  else if (avgStress >= 6) riskLevel += 2;

  return {
    isRisk: riskLevel >= 5,
    riskLevel: Math.min(10, riskLevel),
    status: riskLevel >= 8 ? 'critical' : riskLevel >= 5 ? 'warning' : riskLevel >= 3 ? 'attention' : 'normal',
    reason: 'Оценка на основе средних показателей'
  };
}
