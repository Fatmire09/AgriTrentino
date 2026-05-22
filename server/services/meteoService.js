const { XMLParser } = require('fast-xml-parser');
const Stazione = require('../models/Stazione');
const DatiMeteo = require('../models/DatiMeteo');
const Field = require('../models/Field');

// ────────────────────────────────────────────────────────────────────────────────
// SERVIZIO METEO — US25
//
// Si interfaccia con l'API ufficiale Meteo Trentino (Provincia Autonoma di Trento).
// Esegue 3 funzioni principali:
//   1. fetch + cache della lista delle stazioni meteo (lazy, refresh settimanale)
//   2. ricerca della stazione più vicina ad un appezzamento (formula di Haversine)
//   3. fetch + parse dei dati recenti di una stazione e salvataggio in DatiMeteo
//
// Riferimento UML D2: classe ClientAPIMeteo (richiediDati, verificaDisponibilita,
// salvaInCache, isCacheValida, recuperaDaCache).
// ────────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://dati.meteotrentino.it/service.asmx';
const URL_LISTA_STAZIONI = `${BASE_URL}/listaStazioniGeoJson`;
const URL_DATI_STAZIONE = (codice) => `${BASE_URL}/ultimiDatiStazione?codice=${codice}`;

const CACHE_STAZIONI_GIORNI = 7;
const TIMEOUT_FETCH_MS = 15000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
});

// 1. CACHE LISTA STAZIONI


async function aggiornaCacheStazioni() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_FETCH_MS);
  let response;
  try {
    response = await fetch(URL_LISTA_STAZIONI, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(`Impossibile contattare Meteo Trentino: ${err.message}`);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Lista stazioni non disponibile (HTTP ${response.status})`);
  }
  const geojson = await response.json();
  if (!geojson?.features || !Array.isArray(geojson.features)) {
    throw new Error('Formato GeoJSON non valido dalla lista stazioni');
  }

  // Upsert di tutte le stazioni (non cancelliamo i record vecchi, marchiamo solo come attive le presenti)
  const now = new Date();
  const operazioni = geojson.features
    .filter((f) => f?.geometry?.coordinates?.length === 2 && f?.properties?.codice)
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      return {
        updateOne: {
          filter: { code: p.codice },
          update: {
            $set: {
              code: p.codice,
              nome: p.nome || p.codice,
              quotaMt: p.quota ?? null,
              latitudine: lat,
              longitudine: lng,
              attiva: !p.fine || !p.fine.toString().trim(),
              inizioMonitoraggio: p.inizio ? new Date(p.inizio) : null,
              fineMonitoraggio: p.fine ? new Date(p.fine) : null,
              cachedAt: now,
            },
          },
          upsert: true,
        },
      };
    });

  if (operazioni.length > 0) {
    await Stazione.bulkWrite(operazioni);
  }
  return operazioni.length;
}

async function getStazioniDallaCache() {
  // Controlla se la cache è ancora valida
  const ultimaStazione = await Stazione.findOne().sort({ cachedAt: -1 });
  const cacheScaduta =
    !ultimaStazione ||
    (Date.now() - new Date(ultimaStazione.cachedAt).getTime()) >
      CACHE_STAZIONI_GIORNI * 24 * 60 * 60 * 1000;

  if (cacheScaduta) {
    await aggiornaCacheStazioni();
  }
  return Stazione.find({ attiva: true });
}


// 2. RICERCA STAZIONE PIÙ VICINA (Haversine)


function distanzaHaversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // raggio della Terra in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function trovaStazioneVicina(lat, lng) {
  const stazioni = await getStazioniDallaCache();
  if (stazioni.length === 0) {
    throw new Error('Nessuna stazione disponibile');
  }
  let best = null;
  let bestDist = Infinity;
  for (const s of stazioni) {
    const d = distanzaHaversineKm(lat, lng, s.latitudine, s.longitudine);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return { stazione: best, distanzaKm: Math.round(bestDist * 10) / 10 };
}


// 3. FETCH DATI RECENTI DA UNA STAZIONE (parse XML)


function estraiArray(node) {
  // L'XML parser restituisce un singolo oggetto se c'è 1 elemento,
  // un array se ce ne sono più. Normalizza sempre ad array.
  if (!node) return [];
  return Array.isArray(node) ? node : [node];
}

async function fetchDatiStazione(codice) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_FETCH_MS);
  let response;
  try {
    response = await fetch(URL_DATI_STAZIONE(codice), { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(`Impossibile contattare Meteo Trentino: ${err.message}`);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Dati stazione ${codice} non disponibili (HTTP ${response.status})`);
  }
  const xml = await response.text();
  const parsed = xmlParser.parse(xml);
  const root = parsed?.datiOggi;
  if (!root) {
    throw new Error(`Formato XML inatteso per stazione ${codice}`);
  }

  // Raccoglie le rilevazioni per timestamp
  const temperature = estraiArray(root.temperature?.temperatura_aria);
  const precipitazioni = estraiArray(root.precipitazioni?.precipitazione);
  const umiditaRel = estraiArray(root.umidita_relativa?.umidita_relativa);

  // Crea una mappa timestamp → { tC, rh, mm }
  const mappa = new Map();
  const get = (ts) => {
    if (!mappa.has(ts)) mappa.set(ts, { tC: null, rh: null, mm: null });
    return mappa.get(ts);
  };

  for (const t of temperature) {
    if (t?.data && t.temperatura !== undefined) {
      get(t.data).tC = Number(t.temperatura);
    }
  }
  for (const p of precipitazioni) {
    if (p?.data && p.pioggia !== undefined) {
      get(p.data).mm = Number(p.pioggia);
    }
  }
  for (const u of umiditaRel) {
    if (u?.data && u.rh !== undefined) {
      get(u.data).rh = Number(u.rh);
    }
  }

  // Ordina per timestamp ascendente
  const dati = Array.from(mappa.entries())
    .map(([ts, v]) => ({
      timestamp: new Date(ts),
      temperaturaC: v.tC,
      umiditaPerc: v.rh,
      precipitazioniMm: v.mm,
    }))
    .filter((d) => !isNaN(d.timestamp.getTime()))
    .sort((a, b) => a.timestamp - b.timestamp);

  return dati;
}


