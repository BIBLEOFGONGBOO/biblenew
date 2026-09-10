// ============================================================
// BLOCK: 앞두자리(도메인) + SUBBLOCK: 뒤두자리(기능) → 4자리 숫자로 검색 (예: 0100 = BLOCK01)
// ============================================================
// ============================================================
// ============================================================
//  BLOCK 0100: anne-core.js
// ============================================================
// ============================================================

import {
  VectorScene25D,
  sceneFromGraphicObjects
} from './graphics/map25d/vector-scene25d.js';

window.VectorScene25D = VectorScene25D;
window.sceneFromGraphicObjects = sceneFromGraphicObjects;


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
// Supabase Edge Function Bible Loader
// Anne UI compatible
// ============================================================


// SUBBLOCK 2005
// ============================================================
// Bible Loader State
// ============================================================

var BIBLE_CHAPTER_CATALOG =
  window.BIBLE_CHAPTER_CATALOG ||
  [];

var BIBLE_CATALOG_LOADING =
  null;


// SUBBLOCK 2010
// ============================================================
// Supabase Provider 확인
// ============================================================

function bibleProviderReady_() {

  return !!(
    window.BibleSupabaseProvider &&
    typeof window.BibleSupabaseProvider.request ===
      'function'
  );
}


// SUBBLOCK 2015
// ============================================================
// Supabase Provider 요청
// 실제 공개 Bible과 동일한 통신 경로
// ============================================================

async function bibleProviderRequest_(
  payload,
  signal
) {

  if (!bibleProviderReady_()) {

    throw new Error(
      'Bible Supabase Provider is not loaded.'
    );
  }


  var response =
    await window.BibleSupabaseProvider.request(
      payload || {},
      signal
    );


  if (!response) {

    throw new Error(
      'Bible Supabase Provider returned no response.'
    );
  }


  if (!response.ok) {

    var message =
      'Bible API HTTP ' +
      response.status;


    try {

      var errorData =
        await response.clone().json();


      if (
        errorData &&
        errorData.message
      ) {

        message =
          errorData.message;
      }

    } catch (e) {}


    throw new Error(
      message
    );
  }


  return response;
}


// SUBBLOCK 2020
// ============================================================
// Bible Chapter Catalog
//
// 실제 공개 Bible:
// action = catalog
// sheet  = bible
//
// OT + NT 전체 Chapter catalog를 한번에 받는다.
// ============================================================

async function loadBibleChapterCatalog_() {

  if (
    BIBLE_CHAPTER_CATALOG.length &&
    !BIBLE_CHAPTER_CATALOG[0].__instant
  ) {

    return BIBLE_CHAPTER_CATALOG;
  }


  if (BIBLE_CATALOG_LOADING) {

    return BIBLE_CATALOG_LOADING;
  }


  BIBLE_CATALOG_LOADING =
    (async function() {

      console.log(
        '[BIBLE] loading catalog'
      );


      var response =
        await bibleProviderRequest_({

          action:
            'catalog',

          sheet:
            'bible',

          _:
            String(
              Date.now()
            )
        });


      var data =
        await response.json();


      if (
        data &&
        (
          data.status === 'error' ||
          data.success === false
        )
      ) {

        throw new Error(
          data.message ||
          'Failed to load Bible catalog.'
        );
      }


      var seen =
        {};


      var catalog =
        (
          Array.isArray(
            data.catalog
          )
            ? data.catalog
            : []
        )

        .filter(
          function(chapter) {

            var code =
              String(
                chapter &&
                chapter.CODE ||
                ''
              );

            if (
              !code ||
              seen[code]
            ) {

              return false;
            }


            seen[code] =
              true;

            return true;
          }
        )

        .map(
          function(chapter) {

            var code =
              String(
                chapter.CODE ||
                ''
              ).toUpperCase();


            return Object.assign(
              {},
              chapter,
              {

                TESTAMENT:
                  code.indexOf(
                    'NT-'
                  ) === 0
                    ? 'NT'
                    : 'OT'
              }
            );
          }
        );


      if (!catalog.length) {

        throw new Error(
          'Bible catalog is empty.'
        );
      }


      BIBLE_CHAPTER_CATALOG =
        catalog;


      window.BIBLE_CHAPTER_CATALOG =
        BIBLE_CHAPTER_CATALOG;


      console.log(
        '[BIBLE] ✅ catalog loaded:',
        BIBLE_CHAPTER_CATALOG.length
      );


      return BIBLE_CHAPTER_CATALOG;

    })();


  try {

    return await BIBLE_CATALOG_LOADING;

  } finally {

    BIBLE_CATALOG_LOADING =
      null;
  }
}


// SUBBLOCK 2025
// ============================================================
// Catalog에서 특정 Book / Chapter 찾기
// ============================================================

function findBibleChapterCatalog_(
  testament,
  bookName,
  chapterNumber
) {

  var targetBook =
    String(
      bookName || ''
    )
    .trim()
    .toLowerCase();


  var targetChapter =
    parseInt(
      chapterNumber,
      10
    ) || 1;


  var targetTestament =
    String(
      testament || ''
    )
    .trim()
    .toUpperCase();


  return (
    BIBLE_CHAPTER_CATALOG.find(
      function(item) {

        var itemBook =
          String(
            item.BOOK_EN ||
            item.BOOK_KO ||
            ''
          )
          .trim()
          .toLowerCase();


        var itemChapter =
          parseInt(
            item.CHAPTER,
            10
          ) || 0;


        var itemTestament =
          String(
            item.TESTAMENT ||
            ''
          )
          .trim()
          .toUpperCase();


        return (
          itemBook ===
            targetBook &&
          itemChapter ===
            targetChapter &&
          (
            !targetTestament ||
            itemTestament ===
              targetTestament
          )
        );
      }
    ) ||
    null
  );
}


// SUBBLOCK 2030
// ============================================================
// Bible Testament → 실제 Supabase sheet
// ============================================================

function bibleSheetForTestament_(
  testament
) {

  return (
    String(
      testament || ''
    )
    .toUpperCase() === 'NT'
  )
    ? 'bible-nt'
    : 'bible-ot';
}


// SUBBLOCK 2035
// ============================================================
// Chapter 문제 Rows 요청
//
// 실제 Bible과 동일:
// start = START_ROW
// limit = QUESTION_COUNT
// sheet = bible-ot / bible-nt
// ============================================================

async function loadBibleChapterRows_(
  catalogItem
) {

  if (!catalogItem) {

    throw new Error(
      'Bible catalog item is missing.'
    );
  }


  var testament =
    String(
      catalogItem.TESTAMENT ||
      (
        String(
          catalogItem.CODE ||
          ''
        ).toUpperCase()
          .indexOf(
            'NT-'
          ) === 0
          ? 'NT'
          : 'OT'
      )
    ).toUpperCase();


  var start =
    Math.max(
      1,
      parseInt(
        catalogItem.START_ROW,
        10
      ) ||
      parseInt(
        catalogItem.START,
        10
      ) ||
      1
    );


  var limit =
    Math.max(
      1,
      parseInt(
        catalogItem.QUESTION_COUNT,
        10
      ) ||
      1
    );


  var sheet =
    bibleSheetForTestament_(
      testament
    );


  console.log(
    '[BIBLE] requesting questions:',
    {
      code:
        catalogItem.CODE,

      sheet:
        sheet,

      start:
        start,

      limit:
        limit
    }
  );


  var response =
    await bibleProviderRequest_({

      start:
        String(start),

      limit:
        String(limit),

      sheet:
        sheet,

      _:
        String(
          Date.now()
        )
    });


  var data =
    await response.json();


  if (
    data &&
    (
      data.status === 'error' ||
      data.success === false
    )
  ) {

    throw new Error(
      data.message ||
      'Failed to load Bible questions.'
    );
  }


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


  if (!rows.length) {

    throw new Error(
      'No Bible questions were returned.'
    );
  }


  console.log(
    '[BIBLE] rows received:',
    rows.length
  );


  return rows;
}


// SUBBLOCK 2040
// ============================================================
// 표준 Bible Schema 유틸리티
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


function buildBibleRowMap_(
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


function readBibleValue_(
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
    map &&
    Object.prototype
      .hasOwnProperty.call(
        map,
        normalized
      )
  ) {

    return map[
      normalized
    ];
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
    /\r\n/g,
    '\n'
  )
  .trim();
}


// SUBBLOCK 2045
// ============================================================
// Bible Row → Anne Question 구조
//
// Anne의 기존 render / TTS / MIC / AUTO를
// 그대로 사용하기 위한 변환층
// ============================================================

