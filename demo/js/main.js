var bl;

bl = {
	$lin: null,
	$lout: null,
	balance: {},
	balRef: null,
	daily: null,
	root: new Firebase('https://bledger.firebaseIO.com/'),
	vals: {},

	add: function(entry) {
		var now = new Date();
		var time = now.getHours() + '-' +
			now.getMinutes() + '-' +
			now.getSeconds() + '-' +
			now.getMilliseconds();
		var tRef = bl.current.child(time);
		var tags = [];
		$.each(entry.tags.split(','), function(i, e) {
			tags.push(e.trim());
		});
		tags.sort();
		entry.tags = tags;
		entry.time = time;
		if (entry.amount)
			entry.amount = parseInt(entry.amount);
		else
			entry.amount = 0;
		bl.vals[bl.day][time] = entry;
		bl.setBalance(bl.day, bl.balance[bl.day] + entry.amount);
		tRef.set(entry);
		return time;
	},

	choose_day: function(day) {
		if (bl.current) {
			bl.current.off('child_added')
		};
		bl.current = bl.daily.child(day);
		bl.$lin.text('');
		bl.$lout.text('');
		bl.day = day;
		bl.current.on('child_added', function(snap) {
			val = snap.val();
			console.log('Add Values ' + snap.name() + ': ' + val);
			bl.display(0, val);
		});
	},

	computeBalance: function(day) {
		var now, yest, yesterday, balRef;
		var balance = 0;
		balRef = bl.root.child('balance').child(day);
		if (day) {
			now = new Date(day);
			yest = new Date(day);
		} else {
			now = new Date();
			yest = new Date();
			day = now.toISOString().split('T')[0];
		}
		yest.setDate(now.getDate() - 1);
		yesterday = yest.toISOString().split('T')[0];
		$.each(
			bl.vals[day],
			function(i, e) {
				if (e.direction == 'in') {
					balance = balance + parseInt(e.amount);
				} else {
					balance = balance - parseInt(e.amount);
				}
			});
		balance = balance + bl.balance[yesterday];
		bl.balance[day] = balance;
		balRef.set(balance);
	},

	getBalance: function() {
		bl.balRef.on('value', function(snap) {
			var vals = snap.val();
			console.log('Done ' + snap.name() + ': ' + vals);
			bl.balance = vals;
		});
	},

	getValues: function() {
		bl.daily.on('value', function(snap) {
			var vals = snap.val();
			console.log('Got values ' + snap.name() + ': ' + vals);
			bl.vals = vals;
			bl.$lin.text('');
			bl.$lout.text('');
			bl.display_day(vals[bl.day]);
		});
	},

	display: function(i, e) {
		var eid = e.time;
		var tags = '';
		if (e.tags) tags = e.tags;
		$row = $('<div class="row" id="row-' + eid + '">' +
			'<span class="col-md-2"><a id="remove-' + eid +
			'" href="#" class="remove-link" rid="' + eid +
			'">Remove</a></span>' +
			'<span class="col-md-2">' + e.amount + '</span>' +
			'<span class="col-md-4">' + tags + '</span>' +
			'<span class="col-md-4">' + e.description + '</span>' +
			'</div>');
		if (e.direction == 'in') {
			bl.$lin.prepend($row);
		} else {
			bl.$lout.prepend($row);
		}
		$('#remove-' + eid).click(function() {
			bl.remove(eid);
		});
	},

	display_day: function(vals) {
		if (vals) {
			$.each(vals, function(k, v) {
				bl.display(k, v);
			})
		};
	},

	flush: function() {
		bl.current.set([])
	},

	remove: function(eid) {
		console.log('Remove ' + eid);
		var $row = $('#row-' + eid);
		var tRef = bl.current.child(eid);
		bl.setBalance(bl.day, bl.balance[bl.day] - bl.vals[bl.day][eid].amount);
		tRef.remove();
		bl.vals[bl.day][eid] = null;
		$row.hide();
		return false;
	},

	setBalance: function(day, bal) {
		bl.balRef.child(day).set(bal);
		bl.balance[day] = bal;
	},

	init: function() {
		var now = new Date();
		var today = now.toISOString().split('T')[0];
		bl.balRef = bl.root.child('balance');
		bl.daily = bl.root.child('daily');
		bl.choose_day(today);
		bl.$day.val(today);
		bl.getBalance();
		bl.getValues();
	}

};


$(function(){
	var $l = $('#bledger');
	bl.$lin = $('#bl-in');
	bl.$lout = $('#bl-out');
	bl.$day = $('#bl-day');

	bl.init();

	$('#form-day').submit(function(e) {
		var today = bl.$day.val();
		console.log('Chosen ' + today);
		bl.$lin.text('');
		bl.$lout.text('');
		bl.display_day(bl.vals[today]);
		bl.choose_day(today);
		return false
	});

	$('#form-in').submit(function(e) {
		var vals = {direction: 'in', amount: 0, tags: [], description: ''};
		$.each($(this).serializeArray(),
			function(i, e) {vals[e.name] = e.value;});
		bl.add(vals);
		return false;
	});

	$('#form-out').submit(function(e) {
		var vals = {direction: 'out', amount: 0, tags: [], description: ''};
		$.each($(this).serializeArray(),
			function(i, e) {vals[e.name] = e.value;});
		bl.add(vals);
		return false;
	});

});
