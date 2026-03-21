import os
import mysql.connector
from dotenv import load_dotenv

# Carrega as senhas do arquivo .env
load_dotenv()

print("⏳ Tentando conectar ao banco de dados MySQL...")

try:
    # Tenta estabelecer a conexão
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "lias")
    )
    cursor = conn.cursor()
    print("✅ Conexão estabelecida com sucesso!\n")

    # 1. Cria a tabela de logs (se ela ainda não existir)
    print("⏳ Verificando a estrutura da tabela...")
    tabela_sql = """
    CREATE TABLE IF NOT EXISTS logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modelo VARCHAR(50),
        categoria VARCHAR(100),
        prompt LONGTEXT,
        resposta LONGTEXT,
        latencia DECIMAL(5, 2),
        tokens INT,
        custo DECIMAL(8, 4),
        status ENUM('sucesso', 'erro', 'timeout'),
        confianca DECIMAL(3, 2)
    )
    """
    cursor.execute(tabela_sql)
    print("✅ Tabela 'logs' pronta para uso!\n")

    # 2. Insere um dado de teste
    print("⏳ Inserindo um dado de teste...")
    inserir_sql = """
        INSERT INTO logs (modelo, categoria, prompt, resposta, latencia, tokens, custo, status, confianca)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    dados_teste = (
        "Claude 3.5", 
        "Análise de Desinformação", 
        "Resumir o impacto de fake news no WhatsApp sobre a queda na vacinação de jovens.", 
        "A análise indica uma forte correlação entre correntes de desinformação e a hesitação vacinal...", 
        1.25, 350, 0.0150, "sucesso", 0.95
    )
    cursor.execute(inserir_sql, dados_teste)
    conn.commit()
    print("✅ Dado inserido com sucesso!\n")

    # 3. Lê o dado para confirmar
    print("⏳ Lendo os dados gravados...")
    cursor.execute("SELECT id, modelo, categoria FROM logs ORDER BY id DESC LIMIT 1")
    resultado = cursor.fetchone()
    print(f"🎉 Sucesso total! Último registro encontrado: ID {resultado[0]} | Modelo: {resultado[1]} | Foco: {resultado[2]}")

    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print(f"❌ Ops! Falha na conexão com o banco de dados.")
    print(f"Detalhe do erro: {err}")
    print("\nDica: Verifique se o seu MySQL está ligado e se o banco 'lias' foi criado!")