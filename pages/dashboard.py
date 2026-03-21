import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from data import get_models_df, CATEGORIES, get_model_performance

def render():
    """Render dashboard page com foco em especialidades médicas e Radar 3D"""
    
    # Header com foco acadêmico
    st.markdown("### 🏥 Avaliação de Performance Clínica")
    st.title("Dashboard Analítico — LIAS")
    st.markdown("Comparativo de Modelos de IA em Cenários de Saúde (2018-2025)")
    st.divider()
    
    # Sidebar filters para especialidades
    st.sidebar.markdown("### 🩺 Especialidades")
    
    # Obtém os dados
    models_df = get_models_df()
    
    # Filtro por Especialidade
    selected_categories = st.sidebar.multiselect(
        "Filtrar por Especialidade",
        CATEGORIES,
        default=CATEGORIES[:4] if len(CATEGORIES) >= 4 else CATEGORIES
    )
    
    st.sidebar.divider()
    
    # Performance metrics
    performance = get_model_performance(models_df)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            "Top Acurácia Diagnóstica",
            performance["best_accuracy"]["Modelo"],
            f"{performance['best_accuracy']['Acurácia']} pts"
        )
    
    with col2:
        st.metric(
            "Melhor Coerência Clínica",
            performance["best_coherence"]["Modelo"],
            f"{performance['best_coherence']['Coerência']} pts"
        )
    
    with col3:
        st.metric(
            "Maior Profundidade Científica",
            performance["best_depth"]["Modelo"],
            f"{performance['best_depth']['Profundidade']} pts"
        )
    
    st.divider()
    
    # Gráficos Comparativos
    col1, col2 = st.columns(2)
    
    # ==========================================
    # GRÁFICO DE PIZZA EXPLODIDO 3D COM EFEITOS AVANÇADOS (col1)
    # ==========================================
    with col1:
        st.markdown("#### 🍕 Distribuição de Performance por Modelo (3D Explodido)")
        
        # Calcular pontuação combinada (média de Acurácia, Coerência e Profundidade)
        models_df['Pontuacao_Combinada'] = (models_df['Acurácia'] + models_df['Coerência'] + models_df['Profundidade']) / 3
        
        # Cores vibrantes e contrastantes para cada fatia com gradientes simulados
        pie_colors = [
            "#00f3ff",  # Cyan Neon
            "#00ff88",  # Verde Neon
            "#a855f7",  # Roxo Neon
            "#f59e0b",  # Amarelo Dourado
            "#ef4444",  # Vermelho Vibrante
            "#3b82f6"   # Azul Royal
        ]
        
        # Valores e labels
        values = models_df['Pontuacao_Combinada'].tolist()
        labels = models_df['Modelo'].tolist()
        
        # Criar efeito explodido (cada fatia separada do centro com valores diferentes para realismo)
        pull_values = [0.1, 0.12, 0.08, 0.1, 0.09, 0.11]  # Explosão varied for natural look
        
        # Criar o gráfico de pizza 3D estilo donut com profundidade
        fig = go.Figure()
        
        # Camada de sombra/Profundidade (base da pizza 3D)
        fig.add_trace(go.Pie(
            labels=labels,
            values=[v * 1.02 for v in values],  # Levemente maior
            pull=[p + 0.15 for p in pull_values],  # Mais explodido
            hole=0.35,  # Buraco central para efeito donut
            marker=dict(
                colors=['rgba(0,0,0,0.4)'] * len(values),
                line=dict(color='rgba(0,0,0,0.5)', width=3)
            ),
            textinfo='none',
            hoverinfo='skip',
            showlegend=False,
            sort=False,  # Manter ordem
        ))
        
        # Camada principal da pizza (frente)
        fig.add_trace(go.Pie(
            labels=labels,
            values=values,
            pull=pull_values,
            hole=0.35,
            marker=dict(
                colors=pie_colors,
                line=dict(
                    color='white',
                    width=3
                )
            ),
            textinfo='label+percent',
            textposition='outside',
            textfont=dict(
                size=13,
                color='white',
                family='Arial Black'
            ),
            texttemplate="<b>%{label}</b><br>%{percent}",
            hovertemplate="<b>%{label}</b><br>" +
                          "Pontuação: %{value:.2f}<br>" +
                          "Percentual: %{percent}<extra></extra>",
            opacity=0.98,
            sort=False,
        ))
        
        # Camada de brilho/reflexo (overlay de brilho sutil)
        fig.add_trace(go.Pie(
            labels=labels,
            values=[v * 0.3 for v in values],  # 30% do valor
            pull=pull_values,
            hole=0.45,  # Buraco maior (mais para dentro)
            marker=dict(
                colors=['rgba(255,255,255,0.15)'] * len(values),
                line=dict(color='rgba(255,255,255,0.1)', width=1)
            ),
            textinfo='none',
            hoverinfo='skip',
            showlegend=False,
            sort=False,
        ))
        
        # Configurar layout com fundo limpo e profissional
        fig.update_layout(
            title=dict(
                text="<b>🍕 Pizza 3D Explodida</b><br><sup>Distribuição de Performance dos Modelos de IA</sup>",
                x=0.5,
                font=dict(color="#ffffff", size=18, family='Arial Black'),
                y=0.97
            ),
            # Fundo escuro limpo para contraste máximo
            paper_bgcolor="#050510",
            plot_bgcolor="#050510",
            # Borda sutil ao redor do gráfico
            margin=dict(l=50, r=50, t=90, b=70),
            # Legenda profissional
            showlegend=True,
            legend=dict(
                orientation="v",
                yanchor="middle",
                y=0.5,
                xanchor="center",
                x=1.18,
                bgcolor="rgba(15,15,30,0.95)",
                bordercolor="rgba(255,255,255,0.15)",
                borderwidth=2,
                font=dict(color="#e0e0e0", size=12),
                title=dict(
                    text="<b>🤖 Modelos</b>",
                    font=dict(color="#ffffff", size=14)
                )
            ),
            height=580,
        )
        
        # Configurar rotação inicial para evidenciar 3D
        fig.update_traces(
            rotation=20,
            domain=dict(x=[0.02, 0.88])
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Legenda explicativa com formatação
        st.markdown("""
        <div style='background: linear-gradient(90deg, rgba(0,243,255,0.1) 0%, rgba(168,85,247,0.1) 100%); 
                    padding: 12px; border-radius: 8px; border-left: 3px solid #00f3ff;'>
            <p style='margin:0; color: #e0e0e0; font-size: 13px;'>
                <b>💡 Interpretação:</b> Cada fatia representa a pontuação combinada de <b>Acurácia</b>, 
                <b>Coerência</b> e <b>Profundidade</b>. O efeito <b>explodido</b> destaca visualmente 
                cada segmento, enquanto as <b>camadas de sombra</b> criam profundidade 3D.
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    # ==========================================
    # Gráfico de Latência (col2)
    # ==========================================
    with col2:
        st.markdown("#### ⏱️ Latência por Modelo (Segundos)")
        fig_bar = px.bar(
            models_df,
            x="Modelo",
            y="Velocidade",
            color="Velocidade",
            color_continuous_scale="Viridis",
            labels={"Velocidade": "Segundos"}
        )
        fig_bar.update_layout(paper_bgcolor="#000a1a", font=dict(color="#e0f9ff"), height=450)
        st.plotly_chart(fig_bar, use_container_width=True)

    # Tabela detalhada
    st.markdown("#### 📊 Matriz Comparativa Detalhada")
    st.dataframe(
        models_df,
        use_container_width=True,
        hide_index=True
    )