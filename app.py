"""
LIAS Dashboard - Streamlit Application
Análise de Desempenho de Modelos de IA
"""

import os
import sys
import json
import csv
from io import StringIO
from datetime import datetime, timedelta

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import streamlit.components.v1 as components
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# ==========================================
# 1. CONFIGURAÇÃO DA PÁGINA (Obrigatório ser o 1º comando)
# ==========================================
st.set_page_config(
    page_title="LIAS Dashboard",
    page_icon=":bar_chart:",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# 2. TELA DE INTRODUÇÃO DESTRUTIVA - TRANSIÇÃO INTELIGENTE
# ==========================================
if 'intro_assistida' not in st.session_state:
    st.session_state.intro_assistida = False

if not st.session_state.intro_assistida:
    # 1. CSS de Tela Cheia e Ocultação
    st.markdown("""
        <style>
            [data-testid="stSidebar"] {display: none !important;}
            [data-testid="stHeader"] {display: none !important;}
            .block-container {padding: 0 !important; max-width: 100% !important;}
            
            [data-testid="stVideo"] {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 999999 !important;
                background-color: black !important;
                margin: 0 !important;
            }
            video {
                width: 100vw !important;
                height: 100vh !important;
                object-fit: cover !important;
            }
            div[data-testid="stButton"] {
                display: none !important;
            }
        </style>
    """, unsafe_allow_html=True)
    
    # 2. O botão "Fantasma"
    if st.button("PULAR_INTRO_OCULTO"):
        st.session_state.intro_assistida = True
        st.rerun()
        
    # 3. Toca o vídeo do Kratos
    video_path = "HOMENS, QUEIMEM A VILA, E O TEMPLO DE ATENAS, DESTRUAM TUDO E TODOS!.mp4"
    st.video(video_path, autoplay=True)
    
    # 4. O Espião em JavaScript
    components.html("""
        <script>
            const monitorVideo = setInterval(() => {
                const videos = window.parent.document.querySelectorAll('video');
                if (videos.length > 0) {
                    const player = videos[0];
                    player.onended = function() {
                        const botoes = window.parent.document.querySelectorAll('button');
                        botoes.forEach(btn => {
                            if (btn.innerText.includes("PULAR_INTRO_OCULTO")) {
                                btn.click();
                            }
                        });
                    };
                    clearInterval(monitorVideo);
                }
            }, 500);
        </script>
    """, height=0, width=0)

    st.stop()

# ==========================================
# 3. CUSTOM CSS (TEMA CYBERPUNK)
# ==========================================
st.markdown("""
<style>
    :root {
        --primary-color: #00f3ff;
        --secondary-color: #00ff88;
        --accent-color: #a855f7;
        --background: #000a1a;
        --surface: rgba(0, 243, 255, 0.04);
        --border: rgba(0, 243, 255, 0.15);
    }
    
    body {
        background-color: #000a1a;
        color: #e0f9ff;
    }
    
    .stApp {
        background-color: #000a1a;
    }
    
    .metric-card {
        background: rgba(0, 243, 255, 0.04);
        border: 1px solid rgba(0, 243, 255, 0.15);
        border-radius: 12px;
        padding: 20px;
        margin: 10px 0;
    }
    
    h1, h2, h3 {
        color: #00f3ff;
        font-family: 'Courier Prime', monospace;
        text-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
    }
    
    .stMetric {
        background: rgba(0, 243, 255, 0.04);
        border: 1px solid rgba(0, 243, 255, 0.15);
        border-radius: 12px;
        padding: 15px;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 4. SIDEBAR E NAVEGAÇÃO
# ==========================================
st.sidebar.markdown("# LIAS Dashboard")
st.sidebar.markdown("Análise de Desempenho de Modelos de IA")
st.sidebar.divider()

page = st.sidebar.radio(
    "Navegação",
    ["Dashboard", "Logs", "Analytics", "Novo Registo"],
    label_visibility="collapsed"
)

st.sidebar.divider()

st.sidebar.markdown("""
### Sobre
**LIAS Dashboard** é uma plataforma analítica para monitoramento
de desempenho de modelos de IA, com foco em:
- Acurácia
- Coerência
- Profundidade
- Latência
- Custo
- Segurança

**Versão:** 1.0.0  
**Última atualização:** 2026-03-20
""")

# ==========================================
# 5. ROTEAMENTO DE PÁGINAS E VISUALIZADOR 3D
# ==========================================
# Importar as páginas (Agora que as configurações principais foram feitas)
from pages import dashboard, logs, analytics, novo_log

# Lógica condicional: O que mostrar dependendo da escolha na barra lateral
if page == "Dashboard":
    
    # --- INÍCIO DO VISUALIZADOR 3D (Apenas no Dashboard) ---
    st.title("Visualizador 3D Local (.glb)")

    path_to_model = "app/static/LeonIshrat.glb"

    model_html = f"""
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
        <model-viewer src="{path_to_model}"
                      alt="Modelo 3D no meu dashboard"
                      auto-rotate
                      camera-controls
                      shadow-intensity="1"
                      style="width: 100%; height: 600px; background-color: transparent;">
        </model-viewer>
    """

    st.components.v1.html(model_html, height=620)
    st.info("Use o rato para rodar e o scroll para dar zoom no modelo acima.")
    st.divider()
    # --- FIM DO VISUALIZADOR 3D ---

    # Carrega o resto do conteúdo do dashboard
    dashboard.render()

elif page == "Logs":
    logs.render()
elif page == "Analytics":
    analytics.render()
elif page == "Novo Registo":
    novo_log.render()

