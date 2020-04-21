module.exports = (sequelize, DataTypes) => {
  const Album = sequelize.define(
    'Album',
    {
      albumId: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: DataTypes.STRING
      },
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      release: DataTypes.STRING,
      releasePrecision: DataTypes.STRING,
      images: DataTypes.JSONB
    },
    {
      timestamps: false
    }
  )

  Album.associate = models => {
    models.Album.belongsTo(models.Artist, {
      foreignKey: 'artistId',
      targetKey: 'artistId'
    })
    models.Album.hasMany(models.Track, {
      foreignKey: 'albumId',
      as: 'tracks',
      sourceKey: 'albumId'
    })
  }

  return Album
}
