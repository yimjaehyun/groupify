const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const SPOTIFY_USERNAME=process.env.SPOTIFY_USERNAME;
const SPOTIFY_PASSWORD=process.env.SPOTIFY_PASSWORD;

var scopes = ['user-read-private', 'user-read-email'],
  redirectUri = 'https://8e0c79e4.ngrok.io/hostAuth',
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
    console.log('token' + JSON.stringify(token));
    await spotifyApi.setAccessToken(token.body['access_token']);
    await spotifyApi.setRefreshToken(token.body['refresh_token']);
  } catch(error) {
    console.log(error);
  }
});

const server = app.listen(8000, function() {
  console.log('groupify host server listening on port 8000');
});
