const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const SPOTIFY_USERNAME=process.env.SPOTIFY_USERNAME;
const SPOTIFY_PASSWORD=process.env.SPOTIFY_PASSWORD;

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://c0a3a2f6.ngrok.io'
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

app.post('/addToQueue', async function(request, response) {
  try {
	var scopes = ['user-read-private', 'user-read-email'],
		clientId: clientId
		redirectUri: redirectUri
	  	state = 'random-test-state-work-pls';

	var authorizeURL = await spotifyApi.createAuthorizeURL(scopes, state);

	console.log(authorizeURL);
  } catch(error) {
    console.log(error);
  }
});

const server = app.listen(8000, function() {
  console.log('groupify server listening on port 8000');
});
