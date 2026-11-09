
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ========================================
// CONFIGURAÇÃO INICIAL
// ========================================

if (!process.env.JWT_SECRET) {
    throw new Error(
        "JWT_SECRET não configurado no arquivo .env"
    );
}

const app = express();

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

function autenticarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !/^Bearer \S+$/i.test(authHeader)) {
        return res.status(401).json({
            error: "Token de autenticação não fornecido"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const usuarioDecodificado = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        req.usuario = usuarioDecodificado;
        next();

    } catch (erro) {
        return res.status(401).json({
            error: "Token inválido ou expirado"
        });
    }
}

// ========================================
// MIDDLEWARE DE ADMINISTRADOR
// ========================================

async function exigirAdministrador(req, res, next) {
    try {
        const resultado = await pool.query(
            "SELECT perfil FROM usuarios WHERE id = $1",
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                error: "Usuário não encontrado"
            });
        }

        if (resultado.rows[0].perfil !== "administrador") {
            return res.status(403).json({
                error: "Acesso permitido somente para administradores"
            });
        }

        next();

    } catch (erro) {
        console.error(
            "Erro ao verificar permissões:",
            erro.message
        );

        return res.status(500).json({
            error: "Erro ao verificar permissões"
        });
    }
}

// ========================================
// CONSULTAR MEU PERFIL
// ========================================

app.get(
    "/perfil",
    autenticarToken,
    async (req, res) => {
        try {
            const resultado = await pool.query(
                `SELECT id, nome, email, perfil
                 FROM usuarios
                 WHERE id = $1`,
                [req.usuario.id]
            );

            if (resultado.rows.length === 0) {
                return res.status(401).json({
                    error: "Usuário não encontrado"
                });
            }

            return res.status(200).json({
                mensagem: "Acesso autorizado",
                usuario: resultado.rows[0]
            });

        } catch (erro) {
            console.error(
                "Erro ao consultar perfil:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro ao consultar perfil"
            });
        }
    }
);

// ========================================
// CADASTRAR USUÁRIO
// SOMENTE ADMINISTRADOR
// ========================================

app.post(
    "/usuarios",
    autenticarToken,
    exigirAdministrador,
    async (req, res) => {
        try {
            const nome =
                typeof req.body?.nome === "string"
                    ? req.body.nome.trim()
                    : "";

            const email =
                typeof req.body?.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "";

            const senha =
                typeof req.body?.senha === "string"
                    ? req.body.senha
                    : "";

            if (!nome || !email || !senha) {
                return res.status(400).json({
                    error: "Nome, email e senha são obrigatórios"
                });
            }

            if (nome.length > 100) {
                return res.status(400).json({
                    error: "O nome deve ter no máximo 100 caracteres"
                });
            }

            if (email.length > 150) {
                return res.status(400).json({
                    error: "O email deve ter no máximo 150 caracteres"
                });
            }

            if (
                senha.length < 8 ||
                Buffer.byteLength(senha, "utf8") > 72
            ) {
                return res.status(400).json({
                    error: "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes"
                });
            }

            const senhaHash = await bcrypt.hash(senha, 12);

            // Perfil inicial definido pelo banco: operador.
            const resultado = await pool.query(
                `INSERT INTO usuarios
                    (nome, email, senha_hash)
                 VALUES ($1, $2, $3)
                 RETURNING
                    id, nome, email, perfil, criado_em`,
                [nome, email, senhaHash]
            );

            return res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso",
                usuario: resultado.rows[0]
            });

        } catch (erro) {
            if (erro.code === "23505") {
                return res.status(409).json({
                    error: "Este email já está cadastrado"
                });
            }

            console.error(
                "Erro ao cadastrar usuário:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro interno ao cadastrar usuário"
            });
        }
    }
);

// ========================================
// LISTAR USUÁRIOS
// SOMENTE ADMINISTRADOR
// ========================================

app.get(
    "/usuarios",
    autenticarToken,
    exigirAdministrador,
    async (req, res) => {
        try {
            const resultado = await pool.query(
                `SELECT
                    id,
                    nome,
                    email,
                    perfil,
                    criado_em
                 FROM usuarios
                 ORDER BY id ASC`
            );

            return res.status(200).json(
                resultado.rows
            );

        } catch (erro) {
            console.error(
                "Erro ao listar usuários:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro interno ao listar usuários"
            });
        }
    }
);

// ========================================
// NOVA ROTA: ALTERAR PERFIL
// SOMENTE ADMINISTRADOR
// ========================================

