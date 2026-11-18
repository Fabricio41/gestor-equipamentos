
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const pool = require("../database");

const app = require("../server");

// ========================================
// TESTE 1 - IMPORTAÇÃO DO EXPRESS
// ========================================

test("A aplicação Express pode ser importada", () => {
    assert.equal(typeof app, "function");
});

// ========================================
// TESTE 2 - ROTA INEXISTENTE
// ========================================

test("Uma rota inexistente retorna HTTP 404", async (t) => {

    // Inicia um servidor temporário em uma porta livre
    const servidor = app.listen(0, "127.0.0.1");

    // Fecha o servidor quando o teste terminar
    t.after(() => new Promise((resolve, reject) => {
        servidor.close((erro) => {
            if (erro) {
                reject(erro);
            } else {
                resolve();
            }
        });
    }));

    // Aguarda o servidor ficar disponível
    await new Promise((resolve, reject) => {
        servidor.once("listening", resolve);
        servidor.once("error", reject);
    });

    // Descobre qual porta temporária foi utilizada
    const porta = servidor.address().port;

    // Faz uma requisição para uma rota inexistente
    const resposta = await fetch(
        `http://127.0.0.1:${porta}/__rota_inexistente_teste__`
    );

    // Verifica se o servidor respondeu com HTTP 404
    assert.equal(resposta.status, 404);
});

// ========================================
// TESTE 3 - AUTENTICAÇÃO JWT
// ========================================

test("A rota /perfil bloqueia acesso sem token JWT", async (t) => {

    // Inicia um servidor temporário
    const servidor = app.listen(0, "127.0.0.1");

    // Garante que o servidor será encerrado
    t.after(() => new Promise((resolve, reject) => {
        servidor.close((erro) => {
            if (erro) {
                reject(erro);
            } else {
                resolve();
            }
        });
    }));

    // Aguarda o servidor iniciar
    await new Promise((resolve, reject) => {
        servidor.once("listening", resolve);
        servidor.once("error", reject);
    });

    // Descobre a porta utilizada
    const porta = servidor.address().port;

    // Tenta acessar /perfil sem token
    const resposta = await fetch(
        `http://127.0.0.1:${porta}/perfil`
    );

    // Verifica o código HTTP
    assert.equal(resposta.status, 401);

    // Verifica a mensagem de erro
    const dados = await resposta.json();

    assert.equal(
        dados.error,
        "Token de autenticação não fornecido"
    );
});



// ========================================
// TESTE 4 - TOKEN JWT INVÁLIDO
// ========================================

test("A rota /perfil rejeita token JWT inválido", async (t) => {

    const servidor = app.listen(0, "127.0.0.1");

    t.after(() => new Promise((resolve, reject) => {
        servidor.close((erro) => {
            if (erro) {
                reject(erro);
            } else {
                resolve();
            }
        });
    }));

    await new Promise((resolve, reject) => {
        servidor.once("listening", resolve);
        servidor.once("error", reject);
    });

    const porta = servidor.address().port;

    // Envia um token falso
    const resposta = await fetch(
        `http://127.0.0.1:${porta}/perfil`,
        {
            headers: {
                Authorization: "Bearer token-invalido"
            }
        }
    );

    // Verifica se o acesso foi bloqueado
    assert.equal(resposta.status, 401);

    const dados = await resposta.json();

    assert.equal(
        dados.error,
        "Token inválido ou expirado"
    );
});
// ========================================
// TESTE 5 - PERMISSAO DE OPERADOR
// ========================================

test("Operador nao pode excluir equipamentos", async (t) => {

    // Simula um usuario operador no banco de dados
    t.mock.method(pool, "query", async () => ({
        rows: [{ perfil: "operador" }]
    }));

    // Inicia um servidor temporario
    const servidor = app.listen(0, "127.0.0.1");

    t.after(() => new Promise((resolve, reject) => {
        servidor.close((erro) => {
            if (erro) reject(erro);
            else resolve();
        });
    }));

    await new Promise((resolve, reject) => {
        servidor.once("listening", resolve);
        servidor.once("error", reject);
    });

    const porta = servidor.address().port;

    // Cria um token JWT valido para o teste
    const token = jwt.sign(
        { id: 999 },
        process.env.JWT_SECRET,
        { algorithm: "HS256" }
    );

    // Operador tenta excluir um equipamento
    const resposta = await fetch(
        `http://127.0.0.1:${porta}/equipamentos/TESTE001`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    // Confirma que o acesso foi negado
    assert.equal(resposta.status, 403);

    const dados = await resposta.json();

    assert.equal(
        dados.error,
        "Acesso permitido somente para administradores"
    );
});


test("Administrador pode excluir equipamentos", async (t) => {
    // Simula as respostas do PostgreSQL
    t.mock.method(pool, "query", async (sql) => {
        // Verifica o perfil do usuário
        if (/SELECT\s+perfil\s+FROM\s+usuarios/i.test(sql)) {
            return {
                rows: [{ perfil: "administrador" }]
            };
        }

        // Simula a exclusão do equipamento
        if (/DELETE\s+FROM\s+equipamentos/i.test(sql)) {
            return {
                rows: [{
                    id: 1,
                    nome: "Trator Teste",
                    patrimonio: "TESTE001"
                }]
            };
        }

        throw new Error("Consulta SQL inesperada no teste");
    });

   
    // Aguarda o servidor iniciar completamente
    const servidor = await new Promise((resolve, reject) => {
        const s = app.listen(0, "127.0.0.1", () => {
            resolve(s);
        });

        s.once("error", reject);
    });

    // Encerra o servidor depois do teste
    t.after(() => servidor.close());

    // Obtém a porta após a inicialização
    const porta = servidor.address().port;

    // Cria um token JWT válido para o administrador
    const token = jwt.sign(
        { id: 999 },
        process.env.JWT_SECRET,
        { algorithm: "HS256" }
    );

    // Administrador tenta excluir o equipamento
    const resposta = await fetch(
        `http://127.0.0.1:${porta}/equipamentos/TESTE001`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    // Confirma que a exclusão foi permitida
    assert.equal(resposta.status, 200);

    const dados = await resposta.json();

    assert.equal(
        dados.mensagem,
        "Equipamento excluído com sucesso"
    );

    assert.equal(
        dados.equipamento.patrimonio,
        "TESTE001"
    );
});