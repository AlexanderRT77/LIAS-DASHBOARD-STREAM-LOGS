// Central mapping: AI model name → logo path, color, and developer
export const AI_LOGOS = {
  Antigravity:  '/logos/antigravity-color.png',
  Claude:       '/logos/claude-color.png',
  Gemini:       '/logos/gemini-color.png',
  DeepSeek:     '/logos/deepseek-color.png',
  Perplexity:   '/logos/perplexity-color.png',
  Grok:         '/logos/grok.png',
  Manus:        '/logos/manus.png',
  'Chat Z.Ai':  '/logos/zai.png',
}

export const MODEL_COLORS = {
  Antigravity: '#ff00ff',
  Claude:      '#ac89ff',
  Gemini:      '#00e2ee',
  DeepSeek:    '#ff716c',
  Perplexity:  '#4ade80',
  Grok:        '#ff8c00',
  Manus:       '#8b8b8b',
  'Chat Z.Ai': '#f0f0f0',
}

export const MODEL_ORDER = ['Antigravity', 'Claude', 'Gemini', 'DeepSeek', 'Perplexity', 'Grok', 'Manus', 'Chat Z.Ai']

// Reusable inline logo component
export function ModelLogo({ name, size = 20, style = {} }) {
  const src = AI_LOGOS[name]
  if (!src) return null
  return (
    <img
      src={src}
      alt={`${name} logo`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 4,
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

// Logo + colored dot + name combo for lists/legends
export function ModelBadge({ name, size = 18, showDot = false, fontSize = '0.8125rem', style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      {showDot && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: MODEL_COLORS[name], flexShrink: 0 }} />
      )}
      <ModelLogo name={name} size={size} />
      <span style={{ fontWeight: 600, fontSize }}>{name}</span>
    </div>
  )
}
