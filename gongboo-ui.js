// SUBBLOCK 0000 : INIT / WRAPPER

(function(){

  var cardPairs = [
    ['systemButton','systemCard'],
    ['langButton','langCard'],
    ['playButton','playCard'],
    ['micButton','micCard'],
    ['moreButton','moreCard']
  ];


  /* SUBBLOCK 0500 : TOOLTIP TEXT */

  var tooltipMap = {

    systemButton:
      'Select learning system',

    psgButton:
      'Show or hide the full scenario',

    langButton:
      'Language settings',

    playButton:
      'Playback and voice settings',

    micButton:
      'Microphone and pronunciation settings',

    moreButton:
      'More learning tools',

    repeatToggle:
      'Repeat playback',

    playAutoToggle:
      'Automatically continue playback',

    playStartButton:
      'Start playback',

    playStopButton:
      'Stop playback',

    micAutoToggle:
      'Automatically continue after pronunciation',

    micStartButton:
      'Start microphone recognition',

    micStopButton:
      'Stop recognition and score',

    chunkToggle:
      'Show or hide learning chunks',

    peopleButton:
      'Bible people',

    mapButton:
      'Bible map',

    prevButton:
      'Previous turn or scenario',

    nextButton:
      'Next turn or scenario'
  };


  Object.keys(
    tooltipMap
  ).forEach(

    function(id){

      var element =
        document.getElementById(id);

      if(!element){
        return;
      }

      element.setAttribute(
        'data-tooltip',
        tooltipMap[id]
      );

      element.setAttribute(
        'aria-label',
        tooltipMap[id]
      );
    }
  );


  var modeTooltip = {
    LRN:'Learning Mode',
    STD:'Study Mode',
    QZ:'Quiz Mode'
  };


  document.querySelectorAll(
    '.gb-mode-button'
  ).forEach(

    function(button){

      var key =
        button.textContent.trim();

      if(
        modeTooltip[key]
      ){

        button.setAttribute(
          'data-tooltip',
          modeTooltip[key]
        );
      }
    }
  );


  document.querySelectorAll(
    '.gb-system-option'
  ).forEach(

    function(button){

      var name =
        button.querySelector(
          '.gb-system-name'
        );

      if(!name){
        return;
      }

      button.setAttribute(
        'data-tooltip',
        'Open ' +
        name.textContent.trim()
      );
    }
  );


  /* SUBBLOCK 1000 : CARD OPEN / CLOSE */

  function closeCards(
    exceptCard
  ){

    cardPairs.forEach(

      function(pair){

        var button =
          document.getElementById(
            pair[0]
          );

        var card =
          document.getElementById(
            pair[1]
          );

        if(
          !button ||
          !card ||
          card === exceptCard
        ){
          return;
        }

        card.hidden =
          true;

        button.setAttribute(
          'aria-expanded',
          'false'
        );

        button.classList.remove(
          'is-active'
        );
      }
    );
  }


  cardPairs.forEach(

    function(pair){

      var button =
        document.getElementById(
          pair[0]
        );

      var card =
        document.getElementById(
          pair[1]
        );

      if(
        !button ||
        !card
      ){
        return;
      }

      button.addEventListener(

        'click',

        function(event){

          event.stopPropagation();

          var opening =
            card.hidden;

          closeCards(
            card
          );

          card.hidden =
            !opening;

          button.setAttribute(
            'aria-expanded',
            opening
              ? 'true'
              : 'false'
          );

          button.classList.toggle(
            'is-active',
            opening
          );
        }
      );


      card.addEventListener(

        'click',

        function(event){

          event.stopPropagation();
        }
      );
    }
  );


  document.addEventListener(

    'click',

    function(){

      closeCards();
    }
  );


  /* SUBBLOCK 1500 : SIMPLE TOGGLE */

  function bindToggle(
    id
  ){

    var button =
      document.getElementById(
        id
      );

    if(!button){
      return;
    }

    button.addEventListener(

      'click',

      function(){

        var current =
          button.getAttribute(
            'aria-pressed'
          ) === 'true';

        button.setAttribute(
          'aria-pressed',
          current
            ? 'false'
            : 'true'
        );
      }
    );
  }


  bindToggle(
    'repeatToggle'
  );

  bindToggle(
    'playAutoToggle'
  );

  bindToggle(
    'micAutoToggle'
  );

  bindToggle(
    'chunkToggle'
  );


  /* SUBBLOCK 2000 : PLAY / STOP */

var playStartButton =
  document.getElementById(
    'playStartButton'
  );

var playStopButton =
  document.getElementById(
    'playStopButton'
  );

var isPlaying =
  false;


function setPlayState(
  playing
){

  isPlaying =
    !!playing;


  if(playStartButton){

    playStartButton.setAttribute(
      'aria-pressed',
      String(isPlaying)
    );
  }


  if(playStopButton){

    playStopButton.setAttribute(
      'aria-pressed',
      String(!isPlaying)
    );
  }
}


if(playStartButton){

  playStartButton.addEventListener(
    'click',
    function(){

      if(
        typeof speakWithDyslexiaSupport ===
        'function'
      ){

        setPlayState(
          true
        );

        speakWithDyslexiaSupport();
      }
    }
  );
}


if(playStopButton){

  playStopButton.addEventListener(
    'click',
    function(){

      if(
        typeof stopSpeech ===
        'function'
      ){

        stopSpeech();
      }


      setPlayState(
        false
      );
    }
  );
}


  /* SUBBLOCK 2500 : MIC START / STOP */

  var micStartButton =
    document.getElementById(
      'micStartButton'
    );

  var micStopButton =
    document.getElementById(
      'micStopButton'
    );


  function setMicState(
    running
  ){

    if(micStartButton){

      micStartButton.setAttribute(
        'aria-pressed',
        running
          ? 'true'
          : 'false'
      );
    }

    if(micStopButton){

      micStopButton.setAttribute(
        'aria-pressed',
        running
          ? 'false'
          : 'true'
      );
    }
  }


  if(micStartButton){

    micStartButton.addEventListener(

      'click',

      function(){

        setMicState(
          true
        );
      }
    );
  }


  if(micStopButton){

    micStopButton.addEventListener(

      'click',

      function(){

        setMicState(
          false
        );
      }
    );
  }


/* SUBBLOCK 3000 : SPEED */

var speedRange =
  document.getElementById(
    'speedRange'
  );

var speedValue =
  document.getElementById(
    'speedValue'
  );


if(
  speedRange &&
  speedValue
){

  function applyConversationSpeed(){

    var value =
      Number(
        speedRange.value
      );


    speedValue.textContent =
      value.toFixed(2) +
      '×';


    var legacySpeed =
      document.getElementById(
        'licenseSpeed'
      );


    if(!legacySpeed){
      return;
    }


    var valueText =
      String(value);


    var optionExists =
      Array.from(
        legacySpeed.options
      ).some(
        function(option){

          return (
            option.value ===
            valueText
          );
        }
      );


    if(!optionExists){

      var option =
        document.createElement(
          'option'
        );

      option.value =
        valueText;

      option.textContent =
        value.toFixed(2) +
        '×';

      legacySpeed.appendChild(
        option
      );
    }


    legacySpeed.value =
      valueText;
  }


  speedRange.addEventListener(
    'input',
    applyConversationSpeed
  );


  applyConversationSpeed();
}


  /* SUBBLOCK 3500 : PASS */

  var passRange =
    document.getElementById(
      'passRange'
    );

  var passValue =
    document.getElementById(
      'passValue'
    );


  if(
    passRange &&
    passValue
  ){

    function renderPass(){

      passValue.textContent =
        passRange.value +
        '%';
    }


    passRange.addEventListener(
      'input',
      renderPass
    );


    renderPass();
  }


  /* SUBBLOCK 4000 : DELAY */

  var delayRange =
    document.getElementById(
      'delayRange'
    );

  var delayValue =
    document.getElementById(
      'delayValue'
    );


  if(
    delayRange &&
    delayValue
  ){

    function renderDelay(){

      delayValue.textContent =
        Number(
          delayRange.value
        ).toFixed(1) +
        's';
    }


    delayRange.addEventListener(
      'input',
      renderDelay
    );


    renderDelay();
  }


  /* SUBBLOCK 4500 : PSG */

/*
  PSG actual behavior is supplied
  by the active system adapter.
*/


  /* SUBBLOCK 5000 : MODE */

  var modeButtons =
    document.querySelectorAll(
      '.gb-mode-button:not(:disabled)'
    );


  modeButtons.forEach(

    function(button){

      button.addEventListener(

        'click',

        function(){

          modeButtons.forEach(

            function(item){

              item.classList.remove(
                'is-active'
              );
            }
          );

          button.classList.add(
            'is-active'
          );
        }
      );
    }
  );


  /* SUBBLOCK 5500 : TURN */

  var turns =
    document.querySelectorAll(
      '.gb-conversation-turn'
    );


  turns.forEach(

    function(turn){

      turn.addEventListener(

        'click',

        function(){

          turns.forEach(

            function(item){

              item.classList.remove(
                'is-current'
              );
            }
          );

          turn.classList.add(
            'is-current'
          );
        }
      );
    }
  );


 /* SUBBLOCK 6000 : KEYBOARD / SPACE PLAY-STOP */

document.addEventListener(
  'keydown',
  function(event){

    var target =
      event.target;


    if(
      target &&
      (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      )
    ){
      return;
    }


    if(
      event.code === 'Space'
    ){

      event.preventDefault();


      if(isPlaying){

        if(
          typeof stopSpeech ===
          'function'
        ){

          stopSpeech();
        }


        setPlayState(
          false
        );

      }else{

        if(
          typeof speakWithDyslexiaSupport ===
          'function'
        ){

          setPlayState(
            true
          );


          speakWithDyslexiaSupport();
        }
      }
    }


    if(
      event.key === 'Escape'
    ){

      closeCards();
    }
  }
);


  // SUBBLOCK 6500 : INITIAL STATE

  setPlayState(
    false
  );

  setMicState(
    false
  );

})();
// SUBBLOCK 6750 : CONVERSATION PSG ADAPTER

