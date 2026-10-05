'use strict';

/* SUMCOIN GLOBAL SOUND BUS START */

(function() {

  /*
   * This object belongs to the browser document, not an Angular
   * controller. Therefore an Angular route refresh cannot kill
   * the confirmation sound while it is playing.
   */

  if (
    window.SumcoinSound &&
    window.SumcoinSound.version === 8
  ) {
    return;
  }


  var state = {

    gestureSeen:
      false,

    pending:
      [],

    diagnosticImages:
      [],

    lastReason: {
      incoming: '',
      success: ''
    }

  };


  /*
   * Send an event into nginx access.log.
   *
   * This is diagnostics ONLY. It does not control playback.
   */
  var log = function(eventName, detail) {

    try {

      var img =
        new Image();

      state.diagnosticImages.push(
        img
      );

      var cleanup =
        function() {

        var i =
          state.diagnosticImages.indexOf(
            img
          );

        if (i !== -1) {
          state.diagnosticImages.splice(
            i,
            1
          );
        }

      };

      img.onload =
        cleanup;

      img.onerror =
        cleanup;


      var active =
        navigator.userActivation ?
        navigator.userActivation.isActive :
        'na';

      var ever =
        navigator.userActivation ?
        navigator.userActivation.hasBeenActive :
        'na';


      img.src =
        '/favicon.ico' +
        '?__sumaudio=1' +
        '&e=' +
        encodeURIComponent(
          eventName
        ) +
        '&d=' +
        encodeURIComponent(
          String(detail || '')
        ) +
        '&active=' +
        encodeURIComponent(active) +
        '&ever=' +
        encodeURIComponent(ever) +
        '&t=' +
        Date.now();

    } catch (e) {}

  };


  var makeAudio =
    function(name, filename) {

    var audio =
      new Audio(
        '/sound/' +
        filename +
        '?audio=8'
      );

    audio.preload =
      'auto';

    audio.muted =
      false;

    audio.defaultMuted =
      false;

    audio.volume =
      1.0;


    audio.addEventListener(
      'canplaythrough',
      function() {

        log(
          name.toUpperCase() +
          '_CANPLAY',

          'ready=' +
          audio.readyState
        );

      }
    );


    audio.addEventListener(
      'playing',
      function() {

        log(
          name.toUpperCase() +
          '_PLAYING',

          state.lastReason[name]
        );

      }
    );


    audio.addEventListener(
      'ended',
      function() {

        log(
          name.toUpperCase() +
          '_ENDED',

          state.lastReason[name]
        );

      }
    );


    audio.addEventListener(
      'error',
      function() {

        log(
          name.toUpperCase() +
          '_MEDIA_ERROR',

          audio.error ?
          audio.error.code :
          'unknown'
        );

      }
    );


    try {
      audio.load();
    } catch (e) {}


    return audio;
  };


  /*
   * These are created ONCE and stay alive for the entire
   * browser document.
   */
  var sounds = {

    incoming:
      makeAudio(
        'incoming',
        'transaction.mp3'
      ),

    success:
      makeAudio(
        'success',
        'success-notification.mp3'
      )

  };



  /* SUMCOIN SOUND TOGGLE STATE START */

  /*
   * OFF on each new browser document.
   *
   * Once enabled it survives Angular route reloads because this
   * global sound bus survives those reloads.
   */
  state.enabled =
    false;


  var setSoundEnabled =
    function(enabled) {

    state.enabled =
      !!enabled;


    if (
      !state.enabled
    ) {

      /*
       * If sounds are deliberately turned off, do not retain a
       * notification waiting for some later interaction.
       */
      state.pending =
        [];

      log(
        'SOUNDS_DISABLED',
        'payment-toggle'
      );

    } else {

      log(
        'SOUNDS_ENABLED',
        'payment-toggle'
      );
    }


    return state.enabled;

  };

  /* SUMCOIN SOUND TOGGLE STATE END */


  var rememberPending =
    function(name, reason) {

    /*
     * Do not endlessly stack copies of the same sound.
     */
    state.pending =
      state.pending.filter(
        function(item) {
          return item.name !== name;
        }
      );

    state.pending.push({
      name:
        name,

      reason:
        reason
    });

  };


  /*
   * Actual live-event playback.
   */
  var play =
    function(name, reason) {

    /*
     * User has explicitly chosen whether payment alerts should
     * be audible.
     */
    if (
      !state.enabled
    ) {

      log(
        name.toUpperCase() +
        '_SKIPPED_DISABLED',

        reason || 'event'
      );

      return false;
    }


    var audio =
      sounds[name];

    if (!audio) {

      log(
        'UNKNOWN_SOUND',
        name
      );

      return false;
    }


    state.lastReason[name] =
      reason || 'event';


    log(
      name.toUpperCase() +
      '_PLAY_REQUEST',

      reason || 'event'
    );


    try {

      audio.muted =
        false;

      audio.defaultMuted =
        false;

      audio.volume =
        1.0;


      try {

        audio.pause();

        audio.currentTime =
          0;

      } catch (e) {}


      var result =
        audio.play();


      if (
        result &&
        result.then
      ) {

        result.then(
          function() {

            log(
              name.toUpperCase() +
              '_PLAY_RESOLVED',

              reason || 'event'
            );

          }
        ).catch(
          function(error) {

            var description =
              error ?
              error.name +
              ':' +
              error.message :
              'unknown';


            log(
              name.toUpperCase() +
              '_PLAY_REJECTED',

              description
            );


            /*
             * If the transaction arrived before the browser has
             * seen any interaction, keep the sound pending.
             *
             * The next completely normal click/tap/key retries it.
             * No enable button or special UI is required.
             */
            if (
              error &&
              error.name ===
              'NotAllowedError'
            ) {

              rememberPending(
                name,
                reason || 'event'
              );
            }

          }
        );

      }

      return true;

    } catch (error) {

      log(
        name.toUpperCase() +
        '_PLAY_EXCEPTION',

        error ?
        error.name +
        ':' +
        error.message :
        'unknown'
      );

      return false;
    }

  };


  /*
   * Silently exercise each audio element during a real user
   * gesture.
   *
   * volume=0 means the user does NOT hear the prime.
   */
  var primeOne =
    function(name, done) {

    var audio =
      sounds[name];

    if (!audio) {

      done();
      return;
    }


    try {

      audio.muted =
        false;

      audio.volume =
        0;

      audio.currentTime =
        0;


      var result =
        audio.play();


      if (
        result &&
        result.then
      ) {

        result.then(
          function() {

            log(
              name.toUpperCase() +
              '_PRIME_RESOLVED',

              ''
            );


            /*
             * Let Chrome genuinely begin playback before
             * resetting it.
             */
            setTimeout(
              function() {

                try {

                  audio.pause();

                  audio.currentTime =
                    0;

                  audio.volume =
                    1.0;

                } catch (e) {}

                done();

              },
              75
            );

          }
        ).catch(
          function(error) {

            audio.volume =
              1.0;


            log(
              name.toUpperCase() +
              '_PRIME_REJECTED',

              error ?
              error.name +
              ':' +
              error.message :
              'unknown'
            );

            done();

          }
        );

      } else {

        audio.volume =
          1.0;

        done();
      }

    } catch (error) {

      audio.volume =
        1.0;

      log(
        name.toUpperCase() +
        '_PRIME_EXCEPTION',

        error ?
        error.message :
        'unknown'
      );

      done();
    }

  };


  var removeGestureListeners =
    function() {

    document.removeEventListener(
      'pointerdown',
      unlock,
      true
    );

    document.removeEventListener(
      'mousedown',
      unlock,
      true
    );

    document.removeEventListener(
      'touchend',
      unlock,
      true
    );

    document.removeEventListener(
      'keydown',
      unlock,
      true
    );

    document.removeEventListener(
      'click',
      unlock,
      true
    );

  };


  /*
   * THIS is the critical part.
   *
   * Any ordinary user interaction anywhere on sumcoin.space
   * primes both existing audio elements.
   *
   * No visible button.
   * No modal.
   * No change to the explorer.
   */
  var unlock =
    function(event) {

    if (
      state.gestureSeen
    ) {
      return;
    }


    state.gestureSeen =
      true;


    log(
      'USER_GESTURE',

      event ?
      event.type :
      'unknown'
    );


    removeGestureListeners();


    var remaining =
      2;


    var complete =
      function() {

      remaining -=
        1;


      if (
        remaining > 0
      ) {
        return;
      }


      log(
        'AUDIO_PRIME_COMPLETE',

        'pending=' +
        state.pending.length
      );


      /*
       * If Chrome rejected an event that happened before the
       * gesture, replay the missed notification now.
       */
      var pending =
        state.pending.slice();

      state.pending =
        [];


      setTimeout(
        function() {

          pending.forEach(
            function(item, index) {

              setTimeout(
                function() {

                  play(
                    item.name,
                    item.reason +
                    '|pending-retry'
                  );

                },
                index * 150
              );

            }
          );

        },
        100
      );

    };


    /*
     * Both play() calls occur synchronously from the trusted
     * gesture handler.
     */
    primeOne(
      'incoming',
      complete
    );

    primeOne(
      'success',
      complete
    );

  };


  document.addEventListener(
    'pointerdown',
    unlock,
    true
  );

  document.addEventListener(
    'mousedown',
    unlock,
    true
  );

  document.addEventListener(
    'touchend',
    unlock,
    true
  );

  document.addEventListener(
    'keydown',
    unlock,
    true
  );

  document.addEventListener(
    'click',
    unlock,
    true
  );


  window.SumcoinSound = {

    version:
      8,

    play:
      play,

    setEnabled:
      setSoundEnabled,

    state:
      state,

    sounds:
      sounds

  };


  log(
    'SOUND_BUS_READY',

    window.location.pathname
  );

})();

/* SUMCOIN GLOBAL SOUND BUS END */



var spanishPath = /^\/es(?:\/|$)/.test(window.location.pathname);

var defaultLanguage = spanishPath ?
  'es' :
  (localStorage.getItem('insight-language') || 'en');

if (spanishPath) {
  localStorage.setItem('insight-language', 'es');
}
var defaultCurrency = localStorage.getItem('insight-currency') || 'SUM';

angular.module('insight',[
  'ngAnimate',
  'ngResource',
  'ngRoute',
  'ngProgress',
  'ui.bootstrap',
  'ui.route',
  'monospaced.qrcode',
  'gettext',
  'angularMoment',
  'insight.system',
  'insight.socket',
  'insight.blocks',
  'insight.transactions',
  'insight.address',
  'insight.search',
  'insight.status',
  'insight.connection',
  'insight.currency',
  'insight.messages'
]);

angular.module('insight.system', []);
angular.module('insight.socket', []);
angular.module('insight.blocks', []);
angular.module('insight.transactions', []);
angular.module('insight.address', []);
angular.module('insight.search', []);
angular.module('insight.status', []);
angular.module('insight.connection', []);
angular.module('insight.currency', []);
angular.module('insight.messages', []);
