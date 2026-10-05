'use strict';

angular.module('insight.address').controller('AddressController',
  function($scope, $rootScope, $routeParams, $location, $http, $route, Global, Address, getSocket) {
    $scope.global = Global;

    var socket = getSocket($scope);
    var addrStr = $routeParams.addrStr;

    /* SUMCOIN SOUND TOGGLE CONTROLLER START */

    $scope.paymentSoundsEnabled =
      !!(
        window.SumcoinSound &&
        window.SumcoinSound.state &&
        window.SumcoinSound.state.enabled
      );


    $scope.togglePaymentSounds =
      function() {

      var next =
        !$scope.paymentSoundsEnabled;


      if (
        !window.SumcoinSound ||
        !window.SumcoinSound.setEnabled
      ) {

        console.error(
          'SumcoinSound audio system is unavailable.'
        );

        return;
      }


      $scope.paymentSoundsEnabled =
        window.SumcoinSound.setEnabled(
          next
        );

    };

    /* SUMCOIN SOUND TOGGLE CONTROLLER END */



    /*
     * Clean Sumcoin live-payment controller.
     *
     * 0 confirmations:
     *   incoming tone + Payment on the way
     *
     * first confirmation:
     *   success tone + Payment received + Angular refresh
     *
     * confirmations 2-6:
     *   update confirmation number in-place
     *
     * after six:
     *   stop tracking
     */

    var PAYMENT_KEY =
      'sumcoin-live-payment-v3:' + addrStr;

    var paymentCheckRunning =
      false;

    var paymentOverlayTimer =
      null;


    /* ------------------------------------------------------ */
    /* AUDIO                                                  */
    /* ------------------------------------------------------ */

    /*
     * Audio lives globally in app.js so Angular route reloads
     * cannot destroy a sound that is playing.
     */
    var _playAudio =
      function(name) {

      if (
        window.SumcoinSound &&
        window.SumcoinSound.play
      ) {

        window.SumcoinSound.play(
          name,

          name === 'incoming' ?
          'address-transaction-received' :
          'first-confirmation'
        );

      } else {

        console.error(
          'SumcoinSound global audio bus is missing.'
        );
      }

    };


    /* ------------------------------------------------------ */
    /* TRACKING                                               */
    /* ------------------------------------------------------ */

    var _readTrack = function() {

      try {

        var raw =
          sessionStorage.getItem(
            PAYMENT_KEY
          );

        return raw ?
          JSON.parse(raw) :
          null;

      } catch (e) {

        return null;
      }

    };


    var _writeTrack = function(track) {

      try {

        sessionStorage.setItem(
          PAYMENT_KEY,
          JSON.stringify(track)
        );

      } catch (e) {}

    };


    var _clearTrack = function() {

      try {

        sessionStorage.removeItem(
          PAYMENT_KEY
        );

      } catch (e) {}

    };


    var _sumToAddress = function(tx) {

      var total =
        0;

      angular.forEach(
        tx.vout || [],
        function(output) {

          var script =
            output.scriptPubKey || {};

          var addresses =
            script.addresses || [];

          var match =
            false;

          if (
            addresses.indexOf(
              addrStr
            ) !== -1
          ) {
            match = true;
          }

          if (
            script.address ===
            addrStr
          ) {
            match = true;
          }

          if (
            output.addr ===
            addrStr
          ) {
            match = true;
          }

          if (match) {

            total +=
              Number(
                output.value || 0
              );
          }

        }
      );

      return total;
    };


    var _fetchTx =
      function(txid, ok, fail) {

      $http.get(
        window.apiPrefix +
        '/tx/' +
        txid +
        '?_=' +
        Date.now()
      )
      .then(
        function(response) {

          ok(
            response.data || {}
          );

        },
        function() {

          if (fail) {
            fail();
          }
        }
      );

    };


    /* ------------------------------------------------------ */
    /* FORMATTING                                             */
    /* ------------------------------------------------------ */

    var _isSpanish = function() {

      return /^\/es(?:\/|$)/.test(
        window.location.pathname
      );

    };


    var _formatSUM = function(amount) {

      return Number(
        amount || 0
      ).toLocaleString(
        'en-US',
        {
          minimumFractionDigits: 6,
          maximumFractionDigits: 6
        }
      ) + ' SUM';

    };


    var _formatUSD = function(amount) {

      var rate =
        $rootScope.currency &&
        $rootScope.currency.rateMap &&
        $rootScope.currency.rateMap.USD;

      if (
        !rate ||
        !Number(rate.n)
      ) {
        return '';
      }

      return (
        '$' +
        (
          Number(amount || 0) *
          Number(rate.n)
        ).toLocaleString(
          'en-US',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        )
      );

    };


    /* ------------------------------------------------------ */
    /* OVERLAY                                                */
    /* ------------------------------------------------------ */

    var _removeOverlay = function() {

      if (
        paymentOverlayTimer
      ) {

        clearTimeout(
          paymentOverlayTimer
        );

        paymentOverlayTimer =
          null;
      }

      var old =
        document.getElementById(
          'sumcoin-payment-overlay'
        );

      if (
        old &&
        old.parentNode
      ) {

        old.parentNode.removeChild(
          old
        );
      }

    };


    var _showOverlay =
      function(mode, track, confirmations) {

      _removeOverlay();

      var spanish =
        _isSpanish();

      var incoming =
        mode === 'incoming';

      var overlay =
        document.createElement(
          'div'
        );

      overlay.id =
        'sumcoin-payment-overlay';

      overlay.style.cssText =
        'position:fixed;' +
        'z-index:2147483647;' +
        'left:0;' +
        'top:0;' +
        'right:0;' +
        'bottom:0;' +
        'display:flex;' +
        'align-items:center;' +
        'justify-content:center;' +
        'background:rgba(240,246,254,.94);' +
        'backdrop-filter:blur(3px);' +
        '-webkit-backdrop-filter:blur(3px);' +
        'opacity:0;' +
        'transition:opacity .20s ease;' +
        'font-family:inherit;';

      var card =
        document.createElement(
          'div'
        );

      card.style.cssText =
        'position:relative;' +
        'width:410px;' +
        'max-width:calc(100vw - 42px);' +
        'background:#fff;' +
        'border:1px solid #d9e2ec;' +
        'border-top:5px solid #1f6fd2;' +
        'border-radius:14px;' +
        'box-shadow:0 20px 60px rgba(16,73,142,.20);' +
        'padding:32px 36px 29px;' +
        'text-align:center;' +
        'transform:translateY(8px) scale(.98);' +
        'transition:transform .22s ease;';

      var title =
        incoming ?
        (
          spanish ?
          'Pago en camino' :
          'Payment on the way'
        ) :
        (
          spanish ?
          'Pago recibido' :
          'Payment received'
        );

      var footer;

      if (incoming) {

        footer =
          spanish ?
          'Esperando confirmación…' :
          'Waiting for confirmation…';

      } else if (
        confirmations === 1
      ) {

        footer =
          spanish ?
          '1 confirmación' :
          '1 confirmation';

      } else {

        footer =
          confirmations +
          (
            spanish ?
            ' confirmaciones' :
            ' confirmations'
          );
      }

      var usd =
        _formatUSD(
          track.amountSUM
        );

      var badge =
        incoming ?
        '→' :
        '✓';

      card.innerHTML =

        '<div style="' +
          'position:relative;' +
          'width:72px;' +
          'height:72px;' +
          'margin:0 auto 18px;' +
        '">' +

          '<img ' +
            'src="/img/icons/sumcoin-logo-192.png" ' +
            'alt="Sumcoin" ' +
            'style="' +
              'display:block;' +
              'width:72px;' +
              'height:72px;' +
              'object-fit:contain;' +
            '">' +

          '<div style="' +
            'position:absolute;' +
            'right:-3px;' +
            'bottom:-3px;' +
            'width:24px;' +
            'height:24px;' +
            'line-height:24px;' +
            'border-radius:50%;' +
            'background:#1f6fd2;' +
            'color:#fff;' +
            'font-size:14px;' +
            'font-weight:700;' +
            'border:3px solid #fff;' +
          '">' +
            badge +
          '</div>' +

        '</div>' +

        '<div style="' +
          'font-size:25px;' +
          'line-height:1.2;' +
          'font-weight:700;' +
          'color:#10498e;' +
          'margin-bottom:17px;' +
        '">' +
          title +
        '</div>' +

        '<div style="' +
          'font-size:26px;' +
          'line-height:1.25;' +
          'font-weight:700;' +
          'color:#344054;' +
        '">' +
          _formatSUM(
            track.amountSUM
          ) +
        '</div>' +

        (
          usd ?
          '<div style="' +
            'font-size:21px;' +
            'line-height:1.25;' +
            'font-weight:500;' +
            'color:#1559ad;' +
            'margin-top:5px;' +
          '">' +
            usd +
          '</div>' :
          ''
        ) +

        '<div style="' +
          'height:1px;' +
          'background:#e9eef5;' +
          'margin:22px 12px 17px;' +
        '"></div>' +

        '<div style="' +
          'font-size:14px;' +
          'color:#667085;' +
        '">' +
          footer +
        '</div>';


      var close =
        document.createElement(
          'button'
        );

      close.type =
        'button';

      close.id =
        'sumcoin-payment-close';

      close.innerHTML =
        '&times;';

      close.setAttribute(
        'aria-label',
        spanish ?
        'Cerrar' :
        'Close'
      );

      close.style.cssText =
        'position:absolute;' +
        'top:10px;' +
        'right:13px;' +
        'width:34px;' +
        'height:34px;' +
        'padding:0;' +
        'border:0;' +
        'outline:none;' +
        'background:transparent;' +
        'color:#98a2b3;' +
        'font-size:29px;' +
        'font-weight:300;' +
        'line-height:30px;' +
        'cursor:pointer;';

      close.onclick =
        function(event) {

          event.preventDefault();
          event.stopPropagation();

          _removeOverlay();
        };

      card.appendChild(
        close
      );

      overlay.appendChild(
        card
      );

      document.body.appendChild(
        overlay
      );

      overlay.offsetHeight;

      overlay.style.opacity =
        '1';

      card.style.transform =
        'translateY(0) scale(1)';


      /*
       * Exactly ten seconds unless the user presses X.
       */
      paymentOverlayTimer =
        setTimeout(
          function() {

            paymentOverlayTimer =
              null;

            overlay.style.opacity =
              '0';

            setTimeout(
              function() {

                if (
                  overlay.parentNode
                ) {

                  overlay.parentNode.removeChild(
                    overlay
                  );
                }

              },
              380
            );

          },
          10000
        );

    };


    /* ------------------------------------------------------ */
    /* NEW PAYMENT                                            */
    /* ------------------------------------------------------ */

    var _trackIncoming =
      function(txid) {

      /*
       * Track IMMEDIATELY. Do not wait for Insight's tx lookup.
       */
      var track = {

        txid:
          txid,

        amountSUM:
          0,

        lastConfirmation:
          0,

        incomingShown:
          false,

        started:
          Date.now()

      };

      _writeTrack(
        track
      );


      var resolve =
        function(attempt) {

        _fetchTx(
          txid,

          function(tx) {

            var current =
              _readTrack();

            if (
              !current ||
              current.txid !== txid
            ) {
              return;
            }

            var amount =
              _sumToAddress(
                tx
              );

            if (
              amount > 0
            ) {

              current.amountSUM =
                amount;

              if (
                !current.incomingShown &&
                Number(
                  tx.confirmations || 0
                ) < 1
              ) {

                current.incomingShown =
                  true;

                _writeTrack(
                  current
                );

                _showOverlay(
                  'incoming',
                  current,
                  0
                );

              } else {

                _writeTrack(
                  current
                );
              }

              return;
            }


            if (
              attempt < 40
            ) {

              setTimeout(
                function() {

                  resolve(
                    attempt + 1
                  );

                },
                300
              );
            }

          },

          function() {

            if (
              attempt < 40
            ) {

              setTimeout(
                function() {

                  resolve(
                    attempt + 1
                  );

                },
                300
              );
            }

          }
        );

      };


      resolve(0);

    };


    /* ------------------------------------------------------ */
    /* BLOCK / CONFIRMATION                                   */
    /* ------------------------------------------------------ */

    var _checkConfirmation =
      function() {

      if (
        paymentCheckRunning
      ) {
        return;
      }

      var track =
        _readTrack();

      if (
        !track ||
        !track.txid
      ) {
        return;
      }

      paymentCheckRunning =
        true;


      var poll =
        function(attempt) {

        _fetchTx(
          track.txid,

          function(tx) {

            var current =
              _readTrack();

            if (
              !current ||
              current.txid !== track.txid
            ) {

              paymentCheckRunning =
                false;

              return;
            }

            track =
              current;

            var confirmations =
              Number(
                tx.confirmations || 0
              );

            var previous =
              Number(
                track.lastConfirmation || 0
              );


            /*
             * Insight may need a moment after the block event.
             */
            if (
              confirmations <= previous
            ) {

              if (
                attempt < 30
              ) {

                setTimeout(
                  function() {

                    poll(
                      attempt + 1
                    );

                  },
                  400
                );

              } else {

                paymentCheckRunning =
                  false;
              }

              return;
            }


            if (
              confirmations > 6
            ) {

              _clearTrack();

              paymentCheckRunning =
                false;

              return;
            }


            var amount =
              _sumToAddress(
                tx
              );

            if (
              amount > 0
            ) {

              track.amountSUM =
                amount;
            }


            var first =
              previous < 1 &&
              confirmations >= 1;


            track.lastConfirmation =
              confirmations;


            if (
              confirmations >= 6
            ) {

              _clearTrack();

            } else {

              _writeTrack(
                track
              );
            }


            if (first) {

              /*
               * First confirmation:
               * success card + success tone + fresh address data.
               */
              _showOverlay(
                'received',
                track,
                confirmations
              );

              _playAudio('success');


              setTimeout(
                function() {

                  $route.reload();

                },
                250
              );


              paymentCheckRunning =
                false;

              return;
            }


            /*
             * Confirmations 2 through 6:
             * update ONLY the existing card.
             */
            $rootScope.$broadcast(
              'confirmation:update',
              {

                txid:
                  track.txid,

                confirmations:
                  confirmations

              }
            );


            paymentCheckRunning =
              false;

          },

          function() {

            if (
              attempt < 30
            ) {

              setTimeout(
                function() {

                  poll(
                    attempt + 1
                  );

                },
                400
              );

            } else {

              paymentCheckRunning =
                false;
            }

          }
        );

      };


      /*
       * Give Insight a short head start after the block socket.
       */
      setTimeout(
        function() {

          poll(0);

        },
        900
      );

    };



    var _startSocket = function() {

      socket.on(
        'bitcoind/addresstxid',
        function(data) {

          if (
            data.address === addrStr
          ) {

            /*
             * Existing transaction-card behavior.
             */
            $rootScope.$broadcast(
              'tx',
              data.txid
            );


            /*
             * Start confirmation tracking before anything else.
             */
            _trackIncoming(
              data.txid
            );


            /*
             * Original receive tone.
             */
            _playAudio('incoming');

          }

        }
      );


      socket.emit(
        'subscribe',
        'bitcoind/addresstxid',
        [addrStr]
      );


      /*
       * Block inventory subscription drives confirmations.
       */
      socket.emit(
        'subscribe',
        'inv'
      );


      socket.on(
        'block',
        function() {

          _checkConfirmation();

        }
      );

    };


    var _stopSocket = function () {

      socket.emit(
        'unsubscribe',
        'bitcoind/addresstxid',
        [addrStr]
      );

      socket.emit(
        'unsubscribe',
        'inv'
      );

    };


    socket.on('connect', function() {
      _startSocket();
    });

    $scope.$on('$destroy', function(){
      _stopSocket();
    });

    /*
     * This event comes directly from transactionsController
     * after Insight successfully returned the exact tx object
     * that is being displayed in the transaction card.
     */
        $scope.params = $routeParams;

    $scope.findOne = function() {
      $rootScope.currentAddr = $routeParams.addrStr;
      _startSocket();

      Address.get({
          addrStr: $routeParams.addrStr
        },
        function(address) {
          $rootScope.titleDetail = address.addrStr.substring(0, 7) + '...';
          $rootScope.flashMessage = null;
          $scope.address = address;
        },
        function(e) {
          if (e.status === 400) {
            $rootScope.flashMessage = 'Invalid Address: ' + $routeParams.addrStr;
          } else if (e.status === 503) {
            $rootScope.flashMessage = 'Backend Error. ' + e.data;
          } else {
            $rootScope.flashMessage = 'Address Not Found';
          }
          $location.path(
        /^\/es(?:\/|$)/.test($location.path()) ?
          '/es/' :
          '/'
      );
        });
    };

  });
