import { QueryInterface, DataTypes } from 'sequelize';

// This migration adds a new column 'allowKanban' to the 'Users' table
// The new column is of type STRING, cannot be null, and has a default value of "disabled"
// The 'allowKanban' column is used to control the visibility of the Kanban feature for users
// The default value is set to "disabled" to ensure that the feature is not enabled for users by default
export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Users', 'allowKanban', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "disabled"
  });
}

// This migration removes the 'allowKanban' column from the 'Users' table
export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('Users', 'allowKanban');
}
