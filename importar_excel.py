import os
import pandas as pd
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

print("⏳ A iniciar a importação com cálculo inteligente de custos e tokens...")

arquivo_csv = "Base Dados Estructural Saúde.csv" # Atualizado para o nome do seu arquivo

# --- TABELA DE PREÇOS SIMULADA (Custo por 1.000 tokens) ---
# Formato: "Nome da IA": (Custo_Input_1k, Custo_Output_1k)
TABELA_PRECOS = {
    "Claude 3.5": (0.003, 0.015),
    "DeepSeek R1": (0.00014, 0.00028),
    "Manus": (0.005, 0.015),
    "Chat.Z.Ai": (0.001, 0.002),
    "Perplexity": (0.002, 0.008),
    "Grok 2": (0.002, 0.010)
}

def calcular_custo_e_tokens(modelo, prompt, resposta):
    """Calcula o custo baseado no tamanho do texto e na tabela de preços do modelo"""
    # 1 token ≈ 4 caracteres
    tokens_input = max(1, len(str(prompt)) // 4)
    tokens_output = max(1, len(str(resposta)) // 4)
    total_tokens = tokens_input + tokens_output
    
    # Identifica o modelo (com tolerância a nomes parecidos como 'Claude' vs 'Claude 3.5')
    modelo_encontrado = "Claude 3.5" # Padrão de segurança
    for key in TABELA_PRECOS.keys():
        if str(modelo).lower() in key.lower() or key.lower() in str(modelo).lower():
            modelo_encontrado = key
            break
            
    preco_in, preco_out = TABELA_PRECOS[modelo_encontrado]
    
    # Regra de 3 para calcular o custo exato
    custo_total = (tokens_input / 1000.0 * preco_in) + (tokens_output / 1000.0 * preco_out)
    
    # Garantir que o custo mínimo não é 0
    custo_final = max(0.0001, round(custo_total, 4))
    
    return total_tokens, custo_final

try:
    try:
        df = pd.read_csv(arquivo_csv, sep=';', encoding='utf-8')
        if len(df.columns) < 5:
            df = pd.read_csv(arquivo_csv, sep=',', encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(arquivo_csv, sep=';', encoding='cp1252')
        if len(df.columns) < 5:
            df = pd.read_csv(arquivo_csv, sep=',', encoding='cp1252')

    print(f"✅ Ficheiro lido com sucesso! Encontradas {len(df)} linhas.")

    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "lias")
    )
    cursor = conn.cursor()

    cursor.execute("TRUNCATE TABLE logs;")

    registos_inseridos = 0

    for index, row in df.iterrows():
        if pd.isna(row.get('Nome da IA')) or pd.isna(row.get('Prompt (Pergunta)')):
            continue
            
        modelo_nome = str(row['Nome da IA'])
        prompt_texto = str(row['Prompt (Pergunta)'])
        resposta_texto = str(row['Resposta da IA']) if not pd.isna(row.get('Resposta da IA')) else "Sem resposta."

        categoria_base = str(row['Categoria do Teste']) if not pd.isna(row.get('Categoria do Teste')) else "Geral"
        subcategoria = str(row['Subcategoria']) if not pd.isna(row.get('Subcategoria')) else ""
        categoria_final = f"{categoria_base} - {subcategoria}" if subcategoria else categoria_base

        latencia = float(str(row.get('Tempo de Resposta (s)', '2.5')).replace(',', '.')) if not pd.isna(row.get('Tempo de Resposta (s)')) else 2.5
        
        # ---> A MÁGICA ACONTECE AQUI <---
        # Se você preencheu o custo no Excel, ele usa. Se não, ele calcula dinamicamente!
        if pd.isna(row.get('Custo da Requisição ($)')):
            total_tokens, custo = calcular_custo_e_tokens(modelo_nome, prompt_texto, resposta_texto)
        else:
            custo = float(str(row.get('Custo da Requisição ($)')).replace(',', '.'))
            total_tokens = (len(prompt_texto) + len(resposta_texto)) // 4

        pontuacao_raw = str(row.get('Pontuação (0-10)', '9')).replace(',', '.')
        confianca = float(pontuacao_raw) / 10.0 if not pd.isna(row.get('Pontuação (0-10)')) else 0.90

        data_teste = row.get('Data do Teste')
        if pd.isna(data_teste):
            data_teste = pd.Timestamp.now().strftime('%Y-%m-%d')
        data_formatada = f"{data_teste} 12:00:00"

        query = """
            INSERT INTO logs (data, modelo, categoria, prompt, resposta, latencia, tokens, custo, status, confianca)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        valores = (
            data_formatada, modelo_nome, categoria_final, prompt_texto, 
            resposta_texto, latencia, total_tokens, custo, "sucesso", confianca
        )
        
        cursor.execute(query, valores)
        registos_inseridos += 1

    conn.commit()
    print(f"🎉 SUCESSO! {registos_inseridos} interações foram importadas com custos calculados dinamicamente.")

    cursor.close()
    conn.close()

except FileNotFoundError:
    print(f"❌ Erro: O ficheiro '{arquivo_csv}' não foi encontrado.")
except Exception as e:
    print(f"❌ Ocorreu um erro inesperado: {e}")