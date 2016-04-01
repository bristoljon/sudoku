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

	Array.prototype.removeBlanks = function () {
		var ar = [];
		for (var i =0; i < this.length; i++) {
			if (this[i].value !== '') ar.push(this[i])
		}
		return ar;
	};

	// Returns the cells that are flagged as updated i.e. when their maybes list has changed
	Array.prototype.getUpdated = function () {
		var ar = [];
		for (var i =0; i < this.length; i++) {
			if (this[i].updated === true) ar.push(this[i])
		}
		return ar;
	};

	// Custom jQuery selector replacements used
	var $set = (selection, attribute, flag) => {
		var type = Object.prototype.toString.call( selection );
		if (type === '[object HTMLCollection]') {
			for (var i = 0; i < selection.length; i++) {
				selection[i][attribute] = flag
			}
		}
		else console.log('Not an HTMLCollection')
	};


	var $call = (selection, method, ...args) => {
		var type = Object.prototype.toString.call( selection );
		if (type === '[object HTMLCollection]') {
			for (var i = 0; i < selection.length; i++) {
				selection[i][method].apply(selection[i], args)
			}
		}
		else console.log('Not an HTMLCollection')
	};

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

	// Key press event handler (bound to cell object)
	Cell.prototype.navigate = function (event) {
		//event.preventDefault();
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

	// Removes passed digit from maybes list and flags as updated
	Cell.prototype.cantBe = function (digit)  {
		this.maybes.remove(digit);
		this.updated = true;
	};

	// Adds digit to maybes list and flags as updated
	Cell.prototype.canBe = function (digit)  {
		this.maybes.push(digit);
		this.updated = true;
	};

	// Sets the cell value and updates its groups
	Cell.prototype.is = function (digit) {
		this.value = digit;
		this.el.style.color = 'green';
		this.updateGroup();
		sudoku.savestep();
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
				cell.cantBe(this.value);
			}
			else cell.canBe(digit);
		})
	};

	Cell.prototype.showPopover = function (e) {
		document.getElementById('popover')
			.innerHTML = 'Maybe: ' + this.maybes.sort()
	};

	Cell.prototype.highlight = function (color) {
		this.el.style.backgroundColor = color;
	};

	var sudoku = {
		cells: [],
		config: {
			visuals: 10
		},
		history: [],

		// Generates an array of cells with x, y and box attributes and creates linked
		init: function () {

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

					cell.el.addEventListener('keyup', cell.navigate.bind(cell));
					cell.el.addEventListener('keydown', (e) => {
						e.preventDefault();
					});
					cell.el.addEventListener('keypress', (e) => {
						e.preventDefault();
					});
					cell.el.addEventListener('click', cell.showPopover.bind(cell));
					cell.el.addEventListener('mouseover', cell.showPopover.bind(cell));

					cell.value = cell.el.value;
					this.cells.push(cell);
				}
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
		update: function* () {
			var blanks = this.getBlanks().getUpdated(),
				changed = 0;
			for (var i = 0; i < blanks.length; i++) {
				var blank = blanks[i];
				blank.highlight('pink');
				yield;

				var cells = blank.getRemaining('x')
						.concat(blank.getRemaining('y'))
						.concat(blank.getRemaining('box'))
						.removeDuplicates()
						.removeBlanks();

				// Remove any values found in that cells' groups from it's maybes list
				for (var j = 0; j < cells.length; j++) {
					var cell = cells[j],
						digit = cell.value;
					cell.highlight('orange');
					yield;

					if (digit !== '') {
						cell.highlight('green');
						blank.cantBe(digit);
						blank.highlight('green');
						yield;
					}
					cell.highlight('white');
				}
				// Sets value to digit in maybes list if only one remains
				if (blank.maybes.length === 1) {
					blank.is(blank.maybes[0]);
					changed++;
					yield;
				}
				blank.highlight('white');
				blank.updated = false;
			}
			return changed;
		},

		// Solve method that checks the possible position for each digit in the group
		search: function* (type) {
			var groups = [],
				changed = 0;

			for (let i = 0; i < 10; i++) {
				groups.push(this.getGroup(type, i))
			}
			for (let i = 0; i < groups.length; i++) {
				let group = groups[i];
				for (var j = 0; j < DIGITS.length; j++) {
					let digit = DIGITS[j];
					if (!group.has(digit)) {
						var blanks = this.getBlanks(group),
							maybes = [];
						for (var k = 0; k < blanks.length; k++) {
							let blank = blanks[k];
							blank.el.value = digit;
							if (blank.couldBe(digit)) {
								blank.highlight('green');
								maybes.push(blank)
							}
							else {
								blank.highlight('red');
							}
							yield;
							blank.el.value = '';
							blank.highlight('white');

						};
						if (maybes.length === 1) {
							maybes[0].is(digit);
							changed ++;
							yield;
						}
						else if (maybes.length === 2 && type === 'box') {
							sudoku.paircheck(maybes, digit);
						}
					}
				}
			}
			return changed;
		},

		// If box search determines a digit can only be in 2 cells, this method checks if those
		// cells are in the same row or column and updates the rest of the row accordingly
		paircheck: function (maybes, digit) {

			['x','y'].forEach( (group) => {
				if (maybes[0][group] === maybes[1][group]) {
					let others = maybes[0].getRemaining([group]);
					for (let i = 0; i < others.length; i++) {
						let other = others[i];
						if (other.id !== maybes[1].id) {
							other.cantBe(digit)
						}
					}
				}
			})
		},

		// Called every time a value is found. If current step is less than history length,
		// it deletes the remaining history and adds from that point.
		savestep: function () {
			if (this.history.current < this.history.length - 1) {
				this.history.length = this.history.current + 1
			}
			this.history.push(sudoku.save());
			this.history.current = this.history.length - 1;
		},

		// Arrow key event handler, lots of room for out by 1 hell but works ok
		step: function (direction) {
			var current = this.history.current;
			switch (direction) {
				case 'back':
					if (current > 0) {
						this.history.current = current -1;
						this.load('history', this.history.current);
					}
					break;
				case 'forward':
					if (current < this.history.length - 1) {
						this.history.current = current + 1;
						this.load('history', this.history.current);
					}
					break;
			}
		},

		clear: function () {
			this.cells.forEach(function (cell) {
				cell.value = '';
				cell.maybes = ['1','2','3','4','5','6','7','8','9'];
				cell.el.style.color = 'black';
				cell.highlight('white');
			})
		},

		// Saves current state under name if provided or returns state as JSON for use by savestep()
		save: function (name) {
			// Remove el property before storing as causes circular structure error
			var cells = this.cells.map( (cell) => {
				var save = {};
				save.value = cell.value;
				save.maybes = cell.maybes;
				save.updated = cell.updated;
				return save;
			});
			if (name) localStorage.setItem(name, JSON.stringify(cells));
			else return JSON.stringify(cells)
		},

		// If store is 'history', i.e. when called by step(), load JSON from history array
		// Otherwise load from localstorage and reset history array
		load: function (store, step) {
			this.clear();
			var cells;
			// If loading step from history store will be history array
			if (store === 'history') {
				cells = JSON.parse(this.history[step])
			}
			else {
				cells = JSON.parse(localStorage.getItem(store));
			}
			for (var i = 0; i < cells.length; i++) {
				for (var prop in cells[i]) {
					this.cells[i][prop] = cells[i][prop]
				}
			}
			// If loaded from storage reset history and save first step
			if (store !== 'history') {
				sudoku.history = [];
				sudoku.savestep()
			}
		},

		// Takes a generator method (bound to sudoku object), creates an iterator.
		// Returns a promise resolved when iterator is done or, if repeat flag is
		// set - self invokes until no further values are found.
		solve: function (method, repeat, ...args) {
			var self = this,
				visuals = this.config.visuals;
			return new Promise(function (resolve, reject) {
				if (visuals && !repeat) {
					self.solveAsync(method, args[0])
						.then( () => {}, blanks => { resolve(blanks) })
				}
				else if (visuals && repeat) {
					let loop = () => {
						self.solveAsync(method, args[0])
							.then((blanks) => {
								resolve(blanks)
							}, () => {
								loop()
							})
					};
					loop()
				}
				else if (!visuals && repeat) {
					let loops = 0;
					while (self.solveSync(method, args[0])) {
						loops++
					}
					resolve(self.cells.getBlanks().length)
				}
				else if (!visuals && !repeat) {
					self.solveSync(method, args[0]);
					resolve(self.cells.getBlanks().length)
				}
				else console.log('you slipped through the net')
			});
		},

		// Rejects promise if last run found values, otherwise resolves
		solveAsync: function (method,...args) {
			var self = this,
				speed = this.config.visuals,
				iterator = method(args[0]),
				start = this.cells.getBlanks().length;
			return new Promise(function (resolve, reject) {
				var ref = window.setInterval(() => {
					var state = iterator.next();
					if (state.done) {
						window.clearInterval(ref);
						let end = self.cells.getBlanks().length,
							found = start - end;
						if (found) {
							reject(end)
						}
						else resolve(end)
					}
				}, speed);
			});
		},

		// Synchronous / blocking iterator method, returns number of values
		// found
		solveSync: function (method,...args) {
			var self = this,
				iterator = method(args[0]),
				start = this.cells.getBlanks().length;

			while (true) {
				var state = iterator.next();
				if (state.done) break;
			}
			let end = self.cells.getBlanks().length;
			return start - end;
		}
	};

	// Event listeners
	document.getElementById('clear').addEventListener('click', () => {
		sudoku.clear()
	});

	document.getElementById('save').addEventListener('click', () => {
		sudoku.save('puzzle')
	});

	document.getElementById('load').addEventListener('click', () => {
		sudoku.load('puzzle')
	});

	$call(document.getElementsByClassName('visual'), 'addEventListener', 'click',
	(e) => {
		var buttons = document.getElementsByClassName('visual');
		[].forEach.call(buttons, (el) => {
				el.classList.remove('active');
		});
		e.target.classList.add('active');
		switch (e.target.innerText) {
			case 'Slow':
				sudoku.config.visuals = 500
				break;
			case 'Fast':
				sudoku.config.visuals = 10;
				break;
			case 'Ultra':
				sudoku.config.visuals = 0;
				break;
		}
	});

	document.getElementById('backStep').addEventListener('click', () => {
		sudoku.step('back')
	});

	document.getElementById('forwardStep').addEventListener('click', () => {
		sudoku.step('forward')
	});

	$call(document.getElementsByClassName('solve'), 'addEventListener', 'click',
	(e) => {
		var buttons = document.getElementsByClassName('solve');
		$set(buttons, 'disabled', true);
		switch (e.target.value) {
			case 'Not Search':
				sudoku.solve(sudoku.update.bind(sudoku), false)
					.then( () => { $set(buttons, 'disabled', false); });
				break;
			case 'Box Search':
				sudoku.solve(sudoku.search.bind(sudoku), false, 'box')
					.then( () => { $set(buttons, 'disabled', false); });
				break;
			case 'Column Search':
				sudoku.solve(sudoku.search.bind(sudoku), false, 'x')
					.then( () => { $set(buttons, 'disabled', false); });
				break;
			case 'Row Search':
				sudoku.solve(sudoku.search.bind(sudoku), false, 'y')
					.then( () => { $set(buttons, 'disabled', false); });
				break;
			case 'Solve':
				console.time('Solve');
				sudoku.solve(sudoku.update.bind(sudoku), true)
					.then( (blanks) => {
						if (blanks) sudoku.solve(sudoku.search.bind(sudoku), true, 'box');
					})
					.then( (blanks) => {
						if (blanks) sudoku.solve(sudoku.search.bind(sudoku), true, 'x');
					})
					.then( (blanks) => {
						if (blanks) sudoku.solve(sudoku.search.bind(sudoku), true, 'y');
					})
					.then( (blanks) => {
						$set(buttons, 'disabled', false);
						if (blanks) {
							console.timeEnd('Solve');
							console.log('Solve failed');
							console.log(blanks)
						}
						else {
							console.timeEnd('Solve');
							console.log('Solve succeeded');
							console.log(blanks)
						}
					});
				break;
			default:
				console.log('No handler found')
				break;
		}
	});
	return sudoku
})();

