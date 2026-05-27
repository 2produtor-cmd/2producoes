# 2Produções – Sistema de Gestão de Projetos Culturais

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuração

### 1. Banco de Dados

Crie o banco no PostgreSQL:
```sql
CREATE DATABASE "2producoes";
```

### 2. Backend

```bash
cd backend
# Edite o .env com suas credenciais do PostgreSQL
npm run dev
```

O servidor sobe em `http://localhost:3001`

**Login padrão:**
- E-mail: `admin@2producoes.com.br`
- Senha: `admin123`

### 3. Frontend

```bash
cd frontend
npm run dev
```

Acesse `http://localhost:5173`

---

## Módulos

| Módulo | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Visão geral com métricas |
| 2Projetos | `/projetos` | Cadastro e gestão de projetos |
| 2Inscrições | `/inscricoes` | Gerenciar inscrições recebidas |
| 2Eventos | `/eventos` | Gestão de eventos |
| 2Financeiro | `/financeiro` | Controle de entradas e saídas |
| 2Documentos | `/documentos` | Biblioteca de arquivos |
| Usuários | `/usuarios` | Gestão de usuários (admin) |
| Inscrição Pública | `/inscricao` | Formulário público (sem login) |

## API Endpoints

```
POST   /api/auth/login
GET    /api/projetos
POST   /api/projetos
GET    /api/projetos/:id
PUT    /api/projetos/:id
PATCH  /api/projetos/:id/status
GET    /api/projetos/dashboard
GET    /api/inscricoes
POST   /api/inscricoes/publica
GET    /api/documentos/projeto/:id   → PDF
GET    /api/documentos/inscricao/:id → PDF
GET    /api/financeiro
POST   /api/financeiro
GET    /api/eventos
POST   /api/eventos
GET    /api/anexos
POST   /api/anexos
```

## Perfis de Usuário

- **admin** – acesso total
- **produtor** – criar/editar projetos, eventos, financeiro
- **participante** – ver apenas seus próprios projetos

---

## 🚀 Deploy e Repositório

**Repositório Oficial:** [https://github.com/2produtor-cmd/plataforma](https://github.com/2produtor-cmd/plataforma)

Para atualizações:
1. `git add .`
2. `git commit -m "descrição da mudança"`
3. `git push origin main`
