# Meals AI

<div align="center">
  <img src="docs/assets/meals-logo.png" alt="Meals AI Logo" width="300"/>
</div>

API REST e bot WhatsApp para gerenciamento de alimentos e informações nutricionais, construída com **Bun** e **Elysia**, seguindo os princípios de **Clean Architecture** e **Clean Code**.

## Sobre o Projeto

Sistema completo de análise nutricional que permite:
- Cadastro e consulta de alimentos com informações nutricionais detalhadas
- Bot WhatsApp para análise de refeições via texto ou imagem
- Integração com Google Gemini para processamento de linguagem natural e análise de imagens
- Tabela PACO (Tabela Brasileira de Composição de Alimentos) para dados nutricionais
- Rastreamento de refeições diárias
- Geração de resumos diários e relatórios semanais com gráficos

Este projeto serve como exemplo de implementação de arquitetura limpa, com separação clara de responsabilidades e boas práticas de desenvolvimento.

## 🚀 Início Rápido

Para começar rapidamente, você precisa:

1. **Clonar e iniciar a API TACO** (obrigatório):
```bash
git clone https://github.com/raulfdm/taco-api.git
cd taco-api
bun install
bun run dev  # Roda na porta 4000
```

2. **Clonar este projeto**:
```bash
git clone <repository-url>
cd bot-nutri
bun install
```

3. **Configurar variáveis de ambiente** (criar `.env`):
```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
MONGODB_DB_NAME=bot-nutri
USE_TACO_API=true
TACO_API_URL=http://localhost:4000/graphql
GEMINI_API_KEY=your_key_here
```

4. **Iniciar MongoDB e o projeto**:
```bash
bun run docker:dev  # MongoDB
bun run dev         # Bot Nutri
```

