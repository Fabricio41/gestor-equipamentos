
"use strict";

// ==========================================
// GESTOR EQUIPAMENTOS
// JAVASCRIPT DO DASHBOARD
// ==========================================

// CONFIGURAÇÕES DA API

const API_BASE = "http://localhost:3000";

const API_URL = `${API_BASE}/equipamentos`;
const USUARIOS_URL = `${API_BASE}/usuarios`;

// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const elemento = (id) => document.getElementById(id);

// LOGIN

const areaLogin = elemento("areaLogin");
const formLogin = elemento("formLogin");
const emailLogin = elemento("emailLogin");
const senhaLogin = elemento("senhaLogin");
const mensagemLogin = elemento("mensagemLogin");
const btnLogin = elemento("btnLogin");

// SESSÃO

const conteudoSistema = elemento("conteudoSistema");
const areaUsuario = elemento("areaUsuario");
const nomeUsuario = elemento("nomeUsuario");
const perfilUsuario = elemento("perfilUsuario");
const btnSair = elemento("btnSair");

// MENU LATERAL

const menuAdministrador = elemento("menuAdministrador");

// EQUIPAMENTOS

const areaCadastro = elemento("areaCadastro");
const formulario = elemento("formEquipamento");
const campoNome = elemento("nome");
const campoPatrimonio = elemento("patrimonio");

const listaEquipamentos = elemento("listaEquipamentos");
const cabecalhoAcoes = elemento("cabecalhoAcoes");

const pesquisa = elemento("pesquisa");
const semResultados = elemento("semResultados");
const mensagem = elemento("mensagem");

const totalEquipamentos = elemento("totalEquipamentos");
const resultadosPesquisa = elemento("resultadosPesquisa");
const totalPatrimonios = elemento("totalPatrimonios");

const botaoExportar = elemento("btnExportar");

// USUÁRIOS

const areaGerenciamentoUsuarios =
    elemento("areaGerenciamentoUsuarios");

const areaListaUsuarios =
    elemento("areaListaUsuarios");

const formNovoUsuario =
    elemento("formNovoUsuario");

const nomeNovoUsuario =
    elemento("nomeNovoUsuario");

const emailNovoUsuario =
    elemento("emailNovoUsuario");

const senhaNovoUsuario =
    elemento("senhaNovoUsuario");

const btnCadastrarUsuario =
    elemento("btnCadastrarUsuario");

const mensagemUsuarios =
    elemento("mensagemUsuarios");

const mensagemPerfil =
    elemento("mensagemPerfil");

const totalUsuarios =
    elemento("totalUsuarios");

const totalAdministradores =
    elemento("totalAdministradores");

const totalOperadores =
    elemento("totalOperadores");

const pesquisaUsuarios =
    elemento("pesquisaUsuarios");

const btnAtualizarUsuarios =
    elemento("btnAtualizarUsuarios");

const listaUsuarios =
    elemento("listaUsuarios");

const semUsuarios =
    elemento("semUsuarios");

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================

let token = null;
let usuarioLogado = null;

let equipamentosCadastrados = [];
let usuariosCadastrados = [];

// O token fica somente na memória.
// Atualizar a página exige um novo login.

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function ehAdministrador() {
    return Boolean(
        token &&
        usuarioLogado?.perfil === "administrador"
    );
}

function definirMensagem(
    elementoMensagem,
    texto,
    erro = false
) {
    if (!elementoMensagem) return;

    elementoMensagem.textContent = texto;

    elementoMensagem.style.color = erro
        ? "#f87171"
        : "#4ade80";
}

function mostrarMensagem(texto, erro = false) {
    definirMensagem(mensagem, texto, erro);
}

function mostrarMensagemLogin(texto, erro = false) {
    definirMensagem(mensagemLogin, texto, erro);
}

function mostrarMensagemUsuarios(texto, erro = false) {
    definirMensagem(mensagemUsuarios, texto, erro);
}

function mostrarMensagemPerfil(texto, erro = false) {
    definirMensagem(mensagemPerfil, texto, erro);
}

function verificarPermissaoAdministrador() {
    if (!ehAdministrador()) {
        mostrarMensagem(
            "Acesso permitido somente para administradores.",
            true
        );

        return false;
    }

    return true;
}

// ==========================================
// CONTROLE DA INTERFACE
// ==========================================

