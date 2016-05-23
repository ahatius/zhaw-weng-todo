/**
 * AngularJS application for the TODO project
 */
(function() {
    'use strict';

    var dependencies = [
        'ngResource',
        'uuid',
        'ui.bootstrap',
        'ui-notification',
        'ui.bootstrap.showErrors',
        'angular-loading-bar'
    ];


    angular.module('todo', dependencies);

    angular.module('todo').constant('todoConfig', {
        apiPath: 'http://zhaw-weng-api.herokuapp.com/api/'
    })
})();