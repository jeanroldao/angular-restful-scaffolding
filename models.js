var mongoose = require('mongoose');

module.exports = function(wagner) {
  mongoose.connection.readyState || mongoose.connect('mongodb://localhost:27017/orgman');
  
  wagner.factory('db', function() {
    return mongoose;
  });
  
  wagner.factory('Organization', function() {
    var schema = new mongoose.Schema({
      name: { 
        type: String, 
        required: true, 
        index: { unique: true } 
      }
    }, { versionKey: false });
    return mongoose.model('Organization', schema, 'organizations');
  });
  
  wagner.factory('Employee', function() {
    var schema = new mongoose.Schema({
      name: { 
        type: String, 
        required: true, 
        index: { unique: true } 
      },
      organization: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Organization', 
        index: true 
      }
    }, { versionKey: false });
    return mongoose.model('Employee', schema, 'employees');
  });

};