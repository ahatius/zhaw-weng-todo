(function() {
    'use strict';

    angular.module('todo').factory('localStorageService', [localStorageService]);

    function localStorageService() {
        var localStorageService = {
            get: get,
            put: put
        }

        return localStorageService;

        /**
         * Reads the given attribute from localStorage and parses into JSON
         * @param name The attribute to read from localStorage
         */
        function get(name) {
            return JSON.parse(localStorage.getItem(name));
        }

        /**
         * Writes the provided object into the given attribute
         * @param name The attribute that should be written
         * @param value The value of the attribute
         */
        function put(name, value) {
            localStorage.setItem(name, JSON.stringify(value));
        }
    }
})();