import React, { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const attributes = ['Raciocínio', 'Criatividade', 'Confiabilidade', 'Usabilidade', 'Segurança', 'Potencial Saúde']
const MAX_RADIUS = 3.5

function RadarBackground() {
  // Gride de Pentágonos / Hexágonos (Teia concêntrica)
  const rings = useMemo(() => {
    const lines = []
    for (let r = 1; r <= 5; r++) {
      const radius = (MAX_RADIUS / 5) * r
      const pts = []
      for (let i = 0; i <= 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0))
      }
      lines.push(pts)
    }
    return lines
  }, [])

  // Linhas retas cruzando do centro até as pontas
  const axes = useMemo(() => {
    const lines = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
      lines.push([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * MAX_RADIUS, Math.sin(angle) * MAX_RADIUS, 0)
      ])
    }
    return lines
  }, [])

  return (
    <group>
      {rings.map((pts, idx) => {
        const ringValue = 50 + ((idx + 1) * 10)
        // Posicionando o dístico logo ao lado do primeiro nó da teia para referenciar a métrica visualmente
        return (
          <group key={`ring-${idx}`}>
            <Line points={pts} color="rgba(165,170,194,0.15)" lineWidth={1} />
            <Text
              position={[pts[0].x + 0.05, pts[0].y + 0.1, 0.02]}
              fontSize={0.16}
              color="rgba(165,170,194,0.7)"
              anchorX="left"
              anchorY="bottom"
              fontStyle="italic"
            >
              {ringValue}
            </Text>
          </group>
        )
      })}
      {axes.map((pts, idx) => (
        <Line key={`axis-${idx}`} points={pts} color="rgba(165,170,194,0.15)" lineWidth={1} />
      ))}
      
      {/* Texto Flutuante nos Eixos */}
      {attributes.map((attr, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const radius = MAX_RADIUS + 0.6
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return (
          <Text
            key={attr}
            position={[x, y, 0]}
            fontSize={0.25}
            color="#dfe4fe"
            anchorX="center"
            anchorY="middle"
            fontStyle="bold"
          >
            {attr}
          </Text>
        )
      })}
    </group>
  )
}

function radarShapeFromData(radarData, modelKey) {
  const valueMap = {}
  radarData.forEach(item => {
    valueMap[item.attribute] = item[modelKey]
  })
  
  const points = []
  const vPoints = []
  attributes.forEach((attr, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    // Mapeamento normalizado simulando domain=[50, 100] para não aglutinar
    const rawVal = valueMap[attr] || 0
    const normalized = Math.max(0, (rawVal - 50) / 50)
    const radius = normalized * MAX_RADIUS
    
    points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius))
    vPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0))
  })
  // Fechar o loop da linha para o contorno ser perfeito
  vPoints.push(vPoints[0].clone())
  
  const shape = new THREE.Shape(points)
  return { shape, vPoints }
}

function ModelPolygon({ modelKey, color, radarData, zOffset }) {
  const { shape, vPoints } = useMemo(() => radarShapeFromData(radarData, modelKey), [radarData, modelKey])
  
  const extrudeSettings = useMemo(() => ({
    depth: 0.3, // Faz o polígono ter profundidade (um sólido de vidro)
    bevelEnabled: false
  }), [])

  const [hovered, setHovered] = useState(false)

  return (
    <group 
      position={[0, 0, zOffset]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      {/* O Volume Sólido */}
      <mesh>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshPhysicalMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.6 : 0.25} 
          roughness={0.2}
          transmission={0.5}
          thickness={0.5}
        />
      </mesh>
      
      {/* Linhas de Contorno 2D fixadas no topo do sólido (z=0.3) */}
      <Line points={vPoints.map(p => [p.x, p.y, 0.31])} color={color} lineWidth={hovered ? 4 : 2} />
      
      {/* Esferas luminosas em cada ponta/vértice */}
      {vPoints.slice(0, 6).map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.31]}>
          <circleGeometry args={[hovered ? 0.12 : 0.08, 16]} />
          <meshBasicMaterial color={hovered ? '#ffffff' : color} />
        </mesh>
      ))}

      {/* Tooltip HTML 3D Interativo */}
      {hovered && (
        <Html position={[0, 0, 0.8]} center style={{ pointerEvents: 'none' }}>
          <div className="animate-in" style={{ 
            background: 'rgba(28,37,62,0.95)', padding: '12px', border: `1px solid ${color}`, 
            borderRadius: '8px', color: '#fff', whiteSpace: 'nowrap',
            boxShadow: `0 0 20px ${color}40`, backdropFilter: 'blur(8px)'
          }}>
            <h4 style={{ margin: 0, color, fontSize: '0.875rem', fontWeight: 700, marginBottom: '6px' }}>{modelKey}</h4>
            <div style={{ display: 'grid', gap: '4px' }}>
              {radarData.map((rd, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.75rem' }}>
                  <span style={{ color: '#a5aac2' }}>{rd.attribute}</span>
                  <span style={{ fontWeight: 700 }}>{rd[modelKey]}</span>
                </div>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function Radar3D({ radarData, availableModels, activeModels }) {
  return (
    <div style={{ width: '100%', height: 560, position: 'relative' }}>
      <Canvas camera={{ position: [0, -4.5, 6], fov: 50 }}>
        <ambientLight intensity={1} />
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={1.2} 
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={0}
        />
        
        {/* Inclina a âncora para simular uma mesa holográfica sendo olhada de cima */}
        <group rotation={[-Math.PI / 5, 0, 0]}>
          <RadarBackground />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          {availableModels.map((m, idx) => {
            if (!activeModels.includes(m.key)) return null
            return (
              <ModelPolygon 
                key={m.key} 
                modelKey={m.key} 
                color={m.color} 
                radarData={radarData}
                zOffset={0.05 * idx} // Efeito de solidos empilhados
              />
            )
          })}
        </group>
      </Canvas>
      <div style={{ position: 'absolute', bottom: 16, right: 16, color: 'rgba(165,170,194,0.6)', fontSize: '0.75rem', background: 'rgba(16,21,37,0.8)', padding: '4px 12px', borderRadius: '16px' }}>
        Arraste para orbitar, passe o mouse para explorar os sólidos.
      </div>
    </div>
  )
}
