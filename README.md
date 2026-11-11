# Gestor de Equipamentos

Sistema web para gerenciamento de equipamentos e patrimônios, desenvolvido como projeto prático de estudos em desenvolvimento Backend.

O projeto utiliza uma API REST em Node.js, banco de dados PostgreSQL, autenticação JWT e controle de permissões por perfil de usuário.

## Tecnologias utilizadas

- Node.js
- Express.js
- PostgreSQL
- JavaScript
- HTML5 e CSS3
- JWT (JSON Web Token)
- bcrypt
- Git e GitHub

## Funcionalidades

- Login de usuários com autenticação JWT
- Armazenamento seguro de senhas com bcrypt
- Cadastro de equipamentos
- Listagem e pesquisa de equipamentos
- Atualização de equipamentos
- Exclusão de equipamentos
- Exportação de relatórios CSV
- Cadastro e listagem de usuários
- Perfis de administrador e operador
- Alteração de permissões de usuários
- Proteção contra remoção do último administrador
- Validação de dados e tratamento de erros
- Script para criação do primeiro administrador

## Controle de acesso

### Administrador

Pode consultar, cadastrar, atualizar e excluir equipamentos, além de cadastrar usuários e gerenciar seus perfis.

### Operador

Pode consultar e pesquisar equipamentos, sem acesso às operações administrativas.

## Estrutura principal do projeto

- `server.js` — API REST e rotas do sistema
- `database.js` — conexão com PostgreSQL
- `criar-admin.js` — criação do primeiro administrador
- `schema.sql` — estrutura das tabelas do banco
- `.env.example` — exemplo de configuração de ambiente
- `public/index.html` — interface da aplicação
- `public/script.js` — funcionalidades do frontend
- `public/style.css` — estilos da interface

## Requisitos

Antes de começar, instale:

- Node.js e npm
- PostgreSQL
- Git
- VS Code (recomendado)
- Extensão Live Server do VS Code (recomendada)

## Instalação

### 1. Obter o projeto

Clone o repositório após sua publicação no GitHub ou abra a pasta do projeto no VS Code.

### 2. Instalar dependências

No terminal, dentro da pasta do projeto, execute:

`npm install`

### 3. Criar o banco de dados

No PostgreSQL, crie um banco chamado `ro_digital`.

No PowerShell, caso utilize PostgreSQL 18 no Windows:

`& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -c "CREATE DATABASE ro_digital;"`

O caminho do PostgreSQL pode variar conforme a instalação.

### 4. Criar as tabelas

Execute o arquivo `schema.sql` no banco criado:

`& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d ro_digital -v ON_ERROR_STOP=1 -f "schema.sql"`

Esse arquivo cria as tabelas necessárias para usuários e equipamentos.

### 5. Configurar as variáveis de ambiente

Crie um arquivo `.env` com base no `.env.example`.

No PowerShell:

`Copy-Item .env.example .env`

Configure os valores de acordo com seu ambiente:

- `DB_HOST` — endereço do PostgreSQL
- `DB_PORT` — porta do PostgreSQL
- `DB_NAME` — nome do banco de dados
- `DB_USER` — usuário do PostgreSQL
- `DB_PASSWORD` — senha do PostgreSQL
- `JWT_SECRET` — chave secreta utilizada nos tokens JWT

Para gerar uma chave JWT aleatória, execute:

`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Copie o resultado para a variável `JWT_SECRET` do `.env`.

**Nunca publique o arquivo `.env` ou suas credenciais no GitHub.**

### 6. Criar o primeiro administrador

Após configurar o banco, execute:

`node criar-admin.js`

O script verifica se já existe um administrador. Caso não exista, solicita nome, e-mail e senha inicial.

A senha é digitada sem aparecer no terminal.

O script também impede que um segundo administrador inicial seja criado quando já existe um administrador cadastrado.

### 7. Iniciar o backend

Execute:

`node server.js`

A API estará disponível em:

`http://localhost:3000`

### 8. Iniciar o frontend

Abra o arquivo `public/index.html` com a extensão Live Server do VS Code.

A interface deverá ser acessada pela porta 5500, conforme a configuração do Live Server.

Entre utilizando o e-mail e a senha do administrador criado anteriormente.

## Segurança

O projeto implementa:

- Hash de senhas com bcrypt
- Autenticação com JWT
- Controle de acesso por perfis (RBAC)
- Consultas SQL parametrizadas
- Validação de entradas
- Proteção das rotas administrativas
- Verificação do perfil de administrador no banco
- Proteção contra remoção do último administrador
- Credenciais mantidas fora do Git

## Testes realizados

Foram realizados testes locais de:

- Operações CRUD de equipamentos
- Persistência dos registros no PostgreSQL
- Login e autenticação JWT
- Controle de acesso entre administrador e operador
- Alteração de perfis de usuários
- Bloqueio de operações administrativas não autorizadas
- Proteção contra remoção do último administrador
- Criação do primeiro administrador em banco vazio
- Bloqueio da execução repetida do script de administrador

## Status do projeto

MVP funcional em desenvolvimento.

Projeto desenvolvido para aprendizado prático de desenvolvimento Backend, APIs REST, banco de dados relacional, autenticação, segurança e controle de permissões.

O sistema foi testado em ambiente local e ainda não foi preparado para implantação em produção.