var templatePsgButton =
  document.getElementById(
    'psgButton'
  );

var legacyPsgButton =
  document.getElementById(
    'biblePassageToggle'
  );


if (
  templatePsgButton &&
  legacyPsgButton
) {

  templatePsgButton.addEventListener(
    'click',
    function() {

      legacyPsgButton.click();


      var isOn =
        legacyPsgButton.getAttribute(
          'aria-pressed'
        ) === 'true';


      templatePsgButton.setAttribute(
        'aria-pressed',
        String(isOn)
      );
    }
  );
}
// SUBBLOCK 7000 : CONVERSATION PREV / NEXT ADAPTER

var templatePrevButton =
  document.getElementById(
    'prevButton'
  );

var templateNextButton =
  document.getElementById(
    'nextButton'
  );


if (templatePrevButton) {

  templatePrevButton.addEventListener(
    'click',
    function() {

      if (
        typeof go ===
        'function'
      ) {

        go(-1);
      }
    }
  );
}


if (templateNextButton) {

  templateNextButton.addEventListener(
    'click',
    function() {

      if (
        typeof go ===
        'function'
      ) {

        go(1);
      }
    }
  );
}
// SUBBLOCK 7500 : CONVERSATION PLAY AUTO ADAPTER

var templatePlayAuto =
  document.getElementById(
    'playAutoToggle'
  );


