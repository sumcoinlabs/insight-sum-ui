'use strict';

var TRANSACTION_DISPLAYED = 10;
var BLOCKS_DISPLAYED = 5;
var BLOCKS_FOR_TX_SEED = 10;

angular.module('insight.system').controller('IndexController',
  function($scope, Global, getSocket, Blocks, TransactionsByBlock) {

    $scope.global = Global;

    var socketStarted = false;
    var transactionsSeeded = false;

    function hasTx(txid) {
      for (var i = 0; i < $scope.txs.length; i++) {
        if ($scope.txs[i].txid === txid) return true;
      }
      return false;
    }

    function addTx(tx, prepend) {
      if (!tx || !tx.txid || hasTx(tx.txid)) return;

      if (prepend) {
        $scope.txs.unshift(tx);
      } else {
        $scope.txs.push(tx);
      }

      if ($scope.txs.length > TRANSACTION_DISPLAYED) {
        $scope.txs = $scope.txs.slice(0, TRANSACTION_DISPLAYED);
      }
    }

    function seedTransactions(blocks) {
      var i = 0;

      function next() {
        if ($scope.txs.length >= TRANSACTION_DISPLAYED ||
            i >= blocks.length) {
          return;
        }

        var block = blocks[i++];

        TransactionsByBlock.get({block: block.hash}, function(res) {
          angular.forEach(res.txs || [], function(tx) {
            if ($scope.txs.length < TRANSACTION_DISPLAYED) {
              addTx(tx, false);
            }
          });
          next();
        }, next);
      }

      next();
    }

    function getBlocks(seed) {
      Blocks.get({
        limit: seed ? BLOCKS_FOR_TX_SEED : BLOCKS_DISPLAYED
      }, function(res) {
        var blocks = res.blocks || [];

        $scope.blocks = blocks.slice(0, BLOCKS_DISPLAYED);
        $scope.blocksLength = Math.min(
          res.length || blocks.length,
          BLOCKS_DISPLAYED
        );

        if (seed && !transactionsSeeded) {
          transactionsSeeded = true;
          seedTransactions(blocks);
        }
      });
    }

    var socket = getSocket($scope);

    function startSocket() {
      if (socketStarted) return;
      socketStarted = true;

      socket.emit('subscribe', 'inv');

      socket.on('tx', function(tx) {
        addTx(tx, true);
      });

      socket.on('block', function() {
        getBlocks(false);
      });
    }

    socket.on('connect', startSocket);

    $scope.humanSince = function(time) {
      return moment.unix(time).max().fromNow();
    };

    $scope.index = function() {
      getBlocks(true);
      startSocket();
    };

    $scope.txs = [];
    $scope.blocks = [];
  });
