module.exports = (sequelize, DataTypes) => {
  const Artist = sequelize.define(
    'Artist',
    {
      artistId: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: DataTypes.STRING
      },
      name: DataTypes.STRING,
      genres: DataTypes.ARRAY(DataTypes.STRING),
      images: DataTypes.JSONB,
      popularity: DataTypes.INTEGER,
      followers: DataTypes.INTEGER
    },
    {
      timestamps: false
    }
  )

  Artist.associate = models => {
    models.Artist.hasMany(models.Album, {
      foreignKey: 'artistId',
      sourceKey: 'artistId'
    })
    models.Artist.hasMany(models.Track, {
      foreignKey: 'artistId',
      sourceKey: 'artistId'
    })
  }

  return Artist
}
