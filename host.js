const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const SPOTIFY_USERNAME=process.env.SPOTIFY_USERNAME;
const SPOTIFY_PASSWORD=process.env.SPOTIFY_PASSWORD;

var scopes = ['user-read-private', 'user-read-email', 'playlist-modify-private'],
  redirectUri = 'https://d8e6f7e4.ngrok.io/test',
  clientId = process.env.SPOTIFY_CLIENT_ID,
  state = 'peice-of-shit';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
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

app.post('/', function(req, res) {
	console.log("post:" + req.body);
});

app.get('/', async function(request, response, next) {
	try {
		var authorizeURL = await spotifyApi.createAuthorizeURL(scopes, state);
		response.redirect(authorizeURL);
	}
	catch(err){
		console.log(err);
	}
});

app.get('/test', async function(req, res) {
  try {
    const code = req.query.code;
    const token = await spotifyApi.authorizationCodeGrant(code);
   // console.log('token' + JSON.stringify(token));
    await spotifyApi.setAccessToken(token.body['access_token']);
    await spotifyApi.setRefreshToken(token.body['refresh_token']); 
   // const user = await spotifyApi.getMe();
   // console.log(JSON.stringify(user));
    await spotifyApi.createPlaylist('dlawogus', 'Groupify', { 'public' : false });

  } catch(error) {
    console.log(error);
  }
});

app.post('/addToQueue', async function(req, res) {
  try{
    const token = await spotifyApi.refreshAccessToken();
    await spotifyApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyApi.getMe().body.id;
    const playlist = await spotifyApi.getUserPlaylists(userId);
    playlist.forEach(function(list) {
        if(list.body.name === 'Groupify') {
          const playlistId = list.body.id;
          break;
        }
    });
    await spotifyApi.addTracksToPlaylist(userId, playlistId, "spotify:track:" + req.body.trackId);
    

    //await spotifyApi.addTracksToPlaylist('dlawogus', 'Groupify', "spotify:track:" + req);
    //console.log('Added track to playlist!');
  } catch(error) {
    console.log(error);
  }
});

const server = app.listen(8000, function() {
  console.log('groupify host server listening on port 8000');
});
