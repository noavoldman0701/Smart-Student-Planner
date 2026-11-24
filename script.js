/* ============================================================
   Smart Student Planner – קוד JavaScript
   מערכת אישית לניהול לימודים אקדמיים: קורסים, מערכת שעות,
   מטלות, לוח שנה, ציונים, ממוצעים ותכנון התואר.
   ============================================================ */
'use strict';


/* ============================================================
   כלי עזר
   קיצורים ל־DOM, תאריכים, שעות, מספרים, תוויות בעברית ואייקונים
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (s, n) => {
  const d = pd(s);
  d.setDate(d.getDate() + n);
  return ds(d);
};

const todayS = () => ds(new Date());
const dow = s => pd(s).getDay();
const weekStart = s => addDays(s, -dow(s));
const daysBetween = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const tmin = t => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const isNum = v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
const num = v => (isNum(v) ? Number(v) : null);
const fmt = (s, o) =>
  s
    ? new Intl.DateTimeFormat(
        'he-IL',
        o || { day: 'numeric', month: 'long', year: 'numeric' }
      ).format(pd(s))
    : '';
const fmtShort = s => fmt(s, { day: 'numeric', month: 'short' });
const fmtAvg = v => (v == null ? '—' : v.toFixed(2));
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_S = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];
const HEB_LETTERS = 'אבגדהוזחטי';

const CST = {
  notStarted: 'טרם התחיל',
  inProgress: 'בתהליך',
  completed: 'הושלם',
  failed: 'נכשל',
  cancelled: 'בוטל',
};

const TT = {
  homework: 'שיעורי בית',
  exercise: 'תרגיל',
  paper: 'עבודה',
  project: 'פרויקט',
  quiz: 'בוחן',
  exam: 'מבחן',
  personal: 'משימה אישית',
};

const TS = { todo: 'לא התחלתי', doing: 'בתהליך', done: 'הושלם', cancelled: 'בוטל' };
const PR = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const LT = { lecture: 'הרצאה', practice: 'תרגול', lab: 'מעבדה', seminar: 'סמינר', other: 'אחר' };
const ET = { personal: 'אירוע אישי', vacation: 'חופשה', academic: 'אירוע אקדמי', other: 'אחר' };
const MT = {
  summary: 'סיכום שיעור',
  slides: 'מצגת',
  article: 'מאמר',
  doc: 'מסמך',
  pdf: 'קובץ PDF',
  link: 'קישור לאתר',
  video: 'סרטון',
  note: 'הערה אישית',
};

const COMPT = {
  final: 'מבחן סופי',
  midterm: 'מבחן אמצע',
  paper: 'עבודה',
  exercise: 'תרגילים',
  quiz: 'בחנים',
  project: 'פרויקט',
  other: 'אחר',
};

const GT = { numeric: 'ציון מספרי', pass: 'עובר / נכשל', none: 'ללא ציון' };
const CK = {
  lesson: ['שיעורים', '#6E9374', '▪'],
  exam: ['מבחנים', '#C2577F', '◆'],
  quiz: ['בחנים', '#D98AA5', '◇'],
  deadline: ['מועדי הגשה', '#B07A4F', '✎'],
  task: ['משימות', '#5E8C6A', '○'],
  vacation: ['חופשות', '#D8A657', '☼'],
  personal: ['אירועים אישיים', '#E39BB2', '●'],
  academic: ['אירועים אקדמיים', '#8C7FA8', '★'],
  semester: ['תחילת וסיום סמסטר', '#857A72', '✦'],
};

const OLD_PALETTE = [
  '#F7C6D6',
  '#D9CCF5',
  '#C4E1F5',
  '#C3EAD5',
  '#FBE1C4',
  '#F2CDEB',
  '#CBDDF7',
  '#DDF0C3',
  '#F8D6CC',
  '#CDEEEB',
  '#E9D5F7',
  '#F5E6B8',
];
const OLD_PALETTE2 = [
  '#E23E8F',
  '#8E4DD8',
  '#5B6CF0',
  '#2FA37A',
  '#E08A2E',
  '#B83FC4',
  '#3C8DD9',
  '#7FA32F',
  '#E5603F',
  '#1FA3A3',
  '#9D5CE6',
  '#C9A11F',
];
const PALETTE = [
  '#C2577F',
  '#6E9374',
  '#C98A4B',
  '#8C7FB0',
  '#5E8FA8',
  '#D47A6A',
  '#A07856',
  '#7FA36B',
  '#B8668E',
  '#4F8C86',
  '#C9A24B',
  '#9A6B8F',
];

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h8"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M5 20V11M11 20V4M17 20v-6M3 20h18"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  flask:
    '<path d="M9 3h6M10 3v6L4.3 19a2 2 0 0 0 1.7 3h12a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  pdf: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 14h8M8 17h5"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 11h6M9 15h6"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
  article: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  summary: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  upload: '<path d="M12 21V9m-5 5 5-5 5 5M4 3h16"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  sparkle:
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
};

const ic = (n, cls = '') =>
  `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;


/* ============================================================
   מצב הנתונים
   מבנה הנתונים של המערכת וערכי ברירת המחדל
   ============================================================ */
const KEYS = ['settings', 'years', 'courses', 'lessons', 'tasks', 'events', 'materials'];
function mkSem(name, kind) {
  return { id: uid(), name, kind, start: '', end: '' };
}

function defaultState() {
  const years = [0, 1, 2].map(i => ({
    id: uid(),
    name: `שנה ${HEB_LETTERS[i]}'`,
    label: '',
    semesters: [mkSem("סמסטר א'", 'A'), mkSem("סמסטר ב'", 'B')],
  }));
  return {
    settings: {
      degreeName: '',
      university: '',
      startYear: '',
      requiredCredits: null,
      activeYearId: years[0].id,
      activeSemesterId: years[0].semesters[0].id,
      accent: 'lilac',
      entryAlerts: true,
      defaults: { lessonType: 'lecture', taskPriority: 'medium', calView: 'month' },
      avg: { retake: 'last', includeFailed: true },
    },
    years,
    courses: [],
    lessons: [],
    tasks: [],
    events: [],
    materials: [],
  };
}

function normalize(d) {
  d = d || {};
  const b = defaultState();
  const o = { settings: { ...b.settings, ...(d.settings || {}) } };
  o.settings.defaults = { ...b.settings.defaults, ...((d.settings || {}).defaults || {}) };
  o.settings.avg = { ...b.settings.avg, ...((d.settings || {}).avg || {}) };
  o.years = Array.isArray(d.years) && d.years.length ? d.years : b.years;
  o.years.forEach(y => {
    if (!Array.isArray(y.semesters)) y.semesters = [];
  });
  ['courses', 'lessons', 'tasks', 'events', 'materials'].forEach(
    k => (o[k] = Array.isArray(d[k]) ? d[k] : [])
  );
  o.courses.forEach(c => {
    let i = OLD_PALETTE.indexOf(c.color);
    if (i < 0) i = OLD_PALETTE2.indexOf(c.color);
    if (i >= 0) c.color = PALETTE[i];
  });
  if (o.settings.entryAlerts === undefined) o.settings.entryAlerts = true;
  fixActive(o);
  return o;
}

function fixActive(o) {
  let y = o.years.find(y => y.id === o.settings.activeYearId) || o.years[0];
  o.settings.activeYearId = y ? y.id : null;
  if (y && !y.semesters.some(s => s.id === o.settings.activeSemesterId))
    o.settings.activeSemesterId = y.semesters[0] ? y.semesters[0].id : null;
}

let S = defaultState();
let FRESH = true; // no saved data yet


/* ============================================================
   שמירת נתונים
   שמירה בחשבון (כשזמין) ובדפדפן במכשיר, עם סנכרון אוטומטי
   ============================================================ */
const LS = 'ssp-data-v1';
const Store = {
  db: null,
  uid: null,
  last: {},
  timer: null,
  chains: {},
  mode: 'local',
  loadLocal() {
    try {
      const r = localStorage.getItem(LS);
      if (r) return JSON.parse(r);
    } catch (e) {}
    return null;
  },
  saveLocal() {
    try {
      localStorage.setItem(LS, JSON.stringify(S));
    } catch (e) {}
  },
  setMode(m) {
    this.mode = m;
    const el = $('#savest');
    if (!el) return;
    el.classList.toggle('local', m !== 'cloud');
    el.lastElementChild.textContent = m === 'cloud' ? 'נשמר בחשבון שלך' : 'נשמר במכשיר זה';
    el.title =
      m === 'cloud'
        ? 'הנתונים נשמרים בחשבון שלך וזמינים מכל מכשיר'
        : 'הנתונים נשמרים בדפדפן במכשיר הזה. מומלץ לגבות מדי פעם מההגדרות.';
  },
  async connect() {
    if (!(window.claude && typeof window.claude.use === 'function')) return this.setMode('local');
    try {
      const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
      if (!db || !user) return this.setMode('local');
      const id = await user.id();
      if (!id) return this.setMode('local');
      const snaps = await Promise.race([
        Promise.all(KEYS.map(k => db.doc(`data/users/${id}/${k}`).get())),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
      ]);
      this.db = db;
      this.uid = id;
      const remote = {};
      let any = false;
      snaps.forEach((s, i) => {
        if (s.exists) {
          any = true;
          remote[KEYS[i]] = (s.data() || {}).v;
        }
      });
      if (any) {
        S = normalize(remote);
        FRESH = false;
        KEYS.forEach(
          k => (this.last[k] = JSON.stringify(remote[k] === undefined ? null : remote[k]))
        );
        this.saveLocal();
        render();
      }
      this.setMode('cloud');
      if (!any && !FRESH) this.flush();
    } catch (e) {
      this.db = null;
      this.setMode('local');
    }
  },
  save() {
    FRESH = false;
    this.saveLocal();
    if (this.db) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 600);
    }
  },
  flush() {
    if (!this.db) return;
    KEYS.forEach(k => {
      const j = JSON.stringify(S[k]);
      if (j === this.last[k]) return;
      this.last[k] = j;
      const ref = this.db.doc(`data/users/${this.uid}/${k}`);
      this.chains[k] = (this.chains[k] || Promise.resolve())
        .then(() => ref.set({ v: JSON.parse(j) }))
        .catch(e => {
          this.last[k] = null;
          const c = e && e.code;
          if (c === 'quota_exceeded')
            toast('לא הצלחתי לשמור בחשבון: נגמר מקום האחסון. הנתונים עדיין שמורים במכשיר.', 'err');
          else if (c === 'revoked' || c === 'not_granted' || c === 'invalid_argument') {
            this.db = null;
            this.setMode('local');
          }
        });
    });
  },
};

function commit(msg) {
  fixActive(S);
  Store.save();
  render();
  if (msg) toast(msg, 'ok');
}


/* ============================================================
   עזרים למבנה התואר
   שנים, סמסטרים, קורסים וטווחי תאריכים
   ============================================================ */
const yearById = id => S.years.find(y => y.id === id);
const semById = id => {
  for (const y of S.years) {
    const s = y.semesters.find(s => s.id === id);
    if (s) return s;
  }
  return null;
};

const yearOfSem = id => S.years.find(y => y.semesters.some(s => s.id === id));
const courseById = id => S.courses.find(c => c.id === id);
const courseName = id => {
  const c = courseById(id);
  return c ? c.name : '';
};

const courseColor = id => {
  const c = courseById(id);
  return c ? c.color : '#EEE';
};

const semLabel = (yid, sid) => {
  const y = yearById(yid);
  if (sid === 'annual') return `${y ? y.name : ''} · שנתי`;
  const s = semById(sid);
  return `${y ? y.name : ''}${s ? ' · ' + s.name : ''}`;
};

const yearIdx = id => S.years.findIndex(y => y.id === id);
function courseOrder(c) {
  const yi = yearIdx(c.yearId);
  const y = yearById(c.yearId);
  let si =
    c.semesterId === 'annual' ? 5 : y ? y.semesters.findIndex(s => s.id === c.semesterId) : 0;
  return yi * 10 + si;
}

function semRange(c) {
  const y = yearById(c.yearId);
  if (!y) return [null, null];
  if (c.semesterId === 'annual') {
    const st = y.semesters
        .map(s => s.start)
        .filter(Boolean)
        .sort(),
      en = y.semesters
        .map(s => s.end)
        .filter(Boolean)
        .sort();
    return [st[0] || null, en[en.length - 1] || null];
  }
  const s = semById(c.semesterId);
  return s ? [s.start || null, s.end || null] : [null, null];
}

const inSem = (c, yid, sid) =>
  c.yearId === yid &&
  (sid === 'all' || c.semesterId === sid || (c.semesterId === 'annual' && sid !== 'annual'));
const activeYear = () => yearById(S.settings.activeYearId);
const activeSem = () => semById(S.settings.activeSemesterId);
function yearOpts() {
  return S.years.map(y => [y.id, y.name]);
}

function semOpts(yid, { annual = true, all = false } = {}) {
  const y = yearById(yid);
  const o = [];
  if (all) o.push(['all', 'כל הסמסטרים']);
  if (y) y.semesters.forEach(s => o.push([s.id, s.name]));
  if (annual) o.push(['annual', 'קורס שנתי']);
  return o;
}

function nextColor() {
  const used = S.courses.map(c => c.color);
  return PALETTE.find(p => !used.includes(p)) || PALETTE[S.courses.length % PALETTE.length];
}


/* ============================================================
   ציונים וממוצעים
   ממוצע משוקלל, כללי לימוד חוזר, רכיבי הערכה והתקדמות בנ״ז
   ============================================================ */
function countedCourses() {
  const a = S.settings.avg;
  let cs = S.courses.filter(
    c =>
      c.status !== 'cancelled' &&
      (c.gradeType || 'numeric') === 'numeric' &&
      isNum(c.finalGrade) &&
      c.includeInAvg !== false &&
      num(c.credits) > 0 &&
      (c.status !== 'failed' || a.includeFailed)
  );
  if (a.retake === 'all') return cs;
  const root = c => {
    let cur = c,
      seen = new Set();
    while (cur.retakeOf && !seen.has(cur.id)) {
      seen.add(cur.id);
      const p = courseById(cur.retakeOf);
      if (!p) break;
      cur = p;
    }
    return cur.id;
  };
  const groups = {};
  cs.forEach(c => {
    (groups[root(c)] = groups[root(c)] || []).push(c);
  });
  return Object.values(groups).map(g =>
    a.retake === 'best'
      ? g.reduce((m, c) => (num(c.finalGrade) > num(m.finalGrade) ? c : m))
      : g.reduce((m, c) => (courseOrder(c) >= courseOrder(m) ? c : m))
  );
}

function wavg(list) {
  let w = 0,
    s = 0;
  list.forEach(c => {
    const cr = num(c.credits),
      g = num(c.finalGrade);
    if (cr > 0 && g != null) {
      w += cr;
      s += cr * g;
    }
  });
  return w ? s / w : null;
}

const avg = pred => wavg(countedCourses().filter(pred));
function semesterSeries() {
  const out = [];
  S.years.forEach(y =>
    y.semesters.forEach(s => {
      const v = avg(c => c.semesterId === s.id);
      if (v != null)
        out.push({
          label: `${y.name.replace('שנה ', 'ש׳ ')} ${s.name.replace('סמסטר ', 'סמ׳ ')}`,
          full: `${y.name} · ${s.name}`,
          v,
        });
    })
  );
  return out;
}

function compGrade(c) {
  const comps = (c.components || []).filter(x => isNum(x.weight));
  const done = comps.filter(x => isNum(x.grade));
  const tw = comps.reduce((a, x) => a + num(x.weight), 0);
  const dw = done.reduce((a, x) => a + num(x.weight), 0);
  const pts = done.reduce((a, x) => a + num(x.weight) * num(x.grade), 0);
  return {
    tw,
    dw,
    cur: dw ? pts / dw : null,
    pts: pts / 100,
    final: dw && Math.abs(dw - 100) < 0.01 ? pts / 100 : null,
  };
}

function progress() {
  const live = S.courses.filter(c => c.status !== 'cancelled');
  const cr = st => live.filter(c => c.status === st).reduce((a, c) => a + (num(c.credits) || 0), 0);
  const req = num(S.settings.requiredCredits);
  const done = cr('completed'),
    act = cr('inProgress'),
    fut = cr('notStarted');
  return {
    req,
    done,
    act,
    fut,
    left: req != null ? Math.max(0, req - done) : null,
    pct: req ? Math.min(100, (done / req) * 100) : null,
    nDone: live.filter(c => c.status === 'completed').length,
  };
}


/* ============================================================
   מטלות ואירועים
   איחורים, תעדוף, מפגשי שיעורים ופריטי לוח השנה
   ============================================================ */
const isExam = t => t.type === 'exam' || t.type === 'quiz';
const isOpen = t => t.status === 'todo' || t.status === 'doing';
function isOverdue(t) {
  if (!isOpen(t) || !t.due) return false;
  const td = todayS();
  if (t.due < td) return true;
  if (t.due === td && t.time && tmin(t.time) < nowMin()) return true;
  return false;
}

const byDue = (a, b) =>
  (a.due || '9999').localeCompare(b.due || '9999') ||
  (a.time || '99').localeCompare(b.time || '99');
function relDue(t) {
  if (!t.due) return '';
  const d = daysBetween(todayS(), t.due);
  if (isOverdue(t))
    return `<span class="over">באיחור${d < 0 ? ` של ${-d} ${-d === 1 ? 'יום' : 'ימים'}` : ''}</span>`;
  if (d === 0) return '<span class="soon">היום</span>';
  if (d === 1) return '<span class="soon">מחר</span>';
  if (d <= 3) return `<span class="soon">בעוד ${d} ימים</span>`;
  return `בעוד ${d} ימים`;
}

function prioScore(t) {
  const d = t.due ? daysBetween(todayS(), t.due) : 60;
  const p = { high: 4, medium: 2, low: 0 }[t.priority] || 0;
  return (isOverdue(t) ? -100 : 0) + d - p - (t.status === 'doing' ? 0.5 : 0);
}

function lessonRange(l) {
  const c = courseById(l.courseId);
  const [ss, se] = c ? semRange(c) : [null, null];
  return [l.startDate || ss, l.endDate || se];
}

function occurrences(from, to, filter) {
  const out = [];
  S.lessons.forEach(l => {
    const c = courseById(l.courseId);
    if (!c || c.status === 'cancelled') return;
    if (filter && !filter(l, c)) return;
    if (l.oneTime) {
      if (l.date && l.date >= from && l.date <= to) out.push({ l, c, date: l.date });
      return;
    }
    const [a, b] = lessonRange(l);
    let st = a && a > from ? a : from,
      en = b && b < to ? b : to;
    let d = st;
    const off = (Number(l.day) - dow(d) + 7) % 7;
    d = addDays(d, off);
    for (; d <= en; d = addDays(d, 7))
      if (!(l.cancelled || []).includes(d)) out.push({ l, c, date: d });
  });
  return out.sort(
    (x, y) => x.date.localeCompare(y.date) || (x.l.start || '').localeCompare(y.l.start || '')
  );
}

function taskKind(t) {
  return t.type === 'exam'
    ? 'exam'
    : t.type === 'quiz'
      ? 'quiz'
      : t.type === 'personal'
        ? 'task'
        : 'deadline';
}

function calItems(from, to) {
  const items = [];
  occurrences(from, to).forEach(o =>
    items.push({
      kind: 'lesson',
      id: o.l.id,
      date: o.date,
      start: o.l.start,
      end: o.l.end,
      title: o.c.name,
      sub: LT[o.l.type] || '',
      color: o.c.color,
    })
  );
  S.tasks.forEach(t => {
    if (t.due && t.due >= from && t.due <= to && t.status !== 'cancelled')
      items.push({
        kind: taskKind(t),
        id: t.id,
        date: t.due,
        start: t.time || '',
        end: t.time && isExam(t) && t.endTime ? t.endTime : '',
        title: t.title,
        sub: courseName(t.courseId),
        done: t.status === 'done',
      });
  });
  S.events.forEach(e => {
    if (!e.date) return;
    const en = e.endDate && e.endDate > e.date ? e.endDate : e.date;
    for (let d = e.date > from ? e.date : from; d <= en && d <= to; d = addDays(d, 1))
      items.push({
        kind: e.type === 'vacation' ? 'vacation' : e.type === 'academic' ? 'academic' : 'personal',
        id: e.id,
        date: d,
        start: e.start || '',
        end: e.end || '',
        title: e.title,
        sub: ET[e.type] || '',
      });
  });
  S.years.forEach(y =>
    y.semesters.forEach(s => {
      [
        ['start', 'תחילת'],
        ['end', 'סיום'],
      ].forEach(([k, w]) => {
        if (s[k] && s[k] >= from && s[k] <= to)
          items.push({
            kind: 'semester',
            id: s.id,
            date: s[k],
            title: `${w} ${s.name} · ${y.name}`,
            sub: '',
          });
      });
    })
  );
  return items.sort(
    (a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || '')
  );
}

function markConflicts(items) {
  const byDay = {};
  items.forEach(i => {
    if (i.start && i.end && tmin(i.end) > tmin(i.start))
      (byDay[i.date] = byDay[i.date] || []).push(i);
  });
  Object.values(byDay).forEach(arr => {
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        if (tmin(arr[i].start) < tmin(arr[j].end) && tmin(arr[j].start) < tmin(arr[i].end)) {
          arr[i].conf = arr[j].conf = true;
        }
      }
  });
  return items;
}


/* ============================================================
   רכיבי ממשק
   הודעות, שדות טופס, חלונות ואישור פעולה
   ============================================================ */
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(
    () => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(() => t.remove(), 300);
    },
    kind === 'err' ? 5000 : 2600
  );
}

const fld = (label, inner, o = {}) =>
  `<label class="fld ${o.full ? 'full' : ''}"><span>${label}${o.req ? ' <b class="req" aria-hidden="true">*</b>' : ''}</span>${inner}${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
const inp = (name, val, type = 'text', extra = '') =>
  `<input name="${name}" type="${type}" value="${esc(val ?? '')}" ${extra}>`;
const sel = (name, opts, val, extra = '') =>
  `<select name="${name}" ${extra}>${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(val ?? '') ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const ta = (name, val) => `<textarea name="${name}" rows="3">${esc(val || '')}</textarea>`;
const chk = (name, checked, label) =>
  `<label class="chk">
    <input type="checkbox" name="${name}" ${checked ? 'checked' : ''}> ${label}</label>`;
const objOpts = o => Object.entries(o);
const courseOpts = blank => [
  ...(blank ? [['', blank]] : []),
  ...S.courses
    .slice()
    .sort((a, b) => courseOrder(a) - courseOrder(b) || a.name.localeCompare(b.name, 'he'))
    .map(c => [c.id, c.name + (c.code ? ` (${c.code})` : '')]),
];
function emptyState(icon, title, text, btn) {
  return `<div class="empty">
    <div class="em-ic">${ic(icon)}</div><b>${title}</b>
    <p>${text}</p>${btn || ''}</div>`;
}

const modalStack = [];
function modal({ title, body, submit = 'שמירה', onSubmit, wide, extra = '', onOpen }) {
  const ov = document.createElement('div');
  ov.className = 'ov';
  const hid = 'mh' + uid();
  ov.innerHTML = `<div class="mdl ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="${hid}">
    <form novalidate>
    <div class="mh">
    <h2 id="${hid}">${title}</h2>
    <button type="button" class="ib" data-close aria-label="סגירה">${ic('x')}</button>
    </div>
    <div class="mbd">${body}</div>
    <div class="mf">
    <div class="err" role="alert">
    </div>${extra}<div class="left">${onSubmit ? `<button class="btn pri" type="submit">${submit}</button>` : ''}<button type="button" class="btn" data-close>${onSubmit ? 'ביטול' : 'סגירה'}</button>
    </div>
    </div>
    </form>
    </div>`;
  const prev = document.activeElement;
  document.body.appendChild(ov);
  modalStack.push(ov);
  const form = $('form', ov),
    err = $('.err', ov);
  const close = () => {
    ov.remove();
    const i = modalStack.indexOf(ov);
    if (i >= 0) modalStack.splice(i, 1);
    if (prev && prev.focus && document.body.contains(prev)) prev.focus();
  };
  ov._close = close;
  ov.addEventListener('mousedown', e => {
    if (e.target === ov) close();
  });
  $$('[data-close]', ov).forEach(b => (b.onclick = close));
  form.onsubmit = e => {
    e.preventDefault();
    if (!onSubmit) return close();
    $$('.fld.bad', form).forEach(f => f.classList.remove('bad'));
    const F = formData(form);
    const r = onSubmit(F, form);
    if (r && typeof r === 'object' && r.err) {
      err.textContent = r.err;
      err.classList.add('show');
      if (r.field) {
        const el = form.elements[r.field];
        if (el) {
          (el.closest('.fld') || el).classList.add('bad');
          el.focus();
        }
      }
      return;
    }
    if (typeof r === 'string') {
      err.textContent = r;
      err.classList.add('show');
      return;
    }
    if (r !== false) close();
  };
  setTimeout(() => {
    const f =
      $('input:not([type=hidden]):not([type=checkbox]),select,textarea', $('.mbd', ov)) ||
      $('button', ov);
    f && f.focus();
  }, 30);
  onOpen && onOpen(ov, form, close);
  return { ov, form, close };
}

function formData(form) {
  const fd = new FormData(form);
  const o = {};
  for (const [k, v] of fd.entries()) o[k] = typeof v === 'string' ? v.trim() : v;
  o.$all = k => fd.getAll(k);
  o.$chk = k => !!(form.elements[k] && form.elements[k].checked);
  return o;
}

function confirmBox(msg, onYes, { yes = 'מחיקה', danger = true, title = 'אישור פעולה' } = {}) {
  modal({
    title,
    body: `<p style="margin:4px 0 8px">${msg}</p>`,
    submit: yes,
    onSubmit: () => {
      onYes();
      return true;
    },
    onOpen: ov => {
      const b = $('button[type=submit]', ov);
      if (danger) {
        b.classList.remove('pri');
        b.classList.add('dng');
      }
      setTimeout(() => $('[data-close].btn', ov).focus(), 40);
    },
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalStack.length) {
    modalStack[modalStack.length - 1]._close();
  }
});
// dependent year->semester selects inside forms
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-yearsel]')) {
    const form = t.form || t.closest('.filters') || document;
    const s = $('[data-semsel]', form);
    if (s) {
      const o = semOpts(t.value, { annual: s.dataset.annual !== '0', all: s.dataset.all === '1' });
      s.innerHTML = o.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
});