if(templatePlayAuto){

  templatePlayAuto.addEventListener(
    'click',
    function(){

      var isOn =
        templatePlayAuto.getAttribute(
          'aria-pressed'
        ) === 'true';


      if(
        window.ANNE_STATE
      ){

        window.ANNE_STATE.auto =
          isOn;
      }


      var legacyPlayAuto =
        document.getElementById(
          'licenseAuto'
        );


      if(legacyPlayAuto){

        legacyPlayAuto.setAttribute(
          'aria-pressed',
          String(isOn)
        );

        legacyPlayAuto.classList.toggle(
          'active',
          isOn
        );

        legacyPlayAuto.textContent =
          isOn
            ? 'AUTO ON'
            : 'AUTO';
      }


      if(
        typeof saveLastSettings ===
        'function'
      ){

        saveLastSettings();
      }
    }
  );


  window.addEventListener(
    'load',
    function(){

      window.setTimeout(
        function(){

          var isOn =
            !!(
              window.ANNE_STATE &&
              window.ANNE_STATE.auto
            );


          templatePlayAuto.setAttribute(
            'aria-pressed',
            String(isOn)
          );

        },
        200
      );
    }
  );
}

// SUBBLOCK 7750 : CONVERSATION REPEAT ADAPTER

var repeatButton =
  document.getElementById(
    'repeatToggle'
  );


