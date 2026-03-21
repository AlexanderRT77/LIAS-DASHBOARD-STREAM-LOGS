"""
Página para inserção manual de novos logs na base de dados
"""

import streamlit as st
from data import CATEGORIES, create_log_entry_mysql

def render():
    st.markdown("### ✍️ Inserir Novo Registo")
    st.title("Adicionar Log Manual")
    st.markdown("Insira manualmente os dados de uma nova interação na base de dados da sua pesquisa.")
    st.divider()

    # Criar o formulário
    with st.form("novo_log_form", clear_on_submit=True):
        col1, col2 = st.columns(2)
        
        with col1:
            modelo = st.selectbox("Modelo de IA", ["Claude 3.5", "DeepSeek R1", "Manus", "Chat.Z.Ai", "Perplexidade", "Grok 2"])
            categoria = st.selectbox("Categoria / Foco", CATEGORIES)
            status = st.selectbox("Status", ["sucesso", "erro", "timeout"])
        
        with col2:
            latencia = st.number_input("Latência (segundos)", min_value=0.0, value=1.5, step=0.1)
            tokens = st.number_input("Total de Tokens", min_value=1, value=250, step=10)
            custo = st.number_input("Custo ($)", min_value=0.0, value=0.0150, format="%.4f")
            confianca = st.number_input("Confiança (0.0 a 1.0)", min_value=0.0, max_value=1.0, value=0.95, step=0.01)
            
        prompt = st.text_area("Prompt (Pergunta ou Comando)", height=100, placeholder="Ex: Analisar correlação entre fake news e queda na vacinação...")
        resposta = st.text_area("Resposta do Modelo", height=150, placeholder="Cole aqui a resposta gerada pela IA...")
        
        # Botão de submissão
        submit = st.form_submit_button("💾 Guardar Registo na Base de Dados")
        
        if submit:
            if not prompt or not resposta:
                st.warning("⚠️ Por favor, preencha o Prompt e a Resposta antes de guardar.")
            else:
                # Prepara os dados para enviar para o MySQL
                log_data = {
                    "modelo": modelo,
                    "categoria": categoria,
                    "prompt": prompt,
                    "resposta": resposta,
                    "latencia": latencia,
                    "tokens": tokens,
                    "custo": custo,
                    "status": status,
                    "confianca": confianca
                }
                
                # Chama a função que já tínhamos criado no data.py
                sucesso = create_log_entry_mysql(log_data)
                
                if sucesso:
                    st.success("✅ Registo guardado com sucesso! Já pode vê-lo na página de Logs.")
                else:
                    st.error("❌ Ocorreu um erro ao guardar na base de dados. Verifique a ligação ao MySQL.")
    