function atualizarInterface() {
    const autenticado = Boolean(token && usuarioLogado);
    const administrador = ehAdministrador();

    // LOGIN

    areaLogin.style.display = autenticado
        ? "none"
        : "grid";

    // DASHBOARD

    conteudoSistema.style.display = autenticado
        ? "block"
        : "none";

    // USUÁRIO LOGADO

    areaUsuario.style.display = autenticado
        ? "flex"
        : "none";

    // ÁREAS ADMINISTRATIVAS

    areaCadastro.style.display = administrador
        ? "block"
        : "none";

    areaGerenciamentoUsuarios.style.display =
        administrador ? "block" : "none";

    areaListaUsuarios.style.display =
        administrador ? "block" : "none";

    // MENU ADMINISTRATIVO

    menuAdministrador.style.display =
        administrador ? "block" : "none";

    // COLUNA DE AÇÕES

    cabecalhoAcoes.style.display =
        administrador ? "" : "none";

    // DADOS DO USUÁRIO

    if (autenticado) {
        nomeUsuario.textContent =
            usuarioLogado.nome ||
            usuarioLogado.email;

        perfilUsuario.textContent = administrador
            ? "Administrador"
            : "Operador";
    } else {
        nomeUsuario.textContent = "";
        perfilUsuario.textContent = "";
    }
}

// ==========================================
// INDICADORES DE EQUIPAMENTOS
// ==========================================

function atualizarIndicadores(quantidadeEncontrada) {
    totalEquipamentos.textContent =
        equipamentosCadastrados.length;

    resultadosPesquisa.textContent =
        quantidadeEncontrada;

    const patrimoniosUnicos = new Set(
        equipamentosCadastrados.map(
            (equipamento) => equipamento.patrimonio
        )
    );

    totalPatrimonios.textContent =
        patrimoniosUnicos.size;
}

// ==========================================
// INDICADORES DE USUÁRIOS
// ==========================================

function atualizarIndicadoresUsuarios() {
    totalUsuarios.textContent =
        usuariosCadastrados.length;

    totalAdministradores.textContent =
        usuariosCadastrados.filter(
            (usuario) =>
                usuario.perfil === "administrador"
        ).length;

    totalOperadores.textContent =
        usuariosCadastrados.filter(
            (usuario) =>
                usuario.perfil === "operador"
        ).length;
}

// ==========================================
// ENCERRAR SESSÃO
// ==========================================

function sairDoSistema(aviso = "") {
    token = null;
    usuarioLogado = null;

    equipamentosCadastrados = [];
    usuariosCadastrados = [];

    formLogin.reset();
    formulario.reset();
    formNovoUsuario.reset();

    pesquisa.value = "";
    pesquisaUsuarios.value = "";

    listaEquipamentos.replaceChildren();
    listaUsuarios.replaceChildren();

    semResultados.style.display = "none";
    semUsuarios.style.display = "none";

    atualizarIndicadores(0);
    atualizarIndicadoresUsuarios();

    atualizarInterface();

    mostrarMensagem("");
    mostrarMensagemUsuarios("");
    mostrarMensagemPerfil("");

    mostrarMensagemLogin(
        aviso,
        Boolean(aviso)
    );

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}

// ==========================================
// REQUISIÇÕES AUTENTICADAS
// ==========================================

async function requisicaoAutenticada(
    url,
    opcoes = {}
) {
    if (!token) {
        throw new Error(
            "Faça login para continuar."
        );
    }

    const tokenDaRequisicao = token;

    const headers = new Headers(
        opcoes.headers || {}
    );

    headers.set(
        "Authorization",
        `Bearer ${tokenDaRequisicao}`
    );

    const resposta = await fetch(url, {
        ...opcoes,
        headers
    });

    // SESSÃO EXPIRADA OU INVÁLIDA

    if (resposta.status === 401) {
        if (token === tokenDaRequisicao) {
            sairDoSistema(
                "Sessão inválida ou expirada. Faça login novamente."
            );
        }

        throw new Error(
            "Sessão inválida ou expirada."
        );
    }

    return resposta;
}

// ==========================================
// LOGIN
// ==========================================