window.__gongbooRepeatEnabled =
  false;


if(repeatButton){

  repeatButton.addEventListener(
    'click',
    function(){

      window.__gongbooRepeatEnabled =
        repeatButton.getAttribute(
          'aria-pressed'
        ) === 'true';
    }
  );
}


window.addEventListener(
  'load',
  function(){

    window.setTimeout(
      function(){

        if(
          window.__gongbooRepeatWrapped
        ){
          return;
        }


        if(
          typeof window.readTextsWithHighlight !==
          'function'
        ){
          return;
        }


        var originalReadTextsWithHighlight =
          window.readTextsWithHighlight;


        window.readTextsWithHighlight =
          function(
            items,
            index,
            runId
          ){

            if(
              index >= items.length &&
              window.__gongbooRepeatEnabled
            ){

              window.setTimeout(
                function(){

                  var startButton =
                    document.getElementById(
                      'playStartButton'
                    );


                  var stillPlaying =
                    startButton &&
                    startButton.getAttribute(
                      'aria-pressed'
                    ) === 'true';


                  if(
                    window.__gongbooRepeatEnabled &&
                    stillPlaying &&
                    typeof window.speakWithDyslexiaSupport ===
                    'function'
                  ){

                    window.speakWithDyslexiaSupport();
                  }

                },
                350
              );


              return;
            }


            return originalReadTextsWithHighlight(
              items,
              index,
              runId
            );
          };


        window.__gongbooRepeatWrapped =
          true;

      },
      300
    );
  }
);
// SUBBLOCK 8000 : CONVERSATION MIC ADAPTER

var templateMicStart =
  document.getElementById(
    'micStartButton'
  );

var templateMicStop =
  document.getElementById(
    'micStopButton'
  );

var templateMicAuto =
  document.getElementById(
    'micAutoToggle'
  );

var templatePass =
  document.getElementById(
    'passRange'
  );

var templateDelay =
  document.getElementById(
    'delayRange'
  );


// ============================================================
// PASS
// ============================================================

if(templatePass){

  templatePass.addEventListener(
    'input',
    function(){

      var value =
        Number(
          templatePass.value
        );


      window.__micThreshold =
        value;


      localStorage.setItem(
        'gongboo.anne.micThreshold',
        String(value)
      );


      if(
        typeof saveLastSettings ===
        'function'
      ){
        saveLastSettings();
      }
    }
  );


  if(
    Number.isFinite(
      Number(window.__micThreshold)
    )
  ){

    templatePass.value =
      String(
        window.__micThreshold
      );

    var passValue =
      document.getElementById(
        'passValue'
      );

    if(passValue){

      passValue.textContent =
        window.__micThreshold +
        '%';
    }
  }
}


// ============================================================
// DELAY
// ============================================================

