# Bot Nutri API

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

## Instalação

### Pré-requisitos

- [Bun](https://bun.sh/) instalado
- MongoDB rodando (local ou remoto)
- Conta Google com acesso à API Gemini (opcional, mas recomendado)

### Passos

1. Clone o repositório:
```bash
git clone <repository-url>
cd bot-nutri
```

2. Instale as dependências:
```bash
bun install
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo .env.example para .env
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

Variáveis de ambiente disponíveis:
```
# MongoDB Configuration
MONGODB_URI=mongodb://admin:admin123@localhost:27017/?authSource=admin
MONGODB_DB_NAME=bot-nutri

# Server Configuration
PORT=3000
NODE_ENV=development

# Logger Configuration
LOG_LEVEL=debug

# Gemini Configuration (opcional)
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Inicie o MongoDB (se usando Docker):
```bash
bun run docker:up
```

5. Popule a tabela PACO (opcional):
```bash
bun run seed:paco
```

6. Execute o projeto:
```bash
# Desenvolvimento
bun run dev

# Produção
bun run start
```

7. Conecte o WhatsApp:
   - Ao iniciar, um QR Code será exibido no terminal
   - Escaneie o QR Code com seu WhatsApp
   - Após escanear, o bot estará conectado permanentemente

## Endpoints

### Alimentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/foods` | Criar um novo alimento |
| `GET` | `/foods` | Listar todos os alimentos |
| `GET` | `/foods/:id` | Buscar alimento por ID |
| `PUT` | `/foods/:id` | Atualizar alimento |
| `DELETE` | `/foods/:id` | Deletar alimento |

### Itens PACO

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/paco` | Criar um novo item PACO |
| `GET` | `/paco` | Listar todos os itens PACO |
| `GET` | `/paco/search` | Buscar itens PACO por nome |
| `GET` | `/paco/:id` | Buscar item PACO por ID |

### Outros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Informações da API |
| `GET` | `/health` | Health check |
| `GET` | `/swagger` | Documentação Swagger |

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
bun run dev

# Produção
bun run start

# Testes
bun test

# Linting
bun run lint

# Verificação de tipos
bun run type-check

# Popular tabela PACO
bun run seed:paco

# Docker
bun run docker:up      # Iniciar containers
bun run docker:down    # Parar containers
bun run docker:logs    # Ver logs dos containers
bun run docker:build   # Build dos containers
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
