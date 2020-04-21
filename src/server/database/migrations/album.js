module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Albums', {
      albumId: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      name: Sequelize.STRING,
      type: Sequelize.STRING,
      release: Sequelize.STRING,
      releasePrecision: Sequelize.STRING,
      images: Sequelize.JSONB,
      artistId: {
        type: Sequelize.STRING,
        reference: {
          model: 'Artist',
          key: 'artistId'
        }
      },
      tracks: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        reference: {
          model: 'Track',
          key: 'trackId'
        }
      }
    })
  },

  down: queryInterface => {
    return queryInterface.dropTable('Album')
  }
}