if(templateDelay){

  templateDelay.addEventListener(
    'input',
    function(){

      var value =
        Number(
          templateDelay.value
        );


      window.__micRecognizeDelay =
        value;


      localStorage.setItem(
        'gongboo.anne.micRecognizeDelay',
        String(value)
      );
    }
  );


  if(
    Number.isFinite(
      Number(
        window.__micRecognizeDelay
      )
    )
  ){

    templateDelay.value =
      String(
        window.__micRecognizeDelay
      );

    var delayValue =
      document.getElementById(
        'delayValue'
      );

    if(delayValue){

      delayValue.textContent =
        Number(
          window.__micRecognizeDelay
        ).toFixed(1) +
        's';
    }
  }
}


// ============================================================
// AUTO
// ============================================================

if(templateMicAuto){

  templateMicAuto.setAttribute(
    'aria-pressed',
    String(
      !!window.__micAutoAdvance
    )
  );


  templateMicAuto.addEventListener(
    'click',
    function(){

      var isOn =
        templateMicAuto.getAttribute(
          'aria-pressed'
        ) === 'true';


      window.__micAutoAdvance =
        isOn;


      localStorage.setItem(
        'gongboo.anne.micAutoAdvance',
        String(isOn)
      );
    }
  );
}


// ============================================================
// START
// ============================================================

if(templateMicStart){

  templateMicStart.addEventListener(
    'click',
    function(){

      if(
        typeof turnAnneMicOn ===
        'function'
      ){

        turnAnneMicOn();
      }


      templateMicStart.setAttribute(
        'aria-pressed',
        'true'
      );


      if(templateMicStop){

        templateMicStop.setAttribute(
          'aria-pressed',
          'false'
        );
      }
    }
  );
}


// ============================================================
// STOP
// 기존 MIC의 STOP과 동일:
// 현재까지 인식 → 즉시 확정 / 채점
// MIC 자체는 계속 ON
// ============================================================

if(templateMicStop){

  templateMicStop.addEventListener(
    'click',
    function(){

      if(
        typeof finalizeAnneMicRecognition ===
        'function'
      ){

        finalizeAnneMicRecognition(
          true
        );
      }


      templateMicStop.setAttribute(
        'aria-pressed',
        'true'
      );


      if(templateMicStart){

        templateMicStart.setAttribute(
          'aria-pressed',
          'false'
        );
      }
    }
  );
}

// SUBBLOCK 8250 : MIC CARD POSITION / SIZE
// PLAY 버튼 위치를 덮는 현재 위치 유지
// 카드 가로/세로 약 20% 추가 축소

(function(){

  var micButton =
    document.getElementById(
      'micButton'
    );

  var playButton =
    document.getElementById(
      'playButton'
    );

  var micCard =
    document.getElementById(
      'micCard'
    );


  if(
    !micButton ||
    !playButton ||
    !micCard
  ){
    return;
  }


  function positionMicCard(){

    if(
      micCard.hidden
    ){
      return;
    }


    var playRect =
      playButton.getBoundingClientRect();


    var cardWidth =
      micCard.offsetWidth;


    var left =
      playRect.right -
      cardWidth;


    var top =
      playRect.top;


    left =
      Math.max(
        6,
        left
      );


    micCard.style.position =
      'fixed';


    micCard.style.left =
      Math.round(
        left
      ) + 'px';


    micCard.style.top =
      Math.round(
        top
      ) + 'px';


    micCard.style.right =
      'auto';


    micCard.style.zIndex =
      '5000';
  }


  micButton.addEventListener(
    'click',
    function(){

      window.setTimeout(
        positionMicCard,
        0
      );
    }
  );


  window.addEventListener(
    'resize',
    positionMicCard
  );


  window.addEventListener(
    'scroll',
    positionMicCard,
    true
  );

})();

// SUBBLOCK 8500 : MIC LEGACY BRIDGE / SCORE / HIGHLIGHT