formLogin.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        const email = emailLogin.value
            .trim()
            .toLowerCase();

        const senha = senhaLogin.value;

        if (!email || !senha) {
            mostrarMensagemLogin(
                "Informe seu e-mail e senha.",
                true
            );

            return;
        }

        btnLogin.disabled = true;

        mostrarMensagemLogin(
            "Verificando credenciais..."
        );

        try {
            const resposta = await fetch(
                `${API_BASE}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        senha
                    })
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.error ||
                    "Não foi possível realizar o login."
                );
            }

            if (
                !resultado.token ||
                !resultado.usuario
            ) {
                throw new Error(
                    "O servidor não retornou os dados esperados."
                );
            }

            const perfil = resultado.usuario.perfil;

            if (
                perfil !== "administrador" &&
                perfil !== "operador"
            ) {
                throw new Error(
                    "Perfil de usuário não reconhecido."
                );
            }

            // SALVAR SESSÃO EM MEMÓRIA

            token = resultado.token;
            usuarioLogado = resultado.usuario;

            senhaLogin.value = "";

            atualizarInterface();

            mostrarMensagemLogin("");

            mostrarMensagem(
                "Login realizado com sucesso!"
            );

            // CARREGAR EQUIPAMENTOS

            await carregarEquipamentos();

            // ADMINISTRADOR TAMBÉM CARREGA USUÁRIOS

            if (ehAdministrador()) {
                await carregarUsuarios();
            }

        } catch (erro) {
            if (!token) {
                mostrarMensagemLogin(
                    erro.message,
                    true
                );
            } else {
                mostrarMensagem(
                    erro.message,
                    true
                );
            }

        } finally {
            btnLogin.disabled = false;
        }
    }
);

// ==========================================
// BOTÃO SAIR
// ==========================================

btnSair.addEventListener("click", () => {
    sairDoSistema();
});

// ==========================================
// EXIBIR EQUIPAMENTOS
// ==========================================

function exibirEquipamentos(equipamentos) {
    listaEquipamentos.replaceChildren();

    semResultados.style.display =
        equipamentos.length === 0
            ? "block"
            : "none";

    const administrador = ehAdministrador();

    const fragmento = document.createDocumentFragment();

    equipamentos.forEach((equipamento) => {
        const linha = document.createElement("tr");

        // ID

        const colunaId = document.createElement("td");
        colunaId.textContent = equipamento.id;

        // NOME

        const colunaNome = document.createElement("td");
        colunaNome.textContent = equipamento.nome;

        // PATRIMÔNIO

        const colunaPatrimonio =
            document.createElement("td");

        colunaPatrimonio.textContent =
            equipamento.patrimonio;

        linha.appendChild(colunaId);
        linha.appendChild(colunaNome);
        linha.appendChild(colunaPatrimonio);

        // AÇÕES SOMENTE PARA ADMINISTRADOR

        if (administrador) {
            const colunaAcoes =
                document.createElement("td");

            // EDITAR

            const botaoEditar =
                document.createElement("button");

            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar";

            botaoEditar.addEventListener(
                "click",
                () => editarEquipamento(equipamento)
            );

            // EXCLUIR

            const botaoExcluir =
                document.createElement("button");

            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";

            botaoExcluir.style.background = "#dc2626";

            botaoExcluir.addEventListener(
                "click",
                () => excluirEquipamento(
                    equipamento.patrimonio
                )
            );

            colunaAcoes.appendChild(botaoEditar);
            colunaAcoes.appendChild(botaoExcluir);

            linha.appendChild(colunaAcoes);
        }

        fragmento.appendChild(linha);
    });

    listaEquipamentos.appendChild(fragmento);

    atualizarIndicadores(equipamentos.length);
}

// ==========================================
// CARREGAR EQUIPAMENTOS
// ==========================================

async function carregarEquipamentos() {
    if (!token) return;

    const tokenDaConsulta = token;

    try {
        const resposta = await requisicaoAutenticada(
            API_URL
        );

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar os equipamentos."
            );
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error(
                "Resposta inválida do servidor."
            );
        }

        if (token !== tokenDaConsulta) {
            return;
        }

        equipamentosCadastrados = dados;

        filtrarEquipamentos();

    } catch (erro) {
        if (token === tokenDaConsulta) {
            mostrarMensagem(
                erro.message,
                true
            );
        }
    }
}

// ==========================================
// PESQUISAR EQUIPAMENTOS
// ==========================================

function obterEquipamentosFiltrados() {
    const termo = pesquisa.value
        .trim()
        .toLowerCase();

    return equipamentosCadastrados.filter(
        (equipamento) => {
            const nome = equipamento.nome.toLowerCase();

            const patrimonio =
                equipamento.patrimonio.toLowerCase();

            return (
                nome.includes(termo) ||
                patrimonio.includes(termo)
            );
        }
    );
}

function filtrarEquipamentos() {
    const filtrados = obterEquipamentosFiltrados();

    exibirEquipamentos(filtrados);
}

pesquisa.addEventListener(
    "input",
    filtrarEquipamentos
);

// ==========================================
// EXPORTAR EQUIPAMENTOS
// CSV COMPATÍVEL COM EXCEL
// ==========================================

function exportarExcel() {
    if (!token) {
        mostrarMensagem(
            "Faça login para exportar.",
            true
        );

        return;
    }

    const filtrados = obterEquipamentosFiltrados();

    if (filtrados.length === 0) {
        mostrarMensagem(
            "Não existem equipamentos para exportar.",
            true
        );

        return;
    }

    const linhas = [
        ["ID", "Equipamento", "Patrimônio"],

        ...filtrados.map((equipamento) => [
            equipamento.id,
            equipamento.nome,
            equipamento.patrimonio
        ])
    ];

    // EVITA FÓRMULAS INDESEJADAS EM PLANILHAS

    function valorSeguroCSV(valor) {
        let texto = String(valor ?? "");

        if (/^\s*[=+\-@\t\r\n]/.test(texto)) {
            texto = "'" + texto;
        }

        return `"${texto.replace(/"/g, '""')}"`;
    }

    const conteudo = linhas
        .map((linha) =>
            linha.map(valorSeguroCSV).join(";")
        )
        .join("\r\n");

    const arquivo = new Blob(
        ["\uFEFF" + conteudo],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(arquivo);

    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio_equipamentos.csv";

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

    mostrarMensagem(
        "Relatório CSV exportado com sucesso!"
    );
}

