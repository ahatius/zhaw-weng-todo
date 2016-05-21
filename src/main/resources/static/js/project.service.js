(function() {
    'use strict';

    angular.module('todo').factory('Project', ['$resource', 'todoConfig', Project]);

    function Project($resource, todoConfig) {
        var api = todoConfig.apiPath;

        return $resource(api + 'projects');
    }
})();