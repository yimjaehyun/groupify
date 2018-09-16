const SpotifyWebApi = require('spotify-web-api-node');
const randomWords = require('random-words');
const bodyParser = require('body-parser');
const express = require('express');

const scopes = ['user-read-private',
                'user-read-email',
                'playlist-modify-private',
                'playlist-modify-public',
                'user-modify-playback-state'];
const state = 'state';

var map = {};

var spotifyApi = new SpotifyWebApi({
  redirectUri: 'https://1e32b329.ngrok.io/host', // TODO share updated map with join so join can call add to queue with specific spotify obj
  clientId: process.env.SPOTIFY_CLIENT_ID,
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
      //await spotifyApi.createPlaylist((await spotifyApi.getMe()).body.id, 'Groupify', { 'public' : true });
      map[roomId] = spotifyApi;
    }
    response.render('host.ejs', {'roomId': roomId});
  } catch(error) {
    console.log(error);
  }
});

/**
@param {object} {roomId} The host room ID
removes roomId from Map and delete playlist
**/
router.post('/closeRoom', async function(request, response) {
  try {
    const spotifyUserApi = map[request.body.roomId];
    const token = await spotifyUserApi.refreshAccessToken();
    await spotifyUserApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyUserApi.getMe();
    const playlist = await spotifyUserApi.getUserPlaylists(userId.body.id);
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify') {
          //TODO doesn't find playlist for some reason
          //await spotifyUserApi.unfollowPlaylist(list.id);
        }
      } catch(error) {
        console.log(error);
      }
    });
    await delete map[request.body.roomId];
    response.json(200);
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
    const spotifyUserApi = map[request.body.roomId];
    const token = await spotifyUserApi.refreshAccessToken();
    await spotifyUserApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyUserApi.getMe();
    const playlist = await spotifyUserApi.getUserPlaylists(userId.body.id);
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify') {
          await spotifyUserApi.play({context_uri: "spotify:user:" + userId.body.id + ":playlist:" + list.id});
          response.json(200);
        }
      } catch(error) {
        console.log(error);
      }
    });
  } catch(error) {
    console.log(error);
  }
});

router.put('/pause', async function(request, response) {
  try{
    const spotifyUserApi = map[request.body.roomId];
    const token = await spotifyUserApi.refreshAccessToken();
    await spotifyUserApi.setAccessToken(token.body['access_token']);
    await spotifyUserApi.pause();
  } catch(error) {
    console.log(error);
  }
});

module.exports = router;
module.exports.map = map;
