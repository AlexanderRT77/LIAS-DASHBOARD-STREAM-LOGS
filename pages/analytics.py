"""
Analytics page - Performance trends and analysis
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from data import generate_analytics_data

def render():
    """Render analytics page"""
    
    # Header
    st.markdown("### 📈 Análise de Tendências")
    st.title("Analytics — LIAS")
    st.markdown("Visualize tendências de performance dos modelos de IA ao longo do tempo")
    st.divider()
    
    # Time range selector
    col1, col2, col3, col4 = st.columns([1, 1, 1, 2])
    
    with col1:
        if st.button("7 dias", use_container_width=True):
            st.session_state.time_range = "7d"
    
    with col2:
        if st.button("30 dias", use_container_width=True):
            st.session_state.time_range = "30d"
    
    with col3:
        if st.button("90 dias", use_container_width=True):
            st.session_state.time_range = "90d"
    
    # Initialize session state
    if "time_range" not in st.session_state:
        st.session_state.time_range = "7d"
    
    # Get analytics data
    if st.session_state.time_range == "7d":
        analytics_data = generate_analytics_data(7)
    elif st.session_state.time_range == "30d":
        analytics_data = generate_analytics_data(30)
    else:
        analytics_data = generate_analytics_data(90)
    
    df = pd.DataFrame(analytics_data)
    
    st.divider()
    
    # Statistics
    st.markdown("#### 📊 Estatísticas Agregadas")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "Latência Média",
            f"{df['latencia'].mean():.2f}s",
            delta=f"{df['latencia'].iloc[-1] - df['latencia'].iloc[0]:.2f}s"
        )
    
    with col2:
        st.metric(
            "Custo Médio",
            f"${df['custo'].mean():.4f}",
            delta=f"${df['custo'].iloc[-1] - df['custo'].iloc[0]:.4f}"
        )
    
    with col3:
        st.metric(
            "Confiança Média",
            f"{df['confianca'].mean():.2%}",
            delta=f"{(df['confianca'].iloc[-1] - df['confianca'].iloc[0])*100:.1f}%"
        )
    
    with col4:
        st.metric(
            "Total de Tokens",
            f"{df['tokens'].sum():,}",
            delta=f"{df['tokens'].iloc[-1] - df['tokens'].iloc[0]}"
        )
    
    st.divider()
    
    # Charts
    st.markdown("#### 📈 Gráficos de Tendência")
    
    col1, col2 = st.columns(2)
    
    # Latency trend
    with col1:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df["date"],
            y=df["latencia"],
            mode="lines+markers",
            name="Latência",
            line=dict(color="#f59e0b", width=2),
            marker=dict(size=6),
            fill="tozeroy",
            fillcolor="rgba(245, 158, 11, 0.2)"
        ))
        
        fig.update_layout(
            title="Tendência de Latência",
            xaxis_title="Data",
            yaxis_title="Latência (s)",
            font=dict(color="#e0f9ff"),
            paper_bgcolor="#000a1a",
            plot_bgcolor="rgba(0,243,255,0.02)",
            xaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            yaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            hovermode="x unified",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    # Cost trend
    with col2:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df["date"],
            y=df["custo"],
            mode="lines+markers",
            name="Custo",
            line=dict(color="#a855f7", width=2),
            marker=dict(size=6),
            fill="tozeroy",
            fillcolor="rgba(168, 85, 247, 0.2)"
        ))
        
        fig.update_layout(
            title="Tendência de Custo",
            xaxis_title="Data",
            yaxis_title="Custo ($)",
            font=dict(color="#e0f9ff"),
            paper_bgcolor="#000a1a",
            plot_bgcolor="rgba(0,243,255,0.02)",
            xaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            yaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            hovermode="x unified",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    col1, col2 = st.columns(2)
    
    # Confidence trend
    with col1:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df["date"],
            y=df["confianca"],
            mode="lines+markers",
            name="Confiança",
            line=dict(color="#00ff88", width=2),
            marker=dict(size=6),
            fill="tozeroy",
            fillcolor="rgba(0, 255, 136, 0.2)"
        ))
        
        fig.update_layout(
            title="Tendência de Confiança",
            xaxis_title="Data",
            yaxis_title="Confiança",
            font=dict(color="#e0f9ff"),
            paper_bgcolor="#000a1a",
            plot_bgcolor="rgba(0,243,255,0.02)",
            xaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            yaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            yaxis_tickformat=".0%",
            hovermode="x unified",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    # Tokens trend
    with col2:
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=df["date"],
            y=df["tokens"],
            name="Tokens",
            marker=dict(color="#00f3ff"),
        ))
        
        fig.update_layout(
            title="Tendência de Tokens",
            xaxis_title="Data",
            yaxis_title="Tokens",
            font=dict(color="#e0f9ff"),
            paper_bgcolor="#000a1a",
            plot_bgcolor="rgba(0,243,255,0.02)",
            xaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            yaxis=dict(tickfont=dict(color="rgba(255,255,255,0.7)")),
            hovermode="x unified",
            height=400,
            showlegend=False
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    st.divider()
    
    # Model performance pie charts
    st.markdown("#### 🎯 Distribuição de Performance")
    
    col1, col2 = st.columns(2)
    
    # Model performance data
    model_performance = [
        {"name": "Claude 3.5", "value": 28},
        {"name": "Manus", "value": 22},
        {"name": "DeepSeek R1", "value": 18},
        {"name": "Perplexidade", "value": 15},
        {"name": "Grok 2", "value": 12},
        {"name": "Chat.Z.Ai", "value": 5},
    ]
    
    category_distribution = [
        {"name": "Código/Análise", "value": 35},
        {"name": "Agente Autônomo", "value": 25},
        {"name": "Lógica/Matemática", "value": 20},
        {"name": "Web Search", "value": 12},
        {"name": "Dados X/Twitter", "value": 5},
        {"name": "Generalista", "value": 3},
    ]
    
    # Model performance pie
    with col1:
        df_model = pd.DataFrame(model_performance)
        fig = px.pie(
            df_model,
            values="value",
            names="name",
            title="Performance por Modelo",
            color_discrete_sequence=["#00f3ff", "#00ff88", "#a855f7", "#f59e0b", "#ef4444", "#1e3a8a"]
        )
        
        fig.update_layout(
            font=dict(color="#e0f9ff"),
            paper_bgcolor="#000a1a",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    # Category distribution pie
    with col2:
        df_category = pd.DataFrame(category_distribution)
        fig = px.pie(
            df_category,
            values="value",
            names="name",
            title="Distribuição por Categoria",
            color_discrete_sequence=["#00f3ff", "#00ff88", "#a855f7", "#f59e0b", "#ef4444", "#1e3a8a"]
        )
        
        fig.update_layout(
            font=dict(color="#e0f9ff"),
            paper_bgcolor="#000a1a",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
