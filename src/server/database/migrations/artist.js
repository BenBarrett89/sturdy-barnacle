module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Artists', {
      artistId: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      name: Sequelize.STRING,
      genres: Sequelize.ARRAY(Sequelize.STRING),
      images: Sequelize.JSONB,
      popularity: Sequelize.INTEGER,
      followers: Sequelize.INTEGER
    })
  },

  down: queryInterface => {
    return queryInterface.dropTable('Artists')
  }
}