Para instruções detalhadas, veja a seção [Como Iniciar o Projeto](#como-iniciar-o-projeto).

## Tecnologias

- **Runtime**: [Bun](https://bun.sh/) - Runtime JavaScript/TypeScript de alta performance
- **Framework**: [Elysia](https://elysiajs.com/) - Framework web minimalista e rápido
- **Banco de Dados**: [MongoDB](https://www.mongodb.com/) - Banco de dados NoSQL
- **WhatsApp**: [Baileys](https://github.com/WhiskeySockets/Baileys) - Biblioteca para integração com WhatsApp
- **IA**: [Google Gemini](https://ai.google.dev/) - API para processamento de linguagem natural e análise de imagens
- **Gráficos**: [Chart.js Node Canvas](https://github.com/SeanSobey/ChartjsNodeCanvas) - Geração de gráficos em servidor
- **Linguagem**: TypeScript - Tipagem estática
- **Validação**: TypeBox - Validação de schemas
- **Documentação**: Swagger/OpenAPI - Documentação automática da API
- **Logging**: Pino - Logger estruturado e performático

## Arquitetura

O projeto segue os princípios de **Clean Architecture** com 4 camadas bem definidas:

### 1. **Domain** (Domínio)
- Entidades de negócio (`Food`, `PacoItem`, `Meal`, `Message`)
- Interfaces de repositórios
- Regras de negócio puras

### 2. **Application** (Aplicação)
- Casos de uso (Create, Read, Update, Delete, Analyze, Report)
- DTOs (Data Transfer Objects)
- Mappers para conversão de entidades

### 3. **Infrastructure** (Infraestrutura)
- Implementação de repositórios (MongoDB)
- Conexão com banco de dados
- Integração com WhatsApp (Baileys)
- Integração com Gemini API
- Serviços de geração de gráficos
- Factories para injeção de dependências

### 4. **Presentation** (Apresentação)
- Controllers (framework-agnostic)
- Rotas HTTP
- Handlers de mensagens WhatsApp
- Adapters para Elysia
- Middlewares

## Estrutura do Projeto

```
src/
├── domain/                    # Camada de Domínio
│   ├── entities/             # Entidades de negócio
│   └── repositories/         # Interfaces de repositórios
│
├── application/              # Camada de Aplicação
│   ├── dtos/                # Data Transfer Objects
│   ├── mappers/             # Conversores de entidades
│   └── use-cases/           # Casos de uso
│
├── infrastructure/           # Camada de Infraestrutura
│   ├── database/            # Conexão e schemas MongoDB
│   ├── repositories/        # Implementações de repositórios
│   ├── services/            # Serviços externos (Gemini, Chart)
│   ├── whatsapp/            # Integração WhatsApp
│   ├── gemini/              # Integração Gemini
│   └── factories/           # Factories para DI
│
├── presentation/             # Camada de Apresentação
│   ├── adapters/            # Adapters para frameworks
│   ├── controllers/         # Controllers
│   ├── handlers/            # Handlers de mensagens
│   ├── middlewares/         # Middlewares
│   └── routes/              # Definição de rotas
│
└── shared/                   # Código Compartilhado
    ├── constants/           # Constantes do sistema
    ├── errors/              # Classes de erro
    ├── logger/              # Logger centralizado
    ├── types/               # Tipos compartilhados
    └── utils/               # Utilitários
```

## Funcionalidades

### API REST
- CRUD completo de alimentos
- CRUD completo de itens PACO
- Validação de dados com TypeBox
- Tratamento de erros centralizado
- Documentação automática com Swagger
- Health check endpoint
- Desacoplamento total de framework (controllers independentes)

### Bot WhatsApp
- Recebimento de mensagens de texto e imagens
- Análise nutricional de refeições descritas em texto
- Análise nutricional de imagens de pratos
- Detecção automática de tipo de refeição (café da manhã, almoço, jantar, lanche)
- Salvamento automático de refeições
- Comandos disponíveis:
  - Envio de descrição de refeição para análise
  - Envio de imagem de prato para análise
  - "resumo" ou "hoje" - Resumo nutricional do dia
  - "relatório semanal" ou "semana" - Relatório semanal com gráfico
  - "ajuda" ou "help" - Lista de comandos disponíveis

### Análise Nutricional
- Integração com Google Gemini para processamento de linguagem natural
- Extração automática de alimentos e quantidades de texto
- Análise de imagens de pratos usando Gemini Vision
- Mapeamento automático com tabela PACO
- Cálculo de valores nutricionais (calorias, proteínas, carboidratos, lipídios)

### Relatórios
- Resumo diário de refeições e valores nutricionais
- Relatório semanal com:
  - Resumo detalhado por dia
  - Totais da semana
  - Médias diárias
  - Gráfico visual (calorias, proteínas, carboidratos)

## Como Iniciar o Projeto

### Pré-requisitos

- [Bun](https://bun.sh/) instalado (versão 1.0 ou superior)
- MongoDB rodando (local ou remoto)
- **API TACO rodando localmente** (obrigatório - veja instruções abaixo)
- Conta Google com acesso à API Gemini (opcional, mas recomendado para análise de imagens)
- Node.js 18+ (se não usar Bun)

### Passo a Passo

#### 1. Clone o repositório
```bash
git clone <repository-url>
cd bot-nutri
```

#### 2. Instale as dependências
```bash
bun install
```

#### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
MONGODB_DB_NAME=bot-nutri

# Server Configuration
PORT=3000
NODE_ENV=development

# Logger Configuration
LOG_LEVEL=debug

# Gemini Configuration (opcional, mas recomendado)
GEMINI_API_KEY=your_gemini_api_key_here

# TACO API Configuration (obrigatório - veja instruções abaixo)
USE_TACO_API=true
TACO_API_URL=http://localhost:4000/graphql
```

**Onde obter a chave do Gemini:**
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API key
3. Cole a chave no arquivo `.env`

#### 4. Configure e inicie a API TACO (Obrigatório)

A API TACO é **obrigatória** para o funcionamento do projeto. Ela fornece os dados nutricionais da Tabela Brasileira de Composição de Alimentos.

**4.1. Clone o repositório da API TACO:**
```bash
# Clone o repositório em um diretório separado
cd ..
git clone https://github.com/raulfdm/taco-api.git
cd taco-api
```

**4.2. Instale as dependências:**
```bash
bun install
```

**4.3. Inicie a API TACO:**
```bash
# A API TACO rodará na porta 4000 por padrão
bun run dev
```

**4.4. Verifique se está funcionando:**
```bash
# Em outro terminal, teste a API
curl http://localhost:4000/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ getAllFood(limit: 1) { id name } }"}'
```

Se retornar dados JSON, a API está funcionando corretamente.

**4.5. Mantenha a API TACO rodando:**
- Deixe o terminal com a API TACO aberto e rodando
- A API deve estar acessível em `http://localhost:4000/graphql`
- Volte para o diretório do projeto: `cd bot-nutri`

**Documentação da API TACO:**
- Site oficial: https://taco-api.netlify.app/
- Repositório: https://github.com/raulfdm/taco-api

#### 5. Inicie o MongoDB

**Opção A: Usando Docker (recomendado)**
```bash
# Iniciar MongoDB em modo desenvolvimento
bun run docker:dev

# Ou iniciar em modo produção
bun run docker:up
```

**Opção B: MongoDB local**
Certifique-se de que o MongoDB está rodando na porta 27017 com as credenciais configuradas.

#### 6. Configure a integração com a API TACO

No arquivo `.env`, certifique-se de que as seguintes variáveis estão configuradas:

```env
# TACO API Configuration (obrigatório)
USE_TACO_API=true
TACO_API_URL=http://localhost:4000/graphql
```

#### 7. Execute o projeto

```bash
# Modo desenvolvimento (com hot reload)
bun run dev

# Modo produção
bun run start
```

#### 8. Conecte o WhatsApp

1. Ao iniciar o projeto, um QR Code será exibido no terminal
2. Abra o WhatsApp no seu celular
3. Vá em **Configurações > Aparelhos conectados > Conectar um aparelho**
4. Escaneie o QR Code exibido no terminal
5. Após escanear, o bot estará conectado permanentemente
6. As credenciais são salvas em `auth_info_baileys/` (não commite esta pasta)

#### 9. Acesse a documentação da API

Após iniciar o servidor, acesse:
- **Swagger UI**: http://localhost:3000/swagger
- **Health Check**: http://localhost:3000/health
- **API Info**: http://localhost:3000/

## API PACO (Tabela Brasileira de Composição de Alimentos)

### O que é PACO?

A **Tabela Brasileira de Composição de Alimentos (PACO)** é uma base de dados oficial que contém informações nutricionais detalhadas de alimentos brasileiros. O sistema utiliza essa tabela para calcular valores nutricionais precisos durante a análise de refeições.

### API TACO (Obrigatória)

O projeto utiliza a **API TACO** como fonte principal de dados nutricionais. A API TACO é uma API GraphQL que fornece acesso completo à tabela PACO.

**Repositório:** https://github.com/raulfdm/taco-api  
**Documentação:** https://taco-api.netlify.app/

**Vantagens:**
- ✅ Dados sempre atualizados
- ✅ Não ocupa espaço no banco local
- ✅ Acesso a todos os alimentos da tabela PACO
- ✅ Busca otimizada e rápida
- ✅ API GraphQL moderna e eficiente

**Como configurar:**

1. **Clone e inicie a API TACO** (veja seção "Como Iniciar o Projeto" acima)
2. Configure no `.env`:
```env
USE_TACO_API=true
TACO_API_URL=http://localhost:4000/graphql
```

3. Certifique-se de que a API TACO está rodando antes de iniciar o bot-nutri

**Verificar se está funcionando:**
```bash
# Testar integração
bun run validate:taco

# Verificar health check
curl http://localhost:3000/health/taco
```

### MongoDB Local (Fallback - Não Recomendado)

⚠️ **Nota:** O uso do MongoDB local como fallback não é recomendado, pois os dados podem estar desatualizados. Use apenas se a API TACO não estiver disponível temporariamente.

**Como usar (apenas se necessário):**

1. Configure no `.env`:
```env
USE_TACO_API=false
```

2. Popule o banco com dados:
```bash
bun run seed:paco
```

3. Reinicie o servidor

**Limitações:**
- ❌ Dados podem estar desatualizados
- ❌ Requer espaço no banco de dados
- ❌ Necessita manutenção manual dos dados

### Endpoints da API PACO

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/paco` | Criar um novo item PACO (apenas MongoDB) |
| `GET` | `/paco` | Listar todos os itens PACO |
| `GET` | `/paco/search?q={termo}` | Buscar itens PACO por nome |
| `GET` | `/paco/:id` | Buscar item PACO por ID |

### Exemplos de Uso

**Buscar itens PACO:**
```bash
# Buscar por termo
curl "http://localhost:3000/paco/search?q=frango"

# Listar todos
curl "http://localhost:3000/paco"

# Buscar por ID
curl "http://localhost:3000/paco/123"
```

**Criar item PACO (apenas MongoDB):**
```bash
curl -X POST http://localhost:3000/paco \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Peito de frango grelhado",
    "energiaKcal": 165,
    "proteinaG": 31,
    "carboidratoG": 0,
    "lipidioG": 3.6
  }'
```

### Fluxo de Decisão

O sistema escolhe automaticamente qual repositório usar baseado nas variáveis de ambiente:

```
USE_TACO_API=true ou TACO_API_URL definido?
├─ SIM → Usa TacoApiPacoRepository (API TACO local)
└─ NÃO → Usa MongoDBPacoRepository (banco local - fallback)
```

**Importante:**
- A API TACO é **obrigatória** para o funcionamento correto do projeto
- Quando usando a API TACO, operações de escrita (`POST /paco`) não são suportadas, pois a API é somente leitura
- Certifique-se de que a API TACO está rodando antes de iniciar o bot-nutri

## Endpoints da API REST

### Alimentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/foods` | Criar um novo alimento |
| `GET` | `/foods` | Listar todos os alimentos |
| `GET` | `/foods/:id` | Buscar alimento por ID |
| `PUT` | `/foods/:id` | Atualizar alimento |
| `DELETE` | `/foods/:id` | Deletar alimento |

### Itens PACO

| Método | Endpoint | Descrição | Observação |
|--------|----------|-----------|------------|
| `POST` | `/paco` | Criar um novo item PACO | Apenas MongoDB (não funciona com TACO API) |
| `GET` | `/paco` | Listar todos os itens PACO | Funciona com ambos |
| `GET` | `/paco/search?q={termo}` | Buscar itens PACO por nome | Funciona com ambos |
| `GET` | `/paco/:id` | Buscar item PACO por ID | Funciona com ambos |

**Nota:** Quando usando a API TACO (`USE_TACO_API=true`), o endpoint `POST /paco` não está disponível, pois a API TACO é somente leitura.

### Health Check e Documentação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Informações da API |
| `GET` | `/health` | Health check geral |
| `GET` | `/health/taco` | Health check da API TACO |
| `GET` | `/swagger` | Documentação Swagger (UI) |
| `GET` | `/swagger/json` | Documentação OpenAPI (JSON) |

## Exemplos de Uso

### Criar um alimento

```bash
curl -X POST http://localhost:3000/foods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frango Grelhado",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fat": 3.6
  }'
```

### Criar um item PACO

```bash
curl -X POST http://localhost:3000/paco \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Peito de frango grelhado",
    "energiaKcal": 165,
    "proteinaG": 31,
    "carboidratoG": 0,
    "lipidioG": 3.6
  }'
```

### Buscar itens PACO

```bash
curl "http://localhost:3000/paco/search?q=frango"
```

### Uso do Bot WhatsApp

1. Envie uma mensagem de texto descrevendo sua refeição:
   - "2 peitos de frango grelhado, 200g de arroz e salada"
   - O bot analisará e retornará os valores nutricionais

2. Envie uma imagem de um prato:
   - O bot analisará a imagem e identificará os alimentos

3. Solicite resumo do dia:
   - Envie "resumo" ou "hoje"
   - O bot retornará o resumo nutricional do dia

4. Solicite relatório semanal:
   - Envie "relatório semanal" ou "semana"
   - O bot retornará relatório detalhado e gráfico

## Princípios Aplicados

### Clean Architecture
- Separação clara de responsabilidades em camadas
- Dependências apontam para dentro (domínio no centro)
- Independência de frameworks e tecnologias
- Testabilidade facilitada

### Clean Code
- Nomes descritivos e significativos
- Funções pequenas e com responsabilidade única
- Código auto-documentado
- Proibição de magic strings e magic numbers
- Constantes extraídas e organizadas

### SOLID
- **S**ingle Responsibility Principle
- **O**pen/Closed Principle
- **L**iskov Substitution Principle
- **I**nterface Segregation Principle
- **D**ependency Inversion Principle

### Result Pattern
- Uso de Result<T, E> para tratamento de erros
- Evita exceções em casos de uso
- Código mais previsível e testável

## Fluxo de Dependências

```
Repository → Use Case → Controller → Elysia (via Adapter)
```

O sistema de factories gerencia todo o fluxo:
1. Cria repositórios
2. Injeta repositórios nos use cases
3. Injeta use cases nos controllers
4. Conecta controllers ao Elysia via adapter

## Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Iniciar em modo desenvolvimento
bun run start            # Iniciar em modo produção

# Testes e Qualidade
bun test                 # Executar testes
bun run lint             # Verificar código com ESLint
bun run type-check       # Verificar tipos TypeScript

# Banco de Dados
bun run seed:paco        # Popular tabela PACO com dados locais
bun run reset:db         # Resetar banco de dados (limpar todas as coleções)
bun run check:paco       # Verificar repositório PACO

# Integração TACO
bun run validate:taco    # Validar integração com API TACO

# Docker
bun run docker:up       # Iniciar containers (produção)
bun run docker:down     # Parar containers
bun run docker:dev      # Iniciar containers (desenvolvimento)
bun run docker:logs     # Ver logs dos containers
bun run docker:build    # Build dos containers
```

## Documentação

A documentação completa da API está disponível em:
- **Swagger UI**: http://localhost:3000/swagger
- **OpenAPI JSON**: http://localhost:3000/swagger/json

## Estrutura de Dados

### Meal (Refeição)
Armazena informações sobre refeições consumidas:
- ID do usuário (número do WhatsApp)
- Itens da refeição (nome, quantidade, peso, nutrientes)
- Totais nutricionais
- Tipo de refeição (breakfast, lunch, dinner, snack, other)
- Data e hora

### PacoItem (Item PACO)
Armazena dados da Tabela Brasileira de Composição de Alimentos:
- Nome do alimento
- Valores nutricionais por 100g
- Nome alternativo (opcional)

## Logging

O sistema utiliza Pino para logging estruturado:
- Desenvolvimento: logs formatados e coloridos (pino-pretty)
- Produção: logs em formato JSON
- Níveis configuráveis via LOG_LEVEL

## Tratamento de Erros

- Uso de Result Pattern em casos de uso
- Mensagens de erro centralizadas em constantes
- Logging estruturado de erros
- Middleware de tratamento de erros global

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Autor

Desenvolvido seguindo princípios de Clean Architecture e Clean Code.

---

**Desenvolvido usando Bun + Elysia**
