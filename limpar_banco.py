import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def resetar_banco():
    print("⏳ Conectando ao MySQL para limpeza profunda...")
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "lias")
        )
        cursor = conn.cursor()

        # TRUNCATE é melhor que DELETE pois reseta o contador de ID para 1
        cursor.execute("TRUNCATE TABLE logs;")
        conn.commit()
        
        print("✅ Base de dados 'lias' limpa com sucesso! Pronta para a importação real.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao limpar o banco: {e}")

if __name__ == "__main__":
    resetar_banco()