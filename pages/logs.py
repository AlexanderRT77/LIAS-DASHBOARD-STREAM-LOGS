"""
Logs page - Interaction history, detailed logs and AI Benchmark
"""

import streamlit as st
import pandas as pd
from data import (
    get_logs_from_mysql,
    export_logs_csv,
)

def render():
    st.markdown("### 🔬 Análise de Benchmark")
    st.title("Comparativo de Modelos — LIAS")
    st.markdown("Selecione um prompt clínico para comparar diretamente o desempenho e as respostas das 6 IAs.")
    st.divider()
    
    dados_banco = get_logs_from_mysql(limit=500)
    
    if not dados_banco:
        st.info("A base de dados está vazia. Corra o script `popular_banco.py` primeiro.")
        return
        
    logs_df = pd.DataFrame(dados_banco)
    logs_df["data"] = pd.to_datetime(logs_df["data"])
    
    # --- MODO DE COMPARAÇÃO (BENCHMARK) ---
    st.markdown("#### 1. Comparação Direta (Prompt vs. Modelos)")
    perguntas_unicas = logs_df["prompt"].unique().tolist()
    
    pergunta_selecionada = st.selectbox(
        "Selecione a Pergunta Clínica para Analisar:",
        perguntas_unicas
    )
    
    if pergunta_selecionada:
        # Filtra a base de dados apenas para a pergunta selecionada
        df_pergunta = logs_df[logs_df["prompt"] == pergunta_selecionada]
        
        # Mostra o prompt em destaque
        st.info(f"**Pergunta Analisada:** {pergunta_selecionada}")
        
        # Cria uma grelha 2x3 para mostrar as 6 respostas
        cols = st.columns(3)
        modelos_disponiveis = df_pergunta["modelo"].tolist()
        
        for idx, modelo in enumerate(modelos_disponiveis):
            dados_modelo = df_pergunta[df_pergunta["modelo"] == modelo].iloc[0]
            col_idx = idx % 3
            
            with cols[col_idx]:
                with st.container(border=True):
                    st.markdown(f"### 🤖 {modelo}")
                    st.caption(f"⏱ Latência: {dados_modelo['latencia']}s | 🎯 Confiança: {dados_modelo['confianca']:.2%} | 💰 Custo: ${dados_modelo['custo']:.4f}")
                    # Mostra os primeiros 150 caracteres para não sobrecarregar o ecrã
                    resposta_curta = str(dados_modelo['resposta'])[:150] + "..."
                    st.write(resposta_curta)
                    
                    # Expansor para ler a resposta médica completa
                    with st.expander("Ler resposta clínica completa"):
                        st.write(dados_modelo['resposta'])
    
    st.divider()
    
    # --- TABELA DE LOGS GERAIS ---
    st.markdown("#### 2. Tabela de Registos Completa")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        st.download_button(
            label="📥 Exportar Matriz (CSV)",
            data=export_logs_csv(logs_df),
            file_name=f"benchmark_saude_{pd.Timestamp.now().strftime('%Y%m%d')}.csv",
            mime="text/csv",
            use_container_width=True
        )
    
    display_df = logs_df[["data", "modelo", "categoria", "latencia", "confianca", "prompt"]].copy()
    display_df["data"] = display_df["data"].dt.strftime("%d/%m/%Y %H:%M")
    
    st.dataframe(
        display_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "data": "Data",
            "modelo": "Modelo de IA",
            "categoria": "Especialidade",
            "latencia": st.column_config.NumberColumn("Tempo (s)", format="%.2f"),
            "confianca": st.column_config.NumberColumn("Confiança", format="%.2%"),
            "prompt": "Pergunta Clínica"
        }
    )