botaoExportar.addEventListener(
    "click",
    exportarExcel
);

// ==========================================
// CADASTRAR EQUIPAMENTO
// ==========================================

formulario.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        if (!verificarPermissaoAdministrador()) {
            return;
        }

        const equipamento = {
            nome: campoNome.value.trim(),
            patrimonio: campoPatrimonio.value.trim()
        };

        if (
            !equipamento.nome ||
            !equipamento.patrimonio
        ) {
            mostrarMensagem(
                "Nome e patrimônio são obrigatórios.",
                true
            );

            return;
        }

        if (
            equipamento.nome.length > 100 ||
            equipamento.patrimonio.length > 50
        ) {
            mostrarMensagem(
                "Nome ou patrimônio ultrapassou o limite permitido.",
                true
            );

            return;
        }

        const botaoCadastrar = formulario.querySelector(
            'button[type="submit"]'
        );

        botaoCadastrar.disabled = true;

        try {
            const resposta = await requisicaoAutenticada(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(equipamento)
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.error ||
                    "Erro ao cadastrar equipamento."
                );
            }

            formulario.reset();

            await carregarEquipamentos();

            mostrarMensagem(
                "Equipamento cadastrado com sucesso!"
            );

        } catch (erro) {
            if (token) {
                mostrarMensagem(
                    erro.message,
                    true
                );
            }

        } finally {
            botaoCadastrar.disabled = false;
        }
    }
);

// ==========================================
// EDITAR EQUIPAMENTO
// ==========================================

async function editarEquipamento(equipamento) {
    if (!verificarPermissaoAdministrador()) {
        return;
    }

    const novoNome = prompt(
        "Digite o novo nome do equipamento:",
        equipamento.nome
    );

    if (novoNome === null) {
        return;
    }

    const nomeAtualizado = novoNome.trim();

    if (
        !nomeAtualizado ||
        nomeAtualizado.length > 100
    ) {
        mostrarMensagem(
            "Informe um nome entre 1 e 100 caracteres.",
            true
        );

        return;
    }

    try {
        const resposta = await requisicaoAutenticada(
            `${API_URL}/${encodeURIComponent(
                equipamento.patrimonio
            )}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nome: nomeAtualizado
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error ||
                "Erro ao editar equipamento."
            );
        }

        await carregarEquipamentos();

        mostrarMensagem(
            "Equipamento atualizado com sucesso!"
        );

    } catch (erro) {
        if (token) {
            mostrarMensagem(
                erro.message,
                true
            );
        }
    }
}

// ==========================================
// EXCLUIR EQUIPAMENTO
// ==========================================

async function excluirEquipamento(patrimonio) {
    if (!verificarPermissaoAdministrador()) {
        return;
    }

    const confirmar = confirm(
        `Deseja realmente excluir o equipamento ${patrimonio}?`
    );

    if (!confirmar) {
        return;
    }

    try {
        const resposta = await requisicaoAutenticada(
            `${API_URL}/${encodeURIComponent(patrimonio)}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error ||
                "Erro ao excluir equipamento."
            );
        }

        await carregarEquipamentos();

        mostrarMensagem(
            "Equipamento excluído com sucesso!"
        );

    } catch (erro) {
        if (token) {
            mostrarMensagem(
                erro.message,
                true
            );
        }
    }
}

