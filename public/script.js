
const API_BASE = "http://localhost:3000";
const API_URL = `${API_BASE}/equipamentos`;
const USUARIOS_URL = `${API_BASE}/usuarios`;

// ========================================
// ELEMENTOS DE LOGIN
// ========================================

const areaLogin = document.getElementById("areaLogin");
const formLogin = document.getElementById("formLogin");
const emailLogin = document.getElementById("emailLogin");
const senhaLogin = document.getElementById("senhaLogin");
const mensagemLogin = document.getElementById("mensagemLogin");
const btnLogin = document.getElementById("btnLogin");

const areaUsuario = document.getElementById("areaUsuario");
const nomeUsuario = document.getElementById("nomeUsuario");
const perfilUsuario = document.getElementById("perfilUsuario");
const btnSair = document.getElementById("btnSair");
const conteudoSistema = document.getElementById("conteudoSistema");

// ========================================
// ELEMENTOS DE EQUIPAMENTOS
// ========================================

const areaCadastro = document.getElementById("areaCadastro");
const cabecalhoAcoes = document.getElementById("cabecalhoAcoes");

const formulario = document.getElementById("formEquipamento");
const campoNome = document.getElementById("nome");
const campoPatrimonio = document.getElementById("patrimonio");
const listaEquipamentos = document.getElementById("listaEquipamentos");
const mensagem = document.getElementById("mensagem");
const pesquisa = document.getElementById("pesquisa");
const semResultados = document.getElementById("semResultados");

const totalEquipamentos = document.getElementById("totalEquipamentos");
const resultadosPesquisa = document.getElementById("resultadosPesquisa");
const totalPatrimonios = document.getElementById("totalPatrimonios");
const botaoExportar = document.getElementById("btnExportar");

// ========================================
// ELEMENTOS DO GERENCIAMENTO DE USUÁRIOS
// ========================================

const areaGerenciamentoUsuarios =
    document.getElementById("areaGerenciamentoUsuarios");

const areaListaUsuarios =
    document.getElementById("areaListaUsuarios");

const formNovoUsuario =
    document.getElementById("formNovoUsuario");

const nomeNovoUsuario =
    document.getElementById("nomeNovoUsuario");

const emailNovoUsuario =
    document.getElementById("emailNovoUsuario");

const senhaNovoUsuario =
    document.getElementById("senhaNovoUsuario");

const btnCadastrarUsuario =
    document.getElementById("btnCadastrarUsuario");

const mensagemUsuarios =
    document.getElementById("mensagemUsuarios");

const mensagemPerfil =
    document.getElementById("mensagemPerfil");

const totalUsuarios =
    document.getElementById("totalUsuarios");

const totalAdministradores =
    document.getElementById("totalAdministradores");

const totalOperadores =
    document.getElementById("totalOperadores");

const pesquisaUsuarios =
    document.getElementById("pesquisaUsuarios");

const btnAtualizarUsuarios =
    document.getElementById("btnAtualizarUsuarios");

const listaUsuarios =
    document.getElementById("listaUsuarios");

const semUsuarios =
    document.getElementById("semUsuarios");

// ========================================
// ESTADO DA APLICAÇÃO
// ========================================

let token = null;
let usuarioLogado = null;

let equipamentosCadastrados = [];
let usuariosCadastrados = [];

// O token fica somente na memória.
// Atualizar a página exige um novo login.

// ========================================
// CONTROLE DE PERMISSÕES
// ========================================

