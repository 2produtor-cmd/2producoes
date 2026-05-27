-- Criar banco de dados
-- CREATE DATABASE producoes;

-- Conectar ao banco producoes e executar:

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de inscrições
CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo VARCHAR(20) UNIQUE,
  projeto_id UUID,
  nome_completo VARCHAR(255) NOT NULL,
  nome_artistico VARCHAR(255),
  cpf VARCHAR(20),
  rg VARCHAR(20),
  data_nascimento DATE,
  genero VARCHAR(50),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  cep VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  nome_projeto VARCHAR(255),
  categoria VARCHAR(100),
  area_cultural VARCHAR(100),
  objeto_projeto TEXT,
  objetivo TEXT,
  justificativa TEXT,
  metas_resultados TEXT,
  perfil_publico TEXT,
  publico_alvo TEXT,
  qtd_beneficiados INTEGER,
  estimativa_publico INTEGER,
  estruturas_acessiveis TEXT,
  acessibilidade_comunicacional TEXT,
  acessibilidade_deficientes_visuais TEXT,
  cidade_execucao VARCHAR(100),
  cobranca_ingresso BOOLEAN DEFAULT FALSE,
  ficha_tecnica JSONB,
  plano_divulgacao TEXT,
  valor_solicitado DECIMAL(12, 2),
  orcamento_detalhado JSONB,
  fontes_recurso TEXT,
  links_videos TEXT,
  aceite_termos BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pendente',
  etapa_atual INTEGER DEFAULT 1,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  local VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de financeiro
CREATE TABLE IF NOT EXISTS financeiro (
  id UUID PRIMARY KEY,
  mes VARCHAR(7) NOT NULL,
  entradas DECIMAL(10, 2) DEFAULT 0,
  saidas DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pessoas
CREATE TABLE IF NOT EXISTS pessoas (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  papel VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_inscricoes_projeto_id ON inscricoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_email ON inscricoes(email);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_financeiro_mes ON financeiro(mes);
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON pessoas(email);

-- Inserir usuário administrador padrão
INSERT INTO usuarios (email, senha, nome, role) VALUES (
  'admin@2producoes.com.br',
  '$2a$10$8K1p/a06vI.pY6yYf9M0ieVnZ7Yk5.Xy/oQ7uF.yG9M0ieVnZ7Yk.', -- bcrypt hash de "admin123"
  'Gestor Geral',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Inserir dados de exemplo
INSERT INTO projetos (id, nome, descricao, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Festival de Artes', 'Festival anual de artes culturais', 'ativo'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Workshop de Teatro', 'Oficina de teatro para iniciantes', 'ativo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inscricoes (id, projeto_id, nome_completo, email, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'João Silva', 'joao@email.com', 'confirmada'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Maria Santos', 'maria@email.com', 'pendente')
ON CONFLICT (id) DO NOTHING;

INSERT INTO eventos (id, nome, data, descricao, local) VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', 'Abertura do Festival', '2026-06-15', 'Evento de abertura', 'Teatro Municipal'),
  ('550e8400-e29b-41d4-a716-446655440021', 'Workshop Prático', '2026-06-20', 'Prática de teatro', 'Estúdio de Artes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO financeiro (id, mes, entradas, saidas) VALUES 
  ('550e8400-e29b-41d4-a716-446655440030', '2026-05', 5000.00, 2000.00),
  ('550e8400-e29b-41d4-a716-446655440031', '2026-06', 8000.00, 3500.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pessoas (id, nome, email, telefone, papel) VALUES 
  ('550e8400-e29b-41d4-a716-446655440040', 'João Silva', 'joao@email.com', '11987654321', 'produtor'),
  ('550e8400-e29b-41d4-a716-446655440041', 'Maria Santos', 'maria@email.com', '11987654322', 'coordenadora')
ON CONFLICT (id) DO NOTHING;
