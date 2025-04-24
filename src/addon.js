const { addonBuilder } = require("stremio-addon-sdk");
const Player = require('mpris-service');
const fetch_metadata = require('./metadata.js');
const { sendKeyToStremio } = require('./window.js');  // ⬅ external helper

const manifest = {
  id: 'com.undefinedDarkness.stremio.metadata',
  name: 'Stremio Linux Metadata',
  description: 'Linux Metadata Support For Stremio (MPRIS)',
  catalogs: [],
  version: '1.0.0',
  logo: 'https://i.postimg.cc/vmG0VBKX/freedesktop-logo.png',
  resources: ['subtitles'],
  types: ['movie', 'series']
};

const addon = new addonBuilder(manifest);

let player = Player({
  name: 'stremio',
  identity: 'Stremio',
  supportedUriSchemes: ['file', 'magnet'],
  supportedInterfaces: ['player']
});

player.on('pause', () => sendKeyToStremio('space'));
player.on('play', () => sendKeyToStremio('space'));
player.on('playpause', () => sendKeyToStremio('space'));
player.on('next', () => sendKeyToStremio('Shift+n'));

addon.defineSubtitlesHandler(async d => {
  console.log("Called By Stremio!");

  const id = d.id.split(':')[0];
  const metadata = await fetch_metadata(d, id);

  let x = {
    'mpris:artUrl': metadata.background || metadata.poster || metadata.logo || "",
    'xesam:title': metadata.name,
    'xesam:comment': [id],
    'xesam:genre': metadata.genre,
    'xesam:artist': metadata.cast
  };

  console.dir(x);
  player.metadata = x;

  console.log("Finished Updating Metadata");
  player.playbackStatus = 'Playing';
  console.log("Set Playback Status");

  return Promise.resolve({ subtitles: [] });
});

module.exports = addon.getInterface();
