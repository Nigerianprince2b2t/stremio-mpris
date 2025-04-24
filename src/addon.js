const { addonBuilder } = require("stremio-addon-sdk");
const Player = require('mpris-service');
const fetch_metadata = require('./metadata.js');
const { sendKeyToStremio } = require('./window.js');
const { exec } = require('child_process');


exec("which xdotool", (err, stdout) => {
  if (err || !stdout) {
    console.error("[MPRIS] ERROR: 'xdotool' is not installed.");
    process.exit(1);
  }
});

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

player.canSeek = true;
player.canControl = true;
player.canGoNext = true;
player.canGoPrevious = true;
player.playbackStatus = 'Playing';
player.position = 0;

let fakePos = 0;
setInterval(() => {
  if (player.playbackStatus === 'Playing') {
    fakePos += 1_000_000;
    player.position = fakePos;
  }
}, 1000);

player.on('seek', (offset) => {
  console.log(`[MPRIS] Seek called with offset: ${offset}`);

  const seconds = offset / 1_000_000;

  if (seconds === 10) {
    sendKeyToStremio('Right');
    console.log('[MPRIS] Sent Right Arrow (skip forward)');
  } else if (seconds === -10) {
    sendKeyToStremio('Left');
    console.log('[MPRIS] Sent Left Arrow (skip backward)');
  }

  fakePos += offset;
  player.position = fakePos;
});

player.on('pause', () => sendKeyToStremio('space'));
player.on('play', () => sendKeyToStremio('space'));
player.on('playpause', () => sendKeyToStremio('space'));
player.on('next', () => sendKeyToStremio('Shift+n'));

addon.defineSubtitlesHandler(async d => {
  console.log("Called By Stremio!");

  const id = d.id.split(':')[0];
  const metadata = await fetch_metadata(d, id);

  const runtimeMinutes = parseInt(metadata.runtime) || 30;
  const episodeLength = runtimeMinutes * 60 * 1_000_000;

  fakePos = 0;

  const x = {
    'mpris:artUrl': metadata.background || metadata.poster || metadata.logo || "",
    'xesam:title': metadata.name,
    'xesam:comment': [id],
    'xesam:genre': metadata.genre,
    'xesam:artist': metadata.cast,
    'mpris:length': episodeLength
  };

  console.dir(x);
  player.metadata = x;
  player.position = fakePos;

  console.log("Finished Updating Metadata");
  return Promise.resolve({ subtitles: [] });
});

module.exports = addon.getInterface();
