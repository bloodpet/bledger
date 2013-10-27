var bl = {};
var aoeu;

$(function(){
	var $l = $('#bledger');
	var $lin = $('#bl-in');
	var $lout = $('#bl-out');
	bl.root = {};
	bl.ref = new Firebase('https://bledger.firebaseIO.com/');
	bl.vals = [];

	bl.add = function(direction, amount, tags, description) {
		var entry = {
			direction: direction,
			amount: amount,
			tags: tags,
			description: description,
		};
		bl.vals.push(entry);
		bl.test.set(bl.vals);
	}

	bl.flush = function() {
		bl.test.set([])
	}

	bl.display = function (i, e) {
		var tags = '';
		if (e.tags) tags = e.tags;
		$row = $('<div class="row">' +
			'<div class="col-md-4">' + e.amount + '</div>' +
			'<div class="col-md-4">Tags: ' + tags + '</div>' +
			'<div class="col-md-4">Desc: ' + e.description + '</div>' +
			'</div>');
		if (e.direction == 'in') {
			$lin.prepend($row);
		} else {
			$lout.prepend($row);
		}
	}

	bl.test = new Firebase('https://bledger.firebaseIO.com/test/');
	bl.test.on('value', function(snap) {
		bl.vals = snap.val();
		if (bl.vals == null) {
			bl.vals = [];
			bl.test.set([]);
		}
		console.log('Values ' + snap.name() + ': ' + bl.vals);
		bl.test.off('value');
	});
	bl.test.on('child_added', function(snap) {
		val = snap.val();
		if (val == null) {
			bl.vals = [];
			bl.test.set([]);
		}
		console.log('Values ' + snap.name() + ': ' + val);
		bl.display(0, val);
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