// ==========================================
// EXIBIR USUÁRIOS
// ==========================================

function exibirUsuarios(usuarios) {
    listaUsuarios.replaceChildren();

    semUsuarios.style.display =
        usuarios.length === 0
            ? "block"
            : "none";

    const fragmento = document.createDocumentFragment();

    usuarios.forEach((usuario) => {
        const linha = document.createElement("tr");

        const colunaId = document.createElement("td");
        colunaId.textContent = usuario.id;

        const colunaNome = document.createElement("td");
        colunaNome.textContent = usuario.nome;

        const colunaEmail = document.createElement("td");
        colunaEmail.textContent = usuario.email;

        const colunaPerfil = document.createElement("td");

        colunaPerfil.textContent =
            usuario.perfil === "administrador"
                ? "Administrador"
                : "Operador";

        const colunaData = document.createElement("td");

        if (usuario.criado_em) {
            const data = new Date(usuario.criado_em);

            colunaData.textContent =
                Number.isNaN(data.getTime())
                    ? "-"
                    : data.toLocaleDateString("pt-BR");
        } else {
            colunaData.textContent = "-";
        }

        // BOTÃO DE ALTERAR PERFIL

        const colunaAcoes = document.createElement("td");

        const botaoAlterar = document.createElement("button");

        botaoAlterar.type = "button";
        botaoAlterar.textContent = "Alterar perfil";

        botaoAlterar.addEventListener(
            "click",
            () => alterarPerfilUsuario(usuario)
        );

        colunaAcoes.appendChild(botaoAlterar);

        linha.appendChild(colunaId);
        linha.appendChild(colunaNome);
        linha.appendChild(colunaEmail);
        linha.appendChild(colunaPerfil);
        linha.appendChild(colunaData);
        linha.appendChild(colunaAcoes);

        fragmento.appendChild(linha);
    });

    listaUsuarios.appendChild(fragmento);
}

// ==========================================
// PESQUISAR USUÁRIOS
// ==========================================

function filtrarUsuarios() {
    if (!ehAdministrador()) {
        return;
    }

    const termo = pesquisaUsuarios.value
        .trim()
        .toLowerCase();

    const filtrados = usuariosCadastrados.filter(
        (usuario) => {
            const nome = usuario.nome.toLowerCase();
            const email = usuario.email.toLowerCase();

            return (
                nome.includes(termo) ||
                email.includes(termo)
            );
        }
    );

    exibirUsuarios(filtrados);
}

pesquisaUsuarios.addEventListener(
    "input",
    filtrarUsuarios
);

// ==========================================
// CARREGAR USUÁRIOS
// ==========================================

async function carregarUsuarios() {
    if (!ehAdministrador()) {
        return;
    }

    const tokenDaConsulta = token;

    try {
        const resposta = await requisicaoAutenticada(
            USUARIOS_URL
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error ||
                "Erro ao consultar usuários."
            );
        }

        if (!Array.isArray(resultado)) {
            throw new Error(
                "O servidor retornou uma lista inválida."
            );
        }

        if (
            token !== tokenDaConsulta ||
            !ehAdministrador()
        ) {
            return;
        }

        usuariosCadastrados = resultado;

        atualizarIndicadoresUsuarios();

        filtrarUsuarios();

    } catch (erro) {
        if (token === tokenDaConsulta) {
            mostrarMensagemUsuarios(
                erro.message,
                true
            );
        }
    }
}

// ==========================================
// CADASTRAR NOVO USUÁRIO
// ==========================================

