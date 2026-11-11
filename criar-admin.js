
require("dotenv").config({ quiet: true });

const bcrypt = require("bcrypt");
const readline = require("node:readline");
const { createInterface } = require("node:readline/promises");

const pool = require("./database");

// ==========================================
// CONSULTAR ADMINISTRADORES EXISTENTES
// ==========================================

async function existeAdministrador(cliente = pool) {
    const resultado = await cliente.query(
        `
        SELECT COUNT(*)::int AS total
        FROM usuarios
        WHERE perfil = $1
        `,
        ["administrador"]
    );

    return resultado.rows[0].total > 0;
}

// ==========================================
// LER DADOS COMUNS DO TERMINAL
// ==========================================

async function lerDados() {
    const leitor = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const nome = (
            await leitor.question("Nome completo: ")
        ).trim();

        const email = (
            await leitor.question("E-mail: ")
        ).trim().toLowerCase();

        return { nome, email };

    } finally {
        leitor.close();
    }
}

// ==========================================
// LER SENHA SEM MOSTRAR NA TELA
// ==========================================

function lerSenhaOculta(mensagem) {
    return new Promise((resolve, reject) => {
        const entrada = process.stdin;
        const saida = process.stdout;

        if (!entrada.isTTY || !entrada.setRawMode) {
            reject(
                new Error(
                    "Execute o script em um terminal interativo."
                )
            );
            return;
        }

        let senha = "";
        let finalizado = false;

        function limpar() {
            entrada.removeListener(
                "keypress",
                aoPressionarTecla
            );

            entrada.setRawMode(false);
            entrada.pause();
        }

        function finalizar(erro = null) {
            if (finalizado) return;

            finalizado = true;
            limpar();
            saida.write("\n");

            if (erro) {
                reject(erro);
            } else {
                resolve(senha);
            }
        }

        function aoPressionarTecla(texto, tecla = {}) {
            if (tecla.ctrl && tecla.name === "c") {
                finalizar(
                    new Error("Operação cancelada.")
                );
                return;
            }

            if (
                tecla.name === "return" ||
                tecla.name === "enter"
            ) {
                finalizar();
                return;
            }

            if (
                tecla.name === "backspace" ||
                tecla.name === "delete"
            ) {
                senha = Array.from(senha)
                    .slice(0, -1)
                    .join("");

                return;
            }

            // Ignorar teclas de controle.
            if (tecla.ctrl || tecla.meta) return;

            if (
                texto &&
                !/[\u0000-\u001F\u007F]/.test(texto)
            ) {
                senha += texto;
            }
        }

        try {
            readline.emitKeypressEvents(entrada);

            entrada.setRawMode(true);
            entrada.resume();

            saida.write(mensagem);

            entrada.on(
                "keypress",
                aoPressionarTecla
            );

        } catch (erro) {
            try {
                limpar();
            } catch {
                // Restaurar o terminal, se possível.
            }

            reject(erro);
        }
    });
}

// ==========================================
// VALIDAR DADOS
// ==========================================

function validarDados(nome, email, senha) {
    if (!nome || !email || !senha) {
        throw new Error(
            "Nome, e-mail e senha são obrigatórios."
        );
    }

    if (nome.length > 100) {
        throw new Error(
            "O nome deve ter no máximo 100 caracteres."
        );
    }

    if (
        email.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new Error(
            "Informe um e-mail válido com até 150 caracteres."
        );
    }

    if (
        senha.length < 8 ||
        Buffer.byteLength(senha, "utf8") > 72
    ) {
        throw new Error(
            "A senha deve ter no mínimo 8 caracteres e no máximo 72 bytes."
        );
    }
}

// ==========================================
// CRIAR PRIMEIRO ADMINISTRADOR
// ==========================================

async function criarPrimeiroAdministrador() {
    let cliente = null;
    let transacaoIniciada = false;

    try {
        console.log(
            "\n=== CONFIGURAÇÃO DO ADMINISTRADOR ===\n"
        );

        // Primeira verificação, antes de solicitar dados.
        if (await existeAdministrador()) {
            console.log(
                "Já existe um administrador cadastrado."
            );

            console.log(
                "Nenhum usuário foi criado."
            );

            return;
        }

        console.log(
            "Nenhum administrador encontrado.\n"
        );

        // Nenhuma transação fica aberta
        // enquanto o usuário preenche os dados.
        const { nome, email } = await lerDados();

        const senha = await lerSenhaOculta(
            "Senha inicial (oculta): "
        );

        validarDados(nome, email, senha);

        // Gerar o hash antes de iniciar a transação.
        const senhaHash = await bcrypt.hash(
            senha,
            12
        );

        cliente = await pool.connect();

        await cliente.query("BEGIN");
        transacaoIniciada = true;

        // Trava compartilhada com a lógica
        // de gerenciamento de perfis do sistema.
        await cliente.query(
            "SELECT pg_advisory_xact_lock(734205)"
        );

        // Revalidar dentro da transação.
        if (await existeAdministrador(cliente)) {
            await cliente.query("ROLLBACK");
            transacaoIniciada = false;

            console.log(
                "\nOutro administrador já foi cadastrado."
            );

            console.log(
                "Nenhum usuário foi criado."
            );

            return;
        }

        const resultado = await cliente.query(
            `
            INSERT INTO usuarios
                (nome, email, senha_hash, perfil)
            VALUES
                ($1, $2, $3, $4)
            RETURNING
                id, nome, email, perfil
            `,
            [
                nome,
                email,
                senhaHash,
                "administrador"
            ]
        );

        await cliente.query("COMMIT");
        transacaoIniciada = false;

        console.log(
            "\nAdministrador criado com sucesso!"
        );

        console.table(resultado.rows);

    } catch (erro) {
        if (cliente && transacaoIniciada) {
            try {
                await cliente.query("ROLLBACK");
            } catch (erroRollback) {
                console.error(
                    "Erro ao desfazer transação:",
                    erroRollback.message
                );
            }
        }

        console.error(
            "\nErro:", erro.message
        );

        process.exitCode = 1;

    } finally {
        if (cliente) {
            cliente.release();
        }

        await pool.end();
    }
}

criarPrimeiroAdministrador();
