const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');

const SPOTIFY_USERNAME=process.env.SPOTIFY_USERNAME;
const SPOTIFY_PASSWORD=process.env.SPOTIFY_PASSWORD;

var scopes = ['user-read-private', 'user-read-email'],
  redirectUri = 'https://cd12824e.ngrok.io/test',
  clientId = process.env.SPOTIFY_CLIENT_ID,
  state = 'peice-of-shit';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId
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

		console.log(authorizeURL);
		response.redirect(authorizeURL);
	}
	catch(err){
		console.log(err);
	}
});

app.get('/test', async function(req, res) {
	console.log("get:" + JSON.stringify(req.body));
});

app.post('/test', async function(req, res) {
	console.log("post:" + res);
});

const server = app.listen(8000, function() {
  console.log('groupify host server listening on port 8000');
});