app.patch(
    "/usuarios/:id/perfil",
    autenticarToken,
    exigirAdministrador,
    async (req, res) => {
        const id = Number(req.params.id);

        const perfil =
            typeof req.body?.perfil === "string"
                ? req.body.perfil.trim().toLowerCase()
                : "";

        // Validar ID recebido na URL
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "ID de usuário inválido"
            });
        }

        // Aceitar somente dois perfis
        if (
            perfil !== "administrador" &&
            perfil !== "operador"
        ) {
            return res.status(400).json({
                error: "Perfil deve ser administrador ou operador"
            });
        }

        // Usamos uma conexão exclusiva durante a transação.
        let cliente;

        try {
            cliente = await pool.connect();

            await cliente.query("BEGIN");

            // Serializa as alterações de perfis feitas
            // por esta rota, evitando remover dois
            // administradores simultaneamente.
            await cliente.query(
                "SELECT pg_advisory_xact_lock(734205)"
            );

            // Conferir novamente a permissão do usuário
            // que está fazendo a alteração.
            const solicitante = await cliente.query(
                `SELECT perfil
                 FROM usuarios
                 WHERE id = $1`,
                [req.usuario.id]
            );

            if (solicitante.rows.length === 0) {
                await cliente.query("ROLLBACK");

                return res.status(401).json({
                    error: "Usuário autenticado não encontrado"
                });
            }

            if (
                solicitante.rows[0].perfil !==
                "administrador"
            ) {
                await cliente.query("ROLLBACK");

                return res.status(403).json({
                    error: "Acesso permitido somente para administradores"
                });
            }

            // Bloquear o registro durante a alteração.
            const usuarioEncontrado = await cliente.query(
                `SELECT id, nome, email, perfil
                 FROM usuarios
                 WHERE id = $1
                 FOR UPDATE`,
                [id]
            );

            if (usuarioEncontrado.rows.length === 0) {
                await cliente.query("ROLLBACK");

                return res.status(404).json({
                    error: "Usuário não encontrado"
                });
            }

            const usuarioAtual = usuarioEncontrado.rows[0];

            // Não há mudança a fazer.
            if (usuarioAtual.perfil === perfil) {
                await cliente.query("COMMIT");

                return res.status(200).json({
                    mensagem: "O usuário já possui este perfil",
                    usuario: usuarioAtual
                });
            }

            // Não permitir remover o último administrador.
            if (
                usuarioAtual.perfil === "administrador" &&
                perfil === "operador"
            ) {
                const contagem = await cliente.query(
                    `SELECT COUNT(*)::int AS total
                     FROM usuarios
                     WHERE perfil = 'administrador'`
                );

                const totalAdministradores =
                    contagem.rows[0].total;

                if (totalAdministradores <= 1) {
                    await cliente.query("ROLLBACK");

                    return res.status(409).json({
                        error: "Não é permitido remover o último administrador do sistema"
                    });
                }
            }

            // Atualizar perfil no PostgreSQL.
            const resultado = await cliente.query(
                `UPDATE usuarios
                 SET perfil = $1
                 WHERE id = $2
                 RETURNING id, nome, email, perfil`,
                [perfil, id]
            );

            await cliente.query("COMMIT");

            return res.status(200).json({
                mensagem: "Perfil atualizado com sucesso",
                usuario: resultado.rows[0]
            });

        } catch (erro) {
            if (cliente) {
                try {
                    await cliente.query("ROLLBACK");
                } catch (erroRollback) {
                    console.error(
                        "Erro no rollback:",
                        erroRollback.message
                    );
                }
            }

            console.error(
                "Erro ao alterar perfil:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro interno ao alterar perfil"
            });

        } finally {
            if (cliente) {
                cliente.release();
            }
        }
    }
);

// ========================================
// LOGIN
// ========================================

app.post("/login", async (req, res) => {
    try {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const senha =
            typeof req.body?.senha === "string"
                ? req.body.senha
                : "";

        if (!email || !senha) {
            return res.status(400).json({
                error: "Email e senha são obrigatórios"
            });
        }

        const resultado = await pool.query(
            `SELECT
                id,
                nome,
                email,
                senha_hash,
                perfil
             FROM usuarios
             WHERE email = $1`,
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                error: "Email ou senha inválidos"
            });
        }

        const usuario = resultado.rows[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                error: "Email ou senha inválidos"
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
                algorithm: "HS256"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso",
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            },
            token
        });

    } catch (erro) {
        console.error(
            "Erro ao realizar login:",
            erro.message
        );

        return res.status(500).json({
            error: "Erro interno ao realizar login"
        });
    }
});

// ========================================
// CADASTRAR EQUIPAMENTO
// SOMENTE ADMINISTRADOR
// ========================================

