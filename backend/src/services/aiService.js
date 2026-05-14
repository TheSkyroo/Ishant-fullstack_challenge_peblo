const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.SAMBANOVA_API_KEY,
  baseURL: 'https://api.sambanova.ai/v1',
});

const MODEL = process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.3-70B-Instruct';

async function generateNoteInsights(title, content) {
  const prompt = `Analyse the following note and return a JSON object with exactly these fields:
- "summary": a concise 2-3 sentence summary of the note content
- "actionItems": an array of strings, each being a clear, actionable task extracted from the note (empty array if none found)
- "suggestedTitle": a short, descriptive title for this note (use the existing title if it is already good)

Note Title: ${title || 'Untitled'}
Note Content:
${content || '(empty)'}

Respond ONLY with valid JSON. No markdown, no explanation.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that analyses notes and extracts structured information. Always respond with valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 600,
  });

  const raw = response.choices[0].message.content.trim();

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    summary: parsed.summary || '',
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    suggestedTitle: parsed.suggestedTitle || title || 'Untitled Note',
    generatedAt: new Date(),
  };
}

module.exports = { generateNoteInsights };
