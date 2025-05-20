import { DataTypes } from "sequelize";
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Captacao from "./Captacao"; // Importar a model de Captacao

@Table({ tableName: "captacao_ite", timestamps: true })
class CaptacaoItens extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataTypes.INTEGER)
  public id!: number;

  @ForeignKey(() => Captacao)
  @Column(DataTypes.INTEGER)
  public captacaoId!: number;

  @Column(DataTypes.STRING)
  public Name!: string;

  @Column(DataTypes.STRING)
  public Email!: string | null;

  @Column(DataTypes.STRING)
  public Phone!: string | null;

  @Column(DataTypes.STRING)
  public adress!: string | null;

  @CreatedAt
  @Column(DataTypes.DATE)
  public readonly createdAt!: Date;

  @UpdatedAt
  @Column(DataTypes.DATE)
  public readonly updatedAt!: Date;
  
  // Relacionamento com Captacao
  @BelongsTo(() => Captacao, {
    foreignKey: "captacaoId",
    as: "captacao", // Nome da associação
  })
  public captacao!: Captacao;
}

export default CaptacaoItens;
