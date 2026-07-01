# Roadmap — Finanças do Casal

Estado atual e direções futuras do projeto.

---

## Estado Atual (v3.0.0 — Sprint 3)

### Funcionalidades completas e em produção

| Funcionalidade | Status |
|---|---|
| Receitas e despesas | ✅ |
| Parcelamentos automáticos | ✅ |
| Cartões de crédito | ✅ |
| Contas bancárias | ✅ |
| Transferências entre contas | ✅ |
| Contas fixas / Recorrências | ✅ |
| Alertas automáticos | ✅ |
| Dashboard mensal | ✅ |
| Dashboard executivo | ✅ |
| Resumo anual | ✅ |
| Fluxo de caixa (24 meses) | ✅ |
| Calendário financeiro | ✅ |
| Índice de saúde financeira | ✅ |
| Assistente financeiro | ✅ |
| Projeção financeira (6–36 meses) | ✅ |
| Simulador financeiro | ✅ |
| Comparador de cenários | ✅ |
| Objetivos financeiros | ✅ |
| Reserva de emergência | ✅ |
| Importação bancária (OFX/CSV) | ✅ |
| Linha do tempo financeira | ✅ |

---

## Sprint 4 — Possíveis próximas funcionalidades

### Alta prioridade

- **Relatórios exportáveis** — PDF e Excel para: extrato mensal/anual, resumo de cartões, fluxo de caixa, objetivos. (Especificado na Sprint 3 mas postergado para Sprint 4.)
- **Notificações automáticas** — job de varredura de alertas rodando automaticamente em intervalos configuráveis, sem necessidade de clique manual.
- **Backup e restauração do banco** — exportar/importar o arquivo SQLite ou um dump JSON completo via interface.

### Média prioridade

- **Modo Casal no Dashboard Executivo** — visão consolidada com comparativo lado a lado Yves × Carol para todos os indicadores executivos.
- **Categorias personalizadas** — CRUD de categorias com ícone e cor configuráveis pelo usuário.
- **Histórico de saúde financeira** — persistir o índice de saúde diariamente para exibir evolução ao longo do tempo.
- **Integração com Open Finance** — consumir APIs de bancos via padrão Open Banking Brasil (quando disponível para pessoas físicas).

### Baixa prioridade / Exploratório

- **App mobile (React Native)** — compartilha a mesma API backend; foco em registro rápido de despesas.
- **Modo escuro** — toggle de tema no perfil do usuário.
- **Múltiplas moedas** — suporte a investimentos em USD/EUR com cotação automática.
- **Integração com corretoras** — importação de posições de investimentos (B3, fundos).

---

## Débito técnico identificado

- **Transações de banco** — `TransactionService.createInstallment` cria N registros em um loop sem `prisma.$transaction()`. Uma falha no meio deixa o banco inconsistente. Candidato a correção na Sprint 4.
- **Testes automatizados** — zero cobertura de testes atualmente. Sprint 4 deveria incluir ao menos testes unitários dos services críticos (parcelamento, saúde financeira, importação bancária).
- **Autenticação real** — o sistema usa seleção de usuário sem senha, intencional por design. Mas se eventualmente for hospedado em rede pública, seria necessário adicionar autenticação (JWT ou session-based).
- **Rate limiting** — a API não tem rate limiting; se exposta à internet, um middleware como `express-rate-limit` deveria ser adicionado.
