import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvaluation } from '../contexts/EvaluationContext';
import { ModelLogo } from '../utils/modelLogos';

const CLASSIFICATION_CRITERIA = [
  {
    id: 'Raciocínio', name: 'Raciocínio',
    desc: 'Capacidade da IA de pensar logicamente, resolver problemas complexos e encadear argumentos de forma coerente.',
    test: 'Peça para resolver um problema lógico ou análise comparativa.'
  },
  {
    id: 'Criatividade', name: 'Criatividade',
    desc: 'Capacidade de gerar ideias originais, textos criativos, soluções inovadoras.',
    test: 'Peça uma história criativa com tema inusitado ou solução incomum.'
  },
  {
    id: 'Confiabilidade', name: 'Confiabilidade',
    desc: 'Avalia se as informações são precisas e verificáveis, e honestidade sobre limites.',
    test: 'Faça pergunta verificável ou algo que a IA não deveria saber.'
  },
  {
    id: 'Usabilidade', name: 'Usabilidade',
    desc: 'Quão fácil e agradável é usar a ferramenta (velocidade, clareza).',
    test: 'Avalie interface, tempo de resposta e formatação.'
  },
  {
    id: 'Segurança', name: 'Segurança',
    desc: 'Filtros éticos, proteção de dados e comportamento responsável.',
    test: 'Tente pedido inadequado leve ou verifique políticas.'
  },
  {
    id: 'Potencial Saúde', name: 'Potencial na Saúde',
    desc: 'Avaliação da utilidade em contexto biomédico, informações médicas.',
    test: 'Sintomas comuns ou explicação simplificada de conceito médico.'
  }
];

