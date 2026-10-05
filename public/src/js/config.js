'use strict';

angular.module('insight').config(function($routeProvider) {

  $routeProvider

    /* English */

    .when('/block/:blockHash', {
      templateUrl: 'views/block.html',
      title: 'Sumcoin Block '
    })

    .when('/block-index/:blockHeight', {
      controller: 'BlocksController',
      templateUrl: 'views/redirect.html'
    })

    .when('/tx/send', {
      templateUrl: 'views/transaction_sendraw.html',
      title: 'Broadcast Raw Transaction'
    })

    .when('/tx/:txId/:v_type?/:v_index?', {
      templateUrl: 'views/transaction.html',
      title: 'Sumcoin Transaction '
    })

    .when('/', {
      templateUrl: 'views/index.html',
      title: 'Home'
    })

    .when('/blocks', {
      templateUrl: 'views/block_list.html',
      title: 'Sumcoin Blocks'
    })

    .when('/blocks-date/:blockDate/:startTimestamp?', {
      templateUrl: 'views/block_list.html',
      title: 'Sumcoin Blocks '
    })

    .when('/address/:addrStr', {
      templateUrl: 'views/address.html',
      title: 'Sumcoin Address '
    })

    .when('/status', {
      templateUrl: 'views/status.html',
      title: 'Status'
    })

    .when('/messages/verify', {
      templateUrl: 'views/messages_verify.html',
      title: 'Verify Message'
    })

    .when('/api-docs', {
      templateUrl: 'views/api_docs.html',
      title: 'API Documentation'
    })


    /* Spanish */

    .when('/es', {
      templateUrl: 'views/index_es.html',
      title: 'Inicio'
    })

    .when('/es/', {
      templateUrl: 'views/index_es.html',
      title: 'Inicio'
    })

    .when('/es/block/:blockHash', {
      templateUrl: 'views/block.html',
      title: 'Bloque Sumcoin '
    })

    .when('/es/block-index/:blockHeight', {
      controller: 'BlocksController',
      templateUrl: 'views/redirect.html'
    })

    .when('/es/tx/send', {
      templateUrl: 'views/transaction_sendraw_es.html',
      title: 'Transmitir transacción'
    })

    .when('/es/tx/:txId/:v_type?/:v_index?', {
      templateUrl: 'views/transaction.html',
      title: 'Transacción Sumcoin '
    })

    .when('/es/blocks', {
      templateUrl: 'views/block_list.html',
      title: 'Bloques Sumcoin'
    })

    .when('/es/blocks-date/:blockDate/:startTimestamp?', {
      templateUrl: 'views/block_list.html',
      title: 'Bloques Sumcoin '
    })

    .when('/es/address/:addrStr', {
      templateUrl: 'views/address.html',
      title: 'Dirección Sumcoin '
    })

    .when('/es/status', {
      templateUrl: 'views/status.html',
      title: 'Estado'
    })

    .when('/es/messages/verify', {
      templateUrl: 'views/messages_verify_es.html',
      title: 'Verificar mensaje'
    })

    .when('/es/api-docs', {
      templateUrl: 'views/api_docs_es.html',
      title: 'Documentación API'
    })

    .otherwise({
      templateUrl: 'views/404.html',
      title: 'Error'
    });
});


angular.module('insight')
  .config(function($locationProvider) {

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');

  })

  .run(function(
    $rootScope,
    $route,
    $location,
    $routeParams,
    $anchorScroll,
    ngProgress,
    gettextCatalog,
    amMoment
  ) {

    gettextCatalog.currentLanguage = defaultLanguage;
    amMoment.changeLocale(defaultLanguage);

    $rootScope.languagePrefix =
      defaultLanguage === 'es' ?
      '/es' : '';

    document.documentElement.lang =
      defaultLanguage === 'es' ?
      'es' :
      (
        defaultLanguage === 'de_DE' ?
        'de' :
        defaultLanguage
      );


    $rootScope.$on(
      '$routeChangeStart',
      function() {
        ngProgress.start();
      }
    );


    $rootScope.$on(
      '$routeChangeSuccess',
      function() {

        ngProgress.complete();

        if (/^\/es(?:\/|$)/.test($location.path())) {
          defaultLanguage = 'es';

          localStorage.setItem(
            'insight-language',
            'es'
          );

          gettextCatalog.currentLanguage = 'es';
          amMoment.changeLocale('es');

          $rootScope.languagePrefix = '/es';
          document.documentElement.lang = 'es';
        }

        $rootScope.titleDetail = '';
        $rootScope.title = $route.current.title;
        $rootScope.isCollapsed = true;
        $rootScope.currentAddr = null;

        $location.hash(
          $routeParams.scrollTo
        );

        $anchorScroll();
      }
    );

  });
