module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Tracks', {
      trackId: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      name: Sequelize.STRING,
      trackNumber: Sequelize.INTEGER,
      danceability: Sequelize.FLOAT,
      energy: Sequelize.FLOAT,
      key: Sequelize.INTEGER,
      loudness: Sequelize.FLOAT,
      mode: Sequelize.INTEGER,
      speechiness: Sequelize.FLOAT,
      acousticness: Sequelize.FLOAT,
      instrumentalness: Sequelize.FLOAT,
      liveness: Sequelize.FLOAT,
      valence: Sequelize.FLOAT,
      tempo: Sequelize.FLOAT,
      duration: Sequelize.INTEGER,
      timeSignature: Sequelize.INTEGER,
      keyName: Sequelize.STRING,
      artistId: {
        type: Sequelize.STRING,
        reference: {
          model: 'Artist',
          key: 'artistId'
        }
      },
      albumId: {
        type: Sequelize.STRING,
        reference: {
          model: 'Album',
          key: 'albumId'
        }
      }
    })
  },

  down: queryInterface => {
    return queryInterface.dropTable('Tracks')
  }
}
