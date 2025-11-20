# Bot Nutri API

API REST para gerenciamento de alimentos e informações nutricionais, construída com **Bun** e **Elysia**, seguindo os princípios de **Clean Architecture** e **Clean Code**.

## 📋 Sobre o Projeto

API desenvolvida para cadastro e consulta de alimentos com informações nutricionais detalhadas (calorias, proteínas, carboidratos e gorduras). Este projeto serve como exemplo de implementação de arquitetura limpa, com separação clara de responsabilidades e boas práticas de desenvolvimento.

## 🚀 Tecnologias

- **Runtime**: [Bun](https://bun.sh/) - Runtime JavaScript/TypeScript de alta performance
- **Framework**: [Elysia](https://elysiajs.com/) - Framework web minimalista e rápido
- **Banco de Dados**: [MongoDB](https://www.mongodb.com/) - Banco de dados NoSQL
- **Linguagem**: TypeScript - Tipagem estática
- **Validação**: TypeBox - Validação de schemas
- **Documentação**: Swagger/OpenAPI - Documentação automática da API

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** com 4 camadas bem definidas:

### 1. **Domain** (Domínio)
- Entidades de negócio (`Food`)
- Interfaces de repositórios
- Regras de negócio puras

### 2. **Application** (Aplicação)
- Casos de uso (Create, Read, Update, Delete)
- DTOs (Data Transfer Objects)
- Mappers para conversão de entidades

### 3. **Infrastructure** (Infraestrutura)
- Implementação de repositórios (MongoDB, In-Memory)
- Conexão com banco de dados
- Container de injeção de dependências

### 4. **Presentation** (Apresentação)
- Controllers (framework-agnostic)
- Rotas HTTP
- Adapters para Elysia
- Middlewares

## 📁 Estrutura do Projeto

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
│   ├── dependency-injection/ # Container de DI
│   └── repositories/        # Implementações de repositórios
│
├── presentation/             # Camada de Apresentação
│   ├── adapters/            # Adapters para frameworks
│   ├── controllers/         # Controllers
│   ├── middlewares/         # Middlewares
│   └── routes/              # Definição de rotas
│
└── shared/                   # Código Compartilhado
    ├── errors/              # Classes de erro
    ├── types/               # Tipos compartilhados
    └── utils/               # Utilitários
```

## ✨ Funcionalidades

- ✅ CRUD completo de alimentos
- ✅ Validação de dados com TypeBox
- ✅ Tratamento de erros centralizado
- ✅ Documentação automática com Swagger
- ✅ Health check endpoint
- ✅ Desacoplamento total de framework (controllers independentes)
- ✅ Injeção de dependências centralizada
- ✅ Suporte a MongoDB

## 🛠️ Instalação

### Pré-requisitos

- [Bun](https://bun.sh/) instalado
- MongoDB rodando (local ou remoto)

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

3. Configure as variáveis de ambiente (opcional):
```bash
# Crie um arquivo .env na raiz do projeto
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=bot-nutri
PORT=3000
```

4. Execute o projeto:
```bash
# Desenvolvimento
bun run dev

# Produção
bun run start
```

## 📚 Endpoints

### Alimentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/foods` | Criar um novo alimento |
| `GET` | `/foods` | Listar todos os alimentos |
| `GET` | `/foods/:id` | Buscar alimento por ID |
| `PUT` | `/foods/:id` | Atualizar alimento |
| `DELETE` | `/foods/:id` | Deletar alimento |

### Outros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Informações da API |
| `GET` | `/health` | Health check |
| `GET` | `/swagger` | Documentação Swagger |

## 📖 Exemplos de Uso

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

### Listar alimentos

```bash
curl http://localhost:3000/foods
```

### Buscar alimento por ID

```bash
curl http://localhost:3000/foods/{id}
```

### Atualizar alimento

```bash
curl -X PUT http://localhost:3000/foods/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 170,
    "protein": 32
  }'
```

### Deletar alimento

```bash
curl -X DELETE http://localhost:3000/foods/{id}
```

## 🎯 Princípios Aplicados

### Clean Architecture
- Separação clara de responsabilidades em camadas
- Dependências apontam para dentro (domínio no centro)
- Independência de frameworks e tecnologias

### Clean Code
- Nomes descritivos e significativos
- Funções pequenas e com responsabilidade única
- Código auto-documentado
- Testabilidade

### SOLID
- **S**ingle Responsibility Principle
- **O**pen/Closed Principle
- **L**iskov Substitution Principle
- **I**nterface Segregation Principle
- **D**ependency Inversion Principle

## 🔄 Fluxo de Dependências

```
Repository → Use Case → Controller → Elysia (via Adapter)
```

O container de injeção de dependências gerencia todo o fluxo:
1. Cria repositórios
2. Injeta repositórios nos use cases
3. Injeta use cases nos controllers
4. Conecta controllers ao Elysia via adapter

## 🧪 Scripts Disponíveis

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
```

## 📝 Documentação

A documentação completa da API está disponível em:
- **Swagger UI**: http://localhost:3000/swagger
- **OpenAPI JSON**: http://localhost:3000/swagger/json

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👤 Autor

Desenvolvido seguindo princípios de Clean Architecture e Clean Code.

---

**Desenvolvido com ❤️ usando Bun + Elysia**

