// ── Accordion: main cards ──
function toggleCard(hd) {
  const card = hd.closest('.card');
  card.classList.toggle('open');
}

// ── Sub-accordion ──
function toggleSub(hd) {
  const sub = hd.closest('.sub-card');
  sub.classList.toggle('open');
}

// ── Drawer ──
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-bg').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-bg').classList.remove('open');
  document.body.style.overflow = '';
}

function navTo(id) {
  closeDrawer();
  const el = document.getElementById(id);
  if (!el) return;
  // Open card if it's a card
  const card = el.classList.contains('card') ? el : el.closest('.card');
  if (card && !card.classList.contains('open')) card.classList.add('open');
  setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

// ── Global Search ──
const searchData = [];
document.querySelectorAll('#grammar tbody tr, #vocabulary tbody tr, #glossary tbody tr, #verbs tbody tr').forEach(row => {
  const cells = row.querySelectorAll('td');
  if (cells.length < 2) return;
  const sectionEl = row.closest('section');
  const section = sectionEl ? sectionEl.id : '';
  const cardEl = row.closest('.card');
  const cardId = cardEl ? cardEl.id : '';
  const subCardEl = row.closest('.sub-card');
  let subCardIdx = -1;
  if (subCardEl && cardEl) {
    subCardIdx = Array.from(cardEl.querySelectorAll('.sub-card')).indexOf(subCardEl);
  }

  let de, en, extra = '';
  if (section === 'verbs') {
    // col0=Infinitiv (may contain modal-badge span), col1=Präteritum, col2=Perfekt, col3=Meaning
    const col0Clone = cells[0].cloneNode(true);
    col0Clone.querySelectorAll('.modal-badge').forEach(b => b.remove());
    de = col0Clone.textContent.trim();
    en = cells[3] ? cells[3].textContent.trim() : '';
    // also index Präteritum & Perfekt so users can search by any form
    extra = (cells[1] ? cells[1].textContent.trim() : '') + ' ' +
            (cells[2] ? cells[2].textContent.trim() : '');
  } else {
    de = cells[0].textContent.trim();
    en = cells[1].textContent.trim();
  }

  if (!de) return;
  searchData.push({ de, en, extra, section, cardId, subCardIdx });
});

function openSearch() {
  document.getElementById('search-bg').classList.add('open');
  document.getElementById('search-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('gsearch').focus(), 100);
}
function closeSearch() {
  document.getElementById('search-bg').classList.remove('open');
  document.getElementById('search-modal').classList.remove('open');
  document.getElementById('gsearch').value = '';
  document.getElementById('sm-results').innerHTML = '<div class="sm-empty">Tippe etwas, um zu suchen …</div>';
  document.body.style.overflow = '';
}

document.getElementById('gsearch').addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  const resultsEl = document.getElementById('sm-results');
  if (!q) {
    resultsEl.innerHTML = '<div class="sm-empty">Tippe etwas, um zu suchen …</div>';
    return;
  }
  const matches = searchData.filter(d =>
    d.de.toLowerCase().includes(q) ||
    d.en.toLowerCase().includes(q) ||
    (d.extra && d.extra.toLowerCase().includes(q))
  ).slice(0, 30);

  if (!matches.length) {
    resultsEl.innerHTML = '<div class="sm-empty">Keine Ergebnisse gefunden.</div>';
    return;
  }
  resultsEl.innerHTML = matches.map(m => {
    const idx = searchData.indexOf(m);
    const sType = m.section === 'vocabulary' ? 'v' : m.section === 'grammar' ? 'g' : m.section === 'verbs' ? 'vb' : 'gl';
    const sLabel = m.section === 'vocabulary' ? 'Wortschatz' : m.section === 'grammar' ? 'Grammatik' : m.section === 'verbs' ? 'Verben' : 'Glossar';
    return `<div class="sm-item" onclick="goToResult(${idx})">
      <div class="sm-item-text">
        <div class="sm-de">${m.de}</div>
        <div class="sm-en">${m.en}</div>
      </div>
      <span class="sm-tag ${sType}">${sLabel}</span>
    </div>`;
  }).join('');
});

function goToResult(idx) {
  const item = searchData[idx];
  closeSearch();
  if (!item || !item.cardId) return;
  const card = document.getElementById(item.cardId);
  if (!card) return;
  // Open main card
  card.classList.add('open');
  // Open the specific sub-card (e.g. a grammar pattern) if applicable
  if (item.subCardIdx >= 0) {
    const subCards = card.querySelectorAll('.sub-card');
    if (subCards[item.subCardIdx]) subCards[item.subCardIdx].classList.add('open');
  }
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSearch();
    closeDrawer();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
});

// ── Vocabulary Inline Filter ──
const vsearch = document.getElementById('vsearch');
const vcountEl = document.getElementById('vsearch-count');
let totalRows = 0;

vsearch.addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  const rows = document.querySelectorAll('#vocabulary tbody tr');
  totalRows = rows.length;
  let shown = 0;

  rows.forEach(row => {
    if (!q) {
      row.classList.remove('v-hidden');
      shown++;
    } else {
      const match = row.textContent.toLowerCase().includes(q);
      row.classList.toggle('v-hidden', !match);
      if (match) shown++;
    }
  });

  // Open all vocab cards if filtering
  if (q) {
    document.querySelectorAll('#vocabulary .card').forEach(c => c.classList.add('open'));
    vcountEl.textContent = `${shown} von ${totalRows} Einträgen gefunden`;
  } else {
    vcountEl.textContent = '';
  }
});