app.post(
    "/equipamentos",
    autenticarToken,
    exigirAdministrador,
    async (req, res) => {
        try {
            const nome =
                typeof req.body?.nome === "string"
                    ? req.body.nome.trim()
                    : "";

            const patrimonio =
                typeof req.body?.patrimonio === "string"
                    ? req.body.patrimonio.trim()
                    : "";

            if (!nome || !patrimonio) {
                return res.status(400).json({
                    error: "Nome e patrimônio são obrigatórios"
                });
            }

            if (nome.length > 100) {
                return res.status(400).json({
                    error: "O nome deve ter no máximo 100 caracteres"
                });
            }

            if (patrimonio.length > 50) {
                return res.status(400).json({
                    error: "O patrimônio deve ter no máximo 50 caracteres"
                });
            }

            const resultado = await pool.query(
                `INSERT INTO equipamentos
                    (nome, patrimonio)
                 VALUES ($1, $2)
                 RETURNING id, nome, patrimonio`,
                [nome, patrimonio]
            );

            return res.status(201).json({
                message: "Equipamento cadastrado com sucesso",
                equipamento: resultado.rows[0]
            });

        } catch (erro) {
            if (erro.code === "23505") {
                return res.status(409).json({
                    error: "Patrimônio já cadastrado"
                });
            }

            console.error(
                "Erro ao cadastrar equipamento:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro ao cadastrar equipamento"
            });
        }
    }
);

// ========================================
// CONSULTAR EQUIPAMENTOS
// USUÁRIO AUTENTICADO
// ========================================

app.get(
    "/equipamentos",
    autenticarToken,
    async (req, res) => {
        try {
            const usuario = await pool.query(
                "SELECT id FROM usuarios WHERE id = $1",
                [req.usuario.id]
            );

            if (usuario.rows.length === 0) {
                return res.status(401).json({
                    error: "Usuário não encontrado"
                });
            }

            const resultado = await pool.query(
                `SELECT id, nome, patrimonio
                 FROM equipamentos
                 ORDER BY id`
            );

            return res.json(resultado.rows);

        } catch (erro) {
            console.error(
                "Erro ao consultar equipamentos:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro ao consultar equipamentos"
            });
        }
    }
);

// ========================================
// ATUALIZAR EQUIPAMENTO
// SOMENTE ADMINISTRADOR
// ========================================

app.put(
    "/equipamentos/:patrimonio",
    autenticarToken,
    exigirAdministrador,
    async (req, res) => {
        try {
            const patrimonio =
                typeof req.params.patrimonio === "string"
                    ? req.params.patrimonio.trim()
                    : "";

            const nome =
                typeof req.body?.nome === "string"
                    ? req.body.nome.trim()
                    : "";

            if (!patrimonio) {
                return res.status(400).json({
                    error: "O patrimônio é obrigatório"
                });
            }

            if (patrimonio.length > 50) {
                return res.status(400).json({
                    error: "O patrimônio deve ter no máximo 50 caracteres"
                });
            }

            if (!nome) {
                return res.status(400).json({
                    error: "O nome do equipamento é obrigatório"
                });
            }

            if (nome.length > 100) {
                return res.status(400).json({
                    error: "O nome deve ter no máximo 100 caracteres"
                });
            }

            const resultado = await pool.query(
                `UPDATE equipamentos
                 SET nome = $1
                 WHERE patrimonio = $2
                 RETURNING id, nome, patrimonio`,
                [nome, patrimonio]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    error: "Equipamento não encontrado"
                });
            }

            return res.json({
                mensagem: "Equipamento atualizado com sucesso",
                equipamento: resultado.rows[0]
            });

        } catch (erro) {
            console.error(
                "Erro ao atualizar equipamento:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro ao atualizar equipamento"
            });
        }
    }
);

// ========================================
// EXCLUIR EQUIPAMENTO
// SOMENTE ADMINISTRADOR
// ========================================

app.delete(
    "/equipamentos/:patrimonio",
    autenticarToken,
    exigirAdministrador,
    async (req, res) => {
        try {
            const patrimonio = req.params.patrimonio;

            const resultado = await pool.query(
                `DELETE FROM equipamentos
                 WHERE patrimonio = $1
                 RETURNING id, nome, patrimonio`,
                [patrimonio]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    error: "Equipamento não encontrado"
                });
            }

            return res.status(200).json({
                mensagem: "Equipamento excluído com sucesso",
                equipamento: resultado.rows[0]
            });

        } catch (erro) {
            console.error(
                "Erro ao excluir equipamento:",
                erro.message
            );

            return res.status(500).json({
                error: "Erro ao excluir equipamento"
            });
        }
    }
);

// ========================================
// TRATAMENTO DE ERROS
// ========================================

app.use((erro, req, res, next) => {
    if (
        erro.type === "entity.too.large" ||
        erro.status === 413
    ) {
        return res.status(413).json({
            error: "A requisição excede o limite permitido de 10 KB"
        });
    }

    console.error("Erro interno:", erro.message);

    return res.status(500).json({
        error: "Erro interno do servidor"
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
