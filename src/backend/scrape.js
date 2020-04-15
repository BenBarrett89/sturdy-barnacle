const axios = require('axios')
const fs = require('fs')
const rateLimit = require('axios-rate-limit')

const initGetFromSpotify = require('./helpers/getFromSpotify')

require('dotenv').config()

const artist = process.env.ARTIST
const accessToken = process.env.SPOTIFY_ACCESS_TOKEN

const constants = {
  baseURL: 'https://api.spotify.com/v1/',
  rateLimitingOptions: {
    maxRequests: 2,
    perMilliseconds: 1000,
    maxRPS: 2
  }
}

const run = async ({
  accessToken,
  artist,
  axios,
  constants,
  fs,
  init,
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

  console.log(`Searching for artist with search term ${artist}`)
  const searchResponse = await getFromSpotify('search', {
    params: { query: artist, offset: 0, limit: 1, type: 'artist' }
  })

  const searchedArtist = searchResponse.data.artists.items[0]
  console.log(
    `Found artist with name ${searchedArtist.name} and ID ${
      searchedArtist.id
    } (genres: ${searchedArtist.genres.join(', ')})\n`
  )

  console.log(
    `Retrieving the discography for ${searchedArtist.name} (${searchedArtist.id})`
  )
  const albumsResponse = await getFromSpotify(
    `artists/${searchedArtist.id}/albums`,
    {
      params: { include_groups: 'album,single', limit: 50 }
    }
  )

  const initialAlbumsResponse = albumsResponse.data
  const albums = initialAlbumsResponse.items

  console.log(
    `Found ${initialAlbumsResponse.total} albums, retrieved ${albums.length}`
  )
  // TODO Add handling for when there are > 50 albums
  console.log(`All albums retrieved\n`)

  const tracksResponses = await Promise.all(
    albums.map(async album => {
      const response = await getFromSpotify(`albums/${album.id}/tracks`, {
        limit: 50
      })
      return response.data
    })
  )

  const trackFeatures = await Promise.all(
    tracksResponses.map(async album => {
      return await Promise.all(
        album.items.map(async track => {
          const response = await api.get(`audio-features/${track.id}`)
          return response.data
        })
      )
    })
  )

  const trackFeaturesData = JSON.stringify(trackFeatures)

  fs.writeFileSync(`../data/${artist}.json`, trackFeaturesData)
}

run({
  accessToken,
  artist,
  axios,
  constants,
  fs,
  init: {
    initGetFromSpotify
  },
  rateLimit
})
