/* ==========================================================================
   123 school - filippine (woordpuzzel) voor alle puzzelpagina's
   Een pagina levert alleen de gegevens, als JSON in:
     <script type="application/json" id="filippine-data">
       { "titel": "...", "sleutelwoord": "ATOOMBINDING",
         "rijen": [ { "omschrijving": "...", "antwoord": "ALKAAN", "sleutelpositie": 1 }, ... ] }
     </script>
   en een leeg vak: <div id="filippine"></div>
   sleutelpositie = de letter van het antwoord (1 = eerste letter) die in het sleutelwoord komt.
   Spaties en streepjes in een antwoord tellen niet mee als vakje.
   Het script maakt de rijen met een vakje per letter, kleurt de sleutelvakjes, vult het sleutelwoord
   onderaan terwijl je typet en geeft een zwevende knop "Controleer antwoorden" die alleen
   de volledig ingevulde rijen nakijkt (groen/rood, zoals bij de andere vragen).
   ========================================================================== */
(function () {
  'use strict';

  function schoon(t) { return String(t).toUpperCase().replace(/[^A-Z\u00C0-\u00DE]/g, ''); }

  function el(naam, klasse, tekst) {
    var e = document.createElement(naam);
    if (klasse) { e.className = klasse; }
    if (tekst !== undefined) { e.textContent = tekst; }
    return e;
  }

  function start() {
    var wortel = document.getElementById('filippine');
    var gegevensTag = document.getElementById('filippine-data');
    if (!wortel || !gegevensTag) { return; }
    var data;
    try { data = JSON.parse(gegevensTag.textContent); } catch (fout) { console.error('filippine: gegevens onleesbaar', fout); return; }

    var rijen = data.rijen.map(function (r, i) {
      var woord = schoon(r.antwoord);
      return { nr: i + 1, omschrijving: r.omschrijving, antwoord: woord, weergave: r.antwoord, pos: r.sleutelpositie, vakjes: [], kaart: null, melding: null };
    });
    var sleutel = rijen.map(function (r) { return r.antwoord.charAt(r.pos - 1); }).join('');
    if (data.sleutelwoord && schoon(data.sleutelwoord) !== sleutel) {
      console.warn('filippine: sleutelwoord klopt niet met de sleutelletters', data.sleutelwoord, sleutel);
    }
    var maxVoor = Math.max.apply(null, rijen.map(function (r) { return r.pos - 1; }));

    /* ----- rijen opbouwen ----- */
    var lijst = el('ol', 'fil-lijst');
    lijst.setAttribute('aria-label', 'Omschrijvingen');
    rijen.forEach(function (r) {
      var kaart = el('li', 'fil-rij');
      r.kaart = kaart;
      var kop = el('div', 'fil-omschrijving');
      kop.appendChild(el('span', 'fil-nr', r.nr + '.'));
      kop.appendChild(document.createTextNode(' ' + r.omschrijving + ' '));
      kop.appendChild(el('span', 'fil-lengte', '(' + r.antwoord.length + ' letters)'));
      kaart.appendChild(kop);
      var vak = el('div', 'fil-vakjes');
      vak.style.setProperty('--versch', String(maxVoor - (r.pos - 1)));
      vak.setAttribute('role', 'group');
      vak.setAttribute('aria-label', 'Antwoord ' + r.nr + ', ' + r.antwoord.length + ' letters');
      for (var k = 0; k < r.antwoord.length; k++) {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'fil-vakje' + (k === r.pos - 1 ? ' fil-sleutel' : '');
        inp.setAttribute('autocomplete', 'off');
        inp.setAttribute('autocapitalize', 'characters');
        inp.setAttribute('autocorrect', 'off');
        inp.setAttribute('spellcheck', 'false');
        inp.setAttribute('enterkeyhint', 'next');
        inp.setAttribute('aria-label', 'Antwoord ' + r.nr + ', letter ' + (k + 1) + ' van ' + r.antwoord.length + (k === r.pos - 1 ? ' (sleutelletter)' : ''));
        r.vakjes.push(inp);
        vak.appendChild(inp);
      }
      kaart.appendChild(vak);
      r.melding = el('div', 'fil-melding');
      r.melding.setAttribute('role', 'status');
      kaart.appendChild(r.melding);
      lijst.appendChild(kaart);
    });

    /* ----- sleutelwoord onderaan ----- */
    var sleutelDoos = el('div', 'fil-sleutelkader');
    sleutelDoos.appendChild(el('h3', 'fil-sleutelkop', 'Sleutelwoord'));
    sleutelDoos.appendChild(el('p', 'fil-sleuteltekst', 'De gele vakjes hierboven vormen samen het sleutelwoord. Het vult zich terwijl je invult.'));
    var sleutelRij = el('div', 'fil-sleutelrij');
    sleutelRij.setAttribute('aria-live', 'polite');
    var sleutelVakjes = rijen.map(function () {
      var v = el('span', 'fil-sleutelvakje');
      sleutelRij.appendChild(v);
      return v;
    });
    sleutelDoos.appendChild(sleutelRij);
    var sleutelUitslag = el('p', 'fil-sleutelmelding');
    sleutelUitslag.setAttribute('role', 'status');
    sleutelDoos.appendChild(sleutelUitslag);

    /* ----- knoppen ----- */
    var onder = el('div', 'kb-controle w3-center');
    var knop = el('button', 'w3-button knop-blauw', 'Controleer antwoorden');
    knop.type = 'button'; knop.id = 'fil-controleer';
    var uitslag = el('div'); uitslag.id = 'kb-uitslag'; uitslag.setAttribute('role', 'status'); uitslag.setAttribute('aria-live', 'polite');
    onder.appendChild(knop); onder.appendChild(uitslag);

    wortel.appendChild(lijst);
    wortel.appendChild(sleutelDoos);
    wortel.appendChild(onder);

    /* ----- hulpfuncties ----- */
    function tekstVan(r) { return r.vakjes.map(function (v) { return v.value; }).join(''); }
    function gevuld(r) { return r.vakjes.filter(function (v) { return v.value; }).length; }

    function wisOordeel(r) {
      r.kaart.classList.remove('fil-goed', 'fil-fout');
      r.vakjes.forEach(function (v) { v.removeAttribute('aria-invalid'); });
      r.melding.textContent = '';
      sleutelUitslag.textContent = '';
    }

    function werkSleutelBij() {
      rijen.forEach(function (r, i) { sleutelVakjes[i].textContent = r.vakjes[r.pos - 1].value; });
    }

    function zet(r, k, tekens) {
      /* zet een of meer letters vanaf vakje k; geeft het eerstvolgende vakje terug */
      var j = k;
      for (var t = 0; t < tekens.length && j < r.vakjes.length; t++, j++) { r.vakjes[j].value = tekens.charAt(t); r.vakjes[j].dataset.v = tekens.charAt(t); }
      return j;
    }

    function focusOp(r, k) {
      if (k >= r.vakjes.length) {
        var volgende = rijen[r.nr];
        if (volgende) { volgende.vakjes[0].focus(); }
        return;
      }
      if (k < 0) {
        var vorige = rijen[r.nr - 2];
        if (vorige) { vorige.vakjes[vorige.vakjes.length - 1].focus(); }
        return;
      }
      r.vakjes[k].focus();
    }

    rijen.forEach(function (r) {
      r.vakjes.forEach(function (inp, k) {
        inp.addEventListener('focus', function () { try { inp.select(); } catch (e) { /* oudere browsers */ } });
        inp.addEventListener('click', function () { try { inp.select(); } catch (e) { /* idem */ } });
        inp.addEventListener('input', function () {
          wisOordeel(r);
          var tekens = schoon(inp.value);
          if (!tekens) { inp.value = ''; inp.dataset.v = ''; werkSleutelBij(); return; }
          /* in een vol vakje typen of plakken: het nieuwste teken telt; bij plakken van een woord vullen we door */
          if (tekens.length > 2) { inp.value = ''; inp.dataset.v = ''; var j = zet(r, k, tekens); werkSleutelBij(); focusOp(r, j); return; }
          var vorig = inp.dataset.v || '';
          var teken = tekens.length === 2 ? (tekens.charAt(0) === vorig ? tekens.charAt(1) : tekens.charAt(0)) : tekens;
          inp.value = teken; inp.dataset.v = teken;
          werkSleutelBij();
          focusOp(r, k + 1);
        });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !inp.value) { e.preventDefault(); if (k > 0) { r.vakjes[k - 1].value = ''; r.vakjes[k - 1].dataset.v = ''; wisOordeel(r); werkSleutelBij(); } focusOp(r, k - 1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); focusOp(r, k - 1); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); focusOp(r, k + 1); }
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            var buur = rijen[r.nr - 1 + (e.key === 'ArrowDown' ? 1 : -1)];
            if (buur) { e.preventDefault(); buur.vakjes[Math.min(k, buur.vakjes.length - 1)].focus(); }
          }
          else if (e.key === 'Enter') { e.preventDefault(); var vol = rijen[r.nr]; if (vol) { vol.vakjes[0].focus(); } else { inp.blur(); } }
        });
      });
    });

    /* ----- nakijken ----- */
    knop.addEventListener('click', function () {
      var ingevuld = 0, goed = 0, onaf = 0, leeg = 0;
      rijen.forEach(function (r) {
        wisOordeel(r);
        var n = gevuld(r);
        if (n === 0) { leeg++; return; }
        if (n < r.vakjes.length) { onaf++; r.melding.textContent = 'Nog niet helemaal ingevuld, dus niet nagekeken.'; return; }
        ingevuld++;
        var juist = tekstVan(r) === r.antwoord;
        if (juist) { goed++; }
        r.kaart.classList.add(juist ? 'fil-goed' : 'fil-fout');
        if (!juist) { r.vakjes.forEach(function (v) { v.setAttribute('aria-invalid', 'true'); }); }
        r.melding.textContent = juist ? '\u2713 Goed' : '\u2717 Niet goed';
        r.melding.className = 'fil-melding uitslag ' + (juist ? 'uitslag-goed' : 'uitslag-fout');
        if (!juist) {
          var toon = el('button', 'fil-toon', 'Toon antwoord');
          toon.type = 'button';
          toon.addEventListener('click', function () {
            r.melding.textContent = '\u2717 Niet goed. Het antwoord is: ' + r.weergave.toLowerCase();
          });
          r.melding.appendChild(document.createTextNode(' '));
          r.melding.appendChild(toon);
        }
      });
      if (!ingevuld) {
        uitslag.innerHTML = '<p class="inline-melding">Vul eerst minstens \u00e9\u00e9n woord helemaal in.</p>';
        return;
      }
      var tekst = goed + ' van de ' + ingevuld + ' ingevulde woorden goed';
      var rest = onaf + leeg;
      if (rest) { tekst += ' (' + rest + ' nog niet nagekeken)'; }
      uitslag.textContent = tekst;
      if (goed === rijen.length) {
        sleutelUitslag.textContent = 'Alle woorden goed. Het sleutelwoord is: ' + sleutel.toLowerCase() + '.';
      }
    });

    /* ----- zwevende knop (zelfde als bij de andere oefenpagina's) ----- */
    var zweef = el('button', 'zweefknop', 'Controleer antwoorden');
    zweef.type = 'button'; zweef.id = 'zweefknop';
    zweef.setAttribute('aria-label', 'Controleer antwoorden: kijk alleen de ingevulde woorden na');
    zweef.addEventListener('click', function () { knop.click(); });
    document.body.appendChild(zweef);
    document.body.classList.add('heeft-zweefknop');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (items) { zweef.hidden = items[0].isIntersecting; }).observe(knop);
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
