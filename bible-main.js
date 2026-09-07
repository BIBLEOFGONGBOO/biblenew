// ============================================================
// BLOCK: 앞두자리(도메인) + SUBBLOCK: 뒤두자리(기능) → 4자리 숫자로 검색 (예: 0100 = BLOCK01)
// ============================================================
// ============================================================
// ============================================================
//  BLOCK 0100: anne-core.js
// ============================================================
// ============================================================

const C = window.LICENSE_CONFIG || {
  authStorageKey: 'bible_supabase_auth_v1',
  progressPrefix: 'gongboo.license.'
};
const SETS = { anne: 150 };
const TITLES = { anne: 'ANNE - Quiz' };

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const licenseRemoteTutor = window.sendChatbotMessage;

// SUBBLOCK 0101
function auth() {
  try {
    const s = JSON.parse(localStorage.getItem(C.authStorageKey) || 'null');
    if (!s?.access_token) return null;
    if (s.expires_at && s.expires_at * 1000 < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

// SUBBLOCK 0102
function key() {
  return `${C.progressPrefix}${ANNE_STATE.product}.progress`;
}

// SUBBLOCK 0103
function save() {
  if (ANNE_STATE.product) {
    localStorage.setItem(
      key(),
      JSON.stringify({
        index: ANNE_STATE.baseOffset + ANNE_STATE.index,
        mode: ANNE_STATE.mode,
        first: $('biblePrimaryTextSelector').value,
        second: $('bibleSecondaryTextSelector').value,
        updatedAt: Date.now()
      })
    );
  }
}

// SUBBLOCK 0104
function saved() {
  try {
    return JSON.parse(localStorage.getItem(key()) || 'null');
  } catch {
    return null;
  }
}

// SUBBLOCK 0105
function latestProgress() {
  return Object.keys(TITLES)
    .map(code => {
      try {
        return {
          code,
          data: JSON.parse(
            localStorage.getItem(`${C.progressPrefix}${code}.progress`) || 'null'
          )
        };
      } catch {
        return null;
      }
    })
    .filter(x => x?.data)
    .sort((a, b) => Number(b.data.updatedAt || 0) - Number(a.data.updatedAt || 0))[0] || null;
}

// SUBBLOCK 0106
async function api(params) {
  const res = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

// SUBBLOCK 0107
async function load(product, offset, size) {
  return api({ action: 'load', product, offset, size });
}

// SUBBLOCK 0108
function tr(q) {
  return q?.license_question_translations || [];
}

// SUBBLOCK 0109
function lines(translations, field) {
  return translations.map(t => ({
    code: t.language_code.toUpperCase(),
    text: t[field] || ''
  }));
}

// SUBBLOCK 0110
function htmlLines(lines) {
  return lines.map(line =>
    `<div class="language-line-${line.code.toLowerCase()}">${esc(line.text)}</div>`
  ).join('');
}


// ============================================================
// BLOCK 0200: bible-data.js
// Existing Bible Catalog / Question Loader
// Anne engine compatible
// ============================================================


// SUBBLOCK 0205
// ============================================================
// Existing Bible API
// ============================================================

var BIBLE_API_URL =
  'https://script.google.com/macros/s/' +
  'AKfycbxY57qwgS363Gfg-H1xzMJ1CKjCeB1xl51Ydw4x_fUj3I6_-g5y6y5anhHK_ioGFL7djw/exec';

var BIBLE_CHAPTER_CATALOG =
  [];


// SUBBLOCK 0210
// ============================================================
// Existing Bible API Request
// POST + session_token
// ============================================================

function getBibleSessionToken_() {

  try {

    var user =
      JSON.parse(
        localStorage.getItem(
          'quiz_current_user_v1'
        ) || 'null'
      );

    return String(
      user &&
      user.session_token ||
      ''
    ).trim();

  } catch (e) {

    return '';
  }
}


async function bibleApiRequest_(
  params
) {

  var token =
    getBibleSessionToken_();


  if (!token) {

    throw new Error(
      'LOGIN_REQUIRED'
    );
  }


  var body =
    {};


  params.forEach(
    function(
      value,
      key
    ) {

      body[key] =
        value;
    }
  );


  body.session_token =
    token;


  var response =
    await fetch(
      BIBLE_API_URL,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8'
        },

        body:
          JSON.stringify(
            body
          )
      }
    );


  if (!response.ok) {

    throw new Error(
      'Bible API HTTP ' +
      response.status
    );
  }


  var text =
    await response.text();


  if (
    text.trim().startsWith(
      '<!DOCTYPE'
    ) ||
    text.trim().startsWith(
      '<html'
    )
  ) {

    throw new Error(
      'Bible API returned HTML'
    );
  }


  var data =
    JSON.parse(
      text
    );


  if (
    data &&
    (
      data.status === 'error' ||
      data.success === false
    )
  ) {

    throw new Error(
      data.code ||
      data.message ||
      'Bible API error'
    );
  }


  return data;
}


// SUBBLOCK 0215
// ============================================================
// Bible Catalog
// OT = bible-ot
// NT = bible-nt
// ============================================================

async function loadBibleChapterCatalog_(
  testament
) {

  var sheet =
    String(
      testament || ''
    ).toUpperCase() === 'NT'
      ? 'bible-nt'
      : 'bible-ot';


  var params =
    new URLSearchParams();


  params.set(
    'action',
    'catalog'
  );


  params.set(
    'sheet',
    sheet
  );


  params.set(
    '_',
    String(
      Date.now()
    )
  );


  var data =
    await bibleApiRequest_(
      params
    );


  BIBLE_CHAPTER_CATALOG =
    Array.isArray(
      data.catalog
    )
      ? data.catalog
      : [];


  console.log(
    '[BIBLE] catalog:',
    sheet,
    BIBLE_CHAPTER_CATALOG.length
  );


  return BIBLE_CHAPTER_CATALOG;
}


// SUBBLOCK 0220
// ============================================================
// Catalog에서 특정 Chapter 찾기
// ============================================================

function findBibleChapterCatalog_(
  testament,
  bookName,
  chapter
) {

  var normalizedBook =
    String(
      bookName || ''
    )
    .replace(
      /-/g,
      ' '
    )
    .trim()
    .toLowerCase();


  var chapterNumber =
    Number(
      chapter
    );


  var wantedPrefix =
    String(
      testament || ''
    ).toUpperCase() +
    '-';


  for (
    var i = 0;
    i <
      BIBLE_CHAPTER_CATALOG.length;
    i++
  ) {

    var item =
      BIBLE_CHAPTER_CATALOG[
        i
      ];


    var catalogBook =
      String(
        item.BOOK_EN ||
        ''
      )
      .replace(
        /-/g,
        ' '
      )
      .trim()
      .toLowerCase();


    var catalogChapter =
      Number(
        item.CHAPTER
      );


    var code =
      String(
        item.CODE ||
        ''
      );


    if (
      catalogBook ===
        normalizedBook &&
      catalogChapter ===
        chapterNumber &&
      (
        !code ||
        code.indexOf(
          wantedPrefix
        ) === 0
      )
    ) {

      return item;
    }
  }


  return null;
}


// SUBBLOCK 0225
// ============================================================
// Existing Bible standard schema helpers
// ============================================================

function normalizeBibleSchemaKey_(
  key
) {

  return String(
    key === null ||
    key === undefined
      ? ''
      : key
  )
  .replace(
    /^\uFEFF/,
    ''
  )
  .trim()
  .toUpperCase();
}


function buildBibleNormalizedRow_(
  row
) {

  var map =
    {};


  if (
    !row ||
    typeof row !==
      'object'
  ) {

    return map;
  }


  Object.keys(
    row
  ).forEach(
    function(key) {

      map[
        normalizeBibleSchemaKey_(
          key
        )
      ] =
        row[key];
    }
  );


  return map;
}


function readBibleSchema_(
  row,
  map,
  key
) {

  if (
    row &&
    Object.prototype
      .hasOwnProperty.call(
        row,
        key
      )
  ) {

    return row[key];
  }


  var normalized =
    normalizeBibleSchemaKey_(
      key
    );


  if (
    Object.prototype
      .hasOwnProperty.call(
        map,
        normalized
      )
  ) {

    return (
      map[
        normalized
      ]
    );
  }


  return '';
}


function cleanBibleText_(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return '';
  }


  return String(
    value
  )
  .replace(
    /\n/g,
    '<br>'
  )
  .trim();
}


// SUBBLOCK 0230
// ============================================================
// Existing Bible row → ANNE compatible question
//
// 기존 Bible의 표준 스키마 그대로 읽고,
// Anne 엔진이 이해하는 translations 배열도 같이 생성.
// ============================================================

function convertBibleApiRows_(
  rows,
  chapterCode
) {

  var questions =
    [];


  rows.forEach(
    function(row, index) {

      if (
        !row ||
        typeof row !==
          'object'
      ) {
        return;
      }


      var map =
        buildBibleNormalizedRow_(
          row
        );


      var sourceCode =
        readBibleSchema_(
          row,
          map,
          'SOURCE_CODE'
        ) ||
        readBibleSchema_(
          row,
          map,
          'SUBJECT'
        ) ||
        chapterCode;


      var qEn =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'Q_EN'
          )
        );


      var qKo =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'Q_KO'
          )
        );


      var pKjv =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'P_KJV'
          )
        );


      var pWeb =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'P_WEB'
          ) ||
          readBibleSchema_(
            row,
            map,
            'P_EN'
          )
        );


      var pKo =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'P_KO_WEB'
          ) ||
          readBibleSchema_(
            row,
            map,
            'P_KO'
          )
        );


      var eEn =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'E_EN'
          )
        );


      var eKo =
        cleanBibleText_(
          readBibleSchema_(
            row,
            map,
            'E_KO'
          )
        );


      var choicesEn =
        {};

      var choicesKo =
        {};


      for (
        var c = 1;
        c <= 4;
        c++
      ) {

        choicesEn[c] =
          cleanBibleText_(
            readBibleSchema_(
              row,
              map,
              c + '_EN'
            )
          );


        choicesKo[c] =
          cleanBibleText_(
            readBibleSchema_(
              row,
              map,
              c + '_KO'
            )
          );
      }


      var answer =
        String(
          readBibleSchema_(
            row,
            map,
            'A'
          ) ||
          '1'
        )
        .trim();


      var letterToNumber =
        {
          A: '1',
          B: '2',
          C: '3',
          D: '4'
        };


      if (
        letterToNumber[
          answer.toUpperCase()
        ]
      ) {

        answer =
          letterToNumber[
            answer.toUpperCase()
          ];
      }


      var translations =
        [];


      translations.push({

        language_code:
          'en',

        passage:
          pWeb,

        passage_kjv:
          pKjv,

        passage_web:
          pWeb,

        question_text:
          qEn,

        option_1:
          choicesEn[1],

        option_2:
          choicesEn[2],

        option_3:
          choicesEn[3],

        option_4:
          choicesEn[4],

        explanation:
          eEn
      });


      if (
        qKo ||
        pKo
      ) {

        translations.push({

          language_code:
            'ko',

          passage:
            pKo,

          question_text:
            qKo,

          option_1:
            choicesKo[1],

          option_2:
            choicesKo[2],

          option_3:
            choicesKo[3],

          option_4:
            choicesKo[4],

          explanation:
            eKo
        });
      }


      questions.push({

        id:
          index + 1,

        date:
          chapterCode,

        category:
          'BIBLE',

        contentId:
          String(
            readBibleSchema_(
              row,
              map,
              'N'
            ) ||
            sourceCode +
            '-' +
            (index + 1)
          ),

        recordId:
          String(
            readBibleSchema_(
              row,
              map,
              'N'
            ) ||
            sourceCode +
            '-' +
            (index + 1)
          ),

        sourceCode:
          sourceCode,

        subject:
          sourceCode,

        answer:
          Number(
            answer
          ),

        A:
          answer,

        passageVersions: {

          KJV:
            pKjv,

          WEB:
            pWeb,

          KO_WEB:
            pKo
        },

        license_question_translations:
          translations,

        raw:
          row
      });
    }
  );


  console.log(
    '[BIBLE] converted:',
    questions.length
  );


  return questions;
}


// SUBBLOCK 0235
// ============================================================
// Chapter question rows load
//
// Catalog의 START_ROW + QUESTION_COUNT 사용
// ============================================================

async function loadBibleChapterQuestions_(
  catalog
) {

  var start =
    Math.max(
      1,
      parseInt(
        catalog.START_ROW,
        10
      ) ||
      parseInt(
        catalog.START,
        10
      ) ||
      1
    );


  var limit =
    Math.max(
      1,
      parseInt(
        catalog.QUESTION_COUNT,
        10
      ) ||
      1
    );


  var params =
    new URLSearchParams();


  params.set(
    'start',
    String(start)
  );


  params.set(
    'limit',
    String(limit)
  );


  params.set(
    'sheet',
    String(
      catalog.SHEET ||
      catalog.DATA_SHEET ||
      (
        String(
          catalog.CODE ||
          ''
        ).indexOf(
          'NT-'
        ) === 0
          ? 'bible-nt'
          : 'bible-ot'
      )
    )
  );


  params.set(
    '_',
    String(
      Date.now()
    )
  );


  var data =
    await bibleApiRequest_(
      params
    );


  var rows =
    [];


  if (
    Array.isArray(
      data
    )
  ) {

    rows =
      data;

  } else if (
    data &&
    Array.isArray(
      data.data
    )
  ) {

    rows =
      data.data;

  } else if (
    data &&
    Array.isArray(
      data.questions
    )
  ) {

    rows =
      data.questions;

  } else if (
    data &&
    Array.isArray(
      data.items
    )
  ) {

    rows =
      data.items;
  }


  if (
    !rows.length
  ) {

    throw new Error(
      'No Bible questions returned.'
    );
  }


  return rows;
}


// SUBBLOCK 0240
// ============================================================
// Existing ANNE render helpers 유지
// ============================================================

function trData(q) {

  return Object.fromEntries(

    (
      q
        ?.license_question_translations ||
      []
    ).map(
      function(x) {

        return [
          x.language_code,
          x
        ];
      }
    )
  );
}


function languageRecord(
  t,
  code
) {

  code =
    String(
      code || ''
    ).toUpperCase();


  if (
    code === 'KOR' ||
    code === 'KO_WEB'
  ) {

    return t.ko;
  }


  return t.en;
}