formNovoUsuario.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        if (!ehAdministrador()) {
            mostrarMensagemUsuarios(
                "Apenas administradores podem cadastrar usuários.",
                true
            );

            return;
        }

        const nome = nomeNovoUsuario.value.trim();

        const email = emailNovoUsuario.value
            .trim()
            .toLowerCase();

        const senha = senhaNovoUsuario.value;

        if (!nome || !email || !senha) {
            mostrarMensagemUsuarios(
                "Preencha nome, e-mail e senha.",
                true
            );

            return;
        }

        if (
            nome.length > 100 ||
            email.length > 150
        ) {
            mostrarMensagemUsuarios(
                "Nome ou e-mail ultrapassou o limite permitido.",
                true
            );

            return;
        }

        if (
            senha.length < 8 ||
            new TextEncoder().encode(senha).length > 72
        ) {
            mostrarMensagemUsuarios(
                "A senha deve ter no mínimo 8 caracteres e no máximo 72 bytes.",
                true
            );

            return;
        }

        btnCadastrarUsuario.disabled = true;

        mostrarMensagemUsuarios(
            "Cadastrando usuário..."
        );

        try {
            const resposta = await requisicaoAutenticada(
                USUARIOS_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        nome,
                        email,
                        senha
                    })
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.error ||
                    "Erro ao cadastrar usuário."
                );
            }

            formNovoUsuario.reset();

            await carregarUsuarios();

            mostrarMensagemUsuarios(
                "Usuário cadastrado com sucesso!"
            );

        } catch (erro) {
            if (token) {
                mostrarMensagemUsuarios(
                    erro.message,
                    true
                );
            }

        } finally {
            btnCadastrarUsuario.disabled = false;
        }
    }
);

// ==========================================
// ALTERAR PERFIL DE USUÁRIO
// ==========================================

async function alterarPerfilUsuario(usuario) {
    if (!ehAdministrador()) {
        mostrarMensagemPerfil(
            "Apenas administradores podem alterar perfis.",
            true
        );

        return;
    }

    const perfilAtual = usuario.perfil;

    const novoPerfil =
        perfilAtual === "administrador"
            ? "operador"
            : "administrador";

    const nomePerfil =
        novoPerfil === "administrador"
            ? "ADMINISTRADOR"
            : "OPERADOR";

    const confirmar = confirm(
        `Deseja alterar o perfil de "${usuario.nome}" para ${nomePerfil}?`
    );

    if (!confirmar) {
        return;
    }

    mostrarMensagemPerfil(
        "Atualizando perfil..."
    );

    try {
        const resposta = await requisicaoAutenticada(
            `${USUARIOS_URL}/${encodeURIComponent(
                usuario.id
            )}/perfil`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    perfil: novoPerfil
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error ||
                "Não foi possível alterar o perfil."
            );
        }

        // CASO O ADMINISTRADOR ALTERE
        // O PRÓPRIO PERFIL

        if (
            Number(usuario.id) ===
            Number(usuarioLogado?.id)
        ) {
            usuarioLogado.perfil =
                resultado.usuario.perfil;

            atualizarInterface();

            // SE DEIXOU DE SER ADMINISTRADOR

            if (!ehAdministrador()) {
                usuariosCadastrados = [];

                listaUsuarios.replaceChildren();

                atualizarIndicadoresUsuarios();

                // REMOVER BOTÕES ADMINISTRATIVOS
                // DA TABELA DE EQUIPAMENTOS

                filtrarEquipamentos();

                mostrarMensagem(
                    "Seu perfil foi atualizado. Suas permissões foram alteradas."
                );

                return;
            }
        }

        await carregarUsuarios();

        mostrarMensagemPerfil(
            "Perfil atualizado com sucesso!"
        );

    } catch (erro) {
        if (!token) {
            return;
        }

        mostrarMensagemPerfil(
            erro.message,
            true
        );

        await carregarUsuarios();
    }
}

// ==========================================
// ATUALIZAR LISTA DE USUÁRIOS
// ==========================================

btnAtualizarUsuarios.addEventListener(
    "click",
    async () => {
        if (!ehAdministrador()) {
            return;
        }

        await carregarUsuarios();
    }
);

// ==========================================
// MENU LATERAL
// ==========================================

const linksMenu = document.querySelectorAll(
    ".menu-link"
);

linksMenu.forEach((link) => {
    link.addEventListener("click", () => {
        linksMenu.forEach((item) => {
            item.classList.remove("ativo");
        });

        link.classList.add("ativo");
    });
});

// ==========================================
// INICIAR APLICAÇÃO
// ==========================================

atualizarIndicadores(0);

atualizarIndicadoresUsuarios();

atualizarInterface();

console.log(
    "Gestor Equipamentos: interface inicializada."
);
