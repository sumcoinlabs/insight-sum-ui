'use strict';

angular.module('insight.currency').controller('CurrencyController',
  function($scope, $rootScope, Currency) {

    var COUNTRY_CURRENCY = {
      US:'USD',
      AT:'EUR', BE:'EUR', CY:'EUR', DE:'EUR', EE:'EUR', ES:'EUR',
      FI:'EUR', FR:'EUR', GR:'EUR', HR:'EUR', IE:'EUR', IT:'EUR',
      LT:'EUR', LU:'EUR', LV:'EUR', MT:'EUR', NL:'EUR', PT:'EUR',
      SI:'EUR', SK:'EUR',
      JP:'JPY',
      CZ:'CZK',
      DK:'DKK',
      GB:'GBP',
      HU:'HUF',
      PL:'PLN',
      RO:'RON',
      SE:'SEK',
      CH:'CHF',
      LI:'CHF',
      IS:'ISK',
      NO:'NOK',
      TR:'TRY',
      AU:'AUD',
      BR:'BRL',
      CA:'CAD',
      CN:'CNY',
      HK:'HKD',
      ID:'IDR',
      IL:'ILS',
      IN:'INR',
      KR:'KRW',
      MX:'MXN',
      MY:'MYR',
      NZ:'NZD',
      PH:'PHP',
      SG:'SGD',
      TH:'THB',
      ZA:'ZAR'
    };

    /*
     * Only use real/common currency symbols here.
     * If a currency does not have a useful distinct symbol,
     * the formatter falls back to the ISO code.
     */
    var FIAT_SYMBOLS = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      KRW: '₩',
      INR: '₹',
      RUB: '₽',
      TRY: '₺',
      BRL: 'R$',
      CAD: 'C$',
      AUD: 'A$',
      NZD: 'NZ$',
      HKD: 'HK$',
      SGD: 'S$',
      MXN: 'MX$',
      CRC: '₡',
      ILS: '₪',
      PHP: '₱',
      THB: '฿',
      PLN: 'zł',
      CZK: 'Kč',
      HUF: 'Ft',
      IDR: 'Rp',
      MYR: 'RM',
      ZAR: 'R'
    };

    var storedCurrency =
      localStorage.getItem('insight-currency');

    $rootScope.currency.symbol =
      storedCurrency || 'SUM';

    $rootScope.currency.factor = 1;
    $rootScope.currency.rates = [];
    $rootScope.currency.rateMap = {};


    function formatNumber(value, minDecimals, maxDecimals) {
      return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
      });
    }


    function guessCurrency() {
      var locale =
        (navigator.languages && navigator.languages[0]) ||
        navigator.language ||
        '';

      locale = locale.replace('_', '-');

      var parts = locale.split('-');

      var country =
        parts.length > 1 ?
        parts[parts.length - 1].toUpperCase() :
        '';

      return COUNTRY_CURRENCY[country] || 'USD';
    }


    function getRateSymbol(rate) {
      if (!rate) {
        return '';
      }

      /*
       * Prefer an explicit API symbol when it is actually useful.
       */
      if (
        rate.symbol &&
        rate.symbol !== rate.code &&
        String(rate.symbol).trim()
      ) {
        return String(rate.symbol).trim();
      }

      /*
       * Then use our deterministic map.
       */
      if (FIAT_SYMBOLS[rate.code]) {
        return FIAT_SYMBOLS[rate.code];
      }

      /*
       * Some providers include the symbol inside price, e.g.
       * "$1,338.22" or "₡607,061.77".
       */
      var extracted = String(rate.price || '')
        .replace(/[0-9.,\s+\-]/g, '')
        .trim();

      if (
        extracted &&
        extracted !== rate.code
      ) {
        return extracted;
      }

      /*
       * No useful symbol. That's fine.
       */
      return '';
    }


    function setFactor(symbol) {
      if ($rootScope.currency.rateMap[symbol]) {
        $rootScope.currency.factor =
          Number($rootScope.currency.rateMap[symbol].n) || 1;

      } else if (symbol === 'mSUM') {
        $rootScope.currency.factor = 1000;

      } else if (symbol === 'sigmas') {
        $rootScope.currency.factor = 1000000;

      } else {
        $rootScope.currency.factor = 1;
      }
    }


    function formatFiat(value, rate) {
      var amount =
        Number(value) * Number(rate.n);

      var abs = Math.abs(amount);
      var formatted;

      if (abs > 0 && abs < 0.000001) {
        formatted =
          formatNumber(amount, 2, 8);

      } else if (abs > 0 && abs < 0.01) {
        formatted =
          formatNumber(amount, 2, 6);

      } else {
        formatted =
          formatNumber(amount, 2, 2);
      }

      var symbol =
        getRateSymbol(rate);

      if (symbol) {
        return symbol + formatted;
      }

      return formatted + ' ' + rate.code;
    }


    $rootScope.currency.getConvertion = function(value) {
      value = Number(value);

      if (!isFinite(value)) {
        return null;
      }

      var selected =
        this.symbol;

      var rate =
        this.rateMap[selected];

      if (rate) {
        return formatFiat(
          value,
          rate
        );
      }

      if (selected === 'mSUM') {
        return (
          formatNumber(
            value * 1000,
            0,
            5
          ) +
          ' mSUM'
        );
      }

      if (selected === 'sigmas') {
        return (
          formatNumber(
            value * 1000000,
            0,
            0
          ) +
          ' sigmas'
        );
      }

      return (
        formatNumber(
          value,
          0,
          8
        ) +
        ' SUM'
      );
    };


    $scope.setCurrency = function(currency) {
      $rootScope.currency.symbol =
        currency;

      localStorage.setItem(
        'insight-currency',
        currency
      );

      storedCurrency =
        currency;

      setFactor(
        currency
      );
    };


    Currency.get({}, function(res) {

      var data =
        res.data || {};

      var rates =
        data.rates || [];

      /*
       * Emergency USD fallback.
       */
      if (
        !rates.length &&
        data.bitstamp
      ) {
        rates = [{
          code: 'USD',
          n: Number(data.bitstamp),
          name: 'US Dollar',
          symbol: '$',
          price: '$' + data.bitstamp
        }];
      }


      rates.forEach(function(rate) {

        rate.n =
          Number(rate.n);

        rate.symbol =
          getRateSymbol(rate);

      });


      /*
       * USD first, then normal alphabetical ordering.
       */
      rates.sort(function(a, b) {

        if (a.code === 'USD') {
          return -1;
        }

        if (b.code === 'USD') {
          return 1;
        }

        return a.code.localeCompare(
          b.code
        );
      });


      $rootScope.currency.rates =
        rates;

      $rootScope.currency.rateMap =
        {};


      angular.forEach(
        rates,
        function(rate) {
          $rootScope.currency.rateMap[
            rate.code
          ] = rate;
        }
      );


      if (!storedCurrency) {

        var guessed =
          guessCurrency();

        if (
          $rootScope.currency.rateMap[guessed]
        ) {
          $rootScope.currency.symbol =
            guessed;

        } else if (
          $rootScope.currency.rateMap.USD
        ) {
          $rootScope.currency.symbol =
            'USD';
        }

      } else if (
        storedCurrency !== 'SUM' &&
        storedCurrency !== 'mSUM' &&
        storedCurrency !== 'sigmas' &&
        !$rootScope.currency.rateMap[
          storedCurrency
        ]
      ) {

        $rootScope.currency.symbol =
          'USD';
      }


      setFactor(
        $rootScope.currency.symbol
      );

    });

  });