function ehAdministrador() {
    return (
        Boolean(token) &&
        usuarioLogado?.perfil === "administrador"
    );
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

// ========================================
// MENSAGENS
// ========================================

function definirMensagem(elemento, texto, erro = false) {
    elemento.textContent = texto;
    elemento.style.color = erro ? "#f87171" : "#4ade80";
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

// ========================================
// CONTROLAR VISIBILIDADE DA INTERFACE
// ========================================

function atualizarInterface() {
    const autenticado = Boolean(token && usuarioLogado);
    const administrador = ehAdministrador();

    areaLogin.style.display =
        autenticado ? "none" : "block";

    areaUsuario.style.display =
        autenticado ? "block" : "none";

    conteudoSistema.style.display =
        autenticado ? "block" : "none";

    areaCadastro.style.display =
        administrador ? "block" : "none";

    cabecalhoAcoes.style.display =
        administrador ? "" : "none";

    areaGerenciamentoUsuarios.style.display =
        administrador ? "block" : "none";

    areaListaUsuarios.style.display =
        administrador ? "block" : "none";

    if (autenticado) {
        nomeUsuario.textContent =
            usuarioLogado.nome || usuarioLogado.email;

        perfilUsuario.textContent =
            administrador ? "Administrador" : "Operador";
    } else {
        nomeUsuario.textContent = "";
        perfilUsuario.textContent = "";
    }
}

// ========================================
// INDICADORES DE EQUIPAMENTOS
// ========================================

function atualizarIndicadores(quantidadeEncontrada) {
    totalEquipamentos.textContent =
        equipamentosCadastrados.length;

    resultadosPesquisa.textContent =
        quantidadeEncontrada;

    totalPatrimonios.textContent =
        equipamentosCadastrados.length;
}

// ========================================
// INDICADORES DE USUÁRIOS
// ========================================

function atualizarIndicadoresUsuarios() {
    totalUsuarios.textContent =
        usuariosCadastrados.length;

    totalAdministradores.textContent =
        usuariosCadastrados.filter(
            usuario => usuario.perfil === "administrador"
        ).length;

    totalOperadores.textContent =
        usuariosCadastrados.filter(
            usuario => usuario.perfil === "operador"
        ).length;
}

// ========================================
// SAIR DO SISTEMA
// ========================================

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
    mostrarMensagemLogin(aviso, Boolean(aviso));
}

// ========================================
// REQUISIÇÕES AUTENTICADAS COM JWT
// ========================================

async function requisicaoAutenticada(url, opcoes = {}) {
    if (!token) {
        throw new Error("Faça login para continuar.");
    }

    const tokenDaRequisicao = token;

    const headers = new Headers(opcoes.headers || {});

    headers.set(
        "Authorization",
        `Bearer ${tokenDaRequisicao}`
    );

    const resposta = await fetch(url, {
        ...opcoes,
        headers
    });

    if (resposta.status === 401) {
        if (token === tokenDaRequisicao) {
            sairDoSistema(
                "Sessão inválida ou expirada. Faça login novamente."
            );
        }

        throw new Error("Sessão inválida ou expirada.");
    }

    return resposta;
}

// ========================================
// LOGIN
// ========================================

formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = emailLogin.value.trim();
    const senha = senhaLogin.value;

    if (!email || !senha) {
        mostrarMensagemLogin(
            "Informe e-mail e senha.",
            true
        );
        return;
    }

    btnLogin.disabled = true;

    try {
        mostrarMensagemLogin("Verificando credenciais...");

        const resposta = await fetch(
            `${API_BASE}/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, senha })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error || "Erro ao realizar login."
            );
        }

        if (!resultado.token || !resultado.usuario) {
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

        token = resultado.token;
        usuarioLogado = resultado.usuario;

        senhaLogin.value = "";

        atualizarInterface();
        mostrarMensagemLogin("");
        mostrarMensagem("Login realizado com sucesso!");

        await carregarEquipamentos();

        if (ehAdministrador()) {
            await carregarUsuarios();
        }

    } catch (erro) {
        if (!token) {
            mostrarMensagemLogin(erro.message, true);
        } else {
            mostrarMensagem(erro.message, true);
        }
    } finally {
        btnLogin.disabled = false;
    }
});

// ========================================
// BOTÃO SAIR
// ========================================

btnSair.addEventListener("click", () => {
    sairDoSistema();
});

// ========================================
// EXIBIR EQUIPAMENTOS
// ========================================

function exibirEquipamentos(equipamentos) {
    listaEquipamentos.replaceChildren();

    semResultados.style.display =
        equipamentos.length === 0 ? "block" : "none";

    const administrador = ehAdministrador();

    equipamentos.forEach(equipamento => {
        const linha = document.createElement("tr");

        const colunaId = document.createElement("td");
        colunaId.textContent = equipamento.id;

        const colunaNome = document.createElement("td");
        colunaNome.textContent = equipamento.nome;

        const colunaPatrimonio = document.createElement("td");
        colunaPatrimonio.textContent = equipamento.patrimonio;

        linha.appendChild(colunaId);
        linha.appendChild(colunaNome);
        linha.appendChild(colunaPatrimonio);

        if (administrador) {
            const colunaAcoes = document.createElement("td");

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar";

            botaoEditar.addEventListener("click", () => {
                editarEquipamento(equipamento);
            });

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.style.marginLeft = "8px";
            botaoExcluir.style.background = "#dc2626";

            botaoExcluir.addEventListener("click", () => {
                excluirEquipamento(equipamento.patrimonio);
            });

            colunaAcoes.appendChild(botaoEditar);
            colunaAcoes.appendChild(botaoExcluir);

            linha.appendChild(colunaAcoes);
        }

        listaEquipamentos.appendChild(linha);
    });

    atualizarIndicadores(equipamentos.length);
}

// ========================================
// CARREGAR EQUIPAMENTOS
// ========================================

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

        if (token !== tokenDaConsulta) return;

        equipamentosCadastrados = dados;
        filtrarEquipamentos();

    } catch (erro) {
        if (token === tokenDaConsulta) {
            mostrarMensagem(erro.message, true);
        }
    }
}

// ========================================
// PESQUISAR EQUIPAMENTOS
// ========================================

function filtrarEquipamentos() {
    const termo = pesquisa.value.trim().toLowerCase();

    const resultado = equipamentosCadastrados.filter(
        equipamento =>
            equipamento.nome.toLowerCase().includes(termo) ||
            equipamento.patrimonio.toLowerCase().includes(termo)
    );

    exibirEquipamentos(resultado);
}

pesquisa.addEventListener("input", filtrarEquipamentos);

// ========================================
// EXPORTAR EQUIPAMENTOS EM CSV
// ========================================

function exportarExcel() {
    if (!token) {
        mostrarMensagem(
            "Faça login para exportar.",
            true
        );
        return;
    }

    const termo = pesquisa.value.trim().toLowerCase();

    const filtrados = equipamentosCadastrados.filter(
        equipamento =>
            equipamento.nome.toLowerCase().includes(termo) ||
            equipamento.patrimonio.toLowerCase().includes(termo)
    );

    if (filtrados.length === 0) {
        mostrarMensagem(
            "Não existem equipamentos para exportar.",
            true
        );
        return;
    }

    const linhas = [
        ["ID", "Equipamento", "Patrimônio"],
        ...filtrados.map(equipamento => [
            equipamento.id,
            equipamento.nome,
            equipamento.patrimonio
        ])
    ];

    function valorSeguroCSV(valor) {
        let texto = String(valor ?? "");

        if (/^\s*[=+\-@\t\r\n]/.test(texto)) {
            texto = "'" + texto;
        }

        return `"${texto.replace(/"/g, '""')}"`;
    }

    const conteudo = linhas
        .map(linha =>
            linha.map(valorSeguroCSV).join(";")
        )
        .join("\r\n");

    const arquivo = new Blob(
        ["\uFEFF" + conteudo],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio_equipamentos.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    mostrarMensagem(
        "Relatório exportado com sucesso!"
    );
}

