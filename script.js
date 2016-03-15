var sudoku = (function() {

	const DIGITS = ['1','2','3','4','5','6','7','8','9'];
	
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
		sudoku.init();
		sudoku.getInput();
	});
	
	$('.solve').click(function (e) {
		sudoku.getInput();
		switch (e.target.value) {
			case 'Simple':
				sudoku.update();
				break;
			case 'Box Search':
				sudoku.solve('box');
				break;
			case 'Column Search':
				sudoku.solve('y');
				break;
			case 'Row Search':
				sudoku.solve('x');
				break;
			case 'Solve':
				var iterations = 0;
				console.time('Solved');

				while (sudoku.getBlanks().length) {
					sudoku.update();
					sudoku.solve('box');
					sudoku.solve('x');
					sudoku.solve('y');
					if (++iterations > 19) break;
				}
				console.timeEnd('Solved');
				console.log(iterations + ' iterations');
				if (iterations === 20) {
					console.log('Solve failed')
				}
				break;
			default:
				console.log('No handler found')
		}
	});

	$('.solve').hover(function (e) {
		var info = '';
		switch (e.target.value) {
			case 'Simple':
				info = "For every blank, create a list of all the digits in it's row, column and box. If it can only be one digit, enters it.";
				break;
			case 'Box Search':
				info = "For each box, create list of cells where each digit could go. If only one place, enter it.";
				break;
			case 'Column Search':
				info = "For each column, create list of cells where each digit could go. If only one place, enter it.";
				break;
			case 'Row Search':
				info = "For each row, create list of cells where each digit could go. If only one place, enter it.";
				break;
			case 'Solve':
				info = "Simple, Box, Column and Row search until no blanks remain or maximum iterations reached";
				break;
			default:
				console.log('No handler found')
				break;
		}
		$('#tooltip')
			.text(info)
			.toggle();
	});
	
	// Cell constructor that adds unique ID to each one
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

	// Arrow key event handler
	Cell.prototype.navigate = function (event) {
		switch (event.keyCode) {
			case 37: // Left
				console.log('left');
				if (this.y > 0) {
					$(sudoku.getCell(this.x, this.y - 1).el).focus()
				}
				break;
			case 38:
				console.log('up');
				if (this.x > 0) {
					$(sudoku.getCell(this.x - 1, this.y).el).focus()
				}
				break;
			case 39: // Left
				console.log('right');
				if (this.y < 8) {
					$(sudoku.getCell(this.x, this.y + 1).el).focus()
				}
				break;
			case 40: // Left
				console.log('down');
				if (this.x < 8) {
					$(sudoku.getCell(this.x + 1, this.y).el).focus()
				}
				break;
			default:
				var key = String.fromCharCode(event.keyCode);
				if (DIGITS.has(key) && !this.not.has(key)) {
					this.el.value = key;
					this.value = key;
					sudoku.update();
				}
				else {
					event.preventDefault()
				}
		}
	};

	Cell.prototype.showPopover = function (e) {
		if (!this.value) {
			$('#popover')
			.html('Not: ' + this.not.sort() + '<br/> Maybe: ' + this.may.sort())
			.css({'top': e.pageY, 'left': e.pageX})
			.show();
		}
	};

	Cell.prototype.hidePopover = function () {
		$('#popover').hide();
	};
	
	return {
		cells: [],
		$cells: $('.cell'),
		// Generates an array of cells and adds box reference to each one
		init: function () {
			$('#popover').hide();
			$('#tooltip').hide();
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
			// Add a ref to the dom element for each cell and add listeners
			var cells = this.cells;
			for (var i = 0; i < cells.length; i++) {
				cells[i].el = this.$cells[i];
				cells[i].el.addEventListener('keydown', cells[i].navigate.bind(cells[i]));
				cells[i].el.addEventListener('mouseover', cells[i].showPopover.bind(cells[i]));
				cells[i].el.addEventListener('mouseout', cells[i].hidePopover.bind(cells[i]));
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
	
		getGroup: function (group, id) {
			var cells = this.cells,
				ar = [];
			for (var i=0; i < cells.length; i++) {
				if (cells[i][group] === id) {
					ar.push(cells[i]);
				}
			}
			return ar;
		},

		getCell: function (x,y) {
			var cells = this.cells;
			for (var i=0; i < cells.length; i++) {
				if (cells[i].x === x && cells[i].y === y) {
					return cells[i]
				}
			}
		},
		// Search every blank cells' row, column and box and add any values found to 'not' list
		// Then invert that by adding any missing DIGITS to the 'may' list
		update: function () {
			var blanks = this.getBlanks();
		
			blanks.forEach(function(blank) {
				// Reset not and may lists
				blank.not = [];
				blank.may = [];

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
		
				// Add any DIGITS not in the 'not' list to the 'may' list
				DIGITS.forEach(function (digit) {
					if (!blank.not.has(digit)) {
						blank.may.push(digit)
					}
				});

				if (blank.may.length === 1) {
					// If blank has 8 not's set the remaining one as its value
					blank.value = blank.may[0];
					blank.el.value = blank.may[0];
				}
			});
		},
		
		solve: function (group) {
			var self = this,
				groups = [];

			for (var i = 0; i < 10; i++) {
				groups.push(this.getGroup(group, i))
			}
			groups.forEach(function (group) {
				DIGITS.forEach(function (digit) {
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
		}
	}
})();

sudoku.init();
sudoku.getInput();
sudoku.update();


