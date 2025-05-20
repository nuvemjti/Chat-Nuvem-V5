import { QueryInterface, DataTypes } from 'sequelize';

// This migration adds a new column 'allowCampaigns' to the 'Users' table
// The new column is of type STRING, cannot be null, and has a default value of "disabled"
// The 'allowCampaigns' column is used to control the visibility of the Campaigns feature for users
// The default value is set to "disabled" to ensure that the feature is not enabled for users by default
export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('Users', 'allowCampaigns', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "disabled"
  });
}

// This migration removes the 'allowCampaigns' column from the 'Users' table
export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('Users', 'allowCampaigns');
}
