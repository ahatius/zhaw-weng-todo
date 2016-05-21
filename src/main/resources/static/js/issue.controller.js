(function () {
    'use strict';

    angular.module('todo').controller('IssueController', ['$scope', 'rfc4122', 'Notification', 'localStorageService', 'projectSelectionService', 'issueService', 'synchronizationService', IssueController]);

    function IssueController($scope, uuid, Notification, localStorageService, projectSelectionService, issueService, synchronizationService) {
        var vm = this;

        vm.issues;
        vm.project;
        vm.issue;
        vm.datepickerOpen = false;
        vm.addIssue = addIssue;
        vm.updatePriority = updatePriority;
        vm.openDatepicker = openDatepicker;
        vm.removeIssue = removeIssue;
        vm.updateIssue = updateIssue;

        init();

        /**
         * Initializes the controller for the issue manager.
         *
         * It registers the callback for the project selection, resets the input fields and checks if a project is selected.
         * If a project is selected it will load the local issues first. After that, it will be attempted to synchronize
         * all local issues with the backend (create, update and delete outstanding issues). After that, it will load
         * all issues from the server and then save them in the localStorage.
         *
         * If there is no project selected, only the synchronization of the outstanding issues will be executed
         */
        function init() {
            projectSelectionService.registerCallback(projectSelectionCallback);
            resetIssueInputs();

            if (projectSelectionService.selectedProject != null) {
                vm.project = projectSelectionService.selectedProject;

                vm.issues = loadLocalIssues(vm.project.id);
                synchronizationService.sync().then(function () {
                    issueService.get(vm.project.id).then(function (issues) {
                        vm.issues = issues;
                        localStorageService.put('project_' + vm.project.id + '_issues', issues);
                    }).catch(function (error) {
                        Notification.error('The issues could not be loaded from the server. Displaying local issues: ' + error.data.message);
                    });
                });
            } else {
                synchronizationService.sync();
            }
        }

        /**
         * Loads the local issues for the given project id
         * @param projectId
         * @returns {*} Returns an array containing all local issues for the given project id
         */
        function loadLocalIssues(projectId) {
            var localIssues = localStorageService.get('project_' + projectId + '_issues');

            if (localIssues == undefined || localIssues.length < 1) {
                return [];
            }

            var issues = [];
            angular.forEach(localIssues, function (issue) {
                if (issue.project_id == projectId) {
                    issues.push(issue);
                }
            });

            return issueService.orderByDate(issues);
        }

        /**
         * This is the callback method that will be called from within the projectSelectionService to notify us about
         * the changed project. It will load the local issues first, and then attempt to load the issues from the server
         * @param project
         */
        function projectSelectionCallback(project) {
            vm.project = project;
            vm.issues = loadLocalIssues(vm.project.id);

            issueService.get(vm.project.id).then(function (issues) {
                vm.issues = issues;
            });
        }

        /**
         * Sets the priority for the issue that is being created
         * @param priority The priority as String
         */
        function updatePriority(priority) {
            vm.issue.priority = priority;
        }

        /**
         * Creates a new issue from users input and sends it to the server to persist. The issue will be saved to the
         * localStorage whether or not the server persisted the issue successfully. If persisting failed, the
         * synchronizationService will persist the issue sometime later.
         */
        function addIssue() {
            $scope.$broadcast('show-errors-check-validity');

            if (!$scope.issueCreation.$valid) {
                return;
            }

            vm.issue.client_id = uuid.v4();
            vm.issue.done = false;
            vm.issue.project_id = vm.project.id;

            var issues = localStorageService.get('project_' + vm.project.id + '_issues');

            if (issues == undefined) {
                issues = [];
            }

            issueService.add(vm.project.id, vm.issue).then(function (response) {
                vm.issue.id = response.data.id;

                issues.push(vm.issue);
                localStorageService.put('project_' + vm.project.id + '_issues', issues);

                vm.issues = loadLocalIssues(vm.project.id);
                Notification.success('Issue successfully created');
                resetIssueInputs();
                $scope.$broadcast('show-errors-reset');
            }).catch(function (error) {
                issues.push(vm.issue);
                localStorageService.put('project_' + vm.project.id + '_issues', issues);
                Notification.error('Issue was only saved locally because there was an server error: ' + error.statusText);
                resetIssueInputs();
            });
        }

        /**
         * Updates the provided issue in the localStorage and then attempts to update it on the server. If updating on
         * the server fails, the issue will receive an attribute "updatePending" which will be used by the
         * synchronization service to send it sometime later
         * @param issue
         */
        function updateIssue(issue) {
            var localIssues = localStorageService.get('project_' + vm.project.id + '_issues');

            for (var i = 0; i < localIssues.length; i++) {
                if (localIssues[i].client_id == issue.client_id) {
                    localIssues.splice(i, 1);
                    break;
                }
            }

            issueService.update(vm.project.id, issue).then(function (response) {
                localIssues.push(issue);
                localStorageService.put('project_' + vm.project.id + '_issues', localIssues);
                Notification.success('Issue successfully updated');
            }).catch(function (error) {
                issue.updatePending = true;
                localIssues.push(issue);
                localStorageService.put('project_' + vm.project.id + '_issues', localIssues);
                Notification.error('The issue was updated locally but the update on the server is still pending because there was an error while saving the issue on the server: ' + error.statusText);
            });
        }

        /**
         * Removes the issue from the localStorage and will then attempt to remove the issue from the server. If
         * deleting from the server fails, the issue will be put into a deletion queue so the synchronization service
         * can delete it from the server sometime later.
         * @param deletedIssue
         */
        function removeIssue(deletedIssue) {
            var message = "Bist su sicher dass du diesen Eintrag entfernen willst?";

            if (!confirm(message)) {
                return;
            }

            var issues = localStorageService.get('project_' + vm.project.id + '_issues');

            for (var i = 0; i < issues.length; i++) {
                if (issues[i].client_id == deletedIssue.client_id) {
                    issues.splice(i, 1);
                    break;
                }
            }

            localStorageService.put('project_' + vm.project.id + '_issues', issues);

            issueService.remove(vm.project.id, deletedIssue.id).then(function (response) {
                vm.issues = loadLocalIssues(vm.project.id);
                Notification.success('Issue successfully removed.');
            }).catch(function (error) {
                Notification.error('Issue will be removed from server later because there was an error while trying to remove the issue from the server: ' + error.statusText);

                var deletionQueue = localStorageService.get('deletionQueue');

                if (deletionQueue == undefined || deletionQueue.length < 1) {
                    deletionQueue = [];
                }

                deletionQueue.push(vm.project.id + ':' + deletedIssue.id);

                localStorageService.put('deletionQueue', deletionQueue);
                vm.issues = loadLocalIssues(vm.project.id);
            });
        }

        /**
         * Opens the datepicker
         */
        function openDatepicker() {
            vm.datepickerOpen = true;
        }

        /**
         * Will reset the issue creation inputs and set the priority to 2
         */
        function resetIssueInputs() {
            $scope.$broadcast('show-errors-reset');

            vm.issue = {
                priority: '2',
                done: false
            };
        }
    }
})();