import React, { useMemo, useState, useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import 'echarts-gl'
import '../styles/dash3d.css'
import { useEvaluation } from '../contexts/EvaluationContext'

const AI_MODELS = [
  { key: 'Antigravity', color: '#ff00cc', icon: 'science' },
  { key: 'Claude', color: '#ac89ff', icon: 'psychology' },
  { key: 'Gemini', color: '#99f7ff', icon: 'stars' },
  { key: 'DeepSeek', color: '#ff716c', icon: 'waves' },
  { key: 'Perplexity', color: '#00ffb2', icon: 'search' },
  { key: 'Grok', color: '#ffa057', icon: 'bolt' },
  { key: 'Manus', color: '#6f758b', icon: 'blur_on' },
  { key: 'Chat Z.Ai', color: '#f0f0f0', icon: 'forum' },
]

const METRICS = [
  { key: 'Raciocínio', icon: 'neurology' },
  { key: 'Criatividade', icon: 'palette' },
  { key: 'Confiabilidade', icon: 'verified' },
  { key: 'Usabilidade', icon: 'touch_app' },
  { key: 'Segurança', icon: 'shield' },
  { key: 'Potencial Saúde', icon: 'health_and_safety' },
]

// Mountains centered in grid with ~45 unit spacing between neighbors
// All peaks within safe zone (x:20-155, y:25-145) for full camera visibility
const MOUNTAIN_CENTERS = [
  { x: 25,  y: 30 },   // Antigravity   (top-left)
  { x: 90,  y: 25 },   // Claude        (top-center)
  { x: 155, y: 35 },   // Gemini        (top-right)
  { x: 40,  y: 90 },   // DeepSeek      (mid-left)
  { x: 110, y: 85 },   // Perplexity    (mid-right)
  { x: 25,  y: 145 },  // Grok          (bottom-left)
  { x: 90,  y: 140 },  // Manus         (bottom-center)
  { x: 155, y: 130 },  // Chat Z.Ai     (bottom-right)
]

// Pre-compute RGB once at module level
const AI_RGB = AI_MODELS.map(m => ({
  r: parseInt(m.color.slice(1, 3), 16),
  g: parseInt(m.color.slice(3, 5), 16),
  b: parseInt(m.color.slice(5, 7), 16)
}))

// Pre-compute a Gaussian LUT to avoid Math.exp() in hot loop
const GAUSS_LUT_SIZE = 2048
const GAUSS_LUT = new Float32Array(GAUSS_LUT_SIZE)
for (let i = 0; i < GAUSS_LUT_SIZE; i++) {
  GAUSS_LUT[i] = Math.exp(-i / 64)
}
function fastGauss(dist2, sigma2) {
  const idx = (dist2 / sigma2 * 64) | 0
  return idx < GAUSS_LUT_SIZE ? GAUSS_LUT[idx] : 0
}

function computeRankings(radarData, metricKey) {
  const metricRow = radarData.find(r => r.attribute === metricKey)
  if (!metricRow) return {}
  const entries = AI_MODELS.map(m => ({ key: m.key, score: metricRow[m.key] || 0 }))
  entries.sort((a, b) => b.score - a.score)
  const rankings = {}
  entries.forEach((e, i) => { rankings[e.key] = { rank: i + 1, score: e.score } })
  return rankings
}

function computeAverage(radarData, metricKey) {
  const metricRow = radarData.find(r => r.attribute === metricKey)
  if (!metricRow) return 50
  const scores = AI_MODELS.map(m => metricRow[m.key] || 0)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function DashboardAlternativa() {
  const { radarData } = useEvaluation()
  const [activeMetric, setActiveMetric] = useState('Raciocínio')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedAIs, setSelectedAIs] = useState([])
  const [autoRotate, setAutoRotate] = useState(true)
  const chartRef = useRef(null)
  const idleTimer = useRef(null)

  const rankings = useMemo(() => computeRankings(radarData, activeMetric), [radarData, activeMetric])
  const avgScore = useMemo(() => computeAverage(radarData, activeMetric), [radarData, activeMetric])

  const handleChartReady = useCallback((instance) => {
    if (!instance) return
    const zr = instance.getZr && instance.getZr()
    if (zr) {
      const pause = () => {
        setAutoRotate(false)
        clearTimeout(idleTimer.current)
        idleTimer.current = setTimeout(() => setAutoRotate(true), 4000)
      }
      zr.on('mousedown', pause)
      zr.on('mousewheel', pause)
    }
  }, [])

  const toggleCompareAI = useCallback((key) => {
    setSelectedAIs(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= 2) return [prev[1], key]
      return [...prev, key]
    })
  }, [])

  const chartOptions = useMemo(() => {
    const metricRow = radarData.find(r => r.attribute === activeMetric)
    if (!metricRow) return {}

    const GRID = 200
    const BASE_FLOOR = 2
    const SPREAD = 16
    const HEIGHT_MULTIPLIER = 3.5
    const STEP = 3            // 67x67 = ~4,489 points (HUGE reduction from 8,100)

    const peaks = AI_MODELS.map((model, idx) => {
      const score = metricRow[model.key] || 50
      const height = (score - 40) * HEIGHT_MULTIPLIER
      const dimmed = compareMode && selectedAIs.length === 2 && !selectedAIs.includes(model.key)
      return {
        cx: MOUNTAIN_CENTERS[idx].x,
        cy: MOUNTAIN_CENTERS[idx].y,
        height: dimmed ? height * 0.12 : height,
        score,
        rgb: AI_RGB[idx],
        key: model.key,
        color: model.color,
        dimmed
      }
    })

    // Pre-compute constants ONCE
    const SPREAD2 = SPREAD * SPREAD * 1.8    // Smooth Gaussian body
    const SPREAD2_INF = SPREAD * SPREAD * 3  // Color influence radius
    const BASE_R = 0, BASE_G = 40, BASE_B = 180

    // Compute influence cutoff: skip peaks too far to matter
    // At dist2 > CUTOFF_DIST2, contribution < 0.01
    const CUTOFF_DIST2 = SPREAD2 * 5  // ~80 units radius

    const data = new Array(Math.ceil(GRID / STEP) * Math.ceil(GRID / STEP))
    let dataIdx = 0

    for (let x = 0; x < GRID; x += STEP) {
      for (let y = 0; y < GRID; y += STEP) {
        let z = BASE_FLOOR
        let dominantInfluence = 0
        let dominantIdx = -1

        for (let p = 0; p < 8; p++) {
          const peak = peaks[p]
          const dx = x - peak.cx
          const dy = y - peak.cy
          const dist2 = dx * dx + dy * dy

          // Skip if too far (early bail-out)
          if (dist2 > CUTOFF_DIST2) {
            // Still track influence for color if closer than any so far
            if (dist2 < SPREAD2_INF * 3) {
              const inf = fastGauss(dist2, SPREAD2_INF)
              if (inf > dominantInfluence) {
                dominantInfluence = inf
                dominantIdx = p
              }
            }
            continue
          }

          // Single smooth Gaussian (no spike = less math, smoother peaks)
          const contribution = peak.height * fastGauss(dist2, SPREAD2)
          if (contribution > 0.3) z += contribution

          const influence = fastGauss(dist2, SPREAD2_INF)
          if (influence > dominantInfluence) {
            dominantInfluence = influence
            dominantIdx = p
          }
        }

        let color
        if (dominantIdx >= 0 && dominantInfluence > 0.03) {
          const peak = peaks[dominantIdx]
          const alpha = peak.dimmed ? 0.2 : 0.92
          // Aggressive blend: saturate color much faster toward the AI's identity
          const blend = Math.min(1, dominantInfluence * 2.5)
          const cr = (BASE_R + (peak.rgb.r - BASE_R) * blend) | 0
          const cg = (BASE_G + (peak.rgb.g - BASE_G) * blend) | 0
          const cb = (BASE_B + (peak.rgb.b - BASE_B) * blend) | 0
          color = `rgba(${cr},${cg},${cb},${alpha})`
        } else {
          color = 'rgba(0,44,160,0.45)'
        }

        data[dataIdx++] = { value: [x, y, z], itemStyle: { color } }
      }
    }
    // Trim pre-allocated array
    data.length = dataIdx

    // Floating 3D labels (lightweight scatter)
    const labels = peaks.filter(p => !p.dimmed).map(p => ({
      value: [p.cx, p.cy, p.height + 18],
      name: p.key,
      label: {
        show: true,
        formatter: p.key,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'Inter',
        color: p.color,
        backgroundColor: 'rgba(6,10,20,0.75)',
        borderColor: p.color,
        borderWidth: 1,
        borderRadius: 4,
        padding: [4, 8],
        textShadowBlur: 6,
        textShadowColor: p.color
      },
      itemStyle: { color: 'transparent' }
    }))

    return {
      tooltip: {
        show: true,
        backgroundColor: 'rgba(10, 14, 30, 0.92)',
        borderColor: 'rgba(0, 255, 255, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: (params) => {
          if (!params || !params.value) return ''
          const [px, py] = params.value
          let closest = peaks[0]
          let minDist = Infinity
          for (const p of peaks) {
            const d = (px - p.cx) ** 2 + (py - p.cy) ** 2  // skip sqrt
            if (d < minDist) { minDist = d; closest = p }
          }
          if (minDist > 900) return ''  // 30^2
          const rank = rankings[closest.key]?.rank || '-'
          const medal = RANK_MEDALS[rank] || `#${rank}`
          return `
            <div style="font-family:'Inter',sans-serif;padding:6px 2px;min-width:150px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="width:10px;height:10px;border-radius:50%;background:${closest.color};display:inline-block"></span>
                <span style="font-size:15px;font-weight:700;color:${closest.color}">${closest.key}</span>
                <span style="font-size:14px;margin-left:auto">${medal}</span>
              </div>
              <div style="font-size:12px;color:#8b92b2;margin-bottom:2px">${activeMetric}</div>
              <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">${closest.score}<span style="font-size:13px;color:#8b92b2;font-weight:500">/100</span></div>
              <div style="font-size:11px;color:#556;margin-top:4px">Média: ${avgScore.toFixed(1)}</div>
            </div>
          `
        }
      },
      xAxis3D: {
        type: 'value', min: 0, max: GRID,
        axisLine: { lineStyle: { color: 'rgba(0, 255, 255, 0.1)' } },
        splitLine: { show: true, lineStyle: { color: 'rgba(0, 255, 255, 0.03)', width: 1 } },
        axisLabel: { show: false }, axisTick: { show: false }
      },
      yAxis3D: {
        type: 'value', min: 0, max: GRID,
        axisLine: { lineStyle: { color: 'rgba(0, 255, 255, 0.1)' } },
        splitLine: { show: true, lineStyle: { color: 'rgba(0, 255, 255, 0.03)', width: 1 } },
        axisLabel: { show: false }, axisTick: { show: false }
      },
      zAxis3D: {
        type: 'value', min: 0, max: 250,
        axisLine: { lineStyle: { color: 'rgba(0, 255, 255, 0.1)' } },
        splitLine: { show: false },
        axisLabel: { show: false }, axisTick: { show: false }
      },
      grid3D: {
        show: false,
        viewControl: {
          alpha: 25,
          beta: -35,
          distance: 340,
          panMouseButton: '',
          rotateMouseButton: 'left',
          zoomSensitivity: 1.5,
          minDistance: 140,
          maxDistance: 700,
          autoRotate: autoRotate,
          autoRotateSpeed: 2.8,
          autoRotateAfterStill: 4,
        },
        boxWidth: 320,
        boxDepth: 320,
        boxHeight: 140,
        environment: 'none',
        light: {
          main: { intensity: 1.8, shadow: false, alpha: 25, beta: 35 },  // NO shadows
          ambient: { intensity: 0.7 }
        },
        postEffect: {
          enable: true,
          bloom: { enable: true, intensity: 0.2, bloomRadius: 4 },  // Lighter bloom
          // NO SSAO - biggest performance killer removed
        }
      },
      series: [
        {
          type: 'bar3D',
          data,
          shading: 'lambert',
          barSize: 4.5,           // Larger bars to cover step=3 gaps
          silent: false,
          animation: true,
          animationDurationUpdate: 600,
          animationEasingUpdate: 'cubicOut'
        },
        {
          type: 'scatter3D',
          data: labels,
          symbolSize: 0.01,
          silent: true
        }
      ]
    }
  }, [radarData, activeMetric, autoRotate, compareMode, selectedAIs, rankings, avgScore])

  return (
    <div className="dash3d-container-fluid">
      <div className="dash3d-wrapper">

        {/* Metric Filter Panel */}
        <div className="dash3d-metric-panel">

          <div className="dash3d-metric-panel-title">
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#00ffff' }}>tune</span>
            <span>FILTRO DE MÉTRICA</span>
          </div>

          {METRICS.map(m => (
            <button
              key={m.key}
              className={`dash3d-metric-btn ${activeMetric === m.key ? 'active' : ''}`}
              onClick={() => setActiveMetric(m.key)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{m.icon}</span>
              <span>{m.key}</span>
            </button>
          ))}

          <div className="dash3d-metric-divider" />

          <button
            className={`dash3d-compare-btn ${compareMode ? 'active' : ''}`}
            onClick={() => { setCompareMode(!compareMode); setSelectedAIs([]) }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>compare_arrows</span>
            <span>{compareMode ? 'Sair Comparação' : 'Comparar A vs B'}</span>
          </button>

          {compareMode && (
            <div className="dash3d-compare-hint">
              Clique em 2 modelos para comparar
            </div>
          )}

          <div className="dash3d-metric-divider" />

          <div className="dash3d-metric-panel-title" style={{ marginTop: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#00ffff' }}>format_list_bulleted</span>
            <span>MODELOS</span>
          </div>

          <div className="dash3d-legend-grid">
            {AI_MODELS.map(m => {
              const metricRow = radarData.find(r => r.attribute === activeMetric)
              const score = metricRow ? metricRow[m.key] : 0
              const rank = rankings[m.key]?.rank
              const medal = RANK_MEDALS[rank] || ''
              const isSelected = selectedAIs.includes(m.key)
              return (
                <div
                  key={m.key}
                  className={`dash3d-legend-item ${compareMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => compareMode && toggleCompareAI(m.key)}
                >
                  <span className="dash3d-legend-dot" style={{ background: m.color }} />
                  <span className="dash3d-legend-name">{m.key}</span>
                  <span className="dash3d-legend-medal">{medal}</span>
                  <span className="dash3d-legend-score" style={{ color: m.color }}>{score}</span>
                </div>
              )
            })}
          </div>

          <div className="dash3d-avg-indicator">
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#00e5ff' }}>analytics</span>
            <span>Média: <strong>{avgScore.toFixed(1)}</strong></span>
          </div>
        </div>

        {/* 3D Chart */}
        <div className="dash3d-chart-container">
          <ReactECharts
            ref={chartRef}
            option={chartOptions}
            style={{ width: '100%', height: '100%', display: 'block' }}
            opts={{ renderer: 'webgl' }}
            notMerge={true}
            onChartReady={handleChartReady}
          />
        </div>

      </div>
    </div>
  )
}
