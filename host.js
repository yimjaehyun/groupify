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
  response.render('host.ejs');
});

app.post('/addToQueue', async function(request, response) {
  try {

  } catch(error) {

  }
});

const server = app.listen(8000, function() {
  console.log('groupify server listening on port 8000');
});
