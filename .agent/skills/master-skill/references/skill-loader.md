# Skill Loader — Como Carregar Skills Externas

Este arquivo descreve como ler e registrar skills externas no contexto da sessão ativa.

---

## Estrutura esperada das skills externas

Cada skill externa deve ser um arquivo `.md` com frontmatter YAML:

```markdown
---
name: nome-da-skill
description: Descrição do que a skill faz e quando deve ser ativada.
---

# Conteúdo da skill...
```

O campo `name` é obrigatório. O campo `description` é altamente recomendado.

---

## Processo de carregamento

### Passo 1: Listar arquivos

Busque todos os `.md` no diretório configurado em `skills_path`:

```bash
# Linux / Mac
find <skills_path> -name "*.md" -type f

# Windows (PowerShell)
Get-ChildItem -Path <skills_path> -Filter "*.md" -Recurse
```

### Passo 2: Extrair frontmatter

Para cada arquivo encontrado, leia as primeiras linhas até encontrar o bloco `---` de fechamento do YAML.

Exemplo de parsing manual (pseudocódigo):
```
abrir arquivo
se linha 1 == "---":
    ler até próximo "---"
    parsear como YAML → extrair name, description
```

### Passo 3: Registrar no contexto

Adicione cada skill ao contexto da sessão no formato:

```
<skill name="nome-da-skill">
  description: Descrição da skill
  path: /caminho/completo/para/arquivo.md
</skill>
```

Informe ao Claude (ou ao agente ativo) que essas skills estão disponíveis para uso na sessão.

---

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Diretório não existe | Avise o usuário, continue sem carregar skills |
| Arquivo sem frontmatter | Carregue com `name` derivado do nome do arquivo, sem description |
| Frontmatter malformado | Pule o arquivo e registre aviso |
| Diretório vazio | Informe que nenhuma skill foi encontrada |

---

## Boas práticas

- Skills com `description` detalhada são ativadas com mais precisão pelo agente.
- Organize skills em subpastas por domínio (ex: `skills/backend/`, `skills/frontend/`) — o loader carrega recursivamente.
- Evite nomes de arquivo com espaços; prefira `kebab-case.md`.
- Skills carregadas ficam disponíveis **apenas durante a sessão atual**. A cada nova sessão, `/master-skill` precisa ser chamado novamente.