function linesData(
  t,
  field
) {

  var values =
    [

      $('biblePrimaryTextSelector')
        ?.value,

      $('bibleSecondaryTextSelector')
        ?.value

    ];


  var seen =
    new Set();


  return values

    .filter(
      function(code) {

        return (
          code &&
          code !==
            'NONE' &&
          !seen.has(code) &&
          seen.add(code)
        );
      }
    )

    .map(
      function(code) {

        var normalized =
          String(
            code || ''
          ).toUpperCase();


        var record =
          languageRecord(
            t,
            normalized
          );


        var text =
          '';


        // Passage는 Bible Version 선택 지원
        if (
          field ===
          'passage'
        ) {

          if (
            normalized ===
            'KJV'
          ) {

            text =
              t.en
                ?.passage_kjv ||
              '';

          } else if (
            normalized ===
            'WEB' ||
            normalized ===
            'ENG'
          ) {

            text =
              t.en
                ?.passage_web ||
              t.en
                ?.passage ||
              '';

          } else if (
            normalized ===
            'KO_WEB' ||
            normalized ===
            'KOR'
          ) {

            text =
              t.ko
                ?.passage ||
              '';
          }

        } else {

          text =
            record
              ? record[
                  field
                ] ||
                ''
              : '';
        }


        return {

          code:
            (
              normalized ===
              'KO_WEB'
            )
              ? 'KOR'
              : (
                  normalized ===
                  'WEB' ||
                  normalized ===
                  'KJV'
                    ? 'ENG'
                    : normalized
                ),

          text:
            text
        };
      }
    )

    .filter(
      function(item) {

        return !!item.text;
      }
    );
}


function htmlLinesData(
  rows
) {

  return rows
    .map(
      function(item) {

        var cls =
          item.code ===
            'KOR'
            ? 'ko'
            : 'en';


        return (
          '<div ' +
          'class="language-line language-line-' +
          cls +
          '" ' +
          'data-language="' +
          item.code +
          '">' +
          esc(
            item.text
          ) +
          '</div>'
        );
      }
    )
    .join('');
}


// SUBBLOCK 0245
// ============================================================
// Chapter click → Catalog → Questions → ANNE engine
// ============================================================

window.loadBibleChapter =
  async function(
    testament,
    bookName,
    chapter
  ) {

    try {

      console.log(
        '[BIBLE] loading chapter:',
        testament,
        bookName,
        chapter
      );


     if (
  !BIBLE_CHAPTER_CATALOG.length ||
  !BIBLE_CHAPTER_CATALOG.some(
    function(item) {

      return String(
        item.CODE || ''
      ).indexOf(
        testament + '-'
      ) === 0;
    }
  )
) {

  await loadBibleChapterCatalog_(
    testament
  );
}

      var catalog =
        findBibleChapterCatalog_(
          testament,
          bookName,
          chapter
        );


      if (!catalog) {

        throw new Error(
          'Bible chapter catalog not found: ' +
          bookName +
          ' ' +
          chapter
        );
      }


      console.log(
        '[BIBLE] catalog item:',
        catalog
      );


      var rows =
        await loadBibleChapterQuestions_(
          catalog
        );


      var chapterCode =
        String(
          catalog.CODE ||
          (
            testament +
            '-' +
            bookName +
            '-' +
            String(
              chapter
            ).padStart(
              2,
              '0'
            )
          )
        );


      var questions =
        convertBibleApiRows_(
          rows,
          chapterCode
        );


      if (
        !questions.length
      ) {

        throw new Error(
          'No valid Bible questions.'
        );
      }


      ANNE_STATE.product =
        'bible';


      ANNE_STATE.questions =
        questions;


      ANNE_STATE.answers =
        new Array(
          questions.length
        ).fill(null);


      ANNE_STATE.index =
        0;


      ANNE_STATE._currentDate =
        chapterCode;


      ANNE_STATE._currentDayStart =
        0;


      ANNE_STATE._currentDayCount =
        questions.length;


      ANNE_STATE.annePassageVisible =
        true;


      ANNE_STATE.anneQuizVisible =
        true;


      window.__bibleSelectedTestament =
        testament;


      window.__bibleSelectedBook =
        bookName;


      window.__bibleSelectedChapter =
        chapter;


      console.log(
        '[BIBLE] ✅ loaded:',
        chapterCode,
        questions.length
      );


      enterQuiz(
        0
      );

    } catch (error) {

      console.error(
        '[BIBLE] chapter load failed:',
        error
      );


      alert(
        error.message ||
        'Bible data load failed.'
      );
    }
  };


// ============================================================
// BLOCK 0300: anne-state.js
// ============================================================
// ============================================================

// SUBBLOCK 0301
const ANNE_STATE = {
  product: '',
  questions: [],
  index: 0,
  baseOffset: 0,
  catalog: {},
  accessByProduct: {},
  mode: 'study',
  auto: false,
  run: 0,
  timerTotal: 0,
  timerLeft: 0,
  timerEnd: 0,
  timerId: null,
  answers: [],
  reviewSource: null,
  catalogLoading: false,

  annePassageVisible: true,
  anneQuizVisible: true,
  anneChunkVisible: false,

  recognition: null,
  micMode: false,
  _initialized: false,
  _currentDate: '',
  _currentDayStart: 0,
  _currentDayCount: 0,
  _selectedDateIndex: 0,
  _utterance: null
};

window.ANNE_STATE = ANNE_STATE;


// ============================================================
// BLOCK 0400: bible-home.js
// ============================================================
// ============================================================

var _homeInitialized = false;


// SUBBLOCK 0401
// ============================================================
// Bible 기본 설정 저장
// ============================================================

function saveLastSettings() {

  try {

    var settings = {

      mode:
        ANNE_STATE.mode ||
        'study',

      firstLang:
        $('biblePrimaryTextSelector')
          ?.value ||
        'ENG',

      secondLang:
        $('bibleSecondaryTextSelector')
          ?.value ||
        'KOR',

      auto:
        ANNE_STATE.auto ||
        false,

      micThreshold:
        window.__micThreshold ||
        70
    };

    localStorage.setItem(
      'gongboo.biblenew.lastSettings',
      JSON.stringify(settings)
    );

  } catch (e) {

    console.warn(
      '[BIBLE] 설정 저장 실패:',
      e
    );
  }
}


// SUBBLOCK 0405
// ============================================================
// Bible Home 초기화
// ============================================================

function setupHome() {

  if (_homeInitialized) {

    console.log(
      '[BIBLE] setupHome already initialized'
    );

    return;
  }

  _homeInitialized = true;

  console.log(
    '[BIBLE] setupHome'
  );


  document.documentElement.dataset.studyMode =
    'study';


  var splash =
    document.getElementById(
      'splashOverlay'
    );

  if (splash) {
    splash.style.display =
      'none';
  }


  var main =
    document.getElementById(
      'mainContainer'
    );

  if (main) {
    main.style.display =
      'block';
  }


  var quiz =
    document.getElementById(
      'quizMain'
    );

  if (quiz) {
    quiz.style.display =
      'none';
  }


  var setup =
    document.getElementById(
      'setupSection'
    );

  if (setup) {
    setup.style.display =
      'block';
  }


// SUBBLOCK 0410
// ============================================================
// Header title
// ============================================================

  var satTitle =
    document.querySelector(
      '.sat-title'
    );

  if (satTitle) {

    satTitle.innerHTML =
      '<span id="currentSetTitle">BIBLE</span>';
  }


// SUBBLOCK 0415
// ============================================================
// 초기 버튼 상태
// ============================================================

  var exploreBtn =
    document.getElementById(
      'bibleExploreToggle'
    );

  var peopleBtn =
    document.getElementById(
      'biblePeopleToggle'
    );

  var passageBtn =
    document.getElementById(
      'biblePassageToggle'
    );

  var quizBtn =
    document.getElementById(
      'bibleQuizToggle'
    );


  if (exploreBtn) {
    exploreBtn.disabled =
      true;
  }

  if (peopleBtn) {
    peopleBtn.disabled =
      true;
  }

  if (passageBtn) {
    passageBtn.disabled =
      true;
  }

  if (quizBtn) {
    quizBtn.disabled =
      true;
  }


// SUBBLOCK 0420
// ============================================================
// NEW LESSON
// 66 Books → Chapter
// ============================================================

var card =
  document.querySelector(
    '.card-new'
  );

if (card) {

  card.innerHTML = `

    <div
      id="resumeQuickContainer"
      class="resume-quick"
      hidden
    ></div>

    <div class="card-icon">
      📖
    </div>

    <div
      class="card-title card-title-new"
    >
      NEW LESSON
    </div>

    <div class="card-sub">
      Choose a book, then choose a chapter
    </div>

    <div
      id="bibleChapterPicker"
      class="bible-chapter-picker"
      aria-label="Bible chapters"
      aria-live="polite"
      hidden
    ></div>

    <div
      id="bibleBookPicker"
      class="bible-book-picker"
      aria-label="Bible books"
    ></div>

  `;
}


// SUBBLOCK 0425
// ============================================================
// Bible Book Picker 최초 표시
// ============================================================

renderBibleBookPicker_();


// SUBBLOCK 0430
// ============================================================
// Compact RESUME button
// 책 목록 바로 위 작은 버튼
// ============================================================

var resume =
  document.querySelector(
    '.card-resume'
  );

if (resume) {

  resume.hidden = true;
  resume.style.display = 'none';
}


var resumeQuick =
  document.getElementById(
    'resumeQuickContainer'
  );

if (resumeQuick) {

  resumeQuick.hidden = false;

  resumeQuick.innerHTML = `
    <button
      type="button"
      id="bibleResumeBtn"
      style="
        display:inline-block;
        width:auto;
        min-width:0;
        padding:5px 12px;
        margin:0 0 12px 0;
        border:1px solid #e5a923;
        border-radius:7px;
        background:#fff8e7;
        color:#2c3e50;
        font-size:12px;
        font-weight:700;
        cursor:pointer;
      "
    >
      RESUME
    </button>
  `;


  var resumeBtn =
    document.getElementById(
      'bibleResumeBtn'
    );

  if (resumeBtn) {

    resumeBtn.onclick =
      function() {

        console.log(
          '[BIBLE] RESUME selected'
        );

        // 실제 Resume 연결은
        // Bible progress 연결 단계에서 추가
      };
  }
}


// SUBBLOCK 0435
// ============================================================
// Anne GOLD 공통 기능 설치
// ============================================================

  installLanguages();

  installModes();

  installTimer();

  installTutor();

  installResults();

  installSpeech();

  installAnneToggles();


// SUBBLOCK 0440
// ============================================================
// 저장 설정 복원
// ============================================================

  var savedSettings =
    {};

  try {

    var raw =
      localStorage.getItem(
        'gongboo.biblenew.lastSettings'
      );

    if (raw) {

      savedSettings =
        JSON.parse(raw);
    }

  } catch (e) {}


  if (
    savedSettings.mode
  ) {

    var modeBtn =
      document.querySelector(
        '[data-ui-mode="' +
        savedSettings.mode +
        '"]'
      );

    if (modeBtn) {
      modeBtn.click();
    }
  }


  if (
    savedSettings.firstLang
  ) {

    $('biblePrimaryTextSelector').value =
      savedSettings.firstLang;
  }


  if (
    savedSettings.secondLang
  ) {

    $('bibleSecondaryTextSelector').value =
      savedSettings.secondLang;
  }


  if (
    savedSettings.auto
  ) {

    ANNE_STATE.auto =
      true;

    var autoBtn =
      $('licenseAuto');

    if (autoBtn) {

      autoBtn.textContent =
        'AUTO ON';

      autoBtn.setAttribute(
        'aria-pressed',
        'true'
      );

      autoBtn.classList.add(
        'active'
      );
    }
  }


  if (
    savedSettings.micThreshold
  ) {

    window.__micThreshold =
      Number(
        savedSettings.micThreshold
      );
  }


// SUBBLOCK 0445
// ============================================================
// PSG / QZ
// ============================================================

  ANNE_STATE.annePassageVisible =
    true;

  ANNE_STATE.anneQuizVisible =
    true;


  syncAnneToggleButtons();

  applyAnneVisibility();


  if (passageBtn) {
    passageBtn.disabled =
      false;
  }

  if (quizBtn) {
    quizBtn.disabled =
      false;
  }


// SUBBLOCK 0450
// ============================================================
// CHUNK button
// ============================================================

  var helpBtn =
    document.getElementById(
      'bibleGuideToggle'
    );

  if (helpBtn) {

    helpBtn.title =
      'Chunk';

    helpBtn.onclick =
      function() {

        ANNE_STATE.anneChunkVisible =
          !ANNE_STATE.anneChunkVisible;


        var container =
          document.getElementById(
            'chunkContainer'
          );


        if (container) {

          container.style.display =
            ANNE_STATE.anneChunkVisible
              ? 'block'
              : 'none';
        }


        this.classList.toggle(
          'active',
          ANNE_STATE.anneChunkVisible
        );


        this.setAttribute(
          'aria-pressed',
          String(
            ANNE_STATE.anneChunkVisible
          )
        );
      };
  }


// SUBBLOCK 0455
// ============================================================
// 완료
// ============================================================

  saveLastSettings();

  console.log(
    '[BIBLE] ✅ setupHome complete'
  );
}


// ============================================================
// BLOCK 0500: bible-navigation.js
// Book → Chapter
// ============================================================


// SUBBLOCK 0505
// ============================================================
// Bible 66 Books
// ============================================================

var BIBLE_BOOK_ORDER = [

  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1-Samuel',
  '2-Samuel',
  '1-Kings',
  '2-Kings',
  '1-Chronicles',
  '2-Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song-of-Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',

  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1-Corinthians',
  '2-Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1-Thessalonians',
  '2-Thessalonians',
  '1-Timothy',
  '2-Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1-Peter',
  '2-Peter',
  '1-John',
  '2-John',
  '3-John',
  'Jude',
  'Revelation'
];


// SUBBLOCK 0510
// ============================================================
// 각 Book Chapter 수
// ============================================================

var BIBLE_BOOK_CHAPTER_COUNTS = [

  50,40,27,36,34,24,21,4,31,24,
  22,25,29,36,10,13,10,42,150,31,
  12,8,66,52,5,48,12,14,3,9,
  1,4,7,3,3,3,2,14,4,

  28,16,24,21,28,16,16,13,6,6,
  4,4,5,3,6,4,3,1,13,5,
  5,3,5,1,1,1,22
];


// SUBBLOCK 0515
// ============================================================
// 현재 선택 상태
// ============================================================

var BIBLE_SELECTED_BOOK =
  '';

var BIBLE_SELECTED_CHAPTER =
  0;

var BIBLE_SELECTED_TESTAMENT =
  '';


// SUBBLOCK 0520
// ============================================================
// Testament 판정
// ============================================================

function getBibleTestament_(
  bookName
) {

  var index =
    BIBLE_BOOK_ORDER.indexOf(
      bookName
    );

  return index >= 39
    ? 'NT'
    : 'OT';
}


// SUBBLOCK 0525
// ============================================================
// Book 이름 화면 표시
// ============================================================

function bibleBookDisplayName_(
  bookName
) {

  return String(
    bookName || ''
  ).replace(
    /-/g,
    ' '
  );
}