// ── Progress Bar ──
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

// ── Active section chip highlighting ──
const sections = [
  { id: 'grammar',    chip: 'grammar' },
  { id: 'vocabulary', chip: 'vocabulary' },
  { id: 'glossary',   chip: 'glossary' },
  { id: 'verbs',      chip: 'verbs' }
];

const chips = document.querySelectorAll('.section-nav .chip');

const sectionEls = sections.map(s => document.getElementById(s.id)).filter(Boolean);

const chipObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      chips.forEach(c => {
        c.classList.toggle('active', c.dataset.sec === id);
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sectionEls.forEach(el => chipObserver.observe(el));

// ── Reveal on scroll ──
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('vis');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ── Feature 1: Mark as learned (vocabulary rows) ──
const learnedSet = new Set(JSON.parse(localStorage.getItem('de-a1-learned') || '[]'));

document.querySelectorAll('#vocabulary tbody tr').forEach(row => {
  const key = row.querySelector('td')?.textContent.trim().slice(0, 60);
  if (!key) return;
  if (learnedSet.has(key)) row.classList.add('learned');

  row.addEventListener('click', e => {
    if (window.getSelection().toString()) return;        // allow text selection
    if (e.target.closest('.speak-btn')) return;         // don't clash with speak btn
    if (document.getElementById('vocabulary').classList.contains('hide-en')) return; // hide-en mode handles click
    row.classList.toggle('learned');
    learnedSet[row.classList.contains('learned') ? 'add' : 'delete'](key);
    localStorage.setItem('de-a1-learned', JSON.stringify([...learnedSet]));
  });
});

// ── Feature 2: Read aloud (all rows, browser speechSynthesis) ──
if (window.speechSynthesis) {
  const speakSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;

  document.querySelectorAll('tbody tr').forEach(row => {
    const firstTd = row.querySelector('td');
    if (!firstTd) return;
    const rawText = firstTd.textContent.trim();
    if (!rawText || rawText.length < 2) return;

    const btn = document.createElement('button');
    btn.className = 'speak-btn';
    btn.innerHTML = speakSVG;
    btn.title = 'Vorlesen (de-DE)';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(rawText);
      utt.lang = 'de-DE';
      utt.rate = 0.88;
      speechSynthesis.speak(utt);
      btn.classList.add('active');
      utt.onend = () => btn.classList.remove('active');
      setTimeout(() => btn.classList.remove('active'), 4000); // fallback
    });
    firstTd.appendChild(btn);
  });

  // ── Extra: speak buttons for verbs table columns 2 & 3 (Präteritum, Perfekt) ──
  function makeSpeakBtn(text) {
    const b = document.createElement('button');
    b.className = 'speak-btn';
    b.innerHTML = speakSVG;
    b.title = 'Vorlesen (de-DE)';
    b.addEventListener('click', e => {
      e.stopPropagation();
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'de-DE';
      utt.rate = 0.88;
      speechSynthesis.speak(utt);
      b.classList.add('active');
      utt.onend = () => b.classList.remove('active');
      setTimeout(() => b.classList.remove('active'), 4000);
    });
    return b;
  }

  document.querySelectorAll('.verbs-table tbody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    [1, 2].forEach(idx => {
      const cell = cells[idx];
      if (!cell) return;
      const rawText = cell.textContent.trim();
      if (!rawText || rawText.length < 2) return;
      cell.appendChild(makeSpeakBtn(rawText));
    });
  });
}

// Mark only tables whose 2nd header is actually "English"
document.querySelectorAll('#vocabulary table').forEach(table => {
  const th2 = table.querySelector('thead th:nth-child(2)');
  if (th2 && th2.textContent.trim().toLowerCase().includes('english')) {
    table.classList.add('en-table');
  }
});

// ── Feature 3 & 4: Language Mode (vocabulary & verbs) ──
function setupLangMode(modeEl, sectionEl, onModeChange) {
  modeEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      sectionEl.classList.remove('hide-en', 'hide-de');
      sectionEl.querySelectorAll('tr.peeked').forEach(r => r.classList.remove('peeked'));
      if (mode) sectionEl.classList.add(mode);
      modeEl.dataset.active = mode;
      if (onModeChange) onModeChange(mode);
    });
  });
  sectionEl.querySelectorAll('tbody tr').forEach(row => {
    row.addEventListener('click', e => {
      if (!sectionEl.classList.contains('hide-en') && !sectionEl.classList.contains('hide-de')) return;
      if (e.target.closest('.speak-btn')) return;
      row.classList.toggle('peeked');
    });
  });
}

const vocabEl = document.getElementById('vocabulary');
setupLangMode(document.getElementById('vocab-lang-mode'), vocabEl);

const verbsEl = document.getElementById('verbs');
setupLangMode(document.getElementById('verbs-lang-mode'), verbsEl, (mode) => {
  if (mode) {
    const card = document.getElementById('strong-verbs');
    if (card && !card.classList.contains('open')) card.classList.add('open');
  }
});

// ── Hero cards smooth scroll ──
document.querySelectorAll('.hero-card').forEach(card => {
  card.addEventListener('click', () => {
    const href = card.getAttribute('href');
    if (href) {
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
