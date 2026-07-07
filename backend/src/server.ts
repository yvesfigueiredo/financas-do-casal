import app from "./app";
import { config } from "./config/env";
import prisma from "./database/prisma";

async function main() {
  // Verifica a conexão com o banco antes de iniciar
  try {
    await prisma.$connect();
    console.log("✅ Banco de dados conectado");
  } catch (error) {
    console.error("❌ Falha ao conectar ao banco de dados:", error);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${config.port}`);
    console.log(`📊 Ambiente: ${config.env}`);
    console.log(`🌐 Frontend permitido: ${config.frontendUrl}`);
    console.log(`💚 Health check: http://localhost:${config.port}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  Recebido sinal ${signal}. Encerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("✅ Servidor encerrado com sucesso");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("❌ Erro fatal ao iniciar servidor:", error);
  process.exit(1);
});
