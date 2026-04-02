-- Script para Limpar Modelos Antigos e Implementar o Esquadrão 8-IAs

-- Passo 1: Limpar tabelas dependentes para evitar violação de Foreign Key
-- (AVISO: Isso deleta o histórico atual da cloud, portanto faça o Export CSV antes se precisar)
TRUNCATE TABLE performance_metrics CASCADE;
TRUNCATE TABLE diagnostic_records CASCADE;
TRUNCATE TABLE inference_logs CASCADE;
TRUNCATE TABLE ai_models CASCADE;

-- Passo 2: Inserir as 8 IAs Oficiais
INSERT INTO ai_models (name, vendor, version, specialty) VALUES
  ('Gemini', 'Google DeepMind', '3.1 Pro', 'Multi-Especialidade'),
  ('Claude', 'Anthropic', '4', 'Multi-Especialidade'),
  ('DeepSeek', 'DeepSeek', 'R2/V3', 'Multi-Especialidade'),
  ('Grok', 'xAI', '3', 'Multi-Especialidade'),
  ('Perplexity', 'Perplexity', 'Pro', 'Multi-Especialidade'),
  ('Manus', 'Manus', '1', 'Multi-Especialidade'),
  ('Antigravity', 'Agentic', '1.0', 'Multi-Especialidade'),
  ('Chat Z.Ai', 'Z.Ai', 'V1', 'Multi-Especialidade')
ON CONFLICT (name) DO NOTHING;

-- Verifique as inserções
SELECT * FROM ai_models;
