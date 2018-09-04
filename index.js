const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const SPOTIFY_USERNAME=process.env.SPOTIFY_USERNAME;
const SPOTIFY_PASSWORD=process.env.SPOTIFY_PASSWORD;

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get('/', function(request, response, next) {
  response.render('index.ejs');
});

app.post('/searchTrack', async function(request, response) {
  const query = `${request.body.songName}`
  try {
    const token = await spotifyApi.clientCredentialsGrant();
    await spotifyApi.setAccessToken(token.body['access_token']);
    console.log('The access token is ' + token.body['access_token']);
    const searchResults = await spotifyApi.searchTracks(query);
    response.json(searchResults.body.tracks.items);
    // console.log(JSON.stringify(searchResults.body.tracks.items, null, "  "));
  } catch(err) {
    console.log(err);
  }
});

app.post('/addToQueue', async function(request, response) {
  try {
    //await spotifyApi.addTracksToPlaylist('Groupify', '76SJ1j40AUO4LXSQjfNm0m', [`spotify:track:${request.body.trackId}`]);
    const playlist = await spotifyApi.getPlaylist('Groupify', '76SJ1j40AUO4LXSQjfNm0m');
    console.log(playlist);
  } catch(error) {
    console.log(error);
  }
});

const server = app.listen(8000, function() {
  console.log('groupify server listening on port 8000');
});
