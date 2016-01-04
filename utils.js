var status = require('http-status');

module.exports = {
  handleOne: function(res) {
    return function(error, result) {
      if (error) {
        return res.status(status.INTERNAL_SERVER_ERROR)
                  .json({ error: error.toString() });
      }
      if (!result) {
        return res.status(status.NOT_FOUND)
                  .json({ error: 'Not found' });
      }
      
      res.json(result);
    }
  },
  
  handleMany: function(res) {
    return function(error, results) {
      if (error) {
        return res.status(status.INTERNAL_SERVER_ERROR)
                  .json({ error: error.toString() });
      }
      
      res.json(results);
    }
  }
};