(function() {
  'use strict';

  var config = window.BIBLE_SUPABASE_CONFIG || {};
  var baseUrl = String(config.url || '').replace(/\/+$/, '');
  var publishableKey = String(config.publishableKey || '');

  function configured_() {
    return config.enabled === true && !!baseUrl && !!publishableKey;
  }

  function headers_(accessToken) {
    var headers = {
      apikey: publishableKey,
      Accept: 'application/json'
    };

    if (accessToken) {
      headers.Authorization = 'Bearer ' + accessToken;
    }

    return headers;
  }

  function currentAccessToken_() {
    try {
      var user = JSON.parse(
        localStorage.getItem('quiz_current_user_v1') || 'null'
      );

      return String(
        user && user.session_token || ''
      );

    } catch (_) {
      return '';
    }
  }

  async function validAccessToken_() {
    var token = currentAccessToken_();

    if (
      !window.BibleSupabaseAuth ||
      typeof window.BibleSupabaseAuth.getSession !== 'function'
    ) {
      return token;
    }

    var session = await window.BibleSupabaseAuth.getSession();

    if (!session || !session.access_token) {
      return token;
    }

    token = String(session.access_token);

    try {
      var user = JSON.parse(
        localStorage.getItem('quiz_current_user_v1') || 'null'
      );

      if (user && user.session_token !== token) {
        user.session_token = token;

        if (session.refresh_token) {
          user.refresh_token = session.refresh_token;
        }

        localStorage.setItem(
          'quiz_current_user_v1',
          JSON.stringify(user)
        );

        if (
          typeof currentUser === 'object' &&
          currentUser
        ) {
          currentUser.session_token = token;

          if (session.refresh_token) {
            currentUser.refresh_token =
              session.refresh_token;
          }
        }
      }

    } catch (_) {}

    return token;
  }

  function response_(payload, status) {
    return new Response(
      JSON.stringify(payload),
      {
        status: status || 200,
        headers: {
          'Content-Type':
            'application/json;charset=utf-8'
        }
      }
    );
  }

  async function rest_(
    table,
    query,
    signal,
    publicRead
  ) {
    var accessToken =
      publicRead
        ? ''
        : await validAccessToken_();

    var result = await fetch(
      baseUrl +
        '/rest/v1/' +
        table +
        '?' +
        query,
      {
        headers: headers_(accessToken),
        signal: signal
      }
    );

    if (!result.ok) {
      throw new Error(
        'Supabase ' +
          table +
          ' request failed: HTTP ' +
          result.status
      );
    }

    return result.json();
  }

  function encodeStoragePath_(value) {
    return String(value || '')
      .replace(/^\.?\//, '')
      .split('/')
      .map(encodeURIComponent)
      .join('/');
  }

  async function fetchContent_(
    relativePath,
    signal
  ) {
    if (!configured_()) {
      throw new Error(
        'Supabase content storage is not configured.'
      );
    }

    var result =
      await callQuestionFunction_(
        {
          action: 'storage_file',
          path: encodeStoragePath_(
            relativePath
          )
        },
        signal
      );

    if (!result.ok) {
      throw new Error(
        'Supabase content request failed: HTTP ' +
          result.status +
          ' (' +
          relativePath +
          ')'
      );
    }

    return result;
  }

  // ============================================================
  // NEW:
  // record_id 찾기
  // ============================================================

  function getQuestionRecordId_(row) {
    if (!row || typeof row !== 'object') {
      return '';
    }

    var direct =
      row.record_id ||
      row.RECORD_ID ||
      row.recordId ||
      '';

    direct =
      String(direct || '').trim();

    if (direct) {
      return direct;
    }

    var sourceCode =
      String(
        row.source_code ||
        row.SOURCE_CODE ||
        row.subject ||
        row.SUBJECT ||
        ''
      ).trim();

    if (!sourceCode) {
      return '';
    }

    var qNo =
      parseInt(
        row.verse_question_no ||
        row.VERSE_QUESTION_NO ||
        row.question_no ||
        row.QUESTION_NO ||
        row.q_no ||
        row.Q_NO ||
        row.variant_no ||
        row.VARIANT_NO ||
        0,
        10
      );

    if (!qNo || qNo < 1) {
      return '';
    }

    return (
      sourceCode +
      '-Q' +
      String(qNo).padStart(2, '0')
    );
  }

  // ============================================================
  // NEW:
  // bible_question_translations 의 KO 읽기
  // ============================================================

  async function loadKoTranslations_(
    rows,
    signal
  ) {
    var ids = [];
    var seen = {};

    (rows || []).forEach(
      function(row) {
        var id =
          getQuestionRecordId_(row);

        if (!id || seen[id]) {
          return;
        }

        seen[id] = true;
        ids.push(id);
      }
    );

    if (!ids.length) {
      console.warn(
        '[BIBLE KO] record_id not found. Using legacy KO.'
      );

      return {};
    }

    var idList =
      ids
        .map(function(id) {
          return encodeURIComponent(id);
        })
        .join(',');

    var query =
      'select=' +
      [
        'record_id',
        'lang',
        'question',
        'passage',
        'option_1',
        'option_2',
        'option_3',
        'option_4',
        'explanation',
        'chunk_1',
        'chunk_2',
        'chunk_3',
        'chunk_4',
        'chunk_5'
      ].join(',') +
      '&lang=eq.KO' +
      '&record_id=in.(' +
      idList +
      ')' +
      '&limit=' +
      ids.length;

    var rowsKo =
      await rest_(
        'bible_question_translations',
        query,
        signal,
        true
      );

    var map = {};

    (rowsKo || []).forEach(
      function(row) {
        var id =
          String(
            row &&
            row.record_id ||
            ''
          ).trim();

        if (id) {
          map[id] = row;
        }
      }
    );

    console.log(
      '[BIBLE KO] Translation loaded:',
      Object.keys(map).length +
        ' / ' +
        ids.length
    );

    return map;
  }

  // ============================================================
  // NEW:
  // 기존 문제 데이터 위에 새 KO 번역 덮어쓰기
  // ============================================================

  function applyKoTranslation_(
    row,
    ko
  ) {
    if (!row || !ko) {
      return row;
    }

    var next =
      Object.assign({}, row);

    next.Q_KO =
      ko.question ||
      next.Q_KO ||
      next.q_ko ||
      '';

    next.P_KO =
      ko.passage ||
      next.P_KO ||
      next.passage_ko ||
      '';

    next['1_KO'] =
      ko.option_1 ||
      next['1_KO'] ||
      next.option_1_ko ||
      '';

    next['2_KO'] =
      ko.option_2 ||
      next['2_KO'] ||
      next.option_2_ko ||
      '';

    next['3_KO'] =
      ko.option_3 ||
      next['3_KO'] ||
      next.option_3_ko ||
      '';

    next['4_KO'] =
      ko.option_4 ||
      next['4_KO'] ||
      next.option_4_ko ||
      '';

    next.E_KO =
      ko.explanation ||
      next.E_KO ||
      next.explanation_ko ||
      '';

    // lower-case도 같이 맞춰 둔다.
    next.q_ko = next.Q_KO;
    next.passage_ko = next.P_KO;

    next.option_1_ko =
      next['1_KO'];

    next.option_2_ko =
      next['2_KO'];

    next.option_3_ko =
      next['3_KO'];

    next.option_4_ko =
      next['4_KO'];

    next.explanation_ko =
      next.E_KO;

    // CHUNK도 같이 실어 둔다.
    next.CHUNK_1_KO =
      ko.chunk_1 || '';

    next.CHUNK_2_KO =
      ko.chunk_2 || '';

    next.CHUNK_3_KO =
      ko.chunk_3 || '';

    next.CHUNK_4_KO =
      ko.chunk_4 || '';

    next.CHUNK_5_KO =
      ko.chunk_5 || '';

    next.chunk_1_ko =
      next.CHUNK_1_KO;

    next.chunk_2_ko =
      next.CHUNK_2_KO;

    next.chunk_3_ko =
      next.CHUNK_3_KO;

    next.chunk_4_ko =
      next.CHUNK_4_KO;

    next.chunk_5_ko =
      next.CHUNK_5_KO;

    next.RECORD_ID =
      getQuestionRecordId_(row) ||
      ko.record_id ||
      '';

    next.record_id =
      next.RECORD_ID;

    return next;
  }

  // ============================================================
  // NEW:
  // bible-content 응답에 KO 번역 합치기
  // ============================================================

  async function overlayKoTranslations_(
    result,
    signal
  ) {
    if (!result || !result.ok) {
      return result;
    }

    var clone;

    try {
      clone = result.clone();
    } catch (_) {
      return result;
    }

    var text;

    try {
      text = await clone.text();
    } catch (_) {
      return result;
    }

    var data;

    try {
      data = JSON.parse(text);
    } catch (_) {
      return result;
    }

    var rows = null;
    var container = '';

    if (Array.isArray(data)) {
      rows = data;
      container = 'array';

    } else if (
      data &&
      Array.isArray(data.data)
    ) {
      rows = data.data;
      container = 'data';

    } else if (
      data &&
      Array.isArray(data.questions)
    ) {
      rows = data.questions;
      container = 'questions';

    } else if (
      data &&
      Array.isArray(data.items)
    ) {
      rows = data.items;
      container = 'items';
    }

    // total / catalog 같은 응답이면 그대로 반환
    if (!rows || !rows.length) {
      return result;
    }

    try {
      var koMap =
        await loadKoTranslations_(
          rows,
          signal
        );

      if (
        !koMap ||
        !Object.keys(koMap).length
      ) {
        return result;
      }

      var merged =
        rows.map(
          function(row) {
            var recordId =
              getQuestionRecordId_(row);

            if (
              recordId &&
              koMap[recordId]
            ) {
              return applyKoTranslation_(
                row,
                koMap[recordId]
              );
            }

            return row;
          }
        );

      if (container === 'array') {
        data = merged;
      } else {
        data[container] = merged;
      }

      console.log(
        '[BIBLE KO] New translations applied:',
        Object.keys(koMap).length
      );

      return response_(
        data,
        result.status || 200
      );

    } catch (error) {
      // 새 번역 테이블 문제가 있어도 기존 앱은 계속 작동
      console.warn(
        '[BIBLE KO] Translation overlay failed. Legacy KO is used.',
        error
      );

      return result;
    }
  }

  function mapQuestion_(row) {
    return {
      N: row.n,

      SUBJECT:
        row.source_code,

      SOURCE_CODE:
        row.source_code,

      RECORD_ID:
        row.record_id,

      POINT_CODE:
        row.point_code,

      Q_EN:
        row.q_en,

      Q_KO:
        row.q_ko,

      P_EN:
        row.passage_en,

      P_KO:
        row.passage_ko,

      '1_EN':
        row.option_1_en,

      '1_KO':
        row.option_1_ko,

      '2_EN':
        row.option_2_en,

      '2_KO':
        row.option_2_ko,

      '3_EN':
        row.option_3_en,

      '3_KO':
        row.option_3_ko,

      '4_EN':
        row.option_4_en,

      '4_KO':
        row.option_4_ko,

      A:
        row.answer,

      E_EN:
        row.explanation_en,

      E_KO:
        row.explanation_ko
    };
  }

  async function callQuestionFunction_(
    payload,
    signal
  ) {
    var functionName =
      String(
        config.questionFunction ||
        'bible-content'
      );

    var result =
      await fetch(
        baseUrl +
          '/functions/v1/' +
          functionName,
        {
          method: 'POST',

          headers:
            Object.assign(
              {},
              headers_(''),
              {
                'Content-Type':
                  'application/json;charset=utf-8'
              }
            ),

          cache: 'no-store',

          body:
            JSON.stringify(payload),

          signal: signal
        }
      );

    if (!result.ok) {
      return response_(
        {
          status: 'error',

          code:
            'SUPABASE_FUNCTION_ERROR',

          message:
            'The Supabase Bible API returned HTTP ' +
            result.status +
            '.'
        },
        result.status
      );
    }

    return result;
  }

  async function catalog_(
    payload,
    signal
  ) {
    return callQuestionFunction_(
      {
        action: 'catalog',

        sheet:
          String(
            payload &&
            payload.sheet ||
            'BIBLE-OT'
          )
      },
      signal
    );
  }

  async function metMuseumSearch_(
    payload,
    signal
  ) {
    var query =
      String(
        payload &&
        payload.query ||
        ''
      ).trim();

    var letter =
      String(
        payload &&
        payload.letter ||
        ''
      )
      .trim()
      .toUpperCase();

    var limit =
      Math.min(
        100,
        Math.max(
          1,
          parseInt(
            payload &&
            payload.limit,
            10
          ) ||
          30
        )
      );

    var offset =
      Math.max(
        0,
        parseInt(
          payload &&
          payload.offset,
          10
        ) ||
        0
      );

    var parts = [
      'select=met_object_id,title,object_name,culture,period,object_date,year_begin,year_end,region_tags,topic_tags,bible_era_tags,timeline_100y,is_public_domain,object_url,image_small_url,image_original_url,image_status,medium,credit_line',

      'image_status=eq.verified',

      'order=title.asc',

      'limit=' + (limit + 1),

      'offset=' + offset
    ];

    if (query) {
      parts.push(
        'title=ilike.' +
        encodeURIComponent(
          query + '*'
        )
      );

    } else if (
      /^[A-Z]$/.test(letter)
    ) {
      parts.push(
        'title=ilike.' +
        encodeURIComponent(
          letter + '*'
        )
      );
    }

    [
      'era',
      'region',
      'topic'
    ].forEach(
      function(name) {
        var value =
          String(
            payload &&
            payload[name] ||
            ''
          ).trim();

        if (!value) {
          return;
        }

        if (name === 'era') {
          parts.push(
            'bible_era_tags=ilike.' +
            encodeURIComponent(
              '*' +
              value +
              '*'
            )
          );

        } else if (
          name === 'region'
        ) {
          parts.push(
            'region_tags=ilike.' +
            encodeURIComponent(
              '*' +
              value +
              '*'
            )
          );

        } else {
          parts.push(
            'topic_tags=ilike.' +
            encodeURIComponent(
              '*' +
              value +
              '*'
            )
          );
        }
      }
    );

    return rest_(
      'met_museum_objects',
      parts.join('&'),
      signal,
      true
    );
  }

  async function peopleSearch_(
    payload,
    signal
  ) {
    var query =
      String(
        payload.q || ''
      ).trim();

    var limit =
      Math.min(
        100,
        Math.max(
          1,
          parseInt(
            payload.limit,
            10
          ) ||
          30
        )
      );

    var encodedPrefix =
      encodeURIComponent(
        query + '*'
      );

    var peopleRequest =
      rest_(
        'bible_people',

        'select=person_id,canonical_name_en,canonical_name_ko,gender,roles' +

        '&or=(canonical_name_en.ilike.' +
        encodedPrefix +

        ',canonical_name_ko.ilike.' +
        encodedPrefix +
        ')' +

        '&order=canonical_name_en.asc' +

        '&limit=' +
        limit,

        signal
      );

    var aliasesRequest =
      rest_(
        'bible_person_aliases',

        'select=person_id,alias' +

        '&alias=ilike.' +
        encodedPrefix +

        '&order=alias.asc' +

        '&limit=' +
        limit,

        signal
      );

    var results =
      await Promise.all([
        peopleRequest,
        aliasesRequest
      ]);

    var people =
      (results[0] || [])
        .map(
          function(person) {
            return Object.assign(
              {},
              person,
              {
                __name_match: true
              }
            );
          }
        );

    var aliases =
      results[1] || [];

    var aliasIds =
      aliases
        .map(
          function(alias) {
            return String(
              alias.person_id ||
              ''
            );
          }
        )
        .filter(Boolean);

    var known = {};

    people.forEach(
      function(person) {
        known[
          String(
            person.person_id
          )
        ] = true;
      }
    );

    var missingIds =
      aliasIds.filter(
        function(
          personId,
          index
        ) {
          return (
            !known[personId] &&
            aliasIds.indexOf(
              personId
            ) === index
          );
        }
      );

    if (missingIds.length) {
      var aliasPeople =
        await rest_(
          'bible_people',

          'select=person_id,canonical_name_en,canonical_name_ko,gender,roles' +

          '&person_id=in.(' +
          missingIds
            .map(
              encodeURIComponent
            )
            .join(',') +
          ')' +

          '&order=canonical_name_en.asc' +

          '&limit=' +
          limit,

          signal
        );

      people =
        people.concat(
          (aliasPeople || [])
            .map(
              function(person) {
                return Object.assign(
                  {},
                  person,
                  {
                    __name_match: false
                  }
                );
              }
            )
        );
    }

    var aliasById = {};

    aliases.forEach(
      function(alias) {
        var personId =
          String(
            alias.person_id ||
            ''
          );

        if (!personId) {
          return;
        }

        if (!aliasById[personId]) {
          aliasById[personId] = [];
        }

        aliasById[personId]
          .push(alias.alias);
      }
    );

    people =
      people
        .filter(
          function(
            person,
            index,
            all
          ) {
            return (
              all.findIndex(
                function(other) {
                  return (
                    other.person_id ===
                    person.person_id
                  );
                }
              ) === index
            );
          }
        )
        .sort(
          function(
            left,
            right
          ) {
            if (
              !!left.__name_match !==
              !!right.__name_match
            ) {
              return (
                left.__name_match
                  ? -1
                  : 1
              );
            }

            return String(
              left.canonical_name_en ||
              ''
            ).localeCompare(
              String(
                right.canonical_name_en ||
                ''
              )
            );
          }
        )
        .slice(
          0,
          limit
        );

    return response_({
      status: 'success',

      data:
        people.map(
          function(person) {
            return {
              PERSON_ID:
                person.person_id,

              NAME_EN:
                person.canonical_name_en,

              NAME_KO:
                person.canonical_name_ko,

              GENDER:
                person.gender,

              ROLES:
                Array.isArray(
                  person.roles
                )
                  ? person.roles.join('|')
                  : '',

              ALIASES:
                aliasById[
                  person.person_id
                ] ||
                [],

              MATCH_KIND:
                person.__name_match
                  ? 'name'
                  : 'alias'
            };
          }
        )
    });
  }

  async function personDetail_(
    payload,
    signal
  ) {
    var personId =
      String(
        payload.person_id ||
        ''
      ).trim();

    var encodedId =
      encodeURIComponent(
        'eq.' +
        personId
      );

    var results =
      await Promise.all([
        rest_(
          'bible_people',

          'select=*' +
          '&person_id=' +
          encodedId +
          '&limit=1',

          signal
        ),

        rest_(
          'bible_person_aliases',

          'select=*' +
          '&person_id=' +
          encodedId +
          '&order=alias.asc',

          signal
        ),

        rest_(
          'bible_person_references',

          'select=*' +
          '&person_id=' +
          encodedId +
          '&order=source_code.asc',

          signal
        ),

        rest_(
          'bible_relationships',

          'select=*' +

          '&or=(from_id.' +
          encodedId +

          ',to_id.' +
          encodedId +
          ')',

          signal
        )
      ]);

    var person =
      results[0][0];

    if (!person) {
      return response_(
        {
          status: 'error',
          message:
            'Person not found.'
        },
        404
      );
    }

    return response_({
      status: 'success',

      data: {
        person: {
          PERSON_ID:
            person.person_id,

          NAME_EN:
            person.canonical_name_en,

          NAME_KO:
            person.canonical_name_ko,

          GENDER:
            person.gender,

          DESCRIPTION_EN:
            person.description_en,

          DESCRIPTION_KO:
            person.description_ko,

          ROLES:
            Array.isArray(
              person.roles
            )
              ? person.roles.join('|')
              : ''
        },

        aliases:
          results[1].map(
            function(row) {
              return {
                ALIAS:
                  row.alias,

                LANGUAGE:
                  row.language
              };
            }
          ),

        references:
          results[2].map(
            function(row) {
              return {
                SOURCE_CODE:
                  row.source_code,

                REFERENCE_KIND:
                  row.reference_kind,

                IS_KEY:
                  String(
                    row.is_key
                  )
              };
            }
          ),

        relationships:
          results[3].map(
            function(row) {
              return {
                RELATIONSHIP_ID:
                  row.relation_id,

                FROM_ID:
                  row.from_id,

                TO_ID:
                  row.to_id,

                RELATIONSHIP_TYPE:
                  row.relationship_type,

                TYPE:
                  row.relationship_type,

                EVIDENCE_SOURCE_CODES:
                  row.evidence_source_codes
              };
            }
          )
      }
    });
  }

  async function request_(
    payload,
    signal
  ) {
    if (!configured_()) {
      return response_(
        {
          status: 'error',

          code:
            'SUPABASE_NOT_CONFIGURED',

          message:
            'The Supabase preview is not configured yet.'
        },
        503
      );
    }

    var action =
      String(
        payload.action ||
        ''
      );

    if (action === 'catalog') {
      return catalog_(
        payload,
        signal
      );
    }

    if (
      action ===
      'people_search'
    ) {
      return peopleSearch_(
        payload,
        signal
      );
    }

    if (
      action ===
      'person_detail'
    ) {
      return personDetail_(
        payload,
        signal
      );
    }

    // 기존 bible-content에서 먼저 문제를 읽는다.
    var questionResponse =
      await callQuestionFunction_(
        payload,
        signal
      );

    // 그 위에 새 KO translation을 덮는다.
    return overlayKoTranslations_(
      questionResponse,
      signal
    );
  }

  window.BibleSupabaseProvider =
    Object.freeze({
      isConfigured:
        configured_,

      request:
        request_,

      fetchContent:
        fetchContent_,

      metMuseumSearch:
        metMuseumSearch_
    });

})();
