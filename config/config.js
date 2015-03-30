var
	path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	dotenv = require('dotenv'),
	env = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV != 'docker') {
	dotenv.load();
}

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'citizen-engagement'
    },
    port: 3005,
    db: 'mongodb://localhost/citizen-engagement',
    iflux: {
      url: 'http://localhost:3000',
			enabled: false
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'citizen-engagement'
    },
    port: 3005,
    db: 'mongodb://localhost/citizen-engagement',
    iflux: {
      url: 'http://localhost:3000',
			enabled: false
    }
  },

	production: {
    root: rootPath,
    app: {
     name: 'citizen-engagement'
    },
    port: process.env.PORT,
    db: process.env.MONGODB_CON_STRING,
    iflux: {
      url: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
			enabled: false
    }
  },

	docker: {
		root: rootPath,
		app: {
			name: 'citizen-engagement'
		},
		port: 3000,
		db: 'mongodb://mongo:' + process.env.MONGO_PORT_27017_TCP_PORT + '/' + (process.env.MONGO_DB || 'citizen-engagement-docker'),
		iflux: {
  	  url: process.env.IFLUX_SERVER_URL || 'http://www.iflux.io',
			enabled: true
	  }
	}
};

module.exports = config[env];
