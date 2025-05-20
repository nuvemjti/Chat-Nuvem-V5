import { Sequelize } from "sequelize-typescript";
import User from "./User";
import Company from "./Company";
import Captacao from "./Captacao";
import CaptacaoItens from "./CaptacaoItens";
import Plantao from "./Plantao";

// ... outros imports

const sequelize = new Sequelize({
  // ... configurações do banco
});

sequelize.addModels([
  User,
  Company,
  Captacao,
  CaptacaoItens,
  Plantao,
  // ... outros models
]);

export default sequelize; 