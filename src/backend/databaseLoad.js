const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const albumModel = require('../server/database/models/album')
const artistModel = require('../server/database/models/artist')
const trackModel = require('../server/database/models/track')

require('dotenv').config()

const constants = {
  data: {
    directory: {
      albumTracks: path.join(__dirname, '../data/albumTracks'),
      artist: path.join(__dirname, '../data/artist'),
      artistAlbums: path.join(__dirname, '../data/artistAlbums'),
      data: path.join(__dirname, '../data'),
      tracks: path.join(__dirname, '../data/tracks')
    }
  },
  db: {
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME
  }
}

const models = {
  album: albumModel,
  artist: artistModel,
  track: trackModel
}

const run = async ({ constants, fs, models, path, Sequelize }) => {
  const sequelize = new Sequelize(
    constants.db.database,
    constants.db.username,
    constants.db.password,
    {
      host: constants.db.host,
      dialect: 'postgres'
    }
  )
  try {
    const Album = models.album(sequelize, Sequelize.DataTypes)
    const Artist = models.artist(sequelize, Sequelize.DataTypes)
    const Track = models.track(sequelize, Sequelize.DataTypes)
    Album.associate(sequelize.models)
    Artist.associate(sequelize.models)
    Track.associate(sequelize.models)

    await sequelize.sync({ force: true })

    const artistFiles = await fs
      .readdirSync(constants.data.directory.artist)
      .map(file => {
        const fileName = file.substring(0, file.indexOf('.json'))
        const filePath = path.join(constants.data.directory.artist, file)
        return { file, name: fileName, path: filePath }
      })

    const artistTransaction = await sequelize.transaction({ autocommit: false })
    const artistWrites = await Promise.all(
      artistFiles.map(async file => {
        const artistFile = await fs.readFileSync(file.path, 'utf8')
        const artistJSON = JSON.parse(artistFile)
        const artistInstance = await Artist.create(
          {
            artistId: artistJSON.id,
            name: artistJSON.name,
            genres: artistJSON.genres,
            images: artistJSON.images,
            popularity: artistJSON.popularity,
            followers: artistJSON.followers.total
          },
          { transaction: artistTransaction }
        )
        return Object.assign({}, file, { artistId: artistJSON.id })
      })
    )
    const artistCommit = await artistTransaction.commit()

    await Promise.all(
      artistWrites.map(async file => {
        const albumsTransaction = await sequelize.transaction({
          autocommit: false
        })

        const artistAlbumDirectory = path.join(
          constants.data.directory.albumTracks,
          file.name
        )

        const albumFiles = await fs.readdirSync(artistAlbumDirectory)

        await Promise.all(
          albumFiles.map(async albumFile => {
            const albumFileData = await fs.readFileSync(
              path.join(artistAlbumDirectory, albumFile),
              'utf8'
            )
            const albumJSON = JSON.parse(albumFileData)
            const albumInstance = await Album.create(
              {
                albumId: albumJSON.id,
                name: albumJSON.name,
                type: albumJSON.type,
                release: albumJSON.release_date,
                releasePrecision: albumJSON.release_date_precision,
                images: albumJSON.images,
                artistId: albumJSON.artists[0].id
              },
              { transaction: albumsTransaction }
            )
          })
        )

        const albumsCommit = await albumsTransaction.commit()
      })
    )

    await Promise.all(
      artistWrites.map(async file => {
        const artistTracksDirectory = path.join(
          constants.data.directory.tracks,
          file.name
        )

        const albumDirectories = await fs
          .readdirSync(artistTracksDirectory)
          .map(directory =>
            path.join(artistTracksDirectory, `${directory}/audio-features`)
          )

        await Promise.all(
          albumDirectories.map(async directory => {
            const trackFiles = await fs.readdirSync(directory)

            const tracksTransaction = await sequelize.transaction({
              autocommit: false
            })

            await Promise.all(
              trackFiles.map(async trackFile => {
                const trackFileData = await fs.readFileSync(
                  path.join(directory, trackFile),
                  'utf8'
                )
                const trackJSON = JSON.parse(trackFileData)
                const trackInstance = await Track.create(
                  {
                    trackId: trackJSON.id,
                    albumId: trackJSON.album,
                    artistId: file.artistId,
                    name: trackJSON.name,
                    trackNumber: trackJSON.track_number,
                    danceability: trackJSON.danceability,
                    energy: trackJSON.energy,
                    key: trackJSON.key,
                    loudness: trackJSON.loudness,
                    mode: trackJSON.mode,
                    speechiness: trackJSON.speechiness,
                    acousticness: trackJSON.acousticness,
                    instrumentalness: trackJSON.instrumentalness,
                    liveness: trackJSON.liveness,
                    valence: trackJSON.valence,
                    tempo: trackJSON.tempo,
                    duration: trackJSON.duration_ms,
                    timeSignature: trackJSON.time_signature,
                    keyName: trackJSON.keyName
                  },
                  { transaction: tracksTransaction }
                )
              })
            )

            await tracksTransaction.commit()
          })
        )
      })
    )
  } catch (error) {
    console.log(error)
  } finally {
    sequelize.close()
  }
}

run({
  constants,
  fs,
  path,
  models,
  Sequelize
})
