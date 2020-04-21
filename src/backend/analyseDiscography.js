const fs = require('fs')
const moment = require('moment')
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
  },
  pitchClasses: [
    ['Am', 'C'],
    ['Bbm', 'C#/Db'],
    ['Bm', 'D'],
    ['Cm', 'Eb'],
    ['C#m', 'E'],
    ['Dm', 'F'],
    ['D#/Ebm', 'F#/Gb'],
    ['Em', 'G'],
    ['Fm', 'Ab'],
    ['F#m', 'A'],
    ['Gm', 'Bb'],
    ['G#m', 'B/Cb']
  ],
  tonality: ['Minor', 'Major']
}

const models = {
  album: albumModel,
  artist: artistModel,
  track: trackModel
}

const artist = process.env.ARTIST

const getDistribution = (total, item, index, array) => {
  const newTotal = Object.assign({}, total, {
    [item]: total[item] === undefined ? 1 : total[item] + 1
  })
  return index + 1 === array.length
    ? Object.keys(newTotal).reduce((keys, key) => {
        return Object.assign({}, keys, {
          [key]: {
            count: newTotal[key],
            percentage: (newTotal[key] / array.length) * 100
          }
        })
      }, {})
    : newTotal
}

const getMostCommon = values => (total, item, index, array) => {
  const value = values[item]
  if (value.count > total.count) {
    return { ...value, value: item }
  } else if (item.count === total.count) {
    return { ...value, value: item }
  } else return total
}

const printDistribution = (object, array) => {
  const printString = Object.keys(object)
    .map(key => ({ ...object[key], key }))
    .sort((a, b) => b.count - a.count)
    .map(
      object =>
        `${array ? array[object.key] : object.key} (${object.percentage.toFixed(
          2
        )}%)`
    )
    .join(', ')
  console.log(printString)
}

