var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'experiments'
    },
    port: 3005,
    db: 'mongodb://localhost/citizen-engagement',
    iflux: {
      url: 'http://localhost:3000'
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'experiments'
    },
    port: 3005,
    db: 'mongodb://localhost/citizen-engagement',
    iflux: {
      url: 'http://localhost:3000'
    }
  },

	production: {
    root: rootPath,
    app: {
     name: 'experiments'
    },
    port: process.env.PORT,
    db: process.env.MONGODB_CON_STRING,
    iflux: {
      url: 'http://localhost:3000'
    }
  }
};

module.exports = config[env];
