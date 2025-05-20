import { QueryInterface, DataTypes } from 'sequelize';

export = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('captacao_ite', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      captacaoId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'captacao_cab', // Nome da tabela pai
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      Name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      Email: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      Phone: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      adress: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('captacao_ite');
  },
};
