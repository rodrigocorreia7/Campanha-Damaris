import { GoogleGenAI } from '@google/genai';
import { FAQ_SYSTEM_PROMPT } from './dossier';
import { validateSessionFromCookie } from '../lib/auth';

type ChatMessage = {
  sender?: 'user' | 'assistant';
  text?: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const validSession = await validateSessionFromCookie(req.headers.cookie || null);
  if (!validSession) {
    return res.status(401).json({ error: 'Acesso privado. Faça login para conversar com a assistente.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const history = Array.isArray(body.history) ? body.history : [];
  const apiKey = process.env.GEMINI_API_KEY;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
  }

  try {
    const contents = history
      .slice(-6)
      .filter((item: ChatMessage) => item && typeof item.text === 'string')
      .map((item: ChatMessage) => ({
        role: item.sender === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.text as string }],
      }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction: FAQ_SYSTEM_PROMPT,
        temperature: 0.3,
        topP: 0.9,
      },
    });

    const text = sanitizeResponse(response.text || 'Não consegui gerar uma resposta agora.');
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Erro na API /api/chat:', error);
    return res.status(502).json({ error: 'Não foi possível consultar a assistente agora.' });
  }
}

function sanitizeResponse(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
}
