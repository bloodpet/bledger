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
			entry.amount = parseFloat(entry.amount);
		else
			entry.amount = 0;
		if (! bl.vals[bl.day])
			bl.vals[bl.day] = {}
		bl.vals[bl.day][time] = entry;
		if (entry.direction == 'in')
			bl.setBalance(bl.day, bl.balance[bl.day] + entry.amount);
		else
			bl.setBalance(bl.day, bl.balance[bl.day] - entry.amount);
		tRef.set(entry);
		return time;
	},

	chooseDay: function(day) {
		bl.$day.val(day);
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
		bl.displayBalance(day);
	},

	computeBalance: function(day) {
		var now, dayBefore, balRef;
		var balance = 0;
		day = bl.getDay(day);
		dayBefore = bl.getDayBefore(day);
		balRef = bl.root.child('balance').child(day);
		balBefore = 0;
		if (bl.vals[day]) {
			$.each(
				bl.vals[day],
				function(i, e) {
					if (e && e.direction == 'in') {
						balance = balance + parseFloat(e.amount);
					} else {
						balance = balance - parseFloat(e.amount);
					}
				});
		};
		if (bl.balance[dayBefore])
			balBefore = parseFloat(bl.balance[dayBefore]);
		bl.setBalance(day, balance + balBefore);
		bl.displayBalance(day, dayBefore);
	},

	display: function(i, e) {
		var eid = e.time;
		var tags = '';
		if (e.tags) tags = e.tags;
		$row = $('<div class="row" id="row-' + eid + '">' +
			'<span class="col-md-2"><a id="remove-' + eid +
			'" href="#" class="remove-link" rid="' + eid +
			'">Remove</a></span>' +
			'<span class="col-md-2">' + e.amount.toFixed(2) + '</span>' +
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

	displayBalance: function(day, yesterday) {
		if (! day) {
			day = bl.getDay(day);
		}
		if (! yesterday) {
			yesterday = bl.getDayBefore(day);
		}
		bal = bl.balance[day];
		bal_y = bl.balance[yesterday];
		if (bal)
			$('#bl-bal-now').text(bal.toFixed(2));
		else
			$('#bl-bal-now').text(0);
		if (bal_y)
			$('#bl-bal-prev').text(bal_y.toFixed(2));
		else
			$('#bl-bal-prev').text(0);
	},

	displayDay: function(vals) {
		if (vals) {
			$.each(vals, function(k, v) {
				bl.display(k, v);
			})
		};
	},

	flush: function() {
		bl.current.set([])
	},

	getBalance: function() {
		bl.balRef.on('value', function(snap) {
			var vals = snap.val();
			console.log('Done ' + snap.name() + ': ' + vals);
			bl.balance = vals;
			bl.displayBalance();
		});
	},

	getDay: function(day) {
		if (day) {
			return day;
		} else {
			now = new Date();
			return now.toISOString().split('T')[0];
		}
	},

	getDayAfter: function(day) {
		if (day) {
			now = new Date(day);
			yest = new Date(day);
		} else {
			now = new Date();
			yest = new Date();
		}
		yest.setDate(now.getDate() + 1);
		return yest.toISOString().split('T')[0];
	},

	getDayBefore: function(day) {
		if (day) {
			now = new Date(day);
			yest = new Date(day);
		} else {
			now = new Date();
			yest = new Date();
		}
		yest.setDate(now.getDate() - 1);
		return yest.toISOString().split('T')[0];
	},

	getValues: function() {
		bl.daily.on('value', function(snap) {
			var vals = snap.val();
			console.log('Got values ' + snap.name() + ': ' + vals);
			bl.vals = vals;
			bl.$lin.text('');
			bl.$lout.text('');
			bl.displayDay(vals[bl.day]);
		});
	},

	remove: function(eid) {
		console.log('Remove ' + eid);
		var $row = $('#row-' + eid);
		var tRef = bl.current.child(eid);
		var entry = bl.vals[bl.day][eid];
		if (entry.direction == 'in')
			bl.setBalance(bl.day, bl.balance[bl.day] - entry.amount);
		else
			bl.setBalance(bl.day, bl.balance[bl.day] + entry.amount);
		tRef.remove();
		bl.vals[bl.day][eid] = null;
		$row.hide();
		return false;
	},

	setBalance: function(day, bal) {
		console.log('set balance ' + bal);
		bl.balRef.child(day).set(bal);
		bl.balance[day] = bal;
		bl.displayBalance(day);
	},

	init: function() {
		var now = new Date();
		var today = now.toISOString().split('T')[0];
		bl.balRef = bl.root.child('balance');
		bl.daily = bl.root.child('daily');
		bl.chooseDay(today);
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
		bl.displayDay(bl.vals[today]);
		bl.chooseDay(today);
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

	$('#day-after').click(function() {
		var day = bl.getDayAfter(bl.day);
		bl.chooseDay(day);
		return false;
	});

	$('#day-before').click(function() {
		var day = bl.getDayBefore(bl.day);
		bl.chooseDay(day);
		return false;
	});

	$('#day-today').click(function() {
		var day = bl.getDay();
		bl.chooseDay(day);
		return false;
	});

	$('#compute-balance').click(function() {
		bl.computeBalance(bl.day);
		return false;
	});

});