/* ============================================================
   גרפים
   גרפי עמודות וקווים ב־SVG, מימין לשמאל
   ============================================================ */
function barChart({
  labels,
  series,
  max,
  height = 220,
  stacked = false,
  fmtV = v => v,
  showVals = true,
  line,
}) {
  if (!labels.length) return '';
  const W = Math.max(320, labels.length * (stacked ? 54 : Math.max(54, series.length * 26 + 20))),
    H = height,
    pl = 10,
    pr = 34,
    pt = 18,
    pb = 40;
  const vals = stacked
    ? labels.map((_, i) => series.reduce((a, s) => a + (s.data[i] || 0), 0))
    : series.flatMap(s => s.data.filter(v => v != null));
  const lineVals = line ? line.data.filter(v => v != null) : [];
  const raw = Math.max(1, ...vals, ...lineVals) * 1.12;
  const mx = max != null ? max : raw <= 8 ? Math.ceil(raw / 4) * 4 : Math.ceil(raw / 20) * 20;
  const iw = W - pl - pr,
    ih = H - pt - pb,
    bw = iw / labels.length,
    y = v => pt + ih - (v / mx) * ih,
    n0 = labels.length;
  let g = '';
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = (mx / ticks) * i;
    g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${W - pr + 6}" y="${y(v) + 4}" text-anchor="start" direction="ltr">${+v.toFixed(1)}</text>`;
  }
  labels.forEach((lb, i) => {
    const x0 = pl + bw * (n0 - 1 - i);
    if (stacked) {
      let acc = 0;
      series.forEach(s => {
        const v = s.data[i] || 0;
        if (v > 0) {
          const h = (v / mx) * ih;
          g += `<rect x="${x0 + bw * 0.22}" y="${y(acc + v)}" width="${bw * 0.56}" height="${h}" rx="5" fill="${s.color}"><title>${esc(lb)} · ${esc(s.name)}: ${fmtV(v)}</title></rect>`;
        }
        acc += v;
      });
      if (showVals && acc > 0)
        g += `<text class="vl" x="${x0 + bw / 2}" y="${y(acc) - 5}" text-anchor="middle">${fmtV(acc)}</text>`;
    } else {
      const n = series.length,
        gw = bw * 0.7,
        w = gw / n;
      series.forEach((s, j) => {
        const v = s.data[i];
        if (v == null) return;
        const xx = x0 + bw * 0.15 + w * j;
        g += `<rect x="${xx + 2}" y="${y(v)}" width="${Math.max(4, w - 4)}" height="${Math.max(0, pt + ih - y(v))}" rx="6" fill="${s.color}"><title>${esc(lb)} · ${esc(s.name)}: ${fmtV(v)}</title></rect>`;
        if (showVals)
          g += `<text class="vl" x="${xx + w / 2}" y="${y(v) - 5}" text-anchor="middle">${fmtV(v)}</text>`;
      });
    }
    g += `<text x="${x0 + bw / 2}" y="${H - pb + 16}" text-anchor="middle" direction="rtl" unicode-bidi="plaintext">${esc(lb.length > 14 ? lb.slice(0, 13) + '…' : lb)}</text>`;
  });
  if (line) {
    const pts = line.data
      .map((v, i) => (v == null ? null : [pl + bw * (n0 - 1 - i) + bw / 2, y(v)]))
      .filter(Boolean);
    if (pts.length) {
      g += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${line.color}" stroke-width="2.5" stroke-linejoin="round"/>`;
      pts.forEach(
        p =>
          (g += `<circle cx="${p[0]}" cy="${p[1]}" r="4" class="pt" stroke="${line.color}" stroke-width="2"/>`)
      );
    }
  }
  const leg = [...series.map(s => [s.name, s.color]), ...(line ? [[line.name, line.color]] : [])];
  return `<div style="overflow-x:auto">
    <svg class="chart" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 560)}px" role="img" aria-label="${esc(leg.map(l => l[0]).join(', '))}">${g}</svg>
    </div>${leg.length > 1 || line ? `<div class="chlegend">${leg.map(([n, c]) => `<span>
      <i class="dot" style="background:${c}"></i>${esc(n)}</span>`).join('')}</div>` : ''}`;
}

