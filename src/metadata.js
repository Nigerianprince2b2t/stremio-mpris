const fetch = require('node-fetch');

async function fetch_metadata(m, imdb_id) {
  console.dir(m);

  if (!m.id.startsWith("tt")) {
    throw new Error("Non IMDB Id");
  }

  const req = await fetch(`https://v3-cinemeta.strem.io/meta/${m.type}/${imdb_id}.json`);
  const d = await req.json();

  if (d.meta) {
    // Add default/fallback runtime if not provided
    const runtime = d.meta.runtime || estimateRuntime(d.meta);

    return {
      ...d.meta,
      runtime
    };
  } else {
    throw new Error("Invalid JSON Response.");
  }
}

// Fallback logic if no runtime from API
function estimateRuntime(meta) {
  if (meta.name?.toLowerCase().includes("one piece")) return 24;
  if (meta.type === "movie") return 90;
  return 30; // default fallback
}

module.exports = fetch_metadata;
