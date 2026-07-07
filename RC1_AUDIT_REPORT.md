# RC1 — Audit Report
# Finanças do Casal — Release Candidate 1

**Data:** 2026-06-29  
**Auditor:** Tech Lead / Staff Engineer  
**Escopo:** Sprint 1 + Sprint 2 completas  
**Status:** ⛔ NÃO PRONTO PARA PRODUÇÃO — correções obrigatórias antes da Sprint 3

---

## 1. Resumo Executivo

O projeto possui arquitetura sólida e cobertura funcional ampla, mas apresenta **9 problemas críticos** que impedem instalação limpa, além de **7 problemas de média gravidade** e **5 melhorias** identificadas. Nenhum arquivo pode ser entregue ao usuário final no estado atual.

---

## 2. Inventário de Arquivos

| Camada | Arquivos | Status |
|--------|----------|--------|
| Backend models | 2 | ✅ |
| Backend repositories | 8 | ✅ |
| Backend services | 10 | ⚠️ 2 com bugs |
| Backend controllers | 9 | ✅ |
| Backend routes | 9 | ✅ |
| Backend utils | 2 | ✅ |
| Prisma schema | 1 | ✅ |
| Prisma migrations | 0 | ⛔ AUSENTE |
| Prisma seed | 1 | ⛔ 3 bugs |
| Frontend pages | 12 | ⚠️ 1 bug |
| Frontend components | 14 | ⚠️ 1 bug |
| Frontend hooks | 8 | ✅ |
| Frontend services | 8 | ✅ |
| Frontend types | 1 | ⛔ valor errado |
| Frontend stores | 2 | ✅ |
| Frontend router | 1 | ✅ |
| README | 1 | ⛔ desatualizado |
| package.json (backend) | 1 | ⛔ script `db` ausente |

---

## 3. Problemas Críticos (bloqueiam instalação)

### C1 — Migrations ausentes ⛔ BLOQUEADOR
**Arquivo:** `backend/prisma/migrations/` (diretório inexistente)  
**Impacto:** `npm run db:migrate` falha em máquina limpa sem histórico.  
**Correção:** Gerar migration inicial com `prisma migrate dev --name init`.

### C2 — Script `db` ausente no package.json ⛔ BLOQUEADOR
**Arquivo:** `backend/package.json`  
**Impacto:** O README instrui `npm run db` 3 vezes (generate, migrate, seed), mas o script não existe.  
**Correção:** Adicionar script composto `"db": "prisma generate && prisma migrate deploy && tsx prisma/seed.ts"` e um `"db:setup"` para dev.

### C3 — Diretórios com chaves no nome ⛔ CORRUPÇÃO
**Arquivos:**  
- `/home/claude/financas-do-casal/{backend,frontend}/` (vazio, inócuo mas sujo)  
- `/home/claude/financas-do-casal/frontend/src/{components/` (vazio)  
- `/home/claude/financas-do-casal/backend/{src/` (vazio)  
**Impacto:** Foram criados por expansão de brace incorreta no mkdir. Vazios mas indicam processo de build corrompido.  
**Correção:** Remover.

### C4 — "Esposa" hardcoded em todo o projeto ⛔ REQUISITO DE NEGÓCIO
**Arquivos afetados (9):**
- `backend/prisma/seed.ts` — linhas 17–346 (name, variáveis, IDs, comentários)
- `backend/src/models/types.ts` — linha 5 (UserName type)
- `frontend/src/types/index.ts` — linha 5 (UserName type)
- `frontend/src/components/charts/UserBarChart.tsx` — linhas 63, 82
- `README.md` — linhas 26, 34, 40, 210, 457, 679  
**Correção:** Substituir `"Esposa"` por `"Carol"` em todos os arquivos.

### C5 — Seed usa categoria de receita para despesa ⛔ DADO INCORRETO
**Arquivo:** `backend/prisma/seed.ts` linhas 191, 223, 235  
**Problema:** Academia (`rec-gym`), Salário Junho (Yves) e Salário Junho (Esposa) usam `catSalario` como categoria — que é tipo `income` — mas os lançamentos de salário são receita (correto) e a academia é despesa (categoria errada: deveria ser `catLazer` ou `catSaude`).  
**Correção:** Academia → `catSaude.id`. Salários já estão com type `income`, isso está correto.

