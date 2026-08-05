---
description: Executa uma validacao final da entrega com build, testes e checklist de regressao.
name: validar-entrega
argument-hint: escopo da mudanca (ex. frontend upload e download)
agent: agent
---

# Validacao final da entrega

Valide a entrega para `${input:escopo:escopo da mudanca}` seguindo o fluxo do projeto.

Passos obrigatorios:

1. Identifique os arquivos alterados e resuma riscos potenciais de regressao.
2. Execute os comandos relevantes de validacao:
   - Backend: `npm test` em `backend`.
   - Frontend: `npm run build` em `frontend`.
3. Se houver falhas, proponha e aplique correcoes minimas.
4. Reexecute as validacoes apos as correcoes.
5. Entregue um resumo objetivo com:
   - status de cada comando,
   - arquivos impactados,
   - riscos residuais,
   - proximos passos recomendados.

Regras:

- Nao usar overengineering; priorizar correcao minima e segura.
- Nao alterar comportamento fora do escopo sem justificativa.
- Preservar arquitetura e convencoes do repositorio.
