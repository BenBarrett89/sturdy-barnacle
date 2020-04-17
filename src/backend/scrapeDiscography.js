const axios = require('axios')
const fs = require('fs')
const path = require('path')
const rateLimit = require('axios-rate-limit')

const initGetFromSpotify = require('./helpers/getFromSpotify')

require('dotenv').config()

const artist = process.env.ARTIST
const accessToken = process.env.SPOTIFY_ACCESS_TOKEN

const constants = {
  albums: {
    batchSize: 20
  },
  artists: {
    batchSize: 50,
    params: { include_groups: 'album,single', limit: 50 }
  },
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
  const artistDirectory = path.join(dataDirectory, '/artist')

  try {
    await fs.mkdirSync(artistDirectory)
    console.log(`${artistDirectory} created`)
  } catch (error) {
    console.log(`${artistDirectory} already exists`)
  }

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

  await fs.writeFileSync(
    path.join(artistDirectory, `${artist}.json`),
    JSON.stringify(searchedArtist, undefined, 2),
    'utf8'
  )

  console.log(
    `Retrieving the discography for ${searchedArtist.name} (${searchedArtist.id})`
  )
  const albumsResponse = await getFromSpotify(
    `artists/${searchedArtist.id}/albums`,
    {
      params: constants.artists.params
    }
  )

  const initialAlbumsResponse = albumsResponse.data

  let albums = initialAlbumsResponse.items
  if (initialAlbumsResponse.total > initialAlbumsResponse.limit) {
    console.log(
      `More requests required as the total is ${initialAlbumsResponse.total} (limit is ${initialAlbumsResponse.limit})`
    )
    const numberOfBatches = Math.ceil(
      (initialAlbumsResponse.total - initialAlbumsResponse.limit) /
        constants.artists.batchSize
    )

    console.log(`${numberOfBatches} more requests required`)
    const batches = Array.from({ length: numberOfBatches }, (_, index) => {
      return Object.assign({}, constants.artists.params, {
        offset: (index + 1) * constants.artists.batchSize
      })
    })

    const albumsResponses = await Promise.all(
      batches.map(async batch => {
        const response = await getFromSpotify(
          `artists/${searchedArtist.id}/albums`,
          {
            params: batch
          }
        )
        return response.data
      })
    )

    albumsResponses.forEach(response => {
      albums = albums.concat(response.items)
    })
  }
  console.log(
    `Found ${albums.length} albums for ${searchedArtist.name} (${searchedArtist.id})`
  )

  const artistAlbumsDirectory = path.join(dataDirectory, '/artistAlbums')

  try {
    await fs.mkdirSync(artistAlbumsDirectory)
    console.log(`${artistAlbumsDirectory} created`)
  } catch (error) {
    console.log(`${artistAlbumsDirectory} already exists`)
  } finally {
    console.log(`\n`)
  }

  await fs.writeFileSync(
    path.join(artistAlbumsDirectory, `${artist}.json`),
    JSON.stringify(albums, undefined, 2),
    'utf8'
  )

  const artistAlbumTracksDirectory = path.join(dataDirectory, '/albumTracks')

  try {
    await fs.mkdirSync(artistAlbumTracksDirectory)
    console.log(`${artistAlbumTracksDirectory} created`)
  } catch (error) {
    console.log(`${artistAlbumTracksDirectory} already exists`)
  }

  const artistAlbumTracksArtistDirectory = path.join(
    artistAlbumTracksDirectory,
    artist
  )

  try {
    await fs.mkdirSync(artistAlbumTracksArtistDirectory)
    console.log(`${artistAlbumTracksArtistDirectory} created`)
  } catch (error) {
    console.log(`${artistAlbumTracksArtistDirectory} already exists`)
  } finally {
    console.log(`\n`)
  }

  const albumIds = albums.map(album => album.id)
  const albumIdsBatches = albumIds.reduce(
    (sum, albumId, index, array) => {
      if (array.length - 1 === index) {
        // Final item, clear up for return
        const finalBatches =
          sum.current.length === constants.albums.batchSize
            ? [sum.current.join(','), albumId]
            : [sum.current.concat(albumId).join(',')]
        return sum.batches.concat(finalBatches)
      }
      if (sum.current.length === constants.albums.batchSize) {
        // Batch is complete
        return {
          batches: sum.batches.concat(sum.current.join(',')),
          current: [albumId]
        }
      } else {
        // Batch is not yet complete
        return {
          batches: sum.batches,
          current: sum.current.concat(albumId)
        }
      }
    },
    {
      batches: [],
      current: []
    }
  )

  const albumResponses = await Promise.all(
    albumIdsBatches.map(async (batch, index) => {
      const response = await getFromSpotify(`albums`, {
        params: { ids: batch }
      })
      return response.data
    })
  )

  const albumTracks = albumResponses.reduce((sum, response) => {
    return sum.concat(response.albums)
  }, [])

  const writeAlbumTracks = await Promise.all(
    albumTracks.map(async album => {
      const albumName = album.name
        .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ' ')
        .replace(/\s+/g, '+')
      const fileName = `${album.id}-${albumName}.json`
      await fs.writeFileSync(
        path.join(artistAlbumTracksArtistDirectory, fileName),
        JSON.stringify(album, undefined, 2),
        'utf8'
      )
    })
  )
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
  path,
  rateLimit
})
