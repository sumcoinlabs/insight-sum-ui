'use strict';

angular.module('insight.status').controller('StatusController',
  function($scope, $routeParams, $location, Global,
           Status, Sync, getSocket, $interval) {

    $scope.global = Global;

    var infoTimer = null;
    var syncTimer = null;
    var socketStarted = false;

    function fetchStatus(q) {
      Status.get({q: 'get' + q},
        function(d) {
          $scope.loaded = 1;
          angular.extend($scope, d);
        },
        function(e) {
          $scope.error = 'API ERROR: ' +
            ((e && e.data) || 'Unable to query node');
        });
    }

    function fetchSync() {
      Sync.get({},
        function(sync) {
          $scope.sync = sync;
        },
        function(e) {
          $scope.sync = {
            error: 'Could not get sync information'
          };
        });
    }

    $scope.getStatus = function(q) {
      fetchStatus(q);

      if (q === 'Info' && !infoTimer) {
        infoTimer = $interval(function() {
          fetchStatus('Info');
        }, 5000);
      }
    };

    $scope.humanSince = function(time) {
      if (!time) return '';
      return moment.unix(time / 1000).max().fromNow();
    };

    var socket = getSocket($scope);

    function startSocket() {
      if (socketStarted) return;
      socketStarted = true;

      socket.emit('subscribe', 'sync');

      socket.on('status', function(sync) {
        $scope.sync = sync;
      });
    }

    socket.on('connect', startSocket);

    $scope.getSync = function() {
      fetchSync();
      startSocket();

      if (!syncTimer) {
        syncTimer = $interval(fetchSync, 2000);
      }
    };

    $scope.$on('$destroy', function() {
      if (infoTimer) $interval.cancel(infoTimer);
      if (syncTimer) $interval.cancel(syncTimer);
    });
  });
