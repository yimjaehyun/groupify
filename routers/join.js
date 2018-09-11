const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const bodyParser = require('body-parser');
const Request = require('request');

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const router = express.Router();

router.get('/', function(request, response, next) {
  response.render('join.ejs');
});

router.post('/joinRoom', async function(req, res) {
  try {
    console.log(req.body);
    res.json({success: true});
  } catch(error) {
    console.log(error);
  }
});

router.post('/searchTrack', async function(request, response) {
  const query = `${request.body.trackSearch}`
  try {
    const token = await spotifyApi.clientCredentialsGrant();
    await spotifyApi.setAccessToken(token.body['access_token']);
    console.log('The access token is ' + token.body['access_token']);
    const searchResults = await spotifyApi.searchTracks(query);
    response.json(searchResults.body.tracks.items);
    // console.log(JSON.stringify(searchResults.body.tracks.items, null, "  "));
  } catch(err) {
    console.log(err);
  }
});

router.post('/addToQueue', async function(request, response) {
  try {
    console.log(request.body);
    Request.post(
      {
        url: 'https://d8e6f7e4.ngrok.io/addToQueue',
        form: request.body
      },
      function (err, httpResponse, body) {
        console.log(err, body);
      }
    );
  } catch(error) {
    console.log(error);
  }
});

module.exports = router;
