import { GoogleGenAI } from '@google/genai';
import { FAQ_SYSTEM_PROMPT } from './dossier';
import { validateSessionFromCookie } from '../lib/auth';

type ChatMessage = {
  sender?: 'user' | 'assistant';
  text?: string;
};

type GroundingSource = {
  title: string;
  uri: string;
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
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const useGoogleSearch = process.env.GEMINI_ENABLE_GOOGLE_SEARCH !== 'false';

    let response: any;
    try {
      response = await generateAssistantResponse(ai, model, contents, useGoogleSearch);
    } catch (error) {
      if (!useGoogleSearch) {
        throw error;
      }

      console.warn('Busca atualizada indisponível; repetindo sem Google Search grounding.', error);
      response = await generateAssistantResponse(ai, model, contents, false);
    }

    const sources = extractGroundingSources(response);
    const text = withSourceFooter(
      sanitizeResponse(response.text || 'Não consegui gerar uma resposta agora.'),
      sources,
    );

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Erro na API /api/chat:', error);
    return res.status(502).json({ error: 'Não foi possível consultar a assistente agora.' });
  }
}

async function generateAssistantResponse(
  ai: GoogleGenAI,
  model: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  useGoogleSearch: boolean,
) {
  return ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: buildSystemInstruction(useGoogleSearch),
      temperature: 0.15,
      topP: 0.75,
      tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
    },
  } as any);
}

function buildSystemInstruction(useGoogleSearch: boolean) {
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  return `${FAQ_SYSTEM_PROMPT}

==================================================
PESQUISA ATUALIZADA, FONTES E ANTI-ALUCINAÇÃO:
==================================================
- DATA DE REFERÊNCIA DA RESPOSTA: ${currentDate}.
- BUSCA ATUALIZADA: ${useGoogleSearch ? 'A ferramenta de Google Search está habilitada. Use-a quando a pergunta envolver notícias recentes, inaugurações, agenda, cargos atuais, obras, valores, endereços, status de projetos, autoria de leis ou fatos que possam ter mudado.' : 'A busca atualizada não está disponível nesta chamada. Responda apenas com base no dossiê canônico e deixe explícito quando não houver confirmação suficiente.'}
- PRIORIDADE DE FONTES: Para fatos atuais, priorize fontes oficiais e institucionais: ALESP, Prefeitura de São Paulo, Diário Oficial, Justiça Eleitoral/TSE, órgãos públicos, site oficial e canais oficiais da Dra. Damaris Moura. Use redes sociais apenas como indício contextual quando não houver fonte institucional melhor.
- REGRA DE OURO: Nunca invente números, datas, cargos, endereços, autoria de lei, status de obra, promessas, votação, relação familiar ou participação em evento.
- SE NÃO SOUBER: Se a informação não estiver confirmada no dossiê canônico nem em fonte atualizada consultada, diga claramente: "Não tenho confirmação segura sobre isso agora." Em seguida, ofereça verificar em fonte oficial ou orientar o usuário a consultar o gabinete/canal oficial.
- SE HOUVER DIVERGÊNCIA: Se fontes ou dados parecerem divergentes, informe que há divergência e não escolha uma versão como verdade sem confirmação.
- DIFERENCIE O GRAU DE CERTEZA: Ao responder, separe naturalmente fatos confirmados de contexto provável. Use expressões como "consta no dossiê", "em fonte oficial consultada" ou "não encontrei confirmação segura".
- PARA TEMAS DE CAMPANHA: Mantenha o tom institucional, mas nunca transforme informação incerta em conquista comprovada.`;
}

function extractGroundingSources(response: any): GroundingSource[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of chunks) {
    const web = chunk?.web || chunk?.retrievedContext;
    const uri = typeof web?.uri === 'string' ? web.uri : '';
    if (!uri || seen.has(uri)) continue;

    seen.add(uri);
    sources.push({
      title: typeof web?.title === 'string' && web.title.trim() ? web.title.trim() : 'Fonte consultada',
      uri,
    });

    if (sources.length >= 3) break;
  }

  return sources;
}

function withSourceFooter(text: string, sources: GroundingSource[]) {
  if (!sources.length) {
    return text;
  }

  const footer = sources
    .map((source) => `• ${source.title}: ${source.uri}`)
    .join('\n');

  return `${text}\n\nFontes consultadas:\n${footer}`;
}

function sanitizeResponse(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
}
