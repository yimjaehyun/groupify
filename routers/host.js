const SpotifyWebApi = require('spotify-web-api-node');
const randomWords = require('random-words');
const bodyParser = require('body-parser');
const express = require('express');

const scopes = ['user-read-private',
                'user-read-email',
                'playlist-modify-private',
                'playlist-modify-public',
                'user-modify-playback-state',
                'streaming',
                'user-read-birthdate',
                'user-read-playback-state'];
const state = 'state';
//https://github.com/spotify/web-api/issues/537
var map = {};
var accessTokens = {};
var users = {};
var votes = {};
var duplicates = {};
var firstPlay = {};

// http://localhost:8000/host
var spotifyApi = new SpotifyWebApi({
  redirectUri: 'https://dc9805c9.ngrok.io/host', // TODO share updated map with join so join can call add to queue with specific spotify obj
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

      // Checks if Groupify playlist exists
      const userId = await spotifyApi.getMe();
      const playlists = await spotifyApi.getUserPlaylists(userId.body.id);
      var found = false
      var playlistId = '';
      playlists.body.items.forEach(function(list) {
          if(list.name === 'Groupify') {
            playlistId = list.id;
            found = true;
          }
      });
      // not found create, else delete every song in playlist
      if (!found) {
        await spotifyApi.createPlaylist((await spotifyApi.getMe()).body.id, 'Groupify', { 'public' : true });
      } else {
        const songs = await spotifyApi.getPlaylistTracks(userId.body.id, playlistId);
        songs.body.items.forEach(async function(song) {
          try{
            await spotifyApi.removeTracksFromPlaylist(userId.body.id, playlistId, [{uri : song.track.uri}]);
          } catch(err) {
            console.log(err)
          }
        })
      }
      map[roomId] = spotifyApi;
      users[roomId] = 0;
      votes[roomId] = 0;
      duplicates[roomId] = false;
      accessTokens[roomId] = token.body['access_token'];
      firstPlay[roomId] = false;
    }
    response.render('host.ejs', {'roomId': roomId});
  } catch(error) {
    console.log(error);
  }
});

/**
@param {roomId: 'string'}
returns {accessToken: 'string'}
**/
router.post('/accessToken', async function(request, response) {
  try {
    response.json(accessTokens[request.body.roomId]);
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

var testDevice;
var testUser;
var testList;
router.post('/play', async function(request, response) {
  try {
    const spotifyUserApi = map[request.body.roomId];
    const token = await spotifyUserApi.refreshAccessToken();
    await spotifyUserApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyUserApi.getMe();
    testUser = userId;
    var playlist = await spotifyUserApi.getUserPlaylists(userId.body.id);
    const devicesList = await spotifyUserApi.getMyDevices();
    var deviceId;
    devicesList.body.devices.forEach(async function(device) {
      try {
        if(device.name === 'Groupify'){
          deviceId = device.id;
          testDevice = device.id;
        }
      } catch(error){
        console.log(error);
      }
    })
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify' && firstPlay[request.body.roomId] === false) {
          // await spotifyUserApi.transferMyPlayback({deviceIds: [deviceId]});
          testList = list;
          await spotifyUserApi.play({device_id: deviceId, context_uri: "spotify:user:" + userId.body.id + ":playlist:" + list.id});
          firstPlay[request.body.roomId] = true;
          response.json(200);
        }
        else if(list.name === 'Groupify' && firstPlay[request.body.roomId] === true) {
          await spotifyUserApi.play();
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

router.post('/getQueue', async function(request, response) {
  try {
    const spotifyUserApi = map[request.body.roomId];
    const token = await spotifyUserApi.refreshAccessToken();
    await spotifyUserApi.setAccessToken(token.body['access_token']);

    const userId = await spotifyUserApi.getMe();
    const playlists = await spotifyApi.getUserPlaylists(userId.body.id);
    var playlistId = '';
    playlists.body.items.forEach(function(list) {
        if(list.name === 'Groupify') {
          playlistId = list.id;
        }
    });

    const tracks = await spotifyUserApi.getPlaylistTracks(userId.body.id, playlistId);
    // console.log(tracks.body.items[0].track);
    response.json(tracks.body);
  } catch(error) {
    console.log(error);
  }
});

router.post('/getUserCount', async function(request, response) {
  console.log(users[request.body.roomId]);
  response.json(users[request.body.roomId]);
});

router.post('/vote', async function(request, response) {
  const roomId = request.body.roomId;
  votes[roomId]++;
  console.log(votes[roomId]);
  if(votes[roomId] >= users[roomId]/2) {
    await map[roomId].skipToNext();
    votes[roomId] = 0;
  }
  response.json(200);
});

router.post('/duplicates', async function(req, res) {
  duplicates[req.body.roomId] = req.body.duplicates;
  res.json(200);
});

router.post('/repeatOn', async function(req, res) {
  const spotifyUserApi = map[req.body.roomId];
  const token = await spotifyUserApi.refreshAccessToken();
  await spotifyUserApi.setAccessToken(token.body['access_token']);
  await spotifyUserApi.setRepeat({state: 'track'});
  res.json(200);
});

router.post('/repeatOff', async function(req, res) {
  const spotifyUserApi = map[req.body.roomId];
  const token = await spotifyUserApi.refreshAccessToken();
  await spotifyUserApi.setAccessToken(token.body['access_token']);
  await spotifyUserApi.setRepeat({state: 'off'});
  res.json(200);
});

router.post('/nextTrack', async function(req, res) {
  const spotifyUserApi = map[req.body.roomId];
  const token = await spotifyUserApi.refreshAccessToken();
  await spotifyUserApi.skipToNext();
});

router.post('/previousTrack', async function(req, res) {
  const spotifyUserApi = map[req.body.roomId];
  const token = await spotifyUserApi.refreshAccessToken();
  await spotifyUserApi.skipToPrevious();
});
module.exports = router;
module.exports.map = map;
module.exports.users = users;
module.exports.duplicates = duplicates;
