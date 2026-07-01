# 💑 Finanças do Casal

Sistema financeiro pessoal e conjugal para **Yves** e **Carol**.

Controle de receitas, despesas, parcelamentos, cartões de crédito, contas bancárias, contas fixas, objetivos financeiros, projeção de 36 meses, linha do tempo, simulador, importação bancária e muito mais.

---

## Sumário

- [Requisitos](#requisitos)
- [Instalação do Zero](#instalação-do-zero)
- [Comandos disponíveis](#comandos-disponíveis)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Páginas do sistema](#páginas-do-sistema)
- [Build para produção](#build-para-produção)
- [Deploy](#deploy)

---

## Requisitos

- **Node.js** >= 18.x  
- **npm** >= 9.x  
- Sistema operacional: Windows, macOS ou Linux

Não requer Docker, PostgreSQL, Redis ou qualquer serviço externo.

---

## Instalação do Zero

Execute cada bloco abaixo **em ordem**, sem pular etapas.

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/financas-do-casal.git
cd financas-do-casal
```

### 2. Backend — instalar e configurar

```bash
cd backend

# Instala todas as dependências
npm install

# Copia o arquivo de variáveis de ambiente
cp .env.example .env

# Configura o banco de dados (3 etapas em 1 comando):
# 1. Gera o Prisma Client
# 2. Executa as migrations (cria o banco SQLite)
# 3. Executa o seed (usuários, categorias, dados de exemplo)
npm run db

# Inicia o servidor de desenvolvimento
npm run dev
```

O backend estará disponível em `http://localhost:3333`.

> **Verificação:** abra `http://localhost:3333/health` no navegador. Deve retornar `{"status":"ok"}`.

### 3. Frontend — instalar e iniciar (segundo terminal)

```bash
cd frontend

# Instala todas as dependências
npm install

# Copia o arquivo de variáveis de ambiente
cp .env.example .env

# Inicia o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

> **Verificação:** acesse `http://localhost:5173` no navegador. A tela de seleção de usuário deve aparecer.

### 4. Primeiro acesso

Na tela inicial, clique em **"Entrar como Yves"** ou **"Entrar como Carol"**. O sistema abrirá o Dashboard com dados de exemplo pré-carregados pelo seed.

---

## Comandos disponíveis

### Backend (`backend/`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia servidor com hot reload (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa o build de produção |
| `npm run db` | Setup completo: generate + migrate deploy + seed |
| `npm run db:generate` | Gera o Prisma Client a partir do schema |
| `npm run db:migrate:prod` | Executa migrations pendentes (sem seed, para produção) |
| `npm run db:seed` | Executa apenas o seed |
| `npm run db:studio` | Abre o Prisma Studio (interface visual do banco) |
| `npm run db:reset` | ⚠️ Reseta o banco e recria tudo do zero |

### Frontend (`frontend/`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento (Vite, porta 5173) |
| `npm run build` | Compila para produção em `dist/` |
| `npm run preview` | Pré-visualiza o build de produção localmente |

---

## Variáveis de ambiente

### Backend — `backend/.env`

```env
NODE_ENV=development
PORT=3333
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://localhost:5173
```

| Variável | Padrão | Descrição |
|---|---|---|
| `NODE_ENV` | `development` | Modo da aplicação. Em produção: `production`. |
| `PORT` | `3333` | Porta do servidor Express. |
| `DATABASE_URL` | `file:./dev.db` | Caminho do arquivo SQLite. Em produção, use um caminho absoluto e persistente, ex: `file:/var/data/financas.db`. |
| `FRONTEND_URL` | `http://localhost:5173` | URL do frontend. Usada para configurar o CORS. |

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:3333/api
```

> Em desenvolvimento, o Vite já faz proxy de `/api` para `http://localhost:3333` via `vite.config.ts`, então `VITE_API_URL` é opcional em dev. Configure-o apenas em produção.

---

## Estrutura do projeto

```
financas-do-casal/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Definição de todas as 12 tabelas
│   │   ├── seed.ts                 # Dados iniciais (usuários, categorias, exemplos)
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       ├── 20240101000000_init/    # Sprint 1 + 2: 9 tabelas
│   │       └── 20240102000000_sprint3/ # Sprint 3: financial_goals, simulation_scenarios, bank_imports
│   └── src/
│       ├── config/env.ts           # Variáveis de ambiente tipadas
│       ├── controllers/            # 17 controllers (1 por recurso)
│       ├── database/prisma.ts      # Singleton do PrismaClient
│       ├── models/
│       │   ├── types.ts            # Tipos TypeScript do domínio
│       │   └── schemas.ts          # Schemas Zod de validação
│       ├── repositories/           # 11 repositories (acesso ao banco)
│       ├── routes/                 # 17 arquivos de rotas
│       ├── services/               # 17 services (lógica de negócio)
│       ├── utils/
│       │   ├── errors.ts           # Classes de erro e middleware
│       │   └── helpers.ts          # Funções utilitárias
│       ├── app.ts                  # Configuração do Express
│       └── server.ts               # Entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── charts/             # Gráficos e cards visuais
│       │   ├── forms/              # Formulários e tabelas
│       │   ├── layout/             # AppLayout, Sidebar, ProtectedRoute
│       │   └── ui/                 # Button, Card, Modal, Input, etc.
│       ├── hooks/                  # React Query hooks (8 arquivos)
│       ├── pages/                  # 17 páginas da aplicação
│       ├── router/index.tsx        # Roteamento React Router
│       ├── services/               # Clientes HTTP (axios)
│       ├── stores/                 # Estado global (Zustand)
│       ├── types/index.ts          # Todos os tipos TypeScript
│       └── utils/formatters.ts     # Formatação de moeda, datas, etc.
├── RC1_AUDIT_REPORT.md             # Relatório de auditoria do RC1
├── BUSINESS_RULES.md               # Regras de negócio
├── TECHNICAL_DECISIONS.md          # Decisões técnicas e justificativas
├── CHANGELOG.md                    # Histórico de versões
├── ROADMAP.md                      # Próximas funcionalidades
├── DATABASE.md                     # Documentação do banco de dados
├── API.md                          # Referência completa da API
└── .gitignore
```

---

## Páginas do sistema

### Visão Geral
| Página | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Resumo mensal: receitas, despesas, saldo, gráficos, comprometimento futuro |
| Dashboard Executivo | `/executive` | Saúde financeira, reserva de emergência, assistente inteligente, top entidades |
| Linha do Tempo | `/timeline` | Todos os eventos futuros em ordem cronológica com saldo previsto |

### Lançamentos
| Página | Rota | Descrição |
|---|---|---|
| Lançamentos | `/transactions` | Histórico com filtros por tipo, pessoa, mês, ano. Paginado. |
| Parcelas | `/installments` | Compras parceladas com linha do tempo (✔ pago / ○ pendente) |
| Cartões | `/credit-cards` | CRUD de cartões com barra de limite e próxima fatura |
| Contas | `/bank-accounts` | CRUD de contas bancárias, saldo atual, transferências |
| Importar Extrato | `/bank-import` | Upload de OFX/CSV com detecção de duplicatas |
| Contas Fixas | `/recurring` | Despesas recorrentes com geração automática de lançamentos |
| Objetivos | `/goals` | Metas financeiras com barra de progresso e previsão de conclusão |

### Planejamento
| Página | Rota | Descrição |
|---|---|---|
| Anual | `/annual` | Gráficos anuais: receitas×despesas, saldo acumulado, comprometimento futuro |
| Fluxo de Caixa | `/cashflow` | Projeção de 24 meses com gráfico de área |
| Projeção | `/projection` | Projeção de 6, 12, 24 ou 36 meses |
| Simulador | `/simulator` | Simula impacto de compras/parcelamentos/recorrências. Salva e compara cenários. |
| Calendário | `/calendar` | Visualização mensal de todos os eventos financeiros |
| Alertas | `/alerts` | Central de alertas com badge de não lidos na sidebar |

---

## Build para produção

### Backend

```bash
cd backend

# Compila TypeScript
npm run build

# Configura o banco em produção (executa migrations pendentes + seed se necessário)
npm run db:setup

# Inicia o servidor
npm start
```

### Frontend

```bash
cd frontend

# Gera os assets otimizados em dist/
npm run build
```

O conteúdo de `frontend/dist/` pode ser servido por qualquer servidor estático.

---

## Deploy

### Opção 1: Servidor próprio (VPS/local) com nginx

**Configuração nginx:**

```nginx
server {
    listen 80;
    server_name financas.seudominio.com;

    # Frontend estático
    location / {
        root /var/www/financas-do-casal/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy para a API
    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Variáveis de produção do backend:**

```env
NODE_ENV=production
PORT=3333
DATABASE_URL="file:/var/data/financas-do-casal/prod.db"
FRONTEND_URL=https://financas.seudominio.com
```

**Variáveis de produção do frontend (`frontend/.env.production`):**

```env
VITE_API_URL=https://financas.seudominio.com/api
```

**Para manter o servidor Node rodando:** use `pm2`:

```bash
npm install -g pm2
pm2 start dist/server.js --name financas-backend
pm2 save
pm2 startup
```

### Opção 2: Apenas rede local (uso doméstico)

O caso de uso mais simples: execute os dois servidores de desenvolvimento em um computador da casa, e acesse pelo IP local a partir de qualquer dispositivo na rede.

```bash
# No backend, altere o FRONTEND_URL para o IP local
FRONTEND_URL=http://192.168.1.x:5173

# No frontend, deixe o proxy do Vite funcionar
npm run dev -- --host
```

Todos os dispositivos na mesma rede Wi-Fi conseguem acessar em `http://192.168.1.x:5173`.

---

## Resetar dados de exemplo

Para começar com um banco limpo (apaga tudo e recria os usuários + categorias sem dados de exemplo):

```bash
cd backend
npm run db:reset
```

> ⚠️ Este comando apaga **todos os dados** permanentemente.

Para resetar e re-popular com os dados de exemplo do seed:

```bash
cd backend
npm run db:reset  # já chama o seed internamente
```

---

## Solução de problemas

**`npm run db` falha com "Cannot find module '@prisma/client'"**  
→ Execute `npm install` novamente. Se o erro persistir, delete `node_modules/` e execute `npm install` outra vez.

**O banco não é criado automaticamente**  
→ Verifique se `DATABASE_URL` no arquivo `.env` aponta para um diretório com permissão de escrita. O arquivo `.db` é criado automaticamente na primeira migration.

**Erro de CORS no browser ("Access to XMLHttpRequest has been blocked")**  
→ Confirme que `FRONTEND_URL` no `backend/.env` corresponde exatamente à URL onde o frontend está rodando (incluindo porta).

**A tela inicial mostra erro de conexão**  
→ Confirme que o backend está rodando (`http://localhost:3333/health` deve retornar `{"status":"ok"}`). Se não estiver, verifique logs do terminal do backend.

**`prisma migrate deploy` diz "Migration already applied"**  
→ Isso é normal se o banco já existe. As migrations são idempotentes.
