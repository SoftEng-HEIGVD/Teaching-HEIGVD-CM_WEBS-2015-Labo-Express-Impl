# Smart City - Citizen Engagement - A pratical work for Web Services

## On Heroku

https://pure-gorge-1661.herokuapp.com

## Introduction

The implementation is done with:

- [Express](http://expressjs.com/)
- [Node.js](http://nodejs.org/)
- [Mongoose](mongoosejs.com)
- [MongoDB](http://www.mongodb.org/)

## Requirements

- Nodejs 0.10+
- NPM 2.4+
- Bower 1.3+
- Mongo 2.6+

## Implementation

The current implementation is based on the info from [iFlux blog's post](http://www.iflux.io/use-case/2015/02/03/citizen-engagement.html).

## Install / Deploy / Run

Just run the following command. Be sure MongoDB is running before running the command.

```bash
# Run only once the command to install the app dependencies
$> npm install

# Start the server app
$> npm start
```

### Data model:

- `Issue`, `IssueType` and `User` are three separate models (documents).
- `Issue` has:
	- `_issueType` (`ObjectId(ref: IssueType)`),
	- `_owner` (`ObjectId(ref: User)`),
	- `_assignee` (`ObjectId(ref: User)`),
	- `Tags` is just a list of string attached to an issue,
	- `comments` is a list of `Comment` that is a sub model (sub-document),
	- `updatedOn`: Date that should be updated each time the model is updated (done through a `pre-save hook`. Use a default value corresponding to `Date.now`,
	- `state`: Just a string that we play with. Used states: `created`, `acknowledged`, `assigned`, `in_progress`, `solved`, `rejected`,
	- `description`: Free text to describe the issue,
	- `lat` and `lng`: Coordinates where the issue is located,
- `User` has:
	- `firstname`, `lastname` and `phone` that are `String`,
	- `roles` is a collection of `String` and should contains: `['citizen']`, `['staff']` or `['citizen', 'staff']`
- `IssueType`
	- `name` and `description` that are `String`
- `Comment` has:
	- `text` is a `String`
	- `postedOn` is a `Date` when the comment is posted. Use a default value corresponding to `Date.now`
	- `_author` is the `User` who has posted the comment

### Services:

- `AuthenticationService` is a service that provides methods to help for the authentication (use HTTP header `x-user-id`) and authorizations,
	- `authenticate` enrich the request object when a user is found that correspond to the id given through the `x-user-id` header, `401` or `403` returned if user not found or no role is present,
	- `authorize` allow creating a function to do the right check of the rights to apply to a specific path/method
- `PagingAndSortingService` is a service to help to do the pagination and sorting
	- `pager` function applied on http verb will populate the request object with `x-pagination` header content or default values if not present,
	- `sorter` function applied on http verb will populate the request object with `x-sort` header content or default values if not present,
	- `decorate` function enrich `Mongoose` queries with `limit`, `skip` and `sort` configuration

### Resources:

**Base path is `/api`**

- `Issue /issues`
	- `GET /` Retrieve all issues (pagination and sort is supported)
	- `POST /` Create new issue
	- `POST /search` Allow querying the issues (not yet fully implemented)
	- `GET /:id` Retrieve one issue
	- `POST /:id` Update one issue
	- `DELETE /:id` Delete one issue
- `User /users`
	- `GET /` Retrieve all users (pagination and sort is supported)
	- `POST /` Create new user
	- `GET /:id` Retrieve a user
	- `POST /:id` Update a user
	- `DELETE /:id` Delete a user
- `IssueType /issueTypes`
	- `GET /` Retrieve all issue types (pagination and sort is supported)
	- `POST /` Create new issue type
	- `GET /:id` Retrieve a issue type
	- `POST /:id` Update a issue type
	- `DELETE /:id` Delete a issue type
- `IssueAction /issues`
 - `GET /:id/actions` Retrieve the list of actions for this specific issue
 - `POST /:id/actions` Submit an action to do on an issue. Allowed actions: `comment`, `addTags`, `removeTags`, `replaceTags`, `assign`, `ack`, `start`, `reject` and `resolve`
- `Action /actions`
 - `GET /actions` Retrieve the list of all the actions present in the system
- `Data /data`
	`POST /populate` Populate random data for the app to have something to test for the pagination and sorting

## Queries

The queries are partially implemented. There is the list of queries present on the blog:

- `[implemented]` Get the list of issues raised by a particular user.

```json
POST /issues/:id/search

{
	"_owner": "54eb25e13377ec0e007028c1"
}

or

GET /me/issues
```

- `[implemented]` Get the list of issues of a certain type.

```json
POST /issues/:id/search

{
	"_issueType": "54eb25e13377ec0e007028c1"
}
```

- `[implemented]` Get the list of issues in a particular region.

```json
POST /issues/:id/search

{
	"$and": [ {
			"lat": {
				"$gte": 46.766129,
				"$lte": 46.784234
			}
		}, {
			"lng": {
				"$gte": 6.622009,
				"$lte": 6.651878
			}
		}
	]
}
```
- [`not implemented`] Get the list of issues solved between two dates.
- [`not implemented`] Get the list of issues created between two dates that are still unresolved.
- [`implemented`] Get the history of an issue (list of actions taken on the issue).

```
# List of actions for a specific issue
GET /issues/:id/actions

# List of actions for the whole system
GET /actions
```

- [`not implemented`] Get the list of users who have created most issues.
- [`not implemented`] Get the list of users who have solved most issues.
- [`not implemented`] Get the list of users who have the least assigned issues not yet solved or rejected.


## Deploy on Heroku

1. Create the application in the Heroku admin console
2. If not already done, provide Credit Card infos
3. Type the command in the directory app on your machine `heroku addons:add mongolab`
4. Visit again your Heroku admin console to view the app details. You will find a link to see the admin console of the addon.
5. Once you are in the admin console of the addon, you can create a new database user. Do it with the following info:
	- User: `cityengagement`
	- Password: `cityengagement`
6. Retrieve the connection string present on the main page of the admin console from the addon. It should looks like:
	- Connection string example: `mongodb://{dbuser}:{dbpassword}@{name}.mongolab.com:39271/{addonUser}`
7. Once user/password defined and connection string retrieved, you can run the following command in your app directory
	- cmd: `heroku config:set MONGODB_CON_STRING={connectionStringWithValuesReplaced}`
8. Do the same to setup the `production` environment mode
	- cmd: `heroku config:set NODE_ENV=production`
9. Finally, you can push your code to Heroku
	- cmd: `git push heroku master`

## TODO

- Improve the `query` information part

### iFlux integration

Currently, there are few event types generated by the server.

#### `actionEvent`

This event occurs when an action is performed and the corresponding format of the event is the following:

```json
{
	"timestamp": "2015-01-12T05:21:07Z",
	"source": "smartCity/citizenEngagement",
	"type": "actionEvent",
	"properties": {
	    "date": "2015-02-23T12:08:20.654Z",
        "type": "addComment",
        "reason": "Comment added",
        "user": "Alain Terrieur",
        "issueId": "54e5d1b4a9c998fec6588d51",
        "issue": "Pellentesque mattis quam tincidunt sem rhoncus finibus."
	}
}
```

Slack rule on iFLUX:

```json
{
	"description": "Send text notification to slack when action occurred.",
	"reference": "SC-CE-AE-SLACK",
	"if": {
		"eventSource": "smartCity/citizenEngagement",
		"eventType": "actionEvent",
		"eventProperties": {}
	},
	"then": {
		"actionTarget": "http://ifluxslack:3000",
		"actionSchema": "{\"type\":\"sendSlackMessage\",\"properties\":{\"channel\":\"iflux\",\"message\":\"{{ properties.user }} did an action ({{ properties.type }}) on issue ({{ properties.issueId }}) {{ properties.issue }}. The reason: {{ properties.reason }}. The action was performed on {{ properties.date }}.\"}}"
	}
}
```

Metrics rules on iFLUX:

```json
{
	"description": "Update metrics globally on metrics action target.",
	"reference": "SC-CE-AE-GLOBAL-METRICS",
	"if": {
		"eventSource": "smartCity/citizenEngagement",
		"eventType": "actionEvent",
		"eventProperties": {}
	},
	"then": {
		"actionTarget": "http://ifluxmetrics:3000",
		"actionSchema": "{\"type\":\"updateMetric\",\"properties\":{\"metric\":\"ch.heigvd.ptl.sc.ce.{{properties.type}}\",\"timestamp\":\"{{timestamp}}\"}}"
	}
}
```

```json
{
	"description": "Update metrics for an issue on metrics action target.",
	"reference": "SC-CE-AE-ISSUE-METRICS",
	"if": {
		"eventSource": "smartCity/citizenEngagement",
		"eventType": "actionEvent",
		"eventProperties": {}
	},
	"then": {
		"actionTarget": "http://ifluxmetrics:3000",
		"actionSchema": "{\"type\":\"updateMetric\",\"properties\":{\"metric\":\"ch.heigvd.ptl.sc.ce.{{properties.issueId}}.{{properties.type}}\",\"timestamp\":\"{{timestamp}}\"}}"
	}
}
```

#### `issueEvent`

This event occurs when a new issue is submitted by a user. Event format:

```json
{
	"timestamp": "2015-01-12T05:21:07Z",
	"source": "smartCity/citizenEngagement",
	"type": "issueEventAdded",
	"properties": {
		"date": "2015-02-23T12:08:20.654Z",
		"ok": "54e5d1b4a9c998fec6588d51",
		"description": "Pellentesque mattis quam tincidunt sem rhoncus finibus.",
		"creator": "Alain Terrieur",
		"where": "(lat: 1.2345, lng: 6.7890)"
	}
}
```

Slack rule on iFLUX:

```json
{
	"description": "Send text notification to slack on issue creation.",
	"reference": "SC-CE-IC-SLACK",
	"if": {
		"eventSource": "smartCity/citizenEngagement",
		"eventType": "issueCreated",
		"eventProperties": {}
	},
	"then": {
		"actionTarget": "http://ifluxslack:3000",
		"actionSchema": "{\"type\":\"sendSlackMessage\",\"properties\":{\"channel\":\"iflux\",\"message\":\"{{ properties.creator }} submitted an issue [{{ properties.issueId }}] on {{ properties.date }}. The issue concern: {{ properties.description }} and is situated at {{ properties.where }}.\"}}"
	}
}
```

Metrics rule on iFLUX

```json
{
	"description": "Update metrics globally on issue creation.",
	"reference": "SC-CE-IC-METRICS",
	"if": {
		"eventSource": "smartCity/citizenEngagement",
		"eventType": "issueCreated",
		"eventProperties": {}
	},
	"then": {
		"actionTarget": "http://ifluxslack:3000",
		"actionSchema": "{\"type\":\"updateMetric\",\"properties\":{\"metric\":\"ch.heigvd.ptl.sc.ce.issueCreated\",\"timestamp\":\"{{timestamp}}\"}}"
	}
}
```
