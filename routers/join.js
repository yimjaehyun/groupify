const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const Request = require('request');
const map = require('./host');

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const router = express.Router();

router.get('/:roomId?', function(request, response, next) {
  console.log(request.params.roomId);
  response.render('join.ejs', {roomId: request.params.roomId});
});

router.post('/joinRoom', async function(req, res) {
  try {
    if(map.map[req.body.roomId])
      res.json({success: true});
    else
      res.json({success: false});
  } catch(error) {
    console.log(error);
  }
});

router.post('/searchTrack', async function(request, response) {
  const query = `${request.body.trackSearch}`
  try {
    const token = await spotifyApi.clientCredentialsGrant();
    await spotifyApi.setAccessToken(token.body['access_token']);
    const searchResults = await spotifyApi.searchTracks(query);
    response.json(searchResults.body.tracks.items);
  } catch(err) {
    console.log(err);
  }
});

router.post('/addToQueue', async function(request, response) {
  try {
    const userSpotifyApi = map.map[request.body.roomId];
    const token = await userSpotifyApi.refreshAccessToken();
    await userSpotifyApi.setAccessToken(token.body['access_token']);
    const userId = await userSpotifyApi.getMe();
    const playlist = await userSpotifyApi.getUserPlaylists(userId.body.id);
    playlist.body.items.forEach(async function(list) {
      try {
        if(list.name === 'Groupify') {
          await userSpotifyApi.addTracksToPlaylist('userId.body.id', 'list.id', ["spotify:track:" + request.body.trackId])
          res.json(200);
        }
      } catch(error) {
        console.log(error);
      }
    });
  } catch(error) {
    console.log(error);
  }
});

module.exports = router;