// SUBBLOCK 0530
// ============================================================
// 66권 목록 - 좌우 정확히 33권씩
//
// LEFT  : Genesis ~ Micah
// RIGHT : Nahum ~ Malachi + New Testament
// ============================================================

function renderBibleBookPicker_() {

  var bookHost =
    document.getElementById(
      'bibleBookPicker'
    );

  var chapterHost =
    document.getElementById(
      'bibleChapterPicker'
    );

  if (
    !bookHost ||
    !chapterHost
  ) {
    return;
  }

  chapterHost.hidden = true;
  chapterHost.innerHTML = '';
  bookHost.innerHTML = '';


  var grid =
    document.createElement(
      'div'
    );

  grid.style.cssText =
    'display:grid;' +
    'grid-template-columns:1fr 1fr;' +
    'gap:22px;' +
    'width:100%;' +
    'align-items:start;';


  var leftColumn =
    document.createElement(
      'div'
    );

  var rightColumn =
    document.createElement(
      'div'
    );


  // LEFT HEADER
  var leftHeading =
    document.createElement(
      'h3'
    );

  leftHeading.innerHTML =
    '<span>Old Testament</span>' +
    '<small style="float:right;">39 books</small>';

  leftHeading.style.cssText =
    'font-size:16px;' +
    'margin:0 0 10px 0;' +
    'color:#2c3e50;';

  leftColumn.appendChild(
    leftHeading
  );


  // RIGHT OT HEADER
  var rightOldHeading =
    document.createElement(
      'h3'
    );

  rightOldHeading.innerHTML =
    '<span>Old Testament · continued</span>';

  rightOldHeading.style.cssText =
    'font-size:16px;' +
    'margin:0 0 10px 0;' +
    'color:#2c3e50;';

  rightColumn.appendChild(
    rightOldHeading
  );


  function createBookButton(
    bookName
  ) {

    var testament =
      getBibleTestament_(
        bookName
      );

    var button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.textContent =
      bibleBookDisplayName_(
        bookName
      );

    button.dataset.book =
      bookName;

    button.dataset.testament =
      testament;

    button.style.cssText =
      'display:block;' +
      'width:100%;' +
      'padding:9px 4px;' +
      'border:0;' +
      'border-bottom:1px solid #dbe3ec;' +
      'background:transparent;' +
      'text-align:left;' +
      'color:#2c3e50;' +
      'font-size:15px;' +
      'cursor:pointer;';


    button.onclick =
      function() {

        BIBLE_SELECTED_BOOK =
          bookName;

        BIBLE_SELECTED_TESTAMENT =
          testament;


        bookHost
          .querySelectorAll(
            '[data-book]'
          )
          .forEach(
            function(item) {

              item.style.background =
                item === button
                  ? '#eef5ff'
                  : 'transparent';

              item.style.color =
                item === button
                  ? '#2563eb'
                  : '#2c3e50';
            }
          );


        renderBibleChapterPicker_(
          bookName
        );


        button.insertAdjacentElement(
          'afterend',
          chapterHost
        );
      };


    return button;
  }


  // ----------------------------------------------------------
  // LEFT = Genesis ~ Micah
  // index 0 ~ 32 = 33 books
  // ----------------------------------------------------------

  for (
    var i = 0;
    i < 33;
    i++
  ) {

    leftColumn.appendChild(
      createBookButton(
        BIBLE_BOOK_ORDER[i]
      )
    );
  }


  // ----------------------------------------------------------
  // RIGHT TOP = Nahum ~ Malachi
  // index 33 ~ 38 = 6 books
  // ----------------------------------------------------------

  for (
    var i = 33;
    i < 39;
    i++
  ) {

    rightColumn.appendChild(
      createBookButton(
        BIBLE_BOOK_ORDER[i]
      )
    );
  }


  // NEW TESTAMENT HEADER
  var ntHeading =
    document.createElement(
      'h3'
    );

  ntHeading.innerHTML =
    '<span>New Testament</span>' +
    '<small style="float:right;">27 books</small>';

  ntHeading.style.cssText =
    'font-size:16px;' +
    'margin:12px 0 10px 0;' +
    'color:#2c3e50;';

  rightColumn.appendChild(
    ntHeading
  );


  // ----------------------------------------------------------
  // RIGHT = Matthew ~ Revelation
  // ----------------------------------------------------------

  for (
    var i = 39;
    i < BIBLE_BOOK_ORDER.length;
    i++
  ) {

    rightColumn.appendChild(
      createBookButton(
        BIBLE_BOOK_ORDER[i]
      )
    );
  }


  grid.appendChild(
    leftColumn
  );

  grid.appendChild(
    rightColumn
  );

  bookHost.appendChild(
    grid
  );
}


// SUBBLOCK 0535
// ============================================================
// Chapter 목록 생성
// ============================================================

function renderBibleChapterPicker_(
  bookName
) {

  var chapterHost =
    document.getElementById(
      'bibleChapterPicker'
    );

  if (!chapterHost) {
    return;
  }


  var bookIndex =
    BIBLE_BOOK_ORDER.indexOf(
      bookName
    );


  if (bookIndex < 0) {
    return;
  }


  var chapterCount =
    BIBLE_BOOK_CHAPTER_COUNTS[
      bookIndex
    ] || 1;


  chapterHost.innerHTML =
    '';

  chapterHost.hidden =
    false;


  var grid =
    document.createElement(
      'div'
    );

  grid.className =
    'bible-chapter-grid';


  for (
    var chapter = 1;
    chapter <= chapterCount;
    chapter++
  ) {

    (function(chapterNumber) {

      var button =
        document.createElement(
          'button'
        );

      button.type =
        'button';

      button.className =
        'bible-chapter-button';

      button.textContent =
        String(
          chapterNumber
        );


      button.setAttribute(
        'aria-label',
        bibleBookDisplayName_(
          bookName
        ) +
        ' Chapter ' +
        chapterNumber
      );


      button.onclick =
        function() {

          chapterHost
            .querySelectorAll(
              '.bible-chapter-button'
            )
            .forEach(
              function(item) {

                item.classList.toggle(
                  'is-selected',
                  item === button
                );
              }
            );


          BIBLE_SELECTED_BOOK =
            bookName;

          BIBLE_SELECTED_CHAPTER =
            chapterNumber;

          BIBLE_SELECTED_TESTAMENT =
            getBibleTestament_(
              bookName
            );


          console.log(
            '[BIBLE] selected:',
            BIBLE_SELECTED_TESTAMENT,
            BIBLE_SELECTED_BOOK,
            BIBLE_SELECTED_CHAPTER
          );


          openBibleChapter_(
            bookName,
            chapterNumber
          );
        };


      grid.appendChild(
        button
      );

    })(chapter);
  }


  chapterHost.appendChild(
    grid
  );
}


// SUBBLOCK 0540
// ============================================================
// Chapter 선택 후 진입
//
// 다음 단계에서 실제 Bible Supabase Loader를
// 이 함수에 연결한다.
// ============================================================

function openBibleChapter_(
  bookName,
  chapter
) {

  var testament =
    getBibleTestament_(
      bookName
    );


  window.__bibleSelectedTestament =
    testament;

  window.__bibleSelectedBook =
    bookName;

  window.__bibleSelectedChapter =
    chapter;


  console.log(
    '[BIBLE] chapter ready:',
    testament +
    '-' +
    bookName +
    '-' +
    String(chapter)
      .padStart(2, '0')
  );


  // 실제 Bible Loader가 연결되면
  // 자동 호출
  if (
    typeof window.loadBibleChapter ===
    'function'
  ) {

    window.loadBibleChapter(
      testament,
      bookName,
      chapter
    );

    return;
  }


  console.log(
    '[BIBLE] Loader connection is next step'
  );
}


// ============================================================
// BLOCK 0600: anne-render.js
// ============================================================
// ============================================================

// SUBBLOCK 0601
function applyAnneVisibility() {
  var passages = document.querySelectorAll('.anne-passage');
  var fullDiaries = document.querySelectorAll('.anne-full-diary');
  var quiz = document.querySelector('.anne-quiz');
  
  passages.forEach(function(el) {
    el.style.display = ANNE_STATE.annePassageVisible ? '' : 'none';
  });
  fullDiaries.forEach(function(el) {
    el.style.display = ANNE_STATE.annePassageVisible ? 'none' : '';
  });
  if (quiz) {
    quiz.style.display = (ANNE_STATE.anneQuizVisible && ANNE_STATE.annePassageVisible) ? '' : 'none';
  }
}

// SUBBLOCK 0602
function syncAnneToggleButtons() {

  var p = document.getElementById('biblePassageToggle');
  var q = document.getElementById('bibleQuizToggle');

  if (p) {

    var passageVisible =
      ANNE_STATE.annePassageVisible;

    // PSG는 "전문 보기" 버튼이므로
    // 전문이 보일 때 ON 표시
    var psgOn =
      !passageVisible;

    p.setAttribute(
      'aria-pressed',
      String(psgOn)
    );

    // 기존 내부 상태 저장용은 유지
    p.classList.toggle(
      'is-on',
      passageVisible
    );

    // 실제 버튼 선택표시는 전문이 보일 때
    p.classList.toggle(
      'active',
      psgOn
    );

    p.style.setProperty(
      'filter',
      psgOn ? 'brightness(0.75)' : '',
      'important'
    );

    p.style.setProperty(
      'font-weight',
      psgOn ? '700' : '',
      'important'
    );
  }

  if (q) {

    var qOn =
      ANNE_STATE.anneQuizVisible;

    q.setAttribute(
      'aria-pressed',
      String(qOn)
    );

    q.classList.toggle(
      'is-on',
      qOn
    );

    q.classList.toggle(
      'active',
      qOn
    );

    q.style.setProperty(
      'filter',
      qOn ? 'brightness(0.75)' : '',
      'important'
    );

    q.style.setProperty(
      'font-weight',
      qOn ? '700' : '',
      'important'
    );
  }
}

// SUBBLOCK 0603
function installAnneToggles() {
  var p = $('biblePassageToggle');
  var q = $('bibleQuizToggle');

  if (p && !p.dataset.anneBound) {
    p.dataset.anneBound = '1';
    p.onclick = function() {
      ANNE_STATE.annePassageVisible = !ANNE_STATE.annePassageVisible;
      syncAnneToggleButtons();
      applyAnneVisibility();
      saveLastSettings();
    };
  }

  if (q && !q.dataset.anneBound) {
    q.dataset.anneBound = '1';
    q.onclick = function() {
      ANNE_STATE.anneQuizVisible = !ANNE_STATE.anneQuizVisible;
      syncAnneToggleButtons();
      applyAnneVisibility();
      saveLastSettings();
    };
  }
  syncAnneToggleButtons();
}

// SUBBLOCK 0604
function render() {

  stopSpeech();

  var currentDate =
    ANNE_STATE._currentDate;

  if (!currentDate) {
    return;
  }

  var dayQuestions =
    ANNE_STATE.questions.filter(function(q) {
      return q.date === currentDate;
    });

  if (!dayQuestions.length) {
    return;
  }

  var dayIndex =
    ANNE_STATE.index -
    ANNE_STATE._currentDayStart;

  if (
    dayIndex < 0 ||
    dayIndex >= dayQuestions.length
  ) {
    dayIndex = 0;
    ANNE_STATE.index =
      ANNE_STATE._currentDayStart;
  }

  var q =
    dayQuestions[dayIndex];

  var t =
    trData(q);


  // SUBBLOCK 0604-01
  // ==========================================================
  // 하루 전체 PASSAGE
  // 현재 선택 언어 그대로 생성
  // ==========================================================

  var selectedDiaryLanguages = [
    $('biblePrimaryTextSelector').value,
    $('bibleSecondaryTextSelector').value
  ].filter(function(code, index, arr) {
    return (
      code !== 'NONE' &&
      arr.indexOf(code) === index
    );
  });

  var fullDiaryLines = [];

  dayQuestions.forEach(function(qq) {

    var diaryTranslation =
      trData(qq);

    selectedDiaryLanguages.forEach(function(code) {

      var record =
        languageRecord(
          diaryTranslation,
          code
        );

      if (
        record &&
        record.passage
      ) {
        fullDiaryLines.push({
          code: code,
          text: record.passage
        });
      }

    });

  });


  // SUBBLOCK 0604-02
  // ==========================================================
  // 현재 선택 답
  // ==========================================================

  var picked =
    ANNE_STATE.answers[
      ANNE_STATE.index
    ];


  // SUBBLOCK 0604-03
  // ==========================================================
  // 화면 생성
  // ==========================================================

  $('questionContainer').innerHTML = `
    <div class="question-card">

      <div class="q-num">
        Question ${dayIndex + 1} / ${dayQuestions.length}

        <span style="
          float:right;
          font-weight:400;
          font-size:13px;
          color:#888;
        ">
          📅 ${currentDate}
        </span>
      </div>

      <div
        class="anne-full-diary"
        style="
          display:none;
          padding:16px;
          background:#faf8f5;
          border-radius:8px;
          margin:12px 0;
          border-left:4px solid #8b7a6a;
        "
        data-date="${q.date}"
      >
        ${htmlLinesData(fullDiaryLines)}
      </div>

      <div class="anne-passage">

        <div class="anne-passage-content">

          ${htmlLinesData(
            linesData(
              t,
              'passage'
            )
          )}

        </div>

      </div>

      <div
        id="chunkContainer"
        style="
          display:none;
          padding:16px;
          background:#fcf9f5;
          border-radius:12px;
          border-left:5px solid #d4a373;
          margin:12px 0;
        "
      >

        <div style="
          font-weight:bold;
          margin-bottom:10px;
          color:#5a4a3a;
          font-size:16px;
        ">
          📖 Chunk Reading
        </div>

        ${
          [1,2,3,4,5].map(function(n) {

            var chunkText =
              linesData(
                t,
                'chunk_' + n
              )
              .map(function(x) {
                return x.text;
              })
              .join(' ');

            return chunkText
              ? '<div style="padding:6px 0; font-size:15px; line-height:1.8; color:#2d2d2d; border-bottom:1px solid #f0ebe5;">• ' +
                chunkText +
                '</div>'
              : '';

          }).join('')
        }

      </div>

      <div class="anne-quiz">

        <div class="question-text">

          ${htmlLinesData(
            linesData(
              t,
              'question_text'
            )
          )}

        </div>

        <div class="choices">

          ${
            [1,2,3,4].map(function(n) {

              var isSelected =
                picked === n
                  ? ' selected'
                  : '';

              return (
                '<button type="button" ' +
                'class="choice' +
                isSelected +
                '" data-answer="' +
                n +
                '">' +

                '<span class="choice-letter">' +
                String.fromCharCode(64 + n) +
                '</span>' +

                '<span class="choice-language-content">' +
                htmlLinesData(
                  linesData(
                    t,
                    'option_' + n
                  )
                ) +
                '</span>' +

                '</button>'
              );

            }).join('')
          }

        </div>

        <div id="licenseFeedback"></div>

      </div>

    </div>
  `;


  // SUBBLOCK 0604-04
  // ==========================================================
  // 선택지 클릭
  // ==========================================================

  document
    .querySelectorAll('.choices .choice')
    .forEach(function(b) {

      b.onclick = function() {

        var ansNum =
          Number(
            b.getAttribute(
              'data-answer'
            )
          );

        answer(
          ansNum,
          b
        );
      };

    });


  // SUBBLOCK 0604-05
  // ==========================================================
  // 기존 선택 복원 / LRN 정답 표시
  // ==========================================================

  if (picked) {

    var selectedBtn =
      document.querySelector(
        '.choice[data-answer="' +
        picked +
        '"]'
      );

    if (selectedBtn) {
      answer(
        picked,
        selectedBtn
      );
    }

  } else if (
    ANNE_STATE.mode === 'learn'
  ) {

    var correctEl =
      document.querySelector(
        '.choice[data-answer="' +
        q.answer +
        '"]'
      );

    if (correctEl) {
      correctEl.classList.add(
        'correct'
      );
    }

    feedback(true);
  }


  // SUBBLOCK 0604-06
  // ==========================================================
  // Progress
  // ==========================================================

  var progressPercent =
    dayQuestions.length
      ? (
          (dayIndex + 1) /
          dayQuestions.length *
          100
        )
      : 0;

  $('quizProgressBar').style.width =
    progressPercent + '%';

  $('prevBtn').disabled =
    dayIndex === 0;

  var isLastQuestion =
    dayIndex ===
    dayQuestions.length - 1;


  // SUBBLOCK 0604-07
  // ==========================================================
  // 현재 로딩된 SET 목록 / 마지막 SET 확인
  // ==========================================================

  var loadedDates = [];

  ANNE_STATE.questions.forEach(function(item) {

    if (
      item.date &&
      loadedDates.indexOf(item.date) === -1
    ) {
      loadedDates.push(
        item.date
      );
    }

  });

  var isLastLoadedSet =
    currentDate ===
    loadedDates[
      loadedDates.length - 1
    ];


  // SUBBLOCK 0604-08
// ==========================================================
// PSG MODE
// ==========================================================

if (
  !ANNE_STATE.annePassageVisible
) {

  $('nextBtn').style.display =
    'inline-block';

  $('nextBtn').textContent =
    isLastLoadedSet
      ? 'LOAD NEXT SETS'
      : 'NEXT PASSAGE';

  $('skipBtn').style.display =
    'none';

  $('submitBtn').style.display =
    'none';
}


  // SUBBLOCK 0604-09
  // ==========================================================
  // QZ MODE
  // ==========================================================

  else {

    $('nextBtn').textContent =
      'NEXT';

    $('nextBtn').style.display =
      isLastQuestion
        ? 'none'
        : 'inline-block';

    $('skipBtn').style.display =
      isLastQuestion
        ? 'none'
        : 'inline-block';

    $('submitBtn').style.display =
      isLastQuestion
        ? 'inline-block'
        : 'none';

  }


  // SUBBLOCK 0604-10
  // ==========================================================
  // PSG / QZ 화면 적용
  // ==========================================================

  applyAnneVisibility();


  // SUBBLOCK 0604-11
  // ==========================================================
  // CHUNK 상태 유지
  // ==========================================================

  var chunkContainer =
    document.getElementById(
      'chunkContainer'
    );

  var helpBtn =
    document.getElementById(
      'bibleGuideToggle'
    );

  if (chunkContainer) {

    chunkContainer.style.display =
      ANNE_STATE.anneChunkVisible
        ? 'block'
        : 'none';

  }

  if (helpBtn) {

    helpBtn.classList.toggle(
      'active',
      ANNE_STATE.anneChunkVisible
    );

    helpBtn.setAttribute(
      'aria-pressed',
      String(
        ANNE_STATE.anneChunkVisible
      )
    );

  }


  // SUBBLOCK 0604-12
  // ==========================================================
  // 저장
  // ==========================================================

  save();
}

