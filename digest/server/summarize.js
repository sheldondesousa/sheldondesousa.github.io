const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are a concise research assistant for a senior Product Manager interested in learning more about AI and staying current on AI developments. ' +
  'Summarize this article in 3-4 sentences. Focus on: the key insight, why it matters, ' +
  'and any implication for product teams. Be direct — no filler phrases.';

async function summarizeArticle(title, content) {
  const text = content ? content.slice(0, 8000) : title;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${text}`,
      },
    ],
  });

  return message.content[0].text.trim();
}

module.exports = { summarizeArticle };
