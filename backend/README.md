# Backend - 2Produções

API Node.js/Express para o sistema de gestão de projetos culturais.

## 🚀 Quick Start

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar banco de dados PostgreSQL

```sql
CREATE DATABASE producoes;
```

### 3. Atualizar `.env`

Edite o arquivo `.env` com suas credenciais PostgreSQL:
```env
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
JWT_SECRET=uma_chave_segura_aqui
```

### 4. Criar tabelas

Você pode criar as tabelas automaticamente rodando o script de migração:
```bash
npm run migrate
```

Ou manualmente via psql:
```bash
psql -U postgres -d producoes -f src/init.sql
```

### 5. Fazer seed com dados de teste

```bash
npm run seed
```

### 6. Iniciar servidor

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001`

---

## 📚 API Endpoints

### Autenticação

#### POST `/auth/login`
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@2producoes.com.br",
    "password": "admin123"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "uuid",
    "email": "admin@2producoes.com.br",
    "nome": "Administrador",
    "perfil": "admin"
  }
}
```

#### POST `/auth/register` (Registrar novo usuário)
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@email.com",
    "password": "senha123",
    "nome": "Novo Usuário"
  }'
```

---

### Projetos

#### GET `/projetos` - Listar todos
```bash
curl -X GET http://localhost:3001/projetos \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### GET `/projetos/:id` - Obter um projeto
```bash
curl -X GET http://localhost:3001/projetos/uuid-do-projeto \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### POST `/projetos` - Criar novo
```bash
curl -X POST http://localhost:3001/projetos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Projeto",
    "descricao": "Descrição do projeto",
    "status": "ativo"
  }'
```

#### PUT `/projetos/:id` - Atualizar
```bash
curl -X PUT http://localhost:3001/projetos/uuid-do-projeto \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Projeto Atualizado",
    "status": "finalizado"
  }'
```

#### DELETE `/projetos/:id` - Deletar
```bash
curl -X DELETE http://localhost:3001/projetos/uuid-do-projeto \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### Inscrições

#### GET `/inscricoes` - Listar todas
```bash
curl -X GET http://localhost:3001/inscricoes \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### POST `/inscricoes` - Criar inscrição
```bash
curl -X POST http://localhost:3001/inscricoes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projetoId": "uuid-do-projeto",
    "nome_completo": "João Silva",
    "email": "joao@email.com",
    "status": "pendente"
  }'
```

#### PUT `/inscricoes/:id` - Atualizar status
```bash
curl -X PUT http://localhost:3001/inscricoes/uuid-da-inscricao \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmada"
  }'
```

---

### Eventos

#### GET `/eventos` - Listar todos
```bash
curl -X GET http://localhost:3001/eventos \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### POST `/eventos` - Criar evento
```bash
curl -X POST http://localhost:3001/eventos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Evento",
    "data": "2026-07-15",
    "descricao": "Descrição do evento",
    "local": "Local do evento"
  }'
```

---

### Financeiro

#### GET `/financeiro` - Listar todos
```bash
curl -X GET http://localhost:3001/financeiro \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### GET `/financeiro/:mes` - Obter um mês
```bash
curl -X GET http://localhost:3001/financeiro/2026-05 \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### POST `/financeiro` - Adicionar entrada/saída
```bash
curl -X POST http://localhost:3001/financeiro \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mes": "2026-07",
    "entradas": 10000.00,
    "saidas": 3500.00
  }'
```

---

### Pessoas

#### GET `/pessoas` - Listar todas
```bash
curl -X GET http://localhost:3001/pessoas \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### POST `/pessoas` - Criar pessoa
```bash
curl -X POST http://localhost:3001/pessoas \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Contato",
    "email": "contato@email.com",
    "telefone": "11987654321",
    "papel": "produtor"
  }'
```

---

## 🛠 Estrutura de Pastas

```
backend/
├── src/
│   ├── server.js           # Servidor principal
│   ├── seed.js            # Script para popular BD
│   ├── init.sql           # Schema do banco
│   └── routes/
│       ├── auth.js        # Autenticação
│       ├── projetos.js    # Projetos
│       ├── inscricoes.js  # Inscrições
│       ├── eventos.js     # Eventos
│       ├── financeiro.js  # Financeiro
│       └── pessoas.js     # Pessoas
├── .env                   # Variáveis de ambiente
├── .env.example           # Template do .env
├── package.json           # Dependências
└── README.md              # Este arquivo
```

---

## 🔐 Autenticação

Todas as rotas (exceto `/auth/login` e `/auth/register`) requerem um token JWT válido.

**Envie o token no header:**
```
Authorization: Bearer seu_token_aqui
```

O token expira em 30 dias.

---

## 🐛 Troubleshooting

### Erro: "Erro ao conectar ao PostgreSQL"

1. Verifique se PostgreSQL está rodando
2. Verifique as credenciais em `.env`
3. Verifique se o banco de dados existe

```bash
# Windows PowerShell
psql -U postgres -c "SELECT version();"
```

### Erro: "Tabelas não existem"

Execute o script de inicialização:
```bash
psql -U postgres -d producoes -f src/init.sql
```

### Erro: "npm run dev: command not found"

Reinstale as dependências:
```bash
npm install
```

---

## 📝 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente (development/production) | development |
| `DB_HOST` | Host do PostgreSQL | localhost |
| `DB_PORT` | Porta do PostgreSQL | 5432 |
| `DB_NAME` | Nome do banco | producoes |
| `DB_USER` | Usuário do PostgreSQL | postgres |
| `DB_PASSWORD` | Senha do PostgreSQL | postgres |
| `PORT` | Porta do servidor | 3001 |
| `JWT_SECRET` | Chave secreta para JWT | ... |

---

## 📱 Integração com App Android

O app Android sincroniza com este backend a cada 15 minutos.

**URL do Backend (alterar conforme seu ambiente):**
- Emulador: `http://10.0.2.2:3001`
- Dispositivo físico: `http://SEU_IP:3001`

---

## 🚀 Deploy

### Deploy no Render (Plano Free)

1. Conecte seu GitHub (`2produtor-cmd`) no painel do Render (**Account Settings** > **Connected Accounts**).
2. Crie um **Web Service** para o `backend`:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `DATABASE_URL`: URL externa do seu banco Render.
     - `JWT_SECRET`: Uma chave aleatória segura.
     - `NODE_ENV`: `production`
3. Crie um **Static Site** para o `frontend`:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: URL do seu Web Service recém criado + `/api`.

---

## 📞 Suporte

Para dúvidas ou problemas, consulte o README principal em `../README.md`.