botaoExportar.addEventListener(
    "click",
    exportarExcel
);

// ========================================
// CADASTRAR EQUIPAMENTO
// ========================================

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!verificarPermissaoAdministrador()) return;

    const equipamento = {
        nome: campoNome.value.trim(),
        patrimonio: campoPatrimonio.value.trim()
    };

    if (!equipamento.nome || !equipamento.patrimonio) {
        mostrarMensagem(
            "Nome e patrimônio são obrigatórios.",
            true
        );
        return;
    }

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
                "Erro ao cadastrar equipamento"
            );
        }

        formulario.reset();
        await carregarEquipamentos();

        mostrarMensagem(
            "Equipamento cadastrado com sucesso!"
        );

    } catch (erro) {
        if (token) {
            mostrarMensagem(erro.message, true);
        }
    }
});

// ========================================
// EDITAR EQUIPAMENTO
// ========================================

async function editarEquipamento(equipamento) {
    if (!verificarPermissaoAdministrador()) return;

    const novoNome = prompt(
        "Digite o novo nome do equipamento:",
        equipamento.nome
    );

    if (novoNome === null) return;

    if (
        !novoNome.trim() ||
        novoNome.trim().length > 100
    ) {
        mostrarMensagem(
            "Informe um nome entre 1 e 100 caracteres.",
            true
        );
        return;
    }

    try {
        const resposta = await requisicaoAutenticada(
            `${API_URL}/${encodeURIComponent(equipamento.patrimonio)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: novoNome.trim()
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.error ||
                "Erro ao editar equipamento"
            );
        }

        await carregarEquipamentos();

        mostrarMensagem(
            "Equipamento atualizado com sucesso!"
        );

    } catch (erro) {
        if (token) {
            mostrarMensagem(erro.message, true);
        }
    }
}

// ========================================
// EXCLUIR EQUIPAMENTO
// ========================================

async function excluirEquipamento(patrimonio) {
    if (!verificarPermissaoAdministrador()) return;

    const confirmar = confirm(
        `Deseja realmente excluir o equipamento ${patrimonio}?`
    );

    if (!confirmar) return;

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
                "Erro ao excluir equipamento"
            );
        }

        await carregarEquipamentos();

        mostrarMensagem(
            "Equipamento excluído com sucesso!"
        );

    } catch (erro) {
        if (token) {
            mostrarMensagem(erro.message, true);
        }
    }
}

// ========================================
// EXIBIR USUÁRIOS
// ========================================

function exibirUsuarios(usuarios) {
    listaUsuarios.replaceChildren();

    semUsuarios.style.display =
        usuarios.length === 0 ? "block" : "none";

    usuarios.forEach(usuario => {
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

        // NOVA COLUNA DE AÇÕES
        const colunaAcoes = document.createElement("td");

        const botaoAlterar = document.createElement("button");
        botaoAlterar.type = "button";
        botaoAlterar.textContent = "Alterar perfil";

        botaoAlterar.addEventListener("click", () => {
            alterarPerfilUsuario(usuario);
        });

        colunaAcoes.appendChild(botaoAlterar);

        linha.appendChild(colunaId);
        linha.appendChild(colunaNome);
        linha.appendChild(colunaEmail);
        linha.appendChild(colunaPerfil);
        linha.appendChild(colunaData);
        linha.appendChild(colunaAcoes);

        listaUsuarios.appendChild(linha);
    });
}

// ========================================
// PESQUISAR USUÁRIOS
// ========================================

function filtrarUsuarios() {
    if (!ehAdministrador()) return;

    const termo = pesquisaUsuarios.value
        .trim()
        .toLowerCase();

    const filtrados = usuariosCadastrados.filter(
        usuario =>
            usuario.nome.toLowerCase().includes(termo) ||
            usuario.email.toLowerCase().includes(termo)
    );

    exibirUsuarios(filtrados);
}

pesquisaUsuarios.addEventListener(
    "input",
    filtrarUsuarios
);

// ========================================
// CARREGAR USUÁRIOS
// ========================================

async function carregarUsuarios() {
    if (!ehAdministrador()) return;

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
            mostrarMensagemUsuarios(erro.message, true);
        }
    }
}

// ========================================
// CADASTRAR NOVO USUÁRIO
// ========================================

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

        if (nome.length > 100 || email.length > 150) {
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

        try {
            mostrarMensagemUsuarios(
                "Cadastrando usuário..."
            );

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

// ========================================
// NOVA FUNÇÃO - ALTERAR PERFIL
// ========================================

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
        `Deseja alterar o perfil do usuário "${usuario.nome}" para ${nomePerfil}?`
    );

    if (!confirmar) return;

    mostrarMensagemPerfil("Atualizando perfil...");

    try {
        const resposta = await requisicaoAutenticada(
            `${USUARIOS_URL}/${encodeURIComponent(usuario.id)}/perfil`,
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

        // Se o administrador alterar o próprio perfil,
        // atualizamos a sessão visualmente.
        if (
            Number(usuario.id) ===
            Number(usuarioLogado?.id)
        ) {
            usuarioLogado.perfil = resultado.usuario.perfil;

            atualizarInterface();

            if (!ehAdministrador()) {
                usuariosCadastrados = [];
                listaUsuarios.replaceChildren();
                atualizarIndicadoresUsuarios();
                filtrarEquipamentos();

                mostrarMensagem(
                    "Seu perfil foi alterado. Suas permissões foram atualizadas."
                );

                return;
            }
        }

        await carregarUsuarios();

        mostrarMensagemPerfil(
            "Perfil atualizado com sucesso!"
        );

    } catch (erro) {
        if (!token) return;

        mostrarMensagemPerfil(erro.message, true);

        // Se houver conflito, atualizar os dados da tabela.
        await carregarUsuarios();
    }
}

// ========================================
// ATUALIZAR LISTA DE USUÁRIOS
// ========================================

btnAtualizarUsuarios.addEventListener(
    "click",
    async () => {
        if (!ehAdministrador()) return;

        await carregarUsuarios();
    }
);

// ========================================
// INICIAR APLICAÇÃO
// ========================================

atualizarIndicadores(0);
atualizarIndicadoresUsuarios();
atualizarInterface();