// SUBBLOCK 0605
function answer(n, b) {
  ANNE_STATE.answers[ANNE_STATE.index] = n;
  var q = ANNE_STATE.questions[ANNE_STATE.index];
  if (!q) {
    console.warn('⚠️ 현재 문제를 찾을 수 없음');
    return;
  }

  var ok = Number(n) === Number(q.answer);

  document.querySelectorAll('.choice').forEach(function(x) {
    x.classList.remove('selected', 'correct', 'incorrect');
  });

  if (b) {
    b.classList.add('selected');
  }

  if (ANNE_STATE.mode === 'exam') {
    save();
    return;
  }

  if (b) {
    b.classList.add(ok ? 'correct' : 'incorrect');
  }

  var correctEl = document.querySelector('.choice[data-answer="' + q.answer + '"]');
  if (correctEl) {
    correctEl.classList.add('correct');
  }

  feedback(ok);
  save();
}

// SUBBLOCK 0606
function feedback(ok) {
  var q = ANNE_STATE.questions[ANNE_STATE.index];
  if (!q) return;
  var t = trData(q);
  
  var feedbackEl = document.getElementById('licenseFeedback');
  if (!feedbackEl) return;
  
  feedbackEl.innerHTML = `
    <div class="explanation show" style="${ok ? 'border-left-color: #27ae60; background: #e9f7ef;' : 'border-left-color: #e74c3c; background: #fde8e8;'}">
      <strong>${ok ? '✅ Correct' : '❌ Review the rule'}</strong>
      ${htmlLinesData(linesData(t, 'explanation'))}
    </div>
  `;
}


// ============================================================
// BLOCK 0700: anne-results.js
// ============================================================
// ============================================================

// SUBBLOCK 0701
function installResults() {
  var submitBtn = document.getElementById('submitBtn');
  var retryAllBtn = document.getElementById('retryAllBtn');
  var reviewWrongBtn = document.getElementById('reviewWrongBtn');
  var retryWrongBtn = document.getElementById('retryWrongFromReviewBtn');
  var closeModalBtn = document.getElementById('closeModalBtn');
  var closeWrongBtn = document.getElementById('closeWrongBtn');

  if (submitBtn) {
    submitBtn.onclick = function() { showResults(); };
  }
  if (retryAllBtn) {
    retryAllBtn.onclick = function() {
      for (var i = 0; i < ANNE_STATE.answers.length; i++) {
        ANNE_STATE.answers[i] = null;
      }
      ANNE_STATE.index = 0;
      var modal = document.getElementById('resultModal');
      if (modal) { modal.style.display = 'none'; }
      render();
    };
  }
  if (reviewWrongBtn) {
    reviewWrongBtn.onclick = function() { showWrongAnswers(); };
  }
  if (retryWrongBtn) {
    retryWrongBtn.onclick = function() { retryWrong(); };
  }
  if (closeModalBtn) {
    closeModalBtn.onclick = function() {
      var modal = document.getElementById('resultModal');
      if (modal) { modal.style.display = 'none'; }
    };
  }
  if (closeWrongBtn) {
    closeWrongBtn.onclick = function() {
      var modal = document.getElementById('wrongModal');
      if (modal) { modal.style.display = 'none'; }
    };
  }
}

// SUBBLOCK 0702
function wrongIndices() {
  var out = [];
  for (var i = 0; i < ANNE_STATE.questions.length; i++) {
    if (ANNE_STATE.answers[i] == null || ANNE_STATE.answers[i] === -1 || Number(ANNE_STATE.answers[i]) !== Number(ANNE_STATE.questions[i].answer)) {
      out.push(i);
    }
  }
  return out;
}

// SUBBLOCK 0703
function showResults() {

  var currentDate =
    ANNE_STATE._currentDate;

  var dayQuestions =
    ANNE_STATE.questions.filter(function(q) {
      return q.date === currentDate;
    });


  // SUBBLOCK 0703-01
  // ==========================================================
  // 현재 SET 점수 계산
  // ==========================================================

  var correct = 0;
  var answered = 0;

  for (
    var i = 0;
    i < dayQuestions.length;
    i++
  ) {

    var answerIndex =
      ANNE_STATE._currentDayStart + i;

    var a =
      ANNE_STATE.answers[
        answerIndex
      ];

    if (
      a != null &&
      a !== -1
    ) {
      answered++;
    }

    if (
      Number(a) ===
      Number(
        dayQuestions[i].answer
      )
    ) {
      correct++;
    }

  }


  // SUBBLOCK 0703-02
  // ==========================================================
  // 점수 / 정답률 표시
  // ==========================================================

  var correctEl =
    document.getElementById(
      'correctCount'
    );

  var accuracyEl =
    document.getElementById(
      'accuracyRate'
    );

  if (correctEl) {

    correctEl.textContent =
      correct +
      ' / ' +
      answered;

  }

  if (accuracyEl) {

    accuracyEl.textContent =
      (
        answered
          ? Math.round(
              correct /
              answered *
              100
            )
          : 0
      ) + '%';

  }


  // SUBBLOCK 0703-03
  // ==========================================================
  // 현재 SET 결과 그리드
  // ==========================================================

  var gridEl =
    document.getElementById(
      'resultGrid'
    );

  if (gridEl) {

    var gridHtml = '';

    for (
      var i = 0;
      i < dayQuestions.length;
      i++
    ) {

      var answerIndex =
        ANNE_STATE._currentDayStart + i;

      var a =
        ANNE_STATE.answers[
          answerIndex
        ];

      var cls =
        'incorrect';

      if (
        Number(a) ===
        Number(
          dayQuestions[i].answer
        )
      ) {

        cls =
          'correct';

      } else if (
        a === -1
      ) {

        cls =
          'skipped';

      } else if (
        a == null
      ) {

        cls =
          'unanswered';

      }

      gridHtml +=
        '<div class="result-item ' +
        cls +
        '">' +
        (i + 1) +
        '</div>';

    }

    gridEl.innerHTML =
      gridHtml;

  }


  // SUBBLOCK 0703-04
  // ==========================================================
  // 현재 로딩된 SET 목록
  // ==========================================================

  var loadedDates = [];

  ANNE_STATE.questions.forEach(function(q) {

    if (
      q.date &&
      loadedDates.indexOf(q.date) === -1
    ) {

      loadedDates.push(
        q.date
      );

    }

  });


  // SUBBLOCK 0703-05
  // ==========================================================
  // 현재 SET이 로딩된 5 SET 중 마지막인지 확인
  // ==========================================================

  var isLastLoadedSet =
    currentDate ===
    loadedDates[
      loadedDates.length - 1
    ];


  // SUBBLOCK 0703-06
  // ==========================================================
  // RESULT Modal
  // ==========================================================

  var modal =
    document.getElementById(
      'resultModal'
    );

  if (!modal) {
    return;
  }


  // SUBBLOCK 0703-07
  // ==========================================================
  // NEXT SET 버튼 생성
  // ==========================================================

  var nextSetBtn =
    document.getElementById(
      'nextSetBtn'
    );

  if (!nextSetBtn) {

    nextSetBtn =
      document.createElement(
        'button'
      );

    nextSetBtn.id =
      'nextSetBtn';

    nextSetBtn.type =
      'button';

    nextSetBtn.className =
      'btn-start';

    var modalContent =
      modal.querySelector(
        '.modal-content'
      ) || modal;

    modalContent.appendChild(
      nextSetBtn
    );

  }


  // SUBBLOCK 0703-08
// ==========================================================
// NEXT SET / LOAD NEXT SETS
// ==========================================================

nextSetBtn.textContent =
  isLastLoadedSet
    ? 'LOAD NEXT SETS'
    : 'NEXT SET';

nextSetBtn.onclick =
  function() {

    if (
      isLastLoadedSet
    ) {

      loadNextSets(
        'quiz'
      );

    } else {

      goNextSet();

    }

  };


  // SUBBLOCK 0703-09
  // ==========================================================
  // 결과창 표시
  // ==========================================================

  modal.style.display =
    'flex';
}

// SUBBLOCK 0704
function showWrongAnswers() {
  var ids = wrongIndices();
  if (!ids.length) { alert('All answers are correct.'); return; }
  
  var listEl = document.getElementById('wrongList');
  if (!listEl) return;
  
  var listHtml = '';
  for (var idx = 0; idx < ids.length; idx++) {
    var i = ids[idx];
    var q = ANNE_STATE.questions[i];
    var t = trData(q);
    var a = ANNE_STATE.answers[i];
    listHtml += `
      <div class="wrong-item">
        <strong>Question ${i+1}</strong>
        <div>${htmlLinesData(linesData(t, 'question_text'))}</div>
        <p>Your answer: ${a == null || a === -1 ? '—' : String.fromCharCode(64 + Number(a))}<br>Correct answer: ${String.fromCharCode(64 + Number(q.answer))}</p>
        <div>${htmlLinesData(linesData(t, 'explanation'))}</div>
      </div>
    `;
  }
  listEl.innerHTML = listHtml;
  
  var modal = document.getElementById('wrongModal');
  if (modal) { modal.style.display = 'flex'; }
}

// SUBBLOCK 0705
function retryWrong() {
  var ids = wrongIndices();
  if (!ids.length) { alert('All answers are correct.'); return; }
  ANNE_STATE.questions = ids.map(function(i) { return ANNE_STATE.questions[i]; });
  ANNE_STATE.answers = new Array(ANNE_STATE.questions.length).fill(null);
  ANNE_STATE.index = 0;
  
  var wrongModal = document.getElementById('wrongModal');
  var resultModal = document.getElementById('resultModal');
  var reviewBanner = document.getElementById('reviewBanner');
  
  if (wrongModal) { wrongModal.style.display = 'none'; }
  if (resultModal) { resultModal.style.display = 'none'; }
  
  if (reviewBanner) {
    reviewBanner.style.display = 'flex';
    reviewBanner.innerHTML = `
      <span>Review Mode: ${ANNE_STATE.questions.length} questions</span>
      <button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>
    `;
    var exitBtn = document.getElementById('exitReviewBtn');
    if (exitBtn) { exitBtn.onclick = function() { location.reload(); }; }
  }
  render();
}


// ============================================================
// BLOCK 0800: anne-settings.js
// ============================================================
// ============================================================

// SUBBLOCK 0801
function installLanguages() {
  var pairs = [
    ['biblePrimaryTextSelector', 'ENG'],
    ['bibleSecondaryTextSelector', 'KOR']
  ];
  for (var p = 0; p < pairs.length; p++) {
    var id = pairs[p][0];
    var first = pairs[p][1];
    var s = document.getElementById(id);
    if (!s) continue;
    s.innerHTML = `
      <option value="ENG">ENG</option>
      <option value="KOR">KOR</option>
      <option value="JPN">JPN</option>
      <option value="NONE">NONE</option>
    `;
    s.value = first;
    s.onchange = function(selectorId) {
      return function() {
        var otherId = selectorId === 'biblePrimaryTextSelector' ? 'bibleSecondaryTextSelector' : 'biblePrimaryTextSelector';
        var other = document.getElementById(otherId);
        if (s.value === other.value) { other.value = 'NONE'; }
        if (ANNE_STATE.questions.length) { render(); }
      };
    }(id);
  }
}