### C6 — TypeScript strict: `addPeriod` importado e não usado ⛔ BUILD QUEBRADO
**Arquivos:**
- `backend/src/services/simulation.service.ts` linha 9
- `backend/src/services/dashboard.service.ts` linha 22  
**Impacto:** `npm run build` falha com `noUnusedLocals: true`.  
**Correção:** Remover `addPeriod` dos imports.

### C7 — Badge usado com prop `style` inexistente ⛔ TYPE ERROR
**Arquivo:** `frontend/src/pages/AlertsPage.tsx` linha 38  
**Problema:** `<Badge style={{...}}>` — interface `BadgeProps` não aceita `style`.  
**Correção:** Usar `className` com `inline-flex items-center` e cor via Tailwind ou adicionar `style?: React.CSSProperties` ao BadgeProps.

### C8 — Variável `_` usada sem prefixo no try/catch ⛔ LINTING
**Arquivos:** `SimpleTransactionForm.tsx`, `InstallmentForm.tsx`  
**Problema:** `} catch (_) {}` — em TypeScript strict, variável de catch deve ser tipada ou usar `catch {}` (TS 4.0+).  
**Correção:** Mudar para `} catch { /* error handled by mutation.error */ }`.

### C9 — `catSalario` nulo não tratado em seed (linha 191 - gym) ⛔ RUNTIME ERROR
**Arquivo:** `backend/prisma/seed.ts` linha 191  
**Problema:** `catSalario` é tipo `income`, mas `rec-gym` é despesa e usa `catSalario.id`. Categorias `income` não têm `type: expense`, então filtros de categoria em formulários de despesa não mostrarão "Salário" — a FK é válida mas semanticamente errada.  
**Correção:** Usar `catSaude.id` para Academia.

---

## 4. Problemas de Média Gravidade

### M1 — README com comandos errados
Instrui `npm run db` 3 vezes mas script não existe. Instrui `npm run db:migrate` que pede interação (nome da migration). Precisa de fluxo completo documentado.

### M2 — `.env` commitado com valor real
`backend/.env` está presente no repositório com `DATABASE_URL="file:./dev.db"`. Deve estar no `.gitignore`.

### M3 — Nenhum `.gitignore` no projeto
Sem `.gitignore`, `node_modules/`, `dist/`, `*.db`, `.env` seriam todos commitados.

### M4 — `vite.config.ts` usa `path` sem `@types/node` declarado no frontend
`frontend/package.json` não tem `@types/node` mas `vite.config.ts` faz `import path from "path"`.

### M5 — `tsconfig.node.json` sem `"strict": true`
Inconsistência entre rigor do backend e frontend.

### M6 — Ícones duplicados na sidebar
`/installments` e `/credit-cards` usam o mesmo ícone `CreditCard`. `/annual` e `/cashflow` usam o mesmo `TrendingUp`. Confuso visualmente.

### M7 — `db:migrate` usa modo `dev` (interativo) em vez de `deploy`
`"db:migrate": "prisma migrate dev"` pede nome da migration interativamente. Para script automatizável, `migrate dev --name latest` ou usar `migrate deploy` após migrations geradas.

---

## 5. Melhorias Identificadas

### I1 — Falta `prisma` no campo `seed` do package.json
Prisma recomenda: `"prisma": { "seed": "tsx prisma/seed.ts" }` para `prisma db seed` funcionar automaticamente.

### I2 — Sem tratamento de CORS para múltiplos origins
`FRONTEND_URL` aceita apenas um valor. Em desenvolvimento pode querer `localhost:5173` e `localhost:4173`.

### I3 — Sem validação de variáveis de ambiente no startup
Se `DATABASE_URL` ou `PORT` estiverem incorretos, o erro é obscuro. Usar Zod ou verificação explícita.

### I4 — Frontend sem `vite-plugin-checker` para type-check em dev
Erros de TypeScript não aparecem no browser durante desenvolvimento.

### I5 — Sem `engines` field no package.json
Não especifica versão mínima de Node.js (>=18).

---

## 6. Análise de Arquitetura

### O que está bem
- Controller → Service → Repository → Prisma é consistente em todas as 10 entidades
- Zod valida 100% das entradas HTTP
- Singleton do PrismaClient corretamente implementado
- React Query com invalidação correta em mutations
- Zustand com persist para auth
- Separação clara pages/components/hooks/services/stores/types

