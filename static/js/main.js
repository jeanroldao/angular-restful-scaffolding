'use strict';
(function(angular) {
  var app = angular.module('restScaffoldingApp', ['ng', 'ngRoute', 'ngResource', 'ui.grid', 'ui.grid.cellNav', 'schemaForm', 'ui.grid.selection']);
  
  app.constant('Models', [
    {
      path: '/organization',
      resourceUrl: '/api/v1/organization/:_id',
      title: 'Organizations',
      schema: {
        type: "object",
        properties: {
          _id: { 
            type: "string", 
            minLength: 24, 
            title: "Identifier", 
            readonly: true
          },
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
      path: '/employee',
      resourceUrl: '/api/v1/employee/:_id',
      title: 'Employees',
      schema: {
        type: "object",
        properties: {
          _id: { 
            type: "string", 
            minLength: 24, 
            title: "Identifier", 
            readonly: true
          },
          name: { 
            type: "string", 
            minLength: 2, 
            title: "Name", 
            description: "Name or alias" 
          },
          organization: { 
            type: "string", 
            title: "Organization", 
            description: "Identifier of Organization",
            select: { fromResource: '/organization', value: '_id', name: 'name' }
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
      var idField = model.resourceUrl.split(':').pop();
      model.idField = idField;
      var template = '<h1>'+model.title+'</h1>'
          + '<form ng-if="index.getCurrentModelValue()" ng-submit="index.save()" sf-schema="index.models[\''+model.path+'\'].schema" sf-form="index.models[\''+model.path+'\'].form" sf-model="index.currentModelValue"></form>'
          + '<div ng-if="!index.getCurrentModelValue()" class="btn-toolbar">'
          + '<button type="button" class="btn btn-success" ng-click="index.create()">New</button>'
          + '<button ng-if="index.canEdit()" type="button" class="btn btn-prmary" ng-click="index.edit()">Edit</button><br><br>'
          + '<div ui-grid="index.uiGrid" ui-grid-selection class="myGrid"></div>' 
          + '</div>';
          
      $routeProvider.when(model.path, {
        template: template
      });
      $routeProvider.when(model.path + '/:id', {
        template: template,
        resolve: {
          id: function($routeParams) {
            console.log($routeParams.id);
          }
        }
      });
    });
  });
  
  app.controller('indexController', function($scope, Models, $location, $route, $resource, $timeout, $routeParams, $log) {
    var index = this;
    
    index.currentModelValue = null;
    
    index.selectedRow = null;
    
    index.getCurrentModelValue = function() {
      if (!index.currentModelValue && $routeParams.id) {
        if ($routeParams.id == 'new') {
          index.currentModelValue = {}; 
        } else {
          var model = getCurrentModel();
          var filter = {};
          filter[model.idField] = $routeParams.id;
          index.currentModelValue = model.ngResource.get(filter, function() {}, function(res){
            // redirect on any error, like not found and internal server error
            index.path(index.path());
          });
        }
      } else if (index.currentModelValue && !$routeParams.id) {
        index.currentModelValue = null;
      }
      return index.currentModelValue;
    };
    
    index.create = function() {
      index.path(index.path() + '/new');
    };
    
    index.edit = function() {
      var idField = getCurrentModel().idField;
      var id = index.selectedRow.entity[idField];
      index.path(index.path() + '/' + id);
    };
    
    index.canEdit = function() {
      return index.selectedRow && index.selectedRow.entity;
    };
    
    index.models = {};
    
    index.data = [];
    index.uiGrid = { 
      enableFiltering: true,
      enableRowSelection: true,
      multiSelect: false,
      modifierKeysToMultiSelectCells: true,
      showGridFooter: true,
      rowIdentity: function(row) { return row.id; },
      getRowIdentity: function(row) { return row.id; },
      onRegisterApi: function(gridApi){
        index.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope,function(row){
          index.selectedRow = row;
        });
      },
      data: index.data 
    };
    
    Models.forEach(function(model) {
      
      var idMapping = {};
      idMapping[model.idField] = '@' + model.idField;
      
      model.ngResource = $resource( model.resourceUrl, idMapping, { 'update': { method:'PUT' }});
      
      var form = [];
      model.form.forEach(function(s){ 
        if (s == '*') {
          form.push.apply(form, Object.keys(model.schema.properties));
        } else {
          form.push(s);
        } 
      });
      model.form = form;
      
      index.models[model.path] = model;
    });
        
    function loadSelectsForModel(model) {
    
      // replace select items for titleMaps from ng resource
      for (var key in model.schema.properties) {
        var p = model.schema.properties[key];
        
        if (p.select) {
          var titleMap = index.models[p.select.fromResource].ngResource.query(function(items) {
            items.forEach(function(item, i) {
              items[i] = {
                value: item[p.select.value],
                name: item[p.select.name]
              }
            });
          });
          
          var i = model.form.indexOf(key);
          if (i < 0) {
            var formData = model.form.filter(function(f) { return f.key == key;})[0];
            formData.titleMap = titleMap;
          } else {
            model.form[i] = {
              key: key,
              type: 'select',
              titleMap: titleMap
            };
          }
        }
      }
    }
    
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
        if (index.currentModelValue[model.idField]) {
          value.$update(function() {
            index.path(index.path());
            index.init();
          });
        } else {
          value.$save(function() {
            index.path(index.path());
            index.init();
          });
        }
      }
    };
    
    index.path = function(path) {
      if (path) {
        return $location.path(path);
      } else {
        return '/' + $location.path().split('/')[1];
      }
    };

    
    index.init = function() {
      index.currentModelValue = null;
      
      index.data = [];
      //index.uiGrid = { enableFiltering: true, data: index.data };
      index.uiGrid.data = index.data;
      
      $timeout(function() {
        var model = getCurrentModel();
        if (model) {
          loadSelectsForModel(model);
          index.data = model.ngResource.query(function(list) {
          
            var formFieldsIdToValues = {};
            model.form.forEach(function(field) {
              console.log('field.titleMap');
              console.log(field.key);
              console.log(field.titleMap);
              if (field.titleMap) {
                if (Array.isArray(field.titleMap)) {
                  formFieldsIdToValues[field.key] = {};
                  field.titleMap.forEach(function(v) {
                    formFieldsIdToValues[field.key][v.value] = v.name;
                  });
                } else {
                  formFieldsIdToValues[field.key] = field.titleMap;
                }
              }
            });
            
            list.forEach(function(item) {
              //console.log(item);
              for (var key in item) {
                //console.log(key);
                if (key in formFieldsIdToValues) {
                  var newValue = formFieldsIdToValues[key][item[key]];
                  item[key] = newValue;
                }
              }
            });
          });
          
          index.uiGrid.data = index.data;
          
          index.uiGrid.columnDefs = [];
          for (var key in model.schema.properties) {
            index.uiGrid.columnDefs.push({ 
              name: key, 
              displayName: model.schema.properties[key].title, 
              enableCellEdit: true 
            });
          }
        }
        //$route.reload();
      });
    };
    index.init();
    
    function getCurrentModel() {
      return index.models[index.path()];
    };
    
  });
})(angular);