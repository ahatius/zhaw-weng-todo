(function () {
    'use strict';

    angular.module('todo').factory('synchronizationService', ['$q', 'localStorageService', 'issueService', synchronizationService]);

    function synchronizationService($q, localStorageService, issueService) {
        var synchronizationService = {
            sync: sync
        };

        return synchronizationService;

        function sync() {
            return deletePending().then(function () {
                return createPending().then(function () {
                    return updatePending();
                });
            });
        }

        /**
         * Returns the provided object as array
         * @param objects
         * @returns {*} Returns an empty array if the passed object was not an array. Otherwise the provided object is returned
         */
        function getArray(objects) {
            if (objects == undefined || objects.length < 1) {
                return [];
            }

            return objects;
        }

        /**
         * Deletes all issues from the server that are in the deletionQueue
         * @returns {*} Returns a promise for when the deletion of all issues has finished
         */
        function deletePending() {
            var deletionQueue = getArray(localStorageService.get('deletionQueue'));
            var projects = getArray(localStorageService.get('projects'));
            var unsucessfulDeletions = [];
            var promises = [];

            angular.forEach(deletionQueue, function (issue) {
                var split = issue.split(':');
                var projectId = split[0];
                var issueId = split[1];

                var promise = issueService.remove(projectId, issueId).catch(function (error) {
                    unsucessfulDeletions.push(issue);
                });

                promises.push(promise);
            });

            return $q.all(promises).then(function () {
                localStorageService.put('deletionQueue', unsucessfulDeletions);
            });
        }

        /**
         * Checks all issues from all projects and selects those with no id. Those are then created on the server
         * @returns {*} Returns a promise for when the creation of all issues has finished
         */
        function createPending() {
            var projects = getArray(localStorageService.get('projects'));
            var projectPromises = [];

            angular.forEach(projects, function (project) {
                var projectId = project.id;
                var issues = getArray(localStorageService.get('project_' + projectId + '_issues'));
                var promises = [];
                var createdIssues = [];

                angular.forEach(issues, function (issue) {
                    if (issue.id == undefined) {
                        var creationPromise = issueService.add(projectId, issue).then(function (createdIssue) {
                            createdIssues.push(createdIssue);
                        });

                        promises.push(creationPromise);
                    }
                });

                var projectPromise = $q.all(promises).then(function () {
                    var localIssues = getArray(localStorageService.get('project_' + projectId + '_issues'));

                    angular.forEach(createdIssues, function (issue) {
                        localIssues.push(issue);
                    });

                    localStorageService.put('project_' + projectId + '_issues', issues);
                });

                projectPromises.push(projectPromise);
            });

            return $q.all(projectPromises);
        }

        /**
         * Checks all issues from all projects and selects those with the updatePending attribute. Those are then sent
         * to the server to apply the changes
         * @returns {*} Returns a promise for when all issues where updated
         */
        function updatePending() {
            var projects = getArray(localStorageService.get('projects'));
            var projectPromises = [];

            angular.forEach(projects, function (project) {
                var projectId = project.id;
                var issues = getArray(localStorageService.get('project_' + projectId + '_issues'));
                var promises = [];
                var updatedIssues = [];

                angular.forEach(issues, function (issue) {
                    if (issue.updatePending) {
                        delete issue.updatePending; // Backend doesn't like additional properties

                        var promise = issueService.update(projectId, issue).then(function () {
                            updatedIssues.push(issue);
                        }).catch(function (error) {
                            issue.updatePending = true;
                            updatedIssues.push(issue);
                        });

                        promises.push(promise);
                    }
                });

                var projectPromise = $q.all(promises).then(function () {
                    angular.forEach(updatedIssues, function (issue) {
                        var localIssues = getArray(localStorageService.get('project_' + issue.project_id + '_issues'));

                        for (var i = 0; i < localIssues.length; i++) {
                            if (issue.client_id == localIssues[i].client_id) {
                                localIssues.splice(i, 1);
                                break;
                            }
                        }

                        localIssues.push(issue);
                        localStorageService.put('project_' + issue.project_id + '_issues', localIssues);
                    });
                });

                projectPromises.push(projectPromise);
            });

            return $q.all(projectPromises);
        }
    }
})();