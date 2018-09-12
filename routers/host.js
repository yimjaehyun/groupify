const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const randomWords = require('random-words');

const scopes = ['user-read-private', 'user-read-email', 'playlist-modify-private', 'playlist-modify-public'],
  redirectUri = 'https://99918ffe.ngrok.io/host',// TODO share updated map with join so join can call add to queue with specific spotify obj
  clientId = process.env.SPOTIFY_CLIENT_ID,
  state = 'peice-of-shit';

var map = {};

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const router = express.Router();


// If redirect (has code in url), authorize and add to map
router.get('/', async function(request, response, next) {
  try {
    const roomId = `${randomWords()}${Math.floor(Math.random() * Math.floor(999))}`;
    const code = request.query.code;
    if(code) {
      const token = await spotifyApi.authorizationCodeGrant(code);
      await spotifyApi.setAccessToken(token.body['access_token']);
      await spotifyApi.setRefreshToken(token.body['refresh_token']);
      map[roomId] = spotifyApi;
    }
    response.render('host.ejs', {'roomId': roomId});
  } catch(error) {
    console.log(error);
  }
});

/**
TODO add redirect URL to whitelist on dashboard
generate and return authorizeURL
**/
router.get('/login', async function(request, response) {
  try {
    const authorizeURL = await spotifyApi.createAuthorizeURL(scopes, state);
    response.json(authorizeURL);
  } catch(error) {
    console.log(error);
  }
});

module.exports = router;
module.exports.map = map;
