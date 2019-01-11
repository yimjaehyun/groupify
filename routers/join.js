const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const Request = require('request');
const host = require('./host');

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const router = express.Router();

// Send roomId to user FrontEnd
router.get('/:roomId?', function(request, response, next) {
  response.render('join.ejs', {roomId: request.params.roomId});
});

// Verify if valid roomId
router.post('/joinRoom', async function(req, res) {
  try {
    if(host.map[req.body.roomId]) {
      host.users[req.body.roomId]++;
      res.json({success: true});
    }
    else
      res.json({success: false});
  } catch(error) {
    console.log(error);
  }
});

/**
@param {trackSearch: 'searchValue'}
**/
router.post('/searchTrack', async function(request, response) {
  const query = request.body.trackSearch
  try {
    const token = await spotifyApi.clientCredentialsGrant();
    await spotifyApi.setAccessToken(token.body['access_token']);
    const searchResults = await spotifyApi.searchTracks(query);
    response.json(searchResults.body.tracks.items);
  } catch(err) {
    console.log(err);
  }
});

/**
@param {trackId: 'exampleTrackId', roomId: 'example123'}
**/
router.post('/addToQueue', async function(request, response) {
  try {
    const spotifyUserApi = host.map[request.body.roomId];
    const token = await spotifyUserApi.refreshAccessToken();
    await spotifyUserApi.setAccessToken(token.body['access_token']);
    const userId = await spotifyUserApi.getMe();
    const playlist = await spotifyUserApi.getUserPlaylists(userId.body.id);
    const duplicate = host.duplicates[request.body.roomId];
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify') {
          // duplicates not allowed
          if(!duplicate) {
            const songs = await spotifyUserApi.getPlaylistTracks(userId.body.id, list.id);
            var found = false;
            songs.body.items.forEach(async function(song) {
              if(song.track.id == request.body.trackId)
                found = true;
            });
            if(!found) // only add if not already in playlist
              await spotifyUserApi.addTracksToPlaylist(userId.body.id, list.id, ["spotify:track:" + request.body.trackId]);
          }
          else // duplicates allowed
            await spotifyUserApi.addTracksToPlaylist(userId.body.id, list.id, ["spotify:track:" + request.body.trackId]);
          host.map[request.body.roomId] = spotifyUserApi;
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

router.post('/closeRoom', async function(request, response) {
  try {
    host.users[request.body.roomId]--;
    response.json({success: true});
  } catch(error) {
    console.log(error);
  }
});

module.exports = router;
