const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const SPOTIFY_USERNAME=process.env.SPOTIFY_USERNAME;
const SPOTIFY_PASSWORD=process.env.SPOTIFY_PASSWORD;

var scopes = ['user-read-private', 'user-read-email', 'playlist-modify-private', 'playlist-modify-public'],
  redirectUri = 'https://d8e6f7e4.ngrok.io/test',
  clientId = process.env.SPOTIFY_CLIENT_ID,
  state = 'peice-of-shit';

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
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
	response.render('host.ejs');
});

app.get('/hostLink', async function(request, response) {
  try {
    var authorizeURL = await spotifyApi.createAuthorizeURL(scopes, state);
    console.log(authorizeURL);
    response.json(authorizeURL);
		// response.redirect(authorizeURL);
  } catch(error) {
    console.log(error);
  }
});

app.get('/hostAuth', async function(request, response) {
  try {
    const code = request.query.code;
    console.log(code);
    const token = await spotifyApi.authorizationCodeGrant(code);
    await spotifyApi.setAccessToken(token.body['access_token']);
    await spotifyApi.setRefreshToken(token.body['refresh_token']);
   // const user = await spotifyApi.getMe();
   // console.log(JSON.stringify(user));
    // await spotifyApi.createPlaylist('dlawogus', 'Groupify', { 'public' : false });

  } catch(error) {
    console.log(error);
  }
});

app.post('/addToQueue', async function(req, res) {
  try {
    const token = await spotifyApi.refreshAccessToken();
    await spotifyApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyApi.getMe();
    const playlist = await spotifyApi.getUserPlaylists(userId.body.id);
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify') {
          console.log(userId.body.id);
          console.log(list.id);
          console.log(req.body.trackId);
          await spotifyApi.addTracksToPlaylist('dlawogus', '7hSMILGnwx33Jv2bS7avp6', ["spotify:track:" + req.body.trackId])
          res.json(200);
          // await spotifyApi.addTracksToPlaylist(userId.body.id, list.id, ["spotify:track:" + req.body.trackId]);
        }
      } catch(error) {
        console.log(error);
      }
    });


    //await spotifyApi.addTracksToPlaylist('dlawogus', 'Groupify', "spotify:track:" + req);
    //console.log('Added track to playlist!');
  } catch(error) {
    console.log(error);
  }
});

const server = app.listen(8000, function() {
  console.log('groupify host server listening on port 8000');
});
