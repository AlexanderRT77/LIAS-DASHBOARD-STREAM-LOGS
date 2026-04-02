---
name: master-skill
description: >
  Orquestrador de ambiente de desenvolvimento com agentes de IA. Ative EXCLUSIVAMENTE quando o usuário digitar o comando `/master-skill`. Nunca ative automaticamente por outros triggers. Quando ativada, guia a configuração inicial do ambiente (escolha de agente + caminho de skills externas), instala e configura frameworks de agente (BMad, SpecKit, Antigravity Kit), e carrega skills externas definidas pelo usuário no contexto ativo da sessão.
---

# master-skill

Orquestrador de ambiente de desenvolvimento com agentes de IA.

> ⚠️ **Ativação exclusiva**: esta skill só entra em ação quando o comando `/master-skill` é explicitamente chamado pelo usuário. Nunca a ative de forma automática.

---

## Fluxo de execução

Quando `/master-skill` é chamado, siga esta ordem:

### 1. Verificar configuração salva

Procure o arquivo `.master-skill.json` no diretório atual ou na home do usuário (`~/.master-skill.json`).

```bash
# Ordem de busca:
# 1. ./.master-skill.json (diretório de trabalho atual)
# 2. ~/.master-skill.json (home do usuário)
```

- **Se encontrado** → leia as configurações salvas e pule para o passo 3 (Carregamento de Skills).
- **Se não encontrado** → execute o passo 2 (Configuração Inicial).

---

### 2. Configuração Inicial (primeira execução)

Apresente ao usuário:

```
🚀 Bem-vindo ao master-skill!
É a sua primeira vez aqui. Vamos configurar o ambiente.
```

Faça **duas perguntas** em sequência:

**Pergunta 1 — Agente de IA:**
> Qual agente você quer usar?
> (ex: Claude Code, Antigravity, Codex, Cursor, outro)

**Pergunta 2 — Caminho das skills externas:**
> Qual o caminho da pasta onde suas skills externas estão armazenadas?
> (ex: `/home/usuario/skills` ou `C:\Users\usuario\skills`)

Após receber as respostas, salve em `.master-skill.json`:

```json
{
  "agent": "<nome do agente escolhido>",
  "skills_path": "<caminho informado>",
  "configured_at": "<data ISO 8601>"
}
```

Salve preferencialmente em `~/.master-skill.json` para persistir entre projetos. Informe ao usuário onde foi salvo.

---

### 3. Carregamento de Skills Externas

Leia `skills_path` da configuração e carregue as skills encontradas:

```bash
# Liste todos os arquivos .md no diretório de skills
ls <skills_path>/**/*.md  (ou equivalente no OS)
```

Para cada skill encontrada:
- Leia o frontmatter YAML (campos `name` e `description`)
- Registre-a como disponível no contexto da sessão
- Informe ao usuário quais skills foram carregadas

**Formato de saída esperado:**

```
✅ Skills carregadas de /caminho/para/skills:
  • nome-da-skill-1 — Descrição breve
  • nome-da-skill-2 — Descrição breve
  • ...
```

Se o diretório não existir ou estiver vazio, avise o usuário e continue.

---

### 4. Instalação de Framework (opcional)

Após carregar as skills, pergunte ao usuário se deseja instalar algum framework de agente:

```
🔧 Deseja instalar algum framework de agente?
  1. BMad
  2. SpecKit
  3. Antigravity Kit
  4. Nenhum — já estou configurado
```

Se o usuário escolher um framework, siga as instruções em `references/frameworks.md` para o framework específico.

Se escolher "Nenhum", confirme que o ambiente está pronto e encerre.

---

### 5. Confirmação final

Exiba um resumo do ambiente configurado:

```
✅ master-skill ativado com sucesso!

  🤖 Agente:        <nome do agente>
  📁 Skills:        <N> skills carregadas de <caminho>
  🔧 Framework:     <nome ou "nenhum">

Você está pronto para trabalhar. Use /master-skill reset para reconfigurar.
```

---

## Comandos especiais

| Comando | Comportamento |
|---|---|
| `/master-skill` | Execução normal (verifica config, carrega skills) |
| `/master-skill reset` | Apaga `.master-skill.json` e reinicia configuração do zero |
| `/master-skill status` | Exibe configuração atual sem reinstalar nada |
| `/master-skill reload` | Recarrega as skills externas sem alterar outras configurações |

---

## Referências

- `references/frameworks.md` — Instruções de instalação para BMad, SpecKit e Antigravity Kit
- `references/skill-loader.md` — Detalhes sobre como ler e registrar skills externas no contexto

---

## Notas de comportamento

- **Não pergunte novamente** o que já foi configurado, a menos que o usuário use `/master-skill reset`.
- **Seja tolerante a erros**: se um caminho não existir, avise mas não trave a execução.
- **Sem ativação automática**: esta skill ignora qualquer trigger implícito. Apenas `/master-skill` (e suas variantes listadas acima) a ativam.
- **Compatível com qualquer agente**: as instruções são agnósticas — funcionam no Claude Code, Antigravity, Codex, Cursor ou qualquer CLI que suporte skills em Markdown.
