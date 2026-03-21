"""
Data module for LIAS Dashboard
Contains mock data, data utilities, and database connections (MySQL/PostgreSQL)
"""

import os
import random
import pandas as pd
from datetime import datetime, timedelta

# Importações para Banco de Dados
import mysql.connector
import psycopg2

# ─── Dados dos Modelos (Foco em Pesquisa Acadêmica) ───────────────────────────

MODELS_DATA = [
    {
        "Modelo": "Manus",
        "Acurácia": 9,
        "Coerência": 8,
        "Profundidade": 7,
        "Velocidade": 2.5,
        "Custo": 0.10,
        "Segurança": 9,
        "Foco": "Triagem de Artigos"
    },
    {
        "Modelo": "Claude 3.5",
        "Acurácia": 10,
        "Coerência": 9,
        "Profundidade": 8,
        "Velocidade": 1.5,
        "Custo": 0.15,
        "Segurança": 9,
        "Foco": "Análise de Desinformação"
    },
    {
        "Modelo": "DeepSeek R1",
        "Acurácia": 9,
        "Coerência": 7,
        "Profundidade": 9,
        "Velocidade": 2.0,
        "Custo": 0.12,
        "Segurança": 8,
        "Foco": "Modelagem Preditiva (2018-2025)"
    },
    {
        "Modelo": "Perplexidade",
        "Acurácia": 8,
        "Coerência": 8,
        "Profundidade": 6,
        "Velocidade": 1.8,
        "Custo": 0.11,
        "Segurança": 8,
        "Foco": "Busca Real-Time"
    },
    {
        "Modelo": "Grok 2",
        "Acurácia": 7,
        "Coerência": 6,
        "Profundidade": 5,
        "Velocidade": 1.6,
        "Custo": 0.14,
        "Segurança": 6,
        "Foco": "Análise de Sentimento (Redes Sociais)"
    },
    {
        "Modelo": "Chat.Z.Ai",
        "Acurácia": 8,
        "Coerência": 7,
        "Profundidade": 7,
        "Velocidade": 2.2,
        "Custo": 0.13,
        "Segurança": 8,
        "Foco": "Extração de Dados Epidemiológicos"
    },
]

CATEGORIES = [
    "Diagnóstico Diferencial",
    "Interações Medicamentosas",
    "Educação do Paciente",
    "Revisão de Literatura",
    "Ética Médica",
    "Interpretação de Exames",
    "Dosagem de Medicamentos",
    "Interpretação e coerência",
    "Origem tecidual cardíaca",
    "Modulação noraadrenérgica",
    "Bioquímica Nutricional",
    "Alterações no perfil lípidico"
]

# ─── Funções de Dados Simulados (Mock) ────────────────────────────────────────

def generate_mock_logs(count=50):
    """Generate mock log entries for testing"""
    logs = []
    models = [m["Modelo"] for m in MODELS_DATA]
    categories = CATEGORIES
    statuses = ["sucesso", "erro", "timeout"]
    
    prompts_exemplo = [
        "Extrair taxa de adesão vacinal entre jovens em 2019.",
        "Analisar correlação entre fake news no WhatsApp e queda na cobertura de HPV.",
        "Filtrar artigos de revisão sistemática publicados entre 2018 e 2025.",
        "Identificar sentimento predominante em tweets sobre vacinação em 2021.",
        "Resumir a metodologia do estudo sobre hesitância vacinal no Brasil."
    ]
    
    for i in range(count):
        date = datetime.now() - timedelta(days=random.randint(0, 7))
        logs.append({
            "id": i + 1,
            "data": date,
            "modelo": random.choice(models),
            "categoria": random.choice(categories),
            "prompt": random.choice(prompts_exemplo),
            "resposta": f"Resposta analítica gerada com base nos dados fornecidos #{i+1}",
            "latencia": round(random.uniform(0.5, 3.0), 2),
            "tokens": random.randint(100, 800),
            "custo": round(random.uniform(0.005, 0.03), 4),
            "status": random.choice(statuses),
            "confianca": round(random.uniform(0.85, 0.99), 2),
        })
    
    return sorted(logs, key=lambda x: x["data"], reverse=True)

