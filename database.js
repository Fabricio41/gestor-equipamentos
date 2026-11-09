require("dotenv").config();

const {Pool} = require("pg");

if (!process.env.DB_PASSWORD) {
    throw new Error("A variável de ambiente DB_PASSWORD não foi configurada no arquivo .env");
}

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port:Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "ro-digital-treinamento",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,

    //Encerrar conexoes que ficam sem atividade por muito tempo

    idleTimeoutMillis: 30000, // 30 segundos

    //Limitar quantidade de conexões simultâneas

    max: 10, // 10 conexões simultâneas

    connectionTimeoutMillis: 5000, // 5 segundos
});

pool.on("error", (err) => {
    console.error("Erro inesperado no pool PostgreSQL:", err.message);
});

module.exports = pool;