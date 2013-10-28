var bl;

bl = {
	root: new Firebase('https://bledger.firebaseIO.com/'),
	daily: null,
	$lin: null,
	$lout: null,
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
		console.log(entry);
		bl.vals[time] = entry;
		tRef.set(entry);
		return time;
	},

	flush: function() {
		bl.current.set([])
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

	remove: function(eid) {
		console.log('Remove ' + eid);
		var $row = $('#row-' + eid);
		var tRef = bl.current.child(eid);
		tRef.remove();
		bl.vals[eid] = null;
		$row.hide();
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
			}
			console.log('Values ' + snap.name() + ': ' + bl.vals);
			bl.current.off('value');
		});
		bl.current.on('child_added', function(snap) {
			val = snap.val();
			if (val == null) {
				bl.vals = [];
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
		var today = bl.$day.val();
		console.log('Chosen ' + today);
		bl.$lin.text('');
		bl.$lout.text('');
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
