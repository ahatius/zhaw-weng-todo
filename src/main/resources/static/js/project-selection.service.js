(function () {
    'use strict';

    angular.module('todo').factory('projectSelectionService', [projectSelectionService]);

    function projectSelectionService() {
        var callbacks = [];
        var projectSelectionService = {
            selectedProject: null,
            selectProject: selectProject,
            registerCallback: registerCallback
        }

        return projectSelectionService;

        /**
         * Set the provided project as currently selected one and executes all callback methods
         * @param project The project that was selected
         */
        function selectProject(project) {
            projectSelectionService.selectedProject = project;
            notifyObservers();
        }

        /**
         * Registers a method as to be called when the selected project changes
         * @param callback The method that should be executed when the selected project changes
         */
        function registerCallback(callback) {
            callbacks.push(callback);
        }

        /**
         * Calls all callback methods
         */
        function notifyObservers() {
            angular.forEach(callbacks, function (callback) {
                callback(projectSelectionService.selectedProject);
            });
        }
    }
})();