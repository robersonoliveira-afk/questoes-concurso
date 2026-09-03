# Questões Concurso — Contexto para o Claude

## Projeto
Motor de classificação de questões de concurso pelo conteúdo do edital, com plano de estudo
priorizado por frequência histórica × dificuldade declarada pelo usuário. Piloto: Politécnico/CTISM
(UFSM). Desenvolvido por Prof. Róberson M. de Oliveira — UFSM (roberson.oliveira@ufsm.br).

Infraestrutura deliberadamente **separada** do AgroCusto (público diferente, não acoplar produção
a protótipo). Os padrões de código (stack, `lib/prisma.ts`, `.gitignore`, convenções) foram
clonados de lá; o banco de dados, o repositório e o deploy são recursos próprios e independentes.

## Stack
- **Next.js 15.3.x** (App Router) — TypeScript
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

## Banco de dados — NÃO é a mesma armadilha do AgroCusto
Testei bastante pra conectar de verdade e a causa aqui foi outra (documentando pra não repetir
a investigação):

1. **O host direto (`db.<projeto>.supabase.co`) só resolve em IPv6**, e a rede da UFSM/Politécnico
   não tem rota IPv6 — a conexão nem chega a tentar, falha na resolução de endereço.
2. Por isso o caminho é sempre o **pooler** (Supavisor): `aws-0-<região>.pooler.supabase.com`,
   usuário `postgres.<ref-do-projeto>` (não `postgres` puro).
3. **A região do projeto pode não ser a que você pediu ao criar** — confirme em Project Settings →
   General → Region antes de montar a string. Errar a região dá `tenant/user ... not found` no
   pooler (TCP conecta, mas ele não reconhece o projeto).
4. **`sslmode=require` é obrigatório na query string.** Sem isso, a conexão trava e falha com
   "Can't reach database server" — mensagem idêntica à de host/porta errados, o que engana. Foi
   isso, não a porta, que causou a maior parte do tempo perdido aqui.
5. A porta 6543 (pooler, modo transação) conectava por TCP mas o protocolo Postgres nunca
   completava — pode ser filtro da rede da UFSM nessa porta especificamente, ou pode ter sido só
   sintoma do problema 4 acima (não ficou 100% isolado). **Rodando local, atrás dessa rede, use
   5432 (modo sessão) nas duas variáveis.** Na Vercel — rede diferente, sem essa restrição — a
   combinação padrão do Supabase deve funcionar (6543+pgbouncer para `DATABASE_URL`, 5432 para
   `DIRECT_URL`); se der o mesmo erro lá, o suspeito é a 6543 de novo, não SSL.

String que funcionou daqui (não é segredo — a senha fica só no `.env`, nunca aqui):
```
postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres?sslmode=require
```

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

## Identidade visual — decisão deliberada
Escuro por padrão (não claro/escuro alternável — decisão única, pensada pra sessão de estudo à
noite, que é como um estudante de 15 anos realmente usa isso). Fredoka (display, arredondada,
enérgica) + Lexend (corpo — desenhada especificamente pra facilitar leitura, escolha ligada ao
conteúdo: são enunciados longos) + JetBrains Mono (números/tags). Cor com função, não decoração:
`brand` (violeta) é a marca/CTA, `xp` (dourado) é progresso, `certo` (verde-água) e `errado`
(coral) são o feedback do quiz — nunca usar `errado`/`certo` como se fossem a cor de marca.
Dificuldade é escolhida em círculos tocáveis 1-10, não slider (mais preciso no dedo/celular que
o thumb minúsculo de um `<input type=range>`).

## Sessão sem login
Ainda não tem cadastro. `middleware.ts` dá um cookie `uid` (UUID aleatório) pra todo visitante
novo; a linha `User` correspondente só é criada na primeira escrita real (`lib/session.ts` →
`garantirUsuario`), via upsert. Isso já é suficiente pra testar dificuldade/tempo/progresso
por pessoa, em navegadores diferentes, sem exigir tela de cadastro. Quando entrar NextAuth de
verdade, a migração é: trocar a origem do `userId` (hoje vem do cookie `uid`) pela sessão do
NextAuth — o resto (Progresso, Tentativa, Server Actions) não muda.

## O que ainda falta (na ordem que faz sentido construir)
1. ~~Migrar as telas do protótipo em Artifact para páginas reais lendo do Prisma~~ — feito
   (`/`, `/configurar`, `/estudar`, `/questoes`). `lib/estatistica.ts` é a mesma lógica de
   `pipeline/stats_ch.py` (Dirichlet + recência), agora recalculada ao vivo a cada carregamento.
2. Auth de verdade (NextAuth) — trocar o cookie `uid` anônimo por cadastro/login real.
3. Tela de classificação manual (fila filtrável, sem sugestão de LLM por enquanto — Róberson
   classifica direto).
4. Motor de habilidade por tópico (Elo com esquecimento) — hoje `Progresso.acertos/tentativasN`
   só acumula bruto; falta o ajuste que sobe/desce a dificuldade estimada por resposta e decai
   com o tempo sem revisar.
5. Fila de prática hoje só cobre Ciências Humanas (as únicas classificadas) e só entram questões
   com gabarito confirmado no PDF (14 do banco atual) — cresce junto com o que for classificado.

## Scripts npm
```
npm run dev        # inicia servidor Next.js (porta 3000)
npm run db:push    # sincroniza schema com o banco
npm run db:seed    # popula com os dados reais do pipeline (idempotente)
npm run db:studio  # abre o Prisma Studio — uso pretendido para classificar/corrigir manualmente
npm run build      # build de produção
```
