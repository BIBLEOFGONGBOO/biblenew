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

})();