// SUBBLOCK 0802
function installModes() {
  var apply = function(next) {
    ANNE_STATE.mode = next;
    document.documentElement.dataset.studyMode = next;
    document.querySelectorAll('[data-ui-mode]').forEach(function(x) {
      var selected = x.dataset.uiMode === next;
      x.classList.toggle('active', selected);
      x.setAttribute('aria-pressed', String(selected));
    });
    var timerToggle = document.getElementById('timerToggle');
    var timerPanel = document.getElementById('timerPanel');
    if (timerToggle) { timerToggle.hidden = next !== 'exam'; }
    if (timerPanel && next !== 'exam') { timerPanel.hidden = true; }
    if (ANNE_STATE.questions.length) { render(); }
  };
  document.querySelectorAll('[data-ui-mode]').forEach(function(b) {
    b.onclick = function() { apply(b.dataset.uiMode); };
  });
  var savedMode = saved();
  apply(savedMode?.mode || 'study');
}


// ============================================================
// BLOCK 0900: anne-timer.js
// ============================================================
// ============================================================

// SUBBLOCK 0901
function installTimer() {
  var toggle = document.getElementById('timerToggle');
  var panel = document.getElementById('timerPanel');
  if (toggle) {
    toggle.hidden = true;
    toggle.onclick = function() {
      if (panel) { panel.hidden = !panel.hidden; }
    };
  }
  var setBtn = document.getElementById('timerSetBtn');
  if (setBtn) {
    setBtn.onclick = function() {
      var hours = Number(document.getElementById('timerHours')?.value) || 0;
      var mins = Number(document.getElementById('timerMinutes')?.value) || 0;
      var secs = Number(document.getElementById('timerSecondsInput')?.value) || 0;
      ANNE_STATE.timerTotal = hours * 3600 + mins * 60 + secs;
      ANNE_STATE.timerLeft = ANNE_STATE.timerTotal;
      drawTimer();
    };
  }
  var pauseBtn = document.getElementById('timerPauseBtn');
  if (pauseBtn) {
    pauseBtn.onclick = function() {
      if (ANNE_STATE.timerId) {
        clearInterval(ANNE_STATE.timerId);
        ANNE_STATE.timerId = null;
        drawTimer();
        return;
      }
      if (!ANNE_STATE.timerLeft) return;
      ANNE_STATE.timerEnd = Date.now() + ANNE_STATE.timerLeft * 1000;
      ANNE_STATE.timerId = setInterval(drawTimer, 250);
      drawTimer();
    };
  }
  var resetBtn = document.getElementById('timerResetBtn');
  if (resetBtn) {
    resetBtn.onclick = function() {
      if (ANNE_STATE.timerId) { clearInterval(ANNE_STATE.timerId); }
      ANNE_STATE.timerId = null;
      ANNE_STATE.timerLeft = ANNE_STATE.timerTotal;
      drawTimer();
    };
  }
  document.querySelectorAll('[data-close-tool]').forEach(function(b) {
    b.onclick = function() {
      var panelEl = b.closest('.quiz-tool-panel');
      if (panelEl) { panelEl.hidden = true; }
    };
  });
}

// SUBBLOCK 0902
function drawTimer() {
  if (ANNE_STATE.timerId) {
    ANNE_STATE.timerLeft = Math.max(0, Math.ceil((ANNE_STATE.timerEnd - Date.now()) / 1000));
  }
  var display = document.getElementById('timerDisplay');
  if (display) {
    var hours = Math.floor(ANNE_STATE.timerLeft / 3600);
    var mins = Math.floor(ANNE_STATE.timerLeft % 3600 / 60);
    var secs = ANNE_STATE.timerLeft % 60;
    display.textContent = 
      String(hours).padStart(2, '0') + ':' +
      String(mins).padStart(2, '0') + ':' +
      String(secs).padStart(2, '0');
  }
  var pauseBtn = document.getElementById('timerPauseBtn');
  if (pauseBtn) {
    pauseBtn.textContent = ANNE_STATE.timerId ? '⏸ Pause' : '▶ Start';
  }
  if (ANNE_STATE.timerId && !ANNE_STATE.timerLeft) {
    clearInterval(ANNE_STATE.timerId);
    ANNE_STATE.timerId = null;
  }
}


// ============================================================
// BLOCK 1000: anne-tutor.js + NAV 버튼
// ============================================================
// ============================================================

// SUBBLOCK 1001
function installTutor() {
  var panel = document.getElementById('satTutorPanel');
  var input = document.getElementById('chatbotQuestion');
  if (!panel || !input) return;
  var send = panel.querySelector('button');
  if (!send) return;
  
  panel.classList.remove('is-license-active');
  var subtitle = panel.querySelector('.sat-tutor-subtitle');
  if (subtitle) { subtitle.textContent = 'Ask about the current question · license subject tutor'; }
  
  var response = document.getElementById('chatbotResponse');
  if (response) { response.textContent = '💡 Ask about the current license question.'; }
  
  send.removeAttribute('onclick');
  send.onclick = function() { tutor(); };
  input.removeAttribute('onkeypress');
  input.onkeydown = function(e) {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      tutor();
    }
  };
  window.sendChatbotMessage = function() { tutor(); };
}

// SUBBLOCK 1002
function tutor() {
  var box = document.getElementById('chatbotResponse');
  if (!box) return;
  
  if (ANNE_STATE.accessByProduct[ANNE_STATE.product] !== 'full') {
    box.innerHTML = '<div>AI Tutor requires an upgrade.</div><button type="button" id="licenseTutorUpgrade" class="btn-start" style="margin-top:12px;min-width:140px">UPGRADE</button>';
    var upgradeBtn = document.getElementById('licenseTutorUpgrade');
    if (upgradeBtn) {
      upgradeBtn.onclick = function() { location.href = './login.html?return=license'; };
    }
    return;
  }
  if (!ANNE_STATE.questions[ANNE_STATE.index]) {
    box.textContent = 'Start a license question first.';
    return;
  }
  return licenseRemoteTutor();
}

// SUBBLOCK 1003
function setButtonActive(btn) {
  if (!btn) return;
  var navBtns = document.querySelectorAll('.nav-btn, .btn-prev, .btn-next, .btn-skip, .btn-quit, .btn-submit');
  navBtns.forEach(function(b) {
    if (b) {
      b.classList.remove('btn-active');
      b.style.transform = 'scale(1)';
      b.style.boxShadow = 'none';
      b.style.filter = 'brightness(1)';
    }
  });
  
  btn.classList.add('btn-active');
  btn.style.transform = 'scale(0.95)';
  btn.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.5), inset 0 0 20px rgba(0,0,0,0.2)';
  btn.style.filter = 'brightness(0.75)';
  
  setTimeout(function() {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = 'none';
    btn.style.filter = 'brightness(1)';
    btn.classList.remove('btn-active');
  }, 350);
}

// SUBBLOCK 1004
var prevBtn = document.getElementById('prevBtn');
var skipBtn = document.getElementById('skipBtn');
var nextBtn = document.getElementById('nextBtn');
var quitBtn = document.getElementById('quitBtn');

if (prevBtn) {
  prevBtn.onclick = function() {
    setButtonActive(this);
    go(-1);
  };
}
if (skipBtn) {
  skipBtn.onclick = function() {
    setButtonActive(this);
    if (ANNE_STATE.answers[ANNE_STATE.index] == null) {
      ANNE_STATE.answers[ANNE_STATE.index] = -1;
    }
    go(1);
  };
}
if (nextBtn) {
  nextBtn.onclick = function() {
    setButtonActive(this);
    go(1);
  };
}
if (quitBtn) {
  quitBtn.onclick = function() {
    setButtonActive(this);
    setTimeout(function() { location.reload(); }, 200);
  };
}

// SUBBLOCK 1005
document.addEventListener('keydown', function(e) {
  if (e.target.matches('input,select,textarea')) return;
  
  if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') && 
      ANNE_STATE.index < ANNE_STATE.questions.length - 1) {
    e.preventDefault();
    if (nextBtn) { setButtonActive(nextBtn); }
    go(1);
  }
  if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') && 
      ANNE_STATE.index > 0) {
    e.preventDefault();
    if (prevBtn) { setButtonActive(prevBtn); }
    go(-1);
  }
  if (e.key === 'Enter' && ANNE_STATE.index === ANNE_STATE.questions.length - 1) {
    e.preventDefault();
    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) { setButtonActive(submitBtn); }
    if (typeof showResults === 'function') {
      showResults();
    }
  }
});

console.log('[ANNE] ✅ NAV 버튼 이벤트 바인딩 완료');


// ============================================================
// BLOCK 1100: anne-mic.js
// ENG / KOR / JPN 음성 읽기 연습
// MIC ON → 기준 % 창 표시
// 기준 이상 → PASS → 다음 문장
// ============================================================

var Speech =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


// SUBBLOCK 1101
// ============================================================
// MIC 전역 상태
// ============================================================

var _anneMicInstalled = false;
var _anneMicMoving = false;
var _anneMicRestartTimer = null;
var _anneMicRecognizeTimer = null;
var _anneMicLastTranscript = '';
var _anneMicCurrentRecognition = null;
var _anneMicPassageIndex = 0;

window.__micRecognizeDelay =
  Number(
    localStorage.getItem(
      'gongboo.anne.micRecognizeDelay'
    )
  ) || 2.0;

window.__micAutoAdvance =
  localStorage.getItem(
    'gongboo.anne.micAutoAdvance'
  ) !== 'false';

window.__micThreshold =
  Number(
    localStorage.getItem(
      'gongboo.anne.micThreshold'
    )
  ) || 70;


// SUBBLOCK 1102
// ============================================================
// 현재 MIC 연습 언어
// PRIMARY 언어를 기준으로 함
// ENG → en-US
// KOR → ko-KR
// JPN → ja-JP
// ============================================================

function getAnneMicLanguage() {

  var selector =
    document.getElementById(
      'biblePrimaryTextSelector'
    );

  var code =
    selector
      ? selector.value
      : 'ENG';

  if (code === 'KOR') {
    return {
      code: 'KOR',
      recognition: 'ko-KR'
    };
  }

  if (code === 'JPN') {
    return {
      code: 'JPN',
      recognition: 'ja-JP'
    };
  }

  return {
    code: 'ENG',
    recognition: 'en-US'
  };
}


// SUBBLOCK 1103
// ============================================================
// 현재 읽어야 할 화면 문장 찾기
// PRIMARY 언어의 현재 PASSAGE 사용
// ============================================================


function getCurrentMicSentence() {

  var langInfo =
    getAnneMicLanguage();


  // ----------------------------------------------------------
  // PASSAGE / FULL DIARY가 화면에 보이면
  // 한 문장씩 순서대로 연습
  // ----------------------------------------------------------

  var diaryLines =
    Array.from(
      document.querySelectorAll(
        '.anne-full-diary ' +
        '.language-line[data-language="' +
        langInfo.code +
        '"]'
      )
    ).filter(
      function(el) {

        var rect =
          el.getBoundingClientRect();

        return (
          rect.width > 0 &&
          rect.height > 0
        );
      }
    );


  if (diaryLines.length) {

    if (
      _anneMicPassageIndex < 0 ||
      _anneMicPassageIndex >=
        diaryLines.length
    ) {

      _anneMicPassageIndex = 0;
    }


    var diaryEl =
      diaryLines[
        _anneMicPassageIndex
      ];


    var diaryText =
      String(
        diaryEl.textContent || ''
      ).trim();


    if (diaryText) {

      return {
        element: diaryEl,
        text: diaryText,
        code: langInfo.code,
        recognition:
          langInfo.recognition,
        passageMode: true,
        passageIndex:
          _anneMicPassageIndex,
        passageCount:
          diaryLines.length
      };
    }
  }


  // ----------------------------------------------------------
  // 기존 단문 방식
  // ----------------------------------------------------------

  var selector =
    '.anne-passage ' +
    '.language-line[data-language="' +
    langInfo.code +
    '"]';


  var sentenceEl =
    document.querySelector(
      selector
    );


  if (!sentenceEl) {

    console.warn(
      '[MIC] 현재 문장을 찾지 못함:',
      langInfo.code
    );

    return null;
  }


  var text =
    String(
      sentenceEl.textContent || ''
    ).trim();


  if (!text) {
    return null;
  }


  return {
    element: sentenceEl,
    text: text,
    code: langInfo.code,
    recognition:
      langInfo.recognition,
    passageMode: false
  };
}


// SUBBLOCK 1104
// ============================================================
// ENG / KOR / JPN 비교용 텍스트 정규화
//
// 일본어:
// 私(わたし) → わたし
// 学校(がっこう) → がっこう
//
// 한자와 후리가나를 동시에 비교하지 않음
// ============================================================