function convertBibleRowsToAnne_(
  rows,
  catalogItem
) {

  var chapterCode =
    String(
      catalogItem.CODE ||
      ''
    );


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
        buildBibleRowMap_(
          row
        );


      var sourceCode =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'SOURCE_CODE'
          ) ||
          readBibleValue_(
            row,
            map,
            'SUBJECT'
          ) ||
          chapterCode
        );


      var originalNumber =
        readBibleValue_(
          row,
          map,
          'N'
        ) ||
        index + 1;


      var qEn =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'Q_EN'
          )
        );


      var qKo =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'Q_KO'
          )
        );


      var pEn =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'P_EN'
          )
        );


      var pKo =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'P_KO'
          )
        );


      var pKjv =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'P_KJV'
          )
        );


      var pWeb =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'P_WEB'
          ) ||
          pEn
        );


      var pKoWeb =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'P_KO_WEB'
          ) ||
          pKo
        );


      var eEn =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'E_EN'
          )
        );


      var eKo =
        cleanBibleText_(
          readBibleValue_(
            row,
            map,
            'E_KO'
          )
        );


      var enOptions =
        {};


      var koOptions =
        {};


      for (
        var choiceIndex = 1;
        choiceIndex <= 4;
        choiceIndex++
      ) {

        enOptions[
          choiceIndex
        ] =
          cleanBibleText_(
            readBibleValue_(
              row,
              map,
              choiceIndex +
              '_EN'
            )
          );


        koOptions[
          choiceIndex
        ] =
          cleanBibleText_(
            readBibleValue_(
              row,
              map,
              choiceIndex +
              '_KO'
            )
          );
      }


      var rawAnswer =
        String(
          readBibleValue_(
            row,
            map,
            'A'
          ) ||
          '1'
        )
        .trim();


      var letterToNumber =
        {
          A: 1,
          B: 2,
          C: 3,
          D: 4
        };


      var answer =
        letterToNumber[
          rawAnswer.toUpperCase()
        ] ||
        parseInt(
          rawAnswer,
          10
        ) ||
        1;


      var translations =
        [];


      // English / Modern English
      translations.push({

        language_code:
          'en',

        passage:
          pWeb ||
          pEn,

        passage_kjv:
          pKjv,

        passage_web:
          pWeb ||
          pEn,

        question_text:
          qEn,

        option_1:
          enOptions[1],

        option_2:
          enOptions[2],

        option_3:
          enOptions[3],

        option_4:
          enOptions[4],

        explanation:
          eEn
      });


      // Korean
      if (
        qKo ||
        pKoWeb ||
        pKo ||
        koOptions[1] ||
        koOptions[2] ||
        koOptions[3] ||
        koOptions[4]
      ) {

        translations.push({

          language_code:
            'ko',

          passage:
            pKoWeb ||
            pKo,

          question_text:
            qKo,

          option_1:
            koOptions[1],

          option_2:
            koOptions[2],

          option_3:
            koOptions[3],

          option_4:
            koOptions[4],

          explanation:
            eKo
        });
      }


      questions.push({

        id:
          index + 1,

        N:
          originalNumber,

        originalNumber:
          originalNumber,

        category:
          'BIBLE',

        date:
          chapterCode,

        subject:
          sourceCode,

        sourceCode:
          sourceCode,

        contentId:
          sourceCode +
          '-' +
          originalNumber,

        recordId:
          sourceCode +
          '-' +
          originalNumber,

        answer:
          answer,

        A:
          rawAnswer,

        passageVersions: {

          KJV:
            pKjv,

          WEB:
            pWeb ||
            pEn,

          KO_WEB:
            pKoWeb ||
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
    '[BIBLE] converted for Anne:',
    questions.length
  );


  return questions;
}


// SUBBLOCK 2050
// ============================================================
// Anne Translation Helpers
// 기존 Anne renderer가 사용
// ============================================================

function trData(
  q
) {

  return Object.fromEntries(

    (
      q &&
      q.license_question_translations
        ? q.license_question_translations
        : []
    ).map(
      function(item) {

        return [
          item.language_code,
          item
        ];
      }
    )
  );
}


function languageRecord(
  translations,
  code
) {

  code =
    String(
      code || ''
    )
    .trim()
    .toUpperCase();


  if (
    code === 'KOR' ||
    code === 'KO' ||
    code === 'KO_WEB'
  ) {

    return translations.ko;
  }


  return translations.en;
}


// SUBBLOCK 2055
// ============================================================
// Bible Passage Version
// KJV / MODERN / KOR
// ============================================================

function biblePassageText_(
  translations,
  code
) {

  code =
    String(code || '')
      .trim()
      .toUpperCase();


  if (code === 'KJV') {

    return (
      translations.en &&
      translations.en.passage_kjv
    ) || '';
  }


  if (
    code === 'KOR' ||
    code === 'KO' ||
    code === 'KO_WEB'
  ) {

    return (
      translations.ko &&
      translations.ko.passage
    ) || '';
  }


  // MODERN / WEB / ENG
  return (
    translations.en &&
    (
      translations.en.passage_web ||
      translations.en.passage
    )
  ) || '';
}


// SUBBLOCK 2060
// ============================================================
// KJV / MODERN / KOR lines
// ============================================================

function linesData(
  translations,
  field
) {

  var primary =
    document.getElementById(
      'biblePrimaryTextSelector'
    );

  var secondary =
    document.getElementById(
      'bibleSecondaryTextSelector'
    );


  var values = [

    primary
      ? primary.value
      : 'MODERN',

    secondary
      ? secondary.value
      : 'NONE'
  ];


  var seen = {};


  return values

    .filter(function(code) {

      code =
        String(code || '')
          .trim()
          .toUpperCase();

      if (
        !code ||
        code === 'NONE' ||
        seen[code]
      ) {
        return false;
      }

      seen[code] = true;

      return true;
    })

    .map(function(code) {

      var upper =
        String(code || '')
          .toUpperCase();

      var text = '';


      if (field === 'passage') {

        text =
          biblePassageText_(
            translations,
            upper
          );

      } else {

        var languageCode =
          (
            upper === 'KOR' ||
            upper === 'KO' ||
            upper === 'KO_WEB'
          )
            ? 'KOR'
            : 'ENG';


        var record =
          languageRecord(
            translations,
            languageCode
          );


        text =
          record
            ? record[field] || ''
            : '';
      }


      return {

        code:
          (
            upper === 'KOR' ||
            upper === 'KO' ||
            upper === 'KO_WEB'
          )
            ? 'KOR'
            : upper === 'KJV'
              ? 'KJV'
              : 'MODERN',

        text:
          text
      };
    })

    .filter(function(item) {

      return !!String(
        item.text || ''
      ).trim();
    });
}


// SUBBLOCK 2065
// ============================================================
// Anne HTML Lines 호환
// ============================================================

function htmlLinesData(
  lines
) {

  return lines.map(
    function(item) {

      var langClass =
        item.code ===
          'KOR'
          ? 'ko'
          : 'en';


      return (
        '<div ' +
        'class="language-line language-line-' +
        langClass +
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
  ).join('');
}


// SUBBLOCK 2070
// ============================================================
// Chapter 선택 → 실제 로딩
// ============================================================

window.loadBibleChapter =
  async function(
    testament,
    bookName,
    chapterNumber
  ) {

    try {

      console.log(
        '[BIBLE] loading chapter:',
        testament,
        bookName,
        chapterNumber
      );


      // ------------------------------------------------------
      // 1. Exact catalog 준비
      // ------------------------------------------------------

      await loadBibleChapterCatalog_();


      // ------------------------------------------------------
      // 2. 해당 Chapter 찾기
      // ------------------------------------------------------

      var catalogItem =
        findBibleChapterCatalog_(
          testament,
          bookName,
          chapterNumber
        );


      if (!catalogItem) {

        throw new Error(
          'Bible chapter not found: ' +
          bookName +
          ' ' +
          chapterNumber
        );
      }


      console.log(
        '[BIBLE] chapter catalog:',
        catalogItem
      );


      // ------------------------------------------------------
      // 3. Chapter 문제 로딩
      // ------------------------------------------------------

      var rows =
        await loadBibleChapterRows_(
          catalogItem
        );


      // ------------------------------------------------------
      // 4. Anne 구조로 변환
      // ------------------------------------------------------

      var questions =
        convertBibleRowsToAnne_(
          rows,
          catalogItem
        );


      if (!questions.length) {

        throw new Error(
          'No valid Bible questions.'
        );
      }


      // ------------------------------------------------------
      // 5. Anne State에 주입
      // ------------------------------------------------------

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


      ANNE_STATE.baseOffset =
        Math.max(
          0,
          (
            parseInt(
              catalogItem.START_ROW,
              10
            ) ||
            1
          ) - 1
        );


      ANNE_STATE._currentDate =
        String(
          catalogItem.CODE ||
          ''
        );


      ANNE_STATE._currentDayStart = 0;


      ANNE_STATE._currentDayCount =
        questions.length;


      ANNE_STATE.annePassageVisible =
        true;


      ANNE_STATE.anneQuizVisible =
        true;


      // ------------------------------------------------------
      // 6. Bible 선택 상태
      // ------------------------------------------------------

      window.__bibleSelectedTestament =
        String(
          testament
        ).toUpperCase();


      window.__bibleSelectedBook =
        bookName;


      window.__bibleSelectedChapter =
        parseInt(
          chapterNumber,
          10
        ) || 1;


      // ------------------------------------------------------
      // 7. 저장
      // ------------------------------------------------------

      try {

        localStorage.setItem(
          'gongboo.biblenew.lastChapter',
          JSON.stringify({

            testament:
              window.__bibleSelectedTestament,

            book:
              bookName,

            chapter:
              window.__bibleSelectedChapter,

            code:
              catalogItem.CODE ||
              '',

            savedAt:
              Date.now()
          })
        );

      } catch (e) {}


      console.log(
        '[BIBLE] ✅ chapter loaded:',
        catalogItem.CODE,
        questions.length
      );


      // ------------------------------------------------------
      // 8. Anne Quiz 화면 진입
      // ------------------------------------------------------

      enterQuiz(
        0
      );


    } catch (error) {

      console.error(
        '[BIBLE] chapter load failed:',
        error
      );


      alert(
        error &&
        error.message
          ? error.message
          : 'Bible data load failed.'
      );
    }
  };


// SUBBLOCK 2075
// ============================================================
// 초기 Provider 상태 확인
// ============================================================

(function() {

  if (
    bibleProviderReady_()
  ) {

    console.log(
      '[BIBLE] ✅ Supabase Provider ready'
    );

  } else {

    console.warn(
      '[BIBLE] Supabase Provider not ready'
    );
  }

})();


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

requestAnimationFrame(function() {

  var currentSetTitle =
    document.getElementById(
      'currentSetTitle'
    );

  if (currentSetTitle) {
    currentSetTitle.textContent =
      'BIBLE';
  }

});


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

// ============================================================
// Initial UI Flash Guard Release
// setupHome이 실제로 끝난 뒤 화면 표시
// ============================================================

document.documentElement.classList.add(
  'app-ready'
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
// SUBBLOCK 0550
function enterQuiz(at) {
  var actualIndex = ANNE_STATE._currentDayStart || 0;
  ANNE_STATE.index = actualIndex + (at || 0);

  $('setupSection').style.display = 'none';
  $('quizMain').style.display = 'block';
  $('quizContent').style.display = 'block';

  var progress = document.querySelector('.progress-area');
  if (progress) progress.style.display = 'block';

  var tutor = $('satTutorPanel');
  if (tutor) tutor.classList.add('is-license-active');

  $('biblePassageToggle').disabled = false;
  $('bibleQuizToggle').disabled = false;

  ANNE_STATE.annePassageVisible = true;
  ANNE_STATE.anneQuizVisible = true;

  syncAnneToggleButtons();
  setPlaybackEnabled(true);
  render();
}

// SUBBLOCK 0555
// ============================================================
// Question Navigation
// Move exactly one QUESTION at a time
// ============================================================

function go(d) {

  var newIndex =
    ANNE_STATE.index + d;

  if (
    newIndex < 0 ||
    newIndex >=
      ANNE_STATE.questions.length
  ) {
    return;
  }

  ANNE_STATE.index =
    newIndex;

  syncAnneToggleButtons();

  render();
}

async function goBiblePassage_(direction) {

  await loadBibleChapterCatalog_();

  var currentCode =
    String(
      ANNE_STATE._currentDate ||
      ''
    );

  var currentIndex =
    BIBLE_CHAPTER_CATALOG.findIndex(
      function(item) {
        return String(
          item.CODE || ''
        ) === currentCode;
      }
    );

  if (currentIndex < 0) {
    return;
  }

  var nextIndex =
    currentIndex + direction;

  if (
    nextIndex < 0 ||
    nextIndex >=
      BIBLE_CHAPTER_CATALOG.length
  ) {
    return;
  }

  var next =
    BIBLE_CHAPTER_CATALOG[
      nextIndex
    ];

  await window.loadBibleChapter(
    String(next.CODE).startsWith('OT-')
      ? 'OT'
      : 'NT',

    next.BOOK_EN,

    Number(next.CHAPTER)
  );

  // ANNE PASSAGE MODE 상태 그대로 유지
  ANNE_STATE.annePassageVisible =
    false;

  ANNE_STATE.anneQuizVisible =
    true;

  ANNE_STATE.index =
    ANNE_STATE._currentDayStart;

  render();
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

    p.style.removeProperty(
      'filter'
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
// 같은 성경절(sourceCode)은 PASSAGE에서 1번만 표시
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

var seenPassageSources = {};

dayQuestions.forEach(function(qq) {

  var sourceCode =
    String(
      qq.sourceCode ||
      qq.SOURCE_CODE ||
      qq.subject ||
      qq.SUBJECT ||
      ''
    ).trim();

  if (
    sourceCode &&
    seenPassageSources[sourceCode]
  ) {
    return;
  }

  if (sourceCode) {
    seenPassageSources[sourceCode] = true;
  }

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

  // SUBBLOCK 0604-025
// ============================================================
// Bible Passage Links
// Places / Topics / Commentary
// ============================================================

function attachBiblePlacesButton_(q) {

  var sourceCode =
    String(
      q?.sourceCode ||
      q?.SOURCE_CODE ||
      q?.subject ||
      q?.SUBJECT ||
      ''
    ).trim();

  if (
    !/^(OT|NT)-/.test(
      sourceCode
    )
  ) {
    return;
  }


  var container =
    document.getElementById(
      'quizContent'
    );

  if (!container) {
    return;
  }


  var card =
    container.querySelector(
      '.question-card'
    );

  if (
    !card ||
    card.querySelector(
      '[data-bible-verse-places]'
    )
  ) {
    return;
  }


  // Places
  var button =
    document.createElement(
      'button'
    );

  button.type =
    'button';

  button.className =
    'bible-verse-places-button';

  button.setAttribute(
    'data-bible-verse-places',
    sourceCode
  );

  button.textContent =
    '📍 Places in this passage';

  button.addEventListener(
    'click',
    function() {

      if (
        typeof window.openBiblePlacesForSource ===
        'function'
      ) {

        window.openBiblePlacesForSource(
          sourceCode
        );
      }
    }
  );


  var number =
    card.querySelector(
      '.q-num'
    );

  if (number) {
    number.insertAdjacentElement(
      'afterend',
      button
    );
  } else {
    card.prepend(button);
  }


  // Topics
  var knowledgeButton =
    document.createElement(
      'button'
    );

  knowledgeButton.type =
    'button';

  knowledgeButton.className =
    'bible-verse-knowledge-button';

  knowledgeButton.setAttribute(
    'data-bible-verse-knowledge',
    sourceCode
  );

  knowledgeButton.textContent =
    'Topics in this passage';

  knowledgeButton.addEventListener(
    'click',
    function() {

      if (
        typeof window.openBibleKnowledgeForSource ===
        'function'
      ) {

        window.openBibleKnowledgeForSource(
          sourceCode
        );
      }
    }
  );

  button.insertAdjacentElement(
    'afterend',
    knowledgeButton
  );


  // Commentary
  var commentaryButton =
    document.createElement(
      'button'
    );

  commentaryButton.type =
    'button';

  commentaryButton.className =
    'bible-verse-knowledge-button';

  commentaryButton.setAttribute(
    'data-bible-verse-commentary',
    sourceCode
  );

  commentaryButton.textContent =
    'Commentary';

  commentaryButton.addEventListener(
    'click',
    function() {

      if (
        typeof window.openBibleCommentaryForSource ===
        'function'
      ) {

        window.openBibleCommentaryForSource(
          sourceCode
        );
      }
    }
  );

  knowledgeButton.insertAdjacentElement(
    'afterend',
    commentaryButton
  );
}

  // SUBBLOCK 0604-026
// ============================================================
// Bible Inline Entity Links
// English text → People / Places
// ============================================================

function bibleEscapeRegExp_(value) {
  return String(value || '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function attachBibleEnglishEntityLinks_(q) {

  var root =
    document.getElementById(
      'quizContent'
    );

  if (!root) {
    return;
  }


  var sourceCode =
    String(
      q?.sourceCode ||
      q?.SOURCE_CODE ||
      q?.subject ||
      q?.SUBJECT ||
      ''
    ).trim();


  if (
    !/^(OT|NT)-/.test(sourceCode) ||
    !root.querySelector(
      '.language-line-en'
    )
  ) {
    return;
  }


  Promise.all([
    biblePeopleLoadNameIndex_(),
    biblePeopleLoadContextLinks_()
  ])

  .then(function(results) {

    // render()가 이미 다음 문제로 이동했다면
    // 이전 비동기 결과를 적용하지 않는다.
    if (
      document.getElementById(
        'quizContent'
      ) !== root
    ) {
      return;
    }


    var people =
      results[0] || {};

    var context =
      results[1] || {};

    var names = {};

    var sourcePeople = {};


    (
      (
        context.source_to_entities &&
        context.source_to_entities[
          sourceCode
        ]
      ) ||
      []
    )
    .forEach(function(personId) {

      sourcePeople[
        String(personId)
      ] = true;

    });


    Object.keys(
      people
    )
    .forEach(function(personId) {

      var name =
        String(
          people[personId] &&
          people[personId].name ||
          ''
        )
        .replace(
          /\s*\([^)]*\)\s*$/,
          ''
        )
        .trim();


      var key =
        name.toLowerCase();


      if (
        !name ||
        name.length < 3 ||
        /^(god|lord|man|woman|king|son|father)$/i
          .test(name)
      ) {
        return;
      }


      var candidate = {
        name: key,
        kind: 'person',
        id: personId,
        inSource:
          !!sourcePeople[
            personId
          ]
      };


      if (
        names[key] ===
        undefined
      ) {

        names[key] =
          candidate;

      } else if (
        names[key] &&
        candidate.inSource !==
        names[key].inSource
      ) {

        if (
          candidate.inSource
        ) {
          names[key] =
            candidate;
        }

      } else {

        names[key] =
          null;
      }

    });


    var sourcePlaces =
      (
        context.source_to_places &&
        context.source_to_places[
          sourceCode
        ]
      ) ||
      [];


    sourcePlaces.forEach(
      function(placeId) {

        var place =
          context.geocoding_places &&
          context.geocoding_places[
            placeId
          ];


        if (
          place &&
          place.name
        ) {

          names[
            String(
              place.name
            ).toLowerCase()
          ] = {

            name:
              String(
                place.name
              ).toLowerCase(),

            kind:
              'place',

            nameToOpen:
              place.name
          };
        }

      }
    );


    var fullText =
      Array.from(
        root.querySelectorAll(
          '.language-line-en'
        )
      )
      .map(function(node) {

        return (
          node.textContent ||
          ''
        );

      })
      .join(' ')
      .toLowerCase();


    var candidates =
      Object.keys(names)

      .map(function(key) {
        return names[key];
      })

      .filter(Boolean)

      .filter(function(item) {

        return (
          fullText.indexOf(
            item.name
          ) >= 0
        );

      })

      .sort(function(a, b) {

        return (
          b.name.length -
          a.name.length
        );

      })

      .slice(
        0,
        24
      );


    if (
      !candidates.length
    ) {
      return;
    }


    var lookup = {};


    candidates.forEach(
      function(item) {

        lookup[
          item.name
        ] = item;

      }
    );


    var matcher =
      new RegExp(
        '\\b(' +
        Object.keys(
          lookup
        )
        .map(
          bibleEscapeRegExp_
        )
        .join('|') +
        ')\\b',
        'gi'
      );


    root
      .querySelectorAll(
        '.language-line-en'
      )
      .forEach(function(block) {

        var walker =
          document.createTreeWalker(
            block,
            NodeFilter.SHOW_TEXT
          );


        var textNodes = [];


        while (
          walker.nextNode()
        ) {

          textNodes.push(
            walker.currentNode
          );
        }


        textNodes.forEach(
          function(textNode) {

            if (
              !textNode.parentElement ||
              textNode.parentElement
                .closest(
                  'button,a'
                )
            ) {
              return;
            }


            var text =
              textNode.nodeValue;


            matcher.lastIndex =
              0;


            if (
              !matcher.test(
                text
              )
            ) {
              return;
            }


            matcher.lastIndex =
              0;


            var fragment =
              document
                .createDocumentFragment();


            var cursor =
              0;


            text.replace(
              matcher,
              function(
                match,
                name,
                offset
              ) {

                fragment.appendChild(
                  document.createTextNode(
                    text.slice(
                      cursor,
                      offset
                    )
                  )
                );


                var item =
                  lookup[
                    String(
                      name
                    ).toLowerCase()
                  ];


                if (!item) {
                  return match;
                }


                var button =
                  document.createElement(
                    'button'
                  );


                button.type =
                  'button';


                button.className =
                  'bible-inline-entity-link ' +
                  'bible-inline-' +
                  item.kind;


                button.textContent =
                  match;


                button.title =
                  item.kind ===
                  'person'
                    ? 'Open Bible People'
                    : 'Open Atlas';


                if (
                  item.kind ===
                  'person'
                ) {

                  button.dataset
                    .biblePersonId =
                    item.id;

                } else {

                  button.dataset
                    .biblePlaceName =
                    item.nameToOpen;
                }


                button.addEventListener(
                  'click',
                  function(event) {

                    event.preventDefault();
                    event.stopPropagation();


                    if (
                      item.kind ===
                      'person'
                    ) {

                      if (
                        typeof window
                          .openBiblePerson ===
                        'function'
                      ) {

                        window.openBiblePerson(
                          item.id
                        );
                      }

                    } else if (
                      typeof window
                        .openBibleContext ===
                      'function'
                    ) {

                      window.openBibleContext({
                        tab:
                          'places',

                        placeName:
                          item.nameToOpen
                      });
                    }

                  }
                );


                fragment.appendChild(
                  button
                );


                cursor =
                  offset +
                  match.length;


                return match;
              }
            );


            fragment.appendChild(
              document.createTextNode(
                text.slice(
                  cursor
                )
              )
            );


            textNode.parentNode
              .replaceChild(
                fragment,
                textNode
              );

          });

      });

  })

  .catch(function(error) {

    console.warn(
      'Bible entity links unavailable:',
      error.message
    );

  });
}
  
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

            var lang =
  String(
    $('biblePrimaryTextSelector')?.value ||
    'WEB'
  ).toUpperCase();

var chunkText =
  q.raw?.[
    'CHUNK_' + n + '_EN'
  ] ||
  '';

var chunkKo =
  q.raw?.[
    'CHUNK_' + n + '_KO'
  ] ||
  q.raw?.[
    'chunk_' + n + '_ko'
  ] ||
  '';

            return chunkText
  ? '<div style="padding:6px 0; font-size:15px; line-height:1.8; color:#2d2d2d; border-bottom:1px solid #f0ebe5;">' +
      '• <strong>' + chunkText + '</strong>' +
      (chunkKo
        ? '<span style="margin-left:10px; color:#666;">' +
          chunkKo +
          '</span>'
        : '') +
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
  attachBiblePlacesButton_(q);
  attachBibleEnglishEntityLinks_(q);


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
    ['biblePrimaryTextSelector', 'MODERN'],
    ['bibleSecondaryTextSelector', 'KOR']
  ];

  for (var p = 0; p < pairs.length; p++) {

    var id = pairs[p][0];
    var first = pairs[p][1];

    var s =
      document.getElementById(id);

    if (!s) continue;

    s.innerHTML = `
      <option value="KJV">KJV</option>
      <option value="MODERN">MODERN</option>
      <option value="KOR">KOR</option>
      <option value="NONE">NONE</option>
    `;

    s.value = first;

    s.onchange =
      function(selectorId) {

        return function() {

          var current =
            document.getElementById(
              selectorId
            );

          var otherId =
            selectorId ===
            'biblePrimaryTextSelector'
              ? 'bibleSecondaryTextSelector'
              : 'biblePrimaryTextSelector';

          var other =
            document.getElementById(
              otherId
            );

          if (
            current &&
            other &&
            current.value ===
              other.value
          ) {

            other.value =
              'NONE';
          }

          if (
            ANNE_STATE.questions.length
          ) {

            render();
          }

          saveLastSettings();
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

// SUBBLOCK 1003
// ============================================================
// NAV buttons
// PREV / SKIP / NEXT / QUIT
// + ArrowLeft / ArrowRight
// ============================================================

var prevBtn =
  document.getElementById('prevBtn');

var skipBtn =
  document.getElementById('skipBtn');

var nextBtn =
  document.getElementById('nextBtn');

var quitBtn =
  document.getElementById('quitBtn');


if (prevBtn) {
  prevBtn.onclick = function() {

    setButtonActive(this);

    if (ANNE_STATE.index > 0) {
      go(-1);
    }
  };
}


if (skipBtn) {
  skipBtn.onclick = function() {

    setButtonActive(this);

    if (
      ANNE_STATE.answers[
        ANNE_STATE.index
      ] == null
    ) {
      ANNE_STATE.answers[
        ANNE_STATE.index
      ] = -1;
    }

    if (
      ANNE_STATE.index <
      ANNE_STATE.questions.length - 1
    ) {
      go(1);
    }
  };
}


if (nextBtn) {
  nextBtn.onclick = async function() {

    setButtonActive(this);

    // PASSAGE MODE → 다음 장
    if (!ANNE_STATE.annePassageVisible) {
      await goBiblePassage_(1);
      return;
    }

    // QUIZ MODE → 다음 문제
    if (
      ANNE_STATE.index <
      ANNE_STATE.questions.length - 1
    ) {
      go(1);
    }
  };
}


if (quitBtn) {
  quitBtn.onclick = function() {

    setButtonActive(this);

    setTimeout(function() {
      location.reload();
    }, 200);
  };
}


// Arrow keys
document.addEventListener(
  'keydown',
  function(e) {

    if (
      e.target &&
      e.target.matches(
        'input,select,textarea'
      )
    ) {
      return;
    }


    if (
  e.key === 'ArrowRight'
) {

  e.preventDefault();

  if (nextBtn) {
    setButtonActive(nextBtn);
  }

  // PASSAGE MODE
  // NEXT SET 버튼과 동일하게 → 다음 장
  if (!ANNE_STATE.annePassageVisible) {

    goBiblePassage_(1);

    return;
  }

  // QUIZ MODE
  // 다음 문제
  if (
    ANNE_STATE.index <
    ANNE_STATE.questions.length - 1
  ) {

    go(1);
  }

  return;
}


    if (
      e.key === 'ArrowLeft'
    ) {

      e.preventDefault();

      if (
        ANNE_STATE.index > 0
      ) {

        if (prevBtn) {
          setButtonActive(prevBtn);
        }

        go(-1);
      }
    }
  }
);

// Template v2 bridge for this ES-module product runtime.  The shared UI reads
// only this contract; Bible keeps its current data, highlighting, and MIC flow.
window.GongbooTemplateAdapter = {
  startPlay: speakWithDyslexiaSupport,
  stopPlay: stopSpeech,
  startMic: turnAnneMicOn,
  stopMic: turnAnneMicOff,
  finalizeMic: finalizeAnneMicRecognition
};

window.finalizeAnneMicRecognition =
  finalizeAnneMicRecognition;

// SUBBLOCK 1004
// ============================================================
// Bible Navigation
// ============================================================

function goNext() {

  if (
    ANNE_STATE.index <
    ANNE_STATE.questions.length - 1
  ) {
    ANNE_STATE.index++;
    render();
  }
}

function goPrev() {

  if (
    ANNE_STATE.index > 0
  ) {
    ANNE_STATE.index--;
    render();
  }
}



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

  var code = String(
    selector
      ? selector.value
      : 'WEB'
  ).toUpperCase();

  if (
    code === 'KOR' ||
    code === 'KO' ||
    code === 'KO_WEB'
  ) {
    return {
      code: 'KOR',
      recognition: 'ko-KR'
    };
  }

  if (code === 'KJV') {
    return {
      code: 'KJV',
      recognition: 'en-US'
    };
  }

  return {
    code: 'MODERN',
    recognition: 'en-US'
  };
}

var _bibleMicSelectedSentence = null;

function isBibleMicSentenceVisible(element) {

  if (!element || !element.isConnected) {
    return false;
  }

  var rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function setBibleMicSelectedSentence(element) {

  if (
    _bibleMicSelectedSentence &&
    _bibleMicSelectedSentence !== element
  ) {
    _bibleMicSelectedSentence.classList.remove(
      'bible-mic-target'
    );
  }

  _bibleMicSelectedSentence = element || null;

  if (_bibleMicSelectedSentence) {
    _bibleMicSelectedSentence.classList.add(
      'bible-mic-target'
    );
  }
}

function installBibleMicSentenceSelection() {

  document.addEventListener(
    'click',
    function(event) {

      if (!ANNE_STATE || !ANNE_STATE.micMode) {
        return;
      }

      var element = event.target.closest(
        '.anne-passage .language-line[data-language], ' +
        '.anne-full-diary .language-line[data-language]'
      );

      if (!element) {
        return;
      }

      var language = getAnneMicLanguage();

      if (element.dataset.language !== language.code) {
        return;
      }

      setBibleMicSelectedSentence(element);
      _anneMicPassageIndex = 0;

      // Restart recognition immediately so the selected sentence is the
      // active target, while MIC itself stays on.
      startAnneRecognition();
    }
  );
}

installBibleMicSentenceSelection();


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
      _bibleMicSelectedSentence &&
      diaryLines.indexOf(_bibleMicSelectedSentence) >= 0
    ) {

      var selectedDiaryIndex = diaryLines.indexOf(
        _bibleMicSelectedSentence
      );

      _anneMicPassageIndex = selectedDiaryIndex;

      return {
        element: _bibleMicSelectedSentence,
        text: String(
          _bibleMicSelectedSentence.textContent || ''
        ).trim(),
        code: langInfo.code,
        recognition: langInfo.recognition,
        passageMode: true,
        passageIndex: selectedDiaryIndex,
        passageCount: diaryLines.length
      };
    }

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

  if (
    _bibleMicSelectedSentence &&
    _bibleMicSelectedSentence.dataset.language ===
      langInfo.code &&
    isBibleMicSentenceVisible(_bibleMicSelectedSentence)
  ) {
    sentenceEl = _bibleMicSelectedSentence;
  }


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

function bibleMicAlert(message) {

  alert(
    String(message || '').indexOf('Chrome') === 0
      ? 'Microphone recognition is available in Chrome or Edge.'
      : 'Please allow microphone access in your browser.'
  );
}

function startAnneRecognition() {

  if (
    !SpeechRecognition
  ) {

    bibleMicAlert(
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

        bibleMicAlert(
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


  // 컴퓨터 TTS 중지
  if (
    typeof stopSpeech ===
    'function'
  ) {

    stopSpeech();

  }


  ANNE_STATE.micMode =
    true;

  if (
    typeof window.gongbooSetMicActive ===
    'function'
  ) {

    window.gongbooSetMicActive(
      true
    );
  }
  _anneMicPassageIndex = 0;


  // The old anneMicButton is optional compatibility markup. The visible
  // Template v2 MIC button must be able to start recognition without it.
  if (btn) {
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
  }

  // The Template v2 MIC menu and RECOGNIZE action replace the retired
  // floating PASS panel, so never create or show that panel here.


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

  if (
    typeof window.gongbooSetMicActive ===
    'function'
  ) {

    window.gongbooSetMicActive(
      false
    );
  }


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

  if (
    typeof window.gongbooSetPlayActive ===
    'function'
  ) {

    window.gongbooSetPlayActive(
      false
    );
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

  if (
    typeof window.gongbooSetPlayActive ===
    'function'
  ) {

    window.gongbooSetPlayActive(
      true
    );
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

// ============================================================
// BLOCK 1500: Bible People DB Explorer
// ============================================================
// SUBBLOCK 1500
// ============================================================
// People HTML Escape Compatibility
// ============================================================

function escapeHtml(value) {
  return esc(value);
}

// SUBBLOCK 1505
// ============================================================
// People State
// ============================================================

var biblePeopleExplorerInitialized = false;
var biblePeopleSelectedId = '';
var biblePeopleSearchTimer = null;
var biblePeopleSearchRequestId = 0;
var biblePeopleDirectoryLoaded = false;
var biblePeopleLetter = 'A';

var biblePeopleNameIndex = {};
var biblePeopleNameIndexPromise = null;

var bibleContextLinks = null;
var bibleContextLinksPromise = null;

var biblePeopleRelationshipScene = null;


// SUBBLOCK 1510
// ============================================================
// HTML Escape
// ============================================================

function biblePeopleEscape_(value) {

  if (typeof esc === 'function') {
    return esc(value);
  }

  return String(
    value == null ? '' : value
  )
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
}


// SUBBLOCK 1515
// ============================================================
// People Name Index
// Supabase Storage → Edge Function
// ============================================================

function biblePeopleLoadNameIndex_() {

  if (biblePeopleNameIndexPromise) {
    return biblePeopleNameIndexPromise;
  }

  if (
    !window.BibleSupabaseProvider ||
    typeof window.BibleSupabaseProvider.fetchContent !==
      'function'
  ) {

    return Promise.resolve({});
  }

  biblePeopleNameIndexPromise =
    window.BibleSupabaseProvider
      .fetchContent(
        'content/people-index.json'
      )

      .then(function(response) {

        if (!response.ok) {
          throw new Error(
            'Bible person names could not be loaded.'
          );
        }

        return response.json();
      })

      .then(function(index) {

        biblePeopleNameIndex =
          index || {};

        return biblePeopleNameIndex;
      })

      .catch(function(error) {

        console.warn(
          '[BIBLE PEOPLE]',
          error.message
        );

        return {};
      });

  return biblePeopleNameIndexPromise;
}


// SUBBLOCK 1520
// ============================================================
// People Context Links
// ============================================================

function biblePeopleLoadContextLinks_() {

  if (bibleContextLinksPromise) {
    return bibleContextLinksPromise;
  }

  if (
    !window.BibleSupabaseProvider ||
    typeof window.BibleSupabaseProvider.fetchContent !==
      'function'
  ) {

    return Promise.resolve({});
  }

  bibleContextLinksPromise =
    window.BibleSupabaseProvider
      .fetchContent(
        'content/bible-context-links.json'
      )

      .then(function(response) {

        if (!response.ok) {
          throw new Error(
            'Bible context links could not be loaded.'
          );
        }

        return response.json();
      })

      .then(function(value) {

        bibleContextLinks =
          value || {};

        return bibleContextLinks;
      })

      .catch(function(error) {

        console.warn(
          '[BIBLE PEOPLE]',
          error.message
        );

        return {};
      });

  return bibleContextLinksPromise;
}


// SUBBLOCK 1525
// ============================================================
// People API
// Direct BibleSupabaseProvider
// ============================================================

async function biblePeopleApi_(
  action,
  values
) {

  if (
    !window.BibleSupabaseProvider ||
    typeof window.BibleSupabaseProvider.request !==
      'function'
  ) {

    throw new Error(
      'Bible Supabase Provider is not loaded.'
    );
  }

  var payload = {
    action: action
  };

  Object.keys(
    values || {}
  ).forEach(function(key) {

    if (
      values[key] != null &&
      values[key] !== ''
    ) {

      payload[key] =
        String(values[key]);
    }
  });

  var response =
    await window.BibleSupabaseProvider.request(
      payload
    );

  if (!response.ok) {

    var message =
      'Bible People HTTP ' +
      response.status;

    try {

      var errorData =
        await response.clone().json();

      if (
        errorData &&
        errorData.message
      ) {

        message =
          errorData.message;
      }

    } catch (e) {}

    throw new Error(message);
  }

  var data =
    await response.json();

  if (
    !data ||
    data.status === 'error' ||
    data.success === false
  ) {

    throw new Error(
      data && data.message
        ? data.message
        : 'The Bible People request could not be completed.'
    );
  }

  return data.data;
}


// SUBBLOCK 1530
// ============================================================
// Status
// ============================================================

function biblePeopleSetStatus_(
  message,
  isError
) {

  var status =
    document.getElementById(
      'biblePeopleStatus'
    );

  if (!status) return;

  status.textContent =
    message || '';

  status.classList.toggle(
    'is-error',
    !!isError
  );
}


// SUBBLOCK 1535
// ============================================================
// Open / Close
// ============================================================

function biblePeopleOpen_() {

  var panel =
    document.getElementById(
      'biblePeoplePanel'
    );

  var toggle =
    document.getElementById(
      'biblePeopleToggle'
    );

  if (!panel) return;

  panel.hidden = false;

  document.body.classList.add(
    'bible-people-open'
  );

  if (toggle) {

    toggle.setAttribute(
      'aria-expanded',
      'true'
    );
  }

  setTimeout(function() {

    var input =
      document.getElementById(
        'biblePeopleSearchInput'
      );

    if (input) {
      input.focus();
    }

  }, 0);

  if (!biblePeopleDirectoryLoaded) {

    biblePeopleDirectoryLoaded =
      true;

    biblePeopleSetStatus_(
      'Loading names...'
    );

    var first =
      document.querySelector(
        '#biblePeopleAlphabet ' +
        '[data-people-letter="A"]'
      );

    if (first) {
      first.click();
    }
  }
}


function biblePeopleClose_() {

  var panel =
    document.getElementById(
      'biblePeoplePanel'
    );

  var toggle =
    document.getElementById(
      'biblePeopleToggle'
    );

  if (panel) {
    panel.hidden = true;
  }

  document.body.classList.remove(
    'bible-people-open'
  );

  if (toggle) {

    toggle.setAttribute(
      'aria-expanded',
      'false'
    );

    toggle.focus();
  }
}


// SUBBLOCK 1540
// ============================================================
// Search Result Renderer
// ============================================================

function biblePeopleRenderResults_(
  people
) {

  var results =
    document.getElementById(
      'biblePeopleResults'
    );

  if (!results) return;

  if (
    !Array.isArray(people) ||
    !people.length
  ) {

    results.innerHTML =
      '<div class="bible-people-empty">' +
      '<strong>No results</strong>' +
      '<span>Try another English name or alias.</span>' +
      '</div>';

    return;
  }

  var visibleCount =
    Math.min(
      80,
      people.length
    );

  function paintPeople() {

    results.innerHTML =
      people
        .slice(
          0,
          visibleCount
        )
        .map(function(person) {

          var aliases = '';

          if (
            person.MATCH_KIND ===
              'alias' &&
            Array.isArray(
              person.ALIASES
            ) &&
            person.ALIASES.length
          ) {

            aliases =
              'Alias match: ' +
              person.ALIASES
                .slice(0, 3)
                .join(', ');

          } else if (
            Array.isArray(
              person.ALIASES
            ) &&
            person.ALIASES.length
          ) {

            aliases =
              'Aliases: ' +
              person.ALIASES
                .slice(0, 3)
                .join(', ');

          } else {

            aliases =
              person.ROLES ||
              person.GENDER ||
              'Bible person';
          }

          return (
            '<button type="button" ' +
            'class="bible-person-result' +
            (
              person.PERSON_ID ===
              biblePeopleSelectedId
                ? ' is-active'
                : ''
            ) +
            '" data-person-id="' +
            biblePeopleEscape_(
              person.PERSON_ID
            ) +
            '">' +

            '<strong>' +
            biblePeopleEscape_(
              person.NAME_EN ||
              person.PERSON_ID
            ) +
            '</strong>' +

            (
              person.NAME_KO
                ? '<span>' +
                  biblePeopleEscape_(
                    person.NAME_KO
                  ) +
                  '</span>'
                : ''
            ) +

            '<span>' +
            biblePeopleEscape_(
              aliases
            ) +
            '</span>' +

            '</button>'
          );
        })
        .join('') +

      '<div class="bible-sermon-scroll-note" ' +
      'data-people-load-sentinel>' +

      (
        visibleCount <
        people.length
          ? 'Loading ahead · ' +
            visibleCount +
            ' of ' +
            people.length
          : 'All ' +
            people.length +
            ' results shown'
      ) +

      '</div>';

    results
      .querySelectorAll(
        '[data-person-id]'
      )
      .forEach(function(button) {

        button.addEventListener(
          'click',
          function() {

            biblePeopleLoadDetail_(
              button.getAttribute(
                'data-person-id'
              )
            );
          }
        );
      });

    var sentinel =
      results.querySelector(
        '[data-people-load-sentinel]'
      );

    if (
      sentinel &&
      visibleCount <
        people.length &&
      typeof IntersectionObserver ===
        'function'
    ) {

      var observer =
        new IntersectionObserver(
          function(entries) {

            if (
              entries.some(
                function(entry) {
                  return entry.isIntersecting;
                }
              )
            ) {

              observer.disconnect();

              visibleCount =
                Math.min(
                  visibleCount + 80,
                  people.length
                );

              paintPeople();
            }
          },
          {
            root: results,
            rootMargin:
              '0px 0px 420px 0px'
          }
        );

      observer.observe(
        sentinel
      );
    }
  }

  paintPeople();
}


// SUBBLOCK 1545
// ============================================================
// Alphabet
// ============================================================

function biblePeopleRenderAlphabet_() {

  var alphabet =
    document.getElementById(
      'biblePeopleAlphabet'
    );

  if (!alphabet) return;

  alphabet.innerHTML =
    ['All']
      .concat(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          .split('')
      )
      .map(function(label) {

        var value =
          label === 'All'
            ? ''
            : label;

        return (
          '<button type="button" ' +
          'data-people-letter="' +
          value +
          '" class="' +
          (
            biblePeopleLetter === value
              ? 'is-active'
              : ''
          ) +
          '">' +
          label +
          '</button>'
        );
      })
      .join('');

  alphabet
    .querySelectorAll(
      '[data-people-letter]'
    )
    .forEach(function(button) {

      button.addEventListener(
        'click',
        function() {

          biblePeopleLetter =
            button.getAttribute(
              'data-people-letter'
            ) || '';

          var input =
            document.getElementById(
              'biblePeopleSearchInput'
            );

          if (input) {

            input.value =
              biblePeopleLetter;
          }

          biblePeopleRenderAlphabet_();

          biblePeopleLoadNameIndex_()
            .then(function(index) {

              var people =
                Object.keys(index)
                  .map(function(personId) {

                    var item =
                      index[personId] ||
                      {};

                    return {

                      PERSON_ID:
                        personId,

                      NAME_EN:
                        item.name,

                      NAME_KO:
                        item.name_ko,

                      GENDER:
                        item.gender,

                      ALIASES:
                        []
                    };
                  })

                  .filter(function(person) {

                    return (
                      !biblePeopleLetter ||
                      String(
                        person.NAME_EN ||
                        ''
                      )
                      .trim()
                      .toUpperCase()
                      .startsWith(
                        biblePeopleLetter
                      )
                    );
                  })

                  .sort(function(a, b) {

                    return String(
                      a.NAME_EN
                    ).localeCompare(
                      String(
                        b.NAME_EN
                      )
                    );
                  });

              biblePeopleRenderResults_(
                people
              );

              biblePeopleSetStatus_(
                people.length +
                ' ' +
                (
                  biblePeopleLetter ||
                  'A-Z'
                ) +
                ' people available.'
              );
            });
        }
      );
    });
}


// SUBBLOCK 1550
// ============================================================
// Relationship Helpers
// ============================================================

function biblePeopleRelationshipName_(
  relationship,
  personId
) {

  var relatedId =
    relationship.RELATED_ID ||
    (
      relationship.FROM_ID ===
        personId
        ? relationship.TO_ID
        : relationship.FROM_ID
    );

  var displayName =
    relationship.RELATED_NAME_EN ||
    (
      biblePeopleNameIndex[
        relatedId
      ] &&
      biblePeopleNameIndex[
        relatedId
      ].name
        ? biblePeopleNameIndex[
            relatedId
          ].name
        : relatedId
    );

  return String(
    displayName || ''
  ).replace(
    /^PER-/i,
    ''
  );
}


function biblePeopleRelationshipType_(
  relationship,
  personId
) {

  var type =
    String(
      relationship
        .RELATIONSHIP_TYPE ||
      'related'
    ).toLowerCase();

  var fromSelected =
    relationship.FROM_ID ===
    personId;

  if (fromSelected) {

    if (
      type === 'father' ||
      type === 'mother'
    ) {
      return 'parent';
    }

    return type;
  }

  if (type === 'child') {
    return 'parent';
  }

  if (
    type === 'father' ||
    type === 'mother'
  ) {
    return 'child';
  }

  return type;
}


function biblePeopleRelationshipRole_(
  relationship,
  personId
) {

  var type =
    relationship.DISPLAY_TYPE ||
    biblePeopleRelationshipType_(
      relationship,
      personId
    );

  var relatedId =
    relationship.RELATED_ID ||
    (
      relationship.FROM_ID ===
        personId
        ? relationship.TO_ID
        : relationship.FROM_ID
    );

  var gender =
    String(
      biblePeopleNameIndex[
        relatedId
      ] &&
      biblePeopleNameIndex[
        relatedId
      ].gender ||
      ''
    ).toLowerCase();

  if (type === 'parent') {
    return gender === 'male'
      ? 'Father'
      : gender === 'female'
        ? 'Mother'
        : 'Parent';
  }

  if (type === 'partner') {
    return gender === 'male'
      ? 'Husband'
      : gender === 'female'
        ? 'Wife'
        : 'Spouse';
  }

  if (type === 'sibling') {
    return gender === 'male'
      ? 'Brother'
      : gender === 'female'
        ? 'Sister'
        : 'Sibling';
  }

  if (type === 'child') {
    return gender === 'male'
      ? 'Son'
      : gender === 'female'
        ? 'Daughter'
        : 'Child';
  }

  return String(
    type || 'Related'
  )
  .replace(/_/g, ' ')
  .replace(
    /\b\w/g,
    function(letter) {
      return letter.toUpperCase();
    }
  );
}


function biblePeopleUniqueRelationships_(
  relationships,
  personId
) {

  var unique =
    new Map();

  (relationships || [])
    .forEach(function(relationship) {

      var relatedId =
        relationship.RELATED_ID ||
        (
          relationship.FROM_ID ===
            personId
            ? relationship.TO_ID
            : relationship.FROM_ID
        );

      if (
        !relatedId ||
        relatedId === personId
      ) {
        return;
      }

      var type =
        biblePeopleRelationshipType_(
          relationship,
          personId
        );

      var key =
        relatedId +
        '|' +
        type;

      if (!unique.has(key)) {

        unique.set(
          key,
          Object.assign(
            {},
            relationship,
            {
              RELATED_ID:
                relatedId,

              DISPLAY_TYPE:
                type
            }
          )
        );
      }
    });

  return Array.from(
    unique.values()
  );
}
// SUBBLOCK 1552
// ============================================================
// People Relationship Graph Payload
// ============================================================

function biblePeopleGraphPayload_(
  person,
  relationships
) {

  var related =
    biblePeopleUniqueRelationships_(
      relationships,
      person.PERSON_ID
    ).slice(0, 28);


  var groups = {
    parent: [],
    partner: [],
    sibling: [],
    child: [],
    other: []
  };


  related.forEach(
    function(relationship) {

      var type =
        relationship.DISPLAY_TYPE;

      if (groups[type]) {
        groups[type].push(
          relationship
        );
      } else {
        groups.other.push(
          relationship
        );
      }
    }
  );


  var objects = [
    {
      id: 'center',

      type: 'point',

      coords: [0, 0],

      name:
        person.NAME_EN ||
        person.PERSON_ID,

      attributes: {
        size: 6,
        strokeColor: '#92400e',
        fillColor: '#fbbf24',

        label: {
          fontSize: 14,
          color: '#78350f',
          offset: [10, 10]
        }
      }
    }
  ];


  function addGroup(
    groupName,
    y,
    color,
    title
  ) {

    var members =
      groups[groupName];

    if (!members.length) {
      return;
    }


    var spacing =
      Math.min(
        5.2,
        20 /
        Math.max(
          1,
          members.length
        )
      );


    var startX =
      -(
        (
          members.length - 1
        ) *
        spacing
      ) / 2;


    objects.push({
      id:
        'title_' +
        groupName,

      type:
        'text',

      position: [
        -10.5,
        y +
        (
          y >= 0
            ? 1.25
            : -1.25
        )
      ],

      value:
        title,

      attributes: {
        color: '#64748b',
        fontSize: 11
      }
    });


    members.forEach(
      function(
        relationship,
        index
      ) {

        var coords = [
          startX +
          index *
          spacing,

          y
        ];


        var id =
          groupName +
          '_' +
          index;


        objects.push({
          id:
            id,

          type:
            'point',

          coords:
            coords,

          name:
            biblePeopleRelationshipName_(
              relationship,
              person.PERSON_ID
            ) +
            ' (' +
            biblePeopleRelationshipRole_(
              relationship,
              person.PERSON_ID
            ) +
            ')',

          attributes: {
            size: 4,

            strokeColor:
              color.stroke,

            fillColor:
              color.fill,

            label: {
              fontSize: 12,
              color: color.text,
              offset: [8, 8]
            }
          },

          metadata: {
            personId:
              relationship.RELATED_ID
          }
        });


        objects.push({
          id:
            'line_' +
            id,

          type:
            'segment',

          from:
            [0, 0],

          to:
            coords,

          attributes: {
            strokeColor:
              color.line,

            strokeWidth:
              1.8
          }
        });
      }
    );
  }


  function addPartnerGroup() {

    var members =
      groups.partner;

    if (!members.length) {
      return;
    }


    var positions = [
      -5,
      5,
      -9,
      9,
      -12,
      12
    ];


    objects.push({
      id:
        'title_partner',

      type:
        'text',

      position:
        [-10.5, 1.35],

      value:
        'SPOUSE / PARTNER',

      attributes: {
        color: '#64748b',
        fontSize: 11
      }
    });


    members.forEach(
      function(
        relationship,
        index
      ) {

        var coords = [
          positions[index] ||
          (
            5 +
            index * 3
          ),

          0
        ];


        var id =
          'partner_' +
          index;


        objects.push({
          id:
            id,

          type:
            'point',

          coords:
            coords,

          name:
            biblePeopleRelationshipName_(
              relationship,
              person.PERSON_ID
            ) +
            ' (' +
            biblePeopleRelationshipRole_(
              relationship,
              person.PERSON_ID
            ) +
            ')',

          attributes: {
            size: 4,

            strokeColor:
              '#be185d',

            fillColor:
              '#f9a8d4',

            label: {
              fontSize: 12,
              color: '#831843',
              offset: [8, -16]
            }
          },

          metadata: {
            personId:
              relationship.RELATED_ID
          }
        });


        objects.push({
          id:
            'line_' +
            id,

          type:
            'segment',

          from:
            [0, 0],

          to:
            coords,

          attributes: {
            strokeColor:
              '#f472b6',

            strokeWidth:
              1.8
          }
        });
      }
    );
  }


  addGroup(
    'parent',
    7,
    {
      stroke: '#6d28d9',
      fill: '#c4b5fd',
      text: '#4c1d95',
      line: '#a78bfa'
    },
    'PARENTS'
  );


  addPartnerGroup();


  addGroup(
    'sibling',
    -3.7,
    {
      stroke: '#1d4ed8',
      fill: '#93c5fd',
      text: '#1e3a8a',
      line: '#60a5fa'
    },
    'SIBLINGS'
  );


  addGroup(
    'child',
    -7,
    {
      stroke: '#047857',
      fill: '#6ee7b7',
      text: '#064e3b',
      line: '#34d399'
    },
    'CHILDREN'
  );


  addGroup(
    'other',
    -9.5,
    {
      stroke: '#475569',
      fill: '#cbd5e1',
      text: '#334155',
      line: '#94a3b8'
    },
    'OTHER'
  );


  return {
    schemaVersion:
      '1.1',

    engine:
      'jsxgraph',

    type:
      'bible.people.relationships',

    board: {
      boundingbox:
        [-12, 10, 12, -11],

      axis:
        false,

      grid:
        false
    },

    objects:
      objects
  };
}

// SUBBLOCK 1555
// ============================================================
// Person Detail Renderer
// ============================================================

function biblePeopleRenderDetail_(detail) {

  var host =
    document.getElementById(
      'biblePeopleDetail'
    );

  if (
    !host ||
    !detail ||
    !detail.person
  ) {
    return;
  }

  if (
    biblePeopleRelationshipScene &&
    typeof biblePeopleRelationshipScene.destroy === 'function'
  ) {
    biblePeopleRelationshipScene.destroy();
    biblePeopleRelationshipScene = null;
  }

  var person =
    detail.person;

  var aliases =
    Array.isArray(detail.aliases)
      ? detail.aliases
      : [];

  var referenceMap = {};

  (
    Array.isArray(detail.references)
      ? detail.references
      : []
  ).forEach(function(reference) {

    var code =
      String(
        reference.SOURCE_CODE || ''
      ).trim();

    if (!code) return;

    var key =
      code.toLowerCase();

    if (!referenceMap[key]) {
      referenceMap[key] =
        Object.assign(
          {},
          reference
        );
    }

    if (
      reference.IS_KEY === 'TRUE' ||
      reference.IS_KEY === 'true' ||
      reference.IS_KEY === true
    ) {
      referenceMap[key].IS_KEY =
        'TRUE';
    }
  });

  var references =
    Object.keys(referenceMap)
      .map(function(key) {
        return referenceMap[key];
      });

  var relationships =
    biblePeopleUniqueRelationships_(
      Array.isArray(detail.relationships)
        ? detail.relationships
        : [],
      person.PERSON_ID
    );

  var roles =
    String(
      person.ROLES || ''
    )
    .split('|')
    .filter(Boolean);

  var description =
    person.DESCRIPTION_EN ||
    person.DESCRIPTION_KO ||
    'No source description is available.';

  var referenceLimit = 24;
  var relationshipLimit = 30;

  var context =
    detail.context || {};

  var contextEvents =
    Array.isArray(context.events)
      ? context.events
      : [];

  var contextPlaces =
    Array.isArray(context.places)
      ? context.places
      : [];

  var scripturePlaces =
    Array.isArray(context.scripture_places)
      ? context.scripture_places
      : [];

  var relationshipGraphic =
    relationships.length
      ? biblePeopleGraphPayload_(
          person,
          relationships
        )
      : null;

  var graphHtml =
    relationships.length
      ? '<div class="vector-scene25d-host bible-relationship-25d"></div>'
      : (
          '<div class="bible-single-person">' +
            '<div class="bible-single-person-icon" aria-hidden="true">👤</div>' +
            '<strong>' +
              escapeHtml(
                person.NAME_EN ||
                person.PERSON_ID
              ) +
            '</strong>' +
            (
              person.NAME_KO
                ? '<span>' +
                    escapeHtml(
                      person.NAME_KO
                    ) +
                  '</span>'
                : ''
            ) +
            '<small>No family relationships are recorded for this person.</small>' +
          '</div>'
        );

  host.innerHTML =
    '<article class="bible-person-card">' +

      '<div class="bible-person-title">' +
        '<div>' +
          '<h3>' +
            escapeHtml(
              person.NAME_EN ||
              person.PERSON_ID
            ) +
          '</h3>' +

          (
            person.NAME_KO
              ? '<p>' +
                  escapeHtml(
                    person.NAME_KO
                  ) +
                '</p>'
              : ''
          ) +
        '</div>' +

        '<span class="bible-person-id">' +
          escapeHtml(
            person.PERSON_ID
          ) +
        '</span>' +
      '</div>' +

      '<div class="bible-person-meta">' +

        roles.map(function(role) {
          return (
            '<span class="bible-person-chip">' +
              escapeHtml(role) +
            '</span>'
          );
        }).join('') +

        (
          person.GENDER
            ? '<span class="bible-person-chip">' +
                escapeHtml(
                  person.GENDER
                ) +
              '</span>'
            : ''
        ) +

      '</div>' +

      '<p class="bible-person-description">' +
        escapeHtml(description) +
      '</p>' +

      (
        aliases.length
          ? (
              '<section class="bible-person-section">' +
                '<h4>Aliases</h4>' +
                '<div class="bible-person-meta">' +

                  aliases.map(function(alias) {
                    return (
                      '<span class="bible-person-chip">' +
                        escapeHtml(
                          alias.ALIAS
                        ) +
                      '</span>'
                    );
                  }).join('') +

                '</div>' +
              '</section>'
            )
          : ''
      ) +

      '<section class="bible-person-section">' +
        '<h4>Scripture references (' +
          references.length +
        ')</h4>' +

        '<div class="bible-person-grid">' +

          references
            .slice(
              0,
              referenceLimit
            )
            .map(function(reference) {

              return (
                '<button type="button" ' +
                  'class="bible-reference" ' +
                  'data-bible-source-code="' +
                  escapeHtml(
                    reference.SOURCE_CODE
                  ) +
                  '">' +

                  escapeHtml(
                    reference.SOURCE_CODE
                  ) +

                  (
                    reference.IS_KEY === 'TRUE' ||
                    reference.IS_KEY === 'true'
                      ? ' · Key'
                      : ''
                  ) +

                '</button>'
              );
            })
            .join('') +

        '</div>' +

        (
          references.length >
          referenceLimit
            ? (
                '<div class="bible-reference-more">' +
                  'Showing the first ' +
                  referenceLimit +
                  ' of ' +
                  references.length +
                  ' references.' +
                '</div>'
              )
            : ''
        ) +

      '</section>' +

      '<section class="bible-person-section">' +
        '<h4>People · Places · Events</h4>' +

        '<div class="bible-person-meta">' +

          '<button type="button" ' +
            'class="bible-person-chip" ' +
            'data-context-tab="places" ' +
            'title="Open Atlas">' +
            '🌐 Atlas' +
          '</button>' +

          '<button type="button" ' +
            'class="bible-person-chip" ' +
            'data-context-tab="timeline">' +
            'Timeline' +
          '</button>' +

          '<button type="button" ' +
            'class="bible-person-chip" ' +
            'data-context-tab="journeys">' +
            'Journeys' +
          '</button>' +

        '</div>' +

        (
          contextEvents.length
            ? (
                '<div class="bible-context-list">' +

                  contextEvents
                    .slice(0, 12)
                    .map(function(event) {

                      var eventReference =
                        (
                          event.source_codes ||
                          []
                        )[0] || '';

                      var eventPlaces =
                        Array.isArray(
                          event.place_names
                        )
                          ? event.place_names
                          : [];

                      return (
                        '<div class="bible-context-event-row">' +

                          '<button type="button" ' +
                            'class="bible-context-item" ' +
                            'data-context-event-reference="' +
                            escapeHtml(
                              eventReference
                            ) +
                            '">' +

                            '<strong>Event · ' +
                              escapeHtml(
                                event.title
                              ) +
                            '</strong>' +

                            '<span>' +
                              escapeHtml(
                                (
                                  event.source_codes ||
                                  []
                                )
                                .slice(0, 2)
                                .join(', ')
                              ) +
                            '</span>' +

                          '</button>' +

                          (
                            eventPlaces.length
                              ? (
                                  '<div class="bible-context-event-places">' +
                                    '<span>Places:</span>' +

                                    eventPlaces
                                      .map(function(placeName) {
                                        return (
                                          '<button type="button" ' +
                                            'class="bible-person-chip" ' +
                                            'data-context-place-name="' +
                                            escapeHtml(
                                              placeName
                                            ) +
                                            '">' +
                                            '📍 ' +
                                            escapeHtml(
                                              placeName
                                            ) +
                                          '</button>'
                                        );
                                      })
                                      .join('') +

                                  '</div>'
                                )
                              : ''
                          ) +

                        '</div>'
                      );
                    })
                    .join('') +

                '</div>'
              )
            : (
                '<div class="bible-context-empty">' +
                  'No source event is directly linked to this person.' +
                '</div>'
              )
        ) +

        (
          contextPlaces.length
            ? (
                '<div class="bible-person-meta">' +

                  contextPlaces
                    .slice(0, 16)
                    .map(function(place) {

                      return (
                        '<button type="button" ' +
                          'class="bible-person-chip" ' +
                          'data-context-place-name="' +
                          escapeHtml(
                            place.name
                          ) +
                          '">' +
                          '📍 ' +
                          escapeHtml(
                            place.name
                          ) +
                        '</button>'
                      );
                    })
                    .join('') +

                '</div>'
              )
            : ''
        ) +

        (
          scripturePlaces.length
            ? (
                '<details class="bible-context-more">' +
                  '<summary>' +
                    'Additional places appearing in the same Scripture passages (' +
                    scripturePlaces.length +
                    ')' +
                  '</summary>' +

                  '<div class="bible-person-meta">' +

                    scripturePlaces
                      .slice(0, 30)
                      .map(function(place) {

                        return (
                          '<button type="button" ' +
                            'class="bible-person-chip" ' +
                            'data-context-place-name="' +
                            escapeHtml(
                              place.name
                            ) +
                            '">' +
                            escapeHtml(
                              place.name
                            ) +
                          '</button>'
                        );
                      })
                      .join('') +

                  '</div>' +
                '</details>'
              )
            : ''
        ) +

      '</section>' +

      '<section class="bible-person-section">' +

        '<h4>Relationships (' +
          relationships.length +
        ')</h4>' +

        '<div class="bible-person-grid">' +

          relationships
            .slice(
              0,
              relationshipLimit
            )
            .map(function(relationship) {

              return (
                '<button type="button" ' +
                  'class="bible-relationship" ' +
                  'data-related-person-id="' +
                  escapeHtml(
                    relationship.RELATED_ID
                  ) +
                  '">' +

                  '<strong>' +
                    escapeHtml(
                      biblePeopleRelationshipName_(
                        relationship,
                        person.PERSON_ID
                      )
                    ) +
                  '</strong>' +

                  escapeHtml(
                    biblePeopleRelationshipRole_(
                      relationship,
                      person.PERSON_ID
                    )
                  ) +

                '</button>'
              );
            })
            .join('') +

        '</div>' +
      '</section>' +

      '<section class="bible-person-section">' +
        '<h4>Relationship graph</h4>' +
        '<div class="bible-person-graph">' +
          graphHtml +
        '</div>' +
      '</section>' +

    '</article>';


  // Relationship graphic is optional in biblenew.
  if (
    relationshipGraphic &&
    typeof window.VectorScene25D ===
      'function' &&
    typeof window.sceneFromGraphicObjects ===
      'function'
  ) {

    var relationshipHost =
      host.querySelector(
        '.bible-relationship-25d'
      );

    if (relationshipHost) {

      biblePeopleRelationshipScene =
        new window.VectorScene25D(
          relationshipHost,
          {
            ariaLabel:
              'Interactive Bible relationship graph',

            labelFontSize:
              12,

            selectableLabels:
              true
          }
        );

      biblePeopleRelationshipScene
        .setScene(
          window.sceneFromGraphicObjects(
            relationshipGraphic
          )
        );

      relationshipHost
        .addEventListener(
          'scene25d:select',
          function(event) {

            event.stopPropagation();

            var nodeMetadata =
              event &&
              event.detail &&
              event.detail.node &&
              event.detail.node.metadata;

            var relatedId =
              nodeMetadata &&
              (
                nodeMetadata.personId ||
                (
                  nodeMetadata.metadata &&
                  nodeMetadata.metadata.personId
                )
              );

            if (relatedId) {
              biblePeopleLoadDetail_(
                relatedId
              );
            }
          }
        );
    }
  }


  host
    .querySelectorAll(
      '[data-related-person-id]'
    )
    .forEach(function(button) {

      button.addEventListener(
        'click',
        function(event) {

          event.preventDefault();
          event.stopPropagation();

          biblePeopleLoadDetail_(
            button.getAttribute(
              'data-related-person-id'
            )
          );
        }
      );
    });


  host
    .querySelectorAll(
      '[data-context-place-name]'
    )
    .forEach(function(button) {

      button.addEventListener(
        'click',
        function() {

          window.__bibleContextReturn = {
            kind:
              'person',

            personId:
              person.PERSON_ID
          };

          biblePeopleClose_();

          if (
            typeof window.openBibleContext ===
            'function'
          ) {

            window.openBibleContext({
              tab:
                'places',

              placeName:
                button.getAttribute(
                  'data-context-place-name'
                )
            });
          }
        }
      );
    });


  host
    .querySelectorAll(
      '[data-context-event-reference]'
    )
    .forEach(function(button) {

      button.addEventListener(
        'click',
        function() {

          window.__bibleContextReturn = {
            kind:
              'person',

            personId:
              person.PERSON_ID
          };

          biblePeopleClose_();

          if (
            typeof window.openBibleContext ===
            'function'
          ) {

            window.openBibleContext({
              tab:
                'timeline',

              sourceCode:
                button.getAttribute(
                  'data-context-event-reference'
                )
            });
          }
        }
      );
    });


  host
    .querySelectorAll(
      '[data-context-tab]'
    )
    .forEach(function(button) {

      button.addEventListener(
        'click',
        function() {

          biblePeopleClose_();

          if (
            typeof window.openBibleContext ===
            'function'
          ) {

            window.openBibleContext({
              tab:
                button.getAttribute(
                  'data-context-tab'
                )
            });
          }
        }
      );
    });
}


// SUBBLOCK 1560
// ============================================================
// Load Person Detail
// ============================================================

async function biblePeopleLoadDetail_(
  personId
) {

  if (!personId) return;

  biblePeopleSelectedId =
    personId;

  biblePeopleSetStatus_(
    'Loading person details...'
  );

  var host =
    document.getElementById(
      'biblePeopleDetail'
    );

  if (host) {

    host.innerHTML =
      '<div class="bible-people-empty">' +
        '<strong>Loading...</strong>' +
      '</div>';
  }


  document
    .querySelectorAll(
      '[data-person-id]'
    )
    .forEach(function(button) {

      button.classList.toggle(
        'is-active',
        button.getAttribute(
          'data-person-id'
        ) === personId
      );
    });


  try {

    var results =
      await Promise.all([

        biblePeopleApi_(
          'person_detail',
          {
            person_id:
              personId
          }
        ),

        biblePeopleLoadNameIndex_(),

        biblePeopleLoadContextLinks_()
      ]);


    var detail =
      results[0];

    var contextData =
      results[2] || {};


    var personContext =
      contextData.person_contexts &&
      contextData.person_contexts[
        personId
      ] ||
      {};


    detail.context = {

      events:
        (
          personContext.event_ids ||
          []
        )
        .map(function(eventId) {

          var event =
            contextData.events &&
            contextData.events[
              eventId
            ];

          if (!event) {
            return null;
          }

          return Object.assign(
            {},
            event,
            {
              place_names:
                (
                  event.place_ids ||
                  []
                )
                .map(function(placeId) {

                  return (
                    contextData.places &&
                    contextData.places[
                      placeId
                    ] &&
                    contextData.places[
                      placeId
                    ].name
                  );
                })
                .filter(Boolean)
            }
          );
        })
        .filter(Boolean),


      places:
        (
          personContext.place_ids ||
          []
        )
        .map(function(placeId) {

          return (
            contextData.places &&
            contextData.places[
              placeId
            ]
          );
        })
        .filter(Boolean),


      scripture_places:
        (
          personContext
            .scripture_place_ids ||
          []
        )
        .map(function(placeId) {

          return (
            contextData.geocoding_places &&
            contextData.geocoding_places[
              placeId
            ]
          );
        })
        .filter(Boolean)
    };


    biblePeopleRenderDetail_(
      detail
    );


    biblePeopleSetStatus_(
      'Loaded ' +
      (
        detail.person.NAME_EN ||
        personId
      ) +
      '.'
    );


    requestAnimationFrame(
      function() {

        var personTitle =
          host &&
          host.querySelector(
            '.bible-person-title'
          );

        if (personTitle) {

          personTitle.scrollIntoView({
            block:
              'start',

            inline:
              'nearest'
          });
        }
      }
    );

  } catch (error) {

    if (host) {

      host.innerHTML =
        '<div class="bible-people-empty">' +
          '<strong>Unable to load this person</strong>' +
          '<span>' +
            escapeHtml(
              error.message
            ) +
          '</span>' +
        '</div>';
    }

    biblePeopleSetStatus_(
      error.message,
      true
    );
  }
}


// SUBBLOCK 1565
// ============================================================
// People Search
// ============================================================

async function biblePeopleRunSearch_(
  query,
  isDirectory
) {

  query =
    String(
      query || ''
    ).trim();

  if (!query) return;

  var requestId =
    ++biblePeopleSearchRequestId;

  biblePeopleSetStatus_(
    'Searching...'
  );

  try {

    var people =
      await biblePeopleApi_(
        'people_search',
        {
          q: query,
          limit: 100
        }
      );

    if (
      requestId !==
      biblePeopleSearchRequestId
    ) {
      return;
    }

    biblePeopleRenderResults_(
      people
    );

    biblePeopleSetStatus_(
      isDirectory
        ? 'Select a name, or type to search all people and aliases.'
        : (
            people.length +
            ' result' +
            (
              people.length === 1
                ? ''
                : 's'
            ) +
            ' found.'
          )
    );

    if (
      !isDirectory &&
      people.length === 1
    ) {

      biblePeopleLoadDetail_(
        people[0].PERSON_ID
      );
    }

  } catch (error) {

    if (
      requestId !==
      biblePeopleSearchRequestId
    ) {
      return;
    }

    biblePeopleRenderResults_(
      []
    );

    biblePeopleSetStatus_(
      error.message,
      true
    );
  }
}


// SUBBLOCK 1570
// ============================================================
// Search Form Submit
// ============================================================

function biblePeopleSearchSubmit_(
  event
) {

  event.preventDefault();

  var input =
    document.getElementById(
      'biblePeopleSearchInput'
    );

  biblePeopleRunSearch_(
    input && input.value
  );
}


// SUBBLOCK 1575
// ============================================================
// Public Person Opener
// ============================================================

window.openBiblePerson =
  function(
    personId,
    navigationOptions
  ) {

    biblePeopleOpen_();

    if (
      !(
        navigationOptions &&
        navigationOptions.skipHistory
      ) &&
      window.BibleReferenceNavigation
    ) {

      window.BibleReferenceNavigation.push({
        kind: 'person',
        personId: personId
      });
    }

    biblePeopleLoadDetail_(
      personId
    );
  };

function openBiblePersonFromUrl_() {
  var personName = new URLSearchParams(
    window.location.search
  ).get('person');

  if (!personName) {
    return;
  }

  personName = personName.trim();

  if (!personName) {
    return;
  }

  biblePeopleOpen_();

  var input = document.getElementById(
    'biblePeopleSearchInput'
  );

  if (input) {
    input.value = personName;
  }

  biblePeopleRunSearch_(
    personName,
    false
  );
}



// SUBBLOCK 1580
// ============================================================
// Initialize People Explorer
// ============================================================

function initBiblePeopleExplorer() {

  if (
    biblePeopleExplorerInitialized
  ) {
    return;
  }

  var toggle =
    document.getElementById(
      'biblePeopleToggle'
    );

  var panel =
    document.getElementById(
      'biblePeoplePanel'
    );

  var close =
    document.getElementById(
      'biblePeopleClose'
    );

  var atlas =
    document.getElementById(
      'biblePeopleAtlas'
    );

  var back =
    document.getElementById(
      'biblePeopleBack'
    );

  var forward =
    document.getElementById(
      'biblePeopleForward'
    );

  var form =
    document.getElementById(
      'biblePeopleSearchForm'
    );

  if (
    !toggle ||
    !panel ||
    !close ||
    !form
  ) {
    return;
  }

  biblePeopleExplorerInitialized =
    true;

  biblePeopleRenderAlphabet_();

  toggle.addEventListener(
    'click',
    biblePeopleOpen_
  );

  close.addEventListener(
    'click',
    biblePeopleClose_
  );


  if (atlas) {

    atlas.addEventListener(
      'click',
      function() {

        biblePeopleClose_();

        if (
          typeof window.openBibleContext ===
          'function'
        ) {

          window.openBibleContext({
            tab: 'places'
          });

        } else {

          var explore =
            document.getElementById(
              'bibleExploreToggle'
            );

          if (explore) {
            explore.click();
          }
        }
      }
    );
  }


  if (
    back &&
    window.BibleReferenceNavigation
  ) {

    back.addEventListener(
      'click',
      function() {

        window.BibleReferenceNavigation
          .back();
      }
    );
  }


  if (
    forward &&
    window.BibleReferenceNavigation
  ) {

    forward.addEventListener(
      'click',
      function() {

        window.BibleReferenceNavigation
          .forward();
      }
    );
  }


  if (
    window.BibleReferenceNavigation
  ) {

    window.BibleReferenceNavigation
      .update();
  }


  form.addEventListener(
    'submit',
    biblePeopleSearchSubmit_
  );


  var input =
    document.getElementById(
      'biblePeopleSearchInput'
    );


  if (input) {

    input.addEventListener(
      'input',
      function() {

        clearTimeout(
          biblePeopleSearchTimer
        );

        var query =
          String(
            input.value || ''
          ).trim();


        if (!query) {

          var results =
            document.getElementById(
              'biblePeopleResults'
            );

          if (results) {
            results.innerHTML = '';
          }

          biblePeopleSetStatus_(
            'Start typing a name or alias.'
          );

          return;
        }


        biblePeopleSearchTimer =
          setTimeout(
            function() {

              biblePeopleRunSearch_(
                query
              );

            },
            280
          );
      }
    );
  }


  panel.addEventListener(
    'click',
    function(event) {

      if (
        event.target === panel
      ) {
        biblePeopleClose_();
      }
    }
  );


  document.addEventListener(
    'keydown',
    function(event) {

      if (
        event.key === 'Escape' &&
        !panel.hidden
      ) {

        biblePeopleClose_();
      }
    }
  );


  console.log(
    '[BIBLE PEOPLE] ✅ initialized'
  );
}


// SUBBLOCK 1585
// ============================================================
// Bible Tools Start
// ============================================================

setTimeout(
  function() {

    var peopleBtn =
      document.getElementById(
        'biblePeopleToggle'
      );

    if (peopleBtn) {
      peopleBtn.disabled = false;
      peopleBtn.removeAttribute('disabled');
    }


    var exploreBtn =
      document.getElementById(
        'bibleExploreToggle'
      );

    if (exploreBtn) {
      exploreBtn.disabled = false;
      exploreBtn.removeAttribute('disabled');
    }


    initBiblePeopleExplorer();
    openBiblePersonFromUrl_();
  },
  200
);



// SUBBLOCK 1590
// ============================================================
// Scripture Reference → Bible Question
// ============================================================

function bibleSourceCodeParts_(sourceCode) {

  var parts =
    String(sourceCode || '')
      .trim()
      .split('-');

  if (parts.length < 4) {
    return null;
  }

  var testament =
    String(parts[0]).toUpperCase();

  if (
    testament !== 'OT' &&
    testament !== 'NT'
  ) {
    return null;
  }

  var verse =
    parseInt(
      parts[parts.length - 1],
      10
    );

  var chapter =
    parseInt(
      parts[parts.length - 2],
      10
    );

  var book =
    parts
      .slice(1, -2)
      .join('-');

  if (
    !book ||
    !chapter ||
    !verse
  ) {
    return null;
  }

  return {
    testament: testament,
    book: book,
    chapter: chapter,
    verse: verse,
    sourceCode: sourceCode
  };
}


async function openBibleScriptureReference_(
  sourceCode
) {

  var parts =
    bibleSourceCodeParts_(
      sourceCode
    );

  if (!parts) {

    alert(
      'This Scripture reference is not recognized: ' +
      sourceCode
    );

    return false;
  }


  // People 창 닫기
  var peoplePanel =
    document.getElementById(
      'biblePeoplePanel'
    );

  if (
    peoplePanel &&
    !peoplePanel.hidden
  ) {

    if (
      typeof biblePeopleClose_ ===
      'function'
    ) {
      biblePeopleClose_();
    } else {
      peoplePanel.hidden = true;
    }
  }


  // Atlas / Context 창 닫기
  var explorePanel =
    document.getElementById(
      'bibleExplorePanel'
    );

  if (
    explorePanel &&
    !explorePanel.hidden
  ) {

    explorePanel.hidden = true;

    document.body.classList.remove(
      'bible-people-open'
    );

    var exploreToggle =
      document.getElementById(
        'bibleExploreToggle'
      );

    if (exploreToggle) {
      exploreToggle.setAttribute(
        'aria-expanded',
        'false'
      );
    }
  }


  // 해당 장 전체 문제 로딩
  await window.loadBibleChapter(
    parts.testament,
    parts.book,
    parts.chapter
  );


  var wanted =
    String(
      parts.sourceCode
    ).toLowerCase();


  // 정확한 절의 첫 문제 찾기
  var targetIndex =
    ANNE_STATE.questions.findIndex(
      function(question) {

        return String(
          question.sourceCode ||
          question.subject ||
          ''
        ).toLowerCase() === wanted;
      }
    );


  // 정확한 절 문제가 없으면
  // 같은 장에서 가장 가까운 절 찾기
  if (targetIndex < 0) {

    var nearestDistance =
      Infinity;


    ANNE_STATE.questions.forEach(
      function(
        question,
        index
      ) {

        var code =
          String(
            question.sourceCode ||
            question.subject ||
            ''
          );

        if (!code) return;


        var qParts =
          bibleSourceCodeParts_(
            code
          );

        if (!qParts) return;


        if (
          qParts.testament !==
            parts.testament ||
          qParts.book !==
            parts.book ||
          qParts.chapter !==
            parts.chapter
        ) {
          return;
        }


        var distance =
          Math.abs(
            qParts.verse -
            parts.verse
          );


        if (
          distance <
          nearestDistance
        ) {

          nearestDistance =
            distance;

          targetIndex =
            index;
        }
      }
    );
  }


  if (targetIndex < 0) {
    targetIndex = 0;
  }


  ANNE_STATE.index =
    targetIndex;

  render();


  var quizContent =
    document.getElementById(
      'quizContent'
    );

  if (quizContent) {

    quizContent.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }


  console.log(
    '[BIBLE REF] opened:',
    sourceCode,
    'index:',
    targetIndex
  );


  return true;
}


window.openBibleScriptureReference =
  openBibleScriptureReference_;

// SUBBLOCK 1595
// ============================================================
// Scripture Reference Button Click
// ============================================================

document.addEventListener(
  'click',
  function(event) {

    var button =
      event.target.closest(
        '[data-bible-source-code]'
      );

    if (!button) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    var sourceCode =
      button.getAttribute(
        'data-bible-source-code'
      );

    if (!sourceCode) {
      return;
    }

    window.openBibleScriptureReference(
      sourceCode
    );
  }
);