window.addEventListener(
  'load',
  function(){

    // ========================================================
    // 1. 기존 MIC Panel 제거
    // ========================================================

    var oldPanel =
      document.getElementById(
        'anneMicPanel'
      );

    if(oldPanel){
      oldPanel.remove();
    }


    // ========================================================
    // 2. 기존 MAIN 전용 보이지 않는 Bridge Panel
    //
    // 중요:
    // 기존 MAIN이 micCard를 직접 display:block 처리하지 못하게 함.
    // 실제 카드 OPEN/CLOSE는 gongboo-ui.js 0300만 담당.
    // ========================================================

    window.ensureAnneMicPanel =
      function(){

        var bridge =
          document.getElementById(
            'anneMicPanel'
          );


        if(!bridge){

          bridge =
            document.createElement(
              'div'
            );


          bridge.id =
            'anneMicPanel';


          bridge.style.cssText = `
            position:fixed;
            left:-99999px;
            top:-99999px;
            width:1px;
            height:1px;
            overflow:hidden;
            opacity:0;
            pointer-events:none;
          `;


          var scoreStore =
            document.createElement(
              'div'
            );


          scoreStore.id =
            'anneMicScore';


          bridge.appendChild(
            scoreStore
          );


          document.body.appendChild(
            bridge
          );
        }


        return bridge;
      };


    // ========================================================
    // 3. 기존 MAIN의 MIC Panel 위치 함수 무효화
    // 실제 새 카드 위치는 8250이 담당
    // ========================================================

    window.positionAnneMicPanel =
      function(){
        return;
      };


    // ========================================================
    // 4. 점수 → 새 MIC STOP 버튼
    // ========================================================

    window.showAnneMicScore =
      function(
        score,
        passed
      ){

        var scoreStore =
          document.getElementById(
            'anneMicScore'
          );


        if(scoreStore){

          scoreStore.textContent =
            score +
            '% ' +
            (
              passed
                ? 'PASS'
                : 'AGAIN'
            );
        }


        var stopButton =
          document.getElementById(
            'micStopButton'
          );


        if(stopButton){

          stopButton.innerHTML =
            '<span>■ STOP</span>' +
            '<span class="gb-mic-score">' +
            score +
            '%</span>';
        }
      };


    // ========================================================
    // 5. 맞은 단어 Highlight
    // ========================================================

    window.compareAndHighlightCurrentSentence =
      function(
        spokenText,
        sentenceElement
      ){

        if(!sentenceElement){
          return;
        }


        var originalText =
          sentenceElement.dataset.originalText ||
          sentenceElement.textContent ||
          '';


        var originalWords =
          String(
            originalText
          )
          .split(/\s+/)
          .filter(Boolean);


        var spokenWords =
          String(
            spokenText || ''
          )
          .toLowerCase()
          .replace(
            /[^a-z0-9'\s]/g,
            ' '
          )
          .split(/\s+/)
          .filter(Boolean);


        var spokenIndex =
          0;


        sentenceElement.innerHTML =
          originalWords
            .map(
              function(word){

                var normalized =
                  word
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9']/g,
                      ''
                    );


                var foundIndex =
                  spokenWords.indexOf(
                    normalized,
                    spokenIndex
                  );


                if(foundIndex !== -1){

                  spokenIndex =
                    foundIndex + 1;


                  return (
                    '<span class="speech-correct">' +
                    word +
                    '</span>'
                  );
                }


                return (
                  '<span>' +
                  word +
                  '</span>'
                );
              }
            )
            .join(' ');
      };


// SUBBLOCK 8750 : CONVERSATION CHUNK ADAPTER

var templateChunkButton =
  document.getElementById(
    'chunkToggle'
  );


if(templateChunkButton){

  templateChunkButton.addEventListener(
    'click',
    function(){

      if(
        !window.CONVERSATION_STATE ||
        !window.CONVERSATION_STATE.row
      ){
        return;
      }


      var isOn =
        templateChunkButton.getAttribute(
          'aria-pressed'
        ) === 'true';


      window.CONVERSATION_STATE.helpVisible =
        isOn;


      if(
        typeof renderConversationLesson ===
        'function'
      ){

        renderConversationLesson();
      }


      templateChunkButton.setAttribute(
        'aria-pressed',
        String(isOn)
      );
    }
  );
}
    
    console.log(
      '[MIC TEMPLATE] legacy bridge ready'
    );
  }
);