function lineChart({ labels, series, max, min = 0, height = 220 }) {
  if (!labels.length) return '';
  const W = Math.max(320, labels.length * 70),
    H = height,
    pl = 20,
    pr = 38,
    pt = 20,
    pb = 40;
  const vals = series.flatMap(s => s.data.filter(v => v != null));
  const mx = max != null ? max : Math.max(1, ...vals) * 1.1;
  const iw = W - pl - pr,
    ih = H - pt - pb,
    y = v => pt + ih - ((v - min) / (mx - min)) * ih,
    x = i =>
      pl + (labels.length === 1 ? iw / 2 : (iw * (labels.length - 1 - i)) / (labels.length - 1));
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const v = min + ((mx - min) / 4) * i;
    g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${W - pr + 6}" y="${y(v) + 4}" text-anchor="start" direction="ltr">${+v.toFixed(1)}</text>`;
  }
  labels.forEach(
    (l, i) =>
      (g += `<text x="${x(i)}" y="${H - pb + 16}" text-anchor="middle" direction="rtl" unicode-bidi="plaintext">${esc(l)}</text>`)
  );
  series.forEach(s => {
    const pts = s.data.map((v, i) => (v == null ? null : [x(i), y(v), v])).filter(Boolean);
    if (s.area && pts.length > 1)
      g += `<polygon points="${pts.map(p => p[0] + ',' + p[1]).join(' ')} ${pts[pts.length - 1][0]},${pt + ih} ${pts[0][0]},${pt + ih}" fill="${s.color}" opacity=".18"/>`;
    g += `<polyline points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="6 5"' : ''}/>`;
    pts.forEach(
      p =>
        (g += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="pt" stroke="${s.color}" stroke-width="2"><title>${esc(s.name)}: ${p[2].toFixed(1)}</title></circle><text class="vl" x="${p[0]}" y="${p[1] - 9}" text-anchor="middle">${p[2].toFixed(1)}</text>`)
    );
  });
  return `<div style="overflow-x:auto">
    <svg class="chart" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 560)}px" role="img" aria-label="${esc(series.map(s => s.name).join(', '))}">${g}</svg>
    </div>${series.length > 1 ? `<div class="chlegend">${series.map(s => `<span>
      <i class="dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''}`;
}


/* ============================================================
   ניווט ומעטפת
   תפריט, סרגל עליון, ניתוב לפי # וציור העמוד
   ============================================================ */
const NAV = [
  ['dashboard', 'דף הבית', 'home'],
  ['degree', 'התואר שלי', 'layers'],
  ['g', 'לימודים'],
  ['schedule', 'מערכת שעות', 'clock'],
  ['courses', 'הקורסים שלי', 'book'],
  ['tasks', 'מטלות ומבחנים', 'check'],
  ['calendar', 'לוח שנה אקדמי', 'cal'],
  ['materials', 'סיכומים וחומרי לימוד', 'folder'],
  ['g', 'ציונים ותכנון'],
  ['grades', 'ציונים וממוצעים', 'chart'],
  ['target', 'מחשבון ציוני יעד', 'target'],
  ['whatif', 'סימולטור What If', 'flask'],
  ['progress', 'ההתקדמות שלי', 'trend'],
  ['map', 'מפת התואר שלי', 'map'],
  ['load', 'עומס הלימודים שלי', 'gauge'],
  ['g', 'כלים'],
  ['export', 'ייצוא מועדים ליומן', 'download'],
  ['prefs', 'הגדרות', 'gear'],
];
const UI = {
  sched: { y: null, s: null, w: 0 },
  courses: { y: 'active', s: 'all', st: 'all', q: '' },
  tasks: { view: 'list', course: 'all', y: 'all', s: 'all', st: 'open', sort: 'due', month: null },
  cal: { view: null, date: null, sel: null, types: null },
  grades: { y: null, s: 'all' },
  whatif: {},
  target: { rows: null, courseId: '' },
  map: { y: 'all' },
  load: { off: 0, month: null },
  mat: { course: 'all', q: '', type: 'all' },
  exp: {},
};

function route() {
  const h = (location.hash || '#dashboard').slice(1);
  if (h.startsWith('course-')) return ['course', h.slice(7)];
  return [h || 'dashboard'];
}

function go(h) {
  if (location.hash === '#' + h) render();
  else location.hash = h;
}

function buildShell() {
  $('#nav').innerHTML = NAV.map(n =>
    n[0] === 'g'
      ? `<div class="grp">${n[1]}</div>`
      : `<a href="#${n[0]}" data-nav="${n[0]}">${ic(n[2])}<span>${n[1]}</span></a>`
  ).join('');
  $('#menuBtn').innerHTML = ic('menu');
  $('#bellBtn').onclick = () => {
    $('#alertsPanel').hidden ? showAlerts(false) : closeAlerts();
  };
  $('#qic').innerHTML = ic('search');
  $('#todayLbl').textContent = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const tg = open => {
    $('#side').classList.toggle('open', open);
    $('#scrim').classList.toggle('show', open);
    $('#menuBtn').setAttribute('aria-expanded', open);
  };
  $('#menuBtn').onclick = () => tg(!$('#side').classList.contains('open'));
  $('#scrim').onclick = () => tg(false);
  $('#nav').addEventListener('click', () => tg(false));
}

function renderCtx() {
  const st = S.settings;
  $('#ctx').innerHTML = `<label class="sr" for="ctxY">שנת לימודים פעילה</label>
      <select id="ctxY">${yearOpts()
        .map(
          ([v, l]) =>
            `<option value="${v}"${v === st.activeYearId ? ' selected' : ''}>${esc(l)}</option>`
        )
        .join('')}</select>
        <label class="sr" for="ctxS">סמסטר פעיל</label>
        <select id="ctxS">${semOpts(st.activeYearId, { annual: false })
          .map(
            ([v, l]) =>
              `<option value="${v}"${v === st.activeSemesterId ? ' selected' : ''}>${esc(l)}</option>`
          )
          .join('')}</select>`;
  $('#ctxY').onchange = e => {
    S.settings.activeYearId = e.target.value;
    S.settings.activeSemesterId = null;
    resetCtxUI();
    commit();
  };
  $('#ctxS').onchange = e => {
    S.settings.activeSemesterId = e.target.value;
    resetCtxUI();
    commit();
  };
  const sub = [st.degreeName, st.university].filter(Boolean).join(' · ');
  $('#brandSub').textContent = sub || 'יומן הלימודים שלי';
  document.body.dataset.acc = st.accent || 'lilac';
}

function resetCtxUI() {
  UI.sched.y = UI.sched.s = null;
  UI.grades.y = null;
  UI.grades.s = 'all';
}

const PAGES = {};
function render() {
  const [p, arg] = route();
  renderCtx();
  $$('#nav a').forEach(a => {
    const on = a.dataset.nav === p || (p === 'course' && a.dataset.nav === 'courses');
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  const fn = PAGES[p] || PAGES.dashboard;
  const m = $('#main');
  const changed = m.dataset.p !== p + (arg || '');
  m.innerHTML = fn(arg);
  m.dataset.p = p + (arg || '');
  if (changed) {
    m.classList.remove('anim');
    void m.offsetWidth;
    m.classList.add('anim');
    window.scrollTo(0, 0);
  }
  (AFTER[p] || (() => {}))(arg);
  updateBell();
}

const AFTER = {};
window.addEventListener('hashchange', () => {
  render();
  $('#main').focus({ preventScroll: true });
});


/* ============================================================
   פעולות
   טיפול מרוכז בלחיצות לפי data-act
   ============================================================ */
const ACT = {};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const f = ACT[b.dataset.act];
  if (f) {
    e.preventDefault();
    f(b.dataset, b, e);
  }
});


/* ============================================================
   עמוד: דף הבית
   ============================================================ */
PAGES.dashboard = () => {
  const st = S.settings,
    t = todayS(),
    y = activeYear();
  const yAvg = avg(c => c.yearId === st.activeYearId),
    dAvg = avg(() => true),
    pr = progress();
  const open = S.tasks.filter(isOpen),
    od = open.filter(isOverdue);
  const les = occurrences(t, t);
  const upT = open
    .filter(x => !isExam(x) && x.due && !isOverdue(x))
    .sort(byDue)
    .slice(0, 5);
  const exams = S.tasks
    .filter(
      x => isExam(x) && x.status !== 'cancelled' && x.status !== 'done' && x.due && x.due >= t
    )
    .sort(byDue)
    .slice(0, 5);
  const series = semesterSeries();
  const statCard = (tone, icon, lbl, val, hint) =>
    `<div class="card stat tone-${tone}">
      <div class="ic">${ic(icon)}</div>
      <div class="lbl">${lbl}</div>
      <div class="val">${val}</div>
      <div class="hint">${hint}</div>
      </div>`;
  return `
  <div class="phead">
    <div>
    <div class="hello">${greeting()}</div>
    <h1 class="grad">Smart Student Planner</h1>
    <p class="sub">המקום שלך לנהל את הלימודים, לעקוב אחר ההתקדמות ולהישאר מסודרת לאורך התואר.</p>
    </div>
    </div>
  ${
    FRESH && !S.courses.length
      ? `<div class="note mb">${ic('sparkle')}<div><b>ברוכה הבאה!</b> כדי להתחיל, כדאי להגדיר את פרטי התואר ומכסת נקודות הזכות, ואז להוסיף את הקורס הראשון. <a href="#prefs">להגדרות</a>
    </div>
    </div>`
      : ''
  }
  <div class="grid g4">
    ${statCard('lilac', 'chart', 'ממוצע שנתי', fmtAvg(yAvg), yAvg == null ? `אין עדיין ציונים ב${esc(y ? y.name : 'שנה')}` : esc(y ? y.name : ''))}
    ${statCard('pink', 'cap', 'ממוצע התואר', fmtAvg(dAvg), dAvg == null ? 'יוצג לאחר הזנת ציונים' : `${countedCourses().length} קורסים בחישוב`)}
    ${statCard('mint', 'trend', 'התקדמות בתואר', pr.pct != null ? Math.round(pr.pct) + '%' : `${pr.done} נ״ז`, pr.req != null ? `${pr.done} הושלמו · ${pr.left} נותרו` : '<a href="#prefs">הגדירי מכסת נקודות זכות</a>')}
    ${statCard('sky', 'check', 'מטלות פתוחות', open.length, od.length ? `<span class="over">${od.length} באיחור</span>` : 'אין מטלות באיחור')}
  </div>
  ${
    pr.pct != null
      ? `<div class="bar mt" aria-label="התקדמות ${Math.round(pr.pct)}%">
        <i style="width:${pr.pct}%;background:linear-gradient(90deg,var(--green-deep),#8DB592)"></i>
    </div>`
      : ''
  }
  <div class="grid g3 mt">
    <div class="card">
    <h3>השיעורים שלי היום <a class="lnk" href="#schedule">למערכת השעות</a></h3>
      ${
        les.length
          ? `<div class="list">${les
              .map(
                o => `<div class="li clickable" data-act="lessonInfo" data-id="${o.l.id}" data-date="${o.date}" tabindex="0" role="button"><span class="dot" style="background:${o.c.color};width:12px;height:12px"></span>
        <div class="main">
        <div class="t">${esc(o.c.name)}</div>
        <div class="m"><span>${o.l.start}–${o.l.end}</span>${o.l.room ? `<span>· ${esc(o.l.room)}</span>` : ''}${o.l.lecturer || o.c.lecturer ? `<span>· ${esc(o.l.lecturer || o.c.lecturer)}</span>` : ''}</div>
        </div>
        </div>`
              )
              .join('')}</div>`
          : emptyState(
              'clock',
              'אין שיעורים היום',
              S.lessons.length ? 'יום חופשי מהרצאות.' : 'עוד לא הוזנו שיעורים למערכת.',
              S.lessons.length
                ? ''
                : `<button class="btn soft sm" data-act="addLesson">${ic('plus')} הוספת שיעור
                  </button>`
            )
      }
    </div>
    <div class="card">
      <h3>המשימות הקרובות <a class="lnk" href="#tasks">לכל המטלות</a></h3>
      ${upT.length ? `<div class="list">${upT.map(taskRowMini).join('')}</div>` : emptyState('check', 'אין משימות קרובות', 'כשתוסיפי מטלות עם תאריך יעד, הן יופיעו כאן.', `<button class="btn soft sm" data-act="addTask">${ic('plus')} הוספת משימה
        </button>`)}
    </div>
    <div class="card hero">
      <h3>המבחנים הקרובים <a class="lnk" href="#calendar">ללוח השנה</a></h3>
      ${exams.length ? `<div>${exams.slice(0, 4).map(examCountdown).join('')}</div>` : emptyState('alert', 'אין מבחנים קרובים', 'מבחנים ובחנים שתוסיפי יופיעו כאן.', `<button class="btn soft sm" data-act="addTask" data-type="exam">${ic('plus')} הוספת מבחן
        </button>`)}
    </div>
  </div>
  <div class="grid g2 mt">
    <div class="card">
      <h3>ממוצעים לפי סמסטרים
        </h3>${series.length ? barChart({ labels: series.map(s => s.label), series: [{ name: 'ממוצע', data: series.map(s => +s.v.toFixed(1)), color: '#D98AA5' }], max: 100 }) : emptyState('chart', 'עוד אין ממוצעים להציג', 'הגרף יתמלא כשתזיני ציונים סופיים לקורסים.', `<button class="btn soft sm" data-act="enterGrade">${ic('plus')} הזנת ציון
        </button>`)}</div>
    <div class="card">
      <h3>התקדמות בנקודות זכות <a class="lnk" href="#progress">פירוט</a>
        </h3>${creditsByYearChart()}</div>
  </div>
  <div class="card mt">
      <h3>פעולות מהירות</h3>
      <div class="qa">
    <button class="btn" data-act="addCourse">${ic('book')} הוספת קורס</button>
    <button class="btn" data-act="addLesson">${ic('clock')} הוספת שיעור</button>
    <button class="btn" data-act="addTask">${ic('check')} הוספת משימה</button>
    <button class="btn" data-act="enterGrade">${ic('chart')} הזנת ציון</button>
    <button class="btn" data-act="addEvent">${ic('cal')} הוספת אירוע ליומן</button>
  </div>
      </div>`;
};

function greeting() {
  const h = new Date().getHours();
  return (h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 18 ? 'צהריים טובים' : 'ערב טוב') + ' ✿';
}

function examCountdown(e) {
  const d = daysBetween(todayS(), e.due);
  const c = e.courseId ? courseColor(e.courseId) : CK.exam[1];
  return `<button class="cd" style="--c:${c}" data-act="editTask" data-id="${e.id}">
    <div class="num" ${d <= 1 ? 'style="font-size:26px"' : ''}>${d === 0 ? 'היום' : d === 1 ? 'מחר' : d}${d > 1 ? '<small>ימים</small>' : ''}</div>
    <div class="meta"><b>${esc(e.title)}</b><span>${fmt(e.due, { weekday: 'long', day: 'numeric', month: 'long' })}${e.time ? ', ' + e.time : ''}</span><span>${esc(courseName(e.courseId) || TT[e.type])}</span>
    </div></button>`;
}

function taskRowMini(t) {
  return `<div class="li clickable" data-act="editTask" data-id="${t.id}" tabindex="0" role="button"><span class="dot" style="background:${t.courseId ? courseColor(t.courseId) : '#DDD'};width:12px;height:12px"></span>
    <div class="main">
    <div class="t">${esc(t.title)}</div>
    <div class="m"><span>${fmtShort(t.due)}${t.time ? ' · ' + t.time : ''}</span><span>${relDue(t)}</span>${t.courseId ? `<span>· ${esc(courseName(t.courseId))}</span>` : ''}</div>
    </div>${isExam(t) ? `<span class="chip b-high">${TT[t.type]}</span>` : `<span class="chip b-${t.priority || 'medium'}">${PR[t.priority || 'medium']}</span>`}</div>`;
}

function creditsByYearChart() {
  const live = S.courses.filter(c => c.status !== 'cancelled');
  if (!live.length)
    return emptyState(
      'trend',
      'אין עדיין קורסים',
      'הגרף יציג נקודות זכות שהושלמו, פעילות ועתידיות בכל שנה.',
      `<button class="btn soft sm" data-act="addCourse">${ic('plus')} הוספת קורס</button>`
    );
  const sum = (y, st) =>
    live
      .filter(c => c.yearId === y.id && c.status === st)
      .reduce((a, c) => a + (num(c.credits) || 0), 0);
  return barChart({
    labels: S.years.map(y => y.name),
    stacked: true,
    series: [
      { name: 'הושלמו', color: '#8DB592', data: S.years.map(y => sum(y, 'completed')) },
      { name: 'פעילים', color: '#E3A3B8', data: S.years.map(y => sum(y, 'inProgress')) },
      { name: 'עתידיים', color: '#E2CFB5', data: S.years.map(y => sum(y, 'notStarted')) },
    ],
  });
}


/* ============================================================
   עמוד: התואר שלי
   שנות לימודים וסמסטרים
   ============================================================ */
PAGES.degree = () => {
  return `<div class="phead">
    <div>
    <h1>התואר שלי</h1>
    <p class="sub">${esc([S.settings.degreeName, S.settings.university].filter(Boolean).join(' · ') || 'מבנה שנות הלימודים והסמסטרים')}</p>
    </div>
    <div class="row">
    <button class="btn" data-act="addYear">${ic('plus')} הוספת שנת לימודים</button>
    </div>
    </div>
  ${S.years
    .map(y => {
      const yc = S.courses.filter(c => c.yearId === y.id && c.status !== 'cancelled');
      const ya = avg(c => c.yearId === y.id);
      const hasSummer = y.semesters.some(s => s.kind === 'S');
      const annual = yc.filter(c => c.semesterId === 'annual');
      return `<div class="card yr">
        <h3><span>${esc(y.name)} ${y.label ? `<small class="muted">(${esc(y.label)})</small>` : ''}</span><span class="row"><span class="chip">ממוצע ${fmtAvg(ya)}</span><span class="chip">${yc.reduce((a, c) => a + (num(c.credits) || 0), 0)} נ״ז</span>${!hasSummer ? `<button class="btn sm" data-act="addSummer" data-id="${y.id}">${ic('plus')} סמסטר קיץ
          </button>` : ''}<button class="ib" data-act="editYear" data-id="${y.id}" aria-label="עריכת ${esc(y.name)}">${ic('edit')}</button></span></h3>
    <div class="sems">${y.semesters
      .map(s => {
        const sc = yc.filter(c => c.semesterId === s.id);
        const sa = avg(c => c.semesterId === s.id);
        return `<button class="semcard ${s.id === S.settings.activeSemesterId ? 'act' : ''}" data-act="openSem" data-y="${y.id}" data-s="${s.id}"><b>${esc(s.name)}</b><span class="small muted">${sc.length} קורסים · ${sc.reduce((a, c) => a + (num(c.credits) || 0), 0)} נ״ז · ממוצע ${fmtAvg(sa)}</span>${s.start || s.end ? `<div class="small muted">${fmtShort(s.start) || '?'} – ${fmtShort(s.end) || '?'}</div>` : ''}${s.id === S.settings.activeSemesterId ? '<div class="small" style="color:var(--accent);font-weight:600">הסמסטר הפעיל</div>' : ''}</button>`;
      })
      .join('')}
    ${annual.length ? `<button class="semcard" data-act="openSem" data-y="${y.id}" data-s="all"><b>קורסים שנתיים</b><span class="small muted">${annual.length} קורסים</span>
      </button>` : ''}</div>
      </div>`;
    })
    .join('')}`;
};

ACT.openSem = d => {
  UI.courses.y = d.y;
  UI.courses.s = d.s;
  if (d.s !== 'all') {
    S.settings.activeYearId = d.y;
    S.settings.activeSemesterId = d.s;
    Store.save();
  }
  go('courses');
};

ACT.addYear = () => {
  const n = S.years.length;
  S.years.push({
    id: uid(),
    name: `שנה ${HEB_LETTERS[n] || n + 1}'`,
    label: '',
    semesters: [mkSem("סמסטר א'", 'A'), mkSem("סמסטר ב'", 'B')],
  });
  commit('נוספה שנת לימודים');
};

ACT.addSummer = d => {
  const y = yearById(d.id);
  y.semesters.push(mkSem('סמסטר קיץ', 'S'));
  commit('נוסף סמסטר קיץ');
};

ACT.editYear = d => yearModal(d.id);
function yearModal(id) {
  const y = yearById(id);
  modal({
    title: `עריכת ${esc(y.name)}`,
    wide: true,
    body: `<div class="fg">${fld('שם השנה', inp('name', y.name, 'text', 'required'), { req: true })}${fld('שנה אקדמית (לא חובה)', inp('label', y.label, 'text', 'placeholder="למשל תשפ״ז"'))}</div>
    <h4 style="margin:18px 0 8px">סמסטרים</h4>
    ${y.semesters
      .map(
        s => `<div class="fg" style="grid-template-columns:1.2fr 1fr 1fr auto;align-items:end;margin-bottom:8px">${fld('שם', inp('n_' + s.id, s.name))}${fld('תאריך התחלה', inp('s_' + s.id, s.start, 'date'))}${fld('תאריך סיום', inp('e_' + s.id, s.end, 'date'))}<button type="button" class="ib dng" data-act="delSem" data-y="${y.id}" data-id="${s.id}" aria-label="מחיקת ${esc(s.name)}">${ic('trash')}</button>
      </div>`
      )
      .join('')}
    <p class="small muted">תאריכי הסמסטר משמשים כברירת מחדל לטווח השיעורים, ומופיעים בלוח השנה.</p>`,
    extra: `<button type="button" class="btn dng" data-act="delYear" data-id="${y.id}">${ic('trash')} מחיקת השנה
      </button>`,
    onSubmit: F => {
      if (!F.name) return { err: 'יש להזין שם לשנה', field: 'name' };
      for (const s of y.semesters) {
        if (F['s_' + s.id] && F['e_' + s.id] && F['e_' + s.id] < F['s_' + s.id])
          return { err: `תאריך הסיום של ${s.name} מוקדם מתאריך ההתחלה`, field: 'e_' + s.id };
      }
      y.name = F.name;
      y.label = F.label;
      y.semesters.forEach(s => {
        s.name = F['n_' + s.id] || s.name;
        s.start = F['s_' + s.id];
        s.end = F['e_' + s.id];
      });
      commit('השנה עודכנה');
    },
  });
}

ACT.delSem = d => {
  const y = yearById(d.y);
  const s = semById(d.id);
  const n = S.courses.filter(c => c.semesterId === d.id).length;
  if (n) {
    toast(`אי אפשר למחוק את ${s.name}: יש בו ${n} קורסים. העבירי או מחקי אותם קודם.`, 'err');
    return;
  }
  confirmBox(`למחוק את ${esc(s.name)} מ${esc(y.name)}?`, () => {
    y.semesters = y.semesters.filter(x => x.id !== d.id);
    modalStack.forEach(m => m._close());
    commit('הסמסטר נמחק');
  });
};

ACT.delYear = d => {
  const y = yearById(d.id);
  const n = S.courses.filter(c => c.yearId === d.id).length;
  if (n) {
    toast(`אי אפשר למחוק את ${y.name}: יש בה ${n} קורסים. העבירי או מחקי אותם קודם.`, 'err');
    return;
  }
  if (S.years.length <= 1) {
    toast('חייבת להישאר לפחות שנת לימודים אחת', 'err');
    return;
  }
  confirmBox(`למחוק את ${esc(y.name)}?`, () => {
    S.years = S.years.filter(x => x.id !== d.id);
    modalStack.slice().forEach(m => m._close());
    commit('השנה נמחקה');
  });
};


/* ============================================================
   עמוד: מערכת שעות
   תצוגה שבועית, התנגשויות, הוספה ועריכה של שיעורים
   ============================================================ */
PAGES.schedule = () => {
  const u = UI.sched;
  if (!u.y) {
    u.y = S.settings.activeYearId;
    u.s = S.settings.activeSemesterId;
  }
  if (!yearById(u.y)) {
    u.y = S.settings.activeYearId;
    u.s = S.settings.activeSemesterId;
  }
  const ws = addDays(weekStart(todayS()), u.w * 7),
    we = addDays(ws, 5);
  const occ = occurrences(ws, we, (l, c) => inSem(c, u.y, u.s));
  let gs = 8 * 60,
    ge = 20 * 60;
  occ.forEach(o => {
    gs = Math.min(gs, Math.floor(tmin(o.l.start) / 60) * 60);
    ge = Math.max(ge, Math.ceil(tmin(o.l.end) / 60) * 60);
  });
  const PX = 1,
    hours = [];
  for (let m = gs; m <= ge; m += 60) hours.push(m);
  const conflicts = [];
  const cols = [0, 1, 2, 3, 4, 5].map(di => {
    const date = addDays(ws, di);
    const day = occ
      .filter(o => o.date === date)
      .map(o => ({ ...o, s: tmin(o.l.start), e: tmin(o.l.end) }))
      .sort((a, b) => a.s - b.s);
    // lanes
    const lanesEnd = [];
    let cluster = [],
      clEnd = -1;
    const clusters = [];
    day.forEach(o => {
      if (o.s >= clEnd && cluster.length) {
        clusters.push(cluster);
        cluster = [];
      }
      cluster.push(o);
      clEnd = Math.max(clEnd, o.e);
    });
    if (cluster.length) clusters.push(cluster);
    clusters.forEach(cl => {
      const ends = [];
      cl.forEach(o => {
        let li = ends.findIndex(e => e <= o.s);
        if (li < 0) {
          li = ends.length;
          ends.push(0);
        }
        ends[li] = o.e;
        o.lane = li;
      });
      cl.forEach(o => {
        o.lanes = ends.length;
        o.conf = cl.length > 1 && cl.some(p => p !== o && p.s < o.e && o.s < p.e);
      });
      if (cl.some(o => o.conf)) conflicts.push({ date, items: cl.filter(o => o.conf) });
    });
    const td = date === todayS();
    return `<div class="dc ${td ? 'today' : ''}" style="height:${(ge - gs) * PX}px">${day.map(o => `<button class="les ${o.conf ? 'conf' : ''}" data-act="lessonInfo" data-id="${o.l.id}" data-date="${date}" style="top:${(o.s - gs) * PX}px;height:${Math.max(28, (o.e - o.s) * PX - 3)}px;right:calc(${(100 / o.lanes) * o.lane}% + 3px);width:calc(${100 / o.lanes}% - 6px);--c:${o.c.color}" aria-label="${esc(o.c.name)}, ${DAYS[di]} ${o.l.start} עד ${o.l.end}${o.conf ? ', התנגשות' : ''}"><b>${esc(o.c.name)}</b>${o.l.start}–${o.l.end}${o.l.room ? `<br>${esc(o.l.room)}` : ''}${o.l.type ? ` · ${LT[o.l.type] || ''}` : ''}${o.l.oneTime ? ' · חד־פעמי' : ''}</button>`).join('')}</div>`;
  });
  const hasAny = S.lessons.some(l => {
    const c = courseById(l.courseId);
    return c && inSem(c, u.y, u.s);
  });
  return `<div class="phead">
    <div>
    <h1>מערכת שעות שבועית</h1>
    <p class="sub">${esc(semLabel(u.y, u.s))} · שבוע ${fmtShort(ws)} – ${fmtShort(we)}</p>
    </div>
    <div class="row">
    <button class="btn pri" data-act="addLesson">${ic('plus')} הוספת שיעור</button>
      </div>
      </div>
  <div class="filters">
      <label class="sr" for="scY">שנה</label>
      <select id="scY" data-yearsel>${yearOpts()
        .map(([v, l]) => `<option value="${v}"${v === u.y ? ' selected' : ''}>${esc(l)}</option>`)
        .join('')}</select>
    <label class="sr" for="scS">סמסטר</label>
      <select id="scS" data-semsel data-annual="0">${semOpts(u.y, { annual: false })
        .map(([v, l]) => `<option value="${v}"${v === u.s ? ' selected' : ''}>${esc(l)}</option>`)
        .join('')}</select>
    <span class="sp"></span>
    <button class="ib" data-act="schedWeek" data-d="-1" aria-label="השבוע הקודם">${ic('chevR')}</button>
      <button class="btn sm" data-act="schedWeek" data-d="0">השבוע</button>
      <button class="ib" data-act="schedWeek" data-d="1" aria-label="השבוע הבא">${ic('chevL')}</button>
      </div>
  ${
    conflicts.length
      ? `<div class="note bad mb">${ic('alert')}<div><b>זוהתה התנגשות בין שיעורים:</b> ${conflicts.map(c => `${DAYS[dow(c.date)]} – ${c.items.map(o => esc(o.c.name) + ' ' + o.l.start + '–' + o.l.end).join(' / ')}`).join('; ')}</div>
    </div>`
      : ''
  }
  ${!hasAny ? `<div class="card mb">${emptyState('clock', 'מערכת השעות ריקה', S.courses.length ? 'הוסיפי את השיעורים של הסמסטר כדי לראות אותם כאן.' : 'קודם מוסיפים קורס, ואז את מועדי השיעורים שלו.', S.courses.length ? `<button class="btn soft" data-act="addLesson">${ic('plus')} הוספת שיעור
    </button>` : `<button class="btn soft" data-act="addCourse">${ic('plus')} הוספת קורס
    </button>`)}</div>` : ''}
  <div class="card" style="padding:0">
    <div class="wkwrap">
    <div class="wk">
    <div class="hd">
    </div>${[0, 1, 2, 3, 4, 5]
      .map(i => {
        const d = addDays(ws, i);
        return `<div class="hd ${d === todayS() ? 'today' : ''}">${DAYS[i]}<small>${fmtShort(d)}</small>
        </div>`;
      })
      .join('')}
    <div class="tc" style="height:${(ge - gs) * PX}px">${hours.map(m => `<span style="top:${(m - gs) * PX}px">${pad(m / 60)}:00</span>`).join('')}</div>${cols.join('')}</div>
      </div>
      </div>`;
};

AFTER.schedule = () => {
  $('#scY').onchange = e => {
    UI.sched.y = e.target.value;
    UI.sched.s = (yearById(e.target.value).semesters[0] || {}).id;
    render();
  };
  $('#scS').onchange = e => {
    UI.sched.s = e.target.value;
    render();
  };
};

ACT.schedWeek = d => {
  UI.sched.w = d.d === '0' ? 0 : UI.sched.w + Number(d.d);
  render();
};

function sessRow(s = {}) {
  return `<div class="sess">${fld(
    'יום',
    sel(
      'day',
      DAYS.slice(0, 6).map((d, i) => [i, d]),
      s.day ?? 0
    )
  )}${fld('שעת התחלה', inp('start', s.start || '', 'time'))}${fld('שעת סיום', inp('end', s.end || '', 'time'))}<button type="button" class="ib dng" data-act="rmSess" aria-label="הסרת מפגש">${ic('x')}</button>
    </div>`;
}

ACT.addSessRow = (d, b) => {
  b.insertAdjacentHTML('beforebegin', sessRow());
};

ACT.rmSess = (d, b) => {
  const box = b.closest('#sessRows');
  if ($$('.sess', box).length > 1) b.closest('.sess').remove();
  else toast('צריך לפחות מפגש אחד', 'err');
};

ACT.addLesson = d => lessonModal(null, d);
function lessonModal(id, pre = {}) {
  if (!S.courses.length) {
    toast('קודם צריך להוסיף קורס', 'err');
    return courseModal();
  }
  const l = id
    ? S.lessons.find(x => x.id === id)
    : {
        courseId:
          pre.course ||
          (
            S.courses.find(c => inSem(c, S.settings.activeYearId, S.settings.activeSemesterId)) ||
            {}
          ).id ||
          S.courses[0].id,
        type: S.settings.defaults.lessonType,
        oneTime: false,
        day: 0,
      };
  const ed = !!id;
  modal({
    title: ed ? 'עריכת שיעור' : 'הוספת שיעור',
    wide: true,
    body: `<div class="fg">
    ${fld('קורס', sel('courseId', courseOpts(), l.courseId), { req: true, full: true })}
    ${fld('סוג השיעור', sel('type', objOpts(LT), l.type))}
    ${fld(
      'תדירות',
      sel(
        'freq',
        [
          ['weekly', 'קבוע – כל שבוע'],
          ['once', 'מפגש חד־פעמי'],
        ],
        l.oneTime ? 'once' : 'weekly',
        'data-freq'
      )
    )}
    <div class="fld full" data-show="weekly"><span>מפגשים שבועיים</span>
      <div id="sessRows">${ed ? sessRow(l) : sessRow({})}${ed ? '' : `<button type="button" class="btn sm" data-act="addSessRow">${ic('plus')} מפגש נוסף בשבוע לאותו קורס
        </button>`}</div>
      </div>
    <div class="fld full" data-show="once" hidden>
      <div class="fg" style="grid-template-columns:1fr 1fr 1fr">${fld('תאריך', inp('date', l.date, 'date'))}${fld('שעת התחלה', inp('ostart', l.start, 'time'))}${fld('שעת סיום', inp('oend', l.end, 'time'))}</div>
      </div>
    ${fld('כיתה / חדר', inp('room', l.room))}${fld('שם המרצה', inp('lecturer', l.lecturer, 'text', 'placeholder="ברירת מחדל: המרצה של הקורס"'))}
    <div data-show="weekly" class="fld full">
      <div class="fg">${fld('תחילת המפגשים', inp('startDate', l.startDate, 'date'), { hint: 'ריק = לפי תאריכי הסמסטר' })}${fld('סיום המפגשים', inp('endDate', l.endDate, 'date'))}</div>
      </div>
    ${fld('הערות אישיות', ta('notes', l.notes), { full: true })}</div>`,
    onOpen: (ov, form) => {
      const f = () => {
        const v = form.elements.freq.value;
        $$('[data-show]', form).forEach(el => (el.hidden = el.dataset.show !== v));
      };
      form.elements.freq.onchange = f;
      f();
    },
    onSubmit: (F, form) => {
      if (!F.courseId) return { err: 'יש לבחור קורס', field: 'courseId' };
      const base = {
        courseId: F.courseId,
        type: F.type,
        room: F.room,
        lecturer: F.lecturer,
        notes: F.notes,
      };
      if (F.freq === 'once') {
        if (!F.date) return { err: 'יש לבחור תאריך למפגש', field: 'date' };
        if (!F.ostart || !F.oend)
          return { err: 'יש להזין שעת התחלה ושעת סיום', field: F.ostart ? 'oend' : 'ostart' };
        if (F.oend <= F.ostart)
          return { err: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה', field: 'oend' };
        const obj = {
          ...base,
          oneTime: true,
          date: F.date,
          day: dow(F.date),
          start: F.ostart,
          end: F.oend,
          cancelled: [],
        };
        if (ed) Object.assign(l, obj, { startDate: '', endDate: '' });
        else S.lessons.push({ id: uid(), ...obj });
      } else {
        const days = F.$all('day'),
          st = F.$all('start'),
          en = F.$all('end');
        for (let i = 0; i < days.length; i++) {
          if (!st[i] || !en[i]) return 'יש להזין שעת התחלה ושעת סיום לכל מפגש';
          if (en[i] <= st[i]) return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
        }
        if (F.startDate && F.endDate && F.endDate < F.startDate)
          return { err: 'תאריך הסיום מוקדם מתאריך ההתחלה', field: 'endDate' };
        const common = { ...base, oneTime: false, startDate: F.startDate, endDate: F.endDate };
        if (ed)
          Object.assign(l, common, { day: Number(days[0]), start: st[0], end: en[0], date: '' });
        else
          days.forEach((dd, i) =>
            S.lessons.push({
              id: uid(),
              ...common,
              day: Number(dd),
              start: st[i],
              end: en[i],
              cancelled: [],
            })
          );
      }
      commit(ed ? 'השיעור עודכן' : 'השיעור נוסף למערכת');
    },
  });
}

ACT.lessonInfo = d => {
  const l = S.lessons.find(x => x.id === d.id);
  if (!l) return;
  const c = courseById(l.courseId);
  const [a, b] = lessonRange(l);
  const m = modal({
    title: esc(c.name),
    body: `<div class="row mb"><span class="chip" style="background:${c.color}">${LT[l.type] || ''}</span>${l.oneTime ? '<span class="chip">מפגש חד־פעמי</span>' : ''}</div>
      <dl class="dl">
    <dt>מועד</dt>
      <dd>${l.oneTime ? fmt(l.date) + ' · ' : `כל יום ${DAYS[l.day]} · `}${l.start}–${l.end}</dd>
    ${
      d.date && !l.oneTime
        ? `<dt>מפגש נבחר</dt>
      <dd>${fmt(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}</dd>`
        : ''
    }
    <dt>כיתה</dt>
      <dd>${esc(l.room) || '—'}</dd>
      <dt>מרצה</dt>
      <dd>${esc(l.lecturer || c.lecturer) || '—'}</dd>
    ${
      !l.oneTime
        ? `<dt>תקופה</dt>
      <dd>${a ? fmt(a) : 'ללא תאריך התחלה'} – ${b ? fmt(b) : 'ללא תאריך סיום'}</dd>`
        : ''
    }
    <dt>סמסטר</dt>
      <dd>${esc(semLabel(c.yearId, c.semesterId))}</dd>
    ${
      l.notes
        ? `<dt>הערות</dt>
      <dd style="white-space:pre-wrap">${esc(l.notes)}</dd>`
        : ''
    }</dl>
    ${
      (l.cancelled || []).length
        ? `<h4 style="margin:16px 0 6px">מפגשים שבוטלו</h4>${l.cancelled
            .map(
              x => `<div class="row small">${fmt(x, { weekday: 'long', day: 'numeric', month: 'long' })}
      <button type="button" class="btn sm" data-act="restoreOcc" data-id="${l.id}" data-date="${x}">${ic('undo')} שחזור
        </button>
      </div>`
            )
            .join('')}`
        : ''
    }`,
    extra: `<button type="button" class="btn" data-act="editLesson" data-id="${l.id}">${ic('edit')} עריכה
      </button>${d.date && !l.oneTime ? `<button type="button" class="btn" data-act="cancelOcc" data-id="${l.id}" data-date="${d.date}">ביטול המפגש הזה
      </button>` : ''}<button type="button" class="btn" data-act="exportOne" data-kind="lesson" data-id="${l.id}">${ic('download')} ייצוא
      </button>
      <button type="button" class="btn dng" data-act="delLesson" data-id="${l.id}">${ic('trash')} ${l.oneTime ? 'מחיקה' : 'מחיקת הסדרה'}</button>`,
  });
};

ACT.editLesson = d => {
  modalStack.slice().forEach(m => m._close());
  lessonModal(d.id);
};

ACT.cancelOcc = d => {
  const l = S.lessons.find(x => x.id === d.id);
  confirmBox(
    `לבטל את המפגש של ${fmt(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}? שאר הסדרה תישאר.`,
    () => {
      l.cancelled = [...(l.cancelled || []), d.date];
      modalStack.slice().forEach(m => m._close());
      commit('המפגש בוטל');
    },
    { yes: 'ביטול המפגש' }
  );
};

ACT.restoreOcc = d => {
  const l = S.lessons.find(x => x.id === d.id);
  l.cancelled = (l.cancelled || []).filter(x => x !== d.date);
  modalStack.slice().forEach(m => m._close());
  commit('המפגש שוחזר');
};

ACT.delLesson = d => {
  const l = S.lessons.find(x => x.id === d.id);
  confirmBox(l.oneTime ? 'למחוק את המפגש?' : 'למחוק את כל סדרת המפגשים של השיעור הזה?', () => {
    S.lessons = S.lessons.filter(x => x.id !== d.id);
    modalStack.slice().forEach(m => m._close());
    commit('השיעור נמחק');
  });
};


/* ============================================================
   עמוד: הקורסים שלי
   רשימה, סינון, הוספה ועריכה של קורסים
   ============================================================ */
PAGES.courses = () => {
  const u = UI.courses;
  const yid = u.y === 'active' ? S.settings.activeYearId : u.y;
  let list = S.courses.filter(
    c =>
      (yid === 'all' || c.yearId === yid) &&
      (u.s === 'all' || c.semesterId === u.s) &&
      (u.st === 'all' || c.status === u.st) &&
      (!u.q || (c.name + ' ' + (c.code || '')).toLowerCase().includes(u.q.toLowerCase()))
  );
  const groups = [];
  S.years.forEach(y => {
    if (yid !== 'all' && y.id !== yid) return;
    [...y.semesters, { id: 'annual', name: 'קורסים שנתיים' }].forEach(s => {
      const cs = list.filter(c => c.yearId === y.id && c.semesterId === s.id);
      if (cs.length) groups.push({ y, s, cs });
    });
  });
  return `<div class="phead">
    <div>
    <h1>הקורסים שלי</h1>
    <p class="sub">${S.courses.length} קורסים בתואר</p>
    </div>
    <button class="btn pri" data-act="addCourse">${ic('plus')} הוספת קורס</button>
    </div>
  <div class="filters">
    <label class="sr" for="cfY">שנה</label>
    <select id="cfY" data-yearsel>
    <option value="all"${yid === 'all' ? ' selected' : ''}>כל השנים</option>${yearOpts()
      .map(([v, l]) => `<option value="${v}"${v === yid ? ' selected' : ''}>${esc(l)}</option>`)
      .join('')}</select>
  <label class="sr" for="cfS">סמסטר</label>
      <select id="cfS" data-semsel data-all="1">${(yid === 'all' ? [['all', 'כל הסמסטרים']] : semOpts(yid, { all: true })).map(([v, l]) => `<option value="${v}"${v === u.s ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
  <label class="sr" for="cfT">סטטוס</label>
    <select id="cfT">
    <option value="all">כל הסטטוסים</option>${objOpts(CST)
      .map(([v, l]) => `<option value="${v}"${v === u.st ? ' selected' : ''}>${l}</option>`)
      .join('')}</select>
  <label class="sr" for="cfQ">סינון לפי שם או קוד</label>
      <input id="cfQ" type="search" placeholder="סינון לפי שם או קוד" value="${esc(u.q)}">
    </div>
  ${
    groups.length
      ? groups
          .map(
            g =>
              `<h2 class="secttl">${esc(g.y.name)} · ${esc(g.s.name)} <small>${g.cs.length} קורסים · ${g.cs.reduce((a, c) => a + (num(c.credits) || 0), 0)} נ״ז</small></h2>
                <div class="ccards">${g.cs
                  .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                  .map(courseCard)
                  .join('')}</div>`
          )
          .join('')
      : `<div class="card">${S.courses.length ? emptyState('search', 'לא נמצאו קורסים', 'נסי לשנות את הסינון.', `<button class="btn soft sm" data-act="clearCF">ניקוי סינון
        </button>`) : emptyState('book', 'עוד אין קורסים', 'הוסיפי את הקורס הראשון שלך כדי להתחיל לבנות את התואר.', `<button class="btn soft" data-act="addCourse">${ic('plus')} הוספת קורס
        </button>`)}</div>`
  }`;
};

function courseCard(c) {
  return `<button class="ccard" style="--c:${c.color}" data-act="openCourse" data-id="${c.id}">
    <div class="row" style="align-items:flex-start">
    <div class="sp">
    <h4>${esc(c.name)}</h4>
    <div class="code">${esc(c.code || 'ללא קוד')}${c.retakeOf ? ' · לימוד חוזר' : ''}</div>
    </div>${isNum(c.finalGrade) ? `<div class="gr">${num(c.finalGrade)}</div>` : c.gradeType === 'pass' && c.passResult ? `<span class="chip">${c.passResult === 'pass' ? 'עובר' : 'נכשל'}</span>` : ''}</div>
  <div class="meta"><span class="chip st-${c.status}">${CST[c.status]}</span><span class="chip">${num(c.credits) ?? 0} נ״ז</span>${c.lecturer ? `<span class="chip">${esc(c.lecturer)}</span>` : ''}<span class="chip">${esc(semLabel(c.yearId, c.semesterId))}</span>
    </div></button>`;
}

AFTER.courses = () => {
  const u = UI.courses;
  $('#cfY').onchange = e => {
    u.y = e.target.value;
    u.s = 'all';
    render();
  };
  $('#cfS').onchange = e => {
    u.s = e.target.value;
    render();
  };
  $('#cfT').onchange = e => {
    u.st = e.target.value;
    render();
  };
  let t;
  $('#cfQ').oninput = e => {
    clearTimeout(t);
    t = setTimeout(() => {
      u.q = e.target.value;
      render();
      const q = $('#cfQ');
      q.focus();
      q.setSelectionRange(q.value.length, q.value.length);
    }, 250);
  };
};

ACT.clearCF = () => {
  Object.assign(UI.courses, { y: 'all', s: 'all', st: 'all', q: '' });
  render();
};

ACT.openCourse = d => go('course-' + d.id);
ACT.addCourse = () => courseModal();
ACT.editCourse = d => {
  modalStack.slice().forEach(m => m._close());
  courseModal(d.id);
};

function wouldCycle(cid, prereqs) {
  const seen = new Set();
  const st = [...prereqs];
  while (st.length) {
    const x = st.pop();
    if (x === cid) return true;
    if (seen.has(x)) continue;
    seen.add(x);
    const c = courseById(x);
    if (c) st.push(...(c.prereqs || []));
  }
  return false;
}

function courseModal(id) {
  const ed = !!id;
  const st = S.settings;
  const c = ed
    ? courseById(id)
    : {
        yearId: st.activeYearId,
        semesterId: st.activeSemesterId,
        status: 'notStarted',
        gradeType: 'numeric',
        includeInAvg: true,
        color: nextColor(),
        prereqs: [],
      };
  const others = S.courses.filter(x => x.id !== id).sort((a, b) => courseOrder(a) - courseOrder(b));
  modal({
    title: ed ? 'עריכת קורס' : 'הוספת קורס',
    wide: true,
    body: `<div class="fg">
    ${fld('שם הקורס', inp('name', c.name, 'text', 'required'), { req: true })}${fld('קוד הקורס', inp('code', c.code))}
    ${fld('שנת לימודים', sel('yearId', yearOpts(), c.yearId, 'data-yearsel'), { req: true })}${fld('סמסטר', sel('semesterId', semOpts(c.yearId), c.semesterId, 'data-semsel'), { req: true })}
    ${fld('נקודות זכות', inp('credits', c.credits, 'number', 'min="0" step="0.5" inputmode="decimal"'), { req: true })}${fld('שם המרצה', inp('lecturer', c.lecturer))}
    ${fld('סטטוס', sel('status', objOpts(CST), c.status))}${fld('סוג ציון', sel('gradeType', objOpts(GT), c.gradeType || 'numeric'))}
    ${fld('ציון סופי', inp('finalGrade', c.finalGrade, 'number', 'min="0" max="100" step="0.1" inputmode="decimal"'), { hint: 'ריק = עדיין אין ציון' })}
    ${fld(
      'תוצאה (לקורס עובר/נכשל)',
      sel(
        'passResult',
        [
          ['', '—'],
          ['pass', 'עובר'],
          ['fail', 'נכשל'],
        ],
        c.passResult
      )
    )}
    <div class="fld"><span>צבע הקורס</span>
      <div class="swatches">${PALETTE.map(
        p => `<label>
      <input type="radio" name="color" value="${p}" ${p === c.color ? 'checked' : ''}><span style="background:${p}"></span><b class="sr">${p}</b>
        </label>`
      ).join('')}</div>
      </div>
    <div class="fld" style="justify-content:end">${chk('includeInAvg', c.includeInAvg !== false, 'נכלל בחישוב הממוצע')}</div>
    ${fld('לימוד חוזר של קורס', sel('retakeOf', [['', 'לא – לימוד ראשון'], ...others.map(o => [o.id, `${o.name} (${semLabel(o.yearId, o.semesterId)})`])], c.retakeOf), { full: true, hint: 'אם זה קורס שנלמד מחדש, בחרי את הניסיון הקודם. כלל החישוב נקבע בהגדרות.' })}
    <div class="fld full"><span>דרישות קדם</span>${others.length ? `<div class="chkgrid">${others.map(o => chk('prereqs" value="' + o.id, (c.prereqs || []).includes(o.id), esc(o.name))).join('')}</div>` : '<small>אין קורסים אחרים להגדרה כדרישת קדם.</small>'}</div>
    ${fld('תיאור', ta('description', c.description), { full: true })}${fld('הערות', ta('notes', c.notes), { full: true })}</div>`,
    extra: ed
      ? `<button type="button" class="btn dng" data-act="delCourse" data-id="${id}">${ic('trash')} מחיקה
        </button>`
      : '',
    onSubmit: F => {
      if (!F.name) return { err: 'יש להזין שם קורס', field: 'name' };
      if (!isNum(F.credits) || Number(F.credits) < 0)
        return { err: 'יש להזין מספר נקודות זכות (0 ומעלה)', field: 'credits' };
      if (F.finalGrade !== '' && (!isNum(F.finalGrade) || F.finalGrade < 0 || F.finalGrade > 100))
        return { err: 'הציון צריך להיות בין 0 ל־100', field: 'finalGrade' };
      const prereqs = F.$all('prereqs');
      if (ed && wouldCycle(id, prereqs))
        return 'לא ניתן לשמור: דרישות הקדם יוצרות מעגל (קורס שתלוי בעצמו דרך קורסים אחרים).';
      const obj = {
        name: F.name,
        code: F.code,
        yearId: F.yearId,
        semesterId: F.semesterId,
        credits: Number(F.credits),
        lecturer: F.lecturer,
        status: F.status,
        gradeType: F.gradeType,
        finalGrade: F.finalGrade === '' ? null : Number(F.finalGrade),
        passResult: F.passResult,
        color: F.color || c.color,
        includeInAvg: F.$chk('includeInAvg'),
        retakeOf: F.retakeOf || null,
        prereqs,
        description: F.description,
        notes: F.notes,
      };
      if (ed) Object.assign(c, obj);
      else S.courses.push({ id: uid(), components: [], ...obj });
      commit(ed ? 'הקורס עודכן' : 'הקורס נוסף');
    },
  });
}

ACT.delCourse = d => {
  const c = courseById(d.id);
  const n = S.lessons.filter(l => l.courseId === d.id).length,
    t = S.tasks.filter(x => x.courseId === d.id).length,
    m = S.materials.filter(x => x.courseId === d.id).length;
  confirmBox(
    `למחוק את הקורס <b>${esc(c.name)}</b>?${n + t + m ? `<br><span class="small muted">יימחקו גם ${n} שיעורים, ${t} מטלות ו־${m} חומרי לימוד שמשויכים אליו.</span>` : ''}`,
    () => {
      S.courses = S.courses.filter(x => x.id !== d.id);
      S.lessons = S.lessons.filter(x => x.courseId !== d.id);
      S.tasks = S.tasks.filter(x => x.courseId !== d.id);
      S.materials = S.materials.filter(x => x.courseId !== d.id);
      S.courses.forEach(x => {
        x.prereqs = (x.prereqs || []).filter(p => p !== d.id);
        if (x.retakeOf === d.id) x.retakeOf = null;
      });
      modalStack.slice().forEach(m => m._close());
      if (route()[0] === 'course') location.hash = 'courses';
      commit('הקורס נמחק');
    }
  );
};


/* ============================================================
   עמוד: קורס בודד
   פרטים, שיעורים, מטלות, רכיבי הערכה וחומרים
   ============================================================ */
PAGES.course = id => {
  const c = courseById(id);
  if (!c)
    return `<div class="card">${emptyState('book', 'הקורס לא נמצא', 'ייתכן שהוא נמחק.', '<a class="btn soft" href="#courses">לכל הקורסים</a>')}</div>`;
  const les = S.lessons.filter(l => l.courseId === id);
  const tasks = S.tasks.filter(t => t.courseId === id).sort(byDue);
  const mats = S.materials.filter(m => m.courseId === id);
  const cg = compGrade(c);
  const pre = (c.prereqs || []).map(courseById).filter(Boolean);
  const prev = c.retakeOf ? courseById(c.retakeOf) : null;
  return `<div class="phead">
    <div><a href="#courses" class="small">← הקורסים שלי</a>
    <h1 style="display:flex;align-items:center;gap:10px"><span class="dot" style="background:${c.color};width:16px;height:16px"></span>${esc(c.name)}</h1>
    <p class="sub">${esc(c.code || '')}${c.code ? ' · ' : ''}${esc(semLabel(c.yearId, c.semesterId))}</p>
    </div>
   <div class="row">
    <button class="btn" data-act="editCourse" data-id="${id}">${ic('edit')} עריכה</button>
     <button class="btn dng" data-act="delCourse" data-id="${id}">${ic('trash')}</button>
     </div>
     </div>
  <div class="grid g4">
    <div class="card stat">
     <div class="lbl">סטטוס
     </div>
     <div class="val" style="font-size:20px"><span class="chip st-${c.status}" style="font-size:15px">${CST[c.status]}</span>
      </div>
      </div>
    <div class="card stat">
      <div class="lbl">נקודות זכות
      </div>
      <div class="val">${num(c.credits) ?? 0}</div>
      </div>
    <div class="card stat">
      <div class="lbl">ציון סופי
      </div>
      <div class="val">${isNum(c.finalGrade) ? num(c.finalGrade) : c.gradeType === 'pass' && c.passResult ? (c.passResult === 'pass' ? 'עובר' : 'נכשל') : '—'}</div>
      <div class="hint">${c.gradeType === 'numeric' ? (c.includeInAvg === false ? 'לא נכלל בממוצע' : 'נכלל בממוצע') : GT[c.gradeType]}</div>
      </div>
    <div class="card stat">
      <div class="lbl">מרצה
      </div>
      <div class="val" style="font-size:18px">${esc(c.lecturer) || '—'}</div>
      </div>
  </div>
  <div class="grid g2 mt">
    <div class="card">
      <h3>מידע כללי</h3>
      ${c.description ? `<p style="white-space:pre-wrap;margin-top:0">${esc(c.description)}</p>` : '<p class="muted small" style="margin-top:0">לא הוזן תיאור.</p>'}
      <dl class="dl">
        <dt>דרישות קדם</dt>
        <dd>${pre.length ? pre.map(p => `<span class="chip ${p.status === 'completed' ? 'st-completed' : 'st-failed'}" style="margin:0 0 4px 4px">${p.status === 'completed' ? '✓' : '✗'} ${esc(p.name)}</span>`).join('') : 'אין'}</dd>
      ${
        prev
          ? `<dt>לימוד חוזר של</dt>
        <dd><a href="#course-${prev.id}">${esc(prev.name)} (${esc(semLabel(prev.yearId, prev.semesterId))})</a>
          </dd>`
          : ''
      }</dl>
      ${
        pre.some(p => p.status !== 'completed')
          ? `<div class="note warn mt small">${ic('alert')}<div>כדי להתחיל את הקורס צריך להשלים קודם: ${pre
              .filter(p => p.status !== 'completed')
              .map(p => esc(p.name))
              .join(', ')}</div>
                </div>`
          : ''
      }
    </div>
    <div class="card">
      <h3>מערכת השעות של הקורס
      <button class="btn sm" data-act="addLesson" data-course="${id}">${ic('plus')} שיעור
        </button></h3>
      ${
        les.length
          ? `<div class="list">${les
              .map(
                l => `<div class="li clickable" data-act="lessonInfo" data-id="${l.id}" tabindex="0" role="button">
        <div class="main">
        <div class="t">${l.oneTime ? fmt(l.date) : 'יום ' + DAYS[l.day]} · ${l.start}–${l.end}</div>
        <div class="m">${LT[l.type] || ''}${l.room ? ' · ' + esc(l.room) : ''}${(l.cancelled || []).length ? ` · ${l.cancelled.length} מפגשים בוטלו` : ''}</div>
        </div>
        </div>`
              )
              .join('')}</div>`
          : '<p class="muted small">אין שיעורים לקורס.</p>'
      }
    </div>
  </div>
  <div class="card mt">
      <h3>מטלות ומבחנים
      <button class="btn sm" data-act="addTask" data-course="${id}">${ic('plus')} מטלה</button>
        </h3>${tasks.length ? `<div class="list">${tasks.map(taskRow).join('')}</div>` : '<p class="muted small">אין מטלות לקורס.</p>'}</div>
  <div class="card mt">
    <h3>ציונים ורכיבי הערכה
    <button class="btn sm" data-act="addComp" data-id="${id}">${ic('plus')} רכיב הערכה</button></h3>
    ${
      (c.components || []).length
        ? `<div class="tblwrap">
          <table class="tbl">
          <thead>
          <tr>
          <th>רכיב</th>
          <th>סוג</th>
          <th style="width:110px">משקל (%)</th>
          <th style="width:110px">ציון</th>
          <th style="width:44px"></th>
          </tr>
          </thead>
          <tbody>${c.components
            .map(
              x =>
                `<tr>
                  <td>
                  <input aria-label="שם הרכיב" data-comp="${x.id}" data-f="name" value="${esc(x.name)}"></td>
                  <td>
                  <select aria-label="סוג הרכיב" data-comp="${x.id}" data-f="type">${objOpts(COMPT)
                    .map(
                      ([v, l]) =>
                        `<option value="${v}"${v === x.type ? ' selected' : ''}>${l}</option>`
                    )
                    .join('')}</select></td>
                    <td>
                    <input aria-label="משקל" type="number" min="0" max="100" data-comp="${x.id}" data-f="weight" value="${esc(x.weight)}"></td>
                    <td>
                    <input aria-label="ציון" type="number" min="0" max="100" data-comp="${x.id}" data-f="grade" value="${esc(x.grade)}" placeholder="—"></td>
                    <td>
                    <button class="ib dng" data-act="delComp" data-c="${id}" data-id="${x.id}" aria-label="מחיקת רכיב">${ic('trash')}</button></td>
                    </tr>`
            )
            .join('')}</tbody>
              </table>
              </div>
    <div class="row mt"><span class="chip ${Math.abs(cg.tw - 100) < 0.01 ? 'st-completed' : 'b-medium'}">סך המשקלים: ${cg.tw}%</span><span class="chip">ציון נוכחי ברכיבים שהוזנו: ${cg.cur != null ? cg.cur.toFixed(1) : '—'}</span>${
      cg.final != null
        ? `<span class="chip st-completed">ציון משוקלל: ${cg.final.toFixed(1)}</span>
      <button class="btn sm soft" data-act="setFinal" data-id="${id}" data-v="${cg.final.toFixed(1)}">קביעה כציון הסופי
        </button>`
        : ''
    }<a class="btn sm" href="#target" data-act="targetFor" data-id="${id}">${ic('target')} כמה צריך כדי להגיע ליעד?</a>
      </div>
    ${Math.abs(cg.tw - 100) > 0.01 ? `<p class="small muted">סך המשקלים צריך להיות 100% כדי לחשב ציון סופי משוקלל.</p>` : ''}`
        : '<p class="muted small">הוסיפי רכיבי הערכה (מבחן, עבודות, תרגילים…) עם משקל באחוזים, כדי לעקוב אחרי הציון.</p>'
    }
  </div>
  <div class="card mt">
    <h3>סיכומים, קבצים וקישורים
    <button class="btn sm" data-act="addMat" data-course="${id}">${ic('plus')} חומר</button>
      </h3>${mats.length ? `<div class="grid g2">${mats.map(matCard).join('')}</div>` : '<p class="muted small">אין חומרי לימוד לקורס.</p>'}</div>
  <div class="card mt">
    <h3>הערות אישיות</h3>
    <label class="sr" for="cnotes">הערות לקורס</label>
    <textarea id="cnotes" data-cnotes="${id}" rows="4" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:10px" placeholder="כתבי כאן הערות על הקורס…">${esc(c.notes)}</textarea>
    <div class="small muted">נשמר אוטומטית
    </div>
    </div>`;
};

AFTER.course = id => {
  $$('[data-comp]').forEach(
    el =>
      (el.onchange = () => {
        const c = courseById(id);
        const x = c.components.find(k => k.id === el.dataset.comp);
        let v = el.value.trim();
        if (el.dataset.f === 'weight' || el.dataset.f === 'grade') {
          if (v !== '' && (!isNum(v) || v < 0 || v > 100)) {
            toast('יש להזין מספר בין 0 ל־100', 'err');
            el.value = x[el.dataset.f] ?? '';
            return;
          }
          v = v === '' ? null : Number(v);
        }
        x[el.dataset.f] = v;
        commit();
      })
  );
  const n = $('#cnotes');
  if (n) {
    let t;
    n.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        courseById(id).notes = n.value;
        Store.save();
      }, 500);
    };
  }
};

ACT.addComp = d => {
  const c = courseById(d.id);
  c.components = c.components || [];
  c.components.push({
    id: uid(),
    name: '',
    type: c.components.length ? 'paper' : 'final',
    weight: null,
    grade: null,
  });
  commit();
  setTimeout(() => {
    const ins = $$('[data-f=name]');
    ins.length && ins[ins.length - 1].focus();
  }, 50);
};

ACT.delComp = d => {
  const c = courseById(d.c);
  c.components = c.components.filter(x => x.id !== d.id);
  commit('הרכיב נמחק');
};

ACT.setFinal = d => {
  const c = courseById(d.id);
  c.finalGrade = Number(d.v);
  if (c.status === 'notStarted' || c.status === 'inProgress') c.status = 'completed';
  commit('הציון הסופי נשמר');
};

ACT.targetFor = d => {
  const c = courseById(d.id);
  UI.target.courseId = d.id;
  UI.target.rows = (c.components || []).map(x => ({
    name: x.name || COMPT[x.type],
    weight: x.weight,
    grade: x.grade,
  }));
  go('target');
};


/* ============================================================
   עמוד: מטלות ומבחנים
   רשימה, לוח שנה וחלוקה לפי קורסים
   ============================================================ */
function taskRow(t) {
  const od = isOverdue(t);
  return `<div class="li" ${od ? 'style="background:linear-gradient(270deg,var(--danger-soft),transparent 40%)"' : ''}>
    <label class="chk" title="סימון כהושלמה">
    <input type="checkbox" data-done="${t.id}" ${t.status === 'done' ? 'checked' : ''} aria-label="סימון ${esc(t.title)} כהושלמה">
      </label>
  <div class="main" data-act="editTask" data-id="${t.id}" style="cursor:pointer">
    <div class="t" ${t.status === 'done' || t.status === 'cancelled' ? 'style="text-decoration:line-through;color:var(--muted)"' : ''}>${esc(t.title)}</div>
  <div class="m"><span class="chip">${TT[t.type] || ''}</span>${t.courseId ? `<span class="chip cc" style="--c:${courseColor(t.courseId)}">${esc(courseName(t.courseId))}</span>` : ''}<span>${t.due ? fmt(t.due, { weekday: 'short', day: 'numeric', month: 'short' }) : 'ללא תאריך'}${t.time ? ' · ' + t.time : ''}</span>${isOpen(t) ? `<span>${relDue(t)}</span>` : ''}${t.est ? `<span>· ${t.est} ש׳ עבודה</span>` : ''}</div>
    </div>
  <span class="chip b-${t.priority || 'medium'}" title="עדיפות">${PR[t.priority || 'medium']}</span><span class="chip s-${t.status}">${TS[t.status]}</span>
  <button class="ib" data-act="editTask" data-id="${t.id}" aria-label="עריכת ${esc(t.title)}">${ic('edit')}</button>
    <button class="ib dng" data-act="delTask" data-id="${t.id}" aria-label="מחיקת ${esc(t.title)}">${ic('trash')}</button>
    </div>`;
}

function filteredTasks() {
  const u = UI.tasks;
  return S.tasks.filter(t => {
    const c = t.courseId ? courseById(t.courseId) : null;
    if (u.course !== 'all' && (u.course === 'none' ? !!t.courseId : t.courseId !== u.course))
      return false;
    if (u.y !== 'all') {
      if (!c || c.yearId !== u.y) return false;
      if (u.s !== 'all' && c.semesterId !== u.s) return false;
    }
    if (u.st === 'open' && !isOpen(t)) return false;
    if (u.st === 'overdue' && !isOverdue(t)) return false;
    if (['todo', 'doing', 'done', 'cancelled'].includes(u.st) && t.status !== u.st) return false;
    return true;
  });
}

PAGES.tasks = () => {
  const u = UI.tasks;
  const list = filteredTasks();
  const od = S.tasks.filter(isOverdue).length;
  const sorted = list
    .slice()
    .sort(u.sort === 'prio' ? (a, b) => prioScore(a) - prioScore(b) : byDue);
  let body = '';
  if (!S.tasks.length)
    body = `<div class="card">${emptyState('check', 'עוד אין מטלות', 'הוסיפי מטלות, עבודות ומבחנים כדי לעקוב אחרי מועדי ההגשה.', `<button class="btn soft" data-act="addTask">${ic('plus')} הוספת משימה
      </button>`)}</div>`;
  else if (u.view === 'list')
    body = `<div class="card">${sorted.length ? `<div class="list">${sorted.map(taskRow).join('')}</div>` : emptyState('search', 'אין מטלות שמתאימות לסינון', 'נסי לשנות את הסינון.', '')}</div>`;
  else if (u.view === 'course') {
    const g = {};
    sorted.forEach(t => {
      (g[t.courseId || ''] = g[t.courseId || ''] || []).push(t);
    });
    const keys = Object.keys(g).sort((a, b) => courseName(a).localeCompare(courseName(b), 'he'));
    body = keys.length
      ? keys
          .map(
            k =>
              `<div class="card mb">
                <h3><span class="row"><span class="dot" style="background:${k ? courseColor(k) : '#DDD'};width:12px;height:12px"></span>${k ? esc(courseName(k)) : 'ללא קורס'}</span><span class="chip">${g[k].length}</span></h3>
                <div class="list">${g[k].map(taskRow).join('')}</div>
                </div>`
          )
          .join('')
      : `<div class="card">${emptyState('search', 'אין מטלות שמתאימות לסינון', '', '')}</div>`;
  } else {
    const m = u.month || todayS().slice(0, 7) + '-01';
    const ids = new Set(list.map(t => t.id));
    body = monthGrid(
      m,
      calItems(addDays(weekStart(m), 0), addDays(weekStart(m), 41)).filter(
        i => ['exam', 'quiz', 'deadline', 'task'].includes(i.kind) && ids.has(i.id)
      ),
      { nav: 'taskMonth', noAdd: true }
    );
  }
  return `<div class="phead">
    <div>
    <h1>מטלות ומבחנים</h1>
    <p class="sub">${S.tasks.filter(isOpen).length} פתוחות${od ? ` · <span class="over">${od} באיחור</span>` : ''}</p>
    </div>
    <div class="row">
    <div class="tabs" role="tablist">${[
      ['list', 'רשימה'],
      ['calendar', 'לוח שנה'],
      ['course', 'לפי קורסים'],
    ]
      .map(
        ([v, l]) =>
          `<button role="tab" aria-selected="${u.view === v}" class="${u.view === v ? 'on' : ''}" data-act="taskView" data-v="${v}">${l}</button>`
      )
      .join('')}</div>
      <button class="btn pri" data-act="addTask">${ic('plus')} הוספת משימה</button>
      </div>
      </div>
  <div class="filters">
      <label class="sr" for="tfC">קורס</label>
      <select id="tfC">
      <option value="all">כל הקורסים</option>
      <option value="none"${u.course === 'none' ? ' selected' : ''}>ללא קורס</option>${courseOpts()
        .map(
          ([v, l]) => `<option value="${v}"${v === u.course ? ' selected' : ''}>${esc(l)}</option>`
        )
        .join('')}</select>
  <label class="sr" for="tfY">שנה</label>
      <select id="tfY" data-yearsel>
      <option value="all">כל השנים</option>${yearOpts()
        .map(([v, l]) => `<option value="${v}"${v === u.y ? ' selected' : ''}>${esc(l)}</option>`)
        .join('')}</select>
  <label class="sr" for="tfS">סמסטר</label>
      <select id="tfS" data-semsel data-all="1">${(u.y === 'all' ? [['all', 'כל הסמסטרים']] : semOpts(u.y, { all: true })).map(([v, l]) => `<option value="${v}"${v === u.s ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
  <label class="sr" for="tfT">סטטוס</label>
    <select id="tfT">${[['open', 'פתוחות'], ['overdue', 'באיחור'], ['all', 'הכל'], ...objOpts(TS)].map(([v, l]) => `<option value="${v}"${v === u.st ? ' selected' : ''}>${l}</option>`).join('')}</select>
  ${
    u.view !== 'calendar'
      ? `<label class="sr" for="tfO">מיון</label>
    <select id="tfO">
    <option value="due"${u.sort === 'due' ? ' selected' : ''}>מיון לפי תאריך יעד</option>
    <option value="prio"${u.sort === 'prio' ? ' selected' : ''}>מיון לפי תעדוף חכם</option>
      </select>`
      : ''
  }</div>
  ${u.sort === 'prio' && u.view !== 'calendar' ? '<p class="small muted" style="margin-top:-6px">תעדוף חכם: מטלות באיחור קודם, ואחר כך לפי קרבת המועד, רמת העדיפות והסטטוס.</p>' : ''}
  ${body}`;
};

AFTER.tasks = () => {
  const u = UI.tasks;
  const b = (id, k) => {
    const el = $(id);
    if (el)
      el.onchange = e => {
        u[k] = e.target.value;
        if (k === 'y') u.s = 'all';
        render();
      };
  };
  b('#tfC', 'course');
  b('#tfY', 'y');
  b('#tfS', 's');
  b('#tfT', 'st');
  b('#tfO', 'sort');
  bindDone();
};

function bindDone() {
  $$('[data-done]').forEach(
    cb =>
      (cb.onchange = () => {
        const t = S.tasks.find(x => x.id === cb.dataset.done);
        t.status = cb.checked ? 'done' : 'todo';
        commit(cb.checked ? 'כל הכבוד! המשימה סומנה כהושלמה' : 'המשימה הוחזרה לרשימה');
      })
  );
}

ACT.taskView = d => {
  UI.tasks.view = d.v;
  render();
};

ACT.taskMonth = d => {
  const m = UI.tasks.month || todayS().slice(0, 7) + '-01';
  UI.tasks.month = d.d === '0' ? null : shiftMonth(m, Number(d.d));
  render();
};

ACT.addTask = d => taskModal(null, d);
ACT.editTask = d => {
  modalStack.slice().forEach(m => m._close());
  taskModal(d.id);
};

ACT.delTask = d => {
  const t = S.tasks.find(x => x.id === d.id);
  confirmBox(`למחוק את <b>${esc(t.title)}</b>?`, () => {
    S.tasks = S.tasks.filter(x => x.id !== d.id);
    modalStack.slice().forEach(m => m._close());
    commit('המשימה נמחקה');
  });
};

function taskModal(id, pre = {}) {
  const ed = !!id;
  const t = ed
    ? S.tasks.find(x => x.id === id)
    : {
        type: pre.type || 'homework',
        priority: S.settings.defaults.taskPriority,
        status: 'todo',
        courseId: pre.course || '',
        due: pre.date || '',
      };
  modal({
    title: ed ? 'עריכת משימה' : pre.type === 'exam' ? 'הוספת מבחן' : 'הוספת משימה',
    wide: true,
    body: `<div class="fg">
    ${fld('שם המשימה', inp('title', t.title, 'text', 'required'), { req: true, full: true })}
    ${fld('קורס משויך', sel('courseId', courseOpts('ללא קורס'), t.courseId))}${fld('סוג', sel('type', objOpts(TT), t.type))}
    ${fld('תאריך הגשה / מועד', inp('due', t.due, 'date'), { req: true })}${fld('שעה', inp('time', t.time, 'time'))}
    ${fld('רמת עדיפות', sel('priority', objOpts(PR), t.priority))}${fld('סטטוס', sel('status', objOpts(TS), t.status))}
    ${fld('זמן עבודה משוער (שעות)', inp('est', t.est, 'number', 'min="0" step="0.5" inputmode="decimal"'))}${fld('מיקום / כיתה', inp('room', t.room))}
    ${fld('תיאור', ta('description', t.description), { full: true })}${fld('הערות', ta('notes', t.notes), { full: true })}</div>`,
    extra: ed
      ? `<button type="button" class="btn" data-act="exportOne" data-kind="task" data-id="${id}">${ic('download')} ייצוא ליומן
        </button>
        <button type="button" class="btn dng" data-act="delTask" data-id="${id}">${ic('trash')} מחיקה
          </button>`
      : '',
    onSubmit: F => {
      if (!F.title) return { err: 'יש להזין שם למשימה', field: 'title' };
      if (!F.due) return { err: 'יש לבחור תאריך', field: 'due' };
      if (F.est && (!isNum(F.est) || F.est < 0))
        return { err: 'זמן העבודה צריך להיות מספר חיובי', field: 'est' };
      const o = {
        title: F.title,
        courseId: F.courseId,
        type: F.type,
        due: F.due,
        time: F.time,
        priority: F.priority,
        status: F.status,
        est: F.est === '' ? null : Number(F.est),
        room: F.room,
        description: F.description,
        notes: F.notes,
      };
      if (ed) Object.assign(t, o);
      else S.tasks.push({ id: uid(), created: todayS(), ...o });
      commit(ed ? 'המשימה עודכנה' : 'המשימה נוספה');
    },
  });
}


/* ============================================================
   עמוד: לוח שנה אקדמי
   תצוגה חודשית, שבועית ויומית
   ============================================================ */
function shiftMonth(m, n) {
  const d = pd(m);
  d.setMonth(d.getMonth() + n, 1);
  return ds(d);
}

function monthGrid(m, items, { nav, noAdd, heat } = {}) {
  const first = pd(m);
  const start = weekStart(m);
  markConflicts(items);
  const by = {};
  items.forEach(i => (by[i.date] = by[i.date] || []).push(i));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    const its = by[d] || [];
    const out = pd(d).getMonth() !== first.getMonth();
    if (heat) {
      const n = its.length;
      const lv = n === 0 ? 0 : n < 2 ? 1 : n < 3 ? 2 : n < 5 ? 3 : 4;
      const bg = `color-mix(in srgb,var(--accent) ${[0, 12, 25, 40, 58][lv]}%,var(--surface))`;
      cells += `<div class="cell ${out ? 'out' : ''} ${d === todayS() ? 'today' : ''}" style="background:${out ? '' : bg}" title="${n} מטלות ומבחנים"><span class="num">${pd(d).getDate()}</span>${n ? `<div class="small" style="text-align:center;font-weight:600">${n}</div>` : ''}</div>`;
      continue;
    }
    const wd = dow(d);
    cells += `<div class="cell ${out ? 'out' : ''} ${wd >= 5 ? 'wkend' : ''} ${its.some(x => x.kind === 'vacation') ? 'hol' : ''} ${d === todayS() ? 'today' : ''} ${UI.cal.sel === d && !noAdd ? 'sel' : ''}" data-act="${noAdd ? '' : 'calSel'}" data-d="${d}"><span class="num">${pd(d).getDate()}</span>${noAdd ? '' : `<button class="ib add" data-act="addEvent" data-date="${d}" aria-label="הוספת אירוע ב־${fmt(d)}">${ic('plus')}</button>`}
    ${its.slice(0, 3).map(evChip).join('')}${
      its.length > 3
        ? `<div class="more">+${its.length - 3} נוספים
      </div>`
        : ''
    }</div>`;
  }
  return `<div class="row mb">
    <button class="ib" data-act="${nav}" data-d="-1" aria-label="החודש הקודם">${ic('chevR')}</button><b style="min-width:120px;text-align:center">${MONTHS[first.getMonth()]} ${first.getFullYear()}</b>
    <button class="ib" data-act="${nav}" data-d="1" aria-label="החודש הבא">${ic('chevL')}</button>
    <button class="btn sm" data-act="${nav}" data-d="0">היום</button>
    </div>
  <div class="cal ${heat ? 'heat' : ''}">${DAYS.map(d => `<div class="dh">${d}</div>`).join('')}${cells}</div>`;
}

function evChip(i) {
  const k = CK[i.kind];
  const c = i.kind === 'lesson' ? i.color : k[1];
  return `<button class="ev k-${i.kind} ${i.conf ? 'conf' : ''}" style="--c:${c}${i.done ? ';text-decoration:line-through;opacity:.6' : ''}" data-act="openItem" data-kind="${i.kind}" data-id="${i.id}" data-date="${i.date}" title="${esc(i.title)}${i.start ? ' · ' + i.start : ''}"><span class="g" aria-hidden="true">${i.done ? '✓' : k[2]}</span>${i.start ? i.start + ' ' : ''}${esc(i.title)}</button>`;
}

function itemRow(i) {
  const k = CK[i.kind];
  const c = i.kind === 'lesson' ? i.color : k[1];
  return `<div class="li clickable strip" style="--c:${c}" data-act="openItem" data-kind="${i.kind}" data-id="${i.id}" data-date="${i.date}" tabindex="0" role="button"><span style="color:${c};width:18px;text-align:center" aria-hidden="true">${k[2]}</span>
    <div class="main">
    <div class="t">${esc(i.title)}${i.conf ? ` <span class="over small">${ic('alert')} חפיפה</span>` : ''}</div>
    <div class="m"><span>${k[0].replace(/ים$|ות$/, '')}</span>${i.start ? `<span>· ${i.start}${i.end ? '–' + i.end : ''}</span>` : '<span>· כל היום</span>'}${i.sub ? `<span>· ${esc(i.sub)}</span>` : ''}</div>
    </div>
    </div>`;
}

PAGES.calendar = () => {
  const u = UI.cal;
  if (!u.view) u.view = S.settings.defaults.calView || 'month';
  if (!u.date) u.date = todayS();
  if (!u.types) u.types = Object.keys(CK);
  if (!u.sel) u.sel = todayS();
  const filt = items => items.filter(i => u.types.includes(i.kind));
  let body = '',
    title = '';
  if (u.view === 'month') {
    const m = u.date.slice(0, 7) + '-01';
    const st = weekStart(m);
    body = monthGrid(m, filt(calItems(st, addDays(st, 41))), { nav: 'calNav' });
    const di = markConflicts(filt(calItems(u.sel, u.sel)));
    body += `<div class="card mt">
      <h3>${fmt(u.sel, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<button class="btn sm" data-act="addEvent" data-date="${u.sel}">${ic('plus')} הוספת אירוע
        </button>
        </h3>${di.length ? `<div class="list">${di.map(itemRow).join('')}</div>` : '<p class="muted small">אין אירועים ביום הזה.</p>'}</div>`;
  } else if (u.view === 'week') {
    const ws = weekStart(u.date);
    const its = markConflicts(filt(calItems(ws, addDays(ws, 6))));
    title = `${fmtShort(ws)} – ${fmt(addDays(ws, 6))}`;
    body = `<div class="row mb">
      <button class="ib" data-act="calNav" data-d="-1" aria-label="השבוע הקודם">${ic('chevR')}</button><b>${title}</b>
      <button class="ib" data-act="calNav" data-d="1" aria-label="השבוע הבא">${ic('chevL')}</button>
      <button class="btn sm" data-act="calNav" data-d="0">היום</button>
      </div>
      <div class="wcols">${[0, 1, 2, 3, 4, 5, 6]
        .map(i => {
          const d = addDays(ws, i);
          const di = its.filter(x => x.date === d);
          return `<div class="wcol ${d === todayS() ? 'today' : ''}">
          <h4>${DAYS[i]} <span class="muted small">${fmtShort(d)}</span>
            </h4>${di.map(evChip).join('') || '<span class="small muted">—</span>'}<button class="btn sm mt" style="width:100%;justify-content:center" data-act="addEvent" data-date="${d}" aria-label="הוספת אירוע ב־${fmt(d)}">${ic('plus')}</button>
          </div>`;
        })
        .join('')}</div>`;
  } else {
    const its = markConflicts(filt(calItems(u.date, u.date)));
    body = `<div class="row mb">
      <button class="ib" data-act="calNav" data-d="-1" aria-label="היום הקודם">${ic('chevR')}</button><b>${fmt(u.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
      <button class="ib" data-act="calNav" data-d="1" aria-label="היום הבא">${ic('chevL')}</button>
      <button class="btn sm" data-act="calNav" data-d="0">היום</button><span class="sp"></span>
      <button class="btn sm" data-act="addEvent" data-date="${u.date}">${ic('plus')} הוספת אירוע
        </button>
      </div>
      <div class="card">${its.length ? `<div class="list">${its.map(itemRow).join('')}</div>` : emptyState('cal', 'אין אירועים ביום הזה', '', `<button class="btn soft sm" data-act="addEvent" data-date="${u.date}">${ic('plus')} הוספת אירוע
        </button>`)}</div>`;
  }
  return `<div class="phead">
    <div>
    <h1>לוח שנה אקדמי</h1>
    <p class="sub">שיעורים, מבחנים ומועדי הגשה מופיעים כאן אוטומטית</p>
    </div>
    <div class="row">
    <div class="tabs" role="tablist">${[
      ['month', 'חודשי'],
      ['week', 'שבועי'],
      ['day', 'יומי'],
    ]
      .map(
        ([v, l]) =>
          `<button role="tab" aria-selected="${u.view === v}" class="${u.view === v ? 'on' : ''}" data-act="calView" data-v="${v}">${l}</button>`
      )
      .join('')}</div>
      <button class="btn pri" data-act="addEvent">${ic('plus')} אירוע חדש</button>
      </div>
      </div>
  <div class="legend mb" role="group" aria-label="סינון לפי סוג">${Object.entries(CK)
    .map(
      ([k, [n, col, g]]) =>
        `<label class="${u.types.includes(k) ? 'on' : ''}" style="--c:${col}">
          <input type="checkbox" data-ctype="${k}" ${u.types.includes(k) ? 'checked' : ''}> ${n}</label>`
    )
    .join('')}</div>${body}`;
};

AFTER.calendar = () => {
  $$('[data-ctype]').forEach(
    cb =>
      (cb.onchange = () => {
        const u = UI.cal;
        u.types = cb.checked
          ? [...u.types, cb.dataset.ctype]
          : u.types.filter(x => x !== cb.dataset.ctype);
        render();
      })
  );
};

ACT.calView = d => {
  UI.cal.view = d.v;
  render();
};

ACT.calSel = (d, b, e) => {
  if (e.target.closest('.ev,.add')) return;
  UI.cal.sel = d.d;
  render();
};

ACT.calNav = d => {
  const u = UI.cal;
  const n = Number(d.d);
  if (n === 0) {
    u.date = todayS();
    u.sel = todayS();
  } else if (u.view === 'month') u.date = shiftMonth(u.date.slice(0, 7) + '-01', n);
  else if (u.view === 'week') u.date = addDays(u.date, 7 * n);
  else u.date = addDays(u.date, n);
  render();
};

ACT.openItem = d => {
  if (d.kind === 'lesson') return ACT.lessonInfo({ id: d.id, date: d.date });
  if (['exam', 'quiz', 'deadline', 'task'].includes(d.kind)) return taskModal(d.id);
  if (d.kind === 'semester') {
    const y = yearOfSem(d.id);
    return yearModal(y.id);
  }
  eventModal(d.id);
};

ACT.addEvent = d => eventModal(null, d.date);
function eventModal(id, date) {
  const ed = !!id;
  const e = ed ? S.events.find(x => x.id === id) : { type: 'personal', date: date || todayS() };
  if (!e) return;
  modal({
    title: ed ? 'עריכת אירוע' : 'אירוע חדש',
    wide: true,
    body: `<div class="fg">${fld('שם האירוע', inp('title', e.title, 'text', 'required'), { req: true, full: true })}
    ${fld('סוג', sel('type', objOpts(ET), e.type))}<div>
      </div>
    ${fld('תאריך', inp('date', e.date, 'date'), { req: true })}${fld('תאריך סיום (לאירוע של כמה ימים)', inp('endDate', e.endDate, 'date'))}
    ${fld('שעת התחלה', inp('start', e.start, 'time'), { hint: 'ריק = אירוע של יום שלם' })}${fld('שעת סיום', inp('end', e.end, 'time'))}
    ${fld('תיאור', ta('description', e.description), { full: true })}</div>
    <p class="small muted">שיעורים, מבחנים ומטלות לא צריך להוסיף כאן: הם מופיעים בלוח אוטומטית.</p>`,
    extra: ed
      ? `<button type="button" class="btn" data-act="exportOne" data-kind="event" data-id="${id}">${ic('download')} ייצוא ליומן
        </button>
        <button type="button" class="btn dng" data-act="delEvent" data-id="${id}">${ic('trash')} מחיקה
          </button>`
      : '',
    onSubmit: F => {
      if (!F.title) return { err: 'יש להזין שם לאירוע', field: 'title' };
      if (!F.date) return { err: 'יש לבחור תאריך', field: 'date' };
      if (F.endDate && F.endDate < F.date)
        return { err: 'תאריך הסיום מוקדם מתאריך ההתחלה', field: 'endDate' };
      if (F.end && !F.start) return { err: 'הזנת שעת סיום בלי שעת התחלה', field: 'start' };
      if (F.start && F.end && F.end <= F.start && !F.endDate)
        return { err: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה', field: 'end' };
      const o = {
        title: F.title,
        type: F.type,
        date: F.date,
        endDate: F.endDate,
        start: F.start,
        end: F.end,
        description: F.description,
      };
      if (ed) Object.assign(e, o);
      else S.events.push({ id: uid(), ...o });
      const clash =
        F.start && F.end
          ? markConflicts(calItems(F.date, F.date)).filter(
              i => i.conf && !(i.kind !== 'lesson' && i.id === (ed ? id : ''))
            )
          : [];
      UI.cal.sel = F.date;
      commit(ed ? 'האירוע עודכן' : 'האירוע נוסף ליומן');
      if (clash.length > 1) toast('שימי לב: האירוע חופף לאירוע אחר באותו יום', 'err');
    },
  });
}

ACT.delEvent = d => {
  const e = S.events.find(x => x.id === d.id);
  confirmBox(`למחוק את <b>${esc(e.title)}</b>?`, () => {
    S.events = S.events.filter(x => x.id !== d.id);
    modalStack.slice().forEach(m => m._close());
    commit('האירוע נמחק');
  });
};


/* ============================================================
   עמוד: ציונים וממוצעים
   ============================================================ */
PAGES.grades = () => {
  const u = UI.grades;
  if (!u.y || !yearById(u.y)) u.y = S.settings.activeYearId;
  const list = S.courses
    .filter(c => c.yearId === u.y && (u.s === 'all' || c.semesterId === u.s))
    .sort((a, b) => courseOrder(a) - courseOrder(b));
  const counted = new Set(countedCourses().map(c => c.id));
  const semAvg = u.s !== 'all' && u.s !== 'annual' ? avg(c => c.semesterId === u.s) : null,
    yAvg = avg(c => c.yearId === u.y),
    dAvg = avg(() => true);
  const series = semesterSeries();
  const yearsAvg = S.years.map(y => ({ n: y.name, v: avg(c => c.yearId === y.id) }));
  const graded = countedCourses().sort((a, b) => courseOrder(a) - courseOrder(b));
  // cumulative
  const cum = [];
  {
    let acc = [];
    S.years.forEach(y =>
      y.semesters.forEach(s => {
        const add = countedCourses().filter(
          c =>
            c.semesterId === s.id ||
            (c.semesterId === 'annual' &&
              c.yearId === y.id &&
              s === y.semesters[y.semesters.length - 1])
        );
        if (add.length) {
          acc = acc.concat(add);
          cum.push({
            l: `${y.name.replace('שנה ', 'ש׳ ')} ${s.name.replace('סמסטר ', 'סמ׳ ')}`,
            v: wavg(acc),
          });
        }
      })
    );
  }
  return `<div class="phead">
    <div>
    <h1>ציונים וממוצעים</h1>
    <p class="sub">ממוצעים משוקללים לפי נקודות זכות</p>
    </div>
    <button class="btn pri" data-act="enterGrade">${ic('plus')} הזנת ציון</button>
    </div>
  <div class="filters">
    <label class="sr" for="gY">שנה</label>
    <select id="gY" data-yearsel>${yearOpts()
      .map(([v, l]) => `<option value="${v}"${v === u.y ? ' selected' : ''}>${esc(l)}</option>`)
      .join('')}</select>
      <label class="sr" for="gS">סמסטר</label>
      <select id="gS" data-semsel data-all="1">${semOpts(u.y, { all: true })
        .map(([v, l]) => `<option value="${v}"${v === u.s ? ' selected' : ''}>${esc(l)}</option>`)
        .join('')}</select>
      </div>
  <div class="grid g3">
      <div class="card stat tone-sky">
      <div class="ic">${ic('chart')}</div>
    <div class="lbl">ממוצע סמסטריאלי
    </div>
    <div class="val">${u.s === 'all' || u.s === 'annual' ? '—' : fmtAvg(semAvg)}</div>
    <div class="hint">${u.s === 'all' || u.s === 'annual' ? 'בחרי סמסטר בסינון' : esc(semById(u.s).name)}</div>
    </div>
  <div class="card stat tone-lilac">
    <div class="ic">${ic('chart')}</div>
    <div class="lbl">ממוצע שנתי
    </div>
    <div class="val">${fmtAvg(yAvg)}</div>
    <div class="hint">${esc(yearById(u.y).name)}</div>
    </div>
  <div class="card stat tone-pink">
    <div class="ic">${ic('cap')}</div>
    <div class="lbl">ממוצע התואר
    </div>
    <div class="val">${fmtAvg(dAvg)}</div>
    <div class="hint">${graded.length} קורסים · ${graded.reduce((a, c) => a + num(c.credits), 0)} נ״ז בחישוב
    </div>
    </div>
    </div>
  <div class="card mt">
    <h3>הקורסים ב${esc(semLabel(u.y, u.s === 'all' ? '' : u.s).replace(/ · $/, ''))}</h3>
  ${
    list.length
      ? `<div class="tblwrap">
        <table class="tbl">
        <thead>
        <tr>
        <th>קורס</th>
        <th>סמסטר</th>
        <th>נ״ז</th>
        <th>ציון סופי</th>
        <th>סטטוס</th>
        <th>בממוצע</th>
        <th></th>
        </tr>
        </thead>
        <tbody>${list
          .map(
            c => `<tr>
              <td><a href="#course-${c.id}" style="color:inherit;font-weight:500"><span class="dot" style="background:${c.color}"></span> ${esc(c.name)}</a></td>
              <td class="small">${c.semesterId === 'annual' ? 'שנתי' : esc((semById(c.semesterId) || {}).name)}</td>
              <td>${num(c.credits) ?? 0}</td>
   <td>${c.gradeType === 'numeric' ? `<input type="number" min="0" max="100" step="0.1" style="width:80px" data-fg="${c.id}" value="${esc(c.finalGrade ?? '')}" placeholder="—" aria-label="ציון סופי ${esc(c.name)}">` : `<span class="chip">${c.gradeType === 'pass' ? (c.passResult === 'pass' ? 'עובר' : c.passResult === 'fail' ? 'נכשל' : 'עובר/נכשל') : 'ללא ציון'}</span>`}</td>
   <td><span class="chip st-${c.status}">${CST[c.status]}</span></td>
     <td>${counted.has(c.id) ? '<span class="chip st-completed">✓ נכלל</span>' : `<span class="chip small" title="${esc(excludeReason(c))}">לא נכלל</span>`}</td>
     <td>
     <button class="ib" data-act="editCourse" data-id="${c.id}" aria-label="עריכת ${esc(c.name)}">${ic('edit')}</button></td>
     </tr>`
          )
          .join('')}</tbody>
            </table>
            </div>`
      : emptyState(
          'book',
          'אין קורסים בבחירה הזו',
          '',
          `<button class="btn soft sm" data-act="addCourse">${ic('plus')} הוספת קורס</button>`
        )
  }
  <p class="small muted">קורס בלי ציון לא נחשב כאפס. ריחוף מעל "לא נכלל" מסביר למה. כללי החישוב (לימוד חוזר, קורסים שנכשלו) נקבעים <a href="#prefs">בהגדרות</a>.</p>
    </div>
  <div class="grid g2 mt">
    <div class="card">
    <h3>ממוצעים לפי סמסטרים
      </h3>${series.length ? barChart({ labels: series.map(s => s.label), series: [{ name: 'ממוצע', color: '#D98AA5', data: series.map(s => +s.v.toFixed(1)) }], max: 100 }) : emptyState('chart', 'אין עדיין נתונים', '', '')}</div>
  <div class="card">
    <h3>השוואה בין שנות לימודים
      </h3>${yearsAvg.some(y => y.v != null) ? barChart({ labels: yearsAvg.map(y => y.n), series: [{ name: 'ממוצע שנתי', color: '#C2577F', data: yearsAvg.map(y => (y.v == null ? null : +y.v.toFixed(1))) }], max: 100 }) : emptyState('chart', 'אין עדיין נתונים', '', '')}</div>
  <div class="card">
    <h3>ציונים לפי קורסים
      </h3>${graded.length ? barChart({ labels: graded.map(c => c.name), series: [{ name: 'ציון', color: '#E3A3B8', data: graded.map(c => num(c.finalGrade)) }], max: 100 }) : emptyState('chart', 'אין עדיין ציונים', '', '')}</div>
  <div class="card">
    <h3>התקדמות הממוצע המצטבר לאורך התואר
      </h3>${cum.length ? lineChart({ labels: cum.map(x => x.l), series: [{ name: 'ממוצע מצטבר', color: '#6E9374', area: true, data: cum.map(x => +x.v.toFixed(2)) }], min: Math.max(0, Math.floor(Math.min(...cum.map(x => x.v)) / 10) * 10 - 10), max: 100 }) : emptyState('trend', 'אין עדיין נתונים', '', '')}</div>
    </div>`;
};

function excludeReason(c) {
  if (c.status === 'cancelled') return 'הקורס בוטל';
  if (c.gradeType === 'pass') return 'קורס עובר/נכשל';
  if (c.gradeType === 'none') return 'קורס ללא ציון';
  if (!isNum(c.finalGrade)) return 'עדיין אין ציון סופי';
  if (c.includeInAvg === false) return 'סומן כלא נכלל בממוצע';
  if (!(num(c.credits) > 0)) return 'אין נקודות זכות';
  if (c.status === 'failed' && !S.settings.avg.includeFailed)
    return 'קורס שנכשל לא נכלל לפי ההגדרות';
  return 'הוחלף בניסיון אחר של אותו קורס (לימוד חוזר)';
}

AFTER.grades = () => {
  $('#gY').onchange = e => {
    UI.grades.y = e.target.value;
    UI.grades.s = 'all';
    render();
  };
  $('#gS').onchange = e => {
    UI.grades.s = e.target.value;
    render();
  };
  $$('[data-fg]').forEach(
    el =>
      (el.onchange = () => {
        const c = courseById(el.dataset.fg);
        const v = el.value.trim();
        if (v !== '' && (!isNum(v) || v < 0 || v > 100)) {
          toast('הציון צריך להיות בין 0 ל־100', 'err');
          el.value = c.finalGrade ?? '';
          return;
        }
        c.finalGrade = v === '' ? null : Number(v);
        if (v !== '' && (c.status === 'notStarted' || c.status === 'inProgress'))
          c.status = 'completed';
        commit('הציון נשמר והממוצעים עודכנו');
      })
  );
};

ACT.enterGrade = () => {
  const cand = S.courses
    .filter(c => c.status !== 'cancelled')
    .sort((a, b) => courseOrder(a) - courseOrder(b));
  if (!cand.length) {
    toast('קודם צריך להוסיף קורס', 'err');
    return courseModal();
  }
  const def = cand.find(c => !isNum(c.finalGrade) && c.gradeType === 'numeric') || cand[0];
  modal({
    title: 'הזנת ציון',
    body: `<div class="fg">${fld(
      'קורס',
      sel(
        'courseId',
        cand.map(c => [c.id, `${c.name} · ${semLabel(c.yearId, c.semesterId)}`]),
        def.id
      ),
      { full: true, req: true }
    )}${fld('ציון סופי', inp('grade', def.finalGrade, 'number', 'min="0" max="100" step="0.1" inputmode="decimal" required'), { req: true })}${fld('סטטוס הקורס', sel('status', objOpts(CST), 'completed'))}</div>
      <p class="small muted">לציון לפי רכיבי הערכה (מבחן, עבודות) – היכנסי לעמוד הקורס.</p>`,
    onOpen: (ov, form) => {
      form.elements.courseId.onchange = () => {
        const c = courseById(form.elements.courseId.value);
        form.elements.grade.value = c.finalGrade ?? '';
      };
    },
    onSubmit: F => {
      if (!isNum(F.grade) || F.grade < 0 || F.grade > 100)
        return { err: 'הציון צריך להיות מספר בין 0 ל־100', field: 'grade' };
      const c = courseById(F.courseId);
      c.finalGrade = Number(F.grade);
      c.gradeType = 'numeric';
      c.status = F.status;
      commit(`הציון של ${c.name} נשמר`);
    },
  });
};


/* ============================================================
   עמוד: מחשבון ציוני יעד
   לקורס ולממוצע התואר
   ============================================================ */
PAGES.target = () => {
  const u = UI.target;
  if (!u.rows) u.rows = [{ name: 'מבחן סופי', weight: null, grade: null }];
  const rows = u.rows;
  const coursesWithComps = S.courses.filter(c => (c.components || []).length);
  // course calc
  let res = '';
  const tgt = num(u.tgt);
  const tw = rows.reduce((a, r) => a + (num(r.weight) || 0), 0);
  const done = rows.filter(r => isNum(r.grade) && isNum(r.weight));
  const rem = rows.filter(r => !isNum(r.grade) && isNum(r.weight));
  const missing = [];
  if (tgt == null) missing.push('ציון יעד');
  if (rows.some(r => !isNum(r.weight))) missing.push('משקל לכל רכיב');
  if (!rem.length) missing.push('לפחות רכיב אחד שעדיין אין לו ציון');
  if (tgt != null && (tgt < 0 || tgt > 100))
    res = `<div class="note bad">${ic('alert')}<div>ציון היעד צריך להיות בין 0 ל־100.
      </div>
      </div>`;
  else if (missing.length)
    res = `<div class="note">${ic('alert')}<div>כדי לחשב חסרים: ${missing.join(', ')}.
      </div>
      </div>`;
  else if (Math.abs(tw - 100) > 0.01)
    res = `<div class="note warn">${ic('alert')}<div>סך המשקלים הוא ${tw}% ולא 100%. עדכני את המשקלים כדי לקבל חישוב נכון.
      </div>
      </div>`;
  else {
    const got = done.reduce((a, r) => a + num(r.weight) * num(r.grade), 0) / 100;
    const rw = rem.reduce((a, r) => a + num(r.weight), 0);
    const need = ((tgt - got) * 100) / rw;
    if (need > 100)
      res = `<div class="note bad">${ic('alert')}<div><b>היעד לא אפשרי.</b> גם עם 100 בכל הרכיבים שנותרו (${rw}% מהציון) הציון הסופי יהיה ${(got + rw).toFixed(1)}, פחות מ־${tgt}.
        </div>
        </div>`;
    else if (need <= 0)
      res = `<div class="note good">${ic('check')}<div><b>כבר הגעת ליעד!</b> הנקודות שכבר צברת (${got.toFixed(1)}) מספיקות לציון ${tgt} גם אם תקבלי 0 ברכיבים שנותרו.
        </div>
        </div>`;
    else
      res = `<div class="note good" style="font-size:16px">${ic('target')}<div>כדי להגיע ל־<b>${tgt}</b> צריך ממוצע של <b style="font-size:22px">${need.toFixed(1)}</b> ברכיבים שנותרו (${rw}% מהציון).
        <div class="small muted">נקודות שכבר נצברו: ${got.toFixed(1)} מתוך ${100 - rw} אפשריות.
        </div>
        </div>
        </div>`;
  }
  // degree calc
  const cc = countedCourses();
  const C = cc.reduce((a, c) => a + num(c.credits), 0);
  const A = wavg(cc);
  const req = num(S.settings.requiredCredits);
  const remDefault =
    req != null
      ? Math.max(
          0,
          req -
            S.courses
              .filter(c => c.status === 'completed' || cc.includes(c))
              .reduce((a, c) => a + (num(c.credits) || 0), 0)
        )
      : null;
  const rc = u.remCr != null && u.remCr !== '' ? num(u.remCr) : remDefault;
  const T = num(u.dTgt);
  let dres = '';
  const dmiss = [];
  if (A == null) dmiss.push('ציונים סופיים בקורסים (כדי לדעת את הממוצע הנוכחי)');
  if (T == null) dmiss.push('ממוצע יעד');
  if (!(rc > 0)) dmiss.push('נקודות הזכות שנותרו לקורסים עם ציון');
  if (T != null && (T < 0 || T > 100))
    dres = `<div class="note bad">${ic('alert')}<div>ממוצע היעד צריך להיות בין 0 ל־100.
      </div>
      </div>`;
  else if (dmiss.length)
    dres = `<div class="note">${ic('alert')}<div>כדי לחשב חסרים: ${dmiss.join(', ')}.
      </div>
      </div>`;
  else {
    const need = (T * (C + rc) - A * C) / rc;
    if (need > 100)
      dres = `<div class="note bad">${ic('alert')}<div><b>היעד לא אפשרי</b> עם ${rc} נ״ז שנותרו. גם עם 100 בכולם הממוצע יגיע ל־${((A * C + 100 * rc) / (C + rc)).toFixed(2)}.
        </div>
        </div>`;
    else if (need <= 0)
      dres = `<div class="note good">${ic('check')}<div>הממוצע שלך כבר גבוה מספיק – היעד יושג בכל מקרה.
        </div>
        </div>`;
    else
      dres = `<div class="note good" style="font-size:16px">${ic('target')}<div>כדי לסיים עם ממוצע <b>${T}</b> צריך ממוצע של <b style="font-size:22px">${need.toFixed(2)}</b> ב־${rc} נקודות הזכות שנותרו.
        </div>
        </div>`;
  }
  return `<div class="phead">
    <div>
    <h1>מחשבון ציוני יעד</h1>
    <p class="sub">כמה צריך לקבל כדי להגיע ליעד</p>
    </div>
    </div>
  <div class="grid g2">
    <div class="card">
    <h3>מחשבון לקורס</h3>
    ${
      coursesWithComps.length
        ? `<div class="row mb">
      <label class="small muted" for="tgC">טעינה מקורס:</label>
      <select id="tgC" style="border:1px solid var(--line);border-radius:999px;padding:5px 12px">
      <option value="">בחירה…</option>${coursesWithComps.map(c => `<option value="${c.id}"${c.id === u.courseId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      </div>`
        : ''
    }
    <div class="fg mb">${fld('ציון יעד בקורס', `<input id="tgT" type="number" min="0" max="100" value="${esc(u.tgt ?? '')}" inputmode="decimal">`)}</div>
    <div class="tblwrap">
      <table class="tbl">
      <thead>
      <tr>
      <th>רכיב</th>
      <th>משקל %</th>
      <th>ציון שהתקבל</th>
      <th></th>
      </tr>
      </thead>
      <tbody>${rows
        .map(
          (r, i) => `<tr>
      <td>
      <input aria-label="שם רכיב" data-tr="${i}" data-f="name" value="${esc(r.name)}"></td>
      <td>
      <input aria-label="משקל" type="number" min="0" max="100" data-tr="${i}" data-f="weight" value="${esc(r.weight ?? '')}"></td>
      <td>
      <input aria-label="ציון" type="number" min="0" max="100" data-tr="${i}" data-f="grade" value="${esc(r.grade ?? '')}" placeholder="טרם התקבל"></td>
      <td>
      <button class="ib dng" data-act="tgDel" data-i="${i}" aria-label="הסרת רכיב">${ic('x')}</button></td>
      </tr>`
        )
        .join('')}</tbody>
      </table>
      </div>
    <div class="row mt mb">
      <button class="btn sm" data-act="tgAdd">${ic('plus')} רכיב
        </button><span class="chip">סך משקלים: ${tw}%</span><span class="chip">משקל שנותר: ${rem.reduce((a, r) => a + (num(r.weight) || 0), 0)}%</span>
      </div>
    <div id="tgRes" aria-live="polite">${res}</div>
      </div>
  <div class="card">
      <h3>מחשבון לממוצע התואר</h3>
    <dl class="dl mb">
      <dt>ממוצע נוכחי</dt>
      <dd><b>${fmtAvg(A)}</b> (${C} נ״ז עם ציון)</dd>
      <dt>מכסת התואר</dt>
      <dd>${req != null ? req + ' נ״ז' : '<a href="#prefs">לא הוגדרה</a>'}</dd>
      </dl>
    <div class="fg mb">${fld('ממוצע יעד רצוי', `<input id="tgD" type="number" min="0" max="100" step="0.1" value="${esc(u.dTgt ?? '')}" inputmode="decimal">`)}${fld('נ״ז שנותרו לקורסים עם ציון', `<input id="tgR" type="number" min="0" step="0.5" value="${esc(rc ?? '')}" inputmode="decimal">`, { hint: remDefault != null ? `ברירת מחדל לפי המכסה: ${remDefault}` : 'אפשר להזין ידנית' })}</div>
    <div id="tgDRes" aria-live="polite">${dres}</div>
      </div>
      </div>`;
};

AFTER.target = () => {
  const u = UI.target;
  const keep = id => {
    const el = $('#' + id);
    return el;
  };
  const rer = focusSel => {
    render();
    if (focusSel) {
      const el = $(focusSel);
      if (el) {
        el.focus();
        try {
          el.setSelectionRange(el.value.length, el.value.length);
        } catch (e) {}
      }
    }
  };
  $('#tgT').onchange = e => {
    u.tgt = e.target.value;
    rer();
  };
  $('#tgD').onchange = e => {
    u.dTgt = e.target.value;
    rer();
  };
  $('#tgR').onchange = e => {
    u.remCr = e.target.value;
    rer();
  };
  $$('[data-tr]').forEach(
    el =>
      (el.onchange = () => {
        const r = u.rows[el.dataset.tr];
        const f = el.dataset.f;
        r[f] = f === 'name' ? el.value : el.value === '' ? null : Number(el.value);
        rer();
      })
  );
  const c = $('#tgC');
  if (c)
    c.onchange = () => {
      if (!c.value) return;
      ACT.targetFor({ id: c.value });
    };
};

ACT.tgAdd = () => {
  UI.target.rows.push({ name: '', weight: null, grade: null });
  render();
};

ACT.tgDel = d => {
  UI.target.rows.splice(Number(d.i), 1);
  if (!UI.target.rows.length) UI.target.rows.push({ name: '', weight: null, grade: null });
  render();
};


/* ============================================================
   עמוד: סימולטור What If
   ממוצע משוער בלי לשנות את הציונים האמיתיים
   ============================================================ */
PAGES.whatif = () => {
  const sim = UI.whatif;
  const st = S.settings;
  const cand = S.courses
    .filter(
      c =>
        c.status !== 'cancelled' &&
        c.gradeType === 'numeric' &&
        !isNum(c.finalGrade) &&
        c.includeInAvg !== false
    )
    .sort((a, b) => courseOrder(a) - courseOrder(b));
  Object.keys(sim).forEach(k => {
    if (!cand.some(c => c.id === k)) delete sim[k];
  });
  const real = countedCourses();
  const simList = real.concat(
    cand
      .filter(c => isNum(sim[c.id]) && num(c.credits) > 0)
      .map(c => ({ ...c, finalGrade: Number(sim[c.id]) }))
  );
  const A = (list, p) => wavg(list.filter(p));
  const semP = c => c.semesterId === st.activeSemesterId,
    yP = c => c.yearId === st.activeYearId,
    all = () => true;
  const cur = [A(real, semP), A(real, yP), A(real, all)],
    prd = [A(simList, semP), A(simList, yP), A(simList, all)];
  const nSim = Object.values(sim).filter(isNum).length;
  const diff = (a, b) =>
    a == null || b == null
      ? ''
      : b - a >= 0
        ? `<span style="color:var(--green-deep)">▲ ${(b - a).toFixed(2)}</span>`
        : `<span class="over">▼ ${(a - b).toFixed(2)}</span>`;
  const labels = [
    `סמסטר (${(activeSem() || {}).name || ''})`,
    `שנה (${(activeYear() || {}).name || ''})`,
    'תואר',
  ];
  return `<div class="phead">
    <div>
    <h1>סימולטור ציונים – What If</h1>
    <p class="sub">בדקי איך ציונים עתידיים ישפיעו על הממוצעים. הסימולציה לא משנה את הציונים האמיתיים.</p>
    </div>
    <button class="btn" data-act="simReset">${ic('undo')} איפוס הסימולציה</button>
    </div>
  <div class="grid g2">
    <div class="card">
    <h3>הממוצע הנוכחי שלי</h3>
    <dl class="dl" style="font-size:15px">${labels
      .map(
        (l, i) => `<dt>${esc(l)}</dt>
    <dd><b>${fmtAvg(cur[i])}</b></dd>`
      )
      .join('')}</dl>
    <p class="small muted">מבוסס על ציונים אמיתיים שנשמרו</p>
    </div>
  <div class="card hero">
    <h3>הממוצע המשוער שלי</h3>
    <dl class="dl" style="font-size:15px">${labels
      .map(
        (l, i) => `<dt>${esc(l)}</dt>
    <dd><b>${fmtAvg(prd[i])}</b> ${diff(cur[i], prd[i])}</dd>`
      )
      .join('')}</dl>
    <p class="small muted">${nSim ? `לפי ${nSim} ציונים משוערים` : 'הזיני ציונים משוערים למטה'}</p>
    </div>
    </div>
  <div class="card mt">
    <h3>השוואה</h3>${
      cur.some(v => v != null) || prd.some(v => v != null)
        ? barChart({
            labels: ['סמסטר', 'שנה', 'תואר'],
            series: [
              {
                name: 'נוכחי',
                color: '#E2CFB5',
                data: cur.map(v => (v == null ? null : +v.toFixed(1))),
              },
              {
                name: 'משוער',
                color: '#C2577F',
                data: prd.map(v => (v == null ? null : +v.toFixed(1))),
              },
            ],
            max: 100,
          })
        : emptyState('chart', 'אין עדיין נתונים להשוואה', 'הזיני ציון משוער לקורס אחד לפחות.', '')
    }</div>
  <div class="card mt">
    <h3>קורסים שעדיין אין להם ציון סופי</h3>${
      cand.length
        ? `<div class="tblwrap">
    <table class="tbl">
    <thead>
    <tr>
    <th>קורס</th>
    <th>סמסטר</th>
    <th>נ״ז</th>
    <th style="width:200px">ציון משוער</th>
    </tr>
    </thead>
    <tbody>${cand
      .map(
        c => `<tr>
    <td><span class="dot" style="background:${c.color}"></span> ${esc(c.name)}</td>
    <td class="small">${esc(semLabel(c.yearId, c.semesterId))}</td>
    <td>${num(c.credits) ?? 0}</td>
    <td>
    <div class="row" style="flex-wrap:nowrap">
    <input type="range" min="0" max="100" value="${isNum(sim[c.id]) ? sim[c.id] : 80}" data-simr="${c.id}" aria-label="ציון משוער ל${esc(c.name)}" style="flex:1;accent-color:var(--accent)">
    <input type="number" min="0" max="100" data-sim="${c.id}" value="${esc(sim[c.id] ?? '')}" placeholder="—" style="width:64px" aria-label="ציון משוער מספרי ל${esc(c.name)}">
    </div></td>
    </tr>`
      )
      .join('')}</tbody>
    </table>
    </div>`
        : emptyState(
            'flask',
            'אין קורסים פתוחים לסימולציה',
            'כל הקורסים עם ציון סופי, או שעוד לא הוספת קורסים.',
            ''
          )
    }</div>`;
};

AFTER.whatif = () => {
  const set = (id, v, focus) => {
    if (v === '' || v == null) delete UI.whatif[id];
    else {
      v = Math.max(0, Math.min(100, Number(v)));
      UI.whatif[id] = v;
    }
    render();
    const el = $(focus);
    if (el) el.focus();
  };
  $$('[data-sim]').forEach(
    el => (el.onchange = () => set(el.dataset.sim, el.value, `[data-sim="${el.dataset.sim}"]`))
  );
  $$('[data-simr]').forEach(el => {
    el.oninput = () => {
      $(`[data-sim="${el.dataset.simr}"]`).value = el.value;
    };
    el.onchange = () => set(el.dataset.simr, el.value, `[data-simr="${el.dataset.simr}"]`);
  });
};

ACT.simReset = () => {
  UI.whatif = {};
  render();
  toast('הסימולציה אופסה', 'ok');
};


/* ============================================================
   עמוד: ההתקדמות שלי
   ============================================================ */
PAGES.progress = () => {
  const p = progress();
  const live = S.courses.filter(c => c.status !== 'cancelled');
  const reqBlock =
    p.req == null
      ? `<div class="note warn mb">${ic('alert')}<div>עוד לא הוגדר כמה נקודות זכות נדרשות לתואר.
        <button class="btn sm soft" data-act="setReq">הגדרת מכסה</button>
        </div>
        </div>`
      : '';
  const W = v => (p.req ? Math.min(100, (v / p.req) * 100) : 0);
  return `<div class="phead">
    <div>
    <h1>ההתקדמות שלי</h1>
    <p class="sub">${esc(S.settings.degreeName || 'התואר')}${p.req != null ? ` · ${p.req} נ״ז נדרשות` : ''}</p>
    </div>${p.req != null ? `<button class="btn" data-act="setReq">${ic('edit')} עדכון מכסה
      </button>` : ''}</div>${reqBlock}
  <div class="card mb">
    <div class="row" style="align-items:baseline"><b style="font-size:40px;letter-spacing:-1px">${p.pct != null ? Math.round(p.pct) + '%' : p.done + ' נ״ז'}</b><span class="muted">${p.pct != null ? 'מהתואר הושלם' : 'הושלמו'}</span>
    </div>
   <div class="bar big mt" role="img" aria-label="${p.done} הושלמו, ${p.act} פעילות">${p.req ? `<i style="width:${W(p.done)}%;background:#8DB592"></i>
     <i style="width:${W(p.act)}%;background:#E3A3B8"></i>
     <i style="width:${Math.max(0, W(p.fut) - Math.max(0, W(p.done) + W(p.act) + W(p.fut) - 100))}%;background:#E2CFB5"></i>` : ''}</div>
   <div class="chlegend"><span><i class="dot" style="background:#8DB592"></i>הושלמו</span><span>
     <i class="dot" style="background:#E3A3B8"></i>קורסים פעילים</span><span>
     <i class="dot" style="background:#E2CFB5"></i>קורסים עתידיים</span>
     </div>
     </div>
  <div class="grid g3">
   ${[
     ['נקודות זכות נדרשות', p.req ?? '—', 'lilac', 'cap'],
     ['נקודות זכות שהושלמו', p.done, 'mint', 'check'],
     ['נ״ז בקורסים פעילים', p.act, 'sky', 'clock'],
     ['נקודות זכות שנותרו', p.left ?? '—', 'pink', 'trend'],
     ['אחוז התקדמות', p.pct != null ? p.pct.toFixed(1) + '%' : '—', 'lilac', 'chart'],
     ['קורסים שהושלמו', p.nDone, 'mint', 'book'],
   ]
     .map(
       ([l, v, t, i]) =>
         `<div class="card stat tone-${t}">
           <div class="ic">${ic(i)}</div>
           <div class="lbl">${l}</div>
           <div class="val">${v}</div>
           </div>`
     )
     .join('')}
  </div>
  <div class="card mt">
    <h3>נקודות זכות לפי שנות לימודים</h3>${creditsByYearChart()}</div>
  <div class="grid g3 mt">${[
    ['completed', 'הושלמו', '#DDEBDC'],
    ['inProgress', 'פעילים', '#F8E0E7'],
    ['notStarted', 'עתידיים', '#F1E6D6'],
  ]
    .map(([k, n, bg]) => {
      const cs = live.filter(c => c.status === k);
      return `<div class="card">
        <h3>${n} <span class="chip" style="background:${bg}">${cs.length}</span></h3>${
          cs.length
            ? `<div class="list">${cs
                .map(
                  c => `<a class="li clickable" href="#course-${c.id}" style="text-decoration:none;color:inherit"><span class="dot" style="background:${c.color}"></span>
        <div class="main">
        <div class="t">${esc(c.name)}</div>
        <div class="m">${num(c.credits) ?? 0} נ״ז · ${esc(semLabel(c.yearId, c.semesterId))}</div>
        </div></a>`
                )
                .join('')}</div>`
            : '<p class="muted small">אין</p>'
        }</div>`;
    })
    .join('')}</div>`;
};

ACT.setReq = () =>
  modal({
    title: 'מכסת נקודות זכות לתואר',
    body: fld(
      'נקודות זכות נדרשות',
      inp('req', S.settings.requiredCredits, 'number', 'min="1" step="0.5" inputmode="decimal"'),
      { req: true, hint: 'לפי תוכנית הלימודים שלך' }
    ),
    onSubmit: F => {
      if (!isNum(F.req) || F.req <= 0) return { err: 'יש להזין מספר חיובי', field: 'req' };
      S.settings.requiredCredits = Number(F.req);
      commit('המכסה נשמרה');
    },
  });


/* ============================================================
   עמוד: מפת התואר
   קורסים לפי שנים ודרישות קדם
   ============================================================ */
function mapKind(c) {
  if (c.status === 'cancelled') return 'cancel';
  if (c.status === 'completed') return 'done';
  if (c.status === 'inProgress') return 'active';
  const pre = (c.prereqs || []).map(courseById).filter(Boolean);
  if (pre.some(p => p.status !== 'completed')) return 'blocked';
  return 'future';
}

PAGES.map = () => {
  const u = UI.map;
  const years = S.years.filter(y => u.y === 'all' || y.id === u.y);
  const any = S.courses.length;
  return `<div class="phead">
    <div>
    <h1>מפת התואר שלי</h1>
    <p class="sub">מסלול הלימודים ודרישות הקדם, לפי מה שהזנת</p>
    </div>
    <button class="btn pri" data-act="addCourse">${ic('plus')} הוספת קורס</button>
    </div>
  <div class="filters">
    <label class="sr" for="mY">שנה</label>
    <select id="mY">
    <option value="all">כל השנים</option>${yearOpts()
      .map(([v, l]) => `<option value="${v}"${v === u.y ? ' selected' : ''}>${esc(l)}</option>`)
      .join('')}</select>
  <span class="sp"></span>
      <div class="legend"><span class="chip" style="background:#DDEBDC">הושלם</span><span class="chip" style="background:#F8E0E7">פעיל</span><span class="chip" style="background:#F1E6D6">עתידי</span><span class="chip" style="background:#F4D6D1">חסרות דרישות קדם</span>
      </div>
      </div>
  ${
    any
      ? `<div class="card mapwrap" id="mapwrap"><svg class="mapsvg" id="mapsvg"></svg>
        <div class="mapgrid">${years
          .map(
            y =>
              `<div class="mapcol">
                <h4>${esc(y.name)}</h4>${[...y.semesters, { id: 'annual', name: 'שנתי' }]
                  .map(s => {
                    const cs = S.courses.filter(c => c.yearId === y.id && c.semesterId === s.id);
                    if (!cs.length && s.id === 'annual') return '';
                    return `<div class="mapsem">
                    <h5>${esc(s.name)}</h5>${
                      cs
                        .map(c => {
                          const k = mapKind(c);
                          return `<button class="mnode k-${k}" data-node="${c.id}" data-act="mapNode" data-id="${c.id}">${esc(c.name)}<small>${num(c.credits) ?? 0} נ״ז${(c.prereqs || []).length ? ` · ${c.prereqs.length} דרישות קדם` : ''}${k === 'blocked' ? ' · חסרה דרישת קדם' : ''}</small>
                            </button>`;
                        })
                        .join('') || '<div class="small muted" style="padding:4px">—</div>'
                    }</div>`;
                  })
                  .join('')}</div>`
          )
          .join('')}</div>
            </div>`
      : `<div class="card">${emptyState('map', 'המפה ריקה', 'הוסיפי קורסים וקבעי דרישות קדם כדי לראות את מסלול התואר.', `<button class="btn soft" data-act="addCourse">${ic('plus')} הוספת קורס
        </button>`)}</div>`
  }`;
};

function drawMapLines() {
  const wrap = $('#mapwrap'),
    svg = $('#mapsvg');
  if (!wrap || !svg) return;
  const wr = wrap.getBoundingClientRect();
  svg.setAttribute('width', wrap.scrollWidth);
  svg.setAttribute('height', wrap.scrollHeight);
  let g =
    '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#B9A89A"/></marker></defs>';
  S.courses.forEach(c =>
    (c.prereqs || []).forEach(p => {
      const a = $(`[data-node="${p}"]`, wrap),
        b = $(`[data-node="${c.id}"]`, wrap);
      if (!a || !b) return;
      const ra = a.getBoundingClientRect(),
        rb = b.getBoundingClientRect();
      const sl = wrap.scrollLeft,
        st = wrap.scrollTop;
      // RTL: earlier years on the right; connect left edge of prereq to right edge of course
      let x1, x2;
      if (ra.left > rb.right) {
        x1 = ra.left - wr.left + sl;
        x2 = rb.right - wr.left + sl;
      } else if (rb.left > ra.right) {
        x1 = ra.right - wr.left + sl;
        x2 = rb.left - wr.left + sl;
      } else {
        x1 = ra.left - wr.left + sl + 8;
        x2 = rb.left - wr.left + sl + 8;
      }
      const y1 = ra.top + ra.height / 2 - wr.top + st,
        y2 = rb.top + rb.height / 2 - wr.top + st;
      const mx = (x1 + x2) / 2;
      const ok = courseById(p).status === 'completed';
      const path =
        Math.abs(x1 - x2) < 20
          ? `M${x1} ${y1} C${x1 - 40} ${y1},${x2 - 40} ${y2},${x2} ${y2}`
          : `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`;
      g += `<path d="${path}" fill="none" stroke="${ok ? '#8DB592' : '#D98AA5'}" stroke-width="2" ${ok ? '' : 'stroke-dasharray="5 4"'} marker-end="url(#ar)"/>`;
    })
  );
  svg.innerHTML = g;
}

AFTER.map = () => {
  $('#mY').onchange = e => {
    UI.map.y = e.target.value;
    render();
  };
  requestAnimationFrame(drawMapLines);
};

window.addEventListener('resize', () => {
  if (route()[0] === 'map') drawMapLines();
});

ACT.mapNode = d => {
  const c = courseById(d.id);
  const pre = (c.prereqs || []).map(courseById).filter(Boolean);
  const k = mapKind(c);
  const next = S.courses.filter(x => (x.prereqs || []).includes(c.id));
  modal({
    title: esc(c.name),
    body: `<div class="row mb"><span class="chip st-${c.status}">${CST[c.status]}</span><span class="chip">${num(c.credits) ?? 0} נ״ז</span><span class="chip">${esc(semLabel(c.yearId, c.semesterId))}</span>
      </div>
   <h4 style="margin:8px 0">דרישות קדם
     </h4>${pre.length ? pre.map(p => `<div class="row small" style="margin-bottom:4px">${p.status === 'completed' ? `<span class="chip st-completed">✓ הושלם</span>` : `<span class="chip st-failed">✗ טרם הושלם</span>`} ${esc(p.name)}</div>`).join('') : '<p class="small muted">אין דרישות קדם</p>'}
   ${
     k === 'blocked'
       ? `<div class="note warn mt small">${ic('alert')}<div>כדי להתחיל את הקורס צריך להשלים קודם: <b>${pre
           .filter(p => p.status !== 'completed')
           .map(p => esc(p.name))
           .join(', ')}</b>
             </div>
             </div>`
       : ''
   }
   ${
     next.length
       ? `<h4 style="margin:14px 0 6px">קורסים שתלויים בו</h4>
     <div class="small">${next.map(x => esc(x.name)).join(' · ')}</div>`
       : ''
   }`,
    extra: `${c.status !== 'completed' ? `<button type="button" class="btn soft" data-act="markDone" data-id="${c.id}">${ic('check')} סימון כהושלם
      </button>` : ''}<button type="button" class="btn" data-act="editCourse" data-id="${c.id}">${ic('edit')} עריכה ודרישות קדם
      </button><a class="btn" href="#course-${c.id}" data-close>לעמוד הקורס</a>`,
  });
};

ACT.markDone = d => {
  const c = courseById(d.id);
  c.status = 'completed';
  modalStack.slice().forEach(m => m._close());
  commit(`${c.name} סומן כהושלם`);
};


/* ============================================================
   עמוד: עומס הלימודים
   עומס שבועי, צפיפות חודשית והמלצות
   ============================================================ */
PAGES.load = () => {
  const u = UI.load;
  const ws0 = addDays(weekStart(todayS()), u.off * 7);
  const N = 8;
  const weeks = [...Array(N)].map((_, i) => {
    const s = addDays(ws0, i * 7),
      e = addDays(s, 6);
    const ts = S.tasks.filter(t => t.due && t.due >= s && t.due <= e && t.status !== 'cancelled');
    const ex = ts.filter(isExam),
      tk = ts.filter(t => !isExam(t));
    const hrs = ts.filter(t => t.status !== 'done').reduce((a, t) => a + (num(t.est) || 0), 0);
    return { s, e, ex, tk, hrs, score: ex.length * 2 + tk.length };
  });
  const scores = weeks.map(w => w.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / N;
  weeks.forEach(
    w => (w.high = w.score >= 4 && (w.score >= avgScore * 1.5 || w.ex.length >= 2 || w.score >= 6))
  );
  const td = todayS();
  const next7 = S.tasks.filter(t => isOpen(t) && t.due && t.due >= td && t.due <= addDays(td, 6));
  const nw = weeks.find(w => w.s === addDays(weekStart(td), 7));
  const msgs = [];
  const cnt = (n, one, many) => (n === 1 ? one : `${n} ${many}`);
  if (u.off === 0 && nw && (nw.ex.length || nw.tk.length)) {
    const parts = [];
    if (nw.ex.length) parts.push(cnt(nw.ex.length, 'מבחן אחד', 'מבחנים'));
    if (nw.tk.length) parts.push(cnt(nw.tk.length, 'מטלה אחת', 'מטלות') + ' להגשה');
    msgs.push(['sky', `השבוע הבא כולל ${parts.join(' ו')}.`]);
  }
  if (next7.length >= 3)
    msgs.push([
      'warn',
      `יש לך ${next7.length} מועדי הגשה ומבחנים ב־7 הימים הקרובים. כדאי לבדוק את חלוקת המשימות.`,
    ]);
  const od = S.tasks.filter(isOverdue);
  if (od.length)
    msgs.push([
      'bad',
      `${od.length === 1 ? 'משימה אחת עברה' : od.length + ' משימות עברו'} את מועד ההגשה ועדיין לא סומנו כהושלמו.`,
    ]);
  weeks
    .filter(w => w.high && w.s !== (nw || {}).s)
    .slice(0, 2)
    .forEach(w =>
      msgs.push([
        'warn',
        `השבוע של ${fmtShort(w.s)} עמוס: ${w.ex.length} מבחנים ו־${w.tk.length} מטלות${w.hrs ? `, כ־${w.hrs} שעות עבודה משוערות` : ''}.`,
      ])
    );
  const noEst = S.tasks.filter(t => isOpen(t) && !isNum(t.est)).length;
  const m = u.month || td.slice(0, 7) + '-01';
  const st = weekStart(m);
  const heatItems = calItems(st, addDays(st, 41)).filter(i =>
    ['exam', 'quiz', 'deadline', 'task'].includes(i.kind)
  );
  const tot = {
    ex: weeks.reduce((a, w) => a + w.ex.length, 0),
    tk: weeks.reduce((a, w) => a + w.tk.length, 0),
    hrs: weeks.reduce((a, w) => a + w.hrs, 0),
    hi: weeks.filter(w => w.high).length,
  };
  return `<div class="phead">
    <div>
    <h1>עומס הלימודים שלי</h1>
    <p class="sub">${N} שבועות מ־${fmtShort(ws0)} עד ${fmtShort(addDays(ws0, N * 7 - 1))}</p>
    </div>
    <div class="row">
    <button class="ib" data-act="loadNav" data-d="-4" aria-label="תקופה קודמת">${ic('chevR')}</button>
    <button class="btn sm" data-act="loadNav" data-d="0">מהשבוע</button>
    <button class="ib" data-act="loadNav" data-d="4" aria-label="תקופה הבאה">${ic('chevL')}</button>
    </div>
    </div>
  ${!S.tasks.length ? `<div class="card mb">${emptyState('gauge', 'אין עדיין נתונים לניתוח', 'הניתוח מבוסס על המטלות והמבחנים שתזיני, כולל זמן עבודה משוער.', `<button class="btn soft" data-act="addTask">${ic('plus')} הוספת משימה
    </button>`)}</div>` : ''}
  ${
    msgs.length
      ? `<div class="grid mb" style="gap:8px">${msgs
          .map(
            ([
              k,
              t,
            ]) => `<div class="note ${k === 'sky' ? '' : k}">${ic(k === 'bad' ? 'alert' : 'sparkle')}<div>${esc(t)}</div>
    </div>`
          )
          .join('')}</div>`
      : ''
  }
  <div class="grid g4">
    <div class="card stat tone-pink">
    <div class="ic">${ic('alert')}</div>
    <div class="lbl">מבחנים בתקופה
    </div>
    <div class="val">${tot.ex}</div>
    </div>
    <div class="card stat tone-lilac">
    <div class="ic">${ic('check')}</div>
    <div class="lbl">מטלות בתקופה
    </div>
    <div class="val">${tot.tk}</div>
    </div>
    <div class="card stat tone-sky">
    <div class="ic">${ic('clock')}</div>
    <div class="lbl">שעות עבודה משוערות
    </div>
    <div class="val">${tot.hrs}</div>
    <div class="hint">${noEst ? `ל־${noEst} משימות פתוחות אין הערכה` : 'למשימות שלא הושלמו'}</div>
    </div>
    <div class="card stat tone-mint">
    <div class="ic">${ic('cal')}</div>
    <div class="lbl">מועדים ב־7 הימים הקרובים
    </div>
    <div class="val">${next7.length}</div>
    </div>
    </div>
  <div class="card mt">
    <h3>עומס שבועי</h3>${barChart({
      labels: weeks.map(
        w => (w.high ? '⚠ ' : '') + pd(w.s).getDate() + '/' + (pd(w.s).getMonth() + 1)
      ),
      stacked: true,
      series: [
        { name: 'מבחנים ובחנים', color: '#C2577F', data: weeks.map(w => w.ex.length) },
        { name: 'מטלות', color: '#E2CFB5', data: weeks.map(w => w.tk.length) },
      ],
      line: tot.hrs
        ? {
            name: 'שעות עבודה (מחולק ב־5)',
            color: '#6E9374',
            data: weeks.map(w => +(w.hrs / 5).toFixed(1)),
          }
        : null,
    })}
   <div class="tblwrap mt">
     <table class="tbl">
     <thead>
     <tr>
     <th>שבוע</th>
     <th>מבחנים</th>
     <th>מטלות</th>
     <th>שעות משוערות</th>
     <th>עומס</th>
     </tr>
     </thead>
     <tbody>${weeks
       .map(
         w => `<tr ${w.high ? 'style="background:var(--today-bg)"' : ''}>
     <td>${fmtShort(w.s)} – ${fmtShort(w.e)}</td>
     <td>${w.ex.length}</td>
     <td>${w.tk.length}</td>
     <td>${w.hrs || '—'}</td>
     <td>${w.high ? '<span class="chip b-high">עמוס</span>' : w.score ? '<span class="chip b-low">רגיל</span>' : '<span class="chip">פנוי</span>'}</td>
     </tr>`
       )
       .join('')}</tbody>
     </table>
     </div>
     </div>
  <div class="card mt">
     <h3>צפיפות מטלות ומבחנים בחודש
       </h3>${monthGrid(m, heatItems, { nav: 'loadMonth', noAdd: true, heat: true })}<div class="chlegend"><span>פחות</span>${[0, 12, 25, 40, 58].map(c => `<i class="dot" style="background:color-mix(in srgb,var(--accent) ${c}%,var(--surface));width:16px;height:16px;border-radius:4px;box-shadow:0 0 0 1px var(--line)"></i>`).join('')}<span>יותר</span>
    </div>
    </div>`;
};

ACT.loadNav = d => {
  UI.load.off = d.d === '0' ? 0 : UI.load.off + Number(d.d);
  render();
};

ACT.loadMonth = d => {
  const m = UI.load.month || todayS().slice(0, 7) + '-01';
  UI.load.month = d.d === '0' ? null : shiftMonth(m, Number(d.d));
  render();
};


/* ============================================================
   עמוד: סיכומים וחומרי לימוד
   ============================================================ */
const MICON = {
  summary: ['summary', '#F8E0E7', '#A8456C'],
  slides: ['slides', '#F6E4CC', '#8A6234'],
  article: ['article', '#E3ECE1', '#4E7454'],
  doc: ['file', '#E3ECE1', '#4E7454'],
  pdf: ['pdf', '#F8E0E7', '#A8456C'],
  link: ['link', '#DDEBDC', '#3D7A4F'],
  video: ['video', '#F4D6D1', '#93372E'],
  note: ['note', '#F6E9C9', '#7E5F16'],
};

function matCard(m) {
  const [icn, bg, fg] = MICON[m.type] || MICON.doc;
  const href = m.url || '';
  return `<div class="mcard">
    <div class="mic" style="background:${bg};color:${fg}">${ic(icn)}</div>
    <div style="flex:1;min-width:0">
    <h4>${esc(m.title)}</h4>
    <div class="small muted">${MT[m.type] || ''} · ${esc(courseName(m.courseId))} · נוסף ${fmtShort(m.added)}</div>${m.notes ? `<div class="small" style="margin-top:6px;white-space:pre-wrap">${esc(m.notes.length > 140 ? m.notes.slice(0, 140) + '…' : m.notes)}</div>` : ''}${m.fileName ? `<div class="small muted" style="margin-top:4px">${ic('file')} ${esc(m.fileName)}</div>` : ''}
  <div class="row" style="margin-top:8px">${href ? `<a class="btn sm soft" href="${esc(href)}" target="_blank" rel="noopener">${ic(m.assetId ? 'file' : 'link')} פתיחה</a>` : ''}<button class="btn sm" data-act="editMat" data-id="${m.id}">${ic('edit')} עריכה
    </button>
    <button class="ib dng" data-act="delMat" data-id="${m.id}" aria-label="מחיקת ${esc(m.title)}">${ic('trash')}</button>
    </div>
    </div>
    </div>`;
}

PAGES.materials = () => {
  const u = UI.mat;
  const list = S.materials
    .filter(
      m =>
        (u.course === 'all' || m.courseId === u.course) &&
        (u.type === 'all' || m.type === u.type) &&
        (!u.q || (m.title + ' ' + (m.notes || '')).toLowerCase().includes(u.q.toLowerCase()))
    )
    .sort((a, b) => (b.added || '').localeCompare(a.added || ''));
  return `<div class="phead">
    <div>
    <h1>סיכומים וחומרי לימוד</h1>
    <p class="sub">${S.materials.length} חומרים</p>
    </div>
    <button class="btn pri" data-act="addMat">${ic('plus')} הוספת חומר</button>
    </div>
  <div class="filters">
    <label class="sr" for="mtQ">חיפוש לפי שם</label>
    <input id="mtQ" type="search" placeholder="חיפוש לפי שם" value="${esc(u.q)}">
    <label class="sr" for="mtC">קורס</label>
    <select id="mtC">
    <option value="all">כל הקורסים</option>${courseOpts()
      .map(
        ([v, l]) => `<option value="${v}"${v === u.course ? ' selected' : ''}>${esc(l)}</option>`
      )
      .join('')}</select>
      <label class="sr" for="mtT">סוג</label>
      <select id="mtT">
      <option value="all">כל הסוגים</option>${objOpts(MT)
        .map(([v, l]) => `<option value="${v}"${v === u.type ? ' selected' : ''}>${l}</option>`)
        .join('')}</select>
      </div>
  ${list.length ? `<div class="grid g3">${list.map(matCard).join('')}</div>` : `<div class="card">${S.materials.length ? emptyState('search', 'לא נמצאו חומרים', 'נסי חיפוש או סינון אחר.', '') : emptyState('folder', 'עוד אין חומרי לימוד', 'שמרי כאן סיכומים, מצגות, קבצים וקישורים לכל קורס.', `<button class="btn soft" data-act="addMat">${ic('plus')} הוספת חומר
    </button>`)}</div>`}`;
};

AFTER.materials = () => {
  const u = UI.mat;
  $('#mtC').onchange = e => {
    u.course = e.target.value;
    render();
  };
  $('#mtT').onchange = e => {
    u.type = e.target.value;
    render();
  };
  let t;
  $('#mtQ').oninput = e => {
    clearTimeout(t);
    t = setTimeout(() => {
      u.q = e.target.value;
      render();
      const q = $('#mtQ');
      q.focus();
      q.setSelectionRange(q.value.length, q.value.length);
    }, 250);
  };
};

ACT.addMat = d => matModal(null, d.course);
ACT.editMat = d => matModal(d.id);
ACT.delMat = d => {
  const m = S.materials.find(x => x.id === d.id);
  confirmBox(`למחוק את <b>${esc(m.title)}</b>?`, async () => {
    S.materials = S.materials.filter(x => x.id !== d.id);
    if (m.assetId) {
      try {
        const a = await claude.use('assets');
        a && a.delete(m.assetId);
      } catch (e) {}
    }
    commit('החומר נמחק');
  });
};

let ASSETS = null;
function matModal(id, course) {
  if (!S.courses.length) {
    toast('קודם צריך להוסיף קורס', 'err');
    return courseModal();
  }
  const ed = !!id;
  const m = ed
    ? S.materials.find(x => x.id === id)
    : { type: 'summary', courseId: course || S.courses[0].id };
  modal({
    title: ed ? 'עריכת חומר לימוד' : 'הוספת חומר לימוד',
    wide: true,
    body: `<div class="fg">${fld('שם החומר', inp('title', m.title, 'text', 'required'), { req: true, full: true })}${fld('קורס', sel('courseId', courseOpts(), m.courseId), { req: true })}${fld('סוג', sel('type', objOpts(MT), m.type))}
    ${fld('קישור', inp('url', m.assetId ? '' : m.url, 'url', 'placeholder="https://…" dir="ltr"'), { full: true, hint: 'לאתר, לסרטון, ל־Drive וכדומה' })}
    <div class="fld full"><span>העלאת קובץ</span>${ASSETS ? `<input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.md,.csv,.json,.mp4,.webm" style="border:1px dashed var(--line);border-radius:11px;padding:12px;background:var(--bg)"><small>PDF, תמונות, טקסט וסרטונים עד 20MB${m.fileName ? ` · קובץ נוכחי: ${esc(m.fileName)}` : ''}. קובצי Word ו־PowerPoint: שמרי כ־PDF או הוסיפי קישור.</small>` : `<small>${window.claude ? 'העלאת קבצים זמינה כשהאתר פתוח מתוך החשבון שלך.' : 'בגרסה המקומית אין העלאת קבצים.'} אפשר לשמור קישור לקובץ (למשל ב־Google Drive).</small>`}</div>
    ${fld('הערות / תוכן', ta('notes', m.notes), { full: true })}</div>`,
    onSubmit: (F, form) => {
      if (!F.title) return { err: 'יש להזין שם', field: 'title' };
      if (F.url && !/^https?:\/\//i.test(F.url))
        return { err: 'הקישור צריך להתחיל ב־https://', field: 'url' };
      const file = form.elements.file && form.elements.file.files[0];
      if (file && file.size > 20 * 1024 * 1024) return { err: 'הקובץ גדול מ־20MB', field: 'file' };
      const save = (extra = {}) => {
        const o = { title: F.title, courseId: F.courseId, type: F.type, notes: F.notes, ...extra };
        if (!extra.assetId && !file) {
          o.url = F.url || (m.assetId && !F.url ? m.url : '');
          if (F.url) {
            o.assetId = null;
            o.fileName = '';
          }
        }
        if (ed) Object.assign(m, o);
        else S.materials.push({ id: uid(), added: todayS(), ...o });
        commit(ed ? 'החומר עודכן' : 'החומר נשמר');
      };
      if (file) {
        const btn = $('button[type=submit]', form);
        btn.disabled = true;
        btn.textContent = 'מעלה…';
        ASSETS.upload(file)
          .then(r => {
            save({ assetId: r.id, url: r.url || '/_blob/' + r.id, fileName: file.name });
            modalStack.slice().forEach(x => x._close());
          })
          .catch(e => {
            btn.disabled = false;
            btn.textContent = 'שמירה';
            const er = $('.err', form);
            er.textContent =
              'ההעלאה נכשלה' +
              (e && e.message ? ': ' + e.message : '') +
              '. אפשר לנסות שוב או לשמור קישור במקום.';
            er.classList.add('show');
          });
        return false;
      }
      if (!F.url && !ed && !F.notes && F.type !== 'note') {
      }
      save();
    },
  });
}


/* ============================================================
   חיפוש כללי
   ============================================================ */
function searchAll(q) {
  q = q.trim().toLowerCase();
  if (!q) return null;
  const has = s => (s || '').toLowerCase().includes(q);
  return [
    [
      'קורסים',
      S.courses
        .filter(c => has(c.name) || has(c.code) || has(c.lecturer))
        .map(c => ({
          k: 'course',
          id: c.id,
          t: c.name,
          s: [c.code, semLabel(c.yearId, c.semesterId)].filter(Boolean).join(' · '),
        })),
    ],
    [
      'מטלות',
      S.tasks
        .filter(t => !isExam(t) && (has(t.title) || has(t.description)))
        .map(t => ({
          k: 'task',
          id: t.id,
          t: t.title,
          s: [courseName(t.courseId), fmtShort(t.due)].filter(Boolean).join(' · '),
        })),
    ],
    [
      'מבחנים ובחנים',
      S.tasks
        .filter(t => isExam(t) && (has(t.title) || has(courseName(t.courseId))))
        .map(t => ({
          k: 'task',
          id: t.id,
          t: t.title,
          s: [courseName(t.courseId), fmtShort(t.due)].filter(Boolean).join(' · '),
        })),
    ],
    [
      'אירועים',
      S.events
        .filter(e => has(e.title) || has(e.description))
        .map(e => ({ k: 'event', id: e.id, t: e.title, s: fmt(e.date) })),
    ],
    [
      'סיכומים',
      S.materials
        .filter(m => m.type === 'summary' && (has(m.title) || has(m.notes)))
        .map(m => ({ k: 'mat', id: m.id, t: m.title, s: courseName(m.courseId) })),
    ],
    [
      'חומרי לימוד וקישורים',
      S.materials
        .filter(m => m.type !== 'summary' && (has(m.title) || has(m.notes) || has(m.url)))
        .map(m => ({
          k: 'mat',
          id: m.id,
          t: m.title,
          s: `${MT[m.type]} · ${courseName(m.courseId)}`,
        })),
    ],
  ].filter(g => g[1].length);
}

function showSearch() {
  const q = $('#q').value;
  const box = $('#sres');
  const r = searchAll(q);
  if (r == null) {
    box.classList.remove('show');
    return;
  }
  box.innerHTML = r.length
    ? r
        .map(
          ([h, items]) =>
            `<h4>${h}</h4>${items
              .slice(0, 6)
              .map(
                i =>
                  `<button data-sk="${i.k}" data-sid="${i.id}">${esc(i.t)}<small>${esc(i.s || '')}</small>
                    </button>`
              )
              .join('')}`
        )
        .join('')
    : `<div class="empty" style="padding:14px">${ic('search')}<p style="margin:6px 0 0">לא נמצאו תוצאות עבור "${esc(q)}"</p>
      </div>`;
  box.classList.add('show');
}

function initSearch() {
  const q = $('#q'),
    box = $('#sres');
  let t;
  q.oninput = () => {
    clearTimeout(t);
    t = setTimeout(showSearch, 150);
  };
  q.onfocus = showSearch;
  q.onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const f = $('button', box);
      f && f.click();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const f = $('button', box);
      f && f.focus();
    }
    if (e.key === 'Escape') {
      box.classList.remove('show');
      q.blur();
    }
  };
  box.addEventListener('keydown', e => {
    const bs = $$('button', box);
    const i = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (bs[i + 1] || bs[0]).focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      i <= 0 ? q.focus() : bs[i - 1].focus();
    }
    if (e.key === 'Escape') {
      box.classList.remove('show');
      q.focus();
    }
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-sk]');
    if (!b) return;
    box.classList.remove('show');
    q.value = '';
    const k = b.dataset.sk,
      id = b.dataset.sid;
    if (k === 'course') go('course-' + id);
    else if (k === 'task') {
      const t = S.tasks.find(x => x.id === id);
      UI.tasks.st = 'all';
      UI.tasks.view = 'list';
      go('tasks');
      taskModal(id);
    } else if (k === 'event') {
      const e = S.events.find(x => x.id === id);
      UI.cal.date = e.date;
      UI.cal.sel = e.date;
      UI.cal.view = 'month';
      go('calendar');
      eventModal(id);
    } else if (k === 'mat') {
      const m = S.materials.find(x => x.id === id);
      UI.mat = { course: 'all', type: 'all', q: m.title };
      go('materials');
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.searchbox')) box.classList.remove('show');
  });
}


/* ============================================================
   ייצוא ליומן
   יצירת קובץ ics לפי שעון ישראל
   ============================================================ */
const icsEsc = s =>
  String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
const icsD = d => d.replace(/-/g, ''),
  icsT = (d, t) => icsD(d) + 'T' + t.replace(':', '') + '00';
function fold(line) {
  const out = [];
  let cur = '',
    bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 73) {
      out.push(cur);
      cur = ' ' + ch;
      bytes = 1 + b;
    } else {
      cur += ch;
      bytes += b;
    }
  }
  out.push(cur);
  return out.join('\r\n');
}

const VTZ = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Jerusalem',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0300',
  'TZNAME:IDT',
  'DTSTART:19700327T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=23,24,25,26,27,28,29;BYDAY=FR',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0300',
  'TZOFFSETTO:+0200',
  'TZNAME:IST',
  'DTSTART:19701025T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];
function vevent({ uid: u, title, desc, date, start, end, endDate, rrule, exdates, loc }) {
  const L = [
    'BEGIN:VEVENT',
    `UID:${u}@smart-student-planner`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
  ];
  if (start) {
    L.push(`DTSTART;TZID=Asia/Jerusalem:${icsT(date, start)}`);
    L.push(`DTEND;TZID=Asia/Jerusalem:${icsT(endDate || date, end || addMin(start, 60))}`);
  } else {
    L.push(`DTSTART;VALUE=DATE:${icsD(date)}`);
    L.push(`DTEND;VALUE=DATE:${icsD(addDays(endDate || date, 1))}`);
  }
  L.push(`SUMMARY:${icsEsc(title)}`);
  if (desc) L.push(`DESCRIPTION:${icsEsc(desc)}`);
  if (loc) L.push(`LOCATION:${icsEsc(loc)}`);
  if (rrule) L.push(rrule);
  if (exdates && exdates.length) L.push(`EXDATE;TZID=Asia/Jerusalem:${exdates.join(',')}`);
  L.push('END:VEVENT');
  return L;
}

function addMin(t, m) {
  const x = tmin(t) + m;
  return pad(Math.floor(x / 60) % 24) + ':' + pad(x % 60);
}

function lessonVevent(l, from, to) {
  const c = courseById(l.courseId);
  if (!c) return null;
  const desc = [
    LT[l.type],
    (l.lecturer || c.lecturer) && 'מרצה: ' + (l.lecturer || c.lecturer),
    c.code && 'קוד: ' + c.code,
    l.notes,
  ]
    .filter(Boolean)
    .join('\n');
  if (l.oneTime) {
    if (from && (l.date < from || l.date > to)) return null;
    return vevent({
      uid: l.id,
      title: `${c.name} (${LT[l.type] || 'שיעור'})`,
      desc,
      date: l.date,
      start: l.start,
      end: l.end,
      loc: l.room,
    });
  }
  let [a, b] = lessonRange(l);
  if (from) {
    a = a && a > from ? a : from;
    b = b && b < to ? b : to;
  }
  if (!a) a = todayS();
  let first = addDays(a, (Number(l.day) - dow(a) + 7) % 7);
  if (b && first > b) return null;
  const rr = 'RRULE:FREQ=WEEKLY' + (b ? `;UNTIL=${icsD(b)}T235959Z` : ';COUNT=14');
  const ex = (l.cancelled || []).map(d => icsT(d, l.start));
  return vevent({
    uid: l.id,
    title: `${c.name} (${LT[l.type] || 'שיעור'})`,
    desc,
    date: first,
    start: l.start,
    end: l.end,
    rrule: rr,
    exdates: ex,
    loc: l.room,
  });
}

function taskVevent(t) {
  return vevent({
    uid: t.id,
    title: `${isExam(t) ? TT[t.type] + ': ' : 'הגשה: '}${t.title}`,
    desc: [t.courseId && courseName(t.courseId), TT[t.type], t.description]
      .filter(Boolean)
      .join('\n'),
    date: t.due,
    start: t.time,
    end: t.time ? addMin(t.time, isExam(t) ? 120 : 30) : '',
    loc: t.room,
  });
}

function eventVevent(e) {
  return vevent({
    uid: e.id,
    title: e.title,
    desc: [ET[e.type], e.description].filter(Boolean).join('\n'),
    date: e.date,
    start: e.start,
    end: e.end,
    endDate: e.start ? e.endDate || e.date : e.endDate,
  });
}

function buildIcs(vevents) {
  const L = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Student Planner//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Smart Student Planner',
    'X-WR-TIMEZONE:Asia/Jerusalem',
    ...VTZ,
  ];
  vevents.filter(Boolean).forEach(v => L.push(...v));
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}

let DOWNLOADS = null;
async function offerFile(filename, text, mime) {
  if (!DOWNLOADS && !(window.claude && typeof window.claude.use === 'function')) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const l = document.createElement('a');
      l.href = url;
      l.download = filename;
      document.body.appendChild(l);
      l.click();
      l.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('הקובץ נשמר בתיקיית ההורדות', 'ok');
      return;
    } catch (e) {}
  }
  if (DOWNLOADS) {
    try {
      await DOWNLOADS.save({ filename, data: text, mimeType: mime });
      toast('הקובץ נשמר', 'ok');
      return;
    } catch (e) {
      if (e && /declin|cancel|denied|reject/i.test((e.code || '') + (e.message || ''))) {
        toast('השמירה בוטלה');
        return;
      }
      try {
        await DOWNLOADS.save({ filename, data: new Blob([text], { type: mime }) });
        toast('הקובץ נשמר', 'ok');
        return;
      } catch (e2) {}
    }
  }
  modal({
    title: 'שמירת הקובץ',
    wide: true,
    body: `<p class="small" style="margin-top:0">אי אפשר להוריד קבצים ישירות מהתצוגה הזו. אפשר להעתיק את התוכן, להדביק בקובץ טקסט חדש ולשמור אותו בשם <b dir="ltr">${esc(filename)}</b>.</p>
      <textarea readonly rows="12" style="width:100%;font-family:monospace;font-size:12px;border:1px solid var(--line);border-radius:10px;padding:10px" dir="ltr" id="dlText">${esc(text)}</textarea>`,
    extra: `<button type="button" class="btn pri" data-act="copyDl">${ic('copy')} העתקה</button>`,
  });
}

ACT.copyDl = () => {
  const t = $('#dlText');
  navigator.clipboard
    .writeText(t.value)
    .then(() => toast('הועתק', 'ok'))
    .catch(() => {
      t.select();
      toast('סמני והעתיקי ידנית (Ctrl+C)');
    });
};

ACT.exportOne = d => {
  let v, name;
  if (d.kind === 'lesson') {
    const l = S.lessons.find(x => x.id === d.id);
    v = lessonVevent(l);
    name = courseName(l.courseId);
  } else if (d.kind === 'task') {
    const t = S.tasks.find(x => x.id === d.id);
    if (!t.due) {
      toast('למשימה אין תאריך', 'err');
      return;
    }
    v = taskVevent(t);
    name = t.title;
  } else {
    const e = S.events.find(x => x.id === d.id);
    v = eventVevent(e);
    name = e.title;
  }
  if (!v) {
    toast('אין מועדים לייצוא', 'err');
    return;
  }
  offerFile(`${safeName(name)}.ics`, buildIcs([v]), 'text/calendar');
};

const safeName = s => (s || 'event').replace(/[\\/:*?"<>|]/g, '').slice(0, 60) || 'event';
PAGES.export = () => {
  const u = UI.exp;
  if (!u.scope) {
    Object.assign(u, {
      scope: 'semester',
      y: S.settings.activeYearId,
      s: S.settings.activeSemesterId,
      from: todayS(),
      to: addDays(todayS(), 90),
      types: ['lesson', 'exam', 'deadline', 'academic', 'personal'],
    });
  }
  if (!yearById(u.y)) {
    u.y = S.settings.activeYearId;
    u.s = S.settings.activeSemesterId;
  }
  const ev = collectExport();
  const T = [
    ['lesson', 'שיעורים (כאירועים חוזרים)'],
    ['exam', 'מבחנים ובחנים'],
    ['deadline', 'מועדי הגשת מטלות'],
    ['academic', 'אירועים אקדמיים ותאריכי סמסטר'],
    ['personal', 'אירועים אישיים וחופשות'],
  ];
  return `<div class="phead">
    <div>
    <h1>ייצוא מועדים ליומן</h1>
    <p class="sub">יצירת קובץ יומן סטנדרטי (ics.) שאפשר לייבא ל־Google Calendar, ל־Outlook וליומן של אפל</p>
    </div>
    </div>
  <div class="note mb">${ic('alert')}<div>זה ייצוא חד־פעמי, לא סנכרון: שינויים שתעשי כאן אחרי הייצוא לא יתעדכנו ביומן החיצוני. אפשר לייצא מחדש בכל שלב. השעות נשמרות לפי שעון ישראל.
    </div>
    </div>
  <div class="grid g2">
    <div class="card">
    <h3>ייצוא מהיר</h3>
    <div class="qa">
    <button class="btn" data-act="expQuick" data-q="sem">${ic('cal')} כל אירועי הסמסטר</button>
    <button class="btn" data-act="expQuick" data-q="exams">${ic('alert')} מבחנים בלבד</button>
    <button class="btn" data-act="expQuick" data-q="deadlines">${ic('check')} מועדי הגשה בלבד
      </button>
    </div>
    <p class="small muted">ייצוא של אירוע בודד: פתחי שיעור, משימה או אירוע ולחצי "ייצוא".</p>
    </div>
  <div class="card">
    <h3>ייצוא מותאם</h3>
   <div class="tabs mb" role="tablist">
    <button role="tab" aria-selected="${u.scope === 'semester'}" class="${u.scope === 'semester' ? 'on' : ''}" data-act="expScope" data-v="semester">לפי סמסטר
      </button>
     <button role="tab" aria-selected="${u.scope === 'range'}" class="${u.scope === 'range' ? 'on' : ''}" data-act="expScope" data-v="range">טווח תאריכים
       </button>
     </div>
   ${
     u.scope === 'semester'
       ? `<div class="filters" style="margin-bottom:10px">
         <label class="sr" for="exY">שנה</label>
         <select id="exY" data-yearsel>${yearOpts()
           .map(
             ([v, l]) => `<option value="${v}"${v === u.y ? ' selected' : ''}>${esc(l)}</option>`
           )
           .join('')}</select>
             <label class="sr" for="exS">סמסטר</label>
             <select id="exS" data-semsel data-annual="0">${semOpts(u.y, { annual: false })
               .map(
                 ([v, l]) =>
                   `<option value="${v}"${v === u.s ? ' selected' : ''}>${esc(l)}</option>`
               )
               .join('')}</select>
             </div>`
       : `<div class="fg mb">${fld('מתאריך', `<input id="exF" type="date" value="${u.from}">`)}${fld('עד תאריך', `<input id="exT" type="date" value="${u.to}">`)}</div>`
   }
   <div role="group" aria-label="סוגי מועדים" style="display:flex;flex-direction:column;gap:6px">${T.map(
     ([k, l]) => `<label class="chk">
     <input type="checkbox" data-ext="${k}" ${u.types.includes(k) ? 'checked' : ''}> ${l}</label>`
   ).join('')}</div>
   <div class="row mt"><span class="chip">${ev.count} פריטים לייצוא</span><span class="sp"></span>
     <button class="btn pri" data-act="expRun" ${ev.count ? '' : 'disabled'}>${ic('download')} הורדת קובץ יומן
       </button>
     </div>
   ${ev.warn ? `<p class="small muted">${esc(ev.warn)}</p>` : ''}</div>
     </div>`;
};

function collectExport(over) {
  const u = { ...UI.exp, ...(over || {}) };
  let from,
    to,
    warn = '';
  if (u.scope === 'semester') {
    const s = semById(u.s);
    from = (s && s.start) || null;
    to = (s && s.end) || null;
    if (!from || !to)
      warn =
        'לסמסטר הזה לא הוגדרו תאריכים. אפשר להגדיר אותם בעמוד "התואר שלי" כדי שהייצוא יכלול את התקופה המדויקת.';
  } else {
    from = u.from;
    to = u.to;
  }
  const inScope = c => (u.scope === 'semester' ? c && inSem(c, u.y, u.s) : true);
  const inRange = d => d && (!from || d >= from) && (!to || d <= to);
  const semTaskOk = t =>
    u.scope === 'semester'
      ? t.courseId
        ? inScope(courseById(t.courseId))
        : inRange(t.due)
      : inRange(t.due);
  const out = [];
  if (u.types.includes('lesson'))
    S.lessons.forEach(l => {
      const c = courseById(l.courseId);
      if (!c || c.status === 'cancelled' || !inScope(c)) return;
      const v = u.scope === 'range' ? lessonVevent(l, from, to) : lessonVevent(l);
      if (v) out.push(v);
    });
  S.tasks.forEach(t => {
    if (!t.due || t.status === 'cancelled') return;
    if (
      isExam(t)
        ? !u.types.includes('exam')
        : t.type === 'personal'
          ? !u.types.includes('personal')
          : !u.types.includes('deadline')
    )
      return;
    if (semTaskOk(t)) out.push(taskVevent(t));
  });
  S.events.forEach(e => {
    const k = e.type === 'academic' ? 'academic' : 'personal';
    if (!u.types.includes(k)) return;
    if (u.scope === 'semester' ? (from && to ? inRange(e.date) : false) : inRange(e.date))
      out.push(eventVevent(e));
  });
  if (u.types.includes('academic'))
    S.years.forEach(y =>
      y.semesters.forEach(s => {
        if (u.scope === 'semester' && s.id !== u.s) return;
        [
          ['start', 'תחילת'],
          ['end', 'סיום'],
        ].forEach(([k, w]) => {
          if (s[k] && (u.scope === 'semester' || inRange(s[k])))
            out.push(vevent({ uid: s.id + k, title: `${w} ${s.name} · ${y.name}`, date: s[k] }));
        });
      })
    );
  return { list: out, count: out.length, warn };
}

AFTER.export = () => {
  const u = UI.exp;
  const b = (id, k) => {
    const el = $(id);
    if (el)
      el.onchange = e => {
        u[k] = e.target.value;
        if (k === 'y') u.s = (yearById(u.y).semesters[0] || {}).id;
        render();
      };
  };
  b('#exY', 'y');
  b('#exS', 's');
  b('#exF', 'from');
  b('#exT', 'to');
  $$('[data-ext]').forEach(
    cb =>
      (cb.onchange = () => {
        u.types = cb.checked
          ? [...u.types, cb.dataset.ext]
          : u.types.filter(x => x !== cb.dataset.ext);
        render();
      })
  );
};

ACT.expScope = d => {
  UI.exp.scope = d.v;
  render();
};

ACT.expRun = () => {
  const r = collectExport();
  if (!r.count) return toast('אין מועדים לייצוא', 'err');
  if (UI.exp.scope === 'range' && UI.exp.from > UI.exp.to)
    return toast('תאריך ההתחלה אחרי תאריך הסיום', 'err');
  offerFile(`student-planner-${todayS()}.ics`, buildIcs(r.list), 'text/calendar');
};

ACT.expQuick = d => {
  const base = { scope: 'semester', y: S.settings.activeYearId, s: S.settings.activeSemesterId };
  const types =
    d.q === 'sem'
      ? ['lesson', 'exam', 'deadline', 'academic', 'personal']
      : d.q === 'exams'
        ? ['exam']
        : ['deadline'];
  const r = collectExport({ ...base, types });
  if (!r.count) return toast('לא נמצאו מועדים מהסוג הזה בסמסטר הפעיל', 'err');
  offerFile(
    `${d.q === 'sem' ? 'semester' : d.q}-${todayS()}.ics`,
    buildIcs(r.list),
    'text/calendar'
  );
};


/* ============================================================
   עמוד: הגדרות
   הגדרות לימודים, ממוצעים, מראה, גיבוי ושחזור
   ============================================================ */
PAGES.prefs = () => {
  const st = S.settings;
  return `<div class="phead">
    <div>
    <h1>הגדרות</h1>
    <p class="sub">התאמה אישית של המערכת</p>
    </div>
    </div>
  <form id="prefsForm" class="card" novalidate>
    <h3>הגדרות לימודים</h3>
    <div class="fg">
    ${fld('שם התואר', inp('degreeName', st.degreeName, 'text', 'placeholder="למשל: B.Sc. מערכות מידע"'))}${fld('שם המוסד', inp('university', st.university))}
    ${fld('שנת התחלת הלימודים', inp('startYear', st.startYear, 'number', 'min="1990" max="2100" inputmode="numeric"'))}${fld('מכסת נקודות זכות לתואר', inp('requiredCredits', st.requiredCredits, 'number', 'min="0" step="0.5" inputmode="decimal"'), { hint: 'לפי תוכנית הלימודים שלך' })}
    ${fld('שנת לימודים פעילה', sel('activeYearId', yearOpts(), st.activeYearId, 'data-yearsel'))}${fld('סמסטר פעיל', sel('activeSemesterId', semOpts(st.activeYearId, { annual: false }), st.activeSemesterId, 'data-semsel data-annual="0"'))}
  </div>
    <p class="small muted">שנות לימודים, סמסטרים ותאריכים מנוהלים בעמוד <a href="#degree">התואר שלי</a>.</p>
  <h3 class="mt">חישוב ממוצעים</h3>
    <div class="fg">
    ${fld(
      'קורס שנלמד מחדש',
      sel(
        'retake',
        [
          ['last', 'רק הניסיון האחרון נכלל'],
          ['best', 'רק הציון הגבוה נכלל'],
          ['all', 'כל הניסיונות נכללים'],
        ],
        st.avg.retake
      )
    )}
    <div class="fld" style="justify-content:end">${chk('includeFailed', st.avg.includeFailed, 'קורסים שנכשלו נכללים בממוצע')}</div>
      </div>
    <p class="small muted">קורסים ללא ציון מספרי, קורסי עובר/נכשל וקורסים שסומנו "לא נכלל" אינם נכללים בממוצע, ואף קורס בלי ציון לא נחשב כאפס.</p>
  <h3 class="mt">ברירות מחדל ומראה</h3>
      <div class="fg">
    ${fld('סוג שיעור ברירת מחדל', sel('lessonType', objOpts(LT), st.defaults.lessonType))}${fld('עדיפות ברירת מחדל למשימה', sel('taskPriority', objOpts(PR), st.defaults.taskPriority))}
    ${fld(
      'תצוגת לוח שנה ברירת מחדל',
      sel(
        'calView',
        [
          ['month', 'חודשית'],
          ['week', 'שבועית'],
          ['day', 'יומית'],
        ],
        st.defaults.calView
      )
    )}
    <div class="fld"><span>צבע בסיס</span>
      <div class="swatches">${[
        ['lilac', '#C2577F', 'ורוד (ברירת מחדל)'],
        ['pink', '#6E9374', 'ירוק מרווה'],
        ['sky', '#A8703F', 'קרמל'],
        ['mint', '#5E7E98', 'כחול עשן'],
      ]
        .map(
          ([v, c, n]) =>
            `<label title="${n}">
            <input type="radio" name="accent" value="${v}" ${st.accent === v ? 'checked' : ''}><span style="background:${c}"></span><b class="sr">${n}</b>
              </label>`
        )
        .join('')}</div>
        </div>
        </div>
  <h3 class="mt">התראות
    </h3>${chk('entryAlerts', st.entryAlerts !== false, 'להציג חלון התראות בכל כניסה לאתר (מבחנים קרובים, הגשות להיום ולמחר, משימות באיחור, שיעורים של היום)')}
  <div class="row mt"><span class="sp"></span>
    <button class="btn pri" type="submit">שמירת ההגדרות</button>
    </div>
    </form>
  <div class="card mt">
    <h3>גיבוי ושחזור</h3>
    <p class="small muted" style="margin-top:0">${Store.mode === 'cloud' ? 'הנתונים נשמרים בחשבון שלך. ' : 'הנתונים נשמרים בדפדפן במכשיר הזה. '}כדאי להוריד גיבוי מדי פעם.</p>
   <div class="qa">
    <button class="btn" data-act="backup">${ic('download')} הורדת גיבוי</button>
     <label class="btn" tabindex="0">${ic('upload')} שחזור מקובץ גיבוי
     <input type="file" id="restoreFile" accept=".json,application/json" class="sr"></label>
     <button class="btn dng" data-act="resetAll">${ic('trash')} מחיקת כל הנתונים</button>
     </div>
   <div class="row mt small muted">${S.courses.length} קורסים · ${S.lessons.length} שיעורים · ${S.tasks.length} מטלות · ${S.events.length} אירועים · ${S.materials.length} חומרים
     </div>
     </div>`;
};

AFTER.prefs = () => {
  $('#prefsForm').onsubmit = e => {
    e.preventDefault();
    const F = formData(e.target);
    const st = S.settings;
    if (F.requiredCredits !== '' && (!isNum(F.requiredCredits) || F.requiredCredits < 0)) {
      toast('מכסת נקודות הזכות צריכה להיות מספר חיובי', 'err');
      e.target.elements.requiredCredits.focus();
      return;
    }
    if (F.startYear !== '' && (!isNum(F.startYear) || F.startYear < 1990 || F.startYear > 2100)) {
      toast('שנת ההתחלה לא תקינה', 'err');
      e.target.elements.startYear.focus();
      return;
    }
    Object.assign(st, {
      degreeName: F.degreeName,
      university: F.university,
      startYear: F.startYear,
      requiredCredits: F.requiredCredits === '' ? null : Number(F.requiredCredits),
      activeYearId: F.activeYearId,
      activeSemesterId: F.activeSemesterId,
      accent: F.accent || st.accent,
      entryAlerts: F.$chk('entryAlerts'),
    });
    st.avg = { retake: F.retake, includeFailed: F.$chk('includeFailed') };
    st.defaults = { lessonType: F.lessonType, taskPriority: F.taskPriority, calView: F.calView };
    UI.cal.view = null;
    resetCtxUI();
    commit('ההגדרות נשמרו');
  };
  $('#restoreFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let d;
      try {
        d = JSON.parse(r.result);
      } catch (er) {
        toast('הקובץ אינו קובץ גיבוי תקין', 'err');
        return;
      }
      const data = d && d.app === 'smart-student-planner' ? d.data : d;
      if (!data || !Array.isArray(data.years) || !data.settings) {
        toast('הקובץ אינו קובץ גיבוי של Smart Student Planner', 'err');
        return;
      }
      confirmBox(
        `השחזור יחליף את <b>כל</b> הנתונים הנוכחיים בנתונים מהגיבוי${d.exported ? ` מ־${fmt(d.exported.slice(0, 10))}` : ''} (${(data.courses || []).length} קורסים, ${(data.tasks || []).length} מטלות). להמשיך?`,
        () => {
          S = normalize(data);
          commit('הנתונים שוחזרו מהגיבוי');
        },
        { yes: 'החלפת הנתונים', title: 'שחזור מגיבוי' }
      );
    };
    r.readAsText(f);
    e.target.value = '';
  };
};

ACT.backup = () =>
  offerFile(
    `student-planner-backup-${todayS()}.json`,
    JSON.stringify(
      { app: 'smart-student-planner', version: 1, exported: new Date().toISOString(), data: S },
      null,
      1
    ),
    'application/json'
  );
ACT.resetAll = () =>
  confirmBox(
    'למחוק את <b>כל</b> הנתונים במערכת? הפעולה לא ניתנת לביטול. מומלץ להוריד גיבוי קודם.',
    () => {
      S = defaultState();
      UI.whatif = {};
      commit('כל הנתונים נמחקו');
    },
    { yes: 'מחיקת הכל' }
  );


/* ============================================================
   התראות בכניסה לאתר
   בניית רשימת ההתראות, הפעמון והחלון
   ============================================================ */
function buildAlerts() {
  const t = todayS(),
    out = [];
  const nm = nowMin();
  const when = d => (d === 0 ? 'היום' : d === 1 ? 'מחר' : `בעוד ${d} ימים`);
  S.tasks
    .filter(isOverdue)
    .sort(byDue)
    .forEach(x => {
      const d = -daysBetween(todayS(), x.due);
      out.push({
        lv: 0,
        c: '#B8443A',
        g: '!',
        t: `באיחור: ${x.title}`,
        s: `${d > 0 ? `היה צריך להגיש לפני ${d === 1 ? 'יום' : d + ' ימים'}` : 'מועד ההגשה עבר היום'}${x.courseId ? ' · ' + courseName(x.courseId) : ''}`,
        act: 'editTask',
        id: x.id,
      });
    });
  S.tasks
    .filter(
      x =>
        isExam(x) &&
        x.status !== 'cancelled' &&
        x.status !== 'done' &&
        x.due &&
        x.due >= t &&
        daysBetween(t, x.due) <= 3
    )
    .sort(byDue)
    .forEach(x => {
      const d = daysBetween(t, x.due);
      out.push({
        lv: 1,
        c: CK[taskKind(x)][1],
        g: CK.exam[2],
        t: `${when(d)} ${TT[x.type] === 'מבחן' ? 'מבחן' : 'בוחן'}${x.courseId ? ' ב' + courseName(x.courseId) : ''}`,
        s: `${x.title}${x.time ? ' · ' + x.time : ''}${x.room ? ' · ' + x.room : ''}`,
        act: 'editTask',
        id: x.id,
      });
    });
  const soon = S.tasks
    .filter(
      x =>
        !isExam(x) &&
        isOpen(x) &&
        !isOverdue(x) &&
        x.due &&
        daysBetween(t, x.due) >= 0 &&
        daysBetween(t, x.due) <= 1
    )
    .sort(byDue);
  if (soon.length)
    soon.forEach(x => {
      const d = daysBetween(t, x.due);
      out.push({
        lv: 2,
        c: CK[taskKind(x)][1],
        g: CK[taskKind(x)][2],
        t: `${d === 0 ? 'להיום' : 'למחר'}: ${x.title}`,
        s: `${TT[x.type]}${x.time ? ' · עד ' + x.time : ''}${x.courseId ? ' · ' + courseName(x.courseId) : ''}${x.priority === 'high' ? ' · עדיפות גבוהה' : ''}`,
        act: 'editTask',
        id: x.id,
      });
    });
  const wk = S.tasks.filter(
    x =>
      !isExam(x) && isOpen(x) && x.due && daysBetween(t, x.due) >= 2 && daysBetween(t, x.due) <= 7
  );
  if (wk.length)
    out.push({
      lv: 4,
      c: CK.deadline[1],
      g: CK.deadline[2],
      t: `${wk.length === 1 ? 'עוד הגשה אחת' : wk.length + ' הגשות נוספות'} השבוע`,
      s:
        wk
          .sort(byDue)
          .slice(0, 3)
          .map(x => x.title)
          .join(' · ') + (wk.length > 3 ? ' …' : ''),
      act: 'goto',
      id: 'tasks',
    });
  const les = occurrences(t, t).filter(o => tmin(o.l.end) > nm);
  if (les.length) {
    const f = les[0];
    const started = tmin(f.l.start) <= nm;
    out.push({
      lv: 3,
      c: f.c.color,
      g: CK.lesson[2],
      t:
        les.length === 1
          ? `שיעור ${started ? 'עכשיו' : 'היום'}: ${f.c.name}`
          : `עוד ${les.length} שיעורים היום`,
      s: `${started ? 'עכשיו' : 'הבא'}: ${f.c.name} ב־${f.l.start}${f.l.room ? ' · ' + f.l.room : ''}`,
      act: 'goto',
      id: 'schedule',
    });
  }
  calItems(t, t)
    .filter(i => ['vacation', 'personal', 'academic', 'semester'].includes(i.kind))
    .forEach(i =>
      out.push({
        lv: 3,
        c: CK[i.kind][1],
        g: CK[i.kind][2],
        t: `היום: ${i.title}`,
        s: i.start ? `${i.start}${i.end ? '–' + i.end : ''}` : CK[i.kind][0],
        act: 'goto',
        id: 'calendar',
      })
    );
  S.years.forEach(y =>
    y.semesters.forEach(sm => {
      [
        ['start', 'מתחיל'],
        ['end', 'מסתיים'],
      ].forEach(([k, w]) => {
        if (sm[k]) {
          const d = daysBetween(t, sm[k]);
          if (d >= 1 && d <= 7)
            out.push({
              lv: 4,
              c: CK.semester[1],
              g: CK.semester[2],
              t: `${sm.name} ${w} ${when(d)}`,
              s: `${y.name} · ${fmt(sm[k])}`,
              act: 'goto',
              id: 'degree',
            });
        }
      });
    })
  );
  return out.sort((a, b) => a.lv - b.lv);
}

function updateBell() {
  const n = buildAlerts().filter(a => a.lv <= 2).length;
  $('#bellBtn').innerHTML =
    `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>${n ? `<b>${n}</b>` : ''}`;
  $('#bellBtn').setAttribute('aria-label', n ? `התראות, ${n} חשובות` : 'התראות');
}

function showAlerts(entry) {
  const list = buildAlerts();
  const p = $('#alertsPanel');
  if (entry && (!S.settings.entryAlerts || !list.length)) return;
  const urgent = list.filter(a => a.lv <= 2).length;
  p.innerHTML = `<div class="ah">
    <div style="flex:1">
    <h2 id="alertsTtl">${entry ? greeting() : 'התראות'}</h2>
    <p>${list.length ? (urgent ? `יש ${urgent === 1 ? 'דבר אחד' : urgent + ' דברים'} שכדאי לשים לב אליהם` : 'הנה מה שמחכה לך') : 'אין התראות כרגע. הכול רגוע ✿'}</p>
    </div>
    <button class="ib" data-alclose aria-label="סגירת ההתראות">${ic('x')}</button>
    </div>
   ${
     list.length
       ? `<div class="al">${list
           .map(
             (
               a,
               i
             ) => `<button class="alert" style="--c:${a.c}" data-al="${i}"><span class="g" aria-hidden="true">${a.g}</span>
     <div><b>${esc(a.t)}</b><span>${esc(a.s)}</span>
     </div></button>`
           )
           .join('')}</div>`
       : ''
   }
   <div class="af">
     <label class="chk small">
     <input type="checkbox" id="alEntry" ${S.settings.entryAlerts ? 'checked' : ''}> להציג התראות בכל כניסה לאתר
       </label><span class="sp"></span>
     <button class="btn sm pri" data-alclose>הבנתי</button>
     </div>`;
  p.hidden = false;
  $('#bellBtn').setAttribute('aria-expanded', 'true');
  $$('[data-alclose]', p).forEach(b => (b.onclick = closeAlerts));
  $('#alEntry').onchange = e => {
    S.settings.entryAlerts = e.target.checked;
    Store.save();
    toast(
      e.target.checked
        ? 'ההתראות יוצגו בכל כניסה'
        : 'ההתראות לא יקפצו בכניסה. אפשר תמיד לפתוח אותן מהפעמון',
      'ok'
    );
  };
  $$('[data-al]', p).forEach(
    b =>
      (b.onclick = () => {
        const a = list[Number(b.dataset.al)];
        closeAlerts();
        if (a.act === 'goto') go(a.id);
        else if (a.act === 'editTask') {
          go('tasks');
          taskModal(a.id);
        }
      })
  );
  setTimeout(() => {
    const f = $('.alert', p) || $('[data-alclose]', p);
    f && f.focus();
  }, 50);
}

function closeAlerts() {
  const p = $('#alertsPanel');
  if (p.hidden) return;
  p.hidden = true;
  $('#bellBtn').setAttribute('aria-expanded', 'false');
  $('#bellBtn').focus();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modalStack.length && !$('#alertsPanel').hidden) closeAlerts();
});

document.addEventListener('mousedown', e => {
  const p = $('#alertsPanel');
  if (!p.hidden && !e.target.closest('#alertsPanel,#bellBtn,.ov')) closeAlerts();
});

/* keyboard activation for role=button rows */
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')) {
    e.preventDefault();
    e.target.click();
  }
});


/* ============================================================
   הפעלה
   טעינת הנתונים והצגת העמוד הראשון
   ============================================================ */
(function boot() {
  const local = Store.loadLocal();
  if (local) {
    S = normalize(local);
    FRESH = false;
  }
  buildShell();
  initSearch();
  render();
  Store.connect().finally(() => setTimeout(() => showAlerts(true), 400));
  if (window.claude && typeof window.claude.use === 'function') {
    claude
      .use('downloads')
      .then(d => {
        DOWNLOADS = d;
      })
      .catch(() => {});
    claude
      .use('assets')
      .then(a => {
        ASSETS = a;
      })
      .catch(() => {});
  }
  setInterval(() => {
    const t = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    if ($('#todayLbl').textContent !== t) {
      $('#todayLbl').textContent = t;
      render();
    }
  }, 60000);
})();