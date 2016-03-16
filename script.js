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
		sudoku.reset()
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
				sudoku.solve('x');
				break;
			case 'Row Search':
				sudoku.solve('y');
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
		sudoku.check()
	});

	$('.solve').hover(function (e) {
		var info = '';
		switch (e.target.value) {
			case 'Simple':
				info = "For every blank, create a list of all the digits in that cells row, column and box. If it can only be one digit, enters it.";
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

	// Method to grab all the cells in a given cell's row, column and box
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
				if (this.x > 0) {
					$(sudoku.getCell(this.x -1, this.y).el).focus()
				}
				else {
					$(sudoku.getCell(8, this.y - 1).el).focus()
				}
				break;
			case 38: // Up
				if (this.y > 0) {
					$(sudoku.getCell(this.x, this.y -1).el).focus()
				}
				break;
			case 39: // Right
				if (this.x < 8) {
					$(sudoku.getCell(this.x + 1, this.y).el).focus()
				}
				else {
					$(sudoku.getCell(0, this.y + 1).el).focus()
				}
				break;
			case 40: //Down
				if (this.y < 8) {
					$(sudoku.getCell(this.x, this.y + 1).el).focus()
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

	Cell.prototype.addNot = function (digit) {
		 if (!this.not.has(digit)) {
			 this.not.push(digit);
			 this.may = [];

			 var self = this;
			 DIGITS.forEach(function (digit) {
				 if (!self.not.has(digit)) self.may.push(digit)
			 })
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
		$cells: [],
		// Generates an array of cells with x, y and box attributes and creates linked

		init: function () {
			$('#popover').hide();
			$('#tooltip').hide();

			for (var y=0; y<9; y++ ) {
				for (var x=0; x<9; x++ ) {
					var cell = new Cell(x,y);
					if (y < 3) {
						if (x < 3) cell.box = 0;
						else if (x < 6) cell.box = 1;
						else cell.box = 2;
					}
					else if (y < 6) {
						if (x < 3) cell.box = 3;
						else if (x < 6) cell.box = 4;
						else cell.box = 5;
					}
					else {
						if (x < 3) cell.box = 6;
						else if (x < 6) cell.box = 7;
						else cell.box = 8;
					}
					cell.el = document.createElement('input');
					cell.el.setAttribute('type','text');
					cell.el.setAttribute('class', 'cell');
					cell.el.setAttribute('maxlength','1');
					var box = document.getElementById(cell.box);
					box.appendChild(cell.el);

					cell.el.addEventListener('keydown', cell.navigate.bind(cell));
					cell.el.addEventListener('mouseover', cell.showPopover.bind(cell));
					cell.el.addEventListener('mouseout', cell.hidePopover.bind(cell));

					cell.parent = this;
					cell.value = cell.el.value;
					this.cells.push(cell);
				}
			}
			this.$cells = $('.cell');
		},

		reset: function () {
			sudoku.$cells.val('');
			this.cells.forEach(function (cell) {
				cell.value = '';
				cell.not = [];
				cell.may = [];
			})
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
					if (cell !== '') {
						blank.addNot(cell);
					}
				});
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
							maybes[0].may = [digit];
						}
					}
				})
			})
		},

		check: function () {
			var blanks = this.getBlanks();
			blanks.forEach(function(blank) {

				if (blank.may.length === 1) {
					// If blank has 8 not's set the remaining one as its value
					blank.value = blank.may[0];
					blank.el.value = blank.may[0];
				}
			})
		}
	}
})();

sudoku.init();



