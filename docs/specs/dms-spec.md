# Especificação Completa - Document Management System (DMS)

## 1. Objetivo

Entregar um sistema web simples para upload, listagem e download de documentos por usuário, com arquivos gravados localmente no servidor e metadados mantidos em memória na fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documento via formulário multipart.
- Persistência física do arquivo no filesystem local da aplicação.
- Cadastro de metadados do documento em memória.
- Listagem de documentos com dados essenciais.
- Download de documento por identificador.
- Associação simples de dono do documento por identificador textual de usuário.
- Integração frontend-backend via chamadas para rota com prefixo /api no frontend.

### Fora do escopo

- Banco de dados relacional ou NoSQL.
- Armazenamento em nuvem (S3, Blob, etc.).
- Versionamento de documentos.
- Controle avançado de permissões por perfil.
- Exclusão, edição de metadados e busca full-text.
- Autenticação formal (JWT, OAuth).

## 3. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | O sistema deve permitir enviar um documento pelo endpoint de upload. |
| RF-02 | O upload deve aceitar arquivo e identificação do dono. |
| RF-03 | O sistema deve gerar um identificador único para cada documento. |
| RF-04 | O sistema deve salvar o arquivo em disco local na pasta de storage do backend. |
| RF-05 | O sistema deve registrar metadados em memória após upload bem-sucedido. |
| RF-06 | O sistema deve listar todos os documentos cadastrados com metadados. |
| RF-07 | O sistema deve permitir baixar documento por id. |
| RF-08 | O sistema deve retornar erro quando o id não existir. |
| RF-09 | O sistema deve preservar o nome original para resposta de download. |
| RF-10 | O sistema deve expor endpoint de saúde para observabilidade básica. |

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Backend em Node.js + Express CommonJS. |
| RNF-02 | Upload com multer usando diskStorage. |
| RNF-03 | Arquivos gravados apenas no filesystem local da aplicação. |
| RNF-04 | Metadados mantidos em memória nesta fase. |
| RNF-05 | Configuração por variáveis de ambiente (12-Factor). |
| RNF-06 | Separação em camadas: routes -> controllers -> services -> repositories. |
| RNF-07 | Tratamento de erros nos limites HTTP e IO de arquivos. |
| RNF-08 | Código simples, legível e sem abstrações desnecessárias. |
| RNF-09 | Compatibilidade com proxy de desenvolvimento frontend configurado para /api. |

## 5. Modelo de dados (metadados do documento)

### Entidade Documento

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | Identificador único do documento. |
| originalName | string | Sim | Nome original do arquivo enviado. |
| storedName | string | Sim | Nome físico salvo em disco. |
| mimeType | string | Sim | Tipo MIME do arquivo. |
| size | number | Sim | Tamanho do arquivo em bytes (> 0). |
| owner | string | Sim | Identificador textual do usuário dono. |
| uploadedAt | string | Sim | Data/hora do upload em ISO 8601. |
| storagePath | string | Sim | Caminho relativo do arquivo dentro do backend. |

### Representação em memória

- Estrutura sugerida: coleção indexada por id para acesso rápido por chave.
- Estrutura de listagem: array derivado dos valores da coleção.

### Regras de consistência

- Registrar metadados apenas após confirmação de gravação física do arquivo.
- Em erro após gravação física e antes de registrar metadado, executar compensação local (remoção do arquivo órfão).
- id deve ser imutável após criação.

## 6. Contratos de API

### 6.1 POST /upload

Finalidade:

- Receber um arquivo e metadados mínimos de dono.

Request:

- Content-Type: multipart/form-data.
- Campo de arquivo: file.
- Campo textual: owner.

Resposta de sucesso:

- Status: 201 Created.
- Body (JSON):

```json
{
  "id": "string",
  "originalName": "report.pdf",
  "storedName": "d4f7a7f2-report.pdf",
  "mimeType": "application/pdf",
  "size": 24567,
  "owner": "user-123",
  "uploadedAt": "2026-08-05T10:15:30.000Z",
  "storagePath": "storage/d4f7a7f2-report.pdf"
}
```

Erros esperados:

- 400 Bad Request: owner não informado.
- 400 Bad Request: arquivo não informado.
- 413 Payload Too Large: arquivo acima do limite configurado.
- 500 Internal Server Error: falha inesperada de persistência local.

### 6.2 GET /documents

Finalidade:

- Listar metadados de documentos disponíveis.

Request:

- Sem parâmetros obrigatórios.

Resposta de sucesso:

- Status: 200 OK.
- Body (JSON):