function normalizeAnneMicText(
  text,
  langCode
) {

  var value =
    String(text || '')
      .normalize('NFKC');


  // ----------------------------------------------------------
  // 일본어 후리가나
  // ----------------------------------------------------------

  if (langCode === 'JPN') {

    value =
      value.replace(
        /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]+[\(（]([ぁ-ゖァ-ヺー]+)[\)）]/g,
        '$1'
      );

    value =
      value
        .replace(
          /[\s。、！？!?,.「」『』【】［］\[\]\(\)（）・：:;"']/g,
          ''
        )
        .toLowerCase();

    return value;
  }


  // ----------------------------------------------------------
  // 한국어
  // ----------------------------------------------------------

  if (langCode === 'KOR') {

    return value
      .replace(
        /[\s.,!?;:"'()[\]{}<>~`·…。，！？「」『』]/g,
        ''
      )
      .toLowerCase();
  }


  // ----------------------------------------------------------
  // 영어
  // ----------------------------------------------------------

  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9\s']/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


// SUBBLOCK 1105
// ============================================================
// Levenshtein 거리
// ============================================================

function anneLevenshtein(
  a,
  b
) {

  a =
    String(a || '');

  b =
    String(b || '');

  var m =
    a.length;

  var n =
    b.length;


  if (!m) {
    return n;
  }

  if (!n) {
    return m;
  }


  var prev =
    new Array(
      n + 1
    );

  var curr =
    new Array(
      n + 1
    );


  for (
    var j = 0;
    j <= n;
    j++
  ) {
    prev[j] = j;
  }


  for (
    var i = 1;
    i <= m;
    i++
  ) {

    curr[0] = i;


    for (
      var j = 1;
      j <= n;
      j++
    ) {

      var cost =
        a[i - 1] ===
        b[j - 1]
          ? 0
          : 1;


      curr[j] =
        Math.min(

          prev[j] + 1,

          curr[j - 1] + 1,

          prev[j - 1] +
          cost
        );
    }


    var temp =
      prev;

    prev =
      curr;

    curr =
      temp;
  }


  return prev[n];
}


// SUBBLOCK 1106
// ============================================================
// 문장 일치율 %
// ============================================================

function calculateAnneMicScore(
  original,
  spoken,
  langCode
) {

  var target =
    normalizeAnneMicText(
      original,
      langCode
    );

  var heard =
    normalizeAnneMicText(
      spoken,
      langCode
    );


  if (
    !target ||
    !heard
  ) {
    return 0;
  }


  var distance =
    anneLevenshtein(
      target,
      heard
    );


  var maxLength =
    Math.max(
      target.length,
      heard.length
    );


  if (!maxLength) {
    return 100;
  }


  var score =
    (
      1 -
      distance /
      maxLength
    ) *
    100;


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}


// SUBBLOCK 1107
// ============================================================
// MIC % 설정창
// ============================================================

function ensureAnneMicPanel() {

  var panel =
    document.getElementById(
      'anneMicPanel'
    );

  if (panel) {
    return panel;
  }

  panel =
    document.createElement(
      'div'
    );

  panel.id =
    'anneMicPanel';

  panel.style.cssText = `
    display:none;
    position:absolute;
    z-index:9999;
    min-width:210px;
    padding:10px 12px;
    background:#ffffff;
    border:1px solid #d1d5db;
    border-radius:10px;
    box-shadow:0 4px 15px rgba(0,0,0,0.18);
    font-size:13px;
  `;

  panel.innerHTML = `

    <div style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:7px;
      font-weight:700;
    ">
      <span>🎤 PASS</span>
      <span id="anneMicThresholdLabel">
        ${window.__micThreshold}%
      </span>
    </div>

    <input
      id="anneMicThreshold"
      type="range"
      min="40"
      max="100"
      step="5"
      value="${window.__micThreshold}"
      style="width:100%;cursor:pointer;"
    >

    <div style="
      margin-top:9px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
    ">
      <span style="font-weight:700;">
        Recognize Delay
      </span>

      <select
        id="anneMicRecognizeDelay"
        style="
          padding:4px 5px;
          border:1px solid #d1d5db;
          border-radius:6px;
        "
      >
        <option value="1">1.0 sec</option>
        <option value="1.5">1.5 sec</option>
        <option value="2">2.0 sec</option>
        <option value="2.5">2.5 sec</option>
        <option value="3">3.0 sec</option>
        <option value="4">4.0 sec</option>
        <option value="5">5.0 sec</option>
      </select>
    </div>

    <div style="
      margin-top:9px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
    ">
      <span style="font-weight:700;">
        Next
      </span>

      <button
        id="anneMicAdvanceMode"
        type="button"
        style="
          min-width:78px;
          padding:5px 8px;
          border:1px solid #9ca3af;
          border-radius:7px;
          background:#f3f4f6;
          font-weight:700;
          cursor:pointer;
        "
      ></button>
    </div>

    <button
      id="anneMicRecognize"
      type="button"
      style="
        width:100%;
        margin-top:9px;
        padding:7px 10px;
        border:1px solid #2563eb;
        border-radius:7px;
        background:#2563eb;
        color:#ffffff;
        font-weight:700;
        cursor:pointer;
      "
    >
      Recognize
    </button>

    <div
      id="anneMicScore"
      style="
        margin-top:7px;
        text-align:center;
        font-weight:700;
        color:#555;
      "
    >
      Ready
    </div>
  `;

  document.body.appendChild(
    panel
  );

  var range =
    document.getElementById(
      'anneMicThreshold'
    );

  if (range) {

    range.oninput =
      function() {

        var value =
          Number(
            this.value
          );

        window.__micThreshold =
          value;

        localStorage.setItem(
          'gongboo.anne.micThreshold',
          String(value)
        );

        var label =
          document.getElementById(
            'anneMicThresholdLabel'
          );

        if (label) {
          label.textContent =
            value + '%';
        }

        if (
          typeof saveLastSettings ===
          'function'
        ) {
          saveLastSettings();
        }
      };
  }


  var delaySelect =
    document.getElementById(
      'anneMicRecognizeDelay'
    );

  if (delaySelect) {

    delaySelect.value =
      String(
        window.__micRecognizeDelay
      );

    delaySelect.onchange =
      function() {

        window.__micRecognizeDelay =
          Number(this.value) || 2;

        localStorage.setItem(
          'gongboo.anne.micRecognizeDelay',
          String(
            window.__micRecognizeDelay
          )
        );
      };
  }


  var modeBtn =
    document.getElementById(
      'anneMicAdvanceMode'
    );

  function refreshModeButton() {

    if (!modeBtn) {
      return;
    }

    modeBtn.textContent =
      window.__micAutoAdvance
        ? 'AUTO'
        : 'MANUAL';

    modeBtn.style.background =
      window.__micAutoAdvance
        ? '#dbeafe'
        : '#f3f4f6';
  }

  if (modeBtn) {

    modeBtn.onclick =
      function() {

        window.__micAutoAdvance =
          !window.__micAutoAdvance;

        localStorage.setItem(
          'gongboo.anne.micAutoAdvance',
          String(
            window.__micAutoAdvance
          )
        );

        refreshModeButton();
      };

    refreshModeButton();
  }


  var recognizeBtn =
    document.getElementById(
      'anneMicRecognize'
    );

  if (recognizeBtn) {

    recognizeBtn.onclick =
      function() {

        finalizeAnneMicRecognition(
          true
        );
      };
  }

  return panel;
}


// SUBBLOCK 1108
// ============================================================
// MIC 설정창 위치
// ============================================================

function positionAnneMicPanel() {

  var btn =
    document.getElementById(
      'anneMicButton'
    );


  var panel =
    ensureAnneMicPanel();


  if (
    !btn ||
    !panel
  ) {
    return;
  }


  var rect =
    btn.getBoundingClientRect();


  panel.style.left =
    Math.max(
      8,
      rect.left +
      window.scrollX -
      145
    ) + 'px';


  panel.style.top =
    (
      rect.bottom +
      window.scrollY +
      7
    ) + 'px';
}


// SUBBLOCK 1109
// ============================================================
// MIC 결과 표시
// ============================================================

// ============================================================
// MIC 맞은 단어 Highlight
// ============================================================

function highlightAnneMicWords(
  sentence,
  spokenText
) {

  if (!sentence) {
    return;
  }

  var targetText =
    normalizeAnneMicText(
      sentence.text,
      sentence.code
    );

  var visibleLines =
    Array.from(
      document.querySelectorAll(
        '.anne-full-diary ' +
        '.language-line[data-language="' +
        sentence.code +
        '"]'
      )
    );

  var sentenceEl =
    visibleLines.find(
      function(el) {

        var rect =
          el.getBoundingClientRect();

        if (
          rect.width <= 0 ||
          rect.height <= 0
        ) {
          return false;
        }

        var lineText =
          normalizeAnneMicText(
            el.textContent,
            sentence.code
          );

        return (
          lineText ===
          targetText
        );
      }
    );

  if (!sentenceEl) {
    sentenceEl =
      sentence.element;
  }

  if (!sentenceEl) {
    return;
  }

  var original =
    String(
      sentenceEl.textContent || ''
    );

  var spoken =
    String(
      spokenText || ''
    );

  var originalWords =
    original.match(/\S+/g) || [];

  var spokenWords =
    spoken.match(/\S+/g) || [];

  var normalizedSpoken =
    spokenWords.map(
      function(word) {

        return normalizeAnneMicText(
          word,
          sentence.code
        );
      }
    );

  var used =
    new Array(
      normalizedSpoken.length
    ).fill(false);

  sentenceEl.innerHTML = '';

  originalWords.forEach(
    function(word, index) {

      var normalizedWord =
        normalizeAnneMicText(
          word,
          sentence.code
        );

      var matchedIndex = -1;

      for (
        var i = 0;
        i < normalizedSpoken.length;
        i++
      ) {

        if (
          !used[i] &&
          normalizedWord &&
          normalizedWord ===
            normalizedSpoken[i]
        ) {

          matchedIndex = i;
          break;
        }
      }

      var span =
        document.createElement(
          'span'
        );

      span.textContent =
        word;

      if (
        matchedIndex >= 0
      ) {

        used[matchedIndex] =
          true;

        span.style.background =
          '#fde047';

        span.style.borderRadius =
          '3px';

        span.style.padding =
          '0 2px';
      }

      sentenceEl.appendChild(
        span
      );

      if (
        index <
        originalWords.length - 1
      ) {

        sentenceEl.appendChild(
          document.createTextNode(' ')
        );
      }
    }
  );
}


// ============================================================
// 현재까지 들은 발화 판정
// manualButton = true 이면 Recognize 버튼으로 강제 판정
// ============================================================

function finalizeAnneMicRecognition(
  manualButton
) {

  if (_anneMicRecognizeTimer) {

    clearTimeout(
      _anneMicRecognizeTimer
    );

    _anneMicRecognizeTimer =
      null;
  }

  var recognition =
    ANNE_STATE.recognition;

  if (!recognition) {
    return;
  }

  var scoreEl =
    document.getElementById(
      'anneMicScore'
    );

  if (scoreEl) {

    scoreEl.textContent =
      manualButton
        ? 'Recognizing...'
        : 'Checking...';

    scoreEl.style.color =
      '#2563eb';
  }

  try {

    recognition.stop();

  } catch (e) {

    console.warn(
      '[MIC] finalize stop failed:',
      e
    );
  }
}

function showAnneMicScore(
  score,
  passed
) {

  var scoreEl =
    document.getElementById(
      'anneMicScore'
    );


  if (!scoreEl) {
    return;
  }


  scoreEl.textContent =
    score +
    '% ' +
    (
      passed
        ? '✓ PASS'
        : '↻ AGAIN'
    );


  scoreEl.style.color =
    passed
      ? '#15803d'
      : '#b45309';
}


// SUBBLOCK 1110
// ============================================================
// 현재 Recognition 완전 중지
// ============================================================

function stopAnneRecognition() {

  if (_anneMicRestartTimer) {

    clearTimeout(
      _anneMicRestartTimer
    );

    _anneMicRestartTimer =
      null;
  }


  if (
    ANNE_STATE.recognition
  ) {

    try {

      ANNE_STATE.recognition.onend =
        null;


      ANNE_STATE.recognition.abort();

    } catch (e) {}


    ANNE_STATE.recognition =
      null;
  }
}


// SUBBLOCK 1111
// ============================================================
// Recognition 생성 및 시작
// ============================================================

function startAnneRecognition() {

  if (
    !SpeechRecognition
  ) {

    alert(
      'Chrome 또는 Edge 브라우저에서 마이크 기능을 사용해 주세요.'
    );

    return;
  }

  if (
    !ANNE_STATE.micMode
  ) {
    return;
  }

  stopAnneRecognition();

  var sentence =
    getCurrentMicSentence();

  if (!sentence) {

    console.warn(
      '[MIC] 읽을 문장 없음'
    );

    return;
  }

  var recognition =
    new SpeechRecognition();

  ANNE_STATE.recognition =
    recognition;

  _anneMicCurrentRecognition =
    recognition;

  _anneMicLastTranscript =
    '';

  recognition.lang =
    sentence.recognition;

  recognition.continuous =
    true;

  recognition.interimResults =
    true;

  recognition.maxAlternatives =
    3;

  console.log(
    '[MIC] 언어:',
    sentence.code,
    recognition.lang
  );


  recognition.onresult =
    function(event) {

      if (
        !ANNE_STATE.micMode
      ) {
        return;
      }

      var transcript = '';

      for (
        var i = 0;
        i < event.results.length;
        i++
      ) {

        if (
          event.results[i] &&
          event.results[i][0]
        ) {

          transcript +=
            event.results[i][0]
              .transcript +
            ' ';
        }
      }

      transcript =
        transcript.trim();

      if (!transcript) {
        return;
      }

      _anneMicLastTranscript =
        transcript;


      // 말이 새로 들어올 때마다
      // Recognize Delay 다시 시작
      if (_anneMicRecognizeTimer) {

        clearTimeout(
          _anneMicRecognizeTimer
        );
      }

      var delay =
        Math.max(
          0.5,
          Number(
            window.__micRecognizeDelay
          ) || 2
        );

      _anneMicRecognizeTimer =
        setTimeout(
          function() {

            if (
              ANNE_STATE.micMode &&
              ANNE_STATE.recognition ===
                recognition
            ) {

              finalizeAnneMicRecognition(
                false
              );
            }

          },
          delay * 1000
        );


      var scoreEl =
        document.getElementById(
          'anneMicScore'
        );

      if (scoreEl) {

        scoreEl.textContent =
          'Listening...';

        scoreEl.style.color =
          '#2563eb';
      }
    };


  recognition.onerror =
    function(event) {

      console.warn(
        '[MIC] recognition error:',
        event.error
      );

      if (
        event.error ===
        'not-allowed'
      ) {

        alert(
          '브라우저에서 마이크 사용 권한을 허용해 주세요.'
        );

        turnAnneMicOff();
      }
    };


  recognition.onend =
    function() {

      if (_anneMicRecognizeTimer) {

        clearTimeout(
          _anneMicRecognizeTimer
        );

        _anneMicRecognizeTimer =
          null;
      }


      if (
        !ANNE_STATE.micMode ||
        _anneMicMoving
      ) {

        return;
      }


      var spokenText =
        String(
          _anneMicLastTranscript || ''
        ).trim();


      if (!spokenText) {

        _anneMicRestartTimer =
          setTimeout(
            function() {

              if (
                ANNE_STATE.micMode &&
                !_anneMicMoving
              ) {

                startAnneRecognition();
              }

            },
            350
          );

        return;
      }


      var score =
        calculateAnneMicScore(
          sentence.text,
          spokenText,
          sentence.code
        );


      var threshold =
        Number(
          window.__micThreshold
        ) || 70;


      var passed =
        score >=
        threshold;


      console.log(
        '[MIC] 원문:',
        sentence.text
      );

      console.log(
        '[MIC] 인식:',
        spokenText
      );

      console.log(
        '[MIC] 점수:',
        score +
        '% / 기준 ' +
        threshold +
        '%'
      );


      showAnneMicScore(
        score,
        passed
      );


      highlightAnneMicWords(
        sentence,
        spokenText
      );


      if (passed) {

        if (
          typeof playPassSound ===
          'function'
        ) {

          playPassSound();
        }


        // AUTO일 때만 다음 문장
        if (
  window.__micAutoAdvance
) {

  // --------------------------------------------------------
  // PASSAGE에서는 다음 문장으로 이동
  // --------------------------------------------------------

  if (
    sentence.passageMode &&
    sentence.passageIndex <
      sentence.passageCount - 1
  ) {

    _anneMicMoving = true;

    _anneMicPassageIndex++;

    setTimeout(
      function() {

        _anneMicMoving = false;

        if (
          ANNE_STATE.micMode
        ) {

          startAnneRecognition();
        }

      },
      650
    );

    return;
  }


  // --------------------------------------------------------
  // 단문은 기존처럼 다음 문제로 이동
  // --------------------------------------------------------

  _anneMicMoving =
    true;


  var currentDate =
    ANNE_STATE._currentDate;


  var dayQuestions =
    ANNE_STATE.questions.filter(
      function(q) {

        return (
          q.date ===
          currentDate
        );

      }
    );


  var dayIndex =
    ANNE_STATE.index -
    ANNE_STATE._currentDayStart;


  if (
    dayIndex <
    dayQuestions.length - 1
  ) {

    setTimeout(
      function() {

        if (
          !ANNE_STATE.micMode
        ) {

          _anneMicMoving =
            false;

          return;
        }

        go(1);

        setTimeout(
          function() {

            _anneMicMoving =
              false;

            if (
              ANNE_STATE.micMode
            ) {

              startAnneRecognition();
            }

          },
          450
        );

      },
      650
    );

    return;
  }

  _anneMicMoving =
    false;
}

      } else {

        if (
          typeof playFailSound ===
          'function'
        ) {

          playFailSound();
        }
      }


      // MANUAL 또는 FAIL:
      // 같은 문장을 다시 듣기 시작
      _anneMicRestartTimer =
        setTimeout(
          function() {

            if (
              ANNE_STATE.micMode &&
              !_anneMicMoving
            ) {

              startAnneRecognition();
            }

          },
          500
        );
    };


 try {

  recognition.start();

} catch (e) {

    console.warn(
      '[MIC] 시작 실패:',
      e
    );
  }
}


// SUBBLOCK 1112
// ============================================================
// MIC ON
// ============================================================

function turnAnneMicOn() {

  var btn =
    document.getElementById(
      'anneMicButton'
    );


  if (!btn) {
    return;
  }


  // 컴퓨터 TTS 중지
  if (
    typeof stopSpeech ===
    'function'
  ) {

    stopSpeech();

  }


  ANNE_STATE.micMode =
    true;
  _anneMicPassageIndex = 0;


  btn.classList.add(
    'active'
  );


  btn.setAttribute(
    'aria-pressed',
    'true'
  );


  btn.style.filter =
    'brightness(0.75)';


  btn.style.fontWeight =
    '700';


  var panel =
    ensureAnneMicPanel();


  positionAnneMicPanel();


  panel.style.display =
    'block';


  if (
    typeof playMicOnSound ===
    'function'
  ) {

    playMicOnSound();

  }


  startAnneRecognition();
}


// SUBBLOCK 1113
// ============================================================
// MIC OFF
// ============================================================

function turnAnneMicOff() {

  ANNE_STATE.micMode =
    false;


  _anneMicMoving =
    false;


  stopAnneRecognition();


  var btn =
    document.getElementById(
      'anneMicButton'
    );


  if (btn) {

    btn.classList.remove(
      'active'
    );


    btn.setAttribute(
      'aria-pressed',
      'false'
    );


    btn.style.filter =
      '';


    btn.style.fontWeight =
      '';

  }


  var panel =
    document.getElementById(
      'anneMicPanel'
    );


  if (panel) {

    panel.style.display =
      'none';

  }


  if (
    typeof playMicOffSound ===
    'function'
  ) {

    playMicOffSound();

  }
}


// SUBBLOCK 1114
// ============================================================
// MIC 버튼 설치
//
// licenseSpeech가 버튼을 나중에 생성하므로
// 버튼이 나타날 때 자동으로 바인딩
// ============================================================

function installAnneMicButton() {

  var btn =
    document.getElementById(
      'anneMicButton'
    );


  if (!btn) {
    return false;
  }


  if (
    btn.dataset.micBound ===
    '1'
  ) {

    return true;
  }


  btn.dataset.micBound =
    '1';


  btn.setAttribute(
    'aria-pressed',
    'false'
  );


  btn.onclick =
    function() {

      if (
        ANNE_STATE.micMode
      ) {

        turnAnneMicOff();

      } else {

        turnAnneMicOn();

      }

    };


  _anneMicInstalled =
    true;


  console.log(
    '[MIC] ✅ 마이크 버튼 설치 완료'
  );


  return true;
}


// SUBBLOCK 1115
// ============================================================
// MIC 버튼 생성 감시
// ============================================================

(function watchAnneMicButton() {

  if (
    installAnneMicButton()
  ) {
    return;
  }


  var observer =
    new MutationObserver(
      function() {

        if (
          installAnneMicButton()
        ) {

          observer.disconnect();

        }

      }
    );


  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );


  setTimeout(
    function() {

      if (
        _anneMicInstalled
      ) {

        observer.disconnect();

      }

    },
    10000
  );

})();


// ============================================================
// BLOCK 1200: anne-init.js
// ============================================================
// ============================================================

// SUBBLOCK 1201
function playPassSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc1 = ctx.createOscillator();
  var gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 880;
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);
  var osc2 = ctx.createOscillator();
  var gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 660;
  gain2.gain.setValueAtTime(0.001, now + 0.25);
  gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.27);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.25);
  osc2.stop(now + 0.6);
}

