"""
Módulo de Análise Estatística Didática - LIAS Dashboard
Focado em visualização intuitiva com Cidade de Dados 3D.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

st.set_page_config(page_title="Estatísticas - LIAS", page_icon="📊", layout="wide")

IAS_AVALIADAS = ["Manus", "Claude 3.5", "DeepSeek R1", "Perplexidade", "Grok 2", "Chat.Z.Ai"]
METRICAS = ["Acurácia", "Coerência", "Profundidade", "Segurança", "Velocidade", "Custo"]

# Cores vibrantes
CORES_VIBRANTES = {
    "Manus": "#FF3366",       
    "Claude 3.5": "#00FF88",  
    "DeepSeek R1": "#FF9900", 
    "Perplexidade": "#00E5FF",
    "Grok 2": "#FF0033",      
    "Chat.Z.Ai": "#B82E8A"    
}

def gerar_dados_simulados():
    """Gera os dados base"""
    np.random.seed(42)
    dados = {}
    parametros_base = {
        "Manus": {"Acurácia": 8.5, "Coerência": 7.8, "Profundidade": 7.2, "Segurança": 8.8, "Velocidade": 2.5, "Custo": 0.10},
        "Claude 3.5": {"Acurácia": 9.2, "Coerência": 8.8, "Profundidade": 8.5, "Segurança": 9.0, "Velocidade": 1.5, "Custo": 0.15},
        "DeepSeek R1": {"Acurácia": 8.8, "Coerência": 7.5, "Profundidade": 9.0, "Segurança": 8.2, "Velocidade": 2.0, "Custo": 0.12},
        "Perplexidade": {"Acurácia": 8.0, "Coerência": 7.5, "Profundidade": 6.8, "Segurança": 7.8, "Velocidade": 1.8, "Custo": 0.11},
        "Grok 2": {"Acurácia": 7.2, "Coerência": 6.5, "Profundidade": 5.8, "Segurança": 6.5, "Velocidade": 1.6, "Custo": 0.14},
        "Chat.Z.Ai": {"Acurácia": 8.2, "Coerência": 7.2, "Profundidade": 7.5, "Segurança": 8.0, "Velocidade": 2.2, "Custo": 0.13},
    }
    
    for ia, metricas_params in parametros_base.items():
        dados[ia] = {}
        for metrica, media in metricas_params.items():
            desvio = 1.0 if metrica not in ["Velocidade", "Custo"] else 0.3
            valores = np.random.normal(media, desvio, 50)
            if metrica not in ["Velocidade", "Custo"]:
                valores = np.clip(valores, 0, 10)
            dados[ia][metrica] = {
                "media": np.mean(valores),
                "min": np.min(valores),
                "max": np.max(valores)
            }
    return dados

# ═══════════════════════════════════════════════════════════════════════════════
# GRÁFICOS DIDÁTICOS
# ═══════════════════════════════════════════════════════════════════════════════

def plotar_cidade_3d(dados):
    """
    Constrói o Gráfico de Barras 3D aglomerado (A Cidade de Dados).
    Eixo X: Métricas
    Eixo Y: Modelos de IA
    Eixo Z: Pontuação
    """
    fig = go.Figure()
    
    metricas_pilares = ["Acurácia", "Coerência", "Profundidade", "Segurança"]
    
    for y_idx, ia in enumerate(IAS_AVALIADAS):
        cor = CORES_VIBRANTES[ia]
        
        for x_idx, metrica in enumerate(metricas_pilares):
            valor = dados[ia][metrica]["media"]
            
            # Desenha o "Arranha-céu" usando linhas espessas em 3D
            fig.add_trace(go.Scatter3d(
                x=[x_idx, x_idx],
                y=[y_idx, y_idx],
                z=[0, valor],
                mode='lines',
                line=dict(color=cor, width=25), # Largura da barra
                name=ia if x_idx == 0 else "",  # Evita duplicar nomes na legenda
                showlegend=(x_idx == 0),
                hovertemplate=f"<br><b>🤖 IA:</b> {ia}<br><b>🎯 Métrica:</b> {metrica}<br><b>📈 Nota:</b> {valor:.2f}<extra></extra>"
            ))
            
            # Desenha um "teto" na torre para um acabamento visual mais quadrado
            fig.add_trace(go.Scatter3d(
                x=[x_idx], y=[y_idx], z=[valor],
                mode='markers',
                marker=dict(color=cor, size=6, symbol='square'),
                showlegend=False, hoverinfo='skip'
            ))

    # Configuração do espaço 3D (Câmera, Grelhas e Tema Cyberpunk)
    fig.update_layout(
        scene=dict(
            xaxis=dict(
                title="",
                tickvals=[0, 1, 2, 3],
                ticktext=metricas_pilares,
                gridcolor="rgba(255, 255, 255, 0.1)",
                backgroundcolor="#000a1a"
            ),
            yaxis=dict(
                title="",
                tickvals=list(range(len(IAS_AVALIADAS))),
                ticktext=IAS_AVALIADAS,
                gridcolor="rgba(255, 255, 255, 0.1)",
                backgroundcolor="#000a1a"
            ),
            zaxis=dict(
                title="Pontuação Média (0-10)",
                range=[0, 10],
                gridcolor="rgba(255, 255, 255, 0.1)",
                backgroundcolor="#000a1a"
            ),
            camera=dict(
                eye=dict(x=1.6, y=-1.6, z=0.8) # Posiciona a câmera num ângulo diagonal perfeito
            ),
            aspectmode='auto'
        ),
        paper_bgcolor="#000a1a",
        font=dict(color="#e0f9ff"),
        margin=dict(l=0, r=0, b=0, t=30),
        height=550,
        legend=dict(
            orientation="h",
            yanchor="bottom", y=-0.15,
            xanchor="center", x=0.5,
            bgcolor="rgba(0,10,26,0.8)",
            font=dict(color="#e0f9ff", size=14)
        )
    )
    
    return fig

def plotar_velocimetro(valor, metrica, cor):
    """Velocímetro simples e direto"""
    max_val = 10 if metrica not in ["Velocidade", "Custo"] else (5 if metrica == "Velocidade" else 0.3)
    
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=valor,
        number={'font': {'color': cor, 'size': 40}},
        gauge={
            'axis': {'range': [0, max_val], 'tickwidth': 1, 'tickcolor': "white"},
            'bar': {'color': cor, 'thickness': 0.8},
            'bgcolor': "rgba(255,255,255,0.05)",
            'borderwidth': 0,
            'steps': [
                {'range': [0, max_val*0.4], 'color': "rgba(255, 51, 102, 0.15)"},
                {'range': [max_val*0.4, max_val*0.7], 'color': "rgba(255, 153, 0, 0.15)"},
                {'range': [max_val*0.7, max_val], 'color': "rgba(0, 255, 136, 0.15)"}
            ]
        }
    ))
    fig.update_layout(paper_bgcolor="#000a1a", height=250, margin=dict(l=10, r=10, t=20, b=10))
    return fig

# ═══════════════════════════════════════════════════════════════════════════════
# RENDERIZAÇÃO DA INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

def render():
    st.markdown("""
        <h1 style='color: #FF9900; text-align: center;'>📊 Painel de Desempenho (Boletim)</h1>
        <p style='color: #e0f9ff; text-align: center; font-size: 18px;'>
            Interface simplificada para análise de resultados dos modelos de Inteligência Artificial.
        </p>
    """, unsafe_allow_html=True)
    
    with st.expander("📖 Guia Rápido: O que significam estas notas? (Clique para ler)", expanded=False):
        st.markdown("""
        * **Acurácia (0-10):** Capacidade da IA de acertar o alvo (ex: sugerir a conduta clínica exata).
        * **Coerência (0-10):** O texto faz sentido do início ao fim? Evita contradições lógicas?
        * **Profundidade (0-10):** Nível de embasamento científico e detalhamento técnico.
        * **Segurança (0-10):** A IA alerta para riscos? Evita sugerir condutas perigosas ao paciente?
        """)
        
    dados = gerar_dados_simulados()
    st.divider()

    # ═════════════════════════════════════════════════════════════════════
    # A NOVA SEÇÃO 1: CIDADE DE DADOS 3D (Arranha-céus)
    # ═════════════════════════════════════════════════════════════════════
    st.markdown("### 🏙️ Comparativo Direto 3D (Média Geral)")
    st.info("💡 **Dica Didática:** Utilize o botão esquerdo do rato para girar a cidade e passe o cursor por cima das torres para ver a nota exata de cada modelo!")
    
    # Renderiza o novo Gráfico de Barras 3D gigante no centro
    st.plotly_chart(plotar_cidade_3d(dados), use_container_width=True)

    st.divider()

    # SEÇÃO 2: RAIO-X INDIVIDUAL (O Boletim)
    st.markdown("### 🔬 Boletim Detalhado por IA")
    
    tabs = st.tabs([f"🤖 {ia}" for ia in IAS_AVALIADAS])
    
    for tab, ia in zip(tabs, IAS_AVALIADAS):
        with tab:
            cor = CORES_VIBRANTES[ia]
            st.markdown(f"<h3 style='color: {cor}; text-align: center;'>Análise de {ia}</h3>", unsafe_allow_html=True)
            
            col_v1, col_v2, col_v3 = st.columns(3)
            with col_v1:
                st.markdown("<p style='text-align: center; color: #fff;'>Acurácia</p>", unsafe_allow_html=True)
                st.plotly_chart(plotar_velocimetro(dados[ia]["Acurácia"]["media"], "Acurácia", cor), use_container_width=True)
            with col_v2:
                st.markdown("<p style='text-align: center; color: #fff;'>Segurança</p>", unsafe_allow_html=True)
                st.plotly_chart(plotar_velocimetro(dados[ia]["Segurança"]["media"], "Segurança", cor), use_container_width=True)
            with col_v3:
                st.markdown("<p style='text-align: center; color: #fff;'>Profundidade</p>", unsafe_allow_html=True)
                st.plotly_chart(plotar_velocimetro(dados[ia]["Profundidade"]["media"], "Profundidade", cor), use_container_width=True)
            
            st.markdown(f"""
            <div style="background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; border-left: 5px solid {cor};">
                <h4>Intervalo de Performance</h4>
                <p>Nas dezenas de testes realizados, a <b>Acurácia</b> desta IA oscilou entre a nota mais baixa de <b style="color:#FF3366">{dados[ia]['Acurácia']['min']:.1f}</b> e a nota mais alta de <b style="color:#00FF88">{dados[ia]['Acurácia']['max']:.1f}</b>.</p>
            </div>
            """, unsafe_allow_html=True)

if __name__ == "__main__":
    render()