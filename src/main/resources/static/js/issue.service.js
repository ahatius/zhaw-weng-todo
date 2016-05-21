(function() {
    'use strict';

    angular.module('todo').factory('issueService', ['$http', 'todoConfig', issueService]);

    function issueService($http, todoConfig) {
        var api = todoConfig.apiPath + 'project/';

        var issueService = {
            get: get,
            update: update,
            add: add,
            remove: remove,
            orderByDate: orderByDate
        };

        return issueService;

        /**
         * Retrieves all issues for a project
         * @param projectId The project id to load the issues for
         * @returns {*} Returns an promise that will contain issues for the provided project
         */
        function get(projectId) {
            return $http.get(api + projectId + '/issues').then(function (issues) {
                return orderByDate(issues.data);
            });
        }

        /**
         * Replaces the issue on the server with the one provided
         * @param projectId The project to which the issue belongs to
         * @param issue The issue that should replace the issue on the server
         * @returns {*} Returns a promise that will contain the updated issue
         */
        function update(projectId, issue) {
            var issueId = issue.id;

            return $http.put(api + projectId + '/issues/' + issueId, issue);
        }

        /**
         * Creates a new issue on the server
         * @param projectId The project to create this issue for
         * @param issue The issue that should be saved on the server
         * @returns {*} Returns a promise that will contain the created issue
         */
        function add(projectId, issue) {
            return $http.post(api + projectId + '/issues', issue);
        }

        /**
         * Removes a issue from the server
         * @param projectId The project id to which this issue belongs to
         * @param issueId The id of the issue that should be deleted
         * @returns {*} Returns a promise for when the deletion on the server has completed
         */
        function remove(projectId, issueId) {
            return $http.delete(api + projectId + '/issues/' + issueId);
        }

        /**
         * Orders the provided issues by their due date (ascending)
         * @param issues The issues that should be sorted
         * @returns {Array.<T>} Returns an array of issues that was sorted by their due dates (ascending)
         */
        function orderByDate(issues) {
            return issues.sort(function (a, b) {
                return new Date(a.due_date) - new Date(b.due_date);
            });
        }
    }
})();