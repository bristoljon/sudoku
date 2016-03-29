var sudoku = (function() {

	const DIGITS = ['1','2','3','4','5','6','7','8','9'];
	
	// Check array for item, or check array of cells for cell.value
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

	// Remove item from array
	Array.prototype.remove = function (item) {
		var index = this.indexOf(item);
		if (index > -1) this.splice(index, 1);
	};

	// Remove duplicated cells from array
	Array.prototype.removeDuplicates = function () {
		// Sort by cell.id number
		var cells = this.sort( (a,b) => {
			if (a.id < b.id) return -1;
			if (a.id > b.id) return 1;
			return 0
		});
		var ar = [];
		ar.push(cells[0]);
		for (var i = 1; i < cells.length; i++) {
			if (cells[i].id !== ar[ar.length-1].id) {
				ar.push(cells[i])
			}
		};
		return ar
	};

	Array.prototype.getBlanks = function () {
		var ar = [];
		for (var i =0; i < this.length; i++) {
			if (this[i].value === '') ar.push(this[i])
		}
		return ar;
	};

	
	$('#clear').click(function () {
		sudoku.clear()
	});

	$('#save').click(function () {
		sudoku.save()
	});

	$('#load').click(function () {
		sudoku.load()
	});
	
	$('.solve').click(function (e) {
		switch (e.target.value) {
			case 'Not Search':
				var iterator = sudoku.update();
				sudoku.solve(iterator, true);
				break;
			case 'Box Search':
				var iterator = sudoku.search('box');
				sudoku.solve(iterator, true);
				break;
			case 'Column Search':
				var iterator = sudoku.search('x');
				sudoku.solve(iterator, true);
				break;
			case 'Row Search':
				var iterator = sudoku.search('y');
				sudoku.solve(iterator, true);
				break;
			case 'Solve':
				var iterations = 0;
				console.time('Solve');

				while (sudoku.getBlanks().length) {
					iterations ++;
					for (let n of sudoku.update()) {
					};
					for (let n of sudoku.search('box')) {
					}
					for (let n of sudoku.search('x')) {
					}
					for (let n of sudoku.search('y')) {
					}
					if (++iterations > 19) break;
				}
				console.timeEnd('Solve');
				console.log(iterations + ' iterations');
				if (iterations === 20) {
					console.timeEnd('Solve');
					console.log('Solve failed')
				}
				else {
					console.timeEnd('Solve');
					console.log(iterations + ' iterations');
				}
				break;
			default:
				console.log('No handler found')
		}
	});

	$('.solve').hover(function (e) {
		var info = '';
		switch (e.target.value) {
			case 'Not Search':
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
			this.maybes = ['1','2','3','4','5','6','7','8','9'];

			// Wrap in proxy to enable visualisation of 'thinking'
			var proxy = new Proxy(this, {
				set: function (target, property, value) {
					switch (property) {
						case 'value':
							target.el.value = value;
							break;
					}
					target[property] = value;
				}
			});
			return proxy;
		};
	})();

	// Method to grab all the cells in a given cell's row, column and box
	Cell.prototype.getRemaining = function (prop) {
		var ar = [],
			cells = sudoku.cells;

		for (var i=0; i<cells.length; i++) {
			if (cells[i][prop] === this[prop] &&
				cells[i].id !== this.id) {
				ar.push(cells[i]);
			}
		}
		return ar;
	};

	// Arrow key event handler (bound to cell object)
	Cell.prototype.navigate = function (event) {
		var current = this.value;
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
			case 46: // Delete key
			case 8: // Backspace
				// Reverse the changes made by updateGroup by passing digit to re add to maybes list
				if (current !== '') {
					this.updateGroup(current);
				}
				this.value = '';
				break;
			default:
				var key = String.fromCharCode(event.keyCode);

				if (DIGITS.has(key) && this.couldBe(key)) {
					if (key !== current && current !== '') {
						// Add the deleted digit to the groups' maybes lists
						this.updateGroup(current);
						this.maybes.push(current);
					}
					this.value = key;
					this.updateGroup();
				}
				else {
					event.preventDefault()
				}
		}
	};

	// Returns true if digit is found in cells maybes list
	Cell.prototype.couldBe = function (digit)  {
		for (var i = 0; i < this.maybes.length; i++) {
			if (this.maybes[i] === digit) return true
		}
		return false
	};

	// Updates the cells in a given cells row, column and box when its value has changed
	// Digit parameter is only used when user deletes a digit so the group can re-add it
	Cell.prototype.updateGroup = function (digit) {
		var cells = this.getRemaining('x')
			.concat(this.getRemaining('y'))
			.concat(this.getRemaining('box'))
			.removeDuplicates();

		cells.forEach( (cell) => {
			if (!digit) {
				cell.maybes.remove(this.value);
			}
			else cell.maybes.push(digit);
		})
	};

	Cell.prototype.showPopover = function (e) {
		console.log('show');
		if (!this.value) {
			$('#popover')
			.html('Maybe: ' + this.maybes.sort())
			.css({'top': e.pageY, 'left': e.pageX})
			.show();
		}
	};

	Cell.prototype.hidePopover = function () {
		$('#popover').hide();
	};

	Cell.prototype.flash = function (colour, time) {
		var current = $(this.el).css('background-color');
		$(this.el).animate({backgroundColor: colour}, time);
		$(this.el).animate({backgroundColor: current}, time);
	};

	Cell.prototype.highlight = function (colour) {
		$(this.el).css({backgroundColor: colour});
	};
	
	return {
		cells: [],
		$cells: [],
		config: {
			visuals: true,
			speed: 10
		},
		updater: null,

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

					cell.value = cell.el.value;
					this.cells.push(cell);
				}
			}
			this.$cells = $('.cell');
		},

		clear: function () {
			sudoku.$cells.val('');
			this.cells.forEach(function (cell) {
				cell.value = '';
				cell.maybes = ['1','2','3','4','5','6','7','8','9'];
			})
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
		update: function* () {
			var blanks = this.getBlanks();
			for (var i = 0; i < blanks.length; i++) {
				blanks[i].highlight('pink');
				yield;

				var cells = blanks[i].getRemaining('x')
						.concat(blanks[i].getRemaining('y'))
						.concat(blanks[i].getRemaining('box'))
						.removeDuplicates()
						.getBlanks();

				// Remove any values found in that cells' groups from it's maybes list
				for (var j = 0; j < cells.length; j++) {
					var digit = cells[j].value;
					cells[j].highlight('orange');
					yield;

					if (digit !== '') {
						cells[j].highlight('green');
						blanks[i].maybes.remove(digit);
						blanks[i].highlight('green');
						yield;
					}
					cells[j].highlight('white');
				}
				// Sets value to digit in maybes list if only one remains
				if (blanks[i].maybes.length === 1) {
					blanks[i].value = blanks[i].maybes[0];
					blanks[i].el.style.color = 'pink';
					blanks[i].updateGroup();
					yield;
				}
				blanks[i].highlight('white');

			}
		},

		// Solve method that checks the possible position for each digit in the group
		search: function* (group) {
			var self = this,
				groups = [];

			for (var i = 0; i < 10; i++) {
				groups.push(this.getGroup(group, i))
			}
			for (var i = 0; i < groups.length; i++) {
				for (var j = 0; j < DIGITS.length; j++) {
					if (!groups[i].has(DIGITS[j])) {
						var blanks = self.getBlanks(groups[i]),
							maybes = [];
						for (var k = 0; k < blanks.length; k++) {
							blanks[k].el.value = DIGITS[j];
							yield;
							if (blanks[k].couldBe(DIGITS[j])) {
								blanks[k].highlight('pink');
								maybes.push(blanks[k])
								yield;
							}
							blanks[k].el.value = '';
							blanks[k].highlight('white');
						};
						if (maybes.length === 1) {
							maybes[0].value = DIGITS[j];
							maybes[0].updateGroup();
							maybes[0].el.style.color = 'green';
							yield;
						}
					}
				}
			}
		},

		save: function () {
			// Remove el property before storing as causes circular structure error
			var cells = this.cells.map( (cell) => {
				var save = {};
				save.value = cell.value;
				save.maybes = cell.maybes;
				return save;
			});
			localStorage.setItem('puzzle', JSON.stringify(cells));
		},

		load: function () {
			var cells = JSON.parse(localStorage.getItem('puzzle'));
			for (var i = 0; i < cells.length; i++) {
				for (var prop in cells[i]) {
					this.cells[i][prop] = cells[i][prop]
				}
			}
		},
		solve: function (iterator, visuals = true) {
			if (visuals) {
				var speed = this.config.speed,
					ref = window.setInterval( () => {
						var state = iterator.next();
						if (state.done) {
							window.clearInterval(ref);
						}
					}, speed);
			}
			else {
				while (true) {
					var state = iterator.next();
					if (state.done) break;
				}
			}
		}
	}
})();

sudoku.init();