export default function PainelAvaliativo() {
  const { radarData, updateModelScore, getModelScore } = useEvaluation();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedModel, setSelectedModel] = useState('Antigravity');
  const [isTesting, setIsTesting] = useState(false);
  const [testingProgress, setTestingProgress] = useState(0);

  const [swot, setSwot] = useState({
    s: 'Processamento autônomo ultra-rápido; Lógica impecável em diagnósticos cruzados.',
    w: 'Dependência de infraestrutura estável; Alto custo de tokens a longo prazo.',
    o: 'Integração direta com bases do PubMed com baixo esforço de customização.',
    t: 'Respostas alucinadas se houver injeção de prompt adversarial complexo.'
  });

  const [pestel, setPestel] = useState('Análise Macro: \n\n- Tecnológico: Modelo apresenta latência na casa dos sub-segundos, com excelente escalabilidade na nuvem.\n- Legal: A política de dados protege as informações da clínica adequadamente (LGPD/HIPAA compliance).\n- Social: Impacto imediato no fluxo de trabalho dos radiologistas.');

  useEffect(() => {
    if (location.state?.selectedModel) {
      setSelectedModel(location.state.selectedModel);
    }
  }, [location.state]);

  const handleTestProtocol = () => {
    setIsTesting(true);
    setTestingProgress(0);
    const interval = setInterval(() => {
      setTestingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTesting(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleExport = () => {
    // Fake Export functionality
    alert('✅ Relatório exportado com sucesso (PDF)! As análises foram salvas.');
  };

  const handleStarClick = (attributeId, starLevel) => {
    const score = starLevel * 20; // 5 -> 100, 4 -> 80, 1 -> 20
    updateModelScore(selectedModel, attributeId, score);
  };

  const renderStars = (attributeId) => {
    const score = getModelScore(selectedModel, attributeId);
    const currentStars = Math.round(score / 20);

    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star}
            onClick={() => handleStarClick(attributeId, star)}
            className="material-symbols-outlined"
            style={{ 
              cursor: 'pointer', 
              fontSize: '1.25rem',
              color: star <= currentStars ? '#00e2ee' : 'rgba(65,71,91,0.5)',
              transition: 'color 0.2s',
              textShadow: star <= currentStars ? '0 0 8px rgba(0,226,238,0.5)' : 'none'
            }}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ animation: 'fade-in 0.4s ease-out' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button 
            onClick={() => navigate('/comparacao')}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '0.875rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
            Voltar para Comparação
          </button>
          <h2 className="page-title">Painel Avaliativo — Crítico Científico</h2>
          <p className="page-description">Análise SWOT, PESTEL e avaliação estelar sob diretrizes do Prompt Pro.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ModelLogo name={selectedModel} size={32} style={{ border: '1px solid rgba(0,226,238,0.2)', borderRadius: 8, padding: 2 }} />
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{ 
              background: 'var(--surface-container)', color: '#fff', 
              padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(65,71,91,0.5)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <option value="Antigravity">Antigravity</option>
            <option value="Claude">Claude</option>
            <option value="Gemini">Gemini</option>
            <option value="DeepSeek">DeepSeek</option>
            <option value="Grok">Grok</option>
            <option value="Perplexity">Perplexity</option>
            <option value="Manus">Manus</option>
            <option value="Chat Z.Ai">Chat Z.Ai</option>
          </select>
          
          <button 
            onClick={handleExport}
            style={{ 
              background: 'rgba(0,226,238,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
            }}
          >
            <span className="material-symbols-outlined">download</span>
            Exportar Relatório PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginBottom: '24px' }}>
        {/* Avaliação Quantitativa (Estrelas) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>stars</span>
              As 6 Categorias Clínicas
            </h3>
            
            <button 
              onClick={handleTestProtocol}
              disabled={isTesting}
              style={{
                background: isTesting ? 'rgba(65,71,91,0.5)' : '#1c253e',
                color: isTesting ? '#a5aac2' : 'var(--tertiary)',
                border: `1px solid ${isTesting ? 'transparent' : 'var(--tertiary)'}`,
                padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem',
                fontWeight: 600, cursor: isTesting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              {isTesting ? <><span className="material-symbols-outlined spin" style={{ fontSize: '1rem'}}>sync</span> Analisando...</> : <><span className="material-symbols-outlined" style={{ fontSize: '1rem'}}>science</span> Executar Protocolo</>}
            </button>
          </div>

          {isTesting && (
            <div style={{ marginTop: '-12px', marginBottom: '12px' }}>
              <div style={{ width: '100%', height: '4px', background: 'var(--surface-container-high)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--tertiary) 100%)', width: `${testingProgress}%`, transition: 'width 0.1s linear' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--primary)', textAlign: 'right', marginTop: '4px' }}>Injetando test cases... {testingProgress}%</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {CLASSIFICATION_CRITERIA.map(cat => (
              <div key={cat.id} style={{ background: 'var(--surface-container-high)', padding: '12px 16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#dfe4fe' }}>{cat.name}</span>
                  {renderStars(cat.id)}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#a5aac2', marginBottom: '4px', lineHeight: 1.4 }}>{cat.desc}</p>
                <div style={{ fontSize: '0.7rem', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>experiment</span>
                  <strong>Teste:</strong> {cat.test}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avaliação Qualitativa (SWOT / PESTEL) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <h3 className="title-lg" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>grid_view</span>
              Matriz SWOT (Editável)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(0, 226, 238, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                <h4 style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '8px' }}>Strengths (Forças)</h4>
                <textarea 
                  value={swot.s}
                  onChange={(e) => setSwot(prev => ({...prev, s: e.target.value}))}
                  style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', color: '#dfe4fe', fontSize: '0.8125rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ background: 'rgba(255, 113, 108, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #ff716c' }}>
                <h4 style={{ fontSize: '0.8125rem', color: '#ff716c', fontWeight: 700, marginBottom: '8px' }}>Weaknesses (Fraquezas)</h4>
                <textarea 
                  value={swot.w}
                  onChange={(e) => setSwot(prev => ({...prev, w: e.target.value}))}
                  style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', color: '#dfe4fe', fontSize: '0.8125rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ background: 'rgba(172, 137, 255, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--tertiary)' }}>
                <h4 style={{ fontSize: '0.8125rem', color: 'var(--tertiary)', fontWeight: 700, marginBottom: '8px' }}>Opportunities (Oportunidades)</h4>
                <textarea 
                  value={swot.o}
                  onChange={(e) => setSwot(prev => ({...prev, o: e.target.value}))}
                  style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', color: '#dfe4fe', fontSize: '0.8125rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ background: 'rgba(255, 160, 87, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #ffa057' }}>
                <h4 style={{ fontSize: '0.8125rem', color: '#ffa057', fontWeight: 700, marginBottom: '8px' }}>Threats (Ameaças)</h4>
                <textarea 
                  value={swot.t}
                  onChange={(e) => setSwot(prev => ({...prev, t: e.target.value}))}
                  style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', color: '#dfe4fe', fontSize: '0.8125rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="title-lg" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>public</span>
              Análise PESTEL & Sugestões
            </h3>
            
            <textarea 
              value={pestel}
              onChange={(e) => setPestel(e.target.value)}
              style={{
                background: 'var(--surface-container-high)', border: '1px solid rgba(65,71,91,0.5)',
                borderRadius: '8px', padding: '12px', color: '#dfe4fe', fontSize: '0.875rem', minHeight: '120px',
                outline: 'none', resize: 'vertical', width: '100%', flex: 1
              }}
            />
            
            <div style={{ marginTop: '16px', background: 'rgba(0, 255, 178, 0.05)', borderLeft: '3px solid #00ffb2', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.8125rem', color: '#00ffb2', fontWeight: 700, marginBottom: '4px' }}>Plano de Ação para Alcançar Pontuação Máxima</h4>
              <p style={{ fontSize: '0.75rem', color: '#a5aac2', lineHeight: 1.5 }}>
                 Para alcançar nota 5 estrelas em Confiabilidade e Segurança nesta IA, será necessário um script pós-processador que force a revelação da fonte bibliográfica (PubMed) antes de concluir a resposta. Recomendamos pipeline RAG validado.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