def generate_analytics_data(days=8):
    """Generate analytics data for trend visualization"""
    data = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=days-i-1)).strftime("%d/%m")
        data.append({
            "date": date,
            "latencia": round(random.uniform(1.0, 2.5), 2),
            "custo": round(random.uniform(0.004, 0.007), 4),
            "confianca": round(random.uniform(0.92, 0.99), 2),
            "tokens": random.randint(200, 450),
        })
    return data

# ─── Funções Utilitárias do Pandas ────────────────────────────────────────────

def get_models_df():
    """Return models as DataFrame"""
    return pd.DataFrame(MODELS_DATA)

def get_logs_df(logs=None):
    """Return logs as DataFrame"""
    if logs is None:
        logs = generate_mock_logs()
    return pd.DataFrame(logs)

def filter_logs_by_model(logs_df, model):
    """Filter logs by model name"""
    if model == "Todos":
        return logs_df
    return logs_df[logs_df["modelo"] == model]

def filter_logs_by_status(logs_df, status):
    """Filter logs by status"""
    if status == "Todos":
        return logs_df
    return logs_df[logs_df["status"] == status]

def get_log_stats(logs_df):
    """Calculate statistics from logs"""
    if len(logs_df) == 0:
        return {
            "total_logs": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "avg_latency": 0.0,
            "avg_confidence": 0.0,
        }
    
    return {
        "total_logs": len(logs_df),
        "total_tokens": int(logs_df["tokens"].sum()),
        "total_cost": round(logs_df["custo"].sum(), 4),
        "avg_latency": round(logs_df["latencia"].mean(), 2),
        "avg_confidence": round(logs_df["confianca"].mean(), 2),
    }

def get_model_performance(models_df):
    """Get top performing models"""
    return {
        "best_accuracy": models_df.loc[models_df["Acurácia"].idxmax()],
        "best_coherence": models_df.loc[models_df["Coerência"].idxmax()],
        "best_depth": models_df.loc[models_df["Profundidade"].idxmax()],
    }

def export_logs_json(logs_df):
    """Export logs to JSON format"""
    return logs_df.to_json(orient="records", date_format="iso", indent=2)

def export_logs_csv(logs_df):
    """Export logs to CSV format with UTF-8 encoding to support special characters"""
    return logs_df.to_csv(index=False, encoding='utf-8')

# ─── Integração MySQL ─────────────────────────────────────────────────────────

def get_mysql_config():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "lias"),
    }

def get_logs_from_mysql(limit=50, offset=0):
    """Buscar logs do banco de dados MySQL"""
    try:
        conn = mysql.connector.connect(**get_mysql_config())
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM logs ORDER BY data DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        logs = cursor.fetchall()
        cursor.close()
        conn.close()
        return logs
    except mysql.connector.Error as err:
        print(f"Erro de banco de dados (MySQL): {err}")
        return []

def create_log_entry_mysql(log_data):
    """Criar novo log no banco de dados MySQL"""
    try:
        conn = mysql.connector.connect(**get_mysql_config())
        cursor = conn.cursor()
        query = """
            INSERT INTO logs
            (modelo, categoria, prompt, resposta, latencia, tokens, custo, status, confianca)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            log_data["modelo"],
            log_data["categoria"],
            log_data["prompt"],
            log_data["resposta"],
            log_data["latencia"],
            log_data["tokens"],
            log_data["custo"],
            log_data["status"],
            log_data["confianca"],
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except mysql.connector.Error as err:
        print(f"Erro ao inserir log (MySQL): {err}")
        return False

# ─── Integração PostgreSQL ────────────────────────────────────────────────────

def get_postgres_config():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "lias"),
    }

def get_logs_from_postgres(limit=50, offset=0):
    """Buscar logs do banco de dados PostgreSQL"""
    try:
        conn = psycopg2.connect(**get_postgres_config())
        cursor = conn.cursor()
        # Nota: psycopg2 retorna tuplas por padrão. Para retornar dicionários,
        # seria ideal usar psycopg2.extras.RealDictCursor
        cursor.execute(
            "SELECT * FROM logs ORDER BY data DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        logs = cursor.fetchall()
        cursor.close()
        conn.close()
        return logs
    except psycopg2.Error as err:
        print(f"Erro de banco de dados (PostgreSQL): {err}")
        return []