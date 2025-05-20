import fs from "fs/promises";
import path from "path";
import Company from "../models/Company";

// Converter tamanho para MB ou GB
function formatSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

// Função para verificar informações da pasta
async function getFolderInfo(
  folderPath: string
): Promise<{ size: number; files: number; lastUpdated: Date | null }> {
  let totalSize = 0;
  let totalFiles = 0;
  let lastUpdated = 0;

  async function calculateFolder(folder: string): Promise<void> {
    const entries = await fs.readdir(folder, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await calculateFolder(fullPath);
      } else {
        totalSize += stats.size;
        totalFiles += 1;
        if (stats.mtimeMs > lastUpdated) {
          lastUpdated = stats.mtimeMs;
        }
      }
    }
  }

  try {
    await calculateFolder(folderPath);
    return {
      size: totalSize,
      files: totalFiles,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : null
    };
  } catch (error) {
    console.error(`Erro ao acessar a pasta ${folderPath}:`, error);
    return { size: 0, files: 0, lastUpdated: null };
  }
}

// Rotina de atualização
const UpdateCompanyFolders = async () => {
  const rootFolder = path.resolve(process.cwd(), "public"); // Diretório raiz onde estão as pastas

  try {
    // Busca todas as empresas
    const companies = await Company.findAll();

    for (const company of companies) {
      const folderPath = path.join(rootFolder, `company${company.id}`); // Caminho da pasta da empresa

      try {
        await fs.access(folderPath);
      } catch {
        await fs.mkdir(folderPath, { recursive: true });
      }
      // Calcula informações da pasta
      const folderInfo = await getFolderInfo(folderPath);

      // Atualiza os dados referentes a empresa no banco
      await company.update({
        folderSize: formatSize(folderInfo.size), // Converte tamanho para MB ou GB
        numberFileFolder: folderInfo.files,
        updatedAtFolder: folderInfo.lastUpdated
          ? folderInfo.lastUpdated.toISOString().split("T")[0] // Formato YYYY-MM-DD
          : null
      });

      console.log(`Empresa ${company.id} atualizada com sucesso.`);
    }
  } catch (error) {
    console.error("Erro ao atualizar as informações das empresas:", error);
  }
};

export default UpdateCompanyFolders;
