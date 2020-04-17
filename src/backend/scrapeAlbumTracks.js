const axios = require('axios')
const fs = require('fs')
const path = require('path')
const rateLimit = require('axios-rate-limit')

const initGetFromSpotify = require('./helpers/getFromSpotify')

require('dotenv').config()

const album = process.env.ALBUM
const artist = process.env.ARTIST
const accessToken = process.env.SPOTIFY_ACCESS_TOKEN

const constants = {
  baseURL: 'https://api.spotify.com/v1/',
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
  rateLimitingOptions: {
    maxRequests: 2,
    perMilliseconds: 1000,
    maxRPS: 2
  }
}

const run = async ({
  accessToken,
  album,
  artist,
  axios,
  constants,
  fs,
  init,
  path,
  rateLimit
}) => {
  const api = rateLimit(
    axios.create({
      baseURL: constants.baseURL,
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    constants.rateLimitingOptions
  )
  api.getMaxRPS()
  const getFromSpotify = init.initGetFromSpotify(api)

  const dataDirectory = path.join(__dirname, '..', '/data')
  const tracksDirectory = path.join(dataDirectory, '/tracks')

  try {
    await fs.mkdirSync(tracksDirectory)
    console.log(`${tracksDirectory} created`)
  } catch (error) {
    console.log(`${tracksDirectory} already exists`)
  }

  const artistDirectory = path.join(tracksDirectory, `/${artist}`)

  try {
    await fs.mkdirSync(artistDirectory)
    console.log(`${artistDirectory} created`)
  } catch (error) {
    console.log(`${artistDirectory} already exists`)
  }

  const artistAlbumTracksDirectory = path.join(
    dataDirectory,
    `/albumTracks/${artist}`
  )

  const directoryContents = await fs.readdirSync(artistAlbumTracksDirectory)

  let albumId = album
  let file = directoryContents[0]
  if (!albumId) {
    // Get the next un-scraped album
    console.log(`Retrieving the next un-scraped album`)
    try {
      const artistDirectoryContents = await fs.readdirSync(artistDirectory)

      file = directoryContents.find(file => {
        return !artistDirectoryContents.some(directory => {
          return file.includes(directory)
        })
      })
      if (!file) throw Error()
    } catch (error) {
      // If any errors are thrown, just get the first album ID
      file = directoryContents[0]
    } finally {
      albumId = file.substring(0, file.indexOf('-'))
      console.log(`Album ID to be scraped is ${albumId}`)
    }
  }

  const albumFile = directoryContents.find(file => file.startsWith(albumId))
  const albumName = albumFile.substring(
    albumId.length + 1,
    albumFile.indexOf('.json')
  )
  const albumDirectory = path.join(artistDirectory, `/${albumId}`)
  const albumFilePath = path.join(artistAlbumTracksDirectory, albumFile)

  const albumTracks = JSON.parse(await fs.readFileSync(albumFilePath, 'utf8'))

  const audioFeaturesDirectory = path.join(albumDirectory, '/audio-features')

  const tracks = albumTracks.tracks.items.map(track => {
    return {
      album: albumId,
      albumName,
      id: track.id,
      filepath: path.join(
        audioFeaturesDirectory,
        `${track.id}-${track.name
          .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ' ')
          .replace(/\s+/g, '+')}.json`
      ),
      name: track.name,
      track_number: track.track_number,
      features_url: `${constants.baseURL}audio-features/${track.id}`,
      uri: track.uri
    }
  })

  // TODO Batch into 100s for albums longer than 100 songs (?!)

  const trackIds = tracks
    .map(track => track.id)
    .reduce((query, trackId, index, array) => {
      return array.length - 1 === index
        ? `${query}${trackId}`
        : `${query}${trackId},`
    }, '')

  const trackFeaturesResponse = await getFromSpotify(
    `audio-features?ids=${trackIds}`
  )

  const trackFeatures = tracks.map((track, index) => {
    return Object.assign(
      track,
      trackFeaturesResponse.data.audio_features[index]
    )
  })

  try {
    await fs.mkdirSync(albumDirectory)
    console.log(`${albumDirectory} created`)
  } catch (error) {
    console.log(`${albumDirectory} already exists`)
  }

  try {
    await fs.mkdirSync(audioFeaturesDirectory)
    console.log(`${audioFeaturesDirectory} created`)
  } catch (error) {
    console.log(`${audioFeaturesDirectory} already exists`)
  }

  await Promise.all(
    trackFeatures.map(async track => {
      await fs.writeFileSync(
        track.filepath,
        JSON.stringify(
          Object.assign(track, {
            filepath: undefined,
            keyName: constants.pitchClasses[track.key][track.mode]
          }),
          undefined,
          2
        ),
        'utf8'
      )
    })
  )
}

run({
  accessToken,
  album,
  artist,
  axios,
  constants,
  fs,
  init: {
    initGetFromSpotify
  },
  path,
  rateLimit
})
