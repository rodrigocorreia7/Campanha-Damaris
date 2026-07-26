# Como publicar no Vercel

## Qual pasta usar

No Vercel, use a própria pasta `campanha e assistente` como **Root Directory**. Ela já contém somente o que deve ficar público:

- `index.html`: landing page;
- `styles.css` e `app.js`: estilos e interações;
- imagens da campanha;
- `assistente/`: aplicativo completo do assistente.

Os documentos, PDFs, planilhas e arquivos de desenvolvimento continuam preservados na pasta original `campanha`, fora deste pacote de publicação.

## Opção recomendada: GitHub + Vercel

1. Crie um repositório no GitHub.
2. Envie o conteúdo da pasta `campanha e assistente` para esse repositório.
3. No Vercel, clique em **New Project** e importe o repositório.
4. Em **Root Directory**, mantenha a raiz (`./`).
5. Use **Other** como framework e deixe o comando de build vazio.
6. Clique em **Deploy**.

Depois, teste:

- `/` para a landing;
- `/assistente/` para o assistente completo.

## Opção pelo terminal

Abra o terminal dentro da raiz do repositório e execute:

```powershell
npm.cmd install -g vercel
vercel
```

Para publicar diretamente em produção:

```powershell
vercel --prod
```

## Importante sobre a IA

O frontend do assistente está em `assistente/` e a função real da API está em `api/chat.ts`. Configure `GEMINI_API_KEY` no ambiente **Production** do Vercel e faça um novo redeploy. Nunca coloque essa chave dentro do HTML ou do JavaScript público. Para verificar a API, acesse `/api/health` e confirme `hasApiKey: true`.
