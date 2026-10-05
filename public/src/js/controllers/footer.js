'use strict';

angular.module('insight.system').controller('FooterController',
  function($scope, $route, $templateCache, gettextCatalog, amMoment,  Version) {

    $scope.defaultLanguage = defaultLanguage;
    document.documentElement.lang = (defaultLanguage === 'de_DE' ? 'de' : defaultLanguage);

    var _getVersion = function() {
      Version.get({},
        function(res) {
          $scope.version = res.version;
        });
    };

    $scope.version = _getVersion();

    $scope.availableLanguages = [{
      name: 'Deutsch',
      isoCode: 'de_DE',
    }, {
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Español',
      isoCode: 'es',
    }, {
      name: 'Japanese',
      isoCode: 'ja',
    }];

    $scope.setLanguage = function(isoCode) {

      localStorage.setItem(
        'insight-language',
        isoCode
      );

      var path = window.location.pathname;

      if (isoCode === 'es') {

        if (!/^\/es(?:\/|$)/.test(path)) {

          var target =
            path === '/' ?
            '/es/' :
            '/es' + path;

          window.location.href = target;
          return;
        }

      } else if (/^\/es(?:\/|$)/.test(path)) {

        var englishPath =
          path.replace(/^\/es/, '');

        if (!englishPath) {
          englishPath = '/';
        }

        window.location.href = englishPath;
        return;
      }

      gettextCatalog.currentLanguage =
        $scope.defaultLanguage =
        defaultLanguage =
        isoCode;

      document.documentElement.lang =
        isoCode === 'de_DE' ?
        'de' :
        isoCode;

      amMoment.changeLocale(isoCode);

      var currentPageTemplate =
        $route.current.templateUrl;

      $templateCache.remove(
        currentPageTemplate
      );

      $route.reload();
    };

  });