const run = async ({
  Sequelize,
  artist,
  constants,
  fs,
  getDistribution,
  getMostCommon,
  models,
  moment,
  path,
  printDistribution
}) => {
  const sequelize = new Sequelize(
    constants.db.database,
    constants.db.username,
    constants.db.password,
    {
      host: constants.db.host,
      dialect: 'postgres',
      logging: false
    }
  )
  try {
    const Album = models.album(sequelize, Sequelize.DataTypes)
    const Artist = models.artist(sequelize, Sequelize.DataTypes)
    const Track = models.track(sequelize, Sequelize.DataTypes)
    Album.associate(sequelize.models)
    Artist.associate(sequelize.models)
    Track.associate(sequelize.models)

    const artistFile = await fs.readFileSync(
      path.join(constants.data.directory.artist, `${artist}.json`),
      'utf8'
    )
    const artistJSON = JSON.parse(artistFile)
    const artistId = artistJSON.id

    const artistRecords = await Artist.findAll({ where: { artistId } })
    const artistData = artistRecords[0]

    console.log(artistData.name)

    const artistTracks = await Track.findAll({ where: { artistId } })
    const analysis = artistTracks.reduce(
      (totals, track, index, array) => {
        const newTotals = {
          danceability: totals.danceability + track.danceability,
          energy: totals.energy + track.energy,
          key: totals.key.concat(track.key),
          loudness: totals.loudness + track.loudness,
          mode: totals.mode.concat(track.mode),
          speechiness: totals.speechiness + track.speechiness,
          acousticness: totals.acousticness + track.acousticness,
          instrumentalness: totals.instrumentalness + track.instrumentalness,
          liveness: totals.liveness + track.liveness,
          valence: totals.valence + track.valence,
          tempo: totals.tempo + track.tempo,
          duration: totals.duration + track.duration,
          timeSignature: totals.timeSignature.concat(track.timeSignature),
          keyName: totals.keyName.concat(track.keyName)
        }
        if (index + 1 === array.length) {
          const length = array.length
          return {
            danceability: newTotals.danceability / length,
            energy: newTotals.danceability / length,
            key: totals.key.reduce(getDistribution, {}),
            loudness: newTotals.loudness / length,
            mode: totals.mode.reduce(getDistribution, {}),
            speechiness: newTotals.speechiness / length,
            acousticness: newTotals.acousticness / length,
            instrumentalness: newTotals.instrumentalness / length,
            liveness: newTotals.liveness / length,
            valence: newTotals.valence / length,
            tempo: newTotals.tempo / length,
            duration: newTotals.duration / length,
            timeSignature: totals.timeSignature.reduce(getDistribution, {}),
            keyName: totals.keyName.reduce(getDistribution, {})
          }
        } else {
          return newTotals
        }
      },
      {
        danceability: 0.0,
        energy: 0.0,
        key: [],
        loudness: 0.0,
        mode: [],
        speechiness: 0.0,
        acousticness: 0.0,
        instrumentalness: 0.0,
        liveness: 0.0,
        valence: 0.0,
        tempo: 0.0,
        duration: 0.0,
        timeSignature: [],
        keyName: []
      }
    )

    const mostCommonKey = Object.keys(analysis.key).reduce(
      getMostCommon(analysis.key),
      { count: 0 }
    )
    const mostCommonMode = Object.keys(analysis.mode).reduce(
      getMostCommon(analysis.mode),
      { count: 0 }
    )
    const mostCommonAverageKey =
      constants.pitchClasses[mostCommonKey.value][mostCommonMode.value]
    const mostCommonTimeSignature = Object.keys(analysis.timeSignature).reduce(
      getMostCommon(analysis.timeSignature),
      {
        count: 0
      }
    )
    const mostCommonAbsoluteKey = Object.keys(analysis.keyName).reduce(
      getMostCommon(analysis.keyName),
      {
        count: 0
      }
    )

    console.log(`Average Danceability: ${analysis.danceability}`)
    console.log(`Average Energy: ${analysis.energy}`)
    console.log(`Average Loudness: ${analysis.loudness}`)
    console.log(`Average Speechiness: ${analysis.speechiness}`)
    console.log(`Average Acousticness: ${analysis.acousticness}`)
    console.log(`Average Instrumentalness: ${analysis.instrumentalness}`)
    console.log(`Average Liveness: ${analysis.liveness}`)
    console.log(`Average Valence: ${analysis.valence}`)
    console.log(`Average Tempo: ${analysis.tempo}`)
    console.log(
      `Average Duration: ${analysis.duration} (ISO 8601: ${moment
        .duration(analysis.duration)
        .toISOString()})`
    )
    console.log(
      `Most common key: ${mostCommonKey.value} (${constants.pitchClasses[
        mostCommonKey.value
      ].join(' / ')})`
    )
    console.log(`Key distribution: `)
    printDistribution(
      analysis.key,
      constants.pitchClasses.map(pitchClass => pitchClass.join(' / '))
    )
    console.log(
      `Most common mode (tonality): ${mostCommonMode.value} (${
        constants.tonality[mostCommonMode.value]
      })`
    )
    console.log(`Tonality distribution: `)
    printDistribution(analysis.mode, constants.tonality)
    console.log(
      `Most common average key (based on most common key and mode): ${mostCommonAverageKey}`
    )
    console.log(`Most common absolute key: ${mostCommonAbsoluteKey.value}`)
    console.log(`Absolute key distribution: `)
    printDistribution(analysis.keyName)
    console.log(`Most common time signature: ${mostCommonTimeSignature.value}`)
    console.log(`Time signature distribution: `)
    printDistribution(analysis.timeSignature)
  } catch (error) {
    console.log(error)
  } finally {
    sequelize.close()
  }
}

run({
  Sequelize,
  artist,
  constants,
  fs,
  getDistribution,
  getMostCommon,
  models,
  moment,
  path,
  printDistribution
})
