(function () {

  var config =
    window.BIBLE_NEW_CONFIG || {};

  var buildEl =
    document.getElementById(
      'buildNumber'
    );

  if (buildEl) {
    buildEl.textContent =
      'BUILD ' +
      String(
        config.build || ''
      );
  }


  window.loadBibleSample =
    async function(testament) {

      var content =
        document.getElementById(
          'content'
        );

      if (!content) {
        return;
      }



      
      content.innerHTML =
        'Loading...';


      var recordId =
        testament === 'NT'
          ? 'NT-Matthew-01-01-Q01'
          : 'OT-Genesis-01-01-Q01';


      var url =
        config.supabaseUrl +
        '/rest/v1/' +
        config.table +
        '?select=*' +
        '&record_id=eq.' +
        encodeURIComponent(recordId);


      try {

        var response =
          await fetch(
            url,
            {
              headers: {
                apikey:
                  config.publishableKey
              }
            }
          );


        var rows =
          await response.json();


        if (
          !Array.isArray(rows) ||
          !rows.length
        ) {

          content.innerHTML =
            'No Bible data found.';

          return;
        }


        var en =
          rows.find(
            function(row) {
              return (
                String(row.lang)
                  .toUpperCase() ===
                'EN'
              );
            }
          ) || {};


        var ko =
          rows.find(
            function(row) {
              return (
                String(row.lang)
                  .toUpperCase() ===
                'KO'
              );
            }
          ) || {};

        
var chunks = [];

for (var i = 1; i <= 5; i++) {

  var enChunk =
    String(en['chunk_' + i] || '').trim();

  var koChunk =
    String(ko['chunk_' + i] || '').trim();

  if (enChunk || koChunk) {

    chunks.push(
      '<span style="margin-right:12px;">' +
      '<strong>' + enChunk + '</strong>' +
      ' — ' +
      koChunk +
      '</span>'
    );
  }
}

var chunkHtml =
  chunks.join('');

        content.innerHTML = `
          <div style="
            background:white;
            padding:18px;
            border-radius:12px;
          ">

            <div style="
              font-weight:700;
              margin-bottom:8px;
            ">
              ${recordId}
            </div>

            <div style="
              font-size:18px;
              line-height:1.6;
              margin-bottom:8px;
            ">
              ${en.passage || ''}
</div>

<div style="
  margin:5px 0 10px;
  font-size:13px;
  line-height:1.7;
  color:#374151;
">
  ${chunkHtml}
</div>

<div style="
  font-size:16px;
              line-height:1.6;
              color:#4b5563;
              margin-bottom:18px;
            ">
              ${ko.passage || ''}
            </div>

            <div style="
              font-size:18px;
              font-weight:700;
              margin-bottom:12px;
            ">
              ${en.question || ''}
            </div>

            <div>1. ${en.option_1 || ''}</div>
            <div>2. ${en.option_2 || ''}</div>
            <div>3. ${en.option_3 || ''}</div>
            <div>4. ${en.option_4 || ''}</div>

          </div>
        `;

      } catch (error) {

        console.error(
          '[BIBLENEW]',
          error
        );

        content.innerHTML =
          'Bible data load failed.';
      }
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
  

})();
