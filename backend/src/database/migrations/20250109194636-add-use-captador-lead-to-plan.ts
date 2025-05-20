import { QueryInterface, DataTypes } from 'sequelize';

export = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn('Plans', 'useCaptadorLead', {
      type: DataTypes.BOOLEAN,
      allowNull: true, // Defina como true ou false dependendo do seu caso
      defaultValue: false, // Valor padrão inicial
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('Plans', 'useCaptadorLead');
  },
};
