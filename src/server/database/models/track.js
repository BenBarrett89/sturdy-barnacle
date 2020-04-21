module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define(
    'Track',
    {
      trackId: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: DataTypes.STRING
      },
      name: DataTypes.STRING,
      trackNumber: DataTypes.INTEGER,
      danceability: DataTypes.FLOAT,
      energy: DataTypes.FLOAT,
      key: DataTypes.INTEGER,
      loudness: DataTypes.FLOAT,
      mode: DataTypes.INTEGER,
      speechiness: DataTypes.FLOAT,
      acousticness: DataTypes.FLOAT,
      instrumentalness: DataTypes.FLOAT,
      liveness: DataTypes.FLOAT,
      valence: DataTypes.FLOAT,
      tempo: DataTypes.FLOAT,
      duration: DataTypes.INTEGER,
      timeSignature: DataTypes.INTEGER,
      keyName: DataTypes.STRING
    },
    {
      timestamps: false
    }
  )

  Track.associate = models => {
    models.Track.belongsTo(models.Artist, {
      foreignKey: 'artistId',
      targetKey: 'artistId'
    })
    models.Track.belongsTo(models.Album, {
      foreignKey: 'albumId',
      targetKey: 'albumId'
    })
  }

  return Track
}
