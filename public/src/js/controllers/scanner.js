'use strict';

angular.module('insight.system').controller('ScannerController',
  function($scope, $rootScope, $modalInstance, Global, $timeout) {

    $scope.global = Global;
    $scope.scannerLoading = false;
    $scope.scannerError = '';

    $scope.cameraAvailable = !!(
      window.isSecureContext &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );

    var video;
    var canvas;
    var context;
    var fileInput;
    var stream = null;
    var scanTimer = null;
    var stopped = false;

    function visibleSearchInput() {
      var inputs = document.querySelectorAll('#search');

      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].offsetParent !== null) return inputs[i];
      }

      return inputs.length ? inputs[0] : null;
    }

    function submitResult(data) {
      if (!data) return;

      var value = String(data).trim()
        .replace(/^sumcoin:/i, '')
        .split('?')[0];

      stopScanner();

      var input = visibleSearchInput();

      if (!input) {
        window.location.href =
          /^\/es(?:\/|$)/.test(window.location.pathname) ?
            '/es/' :
            '/';
        return;
      }

      var form = input.form;

      angular.element(input)
        .val(value)
        .triggerHandler('input')
        .triggerHandler('change');

      if (form) {
        angular.element(form).triggerHandler('submit');
      }
    }

    function decodeCanvas() {
      try {
        qrcode.width = canvas.width;
        qrcode.height = canvas.height;
        qrcode.imagedata = context.getImageData(
          0, 0, canvas.width, canvas.height
        );
        qrcode.decode();
      } catch (e) {
        return false;
      }

      return true;
    }

    function scanVideo() {
      if (stopped || !stream || !video) return;

      if (video.readyState >= 2) {
        canvas.width = 640;
        canvas.height = 480;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        decodeCanvas();
      }

      scanTimer = $timeout(scanVideo, 500);
    }

    function scanFile(evt) {
      var files = evt.target.files;
      if (!files || !files.length) return;

      var file = files[0];

      if (file.type.indexOf('image/') !== 0) {
        $scope.$applyAsync(function() {
          $scope.scannerError = 'Please choose an image containing a QR code.';
        });
        return;
      }

      $scope.$applyAsync(function() {
        $scope.scannerLoading = true;
        $scope.scannerError = '';
      });

      var reader = new FileReader();

      reader.onload = function(e) {
        var image = new Image();

        image.onload = function() {
          var max = 900;
          var scale = Math.min(
            max / image.width,
            max / image.height,
            1
          );

          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          context.drawImage(
            image, 0, 0,
            canvas.width, canvas.height
          );

          try {
            if (!decodeCanvas()) throw new Error('decode failed');
          } catch (err) {
            $scope.$applyAsync(function() {
              $scope.scannerLoading = false;
              $scope.scannerError =
                'No QR code could be read from that image.';
            });
          }
        };

        image.src = e.target.result;
      };

      reader.readAsDataURL(file);
    }

    function startCamera() {
      if (!$scope.cameraAvailable) return;

      navigator.mediaDevices.getUserMedia({
        video: {facingMode: {ideal: 'environment'}},
        audio: false
      }).then(function(s) {
        stream = s;
        video.srcObject = stream;
        return video.play();
      }).then(function() {
        scanVideo();
      }).catch(function(err) {
        $scope.$applyAsync(function() {
          $scope.cameraAvailable = false;
          $scope.scannerError =
            'Camera access was unavailable. You can still choose a QR image below.';
        });
      });
    }

    function stopScanner() {
      if (stopped) return;
      stopped = true;

      if (scanTimer) {
        $timeout.cancel(scanTimer);
        scanTimer = null;
      }

      if (stream) {
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
        stream = null;
      }

      if (fileInput) {
        fileInput.removeEventListener('change', scanFile, false);
      }

      $scope.scannerLoading = false;
      $modalInstance.close();
    }

    qrcode.callback = function(data) {
      $scope.$applyAsync(function() {
        submitResult(data);
      });
    };

    $scope.cancel = stopScanner;

    $modalInstance.opened.then(function() {
      $rootScope.isCollapsed = true;

      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        video = document.getElementById('qrcode-scanner-video');
        fileInput = document.getElementById('qrcode-camera');

        if (!canvas) return;

        context = canvas.getContext('2d');

        if (fileInput) {
          fileInput.addEventListener('change', scanFile, false);
        }

        startCamera();
      }, 250);
    });

    $scope.$on('$destroy', function() {
      if (!stopped) {
        if (scanTimer) $timeout.cancel(scanTimer);

        if (stream) {
          stream.getTracks().forEach(function(track) {
            track.stop();
          });
        }
      }
    });
  });