```json
[
  {
    "id": "string",
    "originalName": "report.pdf",
    "size": 24567,
    "owner": "user-123",
    "uploadedAt": "2026-08-05T10:15:30.000Z"
  }
]
```

Erros esperados:

- 500 Internal Server Error: falha inesperada de leitura em memória.

### 6.3 GET /documents/:id/download

Finalidade:

- Retornar conteúdo binário do arquivo referente ao id.

Request:

- Parâmetro de rota obrigatório: id.

Resposta de sucesso:

- Status: 200 OK.
- Headers de download compatíveis com nome original (Content-Disposition).
- Body: conteúdo binário do arquivo.

Erros esperados:

- 404 Not Found: documento não encontrado em metadados ou arquivo ausente no disco.
- 500 Internal Server Error: falha inesperada de leitura de arquivo.

### 6.4 GET /health

Finalidade:

- Verificação de disponibilidade do backend.

Resposta de sucesso:

- Status: 200 OK.
- Body (JSON):

```json
{
  "status": "ok"
}
```

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples com fluxo de dependência:
  - routes -> controllers -> services -> repositories
- Frontend baseado em componentes React com hooks.
- Integração frontend-backend via fetch com prefixo /api (proxy Vite).
- Armazenamento local apenas, usando multer com diskStorage.
- Repositório de metadados em memória para fase inicial.

### Distribuição de responsabilidades

- routes: definição de endpoints e binding de middlewares.
- controllers: parsing de entrada HTTP, validação básica e mapeamento de resposta.
- services: regras de negócio (criação/listagem/recuperação).
- repositories: filesystem local e estrutura em memória.

### Restrições obrigatórias

- Não usar provedores externos de upload/storage.
- Não quebrar o seed existente.
- Manter simplicidade e evolução incremental.

## 8. Plano de execução em etapas

### Etapa 1 - Formalização da especificação

Objetivo:

- Consolidar este documento como fonte de verdade para implementação.

Entregáveis:

- Documento de spec completo revisado.

Critérios de aceite:

- Seções de objetivo, escopo, RF, RNF, dados, APIs e plano preenchidas.

### Etapa 2 - Estrutura backend por camadas

Objetivo:

- Estruturar backend em routes, controllers, services e repositories.

Entregáveis:

- Registro de rotas /upload, /documents, /documents/:id/download.
- Controllers e services com responsabilidades claras.
- Repository em memória + acesso ao filesystem local.

Critérios de aceite:

- Endpoints acessíveis e integração entre camadas funcional.

### Etapa 3 - Upload local com multer

Objetivo:

- Implementar upload de arquivos com diskStorage no backend/storage.

Entregáveis:

- Middleware multer configurado.
- Geração de id único e criação de metadados.
- Tratamento de erros de validação e limite de tamanho.

Critérios de aceite:

- POST /upload retorna 201 e arquivo é gravado localmente.

### Etapa 4 - Listagem e download

Objetivo:

- Implementar leitura de metadados e entrega de arquivo por id.

Entregáveis:

- GET /documents retornando lista de metadados.
- GET /documents/:id/download retornando binário.

Critérios de aceite:

- Listagem consistente e download com nome original.
- 404 para id inexistente.

### Etapa 5 - Testes backend

Objetivo:

- Garantir estabilidade dos contratos e caminhos de erro.

Entregáveis:

- Testes de health, upload válido/inválido, listagem e download.

Critérios de aceite:

- Suite passando via node --test.

### Etapa 6 - Integração frontend

Objetivo:

- Implementar fluxo de upload, listagem e download na interface.

Entregáveis:

- Serviço de API com fetch via /api.
- Componentes de Upload, Lista e Download.

Critérios de aceite:

- Fluxo ponta a ponta funcional em ambiente local.

### Etapa 7 - Hardening leve e revisão final

Objetivo:

- Ajustar validações, mensagens de erro e consistência final.

Entregáveis:

- Revisão de tratamento de erro e limpeza de casos órfãos.
- Revisão de aderência à arquitetura e aos princípios do projeto.

Critérios de aceite:

- Sem regressões no fluxo principal.
- Restrição de armazenamento local respeitada integralmente.

## 9. Riscos, premissas e mitigação

Premissas:

- Execução em ambiente local com permissão de escrita na pasta backend/storage.
- Tráfego inicial baixo, compatível com metadados em memória.

Riscos:

- Perda de metadados ao reiniciar processo.
- Arquivos órfãos em falhas parciais.
- Crescimento de memória em uso prolongado.

Mitigações:

- Planejar persistência futura de metadados em banco.
- Implementar rotina simples de compensação para upload parcial.
- Definir limites de upload e validar entradas.