### Riscos arquiteturais
- **Sem transactions de banco:** TransactionService cria múltiplos registros (parcelamento com N parcelas) sem `prisma.$transaction()`. Se um insert falhar no meio, o banco fica inconsistente.
- **Cálculo de saldo de conta bancária:** `updateBalance` é chamado no service mas não está protegido por transaction, podendo dessincronizar em falhas.
- **AlertService.runAlertScan()** é chamado manualmente — sem job periódico no servidor. Alertas dependem do usuário clicar "Verificar".

---

## 7. Plano de Correção (ordem de execução)

1. Remover diretórios corrompidos (C3)
2. Renomear "Esposa" → "Carol" em todos os arquivos (C4)
3. Corrigir seed: categoria da Academia (C5/C9)
4. Corrigir imports não utilizados no backend (C6)
5. Corrigir Badge com style prop (C7)
6. Corrigir catch vazio (C8)
7. Adicionar scripts `db` e `db:setup` no package.json (C2)
8. Gerar migrations iniciais (C1)
9. Adicionar `.gitignore` (M3)
10. Corrigir ícones duplicados na sidebar (M6)
11. Adicionar `@types/node` ao frontend (M4)
12. Atualizar README completamente (M1)
13. Iniciar Sprint 3

---

## 8. Inventário de Referências "Esposa" → "Carol"

| Arquivo | Linha(s) | Tipo |
|---------|----------|------|
| `backend/prisma/seed.ts` | 17,19,89,94,121,192,236,274,346 | Dados/variáveis |
| `backend/src/models/types.ts` | 5 | Tipo TypeScript |
| `frontend/src/types/index.ts` | 5 | Tipo TypeScript |
| `frontend/src/components/charts/UserBarChart.tsx` | 63, 82 | UI string |
| `README.md` | 26,34,40,210,457,679 | Documentação |

**Total: 5 arquivos, ~20 ocorrências.**


---

## 9. Status de Resolução

**Todas as correções da Etapa 2 foram aplicadas e verificadas:**

| # | Problema | Status |
|---|----------|--------|
| C1 | Migrations ausentes | ✅ Resolvido — `20240101000000_init` + `20240102000000_sprint3` criadas, validadas campo a campo contra `schema.prisma` |
| C2 | Script `db` ausente | ✅ Resolvido — `db`, `db:setup`, `db:migrate:prod` adicionados |
| C3 | Diretórios corrompidos | ✅ Resolvido — removidos, verificado ausência de `{`/`}` em todo o projeto |
| C4 | "Esposa" hardcoded | ✅ Resolvido — renomeado para "Carol" em 5 arquivos, ~20 ocorrências |
| C5/C9 | Seed com categoria errada | ✅ Resolvido — Academia agora usa `catSaude` |
| C6 | Imports não usados (backend) | ✅ Resolvido — verificado com varredura automatizada, 0 ocorrências restantes |
| C7 | Badge com `style` prop | ✅ Resolvido — substituído por `span` nativo em AlertsPage |
| C8 | `catch (_) {}` vazio | ✅ Resolvido — comentário explicativo adicionado |
| M1 | README desatualizado | ✅ Resolvido — reescrito do zero na Etapa 2 |
| M2/M3 | `.env` sem `.gitignore` | ✅ Resolvido — `.gitignore` criado |
| M4 | `@types/node` ausente no frontend | ✅ Resolvido |
| M6 | Ícones duplicados na sidebar | ✅ Resolvido — todos os 17 itens com ícones únicos |
| M7 | `db:migrate` interativo | ✅ Resolvido — fluxo `db:setup`/`db` não-interativo para produção |

**Verificações adicionais realizadas após a Sprint 3:**
- Varredura completa de imports não utilizados em 100% dos arquivos `.ts`/`.tsx` (frontend + backend) — 0 ocorrências
- Validação cruzada rotas → métodos de controller — 100% consistente
- Validação cruzada construtores de serviço → instanciação nas rotas — 100% consistente
- Validação campo a campo `schema.prisma` → `migration.sql` para todas as 12 tabelas — 100% idêntico
- Confirmação de que nenhuma referência a "Esposa" permanece fora deste relatório de auditoria

**Conclusão:** Projeto liberado para prosseguir com testes de instalação em máquina limpa (Etapa 3).
