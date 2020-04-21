# sturdy-barnacle

> Trying out the [Spotify Web API](https://developer.spotify.com/documentation/web-api/)

## Scrape data

Search for the artist

```console
https://api.spotify.com/v1/search?query=dir+en+grey&offset=0&limit=1&type=artist
```

Get the artist's albums

```console
https://api.spotify.com/v1/artists/3kNqzLmW33fQIfmZ1OfqMA/albums
```

Get the albums' tracks

```console
https://api.spotify.com/v1/albums/65Zzop9J6VPf4nRoF0RKcm/tracks
```

Get the track's overall audio features

```console
https://api.spotify.com/v1/audio-features/71VlZmg70JQoQ4ibA1nxsE
```

Get the track's detailed audio analysis

```console
https://api.spotify.com/v1/audio-analysis/71VlZmg70JQoQ4ibA1nxsE
```

## Analyse data

Tempo Averages
Tempo Violin Plots
Tempo through album
Key Averages / Frequencies - signature, major, minor
Key patterns through albums
Valence Average
Valence Violin Plots
Valence through album
Danceability Average
Danceability Violin Plots
Danceability through album
Energy Average
Energy Violin Plots
Energy through album
Loudness Average
Loudness Violin Plots
Loudness through album
Time Signature Frequencies

Generate track features based on distributions
Generate album progressions based on patterns

## Display data

Artist Analysis
Album Analysis
(Most common keys, average tempo, tempo distribution, most common time signatures, progression of features)
Album selection for analysis
Generate random based on selection (artist, album, selection)
Find track with given features (or closest) and tweak (increase/decrease features) - fuzzy matching?

## Technologies

- [Axios](https://github.com/axios/axios)
- [Sequelize](https://sequelize.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Nunjucks](https://mozilla.github.io/nunjucks/)()
- [Plotly.js](https://plotly.com/javascript/)
- [Bootstrap](https://getbootstrap.com/)
- [Rollup](http://rollupjs.org/guide/en/)
