import { createContext, useContext, useState } from 'react';

const EvaluationContext = createContext();

const initialRadarData = [
  { attribute: 'Raciocínio', 'Gemini': 93, 'Claude': 96, 'DeepSeek': 91, 'Grok': 88, 'Perplexity': 82, 'Manus': 90, 'Antigravity': 98, 'Chat Z.Ai': 78 },
  { attribute: 'Criatividade', 'Gemini': 90, 'Claude': 92, 'DeepSeek': 85, 'Grok': 89, 'Perplexity': 70, 'Manus': 88, 'Antigravity': 95, 'Chat Z.Ai': 75 },
  { attribute: 'Confiabilidade', 'Gemini': 94, 'Claude': 95, 'DeepSeek': 88, 'Grok': 84, 'Perplexity': 97, 'Manus': 85, 'Antigravity': 98, 'Chat Z.Ai': 76 },
  { attribute: 'Usabilidade', 'Gemini': 95, 'Claude': 90, 'DeepSeek': 80, 'Grok': 85, 'Perplexity': 91, 'Manus': 82, 'Antigravity': 96, 'Chat Z.Ai': 88 },
  { attribute: 'Segurança', 'Gemini': 92, 'Claude': 98, 'DeepSeek': 82, 'Grok': 75, 'Perplexity': 90, 'Manus': 80, 'Antigravity': 99, 'Chat Z.Ai': 80 },
  { attribute: 'Potencial Saúde', 'Gemini': 95, 'Claude': 96, 'DeepSeek': 86, 'Grok': 82, 'Perplexity': 92, 'Manus': 84, 'Antigravity': 97, 'Chat Z.Ai': 75 },
];

export function EvaluationProvider({ children }) {
  const [radarData, setRadarData] = useState(initialRadarData);

  const updateModelScore = (modelName, attributeName, score) => {
    setRadarData(prevData => prevData.map(item => {
      if (item.attribute === attributeName) {
        return { ...item, [modelName]: score };
      }
      return item;
    }));
  };

  const getModelScore = (modelName, attributeName) => {
    const attr = radarData.find(item => item.attribute === attributeName);
    return attr ? attr[modelName] : 0;
  };

  return (
    <EvaluationContext.Provider value={{ radarData, updateModelScore, getModelScore }}>
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}
