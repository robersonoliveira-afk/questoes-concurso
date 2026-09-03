# Questões Concurso — Contexto para o Claude

## Projeto
Motor de classificação de questões de concurso pelo conteúdo do edital, com plano de estudo
priorizado por frequência histórica × dificuldade declarada pelo usuário. Piloto: Politécnico/CTISM
(UFSM). Desenvolvido por Prof. Róberson M. de Oliveira — UFSM (roberson.oliveira@ufsm.br).

Infraestrutura deliberadamente **separada** do AgroCusto (público diferente, não acoplar produção
a protótipo). Os padrões de código (stack, `lib/prisma.ts`, `.gitignore`, convenções) foram
clonados de lá; o banco de dados, o repositório e o deploy são recursos próprios e independentes.

## Stack
- **Next.js 14** (App Router) — TypeScript
- **Prisma ORM 5** — PostgreSQL (Supabase)
- **Tailwind CSS**

## Versão do Next.js — decisão deliberada, diferente do AgroCusto
Usa **Next 15.3.x**, não 14.2.x como o AgroCusto. O `^14.2.0` copiado de lá resolveu para a versão
mais nova da linha (14.2.35) e ainda assim `npm audit` aponta uma lista longa de CVEs — o pacote
`next` do npm agrega avisos de faixas enormes (`9.3.4-canary.0 - 16.3.0-preview.10`), boa parte
deles em recursos que este projeto não usa ainda (next/image, Server Actions, middleware, i18n).
Subir pra 15.x resolve a classe de bug mais relevante aqui (cache poisoning de RSC) sem o salto
maior pra 16.x, que teria risco de quebra maior que o benefício agora. **Reavaliar quando entrar
next/image, Server Actions ou middleware** — é aí que as vulnerabilidades restantes passam a valer
a pena investigar uma por uma. `npm audit fix --force` NÃO deve ser rodado sem revisar — ele
empurra pra 16.x e pra uma versão major nova do eslint-config-next.

## Banco de dados — mesma armadilha do AgroCusto
O pgBouncer (porta 6543) do Supabase pode rejeitar conexão neste tipo de projeto com ENOTFOUND.
Se `npm run db:push` falhar assim, usar o host direto (porta 5432) em `DATABASE_URL` e
`DIRECT_URL`, como já está no `.env.example`.

## Origem dos dados (pipeline)
O schema e o seed foram desenhados em cima da saída real do pipeline em
`../Teste_site_questões/pipeline/` (fatiador de provas + extrator de taxonomia do edital +
classificação manual de Ciências Humanas). Os três arquivos usados pelo seed estão copiados em
`prisma/seed-data/` — para atualizar com uma nova rodada do pipeline, basta recopiar e rodar
`npm run db:seed` de novo (é idempotente, usa upsert).

## Convenção de IDs
IDs do domínio do pipeline (`Concurso`, `Edicao`, `Disciplina`, `Topico`, `Questao`,
`Classificacao`) usam a mesma string estável do pipeline (ex: `"POLI.2025.Q43"`,
`"HIS.T04.S01"`) em vez de `cuid()` — rastreável direto ao arquivo de origem. IDs de dado que
nasce no produto (`User`, `Progresso`, `Tentativa`) são `cuid()`.

## O que ainda falta (na ordem que faz sentido construir)
1. Migrar as telas do protótipo em Artifact (Resumo / Estatística / Meu Plano / Praticar / Banco)
   para páginas reais lendo do Prisma em vez do JSON embutido.
2. Auth (NextAuth) — cadastro de usuário, o que o protótipo em Artifact não tem.
3. Tela de classificação manual (fila filtrável, sem sugestão de LLM por enquanto — Róberson
   classifica direto).
4. Motor de habilidade por tópico (Elo com esquecimento) — hoje o protótipo só tem um tally de
   sessão em `localStorage`, sem persistir nem alimentar a fila de prática.

## Scripts npm
```
npm run dev        # inicia servidor Next.js (porta 3000)
npm run db:push    # sincroniza schema com o banco
npm run db:seed    # popula com os dados reais do pipeline (idempotente)
npm run db:studio  # abre o Prisma Studio — uso pretendido para classificar/corrigir manualmente
npm run build      # build de produção
```
