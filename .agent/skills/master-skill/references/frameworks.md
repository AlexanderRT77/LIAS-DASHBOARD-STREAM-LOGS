# Frameworks de Agente — Guia de Instalação

Leia a seção correspondente ao framework escolhido pelo usuário.

---

## BMad

**O que é**: Framework de desenvolvimento orientado a agentes com suporte a múltiplos personas e workflows estruturados.

### Instalação

```bash
# Via npx (recomendado)
npx bmad-method@latest install

# Ou via clone manual
git clone https://github.com/bmad-method/bmad-method.git
cd bmad-method
npm install
```

### Configuração pós-instalação

Após instalar, o BMad cria um diretório `.bmad/` no projeto com:
- `agents/` — definições de personas
- `tasks/` — workflows disponíveis
- `bmad.config.json` — configuração central

Informe ao usuário que ele pode customizar os arquivos em `.bmad/agents/` para adaptar os personas ao seu projeto.

### Verificação

```bash
npx bmad --version
# ou
npx bmad status
```

---

## SpecKit

**O que é**: Framework focado em geração e validação de especificações técnicas via agentes de IA.

### Instalação

```bash
# Via pip
pip install speckit-ai

# Ou via npm
npm install -g speckit
```

### Configuração pós-instalação

```bash
speckit init
```

Isso cria um arquivo `speckit.yaml` na raiz do projeto. Oriente o usuário a revisar as seções:
- `output_format` — formato dos artefatos gerados (markdown, json, openapi)
- `agents` — lista de agentes disponíveis para geração
- `validators` — regras de validação automática

### Verificação

```bash
speckit --version
speckit doctor  # checa dependências
```

---

## Antigravity Kit

**O que é**: Kit de desenvolvimento para o ecossistema Antigravity (Google), com suporte a skills, agentes e integração com modelos Gemini.

### Instalação

```bash
# Via gcloud (requer Google Cloud CLI instalado)
gcloud components install antigravity

# Ou via pip
pip install antigravity-kit
```

### Configuração pós-instalação

```bash
antigravity init --project=<seu-projeto-gcp>
```

Cria a estrutura:
```
.antigravity/
├── config.yaml       — configuração do projeto
├── skills/           — pasta local de skills
└── agents/           — definições de agentes
```

Para instalar skills globais (disponíveis em todos os projetos):

```bash
antigravity skills install --global <nome-da-skill>
```

### Verificação

```bash
antigravity version
antigravity status
```

---

## Notas gerais

- Se o ambiente não tiver acesso à internet, oriente o usuário a fazer instalação offline via arquivo `.tar.gz` ou equivalente.
- Todos os frameworks acima suportam uso local sem necessidade de conta em nuvem, com exceção do Antigravity Kit (que requer projeto GCP para funcionalidades avançadas).
- Em caso de erro de instalação, sugira rodar o comando com `sudo` (Linux/Mac) ou como Administrador (Windows).
