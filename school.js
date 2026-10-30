/* ==========================================================================
   123 school - gedeeld script voor alle pagina's (v2)
   Bevat: antwoord openklappen (KB), menuknop, toegankelijkheid, meerkeuze-quiz (MP) met
   willekeurige volgorde en pagina's van 15 vragen, zwevende knop "Controleer nu", en
   de scripts van de beginpagina. Alleen frontend, geen server nodig.
   Derde-partijbibliotheken (w3.js, w3data.js, jQuery, Bootstrap) staan nog steeds in de HTML.
   ========================================================================== */

var VRAGEN_PER_PAGINA = 15;

/* Voer een functie uit zodra de pagina geladen is (ook als dat al gebeurd is). */
function klaar(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/* Schud een lijst willekeurig (Fisher-Yates). Geeft een nieuwe lijst terug. */
function schud(lijst) {
  var a = lijst.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ---------- Navigatie en antwoorden openklappen ---------- */

/* Antwoord openen of sluiten (KB-pagina's en spelletjesknoppen op de beginpagina).
   Met een tweede argument (this) moet je eerst iets typen voordat het antwoord opengaat (Sorteren-pagina). */
function myFunction(id, knop) {
  var x = document.getElementById(id);
  if (!x) { return; }
  if (knop) {
    var input = knop.nextElementSibling;
    if (input && input.value.length < 1) {
      /* Geen pop-up (alert): een rustige melding naast het invoerveld */
      var melding = input.parentNode.querySelector('.inline-melding');
      if (!melding) {
        melding = document.createElement('p');
        melding.className = 'inline-melding';
        melding.setAttribute('role', 'alert');
        input.parentNode.insertBefore(melding, input.nextSibling);
      }
      melding.textContent = 'Typ eerst je antwoord. Dan kun je het juiste antwoord bekijken.';
      return;
    }
  }
  var voor = x.previousElementSibling;
  if (x.className.indexOf('w3-show') == -1) {
    x.className += ' w3-show';
    if (voor) { voor.className = voor.className.replace('w3-black', 'spel-open'); }
  } else {
    x.className = x.className.replace(' w3-show', '');
    if (voor) { voor.className = voor.className.replace('spel-open', 'w3-black'); }
  }
}

/* Menuknop voor kleine schermen */
function openNav(sluit) {
  var x = document.getElementById('navDemo');
  if (!x) { return; }
  var open = x.className.indexOf('w3-show') != -1;
  if (open) {
    x.className = x.className.replace(' w3-show', '');
  } else if (sluit !== true) {
    x.className += ' w3-show';
    open = false;
  }
  var knop = document.querySelector('[aria-controls="navDemo"]');
  if (knop) { knop.setAttribute('aria-expanded', x.className.indexOf('w3-show') != -1 ? 'true' : 'false'); }
}
/* Het menu sluit zelf als je een onderdeel kiest of op Escape drukt (anders blijft het over de pagina hangen) */
document.addEventListener('click', function (e) {
  var a = e.target.closest ? e.target.closest('#navDemo a') : null;
  if (a) { openNav(true); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { openNav(true); }
});

/* Zijmenu (beginpagina) */
function w3_open() {
  var x = document.getElementById('mySidebar');
  if (!x) { return; }
  x.style.width = '300px';
  x.style.paddingTop = '10%';
  x.style.display = 'block';
}
function w3_close() {
  var x = document.getElementById('mySidebar');
  if (x) { x.style.display = 'none'; }
}

/* Zet bij elk antwoord ook tekst "Goed" of "Niet goed", zodat de uitkomst niet alleen aan kleur te zien is. */
function markeer(container, goed) {
  var oud = container.querySelector('.uitslag');
  if (oud) { oud.parentNode.removeChild(oud); }
  var el = document.createElement('div');
  el.className = 'uitslag ' + (goed ? 'uitslag-goed' : 'uitslag-fout');
  el.textContent = goed ? '\u2713 Goed' : '\u2717 Niet goed';
  container.appendChild(el);
}

/* Externe pagina's laden (menu) met w3data.js */
if (typeof w3IncludeHTML === 'function') { w3IncludeHTML(); }

/* ---------- Toegankelijkheid voor de vraag-antwoordpagina's (KB) ---------- */
klaar(function () {
  var knoppen = document.querySelectorAll('button[onclick^="myFunction"]');
  knoppen.forEach(function (knop) {
    var m = knop.getAttribute('onclick').match(/myFunction\(["']([^"']+)["']/);
    if (!m) { return; }
    knop.setAttribute('aria-controls', m[1]);
    knop.setAttribute('aria-expanded', 'false');
    knop.addEventListener('click', function () {
      var doel = document.getElementById(m[1]);
      var open = doel && doel.className.indexOf('w3-show') !== -1;
      knop.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
});

/* ---------- Pagina's van 15 vragen met knop "Meer vragen (nog X)" ----------
   blokken: lijst met elementen (een per vraag), allemaal in dezelfde ouder; de knop komt in ouder vlak voor anker (of aan het eind).
   Alles na de eerste 15 wordt verborgen (hidden). Geeft een functie terug die het aantal getoonde vragen levert. */
function maakPaginering(blokken, ouder, anker, focusDoel) {
  var totaal = blokken.length;
  var getoond = Math.min(VRAGEN_PER_PAGINA, totaal);
  for (var i = getoond; i < totaal; i++) { blokken[i].hidden = true; }
  var info = { getoond: function () { return getoond; }, totaal: totaal };
  if (totaal <= VRAGEN_PER_PAGINA) { return info; }

  var wrap = document.createElement('div');
  wrap.className = 'meer-vragen w3-center';
  var knop = document.createElement('button');
  knop.type = 'button';
  knop.className = 'w3-button knop-blauw';
  wrap.appendChild(knop);
  ouder.insertBefore(wrap, anker);

  function label() { knop.textContent = 'Meer vragen (nog ' + (totaal - getoond) + ')'; }
  label();
  knop.addEventListener('click', function () {
    var eerste = getoond;
    getoond = Math.min(getoond + VRAGEN_PER_PAGINA, totaal);
    for (var i = eerste; i < getoond; i++) { blokken[i].hidden = false; }
    var doel = focusDoel(blokken[eerste]);
    if (getoond >= totaal) { wrap.parentNode.removeChild(wrap); } else { label(); }
    /* Focus naar de eerste nieuwe vraag, zonder dat de pagina verspringt */
    if (doel && doel.focus) { doel.focus({ preventScroll: true }); }
  });
  return info;
}

/* ---------- KB-pagina's: vragen in willekeurige volgorde, eerst 15 tonen ---------- */
klaar(function () {
  var knoppen = document.querySelectorAll('button.vraag-knop');
  if (!knoppen.length) { return; }
  var ouder = knoppen[0].parentNode.parentNode;
  var blokken = [];
  knoppen.forEach(function (k) {
    if (k.parentNode.parentNode === ouder) { blokken.push(k.parentNode); }
  });
  if (blokken.length < 2) { return; }

  /* Browsers onthouden getypte antwoorden op positie; na het husselen zou dat verkeerd gaan. */
  document.querySelectorAll('input[type=text]').forEach(function (inp) { inp.setAttribute('autocomplete', 'off'); });

  var anker = blokken[blokken.length - 1].nextSibling;
  var gehusseld = schud(blokken);
  gehusseld.forEach(function (b) { ouder.removeChild(b); });
  gehusseld.forEach(function (b) { ouder.insertBefore(b, anker); });
  maakPaginering(gehusseld, ouder, anker, function (blok) { return blok.querySelector('button.vraag-knop'); });
});

/* ---------- KB-pagina's: zwevende knop "Controleer antwoorden" ----------
   Kijkt alleen de ingevulde antwoorden na (lege vragen blijven dicht). Per vraag: goed of niet goed, het juiste antwoord
   en de uitleg verschijnen onder de vraag. Het vergelijken is ruimhartig: hoofdletters, spaties, komma of punt,
   een ontbrekende eenheid en schrijfwijzen van machten van 10 maken niet uit. Lange tekstantwoorden worden niet
   automatisch beoordeeld: daar staat "Vergelijk zelf met het juiste antwoord". */
var SUPERS = { '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9', '\u207b': '-', '\u207a': '+' };

function kbTekstVanAntwoord(box) {
  var kopie = box.cloneNode(true);
  Array.prototype.forEach.call(kopie.querySelectorAll('.uitleg, .uitslag'), function (e) { e.parentNode.removeChild(e); });
  Array.prototype.forEach.call(kopie.querySelectorAll('sup'), function (e) { e.textContent = '^' + e.textContent; });
  return (kopie.textContent || '').replace(/\s+/g, ' ').trim();
}

function kbNormaal(t) {
  t = String(t).toLowerCase();
  t = t.replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u207b]/g, function (c) { return SUPERS[c] === undefined ? c : (/[0-9]/.test(SUPERS[c]) || SUPERS[c] === '-' || SUPERS[c] === '+' ? SUPERS[c] : c); });
  t = t.replace(/[\s\u00a0]+/g, '').replace(/[\u2212\u2013\u2014]/g, '-').replace(/,/g, '.').replace(/[\u00b7\u00d7*]/g, 'x');
  return t;
}

/* Getal + eenheid: "10.0g", "3.40x10-3mol", "5/6", "25%" */
function kbGetal(t) {
  var s = kbNormaal(t).replace(/[\^{}()]/g, '');
  var m = /^(-?\d+(?:\.\d+)?(?:\/\d+)?(?:x10-?\d+)?)(.*)$/.exec(s);
  return m ? { getal: m[1], eenheid: m[2].replace(/[^a-z0-9%\/\u00b0]/g, '') } : null;
}

function kbWaarde(g) {
  var m = /^(-?\d+(?:\.\d+)?)(?:\/(\d+))?(?:x10(-?\d+))?$/.exec(g);
  if (!m) { return NaN; }
  return parseFloat(m[1]) / (m[2] ? parseFloat(m[2]) : 1) * Math.pow(10, m[3] ? parseInt(m[3], 10) : 0);
}

/* Geeft { oordeel: 'goed' | 'fout' | 'zelf', hint: '' } */
function kbBeoordeel(ingevuld, verwacht) {
  var v = kbGetal(verwacht);
  if (v) {
    var i = kbGetal(ingevuld);
    if (i && i.getal === v.getal && (i.eenheid === '' || v.eenheid === '' || i.eenheid === v.eenheid)) { return { oordeel: 'goed', hint: '' }; }
    var hint = '';
    if (i && i.getal !== v.getal && Math.abs(kbWaarde(i.getal) - kbWaarde(v.getal)) < 1e-12 * Math.max(1, Math.abs(kbWaarde(v.getal))) && v.getal.indexOf('/') === -1) {
      hint = 'Let op het aantal decimalen of significante cijfers.';
    }
    return { oordeel: 'fout', hint: hint };
  }
  var tekst = function (x) { return x.toLowerCase().replace(/[^a-z0-9\u00e0-\u00ff]/g, ''); };
  var ruw = verwacht.replace(/\^/g, '');
  var opties = [ruw, ruw.replace(/\([^)]*\)/g, '')].concat(ruw.split(/\s+of\s+|\//));
  opties = opties.map(tekst).filter(function (o) { return o.length > 0; });
  if (!opties.length || tekst(ruw).length > 30) { return { oordeel: 'zelf', hint: '' }; }
  return { oordeel: opties.indexOf(tekst(ingevuld)) !== -1 ? 'goed' : 'fout', hint: '' };
}

klaar(function () {
  if (document.querySelector('script[src*="ai-nakijken"]')) { return; }
  var knoppen = Array.prototype.slice.call(document.querySelectorAll('button.vraag-knop'));
  var blokken = knoppen.map(function (k) { return k.parentNode; }).filter(function (b) {
    return b.querySelector('input[type=text]') && b.querySelector('.antwoord-box');
  });
  if (!blokken.length) { return; }
  var ouder = blokken[0].parentNode;
  var laatste = blokken.filter(function (b) { return b.parentNode === ouder; }).pop();
  var wrap = laatste.nextElementSibling && laatste.nextElementSibling.classList.contains('meer-vragen') ? laatste.nextElementSibling : laatste;
  var ref = wrap.nextSibling;

  var onder = document.createElement('div');
  onder.className = 'kb-controle w3-center';
  var origineel = document.createElement('button');
  origineel.type = 'button';
  origineel.id = 'kb-controleer';
  origineel.className = 'w3-button knop-blauw';
  origineel.textContent = 'Controleer antwoorden';
  var uitslag = document.createElement('div');
  uitslag.id = 'kb-uitslag';
  uitslag.setAttribute('role', 'status');
  uitslag.setAttribute('aria-live', 'polite');
  onder.appendChild(origineel); onder.appendChild(uitslag);
  ouder.insertBefore(onder, ref);

  function wis(blok) {
    var inp = blok.querySelector('input[type=text]');
    inp.classList.remove('kb-goed', 'kb-fout');
    inp.removeAttribute('aria-invalid');
    var oud = blok.querySelector('.kb-oordeel');
    if (oud) { oud.parentNode.removeChild(oud); }
  }
  function sluit(blok) {
    var box = blok.querySelector('.antwoord-box');
    box.className = box.className.replace(' w3-show', '');
    var k = blok.querySelector('button.vraag-knop');
    if (k) { k.setAttribute('aria-expanded', 'false'); }
  }
  blokken.forEach(function (blok) {
    /* Wijzig je je antwoord, dan verdwijnt de uitslag bij die vraag en gaat het juiste antwoord weer dicht */
    blok.querySelector('input[type=text]').addEventListener('input', function () { wis(blok); sluit(blok); });
  });

  origineel.addEventListener('click', function () {
    var ingevuld = 0, goed = 0, open = 0;
    blokken.forEach(function (blok) {
      if (blok.hidden) { return; }
      var inp = blok.querySelector('input[type=text]');
      var box = blok.querySelector('.antwoord-box');
      var tekst = inp.value.replace(/\s+/g, ' ').trim();
      wis(blok);
      if (!tekst) { return; }
      ingevuld++;
      var r = kbBeoordeel(tekst, kbTekstVanAntwoord(box));
      if (r.oordeel === 'goed') { goed++; }
      var el = document.createElement('div');
      el.className = 'kb-oordeel uitslag ' + (r.oordeel === 'goed' ? 'uitslag-goed' : (r.oordeel === 'fout' ? 'uitslag-fout' : 'uitslag-zelf'));
      el.textContent = r.oordeel === 'goed' ? '\u2713 Goed' : (r.oordeel === 'fout' ? '\u2717 Niet goed' : 'Vergelijk zelf met het juiste antwoord');
      if (r.hint) { el.textContent += '. ' + r.hint; }
      if (r.oordeel !== 'zelf') {
        inp.classList.add(r.oordeel === 'goed' ? 'kb-goed' : 'kb-fout');
        if (r.oordeel === 'fout') { inp.setAttribute('aria-invalid', 'true'); }
      }
      inp.parentNode.insertBefore(el, box);
      if (box.className.indexOf('w3-show') === -1) { box.className += ' w3-show'; }
      var k = blok.querySelector('button.vraag-knop');
      if (k) { k.setAttribute('aria-expanded', 'true'); }
    });
    if (!ingevuld) {
      uitslag.innerHTML = '<p class="inline-melding">Vul eerst bij minstens \u00e9\u00e9n vraag een antwoord in.</p>';
      return;
    }
    var rest = 0;
    blokken.forEach(function (b) { if (!b.hidden && !b.querySelector('input[type=text]').value.trim()) { rest++; } });
    uitslag.textContent = goed + ' van de ' + ingevuld + ' ingevulde antwoorden goed' + (rest ? ' (' + rest + ' zonder antwoord overgeslagen)' : '');
  });

  var zweef = document.createElement('button');
  zweef.type = 'button';
  zweef.id = 'zweefknop';
  zweef.className = 'zweefknop';
  zweef.textContent = 'Controleer antwoorden';
  zweef.setAttribute('aria-label', 'Controleer antwoorden: kijk alleen de ingevulde antwoorden na');
  zweef.addEventListener('click', function () { origineel.click(); });
  document.body.appendChild(zweef);
  document.body.classList.add('heeft-zweefknop');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (items) { zweef.hidden = items[0].isIntersecting; }).observe(origineel);
  }
});

/* ---------- Meerkeuzepagina's (MP): willekeurige volgorde, pagina's van 15, nakijken ----------
   De pagina levert alleen de vragen: var myQuestions = [{question, answers:{a:..,b:..}, correctAnswer:'a', fixed:true?}].
   fixed:true = de volgorde van de antwoorden blijft zoals in de lijst (bijv. kleuren). */
klaar(function () {
  var quiz = document.getElementById('quiz');
  var uitslag = document.getElementById('results');
  var knopNakijken = document.getElementById('submit');
  if (!quiz || !uitslag || !knopNakijken || typeof myQuestions === 'undefined') { return; }

  var letters = 'abcdefgh';
  var vragen = schud(myQuestions.map(function (q, i) { return { q: q, nr: i }; })).map(function (v) {
    var sleutels = Object.keys(v.q.answers);
    var opties = sleutels.map(function (s) { return { tekst: v.q.answers[s], goed: s === v.q.correctAnswer }; });
    if (!v.q.fixed) { opties = schud(opties); }
    return { q: v.q, nr: v.nr, opties: opties };
  });

  var html = vragen.map(function (v) {
    var antw = v.opties.map(function (o, k) {
      return '<label><input type="radio" name="question' + v.nr + '" value="' + letters[k] + '">' + letters[k] + ': ' + o.tekst + '</label>';
    }).join('');
    return '<div class="vraag-blok"><div class="question" tabindex="-1">' + v.q.question + '</div><div class="answers">' + antw + '</div></div>';
  });
  quiz.innerHTML = html.join('');
  var blokken = Array.prototype.slice.call(quiz.querySelectorAll('.vraag-blok'));

  var pag = maakPaginering(blokken, knopNakijken.parentNode, knopNakijken, function (blok) { return blok.querySelector('.question'); });

  knopNakijken.onclick = function () {
    var aantal = pag.getoond();
    var goed = 0;
    for (var i = 0; i < aantal; i++) {
      var antwoorden = blokken[i].querySelector('.answers');
      var gekozen = antwoorden.querySelector('input:checked');
      var juist = gekozen && vragen[i].opties[letters.indexOf(gekozen.value)].goed;
      /* Alleen het gekozen antwoord krijgt een kleur: goed = groen en vet, fout = rood en rustig.
         Het juiste antwoord wordt bij een fout niet verklapt, zodat een tweede ronde mogelijk blijft. */
      Array.prototype.forEach.call(antwoorden.querySelectorAll('label'), function (l) {
        l.classList.remove('optie-goed', 'optie-fout');
      });
      if (gekozen) { gekozen.parentNode.classList.add(juist ? 'optie-goed' : 'optie-fout'); }
      if (juist) { goed++; }
      markeer(antwoorden, !!juist);
    }
    uitslag.innerHTML = goed + ' van de ' + aantal + ' goed';
  };
});

/* ---------- Zwevende knop "Controleer nu" voor de meerkeuzepagina's (MP) ----------
   Klikt op de gewone knop, dus het nakijken blijft precies hetzelfde en de pagina blijft op dezelfde plek staan.
   Zodra de gewone knop zelf in beeld is, verdwijnt de zwevende knop. */
klaar(function () {
  var origineel = document.getElementById('submit');
  var uitslag = document.getElementById('results');
  if (!origineel || !uitslag || !document.getElementById('quiz')) { return; }

  var zweef = document.createElement('button');
  zweef.type = 'button';
  zweef.id = 'zweefknop';
  zweef.className = 'zweefknop';
  zweef.textContent = 'Controleer nu';
  zweef.setAttribute('aria-label', 'Controleer nu: kijk je antwoorden na en toon je score');
  zweef.addEventListener('click', function () { origineel.click(); });
  document.body.appendChild(zweef);
  document.body.classList.add('heeft-zweefknop');

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (items) {
      zweef.hidden = items[0].isIntersecting;
    }).observe(origineel);
  }
});

/* ---------- Beginpagina (index.html, met jQuery) ---------- */
if (window.jQuery) {
  jQuery(function ($) {
    /* Soepel scrollen naar een onderdeel via het menu en de knop "Naar Top" */
    $(".navbar a, footer a[href='#myPage']").on('click', function (event) {
      if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({ scrollTop: $(hash).offset().top }, 900, function () {
          window.location.hash = hash;
        });
      }
    });
    /* Blokjes verschijnen tijdens het scrollen (klasse .slide) */
    $(window).scroll(function () {
      $(".slideanim").each(function () {
        var pos = $(this).offset().top;
        var winTop = $(window).scrollTop();
        if (pos < winTop + 600) { $(this).addClass("slide"); }
      });
    });
  });
}

/* KB-vragen: elke vraag met eigen invoerveld, antwoord en terugkoppeling in een eigen kader (zie .kb-item in 123school.css) */
klaar(function () {
  var knoppen = document.querySelectorAll('button.vraag-knop');
  for (var i = 0; i < knoppen.length; i++) {
    var ouder = knoppen[i].parentNode;
    if (ouder && ouder !== document.body && ouder.tagName === 'DIV') { ouder.classList.add('kb-item'); }
  }
});
