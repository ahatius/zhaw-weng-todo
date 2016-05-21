(function () {
    'use strict';

    angular.module('todo').controller('ProjectController', ['Notification', 'localStorageService', 'projectSelectionService', 'Project', ProjectController]);

    function ProjectController(Notification, localStorageService, projectSelectionService, Project) {
        var vm = this;

        vm.projects;
        vm.addProject = addProject;
        vm.selectProject = selectProject;

        init();

        /**
         * Initializes the project controller.
         *
         * Checks if there are any projects in the localStorage and provides them for selection. If projects were found
         * and the attribute "lastProject" was set in the localStorage, it will automatically loaded as first project
         */
        function init() {
            vm.projects = localStorageService.get('projects');

            if (vm.projects == undefined) {
                vm.projects = [];
            }

            var lastProject = localStorageService.get('lastProject');

            if (lastProject != undefined && vm.projects > 0) {
                projectSelectionService.selectProject(lastProject);
            }
        }

        /**
         * Creates a new project
         */
        function addProject() {
            var message = "Bitte gib einen Titel für das Projekt an:";
            var title = prompt(message);

            var project = new Project();
            project.title = title;

            project.$save().then(function (createdProject) {
                vm.projects.push(createdProject);
                localStorageService.put('projects', vm.projects);
                localStorageService.put('lastProject', createdProject);
                projectSelectionService.selectProject(project);
            }).catch(function (error) {
                Notification.error('The project could not be created because the server sent an error: ' + error.statusText);
            });
        }

        /**
         * Calls the projectSelectionService and sets the selected project
         * @param project The project that should be selected
         */
        function selectProject(project) {
            projectSelectionService.selectProject(project);
            localStorageService.put('lastProject', project);
        }
    }
})();