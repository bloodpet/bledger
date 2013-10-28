var bl;

bl = {
	root: new Firebase('https://bledger.firebaseIO.com/'),
	daily: null,
	$lin: null,
	$lout: null,
	vals: [],

	add: function(direction, amount, tags, description) {
		var entry = {
			direction: direction,
			amount: amount,
			tags: tags,
			description: description,
		};
		bl.vals.push(entry);
		bl.current.set(bl.vals);
	},

	flush: function() {
		bl.current.set([])
	},

	display: function(i, e) {
		var tags = '';
		if (e.tags) tags = e.tags;
		$row = $('<div class="row">' +
			'<div class="col-md-4">' + e.amount + '</div>' +
			'<div class="col-md-4">' + tags + '</div>' +
			'<div class="col-md-4">' + e.description + '</div>' +
			'</div>');
		if (e.direction == 'in') {
			bl.$lin.prepend($row);
		} else {
			bl.$lout.prepend($row);
		}
	},

	choose_day: function(day) {
		if (bl.current) {
			bl.current.off('child_added')
		};
		bl.current = bl.daily.child(day);
		bl.current.on('value', function(snap) {
			bl.vals = snap.val();
			if (bl.vals == null) {
				bl.vals = [];
				bl.current.set([]);
			}
			console.log('Values ' + snap.name() + ': ' + bl.vals);
			bl.current.off('value');
		});
		bl.current.on('child_added', function(snap) {
			val = snap.val();
			if (val == null) {
				bl.vals = [];
				bl.current.set([]);
			}
			console.log('Values ' + snap.name() + ': ' + val);
			bl.display(0, val);
		});
	},

	init: function() {
		var now = new Date();
		var today = now.toISOString().split('T')[0];
		bl.daily = bl.root.child('daily');
		bl.choose_day(today);
		bl.$day.val(today);
	}

};


$(function(){
	var $l = $('#bledger');
	bl.$lin = $('#bl-in');
	bl.$lout = $('#bl-out');
	bl.$day = $('#bl-day');

	bl.init();

	$('#form-day').submit(function(e) {
		var today = $bl.day.val();
		$bl.$lin.text('');
		$bl.$lout.text('');
		bl.choose_day(today);
		return false
	});

	$('#form-in').submit(function(e) {
		var vals = {direction: 'in', amount: 0, tags: [], description: ''};
		$.each($(this).serializeArray(),
			function(i, e) {vals[e.name] = e.value;});
		bl.add(vals.direction, vals.amount, vals.tags, vals.description);
		return false;
	});

	$('#form-out').submit(function(e) {
		var vals = {direction: 'out', amount: 0, tags: [], description: ''};
		$.each($(this).serializeArray(),
			function(i, e) {vals[e.name] = e.value;});
		bl.add(vals.direction, vals.amount, vals.tags, vals.description);
		return false;
	});

});
