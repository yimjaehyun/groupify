const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const randomWords = require('random-words');

const scopes = ['user-read-private', 'user-read-email', 'playlist-modify-private', 'playlist-modify-public', 'user-modify-playback-state'],
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

router.put('/play', async function(request, response) {
  try {
    const token = await spotifyApi.refreshAccessToken();
    await spotifyApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyApi.getMe();
    const playlist = await spotifyApi.getUserPlaylists(userId.body.id);
    let playlistId = '';
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify') {
            playlistId = list.id;
            console.log(list.name);
            console.log(playlistId);
          }
        } catch(error) {
          console.log(error);
        }
      });
    await spotifyApi.play({
      context_uri: "spotify:user:1216463089:playlist:2KTjWy2m87F28UFvfo09Wg"
    });
    response.json(200);
    } catch(error) {
      console.log(error);
  };
});

router.put('/pause', async function(request, response) {
  try{
    const token = await spotifyApi.refreshAccessToken();
    await spotifyApi.setAccessToken(token.body['access_token']);
    await spotifyApi.pause();
  } catch(error) {
    console.log(error);
  }
});

module.exports = router;
module.exports.map = map;
