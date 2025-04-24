const { exec } = require('child_process');

let stremioWindowId = null;

function findStremioWindowId(callback) {
  exec("xdotool search --class Stremio | head -1", (err, stdout) => {
    if (err || !stdout.trim()) {
      console.error('[MPRIS] Could not find Stremio window:', err || 'No output');
      return callback(null);
    }

    const id = stdout.trim();
    console.log(`[MPRIS] Found Stremio window ID: ${id}`);
    stremioWindowId = id;
    callback(id);
  });
}

function sendKeyToStremio(key = 'space') {
  if (!stremioWindowId) {
    findStremioWindowId((id) => {
      if (id) sendKeyToStremio(key); // retry after finding the window
    });
    return;
  }

  exec(`xdotool key --window ${stremioWindowId} ${key}`, (err) => {
    if (err) {
      console.error(`[MPRIS] Failed to send key '${key}' to Stremio:`, err);
    } else {
      console.log(`[MPRIS] Sent key '${key}' to Stremio`);
    }
  });
}

module.exports = {
  sendKeyToStremio,
};