// SUBBLOCK 1202
function playFailSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 220;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

// SUBBLOCK 1203
function playMicOnSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

// SUBBLOCK 1204
function playMicOffSound() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = new AudioCtx();
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

var _initDone = false;

// SUBBLOCK 1205
function initApp() {
  if (_initDone) return;
  _initDone = true;
  setupHome();
}

document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState !== 'loading') { initApp(); }

window.ANNE_INIT = function() {
  if (typeof setupHome === 'function') { initApp(); }
};


// ============================================================
// BLOCK 1300: anne-speech.js
// ============================================================
// ============================================================

// SUBBLOCK 1301
function setPlaybackEnabled(enabled) {
  var ids = [
    'licensePlay',
    'licenseReplay',
    'licenseStop',
    'licenseSpeed',
    'licenseAuto',
    'anneMicButton'
  ];

  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.disabled = !enabled;
    }
  });
}

window.setPlaybackEnabled = setPlaybackEnabled;

// SUBBLOCK 1302
var _speechInstalled = false;
var _voiceListLoaded = false;
var _isSpeaking = false;
var _speechTimeout = null;
var _currentUtterance = null;
var _utteranceRefs = [];
var _speechRunId = 0;

// SUBBLOCK 1303
function getAnneState() {
  if (typeof ANNE_STATE === 'undefined') {
    console.warn('[TTS] ANNE_STATE 없음');
    return null;
  }
  return ANNE_STATE;
}

// SUBBLOCK 1304
function mapLanguageCode(code) {
  code = String(code || '').toUpperCase();
  var map = {
    ENG: 'en-US',
    KOR: 'ko-KR',
    JPN: 'ja-JP'
  };
  return map[code] || 'en-US';
}

// SUBBLOCK 1305
function ensureVoicesLoaded(callback) {
  if (!('speechSynthesis' in window)) {
    console.warn('[TTS] speechSynthesis 미지원');
    if (callback) callback();
    return;
  }
  var voices = window.speechSynthesis.getVoices();
  if (voices && voices.length) {
    _voiceListLoaded = true;
    if (callback) {
      callback();
    }
    return;
  }
  var finished = false;
  function done() {
    if (finished) return;
    finished = true;
    window.speechSynthesis.removeEventListener(
      'voiceschanged',
      voiceHandler
    );
    _voiceListLoaded = true;
    if (callback) {
      callback();
    }
  }
  function voiceHandler() {
    var list = window.speechSynthesis.getVoices();
    if (list && list.length) {
      done();
    }
  }
  window.speechSynthesis.addEventListener(
    'voiceschanged',
    voiceHandler
  );
  try {
    window.speechSynthesis.getVoices();
  } catch (e) {}
  setTimeout(done, 1500);
}

// SUBBLOCK 1306
function findVoiceForLanguage(lang) {
  try {
    var voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) {
      return null;
    }
    var normalized =
      String(lang || '')
        .replace('_', '-')
        .toLowerCase();
    var prefix =
      normalized.slice(0, 2);
    var exact = voices.find(function(v) {
      return String(v.lang || '')
        .replace('_', '-')
        .toLowerCase() === normalized;
    });
    if (exact) {
      return exact;
    }
    var sameLanguage = voices.find(function(v) {
      return String(v.lang || '')
        .toLowerCase()
        .startsWith(prefix);
    });
    if (sameLanguage) {
      return sameLanguage;
    }
    return null;
  } catch (e) {
    console.warn('[TTS] Voice 검색 실패:', e);
    return null;
  }
}

// SUBBLOCK 1307
function isSpeechElementVisible(el) {
  if (!el) return false;
  var node = el;
  while (node && node !== document.body) {
    var style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden'
    ) {
      return false;
    }
    node = node.parentElement;
  }
  return true;
}

// SUBBLOCK 1308
function collectVisibleSpeechItems() {

  var root =
    document.getElementById('questionContainer');

  if (!root) {
    console.warn('[TTS] questionContainer 없음');
    return [];
  }

  var state =
    getAnneState();

  var currentMode =
    state ? state.mode : 'study';

  var correctAnswer =
    null;

  if (state) {

    var currentDate =
      state._currentDate;

    var dayQuestions =
      state.questions.filter(function(q) {
        return q.date === currentDate;
      });

    var dayIndex =
      state.index -
      (state._currentDayStart || 0);

    var currentQuestion =
      dayQuestions[dayIndex];

    if (currentQuestion) {
      correctAnswer =
        Number(currentQuestion.answer);
    }
  }

  var elements =
    Array.from(
      root.querySelectorAll(
        '.language-line[data-language]'
      )
    );

  var items = [];

  elements.forEach(function(el) {

    // 화면에 안 보이는 것은 제외
    if (!isSpeechElementVisible(el)) {
      return;
    }

    // 모든 모드 공통:
    // 해설은 읽지 않음
    if (
      el.closest('#licenseFeedback') ||
      el.closest('.explanation')
    ) {
      return;
    }

    // LRN 모드:
    // 선택지는 정답만 읽음
    var choice =
      el.closest('.choice');

    if (
      currentMode === 'learn' &&
      choice
    ) {

      var answerNumber =
        Number(
          choice.getAttribute('data-answer')
        );

      if (
        answerNumber !== correctAnswer
      ) {
        return;
      }
    }

    var text =
      String(el.textContent || '');

    if (!text.trim()) {
      return;
    }

    var langCode =
      String(
        el.dataset.language || 'ENG'
      ).toUpperCase();

    if (
      langCode !== 'ENG' &&
      langCode !== 'KOR' &&
      langCode !== 'JPN'
    ) {
      langCode = 'ENG';
    }

    items.push({
      text: text,
      langCode: langCode,
      lang: mapLanguageCode(langCode),
      container: el
    });

  });

  console.log(
    '[TTS] 화면 읽기 목록:',
    items.map(function(x) {
      return x.langCode;
    }).join(' → ')
  );

  return items;
}

// SUBBLOCK 1309
function createHighlightSpans(
  container,
  text,
  langCode
) {
  if (!container || !text) {
    return null;
  }
  var fragment =
    document.createDocumentFragment();
  var tokens = [];
  function addToken(
    value,
    start,
    end
  ) {
    var span =
      document.createElement('span');
    span.className =
      'hl-word-span';
    span.dataset.start =
      String(start);
    span.dataset.end =
      String(end);
    span.textContent =
      value;
    span.style.display =
      'inline';
    span.style.padding =
      '1px 1px';
    span.style.borderRadius =
      '3px';
    span.style.transition =
      'background-color 0.08s ease';
    fragment.appendChild(span);
    tokens.push({
      span: span,
      start: start,
      end: end
    });
  }
  if (
    String(langCode).toUpperCase()
    === 'JPN'
  ) {
    var cursor = 0;
    Array.from(text).forEach(
      function(ch) {
        var start =
          cursor;
        cursor +=
          ch.length;
        if (/\s/.test(ch)) {
          fragment.appendChild(
            document.createTextNode(ch)
          );
        } else {
          addToken(
            ch,
            start,
            cursor
          );
        }
      }
    );
  } else {
    var regex =
      /\s+|[^\s]+/g;
    var match;
    while (
      (match = regex.exec(text))
      !== null
    ) {
      var part =
        match[0];
      var start =
        match.index;
      var end =
        start + part.length;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(
          document.createTextNode(part)
        );
      } else {
        addToken(
          part,
          start,
          end
        );
      }
    }
  }
  container.replaceChildren(
    fragment
  );
  return {
    container: container,
    text: text,
    tokens: tokens
  };
}

// SUBBLOCK 1310
function clearSpeechHighlight(data) {
  if (
    !data ||
    !data.tokens
  ) {
    return;
  }
  data.tokens.forEach(
    function(token) {
      token.span.style.backgroundColor =
        'transparent';
      token.span.style.color =
        'inherit';
      token.span.style.boxShadow =
        'none';
    }
  );
}

// SUBBLOCK 1311
function highlightSpeechAtChar(
  data,
  charIndex
) {
  if (
    !data ||
    !data.tokens ||
    !data.tokens.length
  ) {
    return;
  }
  var index =
    Number(charIndex);
  if (
    !Number.isFinite(index) ||
    index < 0
  ) {
    index = 0;
  }
  var active =
    null;
  for (
    var i = 0;
    i < data.tokens.length;
    i++
  ) {
    var token =
      data.tokens[i];
    if (
      index >= token.start &&
      index < token.end
    ) {
      active = token;
      break;
    }
    if (
      index < token.start
    ) {
      active = token;
      break;
    }
  }
  if (!active) {
    active =
      data.tokens[
        data.tokens.length - 1
      ];
  }
  data.tokens.forEach(
    function(token) {
      var on =
        token === active;
      token.span.style.backgroundColor =
        on
          ? '#fef08a'
          : 'transparent';
      token.span.style.color =
        on
          ? '#111827'
          : 'inherit';
      token.span.style.boxShadow =
        on
          ? 'inset 0 -3px 0 #facc15'
          : 'none';
    }
  );
}

// SUBBLOCK 1312
function stopSpeech() {
  _speechRunId++;
  if (_speechTimeout) {
    clearTimeout(
      _speechTimeout
    );
    _speechTimeout =
      null;
  }
  _isSpeaking =
    false;
  _currentUtterance =
    null;
  _utteranceRefs =
    [];
  var state =
    getAnneState();
  if (state) {
    state._utterance =
      null;
  }
  if (
    'speechSynthesis' in window
  ) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  document
    .querySelectorAll(
      '.hl-word-span'
    )
    .forEach(
      function(span) {
        span.style.backgroundColor =
          'transparent';
        span.style.color =
          'inherit';
        span.style.boxShadow =
          'none';
      }
    );
}

