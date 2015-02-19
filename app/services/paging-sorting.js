module.exports = {
	pager: function(req, res, next) {
		if (req.headers['x-pagination'] != undefined) {
			var data = req.headers['x-pagination'].split(';');
			req.pagination = {
				page: data[0],
				size: data[1]
			};
		}
		else {
			req.pagination = {
				page: 0,
				size: 10
			}
		}

		next();
	},

	sorter: function(req, res, next) {
		if (req.headers['x-sort'] != undefined) {
			req.sort = req.headers['x-sort'];
		}
		else {
			req.sort = 'id'
		}
		next();
	},

	decorate: function(req, query) {
		return query
			.limit(req.pagination.size)
			.skip(req.pagination.size * req.pagination.page)
			.sort(req.sort);
	}
}