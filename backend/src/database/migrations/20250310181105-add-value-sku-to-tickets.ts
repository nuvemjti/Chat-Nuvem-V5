module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('Tickets', 'value', {
          type: Sequelize.FLOAT,
          allowNull: true
        }, { transaction: t }),
        
        queryInterface.addColumn('Tickets', 'productSku', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t })
      ]);
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('Tickets', 'value', { transaction: t }),
        queryInterface.removeColumn('Tickets', 'productSku', { transaction: t })
      ]);
    });
  }
};
