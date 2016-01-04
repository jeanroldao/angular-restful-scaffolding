'use strict';
(function(angular) {
  var app = angular.module('restScaffoldingApp', ['ng', 'ngRoute', 'ngResource', 'ui.grid', 'schemaForm']);
  
  app.constant('Models', [
    {
      path: '/organizations',
      resourceUrl: '/api/v1/organization/:resourceId',
      resourceId: '_id',
      title: 'Organizations',
      schema: {
        type: "object",
        properties: {
          _id: { type: "string", minLength: 24, title: "Identifier", description: "empty for new" },
          name: { 
            type: "string",
            minLength: 1, 
            title: "Organization Name"
          }
        },
        required: ['name']
      },
      form: [
        "*",
        {
          type: "submit",
          title: "Save"
        }
      ]
    },
    {
      path: '/employees',
      resourceUrl: '/api/v1/employee/:resourceId',
      resourceId: '_id',
      title: 'Employees',
      schema: {
        type: "object",
        properties: {
          _id: { type: "string", minLength: 24, title: "Identifier", description: "Identifier (empty for new)" },
          name: { type: "string", minLength: 2, title: "Name", description: "Name or alias" },
          organization: { type: "string", minLength: 24, title: "Organization", description: "Identifier of Organization" },
          /*title: {
            type: "string",
            enum: ['dr','jr','sir','mrs','mr','NaN','dj']
          }*/
        },
        required: ['name']
      },
      form: [
        "*",
        {
          type: "submit",
          title: "Save"
        }
      ]
    }
  ]);
  
  app.config(function($routeProvider, Models) {
    $routeProvider
      .when('/', {
        template: '<h1>Select a collection</h1>'
          + Models.map(function(model) {
              return '<p><a ng-href="#'+model.path+'">'+model.title+'</a></p>';
            }).join('')
      });
    Models.forEach(function(model) {
      $routeProvider.when(model.path, {
        template: '<h1>'+model.title+'</h1>'
          + '<form ng-submit="index.save()" sf-schema="index.models[\''+model.path+'\'].schema" sf-form="index.models[\''+model.path+'\'].form" sf-model="index.currentModelValue"></form>'
          + '<div ui-grid="index.uiGrid" class="myGrid"></div>'
      });
    });
  });
  
  app.controller('indexController', function(Models, $location, $resource, $timeout) {
    var index = this;
    
    index.currentModelValue = {};
    
    index.models = {};
    
    index.data = [];
    index.uiGrid = { data: index.data };
    
    Models.forEach(function(model) {
      model.ngResource = $resource(
        model.resourceUrl, 
        { resourceId: '@'+model.resourceId }, 
        { 'update': { method:'PUT' }});
        
      index.models[model.path] = model;
    });
    
    index.save = function() {
      var model = index.models[index.path()];
      var valid = true;
      if (model && model.schema.required) {
        model.schema.required.forEach(function(requiredField) {
          valid &= !!index.currentModelValue[requiredField];
        });
      }
      if (!valid) {
        console.log('Invalid!');
      } else {
        console.log('Saving');
        //console.log(index.currentModelValue);
        var model = getCurrentModel();
        var value = new model.ngResource(index.currentModelValue)
        if (index.currentModelValue[model.resourceId]) {
          value.$update(function() {
            index.init();
          });
        } else {
          value.$save(function() {
            index.init();
          });
        }
      }
    };
    
    index.path = function() {
      return $location.path();
    };
    
    index.init = function() {
      index.currentModelValue = {};
      index.data = [];
      index.uiGrid = { data: index.data };
      
      $timeout(function() {
        var model = getCurrentModel();
        if (model) {
          index.data = model.ngResource.query();
          index.uiGrid = { data: index.data };
        }
      });
    };
    index.init();
    
    
    function getCurrentModel() {
      return index.models[index.path()];
    };
    
  });
})(angular);