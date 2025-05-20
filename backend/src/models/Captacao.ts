import { DataTypes } from "sequelize";
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  HasMany
} from "sequelize-typescript";
import CaptacaoItens from "./CaptacaoItens"; // Importar a model de CaptacaoItens

@Table({ tableName: "captacao_cab", timestamps: true })
class Captacao extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataTypes.INTEGER)
  public id!: number;

  @Column(DataTypes.STRING)
  public state!: string;

  @Column(DataTypes.STRING)
  public city!: string;

  @Column(DataTypes.STRING)
  public segment!: string;

  @Column(DataTypes.INTEGER)
  public status!: number;

  @Column(DataTypes.INTEGER)
  public companyId!: number;

  @Column(DataTypes.INTEGER)
  public userId!: number;

  @CreatedAt
  @Column(DataTypes.DATE)
  public readonly createdAt!: Date;

  @UpdatedAt
  @Column(DataTypes.DATE)
  public readonly updatedAt!: Date;

  // Relacionamento com CaptacaoItens
  @HasMany(() => CaptacaoItens, {
    foreignKey: "captacaoId",
    as: "itens", // Nome da associação
  })
  public itens!: CaptacaoItens[];
}

export default Captacao;