// 4. AGGIORNA METEO PER UN APPEZZAMENTO 

async function aggiornaMeteoCampo(field) {
  // US28: marca il tentativo (anche se poi fallirà)
  field.ultimoTentativoSync = new Date();
  field.ultimoTentativoRiuscito = false; // sarà true se arriviamo in fondo senza errori

  try {
    // Se il campo non ha ancora una stazione assegnata, calcolala
    let stazioneCode = field.stazioneAssegnataCode;
    let stazione = null;
    let distanzaKm = null;

    if (!stazioneCode) {
      const risultato = await trovaStazioneVicina(field.latitudine, field.longitudine);
      stazione = risultato.stazione;
      distanzaKm = risultato.distanzaKm;
      stazioneCode = stazione.code;
      field.stazioneAssegnataCode = stazioneCode;
    } else {
      stazione = await Stazione.findOne({ code: stazioneCode });
      if (stazione) {
        distanzaKm = Math.round(
          distanzaHaversineKm(field.latitudine, field.longitudine, stazione.latitudine, stazione.longitudine) * 10
        ) / 10;
      }
    }

    if (!stazione) {
      throw new Error(`Stazione ${stazioneCode} non trovata nel sistema`);
    }

    const dati = await fetchDatiStazione(stazione.code);

    // Marca il fetch come riuscito (sulla stazione)
    stazione.ultimoFetchOk = new Date();
    await stazione.save();

    if (dati.length === 0) {
      // Successo "tecnico" (nessun errore) ma nessun dato nuovo: lo trattiamo come successo
      field.ultimoSuccessoSync = new Date();
      field.ultimoTentativoRiuscito = true;
      await field.save();
      return {
        stazione: { code: stazione.code, nome: stazione.nome, distanzaKm },
        datiSalvati: 0,
        datoCorrente: null,
      };
    }

    // Salva i dati con upsert
    const operazioni = dati.map((d) => ({
      updateOne: {
        filter: { appezzamentoId: field._id, timestamp: d.timestamp },
        update: {
          $set: {
            appezzamentoId: field._id,
            stazioneCode: stazione.code,
            stazioneNome: stazione.nome,
            timestamp: d.timestamp,
            temperaturaC: d.temperaturaC,
            umiditaPerc: d.umiditaPerc,
            precipitazioniMm: d.precipitazioniMm,
          },
        },
        upsert: true,
      },
    }));
    const result = await DatiMeteo.bulkWrite(operazioni);
    const datiSalvati = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    const datoCorrente = dati[dati.length - 1];

    // Sync riuscito → aggiorna i timestamp
    field.ultimoSuccessoSync = new Date();
    field.ultimoTentativoRiuscito = true;
    await field.save();

    return {
      stazione: { code: stazione.code, nome: stazione.nome, distanzaKm },
      datiSalvati,
      datoCorrente: {
        timestamp: datoCorrente.timestamp,
        temperaturaC: datoCorrente.temperaturaC,
        umiditaPerc: datoCorrente.umiditaPerc,
        precipitazioniMm: datoCorrente.precipitazioniMm,
      },
    };
  } catch (err) {
    // Sync fallito → salva comunque il tentativo per la cacheInfo
    field.ultimoTentativoRiuscito = false;
    await field.save();
    throw err; // rilancia per gestione nel chiamante
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 5. AGGIORNA METEO PER TUTTI I CAMPI (US27 — usato dallo scheduler)
// ────────────────────────────────────────────────────────────────────────────────

async function aggiornaTuttiICampi() {
  const campi = await Field.find({});
  let aggiornati = 0;
  let errori = 0;
  const dettagliErrori = [];

  for (const campo of campi) {
    try {
      await aggiornaMeteoCampo(campo);
      aggiornati++;
    } catch (err) {
      errori++;
      dettagliErrori.push({ campoId: campo._id.toString(), nome: campo.nome, errore: err.message });
    }
  }

  return {
    totaleCampi: campi.length,
    aggiornati,
    errori,
    dettagliErrori,
  };
}

module.exports = {
  aggiornaCacheStazioni,
  trovaStazioneVicina,
  fetchDatiStazione,
  aggiornaMeteoCampo,
  aggiornaTuttiICampi,
  distanzaHaversineKm,
};