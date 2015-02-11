var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'experiments'
    },
    port: 3000,
    db: 'mongodb://localhost/citizen-engagement'
  },

  test: {
    root: rootPath,
    app: {
      name: 'experiments'
    },
    port: 3000,
    db: 'mongodb://localhost/citizen-engagement'
  },

  production: {
    root: rootPath,
    app: {
      name: 'experiments'
    },
    port: 3000,
    db: 'mongodb://localhost/citizen-engagement'
  }
};

module.exports = config[env];
