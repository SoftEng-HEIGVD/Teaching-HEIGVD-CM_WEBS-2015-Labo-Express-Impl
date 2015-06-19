var
	path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	dotenv = require('dotenv'),
	env = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV != 'docker') {
	dotenv.load();
}

var mongoBaseUri = null;

if (process.env.MONGOLAB_URI) {
	mongoBaseUri = process.env.MONGOLAB_URI;
}
else {
	if (process.env.MONGODB_HOST) {
		mongoBaseUri = 'mongodb://' + process.env.MONGODB_HOST + ':' + process.env.MONGODB_PORT + '/citizen-engagement';
	}
	else {
		mongoBaseUri = 'mongodb://localhost:27017/citizen-engagement';
	}
}

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'citizen-engagement',
	    storageEnabled: true,
	    storagePath: '/tmp',
	    eventTypes: {
		    issue: process.env.CITIZEN_ACTION_TYPE_ISSUE,
		    status: process.env.CITIZEN_ACTION_TYPE_STATUS,
		    action: process.env.CITIZEN_ACTION_TYPE_ACTION
	    }
    },
    port: 3003,
	  db: mongoBaseUri + '-development',
    iflux: {
      url: process.env.COMMON_IFLUX_API_URL,
			enabled: process.env.CITIZEN_IFLUX_ENABLED
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'citizen-engagement',
	    storageEnabled: false,
	    storagePath: '',
	    eventTypes: {
		    issue: process.env.CITIZEN_ACTION_TYPE_ISSUE,
		    status: process.env.CITIZEN_ACTION_TYPE_STATUS,
		    action: process.env.CITIZEN_ACTION_TYPE_ACTION
	    }
    },
    port: 3003,
	  db: mongoBaseUri + '-test',
    iflux: {
	    url: process.env.COMMON_IFLUX_API_URL,
			enabled: process.env.CITIZEN_IFLUX_ENABLED
    }
  },

	production: {
    root: rootPath,
    app: {
			name: 'citizen-engagement',
	    storageEnabled: true,
	    storagePath: '',
	    eventTypes: {
		    issue: process.env.CITIZEN_ACTION_TYPE_ISSUE,
		    status: process.env.CITIZEN_ACTION_TYPE_STATUS,
		    action: process.env.CITIZEN_ACTION_TYPE_ACTION
	    }
    },
    port: process.env.PORT,
		db: mongoBaseUri + '-production',
    iflux: {
	    url: process.env.COMMON_IFLUX_API_URL,
			enabled: process.env.CITIZEN_IFLUX_ENABLED
    }
  },

	docker: {
		root: rootPath,
		app: {
			name: 'citizen-engagement',
			storageEnabled: true,
			storagePath: '/data/citizen',
			eventTypes: {
		    issue: process.env.CITIZEN_ACTION_TYPE_ISSUE,
		    status: process.env.CITIZEN_ACTION_TYPE_STATUS,
		    action: process.env.CITIZEN_ACTION_TYPE_ACTION
		   }
		},
		port: 3000,
		db: 'mongodb://mongo:' + process.env.MONGODB_PORT_27017_TCP_HOST + ':' +process.env.MONGO_PORT_27017_TCP_PORT + '/citizen-engagement-docker',
		iflux: {
			url: process.env.COMMON_IFLUX_API_URL,
			enabled: true
	  }
	}
};

module.exports = config[env];
