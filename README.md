
# Gestor de Equipamentos

Sistema web para gerenciamento de equipamentos e
patrimônios, desenvolvido como projeto prático
de estudos em desenvolvimento Backend.

## Tecnologias

- Node.js
- Express.js
- PostgreSQL
- JavaScript
- HTML5 e CSS3
- JWT
- bcrypt
- Git

## Funcionalidades

- Autenticação de usuários com JWT
- Senhas protegidas com bcrypt
- Cadastro de equipamentos
- Consulta de equipamentos
- Atualização de equipamentos
- Exclusão de equipamentos
- Pesquisa de equipamentos
- Exportação de relatórios CSV
- Cadastro e listagem de usuários
- Perfis de administrador e operador
- Alteração de permissões pelo painel
- Proteção contra remoção do último administrador
- Validação de dados e tratamento de erros

## Permissões

### Administrador
Pode cadastrar, consultar, atualizar e excluir
equipamentos, além de gerenciar usuários e perfis.

### Operador
Pode consultar e pesquisar equipamentos,
sem acesso às operações administrativas.

## Configuração

1. Instale o Node.js e o PostgreSQL.
2. Clone o repositório.
3. Execute `npm install`.
4. Crie um arquivo `.env` baseado em `.env.example`.
5. Configure as credenciais do banco e a chave JWT.
6. Prepare o banco de dados e a tabela de usuários.
7. Execute `node server.js`.
8. Acesse a aplicação pelo navegador.

Observação: a criação do banco e das tabelas ainda
precisa ser documentada para facilitar a instalação.

## Segurança

- Senhas armazenadas com hash bcrypt
- Rotas protegidas por JWT
- Controle de acesso baseado em perfis (RBAC)
- Consultas SQL parametrizadas
- Credenciais mantidas fora do Git

## Status

MVP funcional em desenvolvimento.
Testes locais de autenticação, CRUD e permissões
realizados com sucesso.
