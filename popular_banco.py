import os
import random
from datetime import datetime, timedelta
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

print("⏳ A ligar ao MySQL para gerar o Benchmark com Respostas Longas...")

def gerar_resposta_longa(modelo, prompt):
    return f"""**Análise Clínica Gerada pelo modelo {modelo}**

Com base nas diretrizes médicas atuais e na literatura científica recente, a análise da questão proposta ("{prompt[:40]}...") requer uma abordagem estruturada e baseada em evidências.

**1. Avaliação Inicial e Contexto:**
A situação apresentada exige uma observação cuidadosa das variáveis clínicas e epidemiológicas. Os dados sugerem que estamos diante de um quadro que necessita de intervenção rápida ou análise detalhada para evitar complicações a longo prazo. A fisiopatologia (ou o mecanismo de ação) envolvida está diretamente ligada aos parâmetros mencionados no caso.

**2. Conduta e Pontos de Atenção:**
* É fundamental correlacionar os achados com os guidelines da sociedade médica correspondente (nível de evidência A).
* Recomenda-se monitoramento contínuo dos marcadores principais.
* O risco de interações ou viéses na interpretação deve ser mitigado através de validação cruzada.

**Conclusão:**
Portanto, a recomendação padrão-ouro envolve a aplicação dos protocolos validados. O acompanhamento multidisciplinar é essencial para garantir o melhor prognóstico e a segurança do procedimento ou da análise de dados em questão.
"""

try:
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "lias")
    )
    cursor = conn.cursor()

    modelos = ["Claude 3.5", "DeepSeek R1", "Manus", "Chat.Z.Ai", "Perplexidade", "Grok 2"]
    
    perguntas_benchmark = [
        {"cat": "Diagnóstico Diferencial", "prompt": "Paciente masculino, 55 anos, dor torácica opressiva irradiando para braço esquerdo, sudorese profusa. ECG mostra supra de ST em V1-V4. Qual o diagnóstico e conduta imediata?"},
        {"cat": "Interações Medicamentosas", "prompt": "Quais as principais interações medicamentosas entre varfarina e antibióticos da classe dos macrolídeos?"},
        {"cat": "Educação do Paciente", "prompt": "Crie um guia simplificado de 5 pontos para um paciente recém-diagnosticado com Diabetes Tipo 2 sobre cuidados com os pés."},
        {"cat": "Revisão de Literatura", "prompt": "Resuma os principais achados do estudo 'CheckMate 067' sobre o tratamento de melanoma avançado."},
        {"cat": "Ética Médica", "prompt": "Quais os dilemas éticos envolvidos no uso de IA para triagem de pacientes em unidades de terapia intensiva?"},
        {"cat": "Interpretação de Exames", "prompt": "Hemoglobina 9.5 g/dL, VCM 72 fL, HCM 24 pg, RDW 18%. Qual o padrão hematológico e possíveis causas?"},
        {"cat": "Dosagem de Medicamentos", "prompt": "Como estruturo o cálculo exato de gotejamento para administrar 500 mL de soro fisiológico a 0,9% em 8 horas utilizando um equipo macrogotas?"},
        {"cat": "Interpretação e coerência", "prompt": "Quais as metodologias mais eficazes para analisar o impacto da desinformação e das fake news na queda da adesão vacinal entre jovens brasileiros entre os anos de 2018 e 2025?"},
        {"cat": "Origem tecidual cardíaca", "prompt": "Qual é a origem embriológica exata do sistema condutor do coração e em qual semana do desenvolvimento as anomalias de septação costumam se consolidar?"},
        {"cat": "Modulação noraadrenérgica", "prompt": "Como ocorre a modulação descendente da dor no corno posterior da medula espinhal, e qual o papel fisiológico da substância cinzenta periaquedutal nesse processo de analgesia?"},
        {"cat": "Bioquímica Nutricional", "prompt": "De que maneira a deficiência severa de vitamina B12 interfere no ciclo da metionina e quais as repercussões celulares dessa interrupção?"},
        {"cat": "Alterações no perfil lípidico", "prompt": "Quais são as alterações bioquímicas primárias esperadas no perfil lipídico e nas enzimas hepáticas de um paciente com síndrome metabólica grave?"}
    ]

    cursor.execute("TRUNCATE TABLE logs;")

    for p in perguntas_benchmark:
        for m in modelos:
            data_simulada = datetime.now() - timedelta(hours=random.randint(1, 48))
            resposta_simulada = gerar_resposta_longa(m, p['prompt'])
            
            query = """
                INSERT INTO logs (data, modelo, categoria, prompt, resposta, latencia, tokens, custo, status, confianca)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            valores = (
                data_simulada.strftime('%Y-%m-%d %H:%M:%S'),
                m, p['cat'], p['prompt'], resposta_simulada,
                round(random.uniform(1.2, 4.5), 2), random.randint(300, 1200),
                round(random.uniform(0.01, 0.05), 4), "sucesso", round(random.uniform(0.70, 0.99), 2)
            )
            cursor.execute(query, valores)

    conn.commit()
    print("✅ Benchmark atualizado! Respostas longas inseridas no banco.")
    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print(f"❌ Erro de conexão: {err}")