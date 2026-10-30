/* ==========================================================================
   123 school - AI-nakijken van getypte antwoorden (los onderdeel)
   Gebruik: zet op een KB-pagina, onderaan na school.js, deze ene regel:
       <script src="ai-nakijken.js" defer></script>
   Daarna werkt de zwevende knop "Controleer antwoorden" (school.js) met AI:
     1. school.js kijkt eerst alles lokaal na (precies/ruimhartig, getallen met afronding en eenheid).
     2. Antwoorden die lokaal niet te beoordelen zijn (eigen woorden: "Vergelijk zelf") of die lokaal fout zijn
        terwijl het antwoord een tekst is die half goed kan zijn, gaan samen in EEN verzoek naar de Worker
        (een verzoek = een AI-aanroep, dat spaart de gratis dagelijkse limiet).
     3. De uitslag is goed, bijna goed of niet goed, met een korte tip. Bij "bijna goed" of "niet goed" blijft het juiste
        antwoord dicht bij de eerste poging; de leerling mag het aanpassen en opnieuw controleren. Na de tweede poging of
        bij "goed" klapt het juiste antwoord open.
     4. Lukt het nakijken niet (Worker onbereikbaar, limiet bereikt): "Vergelijk zelf met het juiste antwoord" en het
        juiste antwoord staat er gewoon.
   Dit script doet zelf niets met de vragen; het levert alleen window.kbAI = { komtInAanmerking, nakijken } aan school.js.
   Het adres van de Worker staat hieronder in WORKER_URL. Een pagina kan het overschrijven met
       <script src="ai-nakijken.js" data-url="https://..." defer></script>
   Is het adres leeg of een plaatshouder (JOUW-SUBDOMEIN), dan doet dit script niets.
   Er gaat alleen {id, question, modelAnswer, studentAnswer, attempt} naar de Worker (geen namen).
   Optionele elementen op de pagina: #ai-melding ("in ontwikkeling", wordt weggehaald), #ai-intro (verborgen uitleg,
   wordt getoond), #ai-vergelijk (oude uitleg, wordt weggehaald). Ontbreken ze, dan zet het script zelf een korte uitleg boven de vragen.
   ========================================================================== */
(function () {
  'use strict';

  var WORKER_URL = 'https://school-nakijken.scheikunde-oefenen.workers.dev/';
  var MAX_PER_VERZOEK = 20;   /* de Worker accepteert er maximaal 20 */
  var MAX_VERZOEKEN = 30;     /* per pagina per bezoek: voorkomt onbedoeld veel aanroepen */

  var script = document.currentScript || document.querySelector('script[src*="ai-nakijken"]');
  var AI_URL = (script && script.getAttribute('data-url')) || WORKER_URL;
  if (typeof AI_URL !== 'string' || !/^https?:\/\//.test(AI_URL) || AI_URL.indexOf('JOUW-') !== -1) { return; }

  var verzoeken = 0;

  window.kbAI = {
    /* Mag de AI dit antwoord nakijken? it = { local: 'goed'|'half'|'fout'|'zelf', numeriek, verwacht, ingevuld } */
    komtInAanmerking: function (it) {
      if (verzoeken >= MAX_VERZOEKEN) { return false; }
      if (!it || it.local === 'goed' || it.local === 'half') { return false; }
      if (it.numeriek) { return false; }                 /* getallen en eenheden kijkt school.js zelf na */
      var tekst = String(it.ingevuld || '');
      if (tekst.length > 500 || !/[a-z\u00e0-\u00ff]{2}/i.test(tekst)) { return false; }
      if (it.local === 'zelf') { return true; }          /* lokaal niet te beoordelen */
      /* lokaal fout: alleen bij langere tekstantwoorden, want korte (een naam of symbool) is goed of fout */
      var v = String(it.verwacht || '');
      return it.local === 'fout' && (v.length >= 12 || v.indexOf('=') !== -1) && tekst.length >= 3;
    },

    /* items = [{id, question, modelAnswer, studentAnswer, attempt}] -> Promise met { id: {verdict, tip} } */
    nakijken: function (items) {
      var delen = [];
      for (var i = 0; i < items.length; i += MAX_PER_VERZOEK) { delen.push(items.slice(i, i + MAX_PER_VERZOEK)); }
      var uit = {};
      return Promise.all(delen.map(function (deel) {
        verzoeken++;
        var stop = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = setTimeout(function () { if (stop) { stop.abort(); } }, 26000);
        return fetch(AI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: deel }),
          signal: stop ? stop.signal : undefined
        }).then(function (r) {
          if (!r.ok) { throw new Error('status ' + r.status); }
          return r.json();
        }).then(function (j) {
          (j && j.results || []).forEach(function (x) {
            if (x && typeof x.id === 'string') { uit[x.id] = { verdict: x.verdict, tip: x.tip }; }
          });
        }).then(function () { clearTimeout(timer); }, function (e) { clearTimeout(timer); throw e; });
      })).then(function () { return uit; });
    }
  };

  function klaar(fn) {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); } else { fn(); }
  }

  klaar(function () {
    var vraagKnoppen = document.querySelectorAll('button.vraag-knop');
    if (!vraagKnoppen.length) { return; }
    var meldingBox = document.getElementById('ai-melding');
    if (meldingBox) { meldingBox.parentNode.removeChild(meldingBox); }
    var vergelijk = document.getElementById('ai-vergelijk');
    if (vergelijk) { vergelijk.parentNode.removeChild(vergelijk); }
    var intro = document.getElementById('ai-intro');
    if (intro) { intro.hidden = false; return; }
    intro = document.createElement('p');
    intro.id = 'ai-intro';
    intro.textContent = 'Typ je antwoorden en klik op "Controleer antwoorden". Antwoorden in je eigen woorden worden met AI nagekeken: je krijgt dan een tip en mag het nog een keer proberen. Typ nooit je naam of andere persoonlijke gegevens: je antwoord wordt door Google Gemini nagekeken.';
    var eerste = vraagKnoppen[0].parentNode;
    eerste.parentNode.insertBefore(intro, eerste);
  });
})();