window.stopSpeech =
  stopSpeech;

// SUBBLOCK 1313
function speakWithDyslexiaSupport() {
  console.log(
    '[TTS] PLAY'
  );
  stopSpeech();
  if (
    !('speechSynthesis' in window)
  ) {
    alert(
      '이 브라우저는 음성 읽기를 지원하지 않습니다.'
    );
    return;
  }
  var items =
    collectVisibleSpeechItems();
  if (!items.length) {
    console.warn(
      '[TTS] 화면에 읽을 문장이 없음'
    );
    return;
  }
  var runId =
    ++_speechRunId;
  ensureVoicesLoaded(
    function() {
      if (
        runId !== _speechRunId
      ) {
        return;
      }
      readTextsWithHighlight(
        items,
        0,
        runId
      );
    }
  );
}

window.speakWithDyslexiaSupport =
  speakWithDyslexiaSupport;

// SUBBLOCK 1314
function readTextsWithHighlight(
  items,
  index,
  runId
) {
  if (
    runId !== _speechRunId
  ) {
    return;
  }
  if (
    index >= items.length
  ) {
    console.log(
      '[TTS] 전체 화면 읽기 완료'
    );
    _isSpeaking = false;
    _currentUtterance = null;
    if (
      window.__licenseSpeechState
    ) {
      window.__licenseSpeechState(
        'licenseStop'
      );
    }
    var finishedState =
      getAnneState();
    if (
      finishedState &&
      finishedState.auto &&
      !finishedState.micMode
    ) {
      setTimeout(
        function() {
          if (
            runId !== _speechRunId
          ) {
            return;
          }
          if (
            typeof go === 'function'
          ) {
            go(1);
          }
        },
        500
      );
    }
    return;
  }
  var item =
    items[index];
  var displayText =
    String(
      item.text || ''
    );
  if (
    !displayText.trim()
  ) {
    readTextsWithHighlight(
      items,
      index + 1,
      runId
    );
    return;
  }
  var textToSpeak =
    displayText;
  if (
    item.langCode === 'JPN'
  ) {
    textToSpeak =
      displayText.replace(
        /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]+[\(（]([ぁ-ゖァ-ヺー]+)[\)）]/g,
        '$1'
      );
  }
  console.log(
    '[TTS]',
    item.langCode,
    '화면:',
    displayText
  );
  console.log(
    '[TTS]',
    item.langCode,
    '읽기:',
    textToSpeak
  );
  var highlightData =
    null;
  if (
    item.langCode === 'JPN' &&
    item.container &&
    item.container.isConnected
  ) {
    var container =
      item.container;
    var fragment =
      document.createDocumentFragment();
    var tokens =
      [];
    var spokenCursor =
      0;
    var furiganaRegex =
      /([\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]+)[\(（]([ぁ-ゖァ-ヺー]+)[\)）]/g;
    var lastIndex =
      0;
    var match;
    function addJapaneseToken(
      visibleText,
      spokenText
    ) {
      if (!visibleText) {
        return;
      }
      var span =
        document.createElement(
          'span'
        );
      span.className =
        'hl-word-span';
      span.textContent =
        visibleText;
      span.style.display =
        'inline';
      span.style.padding =
        '1px 1px';
      span.style.borderRadius =
        '3px';
      span.style.transition =
        'background-color 0.08s ease';
      var start =
        spokenCursor;
      var end =
        start +
        String(
          spokenText || ''
        ).length;
      span.dataset.start =
        String(start);
      span.dataset.end =
        String(end);
      fragment.appendChild(
        span
      );
      tokens.push({
        span: span,
        start: start,
        end: end
      });
      spokenCursor =
        end;
    }
    while (
      (
        match =
          furiganaRegex.exec(
            displayText
          )
      ) !== null
    ) {
      if (
        match.index >
        lastIndex
      ) {
        var before =
          displayText.slice(
            lastIndex,
            match.index
          );
        Array.from(
          before
        ).forEach(
          function(ch) {
            addJapaneseToken(
              ch,
              ch
            );
          }
        );
      }
      addJapaneseToken(
        match[0],
        match[2]
      );
      lastIndex =
        furiganaRegex.lastIndex;
    }
    if (
      lastIndex <
      displayText.length
    ) {
      var rest =
        displayText.slice(
          lastIndex
        );
      Array.from(
        rest
      ).forEach(
        function(ch) {
          addJapaneseToken(
            ch,
            ch
          );
        }
      );
    }
    container.replaceChildren(
      fragment
    );
    highlightData = {
      container: container,
      text: textToSpeak,
      tokens: tokens
    };
  } else if (
    item.container &&
    item.container.isConnected
  ) {
    highlightData =
      createHighlightSpans(
        item.container,
        displayText,
        item.langCode
      );
  }
  var utterance =
    new SpeechSynthesisUtterance(
      textToSpeak
    );
  _currentUtterance =
    utterance;
  _utteranceRefs.push(
    utterance
  );
  var state =
    getAnneState();
  if (state) {
    state._utterance =
      utterance;
  }
  utterance.lang =
    item.lang;
  var voice =
    findVoiceForLanguage(
      item.lang
    );
  if (voice) {
    utterance.voice =
      voice;
  }
  var speedSelect =
    document.getElementById(
      'licenseSpeed'
    );
  var rate =
    speedSelect
      ? parseFloat(
          speedSelect.value
        )
      : 1;
  if (
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    rate = 1;
  }
  utterance.rate =
    rate;
  var japaneseHighlightTimer =
    null;
  var speechStartedAt =
    0;
  var lastBoundaryTime =
    0;
  var japaneseEstimatedMs =
    Math.max(
      1500,
      (
        textToSpeak.length *
        160
      ) / rate
    );
  function stopJapaneseTimer() {
    if (
      japaneseHighlightTimer
    ) {
      clearInterval(
        japaneseHighlightTimer
      );
      japaneseHighlightTimer =
        null;
    }
  }
  function startJapaneseFallback() {
    if (
      item.langCode !== 'JPN'
    ) {
      return;
    }
    stopJapaneseTimer();
    japaneseHighlightTimer =
      setInterval(
        function() {
          if (
            runId !== _speechRunId
          ) {
            stopJapaneseTimer();
            return;
          }
          if (
            !_isSpeaking
          ) {
            stopJapaneseTimer();
            return;
          }
          var now =
            Date.now();
          if (
            lastBoundaryTime &&
            now - lastBoundaryTime < 700
          ) {
            return;
          }
          var elapsed =
            now -
            speechStartedAt;
          var ratio =
            elapsed /
            japaneseEstimatedMs;
          ratio =
            Math.max(
              0,
              Math.min(
                0.98,
                ratio
              )
            );
          var charIndex =
            Math.floor(
              textToSpeak.length *
              ratio
            );
          highlightSpeechAtChar(
            highlightData,
            charIndex
          );
        },
        120
      );
  }
  utterance.onstart =
    function() {
      if (
        runId !== _speechRunId
      ) {
        return;
      }
      _isSpeaking =
        true;
      speechStartedAt =
        Date.now();
      highlightSpeechAtChar(
        highlightData,
        0
      );
      startJapaneseFallback();
  };
  utterance.onboundary =
    function(event) {
      if (
        runId !== _speechRunId
      ) {
        return;
      }
      if (
        typeof event.charIndex
        !== 'number'
      ) {
        return;
      }
      lastBoundaryTime =
        Date.now();
      highlightSpeechAtChar(
        highlightData,
        event.charIndex
      );
  };
  utterance.onend =
    function() {
      if (
        runId !== _speechRunId
      ) {
        return;
      }
      stopJapaneseTimer();
      clearSpeechHighlight(
        highlightData
      );
      if (
        _speechTimeout
      ) {
        clearTimeout(
          _speechTimeout
        );
        _speechTimeout =
          null;
      }
      _isSpeaking =
        false;
      _currentUtterance =
        null;
      _utteranceRefs =
        _utteranceRefs.filter(
          function(u) {
            return u !== utterance;
          }
        );
      if (state) {
        state._utterance =
          null;
      }
      readTextsWithHighlight(
        items,
        index + 1,
        runId
      );
  };
  utterance.onerror =
    function(event) {
      if (
        runId !== _speechRunId
      ) {
        return;
      }
      stopJapaneseTimer();
      var error =
        event &&
        event.error
          ? event.error
          : 'unknown';
      clearSpeechHighlight(
        highlightData
      );
      if (
        _speechTimeout
      ) {
        clearTimeout(
          _speechTimeout
        );
        _speechTimeout =
          null;
      }
      _isSpeaking =
        false;
      _currentUtterance =
        null;
      if (state) {
        state._utterance =
          null;
      }
      if (
        error === 'canceled' ||
        error === 'interrupted'
      ) {
        return;
      }
      console.warn(
        '[TTS] 오류:',
        error
      );
      readTextsWithHighlight(
        items,
        index + 1,
        runId
      );
  };
  var estimatedSeconds;
  if (
    item.langCode === 'JPN' ||
    item.langCode === 'KOR'
  ) {
    estimatedSeconds =
      Math.max(
        20,
        textToSpeak.length /
          (4 * rate)
          + 15
      );
  } else {
    var wordCount =
      textToSpeak
        .trim()
        .split(/\s+/)
        .length;
    estimatedSeconds =
      Math.max(
        20,
        wordCount *
          0.8 /
          rate
          + 15
      );
  }
  estimatedSeconds =
    Math.min(
      estimatedSeconds,
      600
    );
  _speechTimeout =
    setTimeout(
      function() {
        if (
          runId !== _speechRunId
        ) {
          return;
        }
        if (
          _currentUtterance !==
          utterance
        ) {
          return;
        }
        stopJapaneseTimer();
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
        clearSpeechHighlight(
          highlightData
        );
        _isSpeaking =
          false;
        _currentUtterance =
          null;
        if (state) {
          state._utterance =
            null;
        }
        readTextsWithHighlight(
          items,
          index + 1,
          runId
        );
      },
      estimatedSeconds * 1000
    );
  try {
    _isSpeaking =
      true;
    window.speechSynthesis.speak(
      utterance
    );
  } catch (e) {
    stopJapaneseTimer();
    console.error(
      '[TTS] speak 실패:',
      e
    );
    clearSpeechHighlight(
      highlightData
    );
    if (
      _speechTimeout
    ) {
      clearTimeout(
        _speechTimeout
      );
      _speechTimeout =
        null;
    }
    _isSpeaking =
      false;
    _currentUtterance =
      null;
    readTextsWithHighlight(
      items,
      index + 1,
      runId
    );
  }
}

// SUBBLOCK 1315
function installSpeech() {
  if (_speechInstalled) {
    console.log(
      '[TTS] 이미 설치됨'
    );
    return;
  }
  _speechInstalled =
    true;
  if (
    'speechSynthesis' in window
  ) {
    try {
      window.speechSynthesis.getVoices();
    } catch (e) {}
    window.speechSynthesis
      .addEventListener(
        'voiceschanged',
        function() {
          var voices =
            window.speechSynthesis
              .getVoices();
          if (
            voices &&
            voices.length
          ) {
            _voiceListLoaded =
              true;
          }
        }
      );
  }
  var host =
    document.getElementById(
      'bibleHeaderActionRow'
    );
  if (!host) {
    console.warn(
      '[TTS] bibleHeaderActionRow 없음'
    );
    return;
  }
  if (
    host.querySelector(
      '.bible-speech-controls'
    )
  ) {
    return;
  }
  host.innerHTML = `
    <div class="bible-speech-controls">

      <button
        title="Play"
        aria-label="Play"
        aria-pressed="false"
        class="bible-speech-button bible-speech-play"
        id="licensePlay"
      >▶</button>

      <button
        title="Replay"
        aria-label="Replay"
        aria-pressed="false"
        class="bible-speech-button bible-speech-replay"
        id="licenseReplay"
      >↻</button>

      <button
        title="Stop"
        aria-label="Stop"
        aria-pressed="false"
        class="bible-speech-button bible-speech-stop"
        id="licenseStop"
      >
        <span class="bible-stop-icon">■</span>
      </button>

      <select
        title="Speed"
        aria-label="Speed"
        class="bible-speech-speed"
        id="licenseSpeed"
      >
        <option value="0.25">0.25×</option>
        <option value="0.5">0.5×</option>
        <option value="0.75">0.75×</option>
        <option value="1" selected>1.0×</option>
        <option value="1.25">1.25×</option>
        <option value="1.5">1.5×</option>
      </select>

      <button
        title="Auto next"
        aria-label="Auto next"
        class="bible-speech-button bible-speech-auto-next"
        id="licenseAuto"
        aria-pressed="false"
      >AUTO</button>

      <button
        title="Microphone"
        aria-label="Microphone"
        class="bible-speech-button"
        id="anneMicButton"
      >🎤</button>

    </div>
  `;
  var stateButton =
    function(active) {
      [
        'licensePlay',
        'licenseReplay',
        'licenseStop'
      ].forEach(
        function(id) {
          var btn =
            document.getElementById(id);
          if (!btn) {
            return;
          }
          var on =
            id === active;
          btn.classList.toggle(
            'active',
            on
          );
          btn.setAttribute(
            'aria-pressed',
            String(on)
          );
        }
      );
    };
  window.__licenseSpeechState =
    stateButton;
  document.getElementById(
    'licensePlay'
  ).onclick =
    function() {
      stateButton(
        'licensePlay'
      );
      speakWithDyslexiaSupport();
    };
  document.getElementById(
    'licenseReplay'
  ).onclick =
    function() {
      stateButton(
        'licenseReplay'
      );
      speakWithDyslexiaSupport();
    };
  document.getElementById(
    'licenseStop'
  ).onclick =
    function() {
      stopSpeech();
      stateButton(
        'licenseStop'
      );
    };
  var autoBtn =
    document.getElementById(
      'licenseAuto'
    );
  if (autoBtn) {
    autoBtn.onclick =
      function() {
        var state =
          getAnneState();
        if (!state) {
          return;
        }
        state.auto =
          !state.auto;
        autoBtn.classList.toggle(
          'active',
          state.auto
        );
        autoBtn.textContent =
          state.auto
            ? 'AUTO ON'
            : 'AUTO';
        autoBtn.setAttribute(
          'aria-pressed',
          String(state.auto)
        );
        if (
          typeof saveLastSettings
          === 'function'
        ) {
          saveLastSettings();
        }
      };
  }
  console.log(
    '[TTS] ✅ 설치 완료'
  );
}

// SUBBLOCK 1316
if (
  'speechSynthesis' in window
) {
  setTimeout(
    function() {
      try {
        window.speechSynthesis
          .getVoices();
      } catch (e) {}
    },
    100
  );
}
