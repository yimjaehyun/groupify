const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const Request = require('request');

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

app.use('/host', require('./routers/host'));
app.use('/join', require('./routers/join'));

app.get('/', function(request, response, next) {
  response.render('app.ejs');
});

const server = app.listen(8000, function() {
  console.log('groupify user server listening on port 8000');
});