sudoku.init();

localStorage.setItem('puzzle', '[{"value":"4","maybes":["3","4","9"],"updated":true},{"value":"","maybes":["3","9"],"updated":true},{"value":"","maybes":["5"],"updated":true},{"value":"8","maybes":["3","5","8","9"],"updated":true},{"value":"2","maybes":["2","3","5","6","9"],"updated":true},{"value":"7","maybes":["3","5","6","7","9"],"updated":true},{"value":"","maybes":["5","6","9"],"updated":true},{"value":"","maybes":["1","5","6"],"updated":true},{"value":"","maybes":["1","6","9"],"updated":true},{"value":"1","maybes":["1","3","7","8","9"],"updated":true},{"value":"","maybes":["3","7","8","9"],"updated":true},{"value":"","maybes":["5","7"],"updated":true},{"value":"","maybes":["3","5","9"],"updated":true},{"value":"","maybes":["3","5","6","9"],"updated":true},{"value":"","maybes":["3","5","6","9"],"updated":true},{"value":"2","maybes":["2","4","5","6","7","9"],"updated":true},{"value":"","maybes":["4","5","6","7"],"updated":true},{"value":"","maybes":["4","6","7","9"],"updated":true},{"value":"","maybes":["2","7","9"],"updated":true},{"value":"6","maybes":["2","6","7","9"],"updated":true},{"value":"","maybes":["2","5","7"],"updated":true},{"value":"4","maybes":["4","5","9"],"updated":true},{"value":"","maybes":["5","9"],"updated":true},{"value":"1","maybes":["1","5","9"],"updated":true},{"value":"3","maybes":["3","5","7","9"],"updated":true},{"value":"8","maybes":["5","7","8"],"updated":true},{"value":"","maybes":["7","9"],"updated":true},{"value":"5","maybes":["2","5","6","7","8","9"],"updated":true},{"value":"1","maybes":["1","2","4","7","8","9"],"updated":true},{"value":"3","maybes":["2","3","4","6","7"],"updated":true},{"value":"","maybes":["2","9"],"updated":true},{"value":"","maybes":["4","6","7","9"],"updated":true},{"value":"","maybes":["6","8","9"],"updated":true},{"value":"","maybes":["4","6","7","8"],"updated":true},{"value":"","maybes":["2","4","6","7"],"updated":true},{"value":"","maybes":["4","6","7","8"],"updated":true},{"value":"","maybes":["2","6","7","8","9"],"updated":true},{"value":"","maybes":["2","4","7","8","9"],"updated":true},{"value":"","maybes":["2","4","6","7"],"updated":true},{"value":"","maybes":["1","2","3","5","9"],"updated":true},{"value":"","maybes":["1","3","4","5","6","7","9"],"updated":true},{"value":"","maybes":["3","5","6","8","9"],"updated":true},{"value":"","maybes":["4","5","6","7","8"],"updated":true},{"value":"","maybes":["2","4","5","6","7"],"updated":true},{"value":"","maybes":["4","6","7","8"],"updated":true},{"value":"","maybes":["2","6","7","8"],"updated":true},{"value":"","maybes":["2","4","7","8"],"updated":true},{"value":"","maybes":["2","4","6","7"],"updated":true},{"value":"","maybes":["2","5"],"updated":true},{"value":"","maybes":["4","5","6","7"],"updated":true},{"value":"","maybes":["5","6","8"],"updated":true},{"value":"1","maybes":["1","4","5","6","7","8"],"updated":true},{"value":"9","maybes":["2","4","5","6","7","9"],"updated":true},{"value":"3","maybes":["3","4","6","7","8"],"updated":true},{"value":"","maybes":["7"],"updated":true},{"value":"5","maybes":["4","5","7"],"updated":true},{"value":"8","maybes":["1","4","7","8"],"updated":true},{"value":"6","maybes":["1","6","9"],"updated":true},{"value":"","maybes":["1","9"],"updated":true},{"value":"2","maybes":["2","9"],"updated":true},{"value":"","maybes":["4","7","9"],"updated":true},{"value":"3","maybes":["1","3","4","7"],"updated":true},{"value":"","maybes":["1","4","7","9"],"updated":true},{"value":"","maybes":["3","6","7"],"updated":true},{"value":"","maybes":["3","4","7"],"updated":true},{"value":"9","maybes":["1","4","6","7","9"],"updated":true},{"value":"","maybes":["1","3","5"],"updated":true},{"value":"","maybes":["1","3","5"],"updated":true},{"value":"","maybes":["3","5"],"updated":true},{"value":"","maybes":["4","6","7","8"],"updated":true},{"value":"","maybes":["1","4","6","7"],"updated":true},{"value":"2","maybes":["1","2","4","6","7","8"],"updated":true},{"value":"","maybes":["2","3","6"],"updated":true},{"value":"","maybes":["2","3"],"updated":true},{"value":"","maybes":["1","2","6"],"updated":true},{"value":"7","maybes":["1","3","7","9"],"updated":true},{"value":"8","maybes":["1","3","8","9"],"updated":true},{"value":"4","maybes":["3","4","9"],"updated":true},{"value":"","maybes":["6","9"],"updated":true},{"value":"","maybes":["1","6"],"updated":true},{"value":"5","maybes":["1","5","6","9"],"updated":true}]')
sudoku.load('puzzle');
