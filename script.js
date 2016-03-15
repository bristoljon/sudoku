// Polyfill function to check array for item
Array.prototype.has = function (item) {

	// Allows checking array of cells for value
	if (typeof this[0] === 'object') {
		for (var i = 0; i < this.length; i++) {
			if (this[i].value === item) return true
		}
	}
	else {
		for (var j = 0; j < this.length; j++) {
			if (this[j] === item) return true
		}
	}

	return false
};

$('#clear').click(function () {
	sudoku.$cells.val('');
	sudoku.init()
});

$('#solve').click(function () {
	var its = 20;
	sudoku.getInput();
	while (sudoku.getBlanks().length && its > 0) {
		sudoku.search();
		sudoku.check();
		sudoku.solve('box');
		sudoku.solve('x');
		sudoku.solve('y');
	}

});

var sudoku = {
	cells: [],
	DIGITS: ['1','2','3','4','5','6','7','8','9'],
	$cells: $('.cell'),
	// Generates an array of cells and adds box reference to each one
	init: function () {
		this.cells = [];
		for (var x=0; x<9; x++ ) {
			for (var y=0; y<9; y++ ) {
				var cell = new Cell(x,y);
				if (x < 3) {
					if (y < 3) cell.box = 0;
					else if (y < 6) cell.box = 1;
					else cell.box = 2;
				}
				else if (x < 6) {
					if (y < 3) cell.box = 3;
					else if (y < 6) cell.box = 4;
					else cell.box = 5;
				}
				else {
					if (y < 3) cell.box = 6;
					else if (y < 6) cell.box = 7;
					else cell.box = 8;
				}
				cell.parent = this;
				this.cells.push(cell);
			}
		}
		// Add a ref to the dom element for each cell
		var cells = this.cells;
		for (var i = 0; i < cells.length; i++) {
			cells[i].el = this.$cells[i];
		}
	},

	// Updates the cells array with any numbers entered into the ui
	getInput: function () {
		var cells = this.cells;
		for (var i=0; i<cells.length; i++) {
			cells[i].value = cells[i].el.value;
		}
	},

	getBlanks: function (selection) {
		var cells = selection || this.cells,
			ar = [];
		for (var i = 0; i<cells.length; i++) {
			if (cells[i].value === '') {
				ar.push(cells[i])
			}
		}
		return ar
	},

	getKnowns:  function (selection) {
		var cells = selection || this.cells,
			ar = [];
		for (var i = 0; i<cells.length; i++) {
			if (cells[i].value !== '') {
				ar.push(cells[i])
			}
		}
		return ar
	},

	get: function (group, id) {
		var cells = this.cells,
			ar = [];
		for (var i=0; i < cells.length; i++) {
			if (cells[i][group] === id) {
				ar.push(cells[i]);
			}
		}
		return ar;
	}
};

// Cell constructor that adds unique ID to each instance
var Cell = (function() {
	var counter = 0;
	return function (x,y) {
		this.x = x;
		this.y = y;
		this.id = counter++;
		this.not = [];
		this.may = [];
		return this;
	};
})();

// Method to grab the remaining cells in a given row, column or box
Cell.prototype.getRemaining = function (prop) {
	var ar = [],
		cells = this.parent.cells;

	for (var i=0; i<cells.length; i++) {
		if (cells[i][prop] === this[prop] && cells[i].id !== this.id) {
			ar.push(cells[i]);
		}
	}
	return ar;
};

// Search every blank cells' row, column and box and add any values found to 'not' list
// Then invert that by adding any missing digits to the 'may' list
sudoku.search = function () {
	var blanks = this.getBlanks(),
		digits = this.DIGITS;

	blanks.forEach(function(blank) {
		var cells = blank.getRemaining('x')
				.concat(blank.getRemaining('y'))
				.concat(blank.getRemaining('box'));

		// Add any values in the cells box, row or column to not array
		cells.forEach(function(cell) {
			cell = cell.value;
			// If cell has a value that isn't already in the blank's not list, add it
			if (cell !== '' && !blank.not.has(cell)) {
				blank.not.push(cell);
			}
		});

		// Add any digits not in the 'not' list to the 'may' list
		digits.forEach(function (digit) {
			if (!blank.not.has(digit)) {
				blank.may.push(digit)
			}
		})
	});
};

sudoku.check = function () {
	var blanks = this.getBlanks();
	blanks.forEach(function (blank) {
		if (blank.may.length === 1) {
			// If blank has 8 not's set the remaining one as its value
			blank.value = blank.may[0];
			blank.el.value = blank.may[0];
		}
	})
};

sudoku.solve = function (group) {
	var self = this,
		groups = [],
		digits = this.DIGITS;
	for (var i = 0; i < 10; i++) {
		groups.push(this.get(group, i))
	}
	groups.forEach(function (group) {
		digits.forEach(function (digit) {
			if (!group.has(digit)) {
				var blanks = self.getBlanks(group),
					maybes = [];
				blanks.forEach(function(blank) {
					if (!blank.not.has(digit)) {
						maybes.push(blank)
					}
				});
				if (maybes.length === 1) {
					maybes[0].value = digit;
					maybes[0].el.value = digit;
					maybes[0].may = [];
				}
			}
		})
	})
};


sudoku.init();


