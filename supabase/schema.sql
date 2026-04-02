-- ═══════════════════════════════════════════════════════════
-- SCHEMA: Health Insights — IA Precision Analytics
-- Execute este SQL no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Tabela de Modelos de IA
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  vendor TEXT NOT NULL,
  version TEXT,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Métricas de Performance (dados dos gráficos)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'cardiologia', 'neurologia', 'oncologia', 'radiologia', etc.
  accuracy NUMERIC(5,2),
  latency_ms INTEGER,
  cost_per_1m_tokens NUMERIC(10,4),
  hallucination_rate NUMERIC(5,4),
  citation_rate NUMERIC(5,2),
  compliance_score NUMERIC(5,2),
  energy_rating TEXT, -- 'A+', 'A', 'B', etc.
  measured_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Registros de Diagnóstico (Base Histórica)
CREATE TABLE IF NOT EXISTS diagnostic_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id TEXT NOT NULL UNIQUE, -- 'REC-2931'
  model_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  confidence NUMERIC(5,2),
  status TEXT DEFAULT 'Concluído', -- 'Concluído', 'Em análise', 'Pendente'
  notes TEXT,
  diagnosed_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Inferências (Métricas Live)
CREATE TABLE IF NOT EXISTS inference_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inference_id TEXT NOT NULL, -- 'INF-89421'
  model_name TEXT NOT NULL,
  task TEXT NOT NULL,
  latency_ms INTEGER,
  status TEXT DEFAULT 'Active', -- 'Active', 'Complete', 'Failed'
  confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Uploads (Gestão de Dados)
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'Processando', -- 'Processado', 'Em fila', 'Erro'
  rows_imported INTEGER DEFAULT 0,
  target_table TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de KPIs Globais (Dashboard)
CREATE TABLE IF NOT EXISTS global_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL, -- 'total_inferences', 'global_accuracy', etc.
  metric_value TEXT NOT NULL,
  change_value TEXT,
  change_positive BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inference_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_kpis ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode LER (público)
CREATE POLICY "Leitura pública" ON ai_models FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON performance_metrics FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON diagnostic_records FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON inference_logs FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON file_uploads FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON global_kpis FOR SELECT USING (true);

-- Política: Apenas usuários autenticados podem INSERIR
CREATE POLICY "Inserção autenticada" ON ai_models FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inserção autenticada" ON performance_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inserção autenticada" ON diagnostic_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inserção autenticada" ON inference_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inserção autenticada" ON file_uploads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inserção autenticada" ON global_kpis FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem ATUALIZAR
CREATE POLICY "Atualização autenticada" ON ai_models FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Atualização autenticada" ON performance_metrics FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Atualização autenticada" ON diagnostic_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Atualização autenticada" ON global_kpis FOR UPDATE USING (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem DELETAR
CREATE POLICY "Deleção autenticada" ON ai_models FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Deleção autenticada" ON performance_metrics FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Deleção autenticada" ON diagnostic_records FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- REALTIME: Habilitar publicação de mudanças
-- ═══════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE diagnostic_records;
ALTER PUBLICATION supabase_realtime ADD TABLE global_kpis;
ALTER PUBLICATION supabase_realtime ADD TABLE inference_logs;

-- ═══════════════════════════════════════════════════════════
-- SEED DATA: Dados iniciais
-- ═══════════════════════════════════════════════════════════

INSERT INTO ai_models (name, vendor, version, specialty) VALUES
  ('GPT-4o Health', 'OpenAI', '4o', 'Multi-Especialidade'),
  ('Claude 3.5 Sonnet', 'Anthropic', '3.5', 'Multi-Especialidade'),
  ('Med-PaLM 2.1', 'Google Research', '2.1', 'Multi-Especialidade'),
  ('Llama 3 (70B)', 'Meta', '70B', 'Multi-Especialidade'),
  ('Gemini 1.5 Pro', 'Google DeepMind', '1.5 Pro', 'Multi-Especialidade'),
  ('Mistral Med', 'Mistral AI', 'Med', 'Multi-Especialidade'),
  ('DeepSeek Health', 'DeepSeek', 'Health', 'Multi-Especialidade'),
  ('Qwen2 Clinical', 'Alibaba', '2.0', 'Multi-Especialidade')
ON CONFLICT (name) DO NOTHING;

INSERT INTO global_kpis (metric_name, metric_value, change_value, change_positive) VALUES
  ('total_inferences', '1.28M', '+12%', true),
  ('global_accuracy', '94.2%', '+0.5%', true),
  ('total_cost', '$14.2k', '-8%', false),
  ('avg_latency', '184ms', '-14ms', false)
ON CONFLICT DO NOTHING;
