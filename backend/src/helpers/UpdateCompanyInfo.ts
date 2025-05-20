import cron from "node-cron";
import UpdateCompanyFolders from "../helpers/GetFolderInfo";

const startScheduler = async () => {
  console.log("Executando verificação para atualização de pastas...");

  // Executa verificação quando inicia a aplicação
  await UpdateCompanyFolders();

  // Verificar a cada 30 minutos pastas e arquivos
  cron.schedule("*/30 * * * *", async () => {
    console.log("Executando verificação agendada para atualização de pastas...");
    await UpdateCompanyFolders();
    console.log("Verificação concluída.");
  });

  console.log("Verificação de atualização agendada para verificar a cada 30 minutos.");
};

export default startScheduler;
