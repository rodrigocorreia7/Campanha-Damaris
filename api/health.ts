export default function handler(_req: any, res: any) {
  return res.status(200).json({
    status: 'ok',
    candidate: 'Dra. Damaris Moura',
    canonicalVersion: '2.0 (RAG-Optimized)',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}
