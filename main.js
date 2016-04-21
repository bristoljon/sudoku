(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./script.js":[function(require,module,exports){
'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('babel-polyfill');

var Sudoku = function () {
  var DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  // Allows checking array of cells for value.
  Array.prototype.has = function (item) {
    for (var i = 0; i < this.length; i++) {
      if (this[i].value === item) return true;
    }
    return false;
  };

  // Remove duplicated cells from array
  Array.prototype.removeDuplicates = function () {
    // Sort by cell.id number
    var cells = this.sort(function (a, b) {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
    var ar = [];
    ar.push(cells[0]);
    for (var i = 1; i < cells.length; i++) {
      if (cells[i].id !== ar[ar.length - 1].id) {
        ar.push(cells[i]);
      }
    };
    return ar;
  };

  Array.prototype.getBlanks = function () {
    var ar = [];
    for (var i = 0; i < this.length; i++) {
      if (this[i].value === '') ar.push(this[i]);
    }
    return ar;
  };

  Array.prototype.removeBlanks = function () {
    var ar = [];
    for (var i = 0; i < this.length; i++) {
      if (this[i].value !== '') ar.push(this[i]);
    }
    return ar;
  };

  // Returns the cells that are flagged as updated i.e. when their maybes list has changed
  Array.prototype.getUpdated = function () {
    var ar = [];
    for (var i = 0; i < this.length; i++) {
      if (this[i].updated === true) ar.push(this[i]);
    }
    return ar;
  };

  // Takes a cell prototype method (as a string) and calls it on all cells in
  // the array. e.g. cells.all('highlight','white')
  Array.prototype.all = function (method) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    for (var i = 0; i < this.length; i++) {
      this[i][method].call(this[i], args);
    }
    return this;
  };

  // Returns 'x' or 'y' if selection are all in the same one. Used by paircheck
  Array.prototype.areSameGroup = function () {
    var last = this[this.length - 1];
    if (this.every(function (cell) {
      return cell.x === last.x;
    })) return 'x';
    if (this.every(function (cell) {
      return cell.y === last.y;
    })) return 'y';
    return false;
  };

  // Removes cells from selection, expects array of cells. Used by paircheck.
  // Bit of a hack actually, needs revisiting
  Array.prototype.removeCells = function (cells) {
    return this.filter(function (cell) {
      var include = true;
      for (var i = 0; i < cells.length; i++) {
        if (cell.id === cells[i].id) include = false;
      }
      return include;
    });
  };

  // Custom jQuery selector replacements to allow setting attributes of
  // HTMLCollections
  HTMLCollection.prototype.set = function (attribute, flag) {
    for (var i = 0; i < this.length; i++) {
      this[i][attribute] = flag;
    }
  };

  // Same but for calling methods of elements in an HTMLCollection, used
  // for adding event listeners to solve buttons.
  HTMLCollection.prototype.call = function (method) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    for (var i = 0; i < this.length; i++) {
      this[i][method].apply(this[i], args);
    }
  };

  NodeList.prototype.call = HTMLCollection.prototype.call;

  NodeList.prototype.set = HTMLCollection.prototype.set;

  // Cell constructor that adds unique ID to each one
  var Cell = function () {
    var counter = 0;
    return function (x, y) {
      this.x = x;
      this.y = y;
      this.id = counter++;
      this.maybes = new _set2.default(DIGITS);
    };
  }();

  // Method to grab all the cells in a given cell's row, column and box
  Cell.prototype.getRemaining = function (prop) {
    var ar = [],
        cells = Sudoku.cells;

    for (var i = 0; i < cells.length; i++) {
      if (cells[i][prop] === this[prop] && cells[i].id !== this.id) {
        ar.push(cells[i]);
      }
    }
    return ar;
  };

  // Key press event handler (bound to cell object)
  Cell.prototype.navigate = function (event) {
    var current = this.value;
    switch (event.keyCode) {
      case 37:
        // Left
        if (this.x > 0) {
          Sudoku.getCell(this.x - 1, this.y).el.focus();
        } else {
          Sudoku.getCell(8, this.y - 1).el.focus();
        }
        break;
      case 38:
        // Up
        if (this.y > 0) {
          Sudoku.getCell(this.x, this.y - 1).el.focus();
        }
        break;
      case 39:
        // Right
        if (this.x < 8) {
          Sudoku.getCell(this.x + 1, this.y).el.focus();
        } else {
          Sudoku.getCell(0, this.y + 1).el.focus();
        }
        break;
      case 40:
        //Down
        if (this.y < 8) {
          Sudoku.getCell(this.x, this.y + 1).el.focus();
        }
        break;
      case 46: // Delete key
      case 8:
        // Backspace
        // Reverse the changes made by updateGroup by passing digit to re add to maybes list
        if (current !== '') {
          this.updateGroup(current);
        }
        this.value = '';
        this.el.value = '';
        break;
      default:
        var key = String.fromCharCode(event.keyCode);

        if (this.couldBe(key)) {
          this.el.style.color = '#222';
          if (key !== current && current !== '') {
            // Add the deleted digit to the groups' maybes lists
            this.updateGroup(current);
            this.maybes.add(current);
          }
          this.value = key;
          this.el.value = key;
          try {
            this.updateGroup();
          } catch (e) {
            alert(e);
          }
        } else {
          event.preventDefault();
        }
    }
  };

  // Returns true if digit is found in cells maybes list
  Cell.prototype.couldBe = function (digit) {
    if (this.maybes.has(digit)) return true;
    return false;
  };

  // Removes passed digit from maybes list and flags as updated
  Cell.prototype.cantBe = function (digit) {
    this.maybes.delete(digit);
    if (this.maybes.size < 1) {
      throw new Error('Well one of us has made a mistake.. This puzzle appears to be unsolvable.');
    } else if (Sudoku.config.notcheck && !this.value && this.canOnlyBe()) {
      this.is(this.canOnlyBe(), 'notcheck');
    } else this.updated = true;
  };

  // Adds digit to maybes list and flags as updated
  Cell.prototype.canBe = function (digit) {
    this.maybes.add(digit);
    this.updated = true;
  };

  // Checks maybes set, if only one digit, returns it. Otherwise false
  Cell.prototype.canOnlyBe = function () {
    if (this.maybes.size === 1) {
      return [].concat((0, _toConsumableArray3.default)(this.maybes))[0];
    }
    return false;
  };

  // Sets the cell value and updates its groups, changes color to that passed so
  // can identify what method solved that cell
  Cell.prototype.is = function (digit, color) {
    switch (color) {
      case 'box':
        color = 'chartreuse';
        break;
      case 'x':
        color = 'deepskyblue';
        break;
      case 'y':
        color = 'orange';
        break;
      case 'tree':
        color = 'gray';
        break;
      case 'line':
        color = 'olive';
        break;
      case 'notsearch':
        color = 'darkorchid';
        break;
      case 'notcheck':
        color = 'hotpink';
        break;
    }
    this.el.value = digit;
    this.value = digit;
    this.el.style.color = color;
    this.updateGroup();
    Sudoku.savestep();
  };

  // Updates the cells in a given cells row, column and box when its value has changed
  // Digit parameter is only used when user deletes a digit so the group can re-add it
  Cell.prototype.updateGroup = function (digit) {
    var _this = this;

    var cells = this.getRemaining('x').concat(this.getRemaining('y')).concat(this.getRemaining('box')).removeDuplicates();

    cells.forEach(function (cell) {
      if (!digit) {
        cell.cantBe(_this.value);
      } else cell.canBe(digit);
    });
  };

  Cell.prototype.showPopover = function (e) {
    document.getElementById('popover').innerHTML = 'Maybe: ' + [].concat((0, _toConsumableArray3.default)(this.maybes)).sort();
  };

  Cell.prototype.highlight = function (color) {
    this.el.style.backgroundColor = color;
  };

  var Sudoku = {
    cells: [],
    config: {
      visuals: 10,
      linecheck: false,
      treesearch: false,
      notcheck: false
    },
    history: [],

    // Generates an array of cells with x, y and box attributes
    // Creates an input element and appends it to its box
    // Adds keypress event listeners (and prevents deafults for mobile)
    init: function init() {

      for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 9; x++) {
          var cell = new Cell(x, y);
          if (y < 3) {
            if (x < 3) cell.box = 0;else if (x < 6) cell.box = 1;else cell.box = 2;
          } else if (y < 6) {
            if (x < 3) cell.box = 3;else if (x < 6) cell.box = 4;else cell.box = 5;
          } else {
            if (x < 3) cell.box = 6;else if (x < 6) cell.box = 7;else cell.box = 8;
          }
          cell.el = document.createElement('input');
          cell.el.setAttribute('type', 'number');
          cell.el.setAttribute('class', 'cell');
          cell.el.setAttribute('maxlength', '1');
          var box = document.getElementById(cell.box);
          box.appendChild(cell.el);

          cell.el.addEventListener('keyup', cell.navigate.bind(cell));
          cell.el.addEventListener('keydown', function (e) {
            e.preventDefault();
          });
          cell.el.addEventListener('keypress', function (e) {
            e.preventDefault();
          });
          cell.el.addEventListener('click', cell.showPopover.bind(cell));
          cell.el.addEventListener('mouseover', cell.showPopover.bind(cell));

          this.cells.push(cell);
        }
      }
    },

    getGroup: function getGroup(group, id) {
      var cells = this.cells,
          ar = [];
      for (var i = 0; i < cells.length; i++) {
        if (cells[i][group] === id) {
          ar.push(cells[i]);
        }
      }
      return ar;
    },

    getCell: function getCell(x, y) {
      var cells = this.cells;
      for (var i = 0; i < cells.length; i++) {
        if (cells[i].x === x && cells[i].y === y) {
          return cells[i];
        }
      }
    },

    solve: function solve() {
      return new _promise2.default(function (resolve, reject) {
        var iterations = 0,
            loop = function loop() {
          var start = Sudoku.cells.getBlanks().length;
          Sudoku.run(Sudoku.update, true).then(function (blanks) {
            if (blanks) return Sudoku.run(Sudoku.search, true, 'box');
          }).then(function (blanks) {
            if (blanks) return Sudoku.run(Sudoku.search, true, 'x');
          }).then(function (blanks) {
            if (blanks) return Sudoku.run(Sudoku.search, true, 'y');
          }).then(function (blanks) {
            var found = start - Sudoku.cells.getBlanks().length;
            if (blanks && found && iterations < 10) {
              iterations++;
              loop();
            } else {
              resolve(blanks);
            }
          }).catch(function (e) {
            reject(e);
          });
        };
        loop();
      }).then(function (blanks) {
        if (blanks && Sudoku.config.treesearch) {
          console.log('Unsuccessful, starting treesearch...');
          return Sudoku.treesearch();
        } else if (!blanks) {
          console.log('Successful');
        } else {
          console.log('Unsuccessful, try enabling tree search');
          return _promise2.default.reject('Failed to solve. Try enabling Tree Search');
        }
      });
    },

    treesearch: function treesearch() {
      var _this2 = this;

      var start = this.savestep(),
          index = 0,
          blanks = this.cells.getBlanks().sort(function (a, b) {
        return a.maybes.size - b.maybes.size;
      });
      return new _promise2.default(function (resolve, reject) {
        var blank = blanks[0],
            options = [].concat((0, _toConsumableArray3.default)(blank.maybes)),
            loop = function loop(options) {
          _this2.load('history', start);
          blank.is(options[index++], 'tree');
          _this2.solve().then(function (m) {
            resolve(m);
          }, function (e) {
            loop(options);
          });
        };
        loop(options);
      });
    },

    // Takes a generator method (bound to Sudoku object), creates an iterator.
    // Returns a promise resolved when iterator is done or, if repeat flag is
    // set - self invokes until no further values are found.
    run: function run(method, repeat) {
      for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
        args[_key3 - 2] = arguments[_key3];
      }

      var self = this,
          visuals = this.config.visuals,
          method = method.bind(this);
      return new _promise2.default(function (resolve, reject) {
        if (visuals && !repeat) {
          self.runAsync(method, args[0]).then(function (found) {
            resolve(found);
          }, function (reason) {
            reject(reason);
          });
        } else if (visuals && repeat) {
          (function () {
            var loop = function loop() {
              self.runAsync(method, args[0]).then(function (found) {
                var blanks = self.cells.getBlanks().length;
                if (found && blanks) loop();else resolve(blanks);
              }, function (reason) {
                reject(reason);
              });
            };
            loop();
          })();
        } else if (!visuals && repeat) {
          var loops = 0;
          while (self.runSync(method, args[0])) {
            loops++;
          }
          resolve(self.cells.getBlanks().length);
        } else if (!visuals && !repeat) {
          self.runSync(method, args[0]);
          resolve(self.cells.getBlanks().length);
        } else console.log('you slipped through the net');
      });
    },

    // Calls next on iterator at setintervals until generator is done or
    // _stop flag is set to true.
    // Fulfils promise with number of values found in last run
    // Rejects if stopped
    runAsync: function runAsync(method) {
      for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }

      var self = this,
          speed = this.config.visuals,
          iterator = method.apply(this, args),
          start = this.cells.getBlanks().length;
      return new _promise2.default(function (resolve, reject) {
        self._timer = window.setInterval(function () {
          var step = iterator.next();
          if (self._stop && step.value >= 0 || step.done) {
            window.clearInterval(self._timer);
            self._timer = null;
            if (self._stop) {
              reject('Scan stopped');
              self._stop = false;
              self.cells.all('highlight', 'white');
            } else resolve(step.value);
          }
        }, speed);
      });
    },

    // Synchronous / blocking iterator method, returns number of values
    // found
    runSync: function runSync(method) {
      for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
      }

      var self = this,
          iterator = method.apply(this, args);

      while (true) {
        var state = iterator.next();
        if (state.done) break;
      }
      return state.value;
    },

    // Search every blank cells' row, column and box and remove any values
    // found from it's maybes list. If only one remains, enter it.
    update: _regenerator2.default.mark(function update() {
      var blanks, changed, i, blank, cells, j, cell, digit;
      return _regenerator2.default.wrap(function update$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              blanks = this.cells.getBlanks().getUpdated(), changed = 0;
              i = 0;

            case 2:
              if (!(i < blanks.length)) {
                _context.next = 24;
                break;
              }

              blank = blanks[i];
              cells = blank.getRemaining('x').concat(blank.getRemaining('y')).concat(blank.getRemaining('box')).removeDuplicates().removeBlanks();

              // Remove any values found in that cells' groups from it's maybes list

              j = 0;

            case 6:
              if (!(j < cells.length)) {
                _context.next = 18;
                break;
              }

              cell = cells[j], digit = cell.value;

              if (!(digit !== '')) {
                _context.next = 14;
                break;
              }

              cell.highlight('orange');
              blank.cantBe(digit);
              blank.highlight('green');
              _context.next = 14;
              return changed;

            case 14:
              cell.highlight('white');

            case 15:
              j++;
              _context.next = 6;
              break;

            case 18:
              // Sets value to digit in maybes list if only one remains
              if (blank.canOnlyBe()) {
                blank.is(blank.canOnlyBe(), 'notsearch');
                changed++;
              }
              blank.highlight('white');
              blank.updated = false;

            case 21:
              i++;
              _context.next = 2;
              break;

            case 24:
              return _context.abrupt('return', changed);

            case 25:
            case 'end':
              return _context.stop();
          }
        }
      }, update, this);
    }),

    // Solve method that checks the possible position for each digit in the group
    // If only one found, enters it. Yield statements are breakponts for visuals
    // yield(changed) acts as stop point if user cancels search
    search: _regenerator2.default.mark(function search(type) {
      var groups, changed, i, _i, group, j, digit, blanks, maybes, k, blank;

      return _regenerator2.default.wrap(function search$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              groups = [], changed = 0;

              for (i = 0; i < 9; i++) {
                groups.push(this.getGroup(type, i));
              }
              _i = 0;

            case 3:
              if (!(_i < groups.length)) {
                _context2.next = 44;
                break;
              }

              group = groups[_i];
              j = 0;

            case 6:
              if (!(j < DIGITS.length)) {
                _context2.next = 41;
                break;
              }

              digit = DIGITS[j];

              if (group.has(digit)) {
                _context2.next = 38;
                break;
              }

              blanks = group.getBlanks(), maybes = [];
              k = 0;

            case 11:
              if (!(k < blanks.length)) {
                _context2.next = 22;
                break;
              }

              blank = blanks[k];

              blank.el.value = digit;
              if (blank.couldBe(digit)) {
                blank.highlight('green');
                maybes.push(blank);
              } else {
                blank.highlight('red');
              }
              _context2.next = 17;
              return changed;

            case 17:
              blank.el.value = '';
              blank.highlight('white');

            case 19:
              k++;
              _context2.next = 11;
              break;

            case 22:
              ;

              if (!(maybes.length === 0)) {
                _context2.next = 27;
                break;
              }

              throw new Error(type + ' search failed: This puzzle appears to be unsolvable.');

            case 27:
              if (!(maybes.length === 1)) {
                _context2.next = 32;
                break;
              }

              maybes[0].is(digit, type);
              changed++;
              _context2.next = 35;
              break;

            case 32:
              if (!(type === 'box' && this.config.linecheck)) {
                _context2.next = 35;
                break;
              }

              if (!(maybes.length === 2 || maybes.length === 3)) {
                _context2.next = 35;
                break;
              }

              return _context2.delegateYield(this.linecheck(maybes, digit), 't0', 35);

            case 35:
              _context2.next = 37;
              return changed;

            case 37:
              maybes.all('highlight', 'white');

            case 38:
              j++;
              _context2.next = 6;
              break;

            case 41:
              _i++;
              _context2.next = 3;
              break;

            case 44:
              return _context2.abrupt('return', changed);

            case 45:
            case 'end':
              return _context2.stop();
          }
        }
      }, search, this);
    }),

    // If box search determines a digit can only be in 2 or 3 cells, this method
    // checks if those cells are in the same row or column and updates the rest
    // of the row or column accordingly
    linecheck: _regenerator2.default.mark(function linecheck(maybes, digit) {
      var group, others, i, other;
      return _regenerator2.default.wrap(function linecheck$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              // Check that all cells are on the same row or column
              group = maybes.areSameGroup();

              if (!group) {
                _context3.next = 21;
                break;
              }

              maybes.all('highlight', 'green');
              _context3.next = 5;
              return;

            case 5:
              others = maybes[0].getRemaining(group).getBlanks().removeCells(maybes);
              i = 0;

            case 7:
              if (!(i < others.length)) {
                _context3.next = 21;
                break;
              }

              other = others[i];


              other.highlight('pink');
              other.cantBe(digit);
              _context3.next = 13;
              return;

            case 13:
              if (!other.canOnlyBe()) {
                _context3.next = 17;
                break;
              }

              other.is(other.canOnlyBe(), 'line');
              _context3.next = 17;
              return 1;

            case 17:
              other.highlight('white');

            case 18:
              i++;
              _context3.next = 7;
              break;

            case 21:
              maybes.all('highlight', 'white');

            case 22:
            case 'end':
              return _context3.stop();
          }
        }
      }, linecheck, this);
    }),

    // Called every time a value is found. If current step is less than history
    // length, it deletes the remaining history and adds from that point.
    savestep: function savestep() {
      if (this.history.current < this.history.length - 1) {
        this.history.length = this.history.current + 1;
      }
      this.history.push(Sudoku.save());
      this.history.current = this.history.length - 1;
      return this.history.current;
    },

    // Arrow key event handler, lots of room for out by 1 hell but works ok
    step: function step(direction) {
      var current = this.history.current;
      switch (direction) {
        case 'back':
          if (current > 0) {
            this.history.current = current - 1;
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

    clear: function clear() {
      if (this._timer) this._stop = true;
      this.cells.forEach(function (cell) {
        cell.value = '';
        cell.el.value = '';
        cell.maybes = new _set2.default(DIGITS);
        cell.el.style.color = 'black';
        cell.highlight('white');
      });
    },

    // Saves current state under name if provided or returns state as JSON for use by savestep()
    save: function save(name) {
      // Remove el property before storing as causes circular structure error
      var cells = this.cells.map(function (cell) {
        var save = {};
        save.value = cell.value;
        save.maybes = [].concat((0, _toConsumableArray3.default)(cell.maybes));
        save.updated = cell.updated;
        save.color = cell.el.style.color;
        return save;
      });
      if (name) localStorage.setItem(name, (0, _stringify2.default)(cells));else return (0, _stringify2.default)(cells);
    },

    // If store is 'history', i.e. when called by step(), load JSON from history array
    // Otherwise load from localstorage and reset history array
    load: function load(store, step) {
      this.clear();
      var cells;
      // If loading step from history store will be history array
      if (store === 'history') {
        cells = JSON.parse(this.history[step]);
      } else {
        cells = JSON.parse(localStorage.getItem(store));
      }
      for (var i = 0; i < cells.length; i++) {
        for (var prop in cells[i]) {
          this.cells[i][prop] = cells[i][prop];
        }
        this.cells[i].maybes = new _set2.default(this.cells[i].maybes);
        this.cells[i].el.value = this.cells[i].value;
        this.cells[i].el.style.color = cells[i].color;
      }
      // If loaded from storage reset history and save first step
      if (store !== 'history') {
        Sudoku.history = [];
        Sudoku.savestep();
      }
    }
  };

  // Event listeners
  document.getElementById('clear').addEventListener('click', function () {
    Sudoku.clear();
  });

  document.getElementById('save').addEventListener('click', function () {
    Sudoku.save('puzzle');
  });

  document.getElementById('load').addEventListener('click', function () {
    Sudoku.load('puzzle');
  });

  document.getElementsByClassName('visual').call('addEventListener', 'click', function (e) {
    var buttons = document.getElementsByClassName('visual');
    [].forEach.call(buttons, function (el) {
      el.classList.remove('active');
    });
    e.target.classList.add('active');
    switch (e.target.innerText) {
      case 'SLOW':
        Sudoku.config.visuals = 250;
        break;
      case 'FAST':
        Sudoku.config.visuals = 10;
        break;
      case 'ULTRA':
        Sudoku.config.visuals = 0;
        break;
    }
  });

  document.getElementById('backStep').addEventListener('click', function () {
    Sudoku.step('back');
  });

  document.getElementById('forwardStep').addEventListener('click', function () {
    Sudoku.step('forward');
  });

  document.getElementById('notcheck').addEventListener('click', function (e) {
    if (Sudoku.config.notcheck === false) {
      Sudoku.config.notcheck = true;
      e.target.classList.add('active');
    } else {
      Sudoku.config.notcheck = false;
      e.target.classList.remove('active');
    }
  });

  document.getElementById('linecheck').addEventListener('click', function (e) {
    if (Sudoku.config.linecheck === false) {
      Sudoku.config.linecheck = true;
      e.target.classList.add('active');
    } else {
      Sudoku.config.linecheck = false;
      e.target.classList.remove('active');
    }
  });

  document.getElementById('treesearch').addEventListener('click', function (e) {
    if (Sudoku.config.treesearch === false) {
      Sudoku.config.treesearch = true;
      e.target.classList.add('active');
    } else {
      Sudoku.config.treesearch = false;
      e.target.classList.remove('active');
    }
  });

  document.getElementsByClassName('solve').call('addEventListener', 'click', function (e) {
    console.time(e.target.value);
    var buttons = document.getElementsByClassName('solve');
    buttons.set('disabled', true);
    var done = function done() {
      console.timeEnd(e.target.value);
      buttons.set('disabled', false);
      e.target.classList.remove('btn-danger');
      e.target.classList.add('btn-success');
    };

    // Check Sudoku is not currently scanning
    if (!Sudoku._timer) {
      var choice = function choice(btn) {
        switch (btn) {
          case 'Not Search':
            return run(Sudoku.update);
          case 'Box Search':
            return run(Sudoku.search, 'box');
          case 'Column Search':
            return run(Sudoku.search, 'x');
          case 'Row Search':
            return run(Sudoku.search, 'y');
          case 'Solve':
            return Sudoku.solve();
          default:
            console.log('No handler found');
            break;
        }
      };

      var run = function run(method, arg) {
        return Sudoku.run(method, false, arg);
      };

      e.target.disabled = false;
      e.target.classList.remove('btn-success');
      e.target.classList.add('btn-danger');

      ;

      choice(e.target.value).then(done).catch(function (e) {
        done();
        alert(e);
      });
    } else {
      Sudoku._stop = true;
    }
  });
  return Sudoku;
}();

// Browser check for compatibility
(function () {
  var er = [];
  try {
    eval("(function *(){})");
  } catch (err) {
    er.push("No generators");
  }
  try {
    eval("let it = ()=>{}");
  } catch (err) {
    er.push("No arrow functions");
  }
  try {
    eval("let it = 'test'");
  } catch (err) {
    er.push("No block vars");
  }
  try {
    eval("const it = 'test'");
  } catch (err) {
    er.push("No constants");
  }
  try {
    eval("var prox = new Proxy({},()=>{})");
  } catch (err) {
    er.push("No proxies");
  }
  try {
    eval("var it = new Set([])");
  } catch (err) {
    er.push("No set types");
  }

  if (er.length) {
    console.error('Your browser does not support the latest JavaScript language features that this application depends on. Try updating your browser or using a better browser ;-)');
    document.getElementById('myModal').style.display = 'block';
  }
})();

Sudoku.init();
if (!localStorage.hasOwnProperty('puzzle')) {
  localStorage.setItem('puzzle', '[{"value":"","maybes":["1","2","3","7","8"],"updated":true},{"value":"","maybes":["1","3","8","9"],"updated":true},{"value":"","maybes":["7","8","9"],"updated":true},{"value":"","maybes":["1","3","6","7","9"],"updated":true},{"value":"","maybes":["1","3","6","7","9"],"updated":true},{"value":"","maybes":["3","6","7"],"updated":true},{"value":"4","maybes":["3","4","6","8"],"updated":true},{"value":"5","maybes":["2","3","5","6"],"updated":true},{"value":"","maybes":["2","3","6","8"],"updated":true},{"value":"","maybes":["2","3","5","8"],"updated":true},{"value":"","maybes":["3","4","5","8","9"],"updated":true},{"value":"6","maybes":["4","5","6","8","9"],"updated":true},{"value":"","maybes":["3","9"],"updated":true},{"value":"","maybes":["3","4","9"],"updated":true},{"value":"","maybes":["3","4"],"updated":true},{"value":"","maybes":["3","8"],"updated":true},{"value":"7","maybes":["2","3","7"],"updated":true},{"value":"1","maybes":["1","2","3","8"],"updated":true},{"value":"","maybes":["1","3","7"],"updated":true},{"value":"","maybes":["1","3","4"],"updated":true},{"value":"","maybes":["4","7"],"updated":true},{"value":"5","maybes":["1","3","5","6","7"],"updated":true},{"value":"2","maybes":["1","2","3","4","6","7"],"updated":true},{"value":"8","maybes":["3","4","6","7","8"],"updated":true},{"value":"","maybes":["3","6"],"updated":true},{"value":"","maybes":["3","6"],"updated":true},{"value":"9","maybes":["3","6","9"],"updated":true},{"value":"","maybes":["1","5"],"updated":true},{"value":"","maybes":["1","4","5"],"updated":true},{"value":"2","maybes":["2","4","5"],"updated":true},{"value":"","maybes":["1","3","6","7"],"updated":true},{"value":"","maybes":["1","3","4","5","6","7"],"updated":true},{"value":"9","maybes":["3","4","5","6","7","9"],"updated":true},{"value":"","maybes":["3","6"],"updated":true},{"value":"8","maybes":["1","3","4","6","8"],"updated":true},{"value":"","maybes":["3","4","6"],"updated":true},{"value":"6","maybes":["1","6","8"],"updated":true},{"value":"","maybes":["1","4","8","9"],"updated":true},{"value":"3","maybes":["3","4","8","9"],"updated":true},{"value":"","maybes":["1","2"],"updated":true},{"value":"","maybes":["1","4"],"updated":true},{"value":"","maybes":["2","4"],"updated":true},{"value":"7","maybes":["7","9"],"updated":true},{"value":"","maybes":["1","4","9"],"updated":true},{"value":"5","maybes":["4","5"],"updated":true},{"value":"","maybes":["1","5"],"updated":true},{"value":"7","maybes":["1","4","5","7","9"],"updated":true},{"value":"","maybes":["4","5","9"],"updated":true},{"value":"8","maybes":["1","3","6","8"],"updated":true},{"value":"","maybes":["1","3","4","5","6"],"updated":true},{"value":"","maybes":["3","4","5","6"],"updated":true},{"value":"2","maybes":["2","3","6","9"],"updated":true},{"value":"","maybes":["1","3","4","6","9"],"updated":true},{"value":"","maybes":["3","4","6"],"updated":true},{"value":"9","maybes":["3","5","7","9"],"updated":true},{"value":"","maybes":["3","5"],"updated":true},{"value":"","maybes":["5","7"],"updated":true},{"value":"4","maybes":["2","3","4","6","7"],"updated":true},{"value":"8","maybes":["3","5","6","7","8"],"updated":true},{"value":"1","maybes":["1","2","3","5","6","7"],"updated":true},{"value":"","maybes":["3","5","6"],"updated":true},{"value":"","maybes":["2","3","6"],"updated":true},{"value":"","maybes":["2","3","6","7"],"updated":true},{"value":"4","maybes":["3","4","5","7","8"],"updated":true},{"value":"2","maybes":["2","3","5","8"],"updated":true},{"value":"","maybes":["5","7","8"],"updated":true},{"value":"","maybes":["3","6","7","9"],"updated":true},{"value":"","maybes":["3","5","6","7","9"],"updated":true},{"value":"","maybes":["3","5","6","7"],"updated":true},{"value":"1","maybes":["1","3","5","6","8","9"],"updated":true},{"value":"","maybes":["3","6","9"],"updated":true},{"value":"","maybes":["3","6","7","8"],"updated":true},{"value":"","maybes":["3","5","7","8"],"updated":true},{"value":"6","maybes":["3","5","6","8"],"updated":true},{"value":"1","maybes":["1","5","7","8"],"updated":true},{"value":"","maybes":["2","3","7","9"],"updated":true},{"value":"","maybes":["3","5","7","9"],"updated":true},{"value":"","maybes":["2","3","5","7"],"updated":true},{"value":"","maybes":["3","5","8","9"],"updated":true},{"value":"","maybes":["2","3","4","9"],"updated":true},{"value":"","maybes":["2","3","4","7","8"],"updated":true}]');
}
Sudoku.load('puzzle');

},{"babel-polyfill":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/lib/index.js","babel-runtime/core-js/json/stringify":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/json/stringify.js","babel-runtime/core-js/promise":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/promise.js","babel-runtime/core-js/set":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/set.js","babel-runtime/helpers/toConsumableArray":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/helpers/toConsumableArray.js","babel-runtime/regenerator":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/regenerator/index.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/lib/index.js":[function(require,module,exports){
(function (global){
/* eslint max-len: 0 */

"use strict";

require("core-js/shim");

require("babel-regenerator-runtime");

// Should be removed in the next major release:

require("core-js/fn/regexp/escape");

if (global._babelPolyfill) {
  throw new Error("only one instance of babel-polyfill is allowed");
}
global._babelPolyfill = true;

var DEFINE_PROPERTY = "defineProperty";
function define(O, key, value) {
  O[key] || Object[DEFINE_PROPERTY](O, key, {
    writable: true,
    configurable: true,
    value: value
  });
}

define(String.prototype, "padLeft", "".padStart);
define(String.prototype, "padRight", "".padEnd);

"pop,reverse,shift,keys,values,entries,indexOf,every,some,forEach,map,filter,find,findIndex,includes,join,slice,concat,push,splice,unshift,sort,lastIndexOf,reduce,reduceRight,copyWithin,fill".split(",").forEach(function (key) {
  [][key] && define(Array, key, Function.call.bind([][key]));
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9iYWJlbC1wb2x5ZmlsbC9saWIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBtYXgtbGVuOiAwICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5yZXF1aXJlKFwiY29yZS1qcy9zaGltXCIpO1xuXG5yZXF1aXJlKFwiYmFiZWwtcmVnZW5lcmF0b3ItcnVudGltZVwiKTtcblxuLy8gU2hvdWxkIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZTpcblxucmVxdWlyZShcImNvcmUtanMvZm4vcmVnZXhwL2VzY2FwZVwiKTtcblxuaWYgKGdsb2JhbC5fYmFiZWxQb2x5ZmlsbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJvbmx5IG9uZSBpbnN0YW5jZSBvZiBiYWJlbC1wb2x5ZmlsbCBpcyBhbGxvd2VkXCIpO1xufVxuZ2xvYmFsLl9iYWJlbFBvbHlmaWxsID0gdHJ1ZTtcblxudmFyIERFRklORV9QUk9QRVJUWSA9IFwiZGVmaW5lUHJvcGVydHlcIjtcbmZ1bmN0aW9uIGRlZmluZShPLCBrZXksIHZhbHVlKSB7XG4gIE9ba2V5XSB8fCBPYmplY3RbREVGSU5FX1BST1BFUlRZXShPLCBrZXksIHtcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IHZhbHVlXG4gIH0pO1xufVxuXG5kZWZpbmUoU3RyaW5nLnByb3RvdHlwZSwgXCJwYWRMZWZ0XCIsIFwiXCIucGFkU3RhcnQpO1xuZGVmaW5lKFN0cmluZy5wcm90b3R5cGUsIFwicGFkUmlnaHRcIiwgXCJcIi5wYWRFbmQpO1xuXG5cInBvcCxyZXZlcnNlLHNoaWZ0LGtleXMsdmFsdWVzLGVudHJpZXMsaW5kZXhPZixldmVyeSxzb21lLGZvckVhY2gsbWFwLGZpbHRlcixmaW5kLGZpbmRJbmRleCxpbmNsdWRlcyxqb2luLHNsaWNlLGNvbmNhdCxwdXNoLHNwbGljZSx1bnNoaWZ0LHNvcnQsbGFzdEluZGV4T2YscmVkdWNlLHJlZHVjZVJpZ2h0LGNvcHlXaXRoaW4sZmlsbFwiLnNwbGl0KFwiLFwiKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgW11ba2V5XSAmJiBkZWZpbmUoQXJyYXksIGtleSwgRnVuY3Rpb24uY2FsbC5iaW5kKFtdW2tleV0pKTtcbn0pOyJdfQ==
},{"babel-regenerator-runtime":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-regenerator-runtime/runtime.js","core-js/fn/regexp/escape":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/fn/regexp/escape.js","core-js/shim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/shim.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/fn/regexp/escape.js":[function(require,module,exports){
require('../../modules/core.regexp.escape');
module.exports = require('../../modules/_core').RegExp.escape;
},{"../../modules/_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","../../modules/core.regexp.escape":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.regexp.escape.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js":[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-number-value.js":[function(require,module,exports){
var cof = require('./_cof');
module.exports = function(it, msg){
  if(typeof it != 'number' && cof(it) != 'Number')throw TypeError(msg);
  return +it;
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js":[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./_wks')('unscopables')
  , ArrayProto  = Array.prototype;
if(ArrayProto[UNSCOPABLES] == undefined)require('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function(key){
  ArrayProto[UNSCOPABLES][key] = true;
};
},{"./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js":[function(require,module,exports){
module.exports = function(it, Constructor, name, forbiddenField){
  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js":[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-copy-within.js":[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
'use strict';
var toObject = require('./_to-object')
  , toIndex  = require('./_to-index')
  , toLength = require('./_to-length');

module.exports = [].copyWithin || function copyWithin(target/*= 0*/, start/*= 0, end = @length*/){
  var O     = toObject(this)
    , len   = toLength(O.length)
    , to    = toIndex(target, len)
    , from  = toIndex(start, len)
    , end   = arguments.length > 2 ? arguments[2] : undefined
    , count = Math.min((end === undefined ? len : toIndex(end, len)) - from, len - to)
    , inc   = 1;
  if(from < to && to < from + count){
    inc  = -1;
    from += count - 1;
    to   += count - 1;
  }
  while(count-- > 0){
    if(from in O)O[to] = O[from];
    else delete O[to];
    to   += inc;
    from += inc;
  } return O;
};
},{"./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-fill.js":[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
'use strict';
var toObject = require('./_to-object')
  , toIndex  = require('./_to-index')
  , toLength = require('./_to-length');
module.exports = function fill(value /*, start = 0, end = @length */){
  var O      = toObject(this)
    , length = toLength(O.length)
    , aLen   = arguments.length
    , index  = toIndex(aLen > 1 ? arguments[1] : undefined, length)
    , end    = aLen > 2 ? arguments[2] : undefined
    , endPos = end === undefined ? length : toIndex(end, length);
  while(endPos > index)O[index++] = value;
  return O;
};
},{"./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-from-iterable.js":[function(require,module,exports){
var forOf = require('./_for-of');

module.exports = function(iter, ITERATOR){
  var result = [];
  forOf(iter, false, result.push, result, ITERATOR);
  return result;
};

},{"./_for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_for-of.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-includes.js":[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length')
  , toIndex   = require('./_to-index');
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};
},{"./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js":[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./_ctx')
  , IObject  = require('./_iobject')
  , toObject = require('./_to-object')
  , toLength = require('./_to-length')
  , asc      = require('./_array-species-create');
module.exports = function(TYPE, $create){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX
    , create        = $create || asc;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"./_array-species-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-species-create.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iobject.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-reduce.js":[function(require,module,exports){
var aFunction = require('./_a-function')
  , toObject  = require('./_to-object')
  , IObject   = require('./_iobject')
  , toLength  = require('./_to-length');

module.exports = function(that, callbackfn, aLen, memo, isRight){
  aFunction(callbackfn);
  var O      = toObject(that)
    , self   = IObject(O)
    , length = toLength(O.length)
    , index  = isRight ? length - 1 : 0
    , i      = isRight ? -1 : 1;
  if(aLen < 2)for(;;){
    if(index in self){
      memo = self[index];
      index += i;
      break;
    }
    index += i;
    if(isRight ? index < 0 : length <= index){
      throw TypeError('Reduce of empty array with no initial value');
    }
  }
  for(;isRight ? index >= 0 : length > index; index += i)if(index in self){
    memo = callbackfn(memo, self[index], index, O);
  }
  return memo;
};
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iobject.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-species-create.js":[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var isObject = require('./_is-object')
  , isArray  = require('./_is-array')
  , SPECIES  = require('./_wks')('species');
module.exports = function(original, length){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return new (C === undefined ? Array : C)(length);
};
},{"./_is-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_bind.js":[function(require,module,exports){
'use strict';
var aFunction  = require('./_a-function')
  , isObject   = require('./_is-object')
  , invoke     = require('./_invoke')
  , arraySlice = [].slice
  , factories  = {};

var construct = function(F, len, args){
  if(!(len in factories)){
    for(var n = [], i = 0; i < len; i++)n[i] = 'a[' + i + ']';
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  } return factories[len](F, args);
};

module.exports = Function.bind || function bind(that /*, args... */){
  var fn       = aFunction(this)
    , partArgs = arraySlice.call(arguments, 1);
  var bound = function(/* args... */){
    var args = partArgs.concat(arraySlice.call(arguments));
    return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
  };
  if(isObject(fn.prototype))bound.prototype = fn.prototype;
  return bound;
};
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_invoke":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_invoke.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js":[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof')
  , TAG = require('./_wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function(it, key){
  try {
    return it[key];
  } catch(e){ /* empty */ }
};

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js":[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-strong.js":[function(require,module,exports){
'use strict';
var dP          = require('./_object-dp').f
  , create      = require('./_object-create')
  , hide        = require('./_hide')
  , redefineAll = require('./_redefine-all')
  , ctx         = require('./_ctx')
  , anInstance  = require('./_an-instance')
  , defined     = require('./_defined')
  , forOf       = require('./_for-of')
  , $iterDefine = require('./_iter-define')
  , step        = require('./_iter-step')
  , setSpecies  = require('./_set-species')
  , DESCRIPTORS = require('./_descriptors')
  , fastKey     = require('./_meta').fastKey
  , SIZE        = DESCRIPTORS ? '_s' : 'size';

var getEntry = function(that, key){
  // fast case
  var index = fastKey(key), entry;
  if(index !== 'F')return that._i[index];
  // frozen object case
  for(entry = that._f; entry; entry = entry.n){
    if(entry.k == key)return entry;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      anInstance(that, C, NAME, '_i');
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear(){
        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
          entry.r = true;
          if(entry.p)entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(key){
        var that  = this
          , entry = getEntry(that, key);
        if(entry){
          var next = entry.n
            , prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if(prev)prev.n = next;
          if(next)next.p = prev;
          if(that._f == entry)that._f = next;
          if(that._l == entry)that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /*, that = undefined */){
        anInstance(this, C, 'forEach');
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
          , entry;
        while(entry = entry ? entry.n : this._f){
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while(entry && entry.r)entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key){
        return !!getEntry(this, key);
      }
    });
    if(DESCRIPTORS)dP(C.prototype, 'size', {
      get: function(){
        return defined(this[SIZE]);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry){
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that._f)that._f = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index !== 'F')that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function(C, NAME, IS_MAP){
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function(iterated, kind){
      this._t = iterated;  // target
      this._k = kind;      // kind
      this._l = undefined; // previous
    }, function(){
      var that  = this
        , kind  = that._k
        , entry = that._l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if(kind == 'keys'  )return step(0, entry.k);
      if(kind == 'values')return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};
},{"./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_for-of.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_iter-define":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-define.js","./_iter-step":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-step.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js","./_set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-to-json.js":[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var classof = require('./_classof')
  , from    = require('./_array-from-iterable');
module.exports = function(NAME){
  return function toJSON(){
    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
    return from(this);
  };
};
},{"./_array-from-iterable":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-from-iterable.js","./_classof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-weak.js":[function(require,module,exports){
'use strict';
var redefineAll       = require('./_redefine-all')
  , getWeak           = require('./_meta').getWeak
  , anObject          = require('./_an-object')
  , isObject          = require('./_is-object')
  , anInstance        = require('./_an-instance')
  , forOf             = require('./_for-of')
  , createArrayMethod = require('./_array-methods')
  , $has              = require('./_has')
  , arrayFind         = createArrayMethod(5)
  , arrayFindIndex    = createArrayMethod(6)
  , id                = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function(that){
  return that._l || (that._l = new UncaughtFrozenStore);
};
var UncaughtFrozenStore = function(){
  this.a = [];
};
var findUncaughtFrozen = function(store, key){
  return arrayFind(store.a, function(it){
    return it[0] === key;
  });
};
UncaughtFrozenStore.prototype = {
  get: function(key){
    var entry = findUncaughtFrozen(this, key);
    if(entry)return entry[1];
  },
  has: function(key){
    return !!findUncaughtFrozen(this, key);
  },
  set: function(key, value){
    var entry = findUncaughtFrozen(this, key);
    if(entry)entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function(key){
    var index = arrayFindIndex(this.a, function(it){
      return it[0] === key;
    });
    if(~index)this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      anInstance(that, C, NAME, '_i');
      that._i = id++;      // collection id
      that._l = undefined; // leak store for uncaught frozen objects
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function(key){
        if(!isObject(key))return false;
        var data = getWeak(key);
        if(data === true)return uncaughtFrozenStore(this)['delete'](key);
        return data && $has(data, this._i) && delete data[this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key){
        if(!isObject(key))return false;
        var data = getWeak(key);
        if(data === true)return uncaughtFrozenStore(this).has(key);
        return data && $has(data, this._i);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var data = getWeak(anObject(key), true);
    if(data === true)uncaughtFrozenStore(that).set(key, value);
    else data[that._i] = value;
    return that;
  },
  ufstore: uncaughtFrozenStore
};
},{"./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_for-of.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection.js":[function(require,module,exports){
'use strict';
var global            = require('./_global')
  , $export           = require('./_export')
  , redefine          = require('./_redefine')
  , redefineAll       = require('./_redefine-all')
  , meta              = require('./_meta')
  , forOf             = require('./_for-of')
  , anInstance        = require('./_an-instance')
  , isObject          = require('./_is-object')
  , fails             = require('./_fails')
  , $iterDetect       = require('./_iter-detect')
  , setToStringTag    = require('./_set-to-string-tag')
  , inheritIfRequired = require('./_inherit-if-required');

module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
  var Base  = global[NAME]
    , C     = Base
    , ADDER = IS_MAP ? 'set' : 'add'
    , proto = C && C.prototype
    , O     = {};
  var fixMethod = function(KEY){
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function(a){
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a){
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a){
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a){ fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b){ fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if(typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
    new C().entries().next();
  }))){
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance             = new C
      // early implementations not supports chaining
      , HASNT_CHAINING       = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance
      // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
      , THROWS_ON_PRIMITIVES = fails(function(){ instance.has(1); })
      // most early implementations doesn't supports iterables, most modern - not close it correctly
      , ACCEPT_ITERABLES     = $iterDetect(function(iter){ new C(iter); }) // eslint-disable-line no-new
      // for early implementations -0 and +0 not the same
      , BUGGY_ZERO = !IS_WEAK && fails(function(){
        // V8 ~ Chromium 42- fails only with 5+ elements
        var $instance = new C()
          , index     = 5;
        while(index--)$instance[ADDER](index, index);
        return !$instance.has(-0);
      });
    if(!ACCEPT_ITERABLES){ 
      C = wrapper(function(target, iterable){
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base, target, C);
        if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if(THROWS_ON_PRIMITIVES || BUGGY_ZERO){
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if(BUGGY_ZERO || HASNT_CHAINING)fixMethod(ADDER);
    // weak collections should not contains .clear method
    if(IS_WEAK && proto.clear)delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

  return C;
};
},{"./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_for-of.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_inherit-if-required":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_inherit-if-required.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_iter-detect":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-detect.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js","./_set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js":[function(require,module,exports){
var core = module.exports = {version: '2.2.2'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_create-property.js":[function(require,module,exports){
'use strict';
var $defineProperty = require('./_object-dp')
  , createDesc      = require('./_property-desc');

module.exports = function(object, index, value){
  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};
},{"./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js":[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_date-to-primitive.js":[function(require,module,exports){
'use strict';
var anObject    = require('./_an-object')
  , toPrimitive = require('./_to-primitive')
  , NUMBER      = 'number';

module.exports = function(hint){
  if(hint !== 'string' && hint !== NUMBER && hint !== 'default')throw TypeError('Incorrect hint');
  return toPrimitive(anObject(this), hint != NUMBER);
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js":[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js":[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_dom-create.js":[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_enum-bug-keys.js":[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_enum-keys.js":[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys')
  , gOPS    = require('./_object-gops')
  , pIE     = require('./_object-pie');
module.exports = function(it){
  var result     = getKeys(it)
    , getSymbols = gOPS.f;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = pIE.f
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))result.push(key);
  } return result;
};
},{"./_object-gops":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gops.js","./_object-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js","./_object-pie":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-pie.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js":[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , hide      = require('./_hide')
  , redefine  = require('./_redefine')
  , ctx       = require('./_ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE]
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE] || (exports[PROTOTYPE] = {})
    , key, own, out, exp;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if(target)redefine(target, key, out, type & $export.U);
    // export
    if(exports[key] != out)hide(exports, key, exp);
    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails-is-regexp.js":[function(require,module,exports){
var MATCH = require('./_wks')('match');
module.exports = function(KEY){
  var re = /./;
  try {
    '/./'[KEY](re);
  } catch(e){
    try {
      re[MATCH] = false;
      return !'/./'[KEY](re);
    } catch(f){ /* empty */ }
  } return true;
};
},{"./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js":[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fix-re-wks.js":[function(require,module,exports){
'use strict';
var hide     = require('./_hide')
  , redefine = require('./_redefine')
  , fails    = require('./_fails')
  , defined  = require('./_defined')
  , wks      = require('./_wks');

module.exports = function(KEY, length, exec){
  var SYMBOL   = wks(KEY)
    , fns      = exec(defined, SYMBOL, ''[KEY])
    , strfn    = fns[0]
    , rxfn     = fns[1];
  if(fails(function(){
    var O = {};
    O[SYMBOL] = function(){ return 7; };
    return ''[KEY](O) != 7;
  })){
    redefine(String.prototype, KEY, strfn);
    hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function(string, arg){ return rxfn.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function(string){ return rxfn.call(string, this); }
    );
  }
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_flags.js":[function(require,module,exports){
'use strict';
// 21.2.5.3 get RegExp.prototype.flags
var anObject = require('./_an-object');
module.exports = function(){
  var that   = anObject(this)
    , result = '';
  if(that.global)     result += 'g';
  if(that.ignoreCase) result += 'i';
  if(that.multiline)  result += 'm';
  if(that.unicode)    result += 'u';
  if(that.sticky)     result += 'y';
  return result;
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_for-of.js":[function(require,module,exports){
var ctx         = require('./_ctx')
  , call        = require('./_iter-call')
  , isArrayIter = require('./_is-array-iter')
  , anObject    = require('./_an-object')
  , toLength    = require('./_to-length')
  , getIterFn   = require('./core.get-iterator-method');
module.exports = function(iterable, entries, fn, that, ITERATOR){
  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_is-array-iter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array-iter.js","./_iter-call":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-call.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./core.get-iterator-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.get-iterator-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js":[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js":[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js":[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_html.js":[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ie8-dom-define.js":[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_dom-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_dom-create.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_inherit-if-required.js":[function(require,module,exports){
var isObject       = require('./_is-object')
  , setPrototypeOf = require('./_set-proto').set;
module.exports = function(that, target, C){
  var P, S = target.constructor;
  if(S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf){
    setPrototypeOf(that, P);
  } return that;
};
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_set-proto":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-proto.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_invoke.js":[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iobject.js":[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array-iter.js":[function(require,module,exports){
// check on default Array iterator
var Iterators  = require('./_iterators')
  , ITERATOR   = require('./_wks')('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
},{"./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array.js":[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-integer.js":[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var isObject = require('./_is-object')
  , floor    = Math.floor;
module.exports = function isInteger(it){
  return !isObject(it) && isFinite(it) && floor(it) === it;
};
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js":[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-regexp.js":[function(require,module,exports){
// 7.2.8 IsRegExp(argument)
var isObject = require('./_is-object')
  , cof      = require('./_cof')
  , MATCH    = require('./_wks')('match');
module.exports = function(it){
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-call.js":[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-create.js":[function(require,module,exports){
'use strict';
var create         = require('./_object-create')
  , descriptor     = require('./_property-desc')
  , setToStringTag = require('./_set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js","./_set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-define.js":[function(require,module,exports){
'use strict';
var LIBRARY        = require('./_library')
  , $export        = require('./_export')
  , redefine       = require('./_redefine')
  , hide           = require('./_hide')
  , has            = require('./_has')
  , Iterators      = require('./_iterators')
  , $iterCreate    = require('./_iter-create')
  , setToStringTag = require('./_set-to-string-tag')
  , getPrototypeOf = require('./_object-gpo')
  , ITERATOR       = require('./_wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_iter-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-create.js","./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_library":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-detect.js":[function(require,module,exports){
var ITERATOR     = require('./_wks')('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ return {done: safe = true}; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-step.js":[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js":[function(require,module,exports){
module.exports = {};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_keyof.js":[function(require,module,exports){
var getKeys   = require('./_object-keys')
  , toIObject = require('./_to-iobject');
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./_object-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js":[function(require,module,exports){
module.exports = false;
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-expm1.js":[function(require,module,exports){
// 20.2.2.14 Math.expm1(x)
var $expm1 = Math.expm1;
module.exports = (!$expm1
  // Old FF bug
  || $expm1(10) > 22025.465794806719 || $expm1(10) < 22025.4657948067165168
  // Tor Browser bug
  || $expm1(-2e-17) != -2e-17
) ? function expm1(x){
  return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : Math.exp(x) - 1;
} : $expm1;
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-log1p.js":[function(require,module,exports){
// 20.2.2.20 Math.log1p(x)
module.exports = Math.log1p || function log1p(x){
  return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : Math.log(1 + x);
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-sign.js":[function(require,module,exports){
// 20.2.2.28 Math.sign(x)
module.exports = Math.sign || function sign(x){
  return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js":[function(require,module,exports){
var META     = require('./_uid')('meta')
  , isObject = require('./_is-object')
  , has      = require('./_has')
  , setDesc  = require('./_object-dp').f
  , id       = 0;
var isExtensible = Object.isExtensible || function(){
  return true;
};
var FREEZE = !require('./_fails')(function(){
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function(it){
  setDesc(it, META, {value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  }});
};
var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add metadata
    if(!create)return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function(it, create){
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return true;
    // not necessary to add metadata
    if(!create)return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function(it){
  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY:      META,
  NEED:     false,
  fastKey:  fastKey,
  getWeak:  getWeak,
  onFreeze: onFreeze
};
},{"./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js":[function(require,module,exports){
var Map     = require('./es6.map')
  , $export = require('./_export')
  , shared  = require('./_shared')('metadata')
  , store   = shared.store || (shared.store = new (require('./es6.weak-map')));

var getOrCreateMetadataMap = function(target, targetKey, create){
  var targetMetadata = store.get(target);
  if(!targetMetadata){
    if(!create)return undefined;
    store.set(target, targetMetadata = new Map);
  }
  var keyMetadata = targetMetadata.get(targetKey);
  if(!keyMetadata){
    if(!create)return undefined;
    targetMetadata.set(targetKey, keyMetadata = new Map);
  } return keyMetadata;
};
var ordinaryHasOwnMetadata = function(MetadataKey, O, P){
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? false : metadataMap.has(MetadataKey);
};
var ordinaryGetOwnMetadata = function(MetadataKey, O, P){
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? undefined : metadataMap.get(MetadataKey);
};
var ordinaryDefineOwnMetadata = function(MetadataKey, MetadataValue, O, P){
  getOrCreateMetadataMap(O, P, true).set(MetadataKey, MetadataValue);
};
var ordinaryOwnMetadataKeys = function(target, targetKey){
  var metadataMap = getOrCreateMetadataMap(target, targetKey, false)
    , keys        = [];
  if(metadataMap)metadataMap.forEach(function(_, key){ keys.push(key); });
  return keys;
};
var toMetaKey = function(it){
  return it === undefined || typeof it == 'symbol' ? it : String(it);
};
var exp = function(O){
  $export($export.S, 'Reflect', O);
};

module.exports = {
  store: store,
  map: getOrCreateMetadataMap,
  has: ordinaryHasOwnMetadata,
  get: ordinaryGetOwnMetadata,
  set: ordinaryDefineOwnMetadata,
  keys: ordinaryOwnMetadataKeys,
  key: toMetaKey,
  exp: exp
};
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_shared":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared.js","./es6.map":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.map.js","./es6.weak-map":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.weak-map.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_microtask.js":[function(require,module,exports){
var global    = require('./_global')
  , macrotask = require('./_task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = require('./_cof')(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, fn;
  if(isNode && (parent = process.domain))parent.exit();
  while(head){
    fn = head.fn;
    fn(); // <- currently we use it only for Promise - try / catch not required
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = true
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = !toggle;
  };
// environments with maybe non-completely correct, but existent Promise
} else if(Promise && Promise.resolve){
  notify = function(){
    Promise.resolve().then(flush);
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function(fn){
  var task = {fn: fn, next: undefined};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_task":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_task.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-assign.js":[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys  = require('./_object-keys')
  , gOPS     = require('./_object-gops')
  , pIE      = require('./_object-pie')
  , toObject = require('./_to-object')
  , IObject  = require('./_iobject')
  , $assign  = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function(){
  var A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , aLen  = arguments.length
    , index = 1
    , getSymbols = gOPS.f
    , isEnum     = pIE.f;
  while(aLen > index){
    var S      = IObject(arguments[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  } return T;
} : $assign;
},{"./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iobject.js","./_object-gops":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gops.js","./_object-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js","./_object-pie":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-pie.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js":[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject    = require('./_an-object')
  , dPs         = require('./_object-dps')
  , enumBugKeys = require('./_enum-bug-keys')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , Empty       = function(){ /* empty */ }
  , PROTOTYPE   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe')
    , i      = enumBugKeys.length
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write('<script>document.F=Object</script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_dom-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_dom-create.js","./_enum-bug-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_enum-bug-keys.js","./_html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_html.js","./_object-dps":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dps.js","./_shared-key":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared-key.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js":[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_ie8-dom-define":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ie8-dom-define.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dps.js":[function(require,module,exports){
var dP       = require('./_object-dp')
  , anObject = require('./_an-object')
  , getKeys  = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties){
  anObject(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
  return O;
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-forced-pam.js":[function(require,module,exports){
// Forced replacement prototype accessors methods
module.exports = require('./_library')|| !require('./_fails')(function(){
  var K = Math.random();
  // In FF throws only define methods
  __defineSetter__.call(null, K, function(){ /* empty */});
  delete require('./_global')[K];
});
},{"./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_library":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js":[function(require,module,exports){
var pIE            = require('./_object-pie')
  , createDesc     = require('./_property-desc')
  , toIObject      = require('./_to-iobject')
  , toPrimitive    = require('./_to-primitive')
  , has            = require('./_has')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , gOPD           = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P){
  O = toIObject(O);
  P = toPrimitive(P, true);
  if(IE8_DOM_DEFINE)try {
    return gOPD(O, P);
  } catch(e){ /* empty */ }
  if(has(O, P))return createDesc(!pIE.f.call(O, P), O[P]);
};
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_ie8-dom-define":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ie8-dom-define.js","./_object-pie":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-pie.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn-ext.js":[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject')
  , gOPN      = require('./_object-gopn').f
  , toString  = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return gOPN(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it){
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js":[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys      = require('./_object-keys-internal')
  , hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O){
  return $keys(O, hiddenKeys);
};
},{"./_enum-bug-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_enum-bug-keys.js","./_object-keys-internal":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys-internal.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gops.js":[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js":[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has         = require('./_has')
  , toObject    = require('./_to-object')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function(O){
  O = toObject(O);
  if(has(O, IE_PROTO))return O[IE_PROTO];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};
},{"./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_shared-key":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared-key.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys-internal.js":[function(require,module,exports){
var has          = require('./_has')
  , toIObject    = require('./_to-iobject')
  , arrayIndexOf = require('./_array-includes')(false)
  , IE_PROTO     = require('./_shared-key')('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};
},{"./_array-includes":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-includes.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_shared-key":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared-key.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js":[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_enum-bug-keys.js","./_object-keys-internal":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys-internal.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-pie.js":[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js":[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export')
  , core    = require('./_core')
  , fails   = require('./_fails');
module.exports = function(KEY, exec){
  var fn  = (core.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
};
},{"./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-to-array.js":[function(require,module,exports){
var getKeys   = require('./_object-keys')
  , toIObject = require('./_to-iobject')
  , isEnum    = require('./_object-pie').f;
module.exports = function(isEntries){
  return function(it){
    var O      = toIObject(it)
      , keys   = getKeys(O)
      , length = keys.length
      , i      = 0
      , result = []
      , key;
    while(length > i)if(isEnum.call(O, key = keys[i++])){
      result.push(isEntries ? [key, O[key]] : O[key]);
    } return result;
  };
};
},{"./_object-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js","./_object-pie":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-pie.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_own-keys.js":[function(require,module,exports){
// all object keys, includes non-enumerable and symbols
var gOPN     = require('./_object-gopn')
  , gOPS     = require('./_object-gops')
  , anObject = require('./_an-object')
  , Reflect  = require('./_global').Reflect;
module.exports = Reflect && Reflect.ownKeys || function ownKeys(it){
  var keys       = gOPN.f(anObject(it))
    , getSymbols = gOPS.f;
  return getSymbols ? keys.concat(getSymbols(it)) : keys;
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_object-gops":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gops.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_parse-float.js":[function(require,module,exports){
var $parseFloat = require('./_global').parseFloat
  , $trim       = require('./_string-trim').trim;

module.exports = 1 / $parseFloat(require('./_string-ws') + '-0') !== -Infinity ? function parseFloat(str){
  var string = $trim(String(str), 3)
    , result = $parseFloat(string);
  return result === 0 && string.charAt(0) == '-' ? -0 : result;
} : $parseFloat;
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_string-trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js","./_string-ws":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-ws.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_parse-int.js":[function(require,module,exports){
var $parseInt = require('./_global').parseInt
  , $trim     = require('./_string-trim').trim
  , ws        = require('./_string-ws')
  , hex       = /^[\-+]?0[xX]/;

module.exports = $parseInt(ws + '08') !== 8 || $parseInt(ws + '0x16') !== 22 ? function parseInt(str, radix){
  var string = $trim(String(str), 3);
  return $parseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
} : $parseInt;
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_string-trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js","./_string-ws":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-ws.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_partial.js":[function(require,module,exports){
'use strict';
var path      = require('./_path')
  , invoke    = require('./_invoke')
  , aFunction = require('./_a-function');
module.exports = function(/* ...pargs */){
  var fn     = aFunction(this)
    , length = arguments.length
    , pargs  = Array(length)
    , i      = 0
    , _      = path._
    , holder = false;
  while(length > i)if((pargs[i] = arguments[i++]) === _)holder = true;
  return function(/* ...args */){
    var that = this
      , aLen = arguments.length
      , j = 0, k = 0, args;
    if(!holder && !aLen)return invoke(fn, pargs, that);
    args = pargs.slice();
    if(holder)for(;length > j; j++)if(args[j] === _)args[j] = arguments[k++];
    while(aLen > k)args.push(arguments[k++]);
    return invoke(fn, args, that);
  };
};
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_invoke":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_invoke.js","./_path":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_path.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_path.js":[function(require,module,exports){
module.exports = require('./_global');
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js":[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js":[function(require,module,exports){
var redefine = require('./_redefine');
module.exports = function(target, src, safe){
  for(var key in src)redefine(target, key, src[key], safe);
  return target;
};
},{"./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js":[function(require,module,exports){
var global    = require('./_global')
  , hide      = require('./_hide')
  , has       = require('./_has')
  , SRC       = require('./_uid')('src')
  , TO_STRING = 'toString'
  , $toString = Function[TO_STRING]
  , TPL       = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function(it){
  return $toString.call(it);
};

(module.exports = function(O, key, val, safe){
  var isFunction = typeof val == 'function';
  if(isFunction)has(val, 'name') || hide(val, 'name', key);
  if(O[key] === val)return;
  if(isFunction)has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if(O === global){
    O[key] = val;
  } else {
    if(!safe){
      delete O[key];
      hide(O, key, val);
    } else {
      if(O[key])O[key] = val;
      else hide(O, key, val);
    }
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString(){
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
},{"./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_replacer.js":[function(require,module,exports){
module.exports = function(regExp, replace){
  var replacer = replace === Object(replace) ? function(part){
    return replace[part];
  } : replace;
  return function(it){
    return String(it).replace(regExp, replacer);
  };
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_same-value.js":[function(require,module,exports){
// 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-proto.js":[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = require('./_is-object')
  , anObject = require('./_an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./_ctx')(Function.call, require('./_object-gopd').f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js":[function(require,module,exports){
'use strict';
var global      = require('./_global')
  , dP          = require('./_object-dp')
  , DESCRIPTORS = require('./_descriptors')
  , SPECIES     = require('./_wks')('species');

module.exports = function(KEY){
  var C = global[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js":[function(require,module,exports){
var def = require('./_object-dp').f
  , has = require('./_has')
  , TAG = require('./_wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared-key.js":[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared.js":[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_species-constructor.js":[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./_an-object')
  , aFunction = require('./_a-function')
  , SPECIES   = require('./_wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js":[function(require,module,exports){
var fails = require('./_fails');

module.exports = function(method, arg){
  return !!method && fails(function(){
    arg ? method.call(null, function(){}, 1) : method.call(null);
  });
};
},{"./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-at.js":[function(require,module,exports){
var toInteger = require('./_to-integer')
  , defined   = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-context.js":[function(require,module,exports){
// helper for String#{startsWith, endsWith, includes}
var isRegExp = require('./_is-regexp')
  , defined  = require('./_defined');

module.exports = function(that, searchString, NAME){
  if(isRegExp(searchString))throw TypeError('String#' + NAME + " doesn't accept regex!");
  return String(defined(that));
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-regexp.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js":[function(require,module,exports){
var $export = require('./_export')
  , fails   = require('./_fails')
  , defined = require('./_defined')
  , quot    = /"/g;
// B.2.3.2.1 CreateHTML(string, tag, attribute, value)
var createHTML = function(string, tag, attribute, value) {
  var S  = String(defined(string))
    , p1 = '<' + tag;
  if(attribute !== '')p1 += ' ' + attribute + '="' + String(value).replace(quot, '&quot;') + '"';
  return p1 + '>' + S + '</' + tag + '>';
};
module.exports = function(NAME, exec){
  var O = {};
  O[NAME] = exec(createHTML);
  $export($export.P + $export.F * fails(function(){
    var test = ''[NAME]('"');
    return test !== test.toLowerCase() || test.split('"').length > 3;
  }), 'String', O);
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-pad.js":[function(require,module,exports){
// https://github.com/tc39/proposal-string-pad-start-end
var toLength = require('./_to-length')
  , repeat   = require('./_string-repeat')
  , defined  = require('./_defined');

module.exports = function(that, maxLength, fillString, left){
  var S            = String(defined(that))
    , stringLength = S.length
    , fillStr      = fillString === undefined ? ' ' : String(fillString)
    , intMaxLength = toLength(maxLength);
  if(intMaxLength <= stringLength)return S;
  if(fillStr == '')fillStr = ' ';
  var fillLen = intMaxLength - stringLength
    , stringFiller = repeat.call(fillStr, Math.ceil(fillLen / fillStr.length));
  if(stringFiller.length > fillLen)stringFiller = stringFiller.slice(0, fillLen);
  return left ? stringFiller + S : S + stringFiller;
};

},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_string-repeat":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-repeat.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-repeat.js":[function(require,module,exports){
'use strict';
var toInteger = require('./_to-integer')
  , defined   = require('./_defined');

module.exports = function repeat(count){
  var str = String(defined(this))
    , res = ''
    , n   = toInteger(count);
  if(n < 0 || n == Infinity)throw RangeError("Count can't be negative");
  for(;n > 0; (n >>>= 1) && (str += str))if(n & 1)res += str;
  return res;
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js":[function(require,module,exports){
var $export = require('./_export')
  , defined = require('./_defined')
  , fails   = require('./_fails')
  , spaces  = require('./_string-ws')
  , space   = '[' + spaces + ']'
  , non     = '\u200b\u0085'
  , ltrim   = RegExp('^' + space + space + '*')
  , rtrim   = RegExp(space + space + '*$');

var exporter = function(KEY, exec, ALIAS){
  var exp   = {};
  var FORCE = fails(function(){
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if(ALIAS)exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function(string, TYPE){
  string = String(defined(string));
  if(TYPE & 1)string = string.replace(ltrim, '');
  if(TYPE & 2)string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_string-ws":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-ws.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-ws.js":[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_task.js":[function(require,module,exports){
var ctx                = require('./_ctx')
  , invoke             = require('./_invoke')
  , html               = require('./_html')
  , cel                = require('./_dom-create')
  , global             = require('./_global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./_cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_dom-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_dom-create.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_html.js","./_invoke":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_invoke.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js":[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js":[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js":[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js":[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js":[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js":[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js":[function(require,module,exports){
'use strict';
if(require('./_descriptors')){
  var LIBRARY             = require('./_library')
    , global              = require('./_global')
    , fails               = require('./_fails')
    , $export             = require('./_export')
    , $typed              = require('./_typed')
    , $buffer             = require('./_typed-buffer')
    , ctx                 = require('./_ctx')
    , anInstance          = require('./_an-instance')
    , propertyDesc        = require('./_property-desc')
    , hide                = require('./_hide')
    , redefineAll         = require('./_redefine-all')
    , isInteger           = require('./_is-integer')
    , toInteger           = require('./_to-integer')
    , toLength            = require('./_to-length')
    , toIndex             = require('./_to-index')
    , toPrimitive         = require('./_to-primitive')
    , has                 = require('./_has')
    , same                = require('./_same-value')
    , classof             = require('./_classof')
    , isObject            = require('./_is-object')
    , toObject            = require('./_to-object')
    , isArrayIter         = require('./_is-array-iter')
    , create              = require('./_object-create')
    , getPrototypeOf      = require('./_object-gpo')
    , gOPN                = require('./_object-gopn').f
    , isIterable          = require('./core.is-iterable')
    , getIterFn           = require('./core.get-iterator-method')
    , uid                 = require('./_uid')
    , wks                 = require('./_wks')
    , createArrayMethod   = require('./_array-methods')
    , createArrayIncludes = require('./_array-includes')
    , speciesConstructor  = require('./_species-constructor')
    , ArrayIterators      = require('./es6.array.iterator')
    , Iterators           = require('./_iterators')
    , $iterDetect         = require('./_iter-detect')
    , setSpecies          = require('./_set-species')
    , arrayFill           = require('./_array-fill')
    , arrayCopyWithin     = require('./_array-copy-within')
    , $DP                 = require('./_object-dp')
    , $GOPD               = require('./_object-gopd')
    , dP                  = $DP.f
    , gOPD                = $GOPD.f
    , RangeError          = global.RangeError
    , TypeError           = global.TypeError
    , Uint8Array          = global.Uint8Array
    , ARRAY_BUFFER        = 'ArrayBuffer'
    , SHARED_BUFFER       = 'Shared' + ARRAY_BUFFER
    , BYTES_PER_ELEMENT   = 'BYTES_PER_ELEMENT'
    , PROTOTYPE           = 'prototype'
    , ArrayProto          = Array[PROTOTYPE]
    , $ArrayBuffer        = $buffer.ArrayBuffer
    , $DataView           = $buffer.DataView
    , arrayForEach        = createArrayMethod(0)
    , arrayFilter         = createArrayMethod(2)
    , arraySome           = createArrayMethod(3)
    , arrayEvery          = createArrayMethod(4)
    , arrayFind           = createArrayMethod(5)
    , arrayFindIndex      = createArrayMethod(6)
    , arrayIncludes       = createArrayIncludes(true)
    , arrayIndexOf        = createArrayIncludes(false)
    , arrayValues         = ArrayIterators.values
    , arrayKeys           = ArrayIterators.keys
    , arrayEntries        = ArrayIterators.entries
    , arrayLastIndexOf    = ArrayProto.lastIndexOf
    , arrayReduce         = ArrayProto.reduce
    , arrayReduceRight    = ArrayProto.reduceRight
    , arrayJoin           = ArrayProto.join
    , arraySort           = ArrayProto.sort
    , arraySlice          = ArrayProto.slice
    , arrayToString       = ArrayProto.toString
    , arrayToLocaleString = ArrayProto.toLocaleString
    , ITERATOR            = wks('iterator')
    , TAG                 = wks('toStringTag')
    , TYPED_CONSTRUCTOR   = uid('typed_constructor')
    , DEF_CONSTRUCTOR     = uid('def_constructor')
    , ALL_CONSTRUCTORS    = $typed.CONSTR
    , TYPED_ARRAY         = $typed.TYPED
    , VIEW                = $typed.VIEW
    , WRONG_LENGTH        = 'Wrong length!';

  var $map = createArrayMethod(1, function(O, length){
    return allocate(speciesConstructor(O, O[DEF_CONSTRUCTOR]), length);
  });

  var LITTLE_ENDIAN = fails(function(){
    return new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  });

  var FORCED_SET = !!Uint8Array && !!Uint8Array[PROTOTYPE].set && fails(function(){
    new Uint8Array(1).set({});
  });

  var strictToLength = function(it, SAME){
    if(it === undefined)throw TypeError(WRONG_LENGTH);
    var number = +it
      , length = toLength(it);
    if(SAME && !same(number, length))throw RangeError(WRONG_LENGTH);
    return length;
  };

  var toOffset = function(it, BYTES){
    var offset = toInteger(it);
    if(offset < 0 || offset % BYTES)throw RangeError('Wrong offset!');
    return offset;
  };

  var validate = function(it){
    if(isObject(it) && TYPED_ARRAY in it)return it;
    throw TypeError(it + ' is not a typed array!');
  };

  var allocate = function(C, length){
    if(!(isObject(C) && TYPED_CONSTRUCTOR in C)){
      throw TypeError('It is not a typed array constructor!');
    } return new C(length);
  };

  var speciesFromList = function(O, list){
    return fromList(speciesConstructor(O, O[DEF_CONSTRUCTOR]), list);
  };

  var fromList = function(C, list){
    var index  = 0
      , length = list.length
      , result = allocate(C, length);
    while(length > index)result[index] = list[index++];
    return result;
  };

  var addGetter = function(it, key, internal){
    dP(it, key, {get: function(){ return this._d[internal]; }});
  };

  var $from = function from(source /*, mapfn, thisArg */){
    var O       = toObject(source)
      , aLen    = arguments.length
      , mapfn   = aLen > 1 ? arguments[1] : undefined
      , mapping = mapfn !== undefined
      , iterFn  = getIterFn(O)
      , i, length, values, result, step, iterator;
    if(iterFn != undefined && !isArrayIter(iterFn)){
      for(iterator = iterFn.call(O), values = [], i = 0; !(step = iterator.next()).done; i++){
        values.push(step.value);
      } O = values;
    }
    if(mapping && aLen > 2)mapfn = ctx(mapfn, arguments[2], 2);
    for(i = 0, length = toLength(O.length), result = allocate(this, length); length > i; i++){
      result[i] = mapping ? mapfn(O[i], i) : O[i];
    }
    return result;
  };

  var $of = function of(/*...items*/){
    var index  = 0
      , length = arguments.length
      , result = allocate(this, length);
    while(length > index)result[index] = arguments[index++];
    return result;
  };

  // iOS Safari 6.x fails here
  var TO_LOCALE_BUG = !!Uint8Array && fails(function(){ arrayToLocaleString.call(new Uint8Array(1)); });

  var $toLocaleString = function toLocaleString(){
    return arrayToLocaleString.apply(TO_LOCALE_BUG ? arraySlice.call(validate(this)) : validate(this), arguments);
  };

  var proto = {
    copyWithin: function copyWithin(target, start /*, end */){
      return arrayCopyWithin.call(validate(this), target, start, arguments.length > 2 ? arguments[2] : undefined);
    },
    every: function every(callbackfn /*, thisArg */){
      return arrayEvery(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    fill: function fill(value /*, start, end */){ // eslint-disable-line no-unused-vars
      return arrayFill.apply(validate(this), arguments);
    },
    filter: function filter(callbackfn /*, thisArg */){
      return speciesFromList(this, arrayFilter(validate(this), callbackfn,
        arguments.length > 1 ? arguments[1] : undefined));
    },
    find: function find(predicate /*, thisArg */){
      return arrayFind(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
    },
    findIndex: function findIndex(predicate /*, thisArg */){
      return arrayFindIndex(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
    },
    forEach: function forEach(callbackfn /*, thisArg */){
      arrayForEach(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    indexOf: function indexOf(searchElement /*, fromIndex */){
      return arrayIndexOf(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
    },
    includes: function includes(searchElement /*, fromIndex */){
      return arrayIncludes(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
    },
    join: function join(separator){ // eslint-disable-line no-unused-vars
      return arrayJoin.apply(validate(this), arguments);
    },
    lastIndexOf: function lastIndexOf(searchElement /*, fromIndex */){ // eslint-disable-line no-unused-vars
      return arrayLastIndexOf.apply(validate(this), arguments);
    },
    map: function map(mapfn /*, thisArg */){
      return $map(validate(this), mapfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    reduce: function reduce(callbackfn /*, initialValue */){ // eslint-disable-line no-unused-vars
      return arrayReduce.apply(validate(this), arguments);
    },
    reduceRight: function reduceRight(callbackfn /*, initialValue */){ // eslint-disable-line no-unused-vars
      return arrayReduceRight.apply(validate(this), arguments);
    },
    reverse: function reverse(){
      var that   = this
        , length = validate(that).length
        , middle = Math.floor(length / 2)
        , index  = 0
        , value;
      while(index < middle){
        value         = that[index];
        that[index++] = that[--length];
        that[length]  = value;
      } return that;
    },
    some: function some(callbackfn /*, thisArg */){
      return arraySome(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    sort: function sort(comparefn){
      return arraySort.call(validate(this), comparefn);
    },
    subarray: function subarray(begin, end){
      var O      = validate(this)
        , length = O.length
        , $begin = toIndex(begin, length);
      return new (speciesConstructor(O, O[DEF_CONSTRUCTOR]))(
        O.buffer,
        O.byteOffset + $begin * O.BYTES_PER_ELEMENT,
        toLength((end === undefined ? length : toIndex(end, length)) - $begin)
      );
    }
  };

  var $slice = function slice(start, end){
    return speciesFromList(this, arraySlice.call(validate(this), start, end));
  };

  var $set = function set(arrayLike /*, offset */){
    validate(this);
    var offset = toOffset(arguments[1], 1)
      , length = this.length
      , src    = toObject(arrayLike)
      , len    = toLength(src.length)
      , index  = 0;
    if(len + offset > length)throw RangeError(WRONG_LENGTH);
    while(index < len)this[offset + index] = src[index++];
  };

  var $iterators = {
    entries: function entries(){
      return arrayEntries.call(validate(this));
    },
    keys: function keys(){
      return arrayKeys.call(validate(this));
    },
    values: function values(){
      return arrayValues.call(validate(this));
    }
  };

  var isTAIndex = function(target, key){
    return isObject(target)
      && target[TYPED_ARRAY]
      && typeof key != 'symbol'
      && key in target
      && String(+key) == String(key);
  };
  var $getDesc = function getOwnPropertyDescriptor(target, key){
    return isTAIndex(target, key = toPrimitive(key, true))
      ? propertyDesc(2, target[key])
      : gOPD(target, key);
  };
  var $setDesc = function defineProperty(target, key, desc){
    if(isTAIndex(target, key = toPrimitive(key, true))
      && isObject(desc)
      && has(desc, 'value')
      && !has(desc, 'get')
      && !has(desc, 'set')
      // TODO: add validation descriptor w/o calling accessors
      && !desc.configurable
      && (!has(desc, 'writable') || desc.writable)
      && (!has(desc, 'enumerable') || desc.enumerable)
    ){
      target[key] = desc.value;
      return target;
    } else return dP(target, key, desc);
  };

  if(!ALL_CONSTRUCTORS){
    $GOPD.f = $getDesc;
    $DP.f   = $setDesc;
  }

  $export($export.S + $export.F * !ALL_CONSTRUCTORS, 'Object', {
    getOwnPropertyDescriptor: $getDesc,
    defineProperty:           $setDesc
  });

  if(fails(function(){ arrayToString.call({}); })){
    arrayToString = arrayToLocaleString = function toString(){
      return arrayJoin.call(this);
    }
  }

  var $TypedArrayPrototype$ = redefineAll({}, proto);
  redefineAll($TypedArrayPrototype$, $iterators);
  hide($TypedArrayPrototype$, ITERATOR, $iterators.values);
  redefineAll($TypedArrayPrototype$, {
    slice:          $slice,
    set:            $set,
    constructor:    function(){ /* noop */ },
    toString:       arrayToString,
    toLocaleString: $toLocaleString
  });
  addGetter($TypedArrayPrototype$, 'buffer', 'b');
  addGetter($TypedArrayPrototype$, 'byteOffset', 'o');
  addGetter($TypedArrayPrototype$, 'byteLength', 'l');
  addGetter($TypedArrayPrototype$, 'length', 'e');
  dP($TypedArrayPrototype$, TAG, {
    get: function(){ return this[TYPED_ARRAY]; }
  });

  module.exports = function(KEY, BYTES, wrapper, CLAMPED){
    CLAMPED = !!CLAMPED;
    var NAME       = KEY + (CLAMPED ? 'Clamped' : '') + 'Array'
      , ISNT_UINT8 = NAME != 'Uint8Array'
      , GETTER     = 'get' + KEY
      , SETTER     = 'set' + KEY
      , TypedArray = global[NAME]
      , Base       = TypedArray || {}
      , TAC        = TypedArray && getPrototypeOf(TypedArray)
      , FORCED     = !TypedArray || !$typed.ABV
      , O          = {}
      , TypedArrayPrototype = TypedArray && TypedArray[PROTOTYPE];
    var getter = function(that, index){
      var data = that._d;
      return data.v[GETTER](index * BYTES + data.o, LITTLE_ENDIAN);
    };
    var setter = function(that, index, value){
      var data = that._d;
      if(CLAMPED)value = (value = Math.round(value)) < 0 ? 0 : value > 0xff ? 0xff : value & 0xff;
      data.v[SETTER](index * BYTES + data.o, value, LITTLE_ENDIAN);
    };
    var addElement = function(that, index){
      dP(that, index, {
        get: function(){
          return getter(this, index);
        },
        set: function(value){
          return setter(this, index, value);
        },
        enumerable: true
      });
    };
    if(FORCED){
      TypedArray = wrapper(function(that, data, $offset, $length){
        anInstance(that, TypedArray, NAME, '_d');
        var index  = 0
          , offset = 0
          , buffer, byteLength, length, klass;
        if(!isObject(data)){
          length     = strictToLength(data, true)
          byteLength = length * BYTES;
          buffer     = new $ArrayBuffer(byteLength);
        } else if(data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER){
          buffer = data;
          offset = toOffset($offset, BYTES);
          var $len = data.byteLength;
          if($length === undefined){
            if($len % BYTES)throw RangeError(WRONG_LENGTH);
            byteLength = $len - offset;
            if(byteLength < 0)throw RangeError(WRONG_LENGTH);
          } else {
            byteLength = toLength($length) * BYTES;
            if(byteLength + offset > $len)throw RangeError(WRONG_LENGTH);
          }
          length = byteLength / BYTES;
        } else if(TYPED_ARRAY in data){
          return fromList(TypedArray, data);
        } else {
          return $from.call(TypedArray, data);
        }
        hide(that, '_d', {
          b: buffer,
          o: offset,
          l: byteLength,
          e: length,
          v: new $DataView(buffer)
        });
        while(index < length)addElement(that, index++);
      });
      TypedArrayPrototype = TypedArray[PROTOTYPE] = create($TypedArrayPrototype$);
      hide(TypedArrayPrototype, 'constructor', TypedArray);
    } else if(!$iterDetect(function(iter){
      // V8 works with iterators, but fails in many other cases
      // https://code.google.com/p/v8/issues/detail?id=4552
      new TypedArray(null); // eslint-disable-line no-new
      new TypedArray(iter); // eslint-disable-line no-new
    }, true)){
      TypedArray = wrapper(function(that, data, $offset, $length){
        anInstance(that, TypedArray, NAME);
        var klass;
        // `ws` module bug, temporarily remove validation length for Uint8Array
        // https://github.com/websockets/ws/pull/645
        if(!isObject(data))return new Base(strictToLength(data, ISNT_UINT8));
        if(data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER){
          return $length !== undefined
            ? new Base(data, toOffset($offset, BYTES), $length)
            : $offset !== undefined
              ? new Base(data, toOffset($offset, BYTES))
              : new Base(data);
        }
        if(TYPED_ARRAY in data)return fromList(TypedArray, data);
        return $from.call(TypedArray, data);
      });
      arrayForEach(TAC !== Function.prototype ? gOPN(Base).concat(gOPN(TAC)) : gOPN(Base), function(key){
        if(!(key in TypedArray))hide(TypedArray, key, Base[key]);
      });
      TypedArray[PROTOTYPE] = TypedArrayPrototype;
      if(!LIBRARY)TypedArrayPrototype.constructor = TypedArray;
    }
    var $nativeIterator   = TypedArrayPrototype[ITERATOR]
      , CORRECT_ITER_NAME = !!$nativeIterator && ($nativeIterator.name == 'values' || $nativeIterator.name == undefined)
      , $iterator         = $iterators.values;
    hide(TypedArray, TYPED_CONSTRUCTOR, true);
    hide(TypedArrayPrototype, TYPED_ARRAY, NAME);
    hide(TypedArrayPrototype, VIEW, true);
    hide(TypedArrayPrototype, DEF_CONSTRUCTOR, TypedArray);

    if(CLAMPED ? new TypedArray(1)[TAG] != NAME : !(TAG in TypedArrayPrototype)){
      dP(TypedArrayPrototype, TAG, {
        get: function(){ return NAME; }
      });
    }

    O[NAME] = TypedArray;

    $export($export.G + $export.W + $export.F * (TypedArray != Base), O);

    $export($export.S, NAME, {
      BYTES_PER_ELEMENT: BYTES,
      from: $from,
      of: $of
    });

    if(!(BYTES_PER_ELEMENT in TypedArrayPrototype))hide(TypedArrayPrototype, BYTES_PER_ELEMENT, BYTES);

    $export($export.P, NAME, proto);

    setSpecies(NAME);

    $export($export.P + $export.F * FORCED_SET, NAME, {set: $set});

    $export($export.P + $export.F * !CORRECT_ITER_NAME, NAME, $iterators);

    $export($export.P + $export.F * (TypedArrayPrototype.toString != arrayToString), NAME, {toString: arrayToString});

    $export($export.P + $export.F * fails(function(){
      new TypedArray(1).slice();
    }), NAME, {slice: $slice});

    $export($export.P + $export.F * (fails(function(){
      return [1, 2].toLocaleString() != new TypedArray([1, 2]).toLocaleString()
    }) || !fails(function(){
      TypedArrayPrototype.toLocaleString.call([1, 2]);
    })), NAME, {toLocaleString: $toLocaleString});

    Iterators[NAME] = CORRECT_ITER_NAME ? $nativeIterator : $iterator;
    if(!LIBRARY && !CORRECT_ITER_NAME)hide(TypedArrayPrototype, ITERATOR, $iterator);
  };
} else module.exports = function(){ /* empty */ };
},{"./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_array-copy-within":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-copy-within.js","./_array-fill":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-fill.js","./_array-includes":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-includes.js","./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_classof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_is-array-iter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array-iter.js","./_is-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-integer.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_iter-detect":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-detect.js","./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_library":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js","./_redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js","./_same-value":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_same-value.js","./_set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js","./_species-constructor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_species-constructor.js","./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js","./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js","./_typed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed.js","./_typed-buffer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-buffer.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js","./core.get-iterator-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.get-iterator-method.js","./core.is-iterable":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.is-iterable.js","./es6.array.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.iterator.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-buffer.js":[function(require,module,exports){
'use strict';
var global         = require('./_global')
  , DESCRIPTORS    = require('./_descriptors')
  , LIBRARY        = require('./_library')
  , $typed         = require('./_typed')
  , hide           = require('./_hide')
  , redefineAll    = require('./_redefine-all')
  , fails          = require('./_fails')
  , anInstance     = require('./_an-instance')
  , toInteger      = require('./_to-integer')
  , toLength       = require('./_to-length')
  , gOPN           = require('./_object-gopn').f
  , dP             = require('./_object-dp').f
  , arrayFill      = require('./_array-fill')
  , setToStringTag = require('./_set-to-string-tag')
  , ARRAY_BUFFER   = 'ArrayBuffer'
  , DATA_VIEW      = 'DataView'
  , PROTOTYPE      = 'prototype'
  , WRONG_LENGTH   = 'Wrong length!'
  , WRONG_INDEX    = 'Wrong index!'
  , $ArrayBuffer   = global[ARRAY_BUFFER]
  , $DataView      = global[DATA_VIEW]
  , Math           = global.Math
  , parseInt       = global.parseInt
  , RangeError     = global.RangeError
  , Infinity       = global.Infinity
  , BaseBuffer     = $ArrayBuffer
  , abs            = Math.abs
  , pow            = Math.pow
  , min            = Math.min
  , floor          = Math.floor
  , log            = Math.log
  , LN2            = Math.LN2
  , BUFFER         = 'buffer'
  , BYTE_LENGTH    = 'byteLength'
  , BYTE_OFFSET    = 'byteOffset'
  , $BUFFER        = DESCRIPTORS ? '_b' : BUFFER
  , $LENGTH        = DESCRIPTORS ? '_l' : BYTE_LENGTH
  , $OFFSET        = DESCRIPTORS ? '_o' : BYTE_OFFSET;

// IEEE754 conversions based on https://github.com/feross/ieee754
var packIEEE754 = function(value, mLen, nBytes){
  var buffer = Array(nBytes)
    , eLen   = nBytes * 8 - mLen - 1
    , eMax   = (1 << eLen) - 1
    , eBias  = eMax >> 1
    , rt     = mLen === 23 ? pow(2, -24) - pow(2, -77) : 0
    , i      = 0
    , s      = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0
    , e, m, c;
  value = abs(value)
  if(value != value || value === Infinity){
    m = value != value ? 1 : 0;
    e = eMax;
  } else {
    e = floor(log(value) / LN2);
    if(value * (c = pow(2, -e)) < 1){
      e--;
      c *= 2;
    }
    if(e + eBias >= 1){
      value += rt / c;
    } else {
      value += rt * pow(2, 1 - eBias);
    }
    if(value * c >= 2){
      e++;
      c /= 2;
    }
    if(e + eBias >= eMax){
      m = 0;
      e = eMax;
    } else if(e + eBias >= 1){
      m = (value * c - 1) * pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * pow(2, eBias - 1) * pow(2, mLen);
      e = 0;
    }
  }
  for(; mLen >= 8; buffer[i++] = m & 255, m /= 256, mLen -= 8);
  e = e << mLen | m;
  eLen += mLen;
  for(; eLen > 0; buffer[i++] = e & 255, e /= 256, eLen -= 8);
  buffer[--i] |= s * 128;
  return buffer;
};
var unpackIEEE754 = function(buffer, mLen, nBytes){
  var eLen  = nBytes * 8 - mLen - 1
    , eMax  = (1 << eLen) - 1
    , eBias = eMax >> 1
    , nBits = eLen - 7
    , i     = nBytes - 1
    , s     = buffer[i--]
    , e     = s & 127
    , m;
  s >>= 7;
  for(; nBits > 0; e = e * 256 + buffer[i], i--, nBits -= 8);
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for(; nBits > 0; m = m * 256 + buffer[i], i--, nBits -= 8);
  if(e === 0){
    e = 1 - eBias;
  } else if(e === eMax){
    return m ? NaN : s ? -Infinity : Infinity;
  } else {
    m = m + pow(2, mLen);
    e = e - eBias;
  } return (s ? -1 : 1) * m * pow(2, e - mLen);
};

var unpackI32 = function(bytes){
  return bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
};
var packI8 = function(it){
  return [it & 0xff];
};
var packI16 = function(it){
  return [it & 0xff, it >> 8 & 0xff];
};
var packI32 = function(it){
  return [it & 0xff, it >> 8 & 0xff, it >> 16 & 0xff, it >> 24 & 0xff];
};
var packF64 = function(it){
  return packIEEE754(it, 52, 8);
};
var packF32 = function(it){
  return packIEEE754(it, 23, 4);
};

var addGetter = function(C, key, internal){
  dP(C[PROTOTYPE], key, {get: function(){ return this[internal]; }});
};

var get = function(view, bytes, index, isLittleEndian){
  var numIndex = +index
    , intIndex = toInteger(numIndex);
  if(numIndex != intIndex || intIndex < 0 || intIndex + bytes > view[$LENGTH])throw RangeError(WRONG_INDEX);
  var store = view[$BUFFER]._b
    , start = intIndex + view[$OFFSET]
    , pack  = store.slice(start, start + bytes);
  return isLittleEndian ? pack : pack.reverse();
};
var set = function(view, bytes, index, conversion, value, isLittleEndian){
  var numIndex = +index
    , intIndex = toInteger(numIndex);
  if(numIndex != intIndex || intIndex < 0 || intIndex + bytes > view[$LENGTH])throw RangeError(WRONG_INDEX);
  var store = view[$BUFFER]._b
    , start = intIndex + view[$OFFSET]
    , pack  = conversion(+value);
  for(var i = 0; i < bytes; i++)store[start + i] = pack[isLittleEndian ? i : bytes - i - 1];
};

var validateArrayBufferArguments = function(that, length){
  anInstance(that, $ArrayBuffer, ARRAY_BUFFER);
  var numberLength = +length
    , byteLength   = toLength(numberLength);
  if(numberLength != byteLength)throw RangeError(WRONG_LENGTH);
  return byteLength;
};

if(!$typed.ABV){
  $ArrayBuffer = function ArrayBuffer(length){
    var byteLength = validateArrayBufferArguments(this, length);
    this._b       = arrayFill.call(Array(byteLength), 0);
    this[$LENGTH] = byteLength;
  };

  $DataView = function DataView(buffer, byteOffset, byteLength){
    anInstance(this, $DataView, DATA_VIEW);
    anInstance(buffer, $ArrayBuffer, DATA_VIEW);
    var bufferLength = buffer[$LENGTH]
      , offset       = toInteger(byteOffset);
    if(offset < 0 || offset > bufferLength)throw RangeError('Wrong offset!');
    byteLength = byteLength === undefined ? bufferLength - offset : toLength(byteLength);
    if(offset + byteLength > bufferLength)throw RangeError(WRONG_LENGTH);
    this[$BUFFER] = buffer;
    this[$OFFSET] = offset;
    this[$LENGTH] = byteLength;
  };

  if(DESCRIPTORS){
    addGetter($ArrayBuffer, BYTE_LENGTH, '_l');
    addGetter($DataView, BUFFER, '_b');
    addGetter($DataView, BYTE_LENGTH, '_l');
    addGetter($DataView, BYTE_OFFSET, '_o');
  }

  redefineAll($DataView[PROTOTYPE], {
    getInt8: function getInt8(byteOffset){
      return get(this, 1, byteOffset)[0] << 24 >> 24;
    },
    getUint8: function getUint8(byteOffset){
      return get(this, 1, byteOffset)[0];
    },
    getInt16: function getInt16(byteOffset /*, littleEndian */){
      var bytes = get(this, 2, byteOffset, arguments[1]);
      return (bytes[1] << 8 | bytes[0]) << 16 >> 16;
    },
    getUint16: function getUint16(byteOffset /*, littleEndian */){
      var bytes = get(this, 2, byteOffset, arguments[1]);
      return bytes[1] << 8 | bytes[0];
    },
    getInt32: function getInt32(byteOffset /*, littleEndian */){
      return unpackI32(get(this, 4, byteOffset, arguments[1]));
    },
    getUint32: function getUint32(byteOffset /*, littleEndian */){
      return unpackI32(get(this, 4, byteOffset, arguments[1])) >>> 0;
    },
    getFloat32: function getFloat32(byteOffset /*, littleEndian */){
      return unpackIEEE754(get(this, 4, byteOffset, arguments[1]), 23, 4);
    },
    getFloat64: function getFloat64(byteOffset /*, littleEndian */){
      return unpackIEEE754(get(this, 8, byteOffset, arguments[1]), 52, 8);
    },
    setInt8: function setInt8(byteOffset, value){
      set(this, 1, byteOffset, packI8, value);
    },
    setUint8: function setUint8(byteOffset, value){
      set(this, 1, byteOffset, packI8, value);
    },
    setInt16: function setInt16(byteOffset, value /*, littleEndian */){
      set(this, 2, byteOffset, packI16, value, arguments[2]);
    },
    setUint16: function setUint16(byteOffset, value /*, littleEndian */){
      set(this, 2, byteOffset, packI16, value, arguments[2]);
    },
    setInt32: function setInt32(byteOffset, value /*, littleEndian */){
      set(this, 4, byteOffset, packI32, value, arguments[2]);
    },
    setUint32: function setUint32(byteOffset, value /*, littleEndian */){
      set(this, 4, byteOffset, packI32, value, arguments[2]);
    },
    setFloat32: function setFloat32(byteOffset, value /*, littleEndian */){
      set(this, 4, byteOffset, packF32, value, arguments[2]);
    },
    setFloat64: function setFloat64(byteOffset, value /*, littleEndian */){
      set(this, 8, byteOffset, packF64, value, arguments[2]);
    }
  });
} else {
  if(!fails(function(){
    new $ArrayBuffer;     // eslint-disable-line no-new
  }) || !fails(function(){
    new $ArrayBuffer(.5); // eslint-disable-line no-new
  })){
    $ArrayBuffer = function ArrayBuffer(length){
      return new BaseBuffer(validateArrayBufferArguments(this, length));
    };
    var ArrayBufferProto = $ArrayBuffer[PROTOTYPE] = BaseBuffer[PROTOTYPE];
    for(var keys = gOPN(BaseBuffer), j = 0, key; keys.length > j; ){
      if(!((key = keys[j++]) in $ArrayBuffer))hide($ArrayBuffer, key, BaseBuffer[key]);
    };
    if(!LIBRARY)ArrayBufferProto.constructor = $ArrayBuffer;
  }
  // iOS Safari 7.x bug
  var view = new $DataView(new $ArrayBuffer(2))
    , $setInt8 = $DataView[PROTOTYPE].setInt8;
  view.setInt8(0, 2147483648);
  view.setInt8(1, 2147483649);
  if(view.getInt8(0) || !view.getInt8(1))redefineAll($DataView[PROTOTYPE], {
    setInt8: function setInt8(byteOffset, value){
      $setInt8.call(this, byteOffset, value << 24 >> 24);
    },
    setUint8: function setUint8(byteOffset, value){
      $setInt8.call(this, byteOffset, value << 24 >> 24);
    }
  }, true);
}
setToStringTag($ArrayBuffer, ARRAY_BUFFER);
setToStringTag($DataView, DATA_VIEW);
hide($DataView[PROTOTYPE], $typed.VIEW, true);
exports[ARRAY_BUFFER] = $ArrayBuffer;
exports[DATA_VIEW] = $DataView;
},{"./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_array-fill":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-fill.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_library":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js","./_set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js","./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_typed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed.js":[function(require,module,exports){
var global = require('./_global')
  , hide   = require('./_hide')
  , uid    = require('./_uid')
  , TYPED  = uid('typed_array')
  , VIEW   = uid('view')
  , ABV    = !!(global.ArrayBuffer && global.DataView)
  , CONSTR = ABV
  , i = 0, l = 9, Typed;

var TypedArrayConstructors = (
  'Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array'
).split(',');

while(i < l){
  if(Typed = global[TypedArrayConstructors[i++]]){
    hide(Typed.prototype, TYPED, true);
    hide(Typed.prototype, VIEW, true);
  } else CONSTR = false;
}

module.exports = {
  ABV:    ABV,
  CONSTR: CONSTR,
  TYPED:  TYPED,
  VIEW:   VIEW
};
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js":[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js":[function(require,module,exports){
var store      = require('./_shared')('wks')
  , uid        = require('./_uid')
  , Symbol     = require('./_global').Symbol
  , USE_SYMBOL = typeof Symbol == 'function';
module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_shared":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.get-iterator-method.js":[function(require,module,exports){
var classof   = require('./_classof')
  , ITERATOR  = require('./_wks')('iterator')
  , Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./_classof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js","./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.is-iterable.js":[function(require,module,exports){
var classof   = require('./_classof')
  , ITERATOR  = require('./_wks')('iterator')
  , Iterators = require('./_iterators');
module.exports = require('./_core').isIterable = function(it){
  var O = Object(it);
  return O[ITERATOR] !== undefined
    || '@@iterator' in O
    || Iterators.hasOwnProperty(classof(O));
};
},{"./_classof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js","./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.regexp.escape.js":[function(require,module,exports){
// https://github.com/benjamingr/RexExp.escape
var $export = require('./_export')
  , $re     = require('./_replacer')(/[\\^$*+?.()|[\]{}]/g, '\\$&');

$export($export.S, 'RegExp', {escape: function escape(it){ return $re(it); }});

},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_replacer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_replacer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.copy-within.js":[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', {copyWithin: require('./_array-copy-within')});

require('./_add-to-unscopables')('copyWithin');
},{"./_add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js","./_array-copy-within":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-copy-within.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.every.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $every  = require('./_array-methods')(4);

$export($export.P + $export.F * !require('./_strict-method')([].every, true), 'Array', {
  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
  every: function every(callbackfn /* , thisArg */){
    return $every(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.fill.js":[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', {fill: require('./_array-fill')});

require('./_add-to-unscopables')('fill');
},{"./_add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js","./_array-fill":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-fill.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.filter.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $filter = require('./_array-methods')(2);

$export($export.P + $export.F * !require('./_strict-method')([].filter, true), 'Array', {
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: function filter(callbackfn /* , thisArg */){
    return $filter(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.find-index.js":[function(require,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
var $export = require('./_export')
  , $find   = require('./_array-methods')(6)
  , KEY     = 'findIndex'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);
},{"./_add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js","./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.find.js":[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = require('./_export')
  , $find   = require('./_array-methods')(5)
  , KEY     = 'find'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);
},{"./_add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js","./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.for-each.js":[function(require,module,exports){
'use strict';
var $export  = require('./_export')
  , $forEach = require('./_array-methods')(0)
  , STRICT   = require('./_strict-method')([].forEach, true);

$export($export.P + $export.F * !STRICT, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: function forEach(callbackfn /* , thisArg */){
    return $forEach(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.from.js":[function(require,module,exports){
'use strict';
var ctx            = require('./_ctx')
  , $export        = require('./_export')
  , toObject       = require('./_to-object')
  , call           = require('./_iter-call')
  , isArrayIter    = require('./_is-array-iter')
  , toLength       = require('./_to-length')
  , createProperty = require('./_create-property')
  , getIterFn      = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , aLen    = arguments.length
      , mapfn   = aLen > 1 ? arguments[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_create-property.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_is-array-iter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array-iter.js","./_iter-call":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-call.js","./_iter-detect":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-detect.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js","./core.get-iterator-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/core.get-iterator-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.index-of.js":[function(require,module,exports){
'use strict';
var $export       = require('./_export')
  , $indexOf      = require('./_array-includes')(false)
  , $native       = [].indexOf
  , NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: function indexOf(searchElement /*, fromIndex = 0 */){
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? $native.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments[1]);
  }
});
},{"./_array-includes":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-includes.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.is-array.js":[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', {isArray: require('./_is-array')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_is-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.iterator.js":[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables')
  , step             = require('./_iter-step')
  , Iterators        = require('./_iterators')
  , toIObject        = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./_add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js","./_iter-define":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-define.js","./_iter-step":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-step.js","./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.join.js":[function(require,module,exports){
'use strict';
// 22.1.3.13 Array.prototype.join(separator)
var $export   = require('./_export')
  , toIObject = require('./_to-iobject')
  , arrayJoin = [].join;

// fallback for not array-like strings
$export($export.P + $export.F * (require('./_iobject') != Object || !require('./_strict-method')(arrayJoin)), 'Array', {
  join: function join(separator){
    return arrayJoin.call(toIObject(this), separator === undefined ? ',' : separator);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iobject.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.last-index-of.js":[function(require,module,exports){
'use strict';
var $export       = require('./_export')
  , toIObject     = require('./_to-iobject')
  , toInteger     = require('./_to-integer')
  , toLength      = require('./_to-length')
  , $native       = [].lastIndexOf
  , NEGATIVE_ZERO = !!$native && 1 / [1].lastIndexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
  lastIndexOf: function lastIndexOf(searchElement /*, fromIndex = @[*-1] */){
    // convert -0 to +0
    if(NEGATIVE_ZERO)return $native.apply(this, arguments) || 0;
    var O      = toIObject(this)
      , length = toLength(O.length)
      , index  = length - 1;
    if(arguments.length > 1)index = Math.min(index, toInteger(arguments[1]));
    if(index < 0)index = length + index;
    for(;index >= 0; index--)if(index in O)if(O[index] === searchElement)return index || 0;
    return -1;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js","./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.map.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $map    = require('./_array-methods')(1);

$export($export.P + $export.F * !require('./_strict-method')([].map, true), 'Array', {
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: function map(callbackfn /* , thisArg */){
    return $map(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.of.js":[function(require,module,exports){
'use strict';
var $export        = require('./_export')
  , createProperty = require('./_create-property');

// WebKit Array.of isn't generic
$export($export.S + $export.F * require('./_fails')(function(){
  function F(){}
  return !(Array.of.call(F) instanceof F);
}), 'Array', {
  // 22.1.2.3 Array.of( ...items)
  of: function of(/* ...args */){
    var index  = 0
      , aLen   = arguments.length
      , result = new (typeof this == 'function' ? this : Array)(aLen);
    while(aLen > index)createProperty(result, index, arguments[index++]);
    result.length = aLen;
    return result;
  }
});
},{"./_create-property":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_create-property.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.reduce-right.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduceRight, true), 'Array', {
  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
  reduceRight: function reduceRight(callbackfn /* , initialValue */){
    return $reduce(this, callbackfn, arguments.length, arguments[1], true);
  }
});
},{"./_array-reduce":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-reduce.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.reduce.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduce, true), 'Array', {
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: function reduce(callbackfn /* , initialValue */){
    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
  }
});
},{"./_array-reduce":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-reduce.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.slice.js":[function(require,module,exports){
'use strict';
var $export    = require('./_export')
  , html       = require('./_html')
  , cof        = require('./_cof')
  , toIndex    = require('./_to-index')
  , toLength   = require('./_to-length')
  , arraySlice = [].slice;

// fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * require('./_fails')(function(){
  if(html)arraySlice.call(html);
}), 'Array', {
  slice: function slice(begin, end){
    var len   = toLength(this.length)
      , klass = cof(this);
    end = end === undefined ? len : end;
    if(klass == 'Array')return arraySlice.call(this, begin, end);
    var start  = toIndex(begin, len)
      , upTo   = toIndex(end, len)
      , size   = toLength(upTo - start)
      , cloned = Array(size)
      , i      = 0;
    for(; i < size; i++)cloned[i] = klass == 'String'
      ? this.charAt(start + i)
      : this[start + i];
    return cloned;
  }
});
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_html.js","./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.some.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $some   = require('./_array-methods')(3);

$export($export.P + $export.F * !require('./_strict-method')([].some, true), 'Array', {
  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
  some: function some(callbackfn /* , thisArg */){
    return $some(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.sort.js":[function(require,module,exports){
'use strict';
var $export   = require('./_export')
  , aFunction = require('./_a-function')
  , toObject  = require('./_to-object')
  , fails     = require('./_fails')
  , $sort     = [].sort
  , test      = [1, 2, 3];

$export($export.P + $export.F * (fails(function(){
  // IE8-
  test.sort(undefined);
}) || !fails(function(){
  // V8 bug
  test.sort(null);
  // Old WebKit
}) || !require('./_strict-method')($sort)), 'Array', {
  // 22.1.3.25 Array.prototype.sort(comparefn)
  sort: function sort(comparefn){
    return comparefn === undefined
      ? $sort.call(toObject(this))
      : $sort.call(toObject(this), aFunction(comparefn));
  }
});
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_strict-method":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_strict-method.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.species.js":[function(require,module,exports){
require('./_set-species')('Array');
},{"./_set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.now.js":[function(require,module,exports){
// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = require('./_export');

$export($export.S, 'Date', {now: function(){ return new Date().getTime(); }});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-iso-string.js":[function(require,module,exports){
'use strict';
// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
var $export = require('./_export')
  , fails   = require('./_fails')
  , getTime = Date.prototype.getTime;

var lz = function(num){
  return num > 9 ? num : '0' + num;
};

// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (fails(function(){
  return new Date(-5e13 - 1).toISOString() != '0385-07-25T07:06:39.999Z';
}) || !fails(function(){
  new Date(NaN).toISOString();
})), 'Date', {
  toISOString: function toISOString(){
    if(!isFinite(getTime.call(this)))throw RangeError('Invalid time value');
    var d = this
      , y = d.getUTCFullYear()
      , m = d.getUTCMilliseconds()
      , s = y < 0 ? '-' : y > 9999 ? '+' : '';
    return s + ('00000' + Math.abs(y)).slice(s ? -6 : -4) +
      '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) +
      'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) +
      ':' + lz(d.getUTCSeconds()) + '.' + (m > 99 ? m : '0' + lz(m)) + 'Z';
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-json.js":[function(require,module,exports){
'use strict';
var $export     = require('./_export')
  , toObject    = require('./_to-object')
  , toPrimitive = require('./_to-primitive');

$export($export.P + $export.F * require('./_fails')(function(){
  return new Date(NaN).toJSON() !== null || Date.prototype.toJSON.call({toISOString: function(){ return 1; }}) !== 1;
}), 'Date', {
  toJSON: function toJSON(key){
    var O  = toObject(this)
      , pv = toPrimitive(O);
    return typeof pv == 'number' && !isFinite(pv) ? null : O.toISOString();
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-primitive.js":[function(require,module,exports){
var TO_PRIMITIVE = require('./_wks')('toPrimitive')
  , proto        = Date.prototype;

if(!(TO_PRIMITIVE in proto))require('./_hide')(proto, TO_PRIMITIVE, require('./_date-to-primitive'));
},{"./_date-to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_date-to-primitive.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-string.js":[function(require,module,exports){
var DateProto    = Date.prototype
  , INVALID_DATE = 'Invalid Date'
  , TO_STRING    = 'toString'
  , $toString    = DateProto[TO_STRING]
  , getTime      = DateProto.getTime;
if(new Date(NaN) + '' != INVALID_DATE){
  require('./_redefine')(DateProto, TO_STRING, function toString(){
    var value = getTime.call(this);
    return value === value ? $toString.call(this) : INVALID_DATE;
  });
}
},{"./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.function.bind.js":[function(require,module,exports){
// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
var $export = require('./_export');

$export($export.P, 'Function', {bind: require('./_bind')});
},{"./_bind":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_bind.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.function.has-instance.js":[function(require,module,exports){
'use strict';
var isObject       = require('./_is-object')
  , getPrototypeOf = require('./_object-gpo')
  , HAS_INSTANCE   = require('./_wks')('hasInstance')
  , FunctionProto  = Function.prototype;
// 19.2.3.6 Function.prototype[@@hasInstance](V)
if(!(HAS_INSTANCE in FunctionProto))require('./_object-dp').f(FunctionProto, HAS_INSTANCE, {value: function(O){
  if(typeof this != 'function' || !isObject(O))return false;
  if(!isObject(this.prototype))return O instanceof this;
  // for environment w/o native `@@hasInstance` logic enough `instanceof`, but add this:
  while(O = getPrototypeOf(O))if(this.prototype === O)return true;
  return false;
}});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.function.name.js":[function(require,module,exports){
var dP         = require('./_object-dp').f
  , createDesc = require('./_property-desc')
  , has        = require('./_has')
  , FProto     = Function.prototype
  , nameRE     = /^\s*function ([^ (]*)/
  , NAME       = 'name';
// 19.2.4.2 name
NAME in FProto || require('./_descriptors') && dP(FProto, NAME, {
  configurable: true,
  get: function(){
    var match = ('' + this).match(nameRE)
      , name  = match ? match[1] : '';
    has(this, NAME) || dP(this, NAME, createDesc(5, name));
    return name;
  }
});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.map.js":[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');

// 23.1 Map Objects
module.exports = require('./_collection')('Map', function(get){
  return function Map(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key){
    var entry = strong.getEntry(this, key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value){
    return strong.def(this, key === 0 ? 0 : key, value);
  }
}, strong, true);
},{"./_collection":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection.js","./_collection-strong":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-strong.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.acosh.js":[function(require,module,exports){
// 20.2.2.3 Math.acosh(x)
var $export = require('./_export')
  , log1p   = require('./_math-log1p')
  , sqrt    = Math.sqrt
  , $acosh  = Math.acosh;

$export($export.S + $export.F * !($acosh
  // V8 bug: https://code.google.com/p/v8/issues/detail?id=3509
  && Math.floor($acosh(Number.MAX_VALUE)) == 710
  // Tor Browser bug: Math.acosh(Infinity) -> NaN 
  && $acosh(Infinity) == Infinity
), 'Math', {
  acosh: function acosh(x){
    return (x = +x) < 1 ? NaN : x > 94906265.62425156
      ? Math.log(x) + Math.LN2
      : log1p(x - 1 + sqrt(x - 1) * sqrt(x + 1));
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-log1p":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-log1p.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.asinh.js":[function(require,module,exports){
// 20.2.2.5 Math.asinh(x)
var $export = require('./_export')
  , $asinh  = Math.asinh;

function asinh(x){
  return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : Math.log(x + Math.sqrt(x * x + 1));
}

// Tor Browser bug: Math.asinh(0) -> -0 
$export($export.S + $export.F * !($asinh && 1 / $asinh(0) > 0), 'Math', {asinh: asinh});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.atanh.js":[function(require,module,exports){
// 20.2.2.7 Math.atanh(x)
var $export = require('./_export')
  , $atanh  = Math.atanh;

// Tor Browser bug: Math.atanh(-0) -> 0 
$export($export.S + $export.F * !($atanh && 1 / $atanh(-0) < 0), 'Math', {
  atanh: function atanh(x){
    return (x = +x) == 0 ? x : Math.log((1 + x) / (1 - x)) / 2;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.cbrt.js":[function(require,module,exports){
// 20.2.2.9 Math.cbrt(x)
var $export = require('./_export')
  , sign    = require('./_math-sign');

$export($export.S, 'Math', {
  cbrt: function cbrt(x){
    return sign(x = +x) * Math.pow(Math.abs(x), 1 / 3);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-sign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-sign.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.clz32.js":[function(require,module,exports){
// 20.2.2.11 Math.clz32(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  clz32: function clz32(x){
    return (x >>>= 0) ? 31 - Math.floor(Math.log(x + 0.5) * Math.LOG2E) : 32;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.cosh.js":[function(require,module,exports){
// 20.2.2.12 Math.cosh(x)
var $export = require('./_export')
  , exp     = Math.exp;

$export($export.S, 'Math', {
  cosh: function cosh(x){
    return (exp(x = +x) + exp(-x)) / 2;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.expm1.js":[function(require,module,exports){
// 20.2.2.14 Math.expm1(x)
var $export = require('./_export')
  , $expm1  = require('./_math-expm1');

$export($export.S + $export.F * ($expm1 != Math.expm1), 'Math', {expm1: $expm1});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-expm1":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-expm1.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.fround.js":[function(require,module,exports){
// 20.2.2.16 Math.fround(x)
var $export   = require('./_export')
  , sign      = require('./_math-sign')
  , pow       = Math.pow
  , EPSILON   = pow(2, -52)
  , EPSILON32 = pow(2, -23)
  , MAX32     = pow(2, 127) * (2 - EPSILON32)
  , MIN32     = pow(2, -126);

var roundTiesToEven = function(n){
  return n + 1 / EPSILON - 1 / EPSILON;
};


$export($export.S, 'Math', {
  fround: function fround(x){
    var $abs  = Math.abs(x)
      , $sign = sign(x)
      , a, result;
    if($abs < MIN32)return $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32;
    a = (1 + EPSILON32 / EPSILON) * $abs;
    result = a - (a - $abs);
    if(result > MAX32 || result != result)return $sign * Infinity;
    return $sign * result;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-sign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-sign.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.hypot.js":[function(require,module,exports){
// 20.2.2.17 Math.hypot([value1[, value2[, … ]]])
var $export = require('./_export')
  , abs     = Math.abs;

$export($export.S, 'Math', {
  hypot: function hypot(value1, value2){ // eslint-disable-line no-unused-vars
    var sum  = 0
      , i    = 0
      , aLen = arguments.length
      , larg = 0
      , arg, div;
    while(i < aLen){
      arg = abs(arguments[i++]);
      if(larg < arg){
        div  = larg / arg;
        sum  = sum * div * div + 1;
        larg = arg;
      } else if(arg > 0){
        div  = arg / larg;
        sum += div * div;
      } else sum += arg;
    }
    return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.imul.js":[function(require,module,exports){
// 20.2.2.18 Math.imul(x, y)
var $export = require('./_export')
  , $imul   = Math.imul;

// some WebKit versions fails with big numbers, some has wrong arity
$export($export.S + $export.F * require('./_fails')(function(){
  return $imul(0xffffffff, 5) != -5 || $imul.length != 2;
}), 'Math', {
  imul: function imul(x, y){
    var UINT16 = 0xffff
      , xn = +x
      , yn = +y
      , xl = UINT16 & xn
      , yl = UINT16 & yn;
    return 0 | xl * yl + ((UINT16 & xn >>> 16) * yl + xl * (UINT16 & yn >>> 16) << 16 >>> 0);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.log10.js":[function(require,module,exports){
// 20.2.2.21 Math.log10(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  log10: function log10(x){
    return Math.log(x) / Math.LN10;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.log1p.js":[function(require,module,exports){
// 20.2.2.20 Math.log1p(x)
var $export = require('./_export');

$export($export.S, 'Math', {log1p: require('./_math-log1p')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-log1p":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-log1p.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.log2.js":[function(require,module,exports){
// 20.2.2.22 Math.log2(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  log2: function log2(x){
    return Math.log(x) / Math.LN2;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.sign.js":[function(require,module,exports){
// 20.2.2.28 Math.sign(x)
var $export = require('./_export');

$export($export.S, 'Math', {sign: require('./_math-sign')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-sign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-sign.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.sinh.js":[function(require,module,exports){
// 20.2.2.30 Math.sinh(x)
var $export = require('./_export')
  , expm1   = require('./_math-expm1')
  , exp     = Math.exp;

// V8 near Chromium 38 has a problem with very small numbers
$export($export.S + $export.F * require('./_fails')(function(){
  return !Math.sinh(-2e-17) != -2e-17;
}), 'Math', {
  sinh: function sinh(x){
    return Math.abs(x = +x) < 1
      ? (expm1(x) - expm1(-x)) / 2
      : (exp(x - 1) - exp(-x - 1)) * (Math.E / 2);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_math-expm1":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-expm1.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.tanh.js":[function(require,module,exports){
// 20.2.2.33 Math.tanh(x)
var $export = require('./_export')
  , expm1   = require('./_math-expm1')
  , exp     = Math.exp;

$export($export.S, 'Math', {
  tanh: function tanh(x){
    var a = expm1(x = +x)
      , b = expm1(-x);
    return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp(x) + exp(-x));
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_math-expm1":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_math-expm1.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.trunc.js":[function(require,module,exports){
// 20.2.2.34 Math.trunc(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  trunc: function trunc(it){
    return (it > 0 ? Math.floor : Math.ceil)(it);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.constructor.js":[function(require,module,exports){
'use strict';
var global            = require('./_global')
  , has               = require('./_has')
  , cof               = require('./_cof')
  , inheritIfRequired = require('./_inherit-if-required')
  , toPrimitive       = require('./_to-primitive')
  , fails             = require('./_fails')
  , gOPN              = require('./_object-gopn').f
  , gOPD              = require('./_object-gopd').f
  , dP                = require('./_object-dp').f
  , $trim             = require('./_string-trim').trim
  , NUMBER            = 'Number'
  , $Number           = global[NUMBER]
  , Base              = $Number
  , proto             = $Number.prototype
  // Opera ~12 has broken Object#toString
  , BROKEN_COF        = cof(require('./_object-create')(proto)) == NUMBER
  , TRIM              = 'trim' in String.prototype;

// 7.1.3 ToNumber(argument)
var toNumber = function(argument){
  var it = toPrimitive(argument, false);
  if(typeof it == 'string' && it.length > 2){
    it = TRIM ? it.trim() : $trim(it, 3);
    var first = it.charCodeAt(0)
      , third, radix, maxCode;
    if(first === 43 || first === 45){
      third = it.charCodeAt(2);
      if(third === 88 || third === 120)return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if(first === 48){
      switch(it.charCodeAt(1)){
        case 66 : case 98  : radix = 2; maxCode = 49; break; // fast equal /^0b[01]+$/i
        case 79 : case 111 : radix = 8; maxCode = 55; break; // fast equal /^0o[0-7]+$/i
        default : return +it;
      }
      for(var digits = it.slice(2), i = 0, l = digits.length, code; i < l; i++){
        code = digits.charCodeAt(i);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if(code < 48 || code > maxCode)return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

if(!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')){
  $Number = function Number(value){
    var it = arguments.length < 1 ? 0 : value
      , that = this;
    return that instanceof $Number
      // check on 1..constructor(foo) case
      && (BROKEN_COF ? fails(function(){ proto.valueOf.call(that); }) : cof(that) != NUMBER)
        ? inheritIfRequired(new Base(toNumber(it)), that, $Number) : toNumber(it);
  };
  for(var keys = require('./_descriptors') ? gOPN(Base) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES6 (in case, if modules with ES6 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys.length > j; j++){
    if(has(Base, key = keys[j]) && !has($Number, key)){
      dP($Number, key, gOPD(Base, key));
    }
  }
  $Number.prototype = proto;
  proto.constructor = $Number;
  require('./_redefine')(global, NUMBER, $Number);
}
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_inherit-if-required":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_inherit-if-required.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_string-trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.epsilon.js":[function(require,module,exports){
// 20.1.2.1 Number.EPSILON
var $export = require('./_export');

$export($export.S, 'Number', {EPSILON: Math.pow(2, -52)});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-finite.js":[function(require,module,exports){
// 20.1.2.2 Number.isFinite(number)
var $export   = require('./_export')
  , _isFinite = require('./_global').isFinite;

$export($export.S, 'Number', {
  isFinite: function isFinite(it){
    return typeof it == 'number' && _isFinite(it);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-integer.js":[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var $export = require('./_export');

$export($export.S, 'Number', {isInteger: require('./_is-integer')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_is-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-nan.js":[function(require,module,exports){
// 20.1.2.4 Number.isNaN(number)
var $export = require('./_export');

$export($export.S, 'Number', {
  isNaN: function isNaN(number){
    return number != number;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-safe-integer.js":[function(require,module,exports){
// 20.1.2.5 Number.isSafeInteger(number)
var $export   = require('./_export')
  , isInteger = require('./_is-integer')
  , abs       = Math.abs;

$export($export.S, 'Number', {
  isSafeInteger: function isSafeInteger(number){
    return isInteger(number) && abs(number) <= 0x1fffffffffffff;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_is-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.max-safe-integer.js":[function(require,module,exports){
// 20.1.2.6 Number.MAX_SAFE_INTEGER
var $export = require('./_export');

$export($export.S, 'Number', {MAX_SAFE_INTEGER: 0x1fffffffffffff});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.min-safe-integer.js":[function(require,module,exports){
// 20.1.2.10 Number.MIN_SAFE_INTEGER
var $export = require('./_export');

$export($export.S, 'Number', {MIN_SAFE_INTEGER: -0x1fffffffffffff});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.parse-float.js":[function(require,module,exports){
var $export     = require('./_export')
  , $parseFloat = require('./_parse-float');
// 20.1.2.12 Number.parseFloat(string)
$export($export.S + $export.F * (Number.parseFloat != $parseFloat), 'Number', {parseFloat: $parseFloat});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_parse-float":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_parse-float.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.parse-int.js":[function(require,module,exports){
var $export   = require('./_export')
  , $parseInt = require('./_parse-int');
// 20.1.2.13 Number.parseInt(string, radix)
$export($export.S + $export.F * (Number.parseInt != $parseInt), 'Number', {parseInt: $parseInt});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_parse-int":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_parse-int.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.to-fixed.js":[function(require,module,exports){
'use strict';
var $export      = require('./_export')
  , anInstance   = require('./_an-instance')
  , toInteger    = require('./_to-integer')
  , aNumberValue = require('./_a-number-value')
  , repeat       = require('./_string-repeat')
  , $toFixed     = 1..toFixed
  , floor        = Math.floor
  , data         = [0, 0, 0, 0, 0, 0]
  , ERROR        = 'Number.toFixed: incorrect invocation!'
  , ZERO         = '0';

var multiply = function(n, c){
  var i  = -1
    , c2 = c;
  while(++i < 6){
    c2 += n * data[i];
    data[i] = c2 % 1e7;
    c2 = floor(c2 / 1e7);
  }
};
var divide = function(n){
  var i = 6
    , c = 0;
  while(--i >= 0){
    c += data[i];
    data[i] = floor(c / n);
    c = (c % n) * 1e7;
  }
};
var numToString = function(){
  var i = 6
    , s = '';
  while(--i >= 0){
    if(s !== '' || i === 0 || data[i] !== 0){
      var t = String(data[i]);
      s = s === '' ? t : s + repeat.call(ZERO, 7 - t.length) + t;
    }
  } return s;
};
var pow = function(x, n, acc){
  return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
};
var log = function(x){
  var n  = 0
    , x2 = x;
  while(x2 >= 4096){
    n += 12;
    x2 /= 4096;
  }
  while(x2 >= 2){
    n  += 1;
    x2 /= 2;
  } return n;
};

$export($export.P + $export.F * (!!$toFixed && (
  0.00008.toFixed(3) !== '0.000' ||
  0.9.toFixed(0) !== '1' ||
  1.255.toFixed(2) !== '1.25' ||
  1000000000000000128..toFixed(0) !== '1000000000000000128'
) || !require('./_fails')(function(){
  // V8 ~ Android 4.3-
  $toFixed.call({});
})), 'Number', {
  toFixed: function toFixed(fractionDigits){
    var x = aNumberValue(this, ERROR)
      , f = toInteger(fractionDigits)
      , s = ''
      , m = ZERO
      , e, z, j, k;
    if(f < 0 || f > 20)throw RangeError(ERROR);
    if(x != x)return 'NaN';
    if(x <= -1e21 || x >= 1e21)return String(x);
    if(x < 0){
      s = '-';
      x = -x;
    }
    if(x > 1e-21){
      e = log(x * pow(2, 69, 1)) - 69;
      z = e < 0 ? x * pow(2, -e, 1) : x / pow(2, e, 1);
      z *= 0x10000000000000;
      e = 52 - e;
      if(e > 0){
        multiply(0, z);
        j = f;
        while(j >= 7){
          multiply(1e7, 0);
          j -= 7;
        }
        multiply(pow(10, j, 1), 0);
        j = e - 1;
        while(j >= 23){
          divide(1 << 23);
          j -= 23;
        }
        divide(1 << j);
        multiply(1, 1);
        divide(2);
        m = numToString();
      } else {
        multiply(0, z);
        multiply(1 << -e, 0);
        m = numToString() + repeat.call(ZERO, f);
      }
    }
    if(f > 0){
      k = m.length;
      m = s + (k <= f ? '0.' + repeat.call(ZERO, f - k) + m : m.slice(0, k - f) + '.' + m.slice(k - f));
    } else {
      m = s + m;
    } return m;
  }
});
},{"./_a-number-value":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-number-value.js","./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_string-repeat":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-repeat.js","./_to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.to-precision.js":[function(require,module,exports){
'use strict';
var $export      = require('./_export')
  , $fails       = require('./_fails')
  , aNumberValue = require('./_a-number-value')
  , $toPrecision = 1..toPrecision;

$export($export.P + $export.F * ($fails(function(){
  // IE7-
  return $toPrecision.call(1, undefined) !== '1';
}) || !$fails(function(){
  // V8 ~ Android 4.3-
  $toPrecision.call({});
})), 'Number', {
  toPrecision: function toPrecision(precision){
    var that = aNumberValue(this, 'Number#toPrecision: incorrect invocation!');
    return precision === undefined ? $toPrecision.call(that) : $toPrecision.call(that, precision); 
  }
});
},{"./_a-number-value":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-number-value.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.assign.js":[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', {assign: require('./_object-assign')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-assign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-assign.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.create.js":[function(require,module,exports){
var $export = require('./_export')
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', {create: require('./_object-create')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.define-properties.js":[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperties: require('./_object-dps')});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-dps":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dps.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.define-property.js":[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperty: require('./_object-dp').f});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.freeze.js":[function(require,module,exports){
// 19.1.2.5 Object.freeze(O)
var isObject = require('./_is-object')
  , meta     = require('./_meta').onFreeze;

require('./_object-sap')('freeze', function($freeze){
  return function freeze(it){
    return $freeze && isObject(it) ? $freeze(meta(it)) : it;
  };
});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.get-own-property-descriptor.js":[function(require,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject                 = require('./_to-iobject')
  , $getOwnPropertyDescriptor = require('./_object-gopd').f;

require('./_object-sap')('getOwnPropertyDescriptor', function(){
  return function getOwnPropertyDescriptor(it, key){
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});
},{"./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.get-own-property-names.js":[function(require,module,exports){
// 19.1.2.7 Object.getOwnPropertyNames(O)
require('./_object-sap')('getOwnPropertyNames', function(){
  return require('./_object-gopn-ext').f;
});
},{"./_object-gopn-ext":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn-ext.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.get-prototype-of.js":[function(require,module,exports){
// 19.1.2.9 Object.getPrototypeOf(O)
var toObject        = require('./_to-object')
  , $getPrototypeOf = require('./_object-gpo');

require('./_object-sap')('getPrototypeOf', function(){
  return function getPrototypeOf(it){
    return $getPrototypeOf(toObject(it));
  };
});
},{"./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is-extensible.js":[function(require,module,exports){
// 19.1.2.11 Object.isExtensible(O)
var isObject = require('./_is-object');

require('./_object-sap')('isExtensible', function($isExtensible){
  return function isExtensible(it){
    return isObject(it) ? $isExtensible ? $isExtensible(it) : true : false;
  };
});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is-frozen.js":[function(require,module,exports){
// 19.1.2.12 Object.isFrozen(O)
var isObject = require('./_is-object');

require('./_object-sap')('isFrozen', function($isFrozen){
  return function isFrozen(it){
    return isObject(it) ? $isFrozen ? $isFrozen(it) : false : true;
  };
});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is-sealed.js":[function(require,module,exports){
// 19.1.2.13 Object.isSealed(O)
var isObject = require('./_is-object');

require('./_object-sap')('isSealed', function($isSealed){
  return function isSealed(it){
    return isObject(it) ? $isSealed ? $isSealed(it) : false : true;
  };
});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is.js":[function(require,module,exports){
// 19.1.3.10 Object.is(value1, value2)
var $export = require('./_export');
$export($export.S, 'Object', {is: require('./_same-value')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_same-value":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_same-value.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.keys.js":[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./_to-object')
  , $keys    = require('./_object-keys');

require('./_object-sap')('keys', function(){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./_object-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-keys.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.prevent-extensions.js":[function(require,module,exports){
// 19.1.2.15 Object.preventExtensions(O)
var isObject = require('./_is-object')
  , meta     = require('./_meta').onFreeze;

require('./_object-sap')('preventExtensions', function($preventExtensions){
  return function preventExtensions(it){
    return $preventExtensions && isObject(it) ? $preventExtensions(meta(it)) : it;
  };
});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.seal.js":[function(require,module,exports){
// 19.1.2.17 Object.seal(O)
var isObject = require('./_is-object')
  , meta     = require('./_meta').onFreeze;

require('./_object-sap')('seal', function($seal){
  return function seal(it){
    return $seal && isObject(it) ? $seal(meta(it)) : it;
  };
});
},{"./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_object-sap":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-sap.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.set-prototype-of.js":[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./_export');
$export($export.S, 'Object', {setPrototypeOf: require('./_set-proto').set});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_set-proto":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-proto.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.to-string.js":[function(require,module,exports){
'use strict';
// 19.1.3.6 Object.prototype.toString()
var classof = require('./_classof')
  , test    = {};
test[require('./_wks')('toStringTag')] = 'z';
if(test + '' != '[object z]'){
  require('./_redefine')(Object.prototype, 'toString', function toString(){
    return '[object ' + classof(this) + ']';
  }, true);
}
},{"./_classof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.parse-float.js":[function(require,module,exports){
var $export     = require('./_export')
  , $parseFloat = require('./_parse-float');
// 18.2.4 parseFloat(string)
$export($export.G + $export.F * (parseFloat != $parseFloat), {parseFloat: $parseFloat});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_parse-float":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_parse-float.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.parse-int.js":[function(require,module,exports){
var $export   = require('./_export')
  , $parseInt = require('./_parse-int');
// 18.2.5 parseInt(string, radix)
$export($export.G + $export.F * (parseInt != $parseInt), {parseInt: $parseInt});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_parse-int":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_parse-int.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.promise.js":[function(require,module,exports){
'use strict';
var LIBRARY            = require('./_library')
  , global             = require('./_global')
  , ctx                = require('./_ctx')
  , classof            = require('./_classof')
  , $export            = require('./_export')
  , isObject           = require('./_is-object')
  , anObject           = require('./_an-object')
  , aFunction          = require('./_a-function')
  , anInstance         = require('./_an-instance')
  , forOf              = require('./_for-of')
  , setProto           = require('./_set-proto').set
  , speciesConstructor = require('./_species-constructor')
  , task               = require('./_task').set
  , microtask          = require('./_microtask')
  , PROMISE            = 'Promise'
  , TypeError          = global.TypeError
  , process            = global.process
  , $Promise           = global[PROMISE]
  , process            = global.process
  , isNode             = classof(process) == 'process'
  , empty              = function(){ /* empty */ }
  , Internal, GenericPromiseCapability, Wrapper;

var USE_NATIVE = !!function(){
  try {
    // correct subclassing with @@species support
    var promise     = $Promise.resolve(1)
      , FakePromise = (promise.constructor = {})[require('./_wks')('species')] = function(exec){ exec(empty, empty); };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch(e){ /* empty */ }
}();

// helpers
var sameConstructor = function(a, b){
  // with library wrapper special case
  return a === b || a === $Promise && b === Wrapper;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var newPromiseCapability = function(C){
  return sameConstructor($Promise, C)
    ? new PromiseCapability(C)
    : new GenericPromiseCapability(C);
};
var PromiseCapability = GenericPromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject  = aFunction(reject);
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(promise, isReject){
  if(promise._n)return;
  promise._n = true;
  var chain = promise._c;
  microtask(function(){
    var value = promise._v
      , ok    = promise._s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , domain  = reaction.domain
        , result, then;
      try {
        if(handler){
          if(!ok){
            if(promise._h == 2)onHandleUnhandled(promise);
            promise._h = 1;
          }
          if(handler === true)result = value;
          else {
            if(domain)domain.enter();
            result = handler(value);
            if(domain)domain.exit();
          }
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if(isReject && !promise._h)onUnhandled(promise);
  });
};
var onUnhandled = function(promise){
  task.call(global, function(){
    var value = promise._v
      , abrupt, handler, console;
    if(isUnhandled(promise)){
      abrupt = perform(function(){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if(abrupt)throw abrupt.error;
  });
};
var isUnhandled = function(promise){
  if(promise._h == 1)return false;
  var chain = promise._a || promise._c
    , i     = 0
    , reaction;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var onHandleUnhandled = function(promise){
  task.call(global, function(){
    var handler;
    if(isNode){
      process.emit('rejectionHandled', promise);
    } else if(handler = global.onrejectionhandled){
      handler({promise: promise, reason: promise._v});
    }
  });
};
var $reject = function(value){
  var promise = this;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if(!promise._a)promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function(value){
  var promise = this
    , then;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if(promise === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      microtask(function(){
        var wrapper = {_w: promise, _d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch(e){
    $reject.call({_w: promise, _d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor){
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch(err){
      $reject.call(this, err);
    }
  };
  Internal = function Promise(executor){
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = require('./_redefine-all')($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail   = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if(this._a)this._a.push(reaction);
      if(this._s)notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
  PromiseCapability = function(){
    var promise  = new Internal;
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject  = ctx($reject, promise, 1);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: $Promise});
require('./_set-to-string-tag')($Promise, PROMISE);
require('./_set-species')(PROMISE);
Wrapper = require('./_core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = newPromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
    var capability = newPromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./_iter-detect')(function(iter){
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject;
    var abrupt = perform(function(){
      var values    = []
        , index     = 0
        , remaining = 1;
      forOf(iterable, false, function(promise){
        var $index        = index++
          , alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled  = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_an-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-instance.js","./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_classof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_classof.js","./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_ctx.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_for-of.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_iter-detect":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-detect.js","./_library":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js","./_microtask":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_microtask.js","./_redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine-all.js","./_set-proto":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-proto.js","./_set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js","./_set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js","./_species-constructor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_species-constructor.js","./_task":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_task.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.apply.js":[function(require,module,exports){
// 26.1.1 Reflect.apply(target, thisArgument, argumentsList)
var $export = require('./_export')
  , _apply  = Function.apply;

$export($export.S, 'Reflect', {
  apply: function apply(target, thisArgument, argumentsList){
    return _apply.call(target, thisArgument, argumentsList);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.construct.js":[function(require,module,exports){
// 26.1.2 Reflect.construct(target, argumentsList [, newTarget])
var $export   = require('./_export')
  , create    = require('./_object-create')
  , aFunction = require('./_a-function')
  , anObject  = require('./_an-object')
  , isObject  = require('./_is-object')
  , bind      = require('./_bind');

// MS Edge supports only 2 arguments
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
$export($export.S + $export.F * require('./_fails')(function(){
  function F(){}
  return !(Reflect.construct(function(){}, [], F) instanceof F);
}), 'Reflect', {
  construct: function construct(Target, args /*, newTarget*/){
    aFunction(Target);
    var newTarget = arguments.length < 3 ? Target : aFunction(arguments[2]);
    if(Target == newTarget){
      // w/o altered newTarget, optimization for 0-4 arguments
      if(args != undefined)switch(anObject(args).length){
        case 0: return new Target;
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
      // w/o altered newTarget, lot of arguments case
      var $args = [null];
      $args.push.apply($args, args);
      return new (bind.apply(Target, $args));
    }
    // with altered newTarget, not support built-in constructors
    var proto    = newTarget.prototype
      , instance = create(isObject(proto) ? proto : Object.prototype)
      , result   = Function.apply.call(Target, instance, args);
    return isObject(result) ? result : instance;
  }
});
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_bind":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_bind.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.define-property.js":[function(require,module,exports){
// 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)
var dP          = require('./_object-dp')
  , $export     = require('./_export')
  , anObject    = require('./_an-object')
  , toPrimitive = require('./_to-primitive');

// MS Edge has broken Reflect.defineProperty - throwing instead of returning false
$export($export.S + $export.F * require('./_fails')(function(){
  Reflect.defineProperty(dP.f({}, 1, {value: 1}), 1, {value: 2});
}), 'Reflect', {
  defineProperty: function defineProperty(target, propertyKey, attributes){
    anObject(target);
    propertyKey = toPrimitive(propertyKey, true);
    anObject(attributes);
    try {
      dP.f(target, propertyKey, attributes);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.delete-property.js":[function(require,module,exports){
// 26.1.4 Reflect.deleteProperty(target, propertyKey)
var $export  = require('./_export')
  , gOPD     = require('./_object-gopd').f
  , anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  deleteProperty: function deleteProperty(target, propertyKey){
    var desc = gOPD(anObject(target), propertyKey);
    return desc && !desc.configurable ? false : delete target[propertyKey];
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.enumerate.js":[function(require,module,exports){
'use strict';
// 26.1.5 Reflect.enumerate(target)
var $export  = require('./_export')
  , anObject = require('./_an-object');
var Enumerate = function(iterated){
  this._t = anObject(iterated); // target
  this._i = 0;                  // next index
  var keys = this._k = []       // keys
    , key;
  for(key in iterated)keys.push(key);
};
require('./_iter-create')(Enumerate, 'Object', function(){
  var that = this
    , keys = that._k
    , key;
  do {
    if(that._i >= keys.length)return {value: undefined, done: true};
  } while(!((key = keys[that._i++]) in that._t));
  return {value: key, done: false};
});

$export($export.S, 'Reflect', {
  enumerate: function enumerate(target){
    return new Enumerate(target);
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_iter-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-create.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.get-own-property-descriptor.js":[function(require,module,exports){
// 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)
var gOPD     = require('./_object-gopd')
  , $export  = require('./_export')
  , anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, propertyKey){
    return gOPD.f(anObject(target), propertyKey);
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.get-prototype-of.js":[function(require,module,exports){
// 26.1.8 Reflect.getPrototypeOf(target)
var $export  = require('./_export')
  , getProto = require('./_object-gpo')
  , anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  getPrototypeOf: function getPrototypeOf(target){
    return getProto(anObject(target));
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.get.js":[function(require,module,exports){
// 26.1.6 Reflect.get(target, propertyKey [, receiver])
var gOPD           = require('./_object-gopd')
  , getPrototypeOf = require('./_object-gpo')
  , has            = require('./_has')
  , $export        = require('./_export')
  , isObject       = require('./_is-object')
  , anObject       = require('./_an-object');

function get(target, propertyKey/*, receiver*/){
  var receiver = arguments.length < 3 ? target : arguments[2]
    , desc, proto;
  if(anObject(target) === receiver)return target[propertyKey];
  if(desc = gOPD.f(target, propertyKey))return has(desc, 'value')
    ? desc.value
    : desc.get !== undefined
      ? desc.get.call(receiver)
      : undefined;
  if(isObject(proto = getPrototypeOf(target)))return get(proto, propertyKey, receiver);
}

$export($export.S, 'Reflect', {get: get});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.has.js":[function(require,module,exports){
// 26.1.9 Reflect.has(target, propertyKey)
var $export = require('./_export');

$export($export.S, 'Reflect', {
  has: function has(target, propertyKey){
    return propertyKey in target;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.is-extensible.js":[function(require,module,exports){
// 26.1.10 Reflect.isExtensible(target)
var $export       = require('./_export')
  , anObject      = require('./_an-object')
  , $isExtensible = Object.isExtensible;

$export($export.S, 'Reflect', {
  isExtensible: function isExtensible(target){
    anObject(target);
    return $isExtensible ? $isExtensible(target) : true;
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.own-keys.js":[function(require,module,exports){
// 26.1.11 Reflect.ownKeys(target)
var $export = require('./_export');

$export($export.S, 'Reflect', {ownKeys: require('./_own-keys')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_own-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_own-keys.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.prevent-extensions.js":[function(require,module,exports){
// 26.1.12 Reflect.preventExtensions(target)
var $export            = require('./_export')
  , anObject           = require('./_an-object')
  , $preventExtensions = Object.preventExtensions;

$export($export.S, 'Reflect', {
  preventExtensions: function preventExtensions(target){
    anObject(target);
    try {
      if($preventExtensions)$preventExtensions(target);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.set-prototype-of.js":[function(require,module,exports){
// 26.1.14 Reflect.setPrototypeOf(target, proto)
var $export  = require('./_export')
  , setProto = require('./_set-proto');

if(setProto)$export($export.S, 'Reflect', {
  setPrototypeOf: function setPrototypeOf(target, proto){
    setProto.check(target, proto);
    try {
      setProto.set(target, proto);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_set-proto":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-proto.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.set.js":[function(require,module,exports){
// 26.1.13 Reflect.set(target, propertyKey, V [, receiver])
var dP             = require('./_object-dp')
  , gOPD           = require('./_object-gopd')
  , getPrototypeOf = require('./_object-gpo')
  , has            = require('./_has')
  , $export        = require('./_export')
  , createDesc     = require('./_property-desc')
  , anObject       = require('./_an-object')
  , isObject       = require('./_is-object');

function set(target, propertyKey, V/*, receiver*/){
  var receiver = arguments.length < 4 ? target : arguments[3]
    , ownDesc  = gOPD.f(anObject(target), propertyKey)
    , existingDescriptor, proto;
  if(!ownDesc){
    if(isObject(proto = getPrototypeOf(target))){
      return set(proto, propertyKey, V, receiver);
    }
    ownDesc = createDesc(0);
  }
  if(has(ownDesc, 'value')){
    if(ownDesc.writable === false || !isObject(receiver))return false;
    existingDescriptor = gOPD.f(receiver, propertyKey) || createDesc(0);
    existingDescriptor.value = V;
    dP.f(receiver, propertyKey, existingDescriptor);
    return true;
  }
  return ownDesc.set === undefined ? false : (ownDesc.set.call(receiver, V), true);
}

$export($export.S, 'Reflect', {set: set});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.constructor.js":[function(require,module,exports){
var global            = require('./_global')
  , inheritIfRequired = require('./_inherit-if-required')
  , dP                = require('./_object-dp').f
  , gOPN              = require('./_object-gopn').f
  , isRegExp          = require('./_is-regexp')
  , $flags            = require('./_flags')
  , $RegExp           = global.RegExp
  , Base              = $RegExp
  , proto             = $RegExp.prototype
  , re1               = /a/g
  , re2               = /a/g
  // "new" creates a new object, old webkit buggy here
  , CORRECT_NEW       = new $RegExp(re1) !== re1;

if(require('./_descriptors') && (!CORRECT_NEW || require('./_fails')(function(){
  re2[require('./_wks')('match')] = false;
  // RegExp constructor can alter flags and IsRegExp works correct with @@match
  return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1, 'i') != '/a/i';
}))){
  $RegExp = function RegExp(p, f){
    var tiRE = this instanceof $RegExp
      , piRE = isRegExp(p)
      , fiU  = f === undefined;
    return !tiRE && piRE && p.constructor === $RegExp && fiU ? p
      : inheritIfRequired(CORRECT_NEW
        ? new Base(piRE && !fiU ? p.source : p, f)
        : Base((piRE = p instanceof $RegExp) ? p.source : p, piRE && fiU ? $flags.call(p) : f)
      , tiRE ? this : proto, $RegExp);
  };
  var proxy = function(key){
    key in $RegExp || dP($RegExp, key, {
      configurable: true,
      get: function(){ return Base[key]; },
      set: function(it){ Base[key] = it; }
    });
  };
  for(var keys = gOPN(Base), i = 0; keys.length > i; )proxy(keys[i++]);
  proto.constructor = $RegExp;
  $RegExp.prototype = proto;
  require('./_redefine')(global, 'RegExp', $RegExp);
}

require('./_set-species')('RegExp');
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_flags":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_flags.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_inherit-if-required":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_inherit-if-required.js","./_is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-regexp.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.flags.js":[function(require,module,exports){
// 21.2.5.3 get RegExp.prototype.flags()
if(require('./_descriptors') && /./g.flags != 'g')require('./_object-dp').f(RegExp.prototype, 'flags', {
  configurable: true,
  get: require('./_flags')
});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_flags":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_flags.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.match.js":[function(require,module,exports){
// @@match logic
require('./_fix-re-wks')('match', 1, function(defined, MATCH, $match){
  // 21.1.3.11 String.prototype.match(regexp)
  return [function match(regexp){
    'use strict';
    var O  = defined(this)
      , fn = regexp == undefined ? undefined : regexp[MATCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
  }, $match];
});
},{"./_fix-re-wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fix-re-wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.replace.js":[function(require,module,exports){
// @@replace logic
require('./_fix-re-wks')('replace', 2, function(defined, REPLACE, $replace){
  // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
  return [function replace(searchValue, replaceValue){
    'use strict';
    var O  = defined(this)
      , fn = searchValue == undefined ? undefined : searchValue[REPLACE];
    return fn !== undefined
      ? fn.call(searchValue, O, replaceValue)
      : $replace.call(String(O), searchValue, replaceValue);
  }, $replace];
});
},{"./_fix-re-wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fix-re-wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.search.js":[function(require,module,exports){
// @@search logic
require('./_fix-re-wks')('search', 1, function(defined, SEARCH, $search){
  // 21.1.3.15 String.prototype.search(regexp)
  return [function search(regexp){
    'use strict';
    var O  = defined(this)
      , fn = regexp == undefined ? undefined : regexp[SEARCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[SEARCH](String(O));
  }, $search];
});
},{"./_fix-re-wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fix-re-wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.split.js":[function(require,module,exports){
// @@split logic
require('./_fix-re-wks')('split', 2, function(defined, SPLIT, $split){
  'use strict';
  var isRegExp   = require('./_is-regexp')
    , _split     = $split
    , $push      = [].push
    , $SPLIT     = 'split'
    , LENGTH     = 'length'
    , LAST_INDEX = 'lastIndex';
  if(
    'abbc'[$SPLIT](/(b)*/)[1] == 'c' ||
    'test'[$SPLIT](/(?:)/, -1)[LENGTH] != 4 ||
    'ab'[$SPLIT](/(?:ab)*/)[LENGTH] != 2 ||
    '.'[$SPLIT](/(.?)(.?)/)[LENGTH] != 4 ||
    '.'[$SPLIT](/()()/)[LENGTH] > 1 ||
    ''[$SPLIT](/.?/)[LENGTH]
  ){
    var NPCG = /()??/.exec('')[1] === undefined; // nonparticipating capturing group
    // based on es5-shim implementation, need to rework it
    $split = function(separator, limit){
      var string = String(this);
      if(separator === undefined && limit === 0)return [];
      // If `separator` is not a regex, use native split
      if(!isRegExp(separator))return _split.call(string, separator, limit);
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      var splitLimit = limit === undefined ? 4294967295 : limit >>> 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var separator2, match, lastIndex, lastLength, i;
      // Doesn't need flags gy, but they don't hurt
      if(!NPCG)separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
      while(match = separatorCopy.exec(string)){
        // `separatorCopy.lastIndex` is not reliable cross-browser
        lastIndex = match.index + match[0][LENGTH];
        if(lastIndex > lastLastIndex){
          output.push(string.slice(lastLastIndex, match.index));
          // Fix browsers whose `exec` methods don't consistently return `undefined` for NPCG
          if(!NPCG && match[LENGTH] > 1)match[0].replace(separator2, function(){
            for(i = 1; i < arguments[LENGTH] - 2; i++)if(arguments[i] === undefined)match[i] = undefined;
          });
          if(match[LENGTH] > 1 && match.index < string[LENGTH])$push.apply(output, match.slice(1));
          lastLength = match[0][LENGTH];
          lastLastIndex = lastIndex;
          if(output[LENGTH] >= splitLimit)break;
        }
        if(separatorCopy[LAST_INDEX] === match.index)separatorCopy[LAST_INDEX]++; // Avoid an infinite loop
      }
      if(lastLastIndex === string[LENGTH]){
        if(lastLength || !separatorCopy.test(''))output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output[LENGTH] > splitLimit ? output.slice(0, splitLimit) : output;
    };
  // Chakra, V8
  } else if('0'[$SPLIT](undefined, 0)[LENGTH]){
    $split = function(separator, limit){
      return separator === undefined && limit === 0 ? [] : _split.call(this, separator, limit);
    };
  }
  // 21.1.3.17 String.prototype.split(separator, limit)
  return [function split(separator, limit){
    var O  = defined(this)
      , fn = separator == undefined ? undefined : separator[SPLIT];
    return fn !== undefined ? fn.call(separator, O, limit) : $split.call(String(O), separator, limit);
  }, $split];
});
},{"./_fix-re-wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fix-re-wks.js","./_is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-regexp.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.to-string.js":[function(require,module,exports){
'use strict';
require('./es6.regexp.flags');
var anObject    = require('./_an-object')
  , $flags      = require('./_flags')
  , DESCRIPTORS = require('./_descriptors')
  , TO_STRING   = 'toString'
  , $toString   = /./[TO_STRING];

var define = function(fn){
  require('./_redefine')(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if(require('./_fails')(function(){ return $toString.call({source: 'a', flags: 'b'}) != '/a/b'; })){
  define(function toString(){
    var R = anObject(this);
    return '/'.concat(R.source, '/',
      'flags' in R ? R.flags : !DESCRIPTORS && R instanceof RegExp ? $flags.call(R) : undefined);
  });
// FF44- RegExp#toString has a wrong name
} else if($toString.name != TO_STRING){
  define(function toString(){
    return $toString.call(this);
  });
}
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_flags":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_flags.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./es6.regexp.flags":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.flags.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.set.js":[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');

// 23.2 Set Objects
module.exports = require('./_collection')('Set', function(get){
  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value){
    return strong.def(this, value = value === 0 ? 0 : value, value);
  }
}, strong);
},{"./_collection":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection.js","./_collection-strong":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-strong.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.anchor.js":[function(require,module,exports){
'use strict';
// B.2.3.2 String.prototype.anchor(name)
require('./_string-html')('anchor', function(createHTML){
  return function anchor(name){
    return createHTML(this, 'a', 'name', name);
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.big.js":[function(require,module,exports){
'use strict';
// B.2.3.3 String.prototype.big()
require('./_string-html')('big', function(createHTML){
  return function big(){
    return createHTML(this, 'big', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.blink.js":[function(require,module,exports){
'use strict';
// B.2.3.4 String.prototype.blink()
require('./_string-html')('blink', function(createHTML){
  return function blink(){
    return createHTML(this, 'blink', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.bold.js":[function(require,module,exports){
'use strict';
// B.2.3.5 String.prototype.bold()
require('./_string-html')('bold', function(createHTML){
  return function bold(){
    return createHTML(this, 'b', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.code-point-at.js":[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $at     = require('./_string-at')(false);
$export($export.P, 'String', {
  // 21.1.3.3 String.prototype.codePointAt(pos)
  codePointAt: function codePointAt(pos){
    return $at(this, pos);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_string-at":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-at.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.ends-with.js":[function(require,module,exports){
// 21.1.3.6 String.prototype.endsWith(searchString [, endPosition])
'use strict';
var $export   = require('./_export')
  , toLength  = require('./_to-length')
  , context   = require('./_string-context')
  , ENDS_WITH = 'endsWith'
  , $endsWith = ''[ENDS_WITH];

$export($export.P + $export.F * require('./_fails-is-regexp')(ENDS_WITH), 'String', {
  endsWith: function endsWith(searchString /*, endPosition = @length */){
    var that = context(this, searchString, ENDS_WITH)
      , endPosition = arguments.length > 1 ? arguments[1] : undefined
      , len    = toLength(that.length)
      , end    = endPosition === undefined ? len : Math.min(toLength(endPosition), len)
      , search = String(searchString);
    return $endsWith
      ? $endsWith.call(that, search, end)
      : that.slice(end - search.length, end) === search;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails-is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails-is-regexp.js","./_string-context":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-context.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.fixed.js":[function(require,module,exports){
'use strict';
// B.2.3.6 String.prototype.fixed()
require('./_string-html')('fixed', function(createHTML){
  return function fixed(){
    return createHTML(this, 'tt', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.fontcolor.js":[function(require,module,exports){
'use strict';
// B.2.3.7 String.prototype.fontcolor(color)
require('./_string-html')('fontcolor', function(createHTML){
  return function fontcolor(color){
    return createHTML(this, 'font', 'color', color);
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.fontsize.js":[function(require,module,exports){
'use strict';
// B.2.3.8 String.prototype.fontsize(size)
require('./_string-html')('fontsize', function(createHTML){
  return function fontsize(size){
    return createHTML(this, 'font', 'size', size);
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.from-code-point.js":[function(require,module,exports){
var $export        = require('./_export')
  , toIndex        = require('./_to-index')
  , fromCharCode   = String.fromCharCode
  , $fromCodePoint = String.fromCodePoint;

// length should be 1, old FF problem
$export($export.S + $export.F * (!!$fromCodePoint && $fromCodePoint.length != 1), 'String', {
  // 21.1.2.2 String.fromCodePoint(...codePoints)
  fromCodePoint: function fromCodePoint(x){ // eslint-disable-line no-unused-vars
    var res  = []
      , aLen = arguments.length
      , i    = 0
      , code;
    while(aLen > i){
      code = +arguments[i++];
      if(toIndex(code, 0x10ffff) !== code)throw RangeError(code + ' is not a valid code point');
      res.push(code < 0x10000
        ? fromCharCode(code)
        : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00)
      );
    } return res.join('');
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.includes.js":[function(require,module,exports){
// 21.1.3.7 String.prototype.includes(searchString, position = 0)
'use strict';
var $export  = require('./_export')
  , context  = require('./_string-context')
  , INCLUDES = 'includes';

$export($export.P + $export.F * require('./_fails-is-regexp')(INCLUDES), 'String', {
  includes: function includes(searchString /*, position = 0 */){
    return !!~context(this, searchString, INCLUDES)
      .indexOf(searchString, arguments.length > 1 ? arguments[1] : undefined);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails-is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails-is-regexp.js","./_string-context":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-context.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.italics.js":[function(require,module,exports){
'use strict';
// B.2.3.9 String.prototype.italics()
require('./_string-html')('italics', function(createHTML){
  return function italics(){
    return createHTML(this, 'i', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.iterator.js":[function(require,module,exports){
'use strict';
var $at  = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./_iter-define":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-define.js","./_string-at":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-at.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.link.js":[function(require,module,exports){
'use strict';
// B.2.3.10 String.prototype.link(url)
require('./_string-html')('link', function(createHTML){
  return function link(url){
    return createHTML(this, 'a', 'href', url);
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.raw.js":[function(require,module,exports){
var $export   = require('./_export')
  , toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length');

$export($export.S, 'String', {
  // 21.1.2.4 String.raw(callSite, ...substitutions)
  raw: function raw(callSite){
    var tpl  = toIObject(callSite.raw)
      , len  = toLength(tpl.length)
      , aLen = arguments.length
      , res  = []
      , i    = 0;
    while(len > i){
      res.push(String(tpl[i++]));
      if(i < aLen)res.push(String(arguments[i]));
    } return res.join('');
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.repeat.js":[function(require,module,exports){
var $export = require('./_export');

$export($export.P, 'String', {
  // 21.1.3.13 String.prototype.repeat(count)
  repeat: require('./_string-repeat')
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_string-repeat":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-repeat.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.small.js":[function(require,module,exports){
'use strict';
// B.2.3.11 String.prototype.small()
require('./_string-html')('small', function(createHTML){
  return function small(){
    return createHTML(this, 'small', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.starts-with.js":[function(require,module,exports){
// 21.1.3.18 String.prototype.startsWith(searchString [, position ])
'use strict';
var $export     = require('./_export')
  , toLength    = require('./_to-length')
  , context     = require('./_string-context')
  , STARTS_WITH = 'startsWith'
  , $startsWith = ''[STARTS_WITH];

$export($export.P + $export.F * require('./_fails-is-regexp')(STARTS_WITH), 'String', {
  startsWith: function startsWith(searchString /*, position = 0 */){
    var that   = context(this, searchString, STARTS_WITH)
      , index  = toLength(Math.min(arguments.length > 1 ? arguments[1] : undefined, that.length))
      , search = String(searchString);
    return $startsWith
      ? $startsWith.call(that, search, index)
      : that.slice(index, index + search.length) === search;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails-is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails-is-regexp.js","./_string-context":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-context.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.strike.js":[function(require,module,exports){
'use strict';
// B.2.3.12 String.prototype.strike()
require('./_string-html')('strike', function(createHTML){
  return function strike(){
    return createHTML(this, 'strike', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.sub.js":[function(require,module,exports){
'use strict';
// B.2.3.13 String.prototype.sub()
require('./_string-html')('sub', function(createHTML){
  return function sub(){
    return createHTML(this, 'sub', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.sup.js":[function(require,module,exports){
'use strict';
// B.2.3.14 String.prototype.sup()
require('./_string-html')('sup', function(createHTML){
  return function sup(){
    return createHTML(this, 'sup', '', '');
  }
});
},{"./_string-html":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-html.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.trim.js":[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./_string-trim')('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"./_string-trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.symbol.js":[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global         = require('./_global')
  , core           = require('./_core')
  , has            = require('./_has')
  , DESCRIPTORS    = require('./_descriptors')
  , $export        = require('./_export')
  , redefine       = require('./_redefine')
  , META           = require('./_meta').KEY
  , $fails         = require('./_fails')
  , shared         = require('./_shared')
  , setToStringTag = require('./_set-to-string-tag')
  , uid            = require('./_uid')
  , wks            = require('./_wks')
  , keyOf          = require('./_keyof')
  , enumKeys       = require('./_enum-keys')
  , isArray        = require('./_is-array')
  , anObject       = require('./_an-object')
  , toIObject      = require('./_to-iobject')
  , toPrimitive    = require('./_to-primitive')
  , createDesc     = require('./_property-desc')
  , _create        = require('./_object-create')
  , gOPNExt        = require('./_object-gopn-ext')
  , $GOPD          = require('./_object-gopd')
  , $DP            = require('./_object-dp')
  , gOPD           = $GOPD.f
  , dP             = $DP.f
  , gOPN           = gOPNExt.f
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , setter         = false
  , PROTOTYPE      = 'prototype'
  , HIDDEN         = wks('_hidden')
  , TO_PRIMITIVE   = wks('toPrimitive')
  , isEnum         = {}.propertyIsEnumerable
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , ObjectProto    = Object[PROTOTYPE]
  , USE_NATIVE     = typeof $Symbol == 'function'
  , QObject        = global.QObject;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(dP({}, 'a', {
    get: function(){ return dP(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = gOPD(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  dP(it, key, D);
  if(protoDesc && it !== ObjectProto)dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  DESCRIPTORS && setter && setSymbolDesc(ObjectProto, tag, {
    configurable: true,
    set: function(value){
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    }
  });
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function(it){
  return typeof it == 'symbol';
} : function(it){
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D){
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if(has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key = toPrimitive(key, true));
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  var D = gOPD(it = toIObject(it), key = toPrimitive(key, true));
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = gOPN(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)result.push(key);
  return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var names  = gOPN(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
  return result;
};
var $stringify = function stringify(it){
  if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
  var args = [it]
    , i    = 1
    , replacer, $replacer;
  while(arguments.length > i)args.push(arguments[i++]);
  replacer = args[1];
  if(typeof replacer == 'function')$replacer = replacer;
  if($replacer || !isArray(replacer))replacer = function(key, value){
    if($replacer)value = $replacer.call(this, key, value);
    if(!isSymbol(value))return value;
  };
  args[1] = replacer;
  return _stringify.apply($JSON, args);
};
var BUGGY_JSON = $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
});

// 19.4.1.1 Symbol([description])
if(!USE_NATIVE){
  $Symbol = function Symbol(){
    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor!');
    return wrap(uid(arguments.length > 0 ? arguments[0] : undefined));
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString(){
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f   = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f  = $propertyIsEnumerable
  require('./_object-gops').f = $getOwnPropertySymbols;

  if(DESCRIPTORS && !require('./_library')){
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Symbol: $Symbol});

// 19.4.2.2 Symbol.hasInstance
// 19.4.2.3 Symbol.isConcatSpreadable
// 19.4.2.4 Symbol.iterator
// 19.4.2.6 Symbol.match
// 19.4.2.8 Symbol.replace
// 19.4.2.9 Symbol.search
// 19.4.2.10 Symbol.species
// 19.4.2.11 Symbol.split
// 19.4.2.12 Symbol.toPrimitive
// 19.4.2.13 Symbol.toStringTag
// 19.4.2.14 Symbol.unscopables
for(var symbols = (
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), i = 0; symbols.length > i; ){
  var key     = symbols[i++]
    , Wrapper = core.Symbol
    , sym     = wks(key);
  if(!(key in Wrapper))dP(Wrapper, key, {value: USE_NATIVE ? sym : wrap(sym)});
};

// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
if(!QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild)setter = true;

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    if(isSymbol(key))return keyOf(SymbolRegistry, key);
    throw TypeError(key + ' is not a symbol!');
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || BUGGY_JSON), 'JSON', {stringify: $stringify});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_enum-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_enum-keys.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_is-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-array.js","./_keyof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_keyof.js","./_library":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_library.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_object-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-create.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gopn":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn.js","./_object-gopn-ext":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopn-ext.js","./_object-gops":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gops.js","./_object-pie":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-pie.js","./_property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-to-string-tag.js","./_shared":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_shared.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js","./_uid":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.array-buffer.js":[function(require,module,exports){
'use strict';
var $export      = require('./_export')
  , $typed       = require('./_typed')
  , buffer       = require('./_typed-buffer')
  , anObject     = require('./_an-object')
  , toIndex      = require('./_to-index')
  , toLength     = require('./_to-length')
  , isObject     = require('./_is-object')
  , TYPED_ARRAY  = require('./_wks')('typed_array')
  , ArrayBuffer  = require('./_global').ArrayBuffer
  , speciesConstructor = require('./_species-constructor')
  , $ArrayBuffer = buffer.ArrayBuffer
  , $DataView    = buffer.DataView
  , $isView      = $typed.ABV && ArrayBuffer.isView
  , $slice       = $ArrayBuffer.prototype.slice
  , VIEW         = $typed.VIEW
  , ARRAY_BUFFER = 'ArrayBuffer';

$export($export.G + $export.W + $export.F * (ArrayBuffer !== $ArrayBuffer), {ArrayBuffer: $ArrayBuffer});

$export($export.S + $export.F * !$typed.CONSTR, ARRAY_BUFFER, {
  // 24.1.3.1 ArrayBuffer.isView(arg)
  isView: function isView(it){
    return $isView && $isView(it) || isObject(it) && VIEW in it;
  }
});

$export($export.P + $export.U + $export.F * require('./_fails')(function(){
  return !new $ArrayBuffer(2).slice(1, undefined).byteLength;
}), ARRAY_BUFFER, {
  // 24.1.4.3 ArrayBuffer.prototype.slice(start, end)
  slice: function slice(start, end){
    if($slice !== undefined && end === undefined)return $slice.call(anObject(this), start); // FF fix
    var len    = anObject(this).byteLength
      , first  = toIndex(start, len)
      , final  = toIndex(end === undefined ? len : end, len)
      , result = new (speciesConstructor(this, $ArrayBuffer))(toLength(final - first))
      , viewS  = new $DataView(this)
      , viewT  = new $DataView(result)
      , index  = 0;
    while(first < final){
      viewT.setUint8(index++, viewS.getUint8(first++));
    } return result;
  }
});

require('./_set-species')(ARRAY_BUFFER);
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_fails":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_set-species.js","./_species-constructor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_species-constructor.js","./_to-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-index.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js","./_typed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed.js","./_typed-buffer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-buffer.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.data-view.js":[function(require,module,exports){
var $export = require('./_export');
$export($export.G + $export.W + $export.F * !require('./_typed').ABV, {
  DataView: require('./_typed-buffer').DataView
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_typed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed.js","./_typed-buffer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-buffer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.float32-array.js":[function(require,module,exports){
require('./_typed-array')('Float32', 4, function(init){
  return function Float32Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.float64-array.js":[function(require,module,exports){
require('./_typed-array')('Float64', 8, function(init){
  return function Float64Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.int16-array.js":[function(require,module,exports){
require('./_typed-array')('Int16', 2, function(init){
  return function Int16Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.int32-array.js":[function(require,module,exports){
require('./_typed-array')('Int32', 4, function(init){
  return function Int32Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.int8-array.js":[function(require,module,exports){
require('./_typed-array')('Int8', 1, function(init){
  return function Int8Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint16-array.js":[function(require,module,exports){
require('./_typed-array')('Uint16', 2, function(init){
  return function Uint16Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint32-array.js":[function(require,module,exports){
require('./_typed-array')('Uint32', 4, function(init){
  return function Uint32Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint8-array.js":[function(require,module,exports){
require('./_typed-array')('Uint8', 1, function(init){
  return function Uint8Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint8-clamped-array.js":[function(require,module,exports){
require('./_typed-array')('Uint8', 1, function(init){
  return function Uint8ClampedArray(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
}, true);
},{"./_typed-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_typed-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.weak-map.js":[function(require,module,exports){
'use strict';
var each         = require('./_array-methods')(0)
  , redefine     = require('./_redefine')
  , meta         = require('./_meta')
  , assign       = require('./_object-assign')
  , weak         = require('./_collection-weak')
  , isObject     = require('./_is-object')
  , has          = require('./_has')
  , getWeak      = meta.getWeak
  , isExtensible = Object.isExtensible
  , uncaughtFrozenStore = weak.ufstore
  , tmp          = {}
  , InternalMap;

var wrapper = function(get){
  return function WeakMap(){
    return get(this, arguments.length > 0 ? arguments[0] : undefined);
  };
};

var methods = {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key){
    if(isObject(key)){
      var data = getWeak(key);
      if(data === true)return uncaughtFrozenStore(this).get(key);
      return data ? data[this._i] : undefined;
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value){
    return weak.def(this, key, value);
  }
};

// 23.3 WeakMap Objects
var $WeakMap = module.exports = require('./_collection')('WeakMap', wrapper, methods, weak, true, true);

// IE11 WeakMap frozen keys fix
if(new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7){
  InternalMap = weak.getConstructor(wrapper);
  assign(InternalMap.prototype, methods);
  meta.NEED = true;
  each(['delete', 'has', 'get', 'set'], function(key){
    var proto  = $WeakMap.prototype
      , method = proto[key];
    redefine(proto, key, function(a, b){
      // store frozen objects on internal weakmap shim
      if(isObject(a) && !isExtensible(a)){
        if(!this._f)this._f = new InternalMap;
        var result = this._f[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}
},{"./_array-methods":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-methods.js","./_collection":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection.js","./_collection-weak":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-weak.js","./_has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js","./_is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js","./_meta":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_meta.js","./_object-assign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-assign.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.weak-set.js":[function(require,module,exports){
'use strict';
var weak = require('./_collection-weak');

// 23.4 WeakSet Objects
require('./_collection')('WeakSet', function(get){
  return function WeakSet(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.4.3.1 WeakSet.prototype.add(value)
  add: function add(value){
    return weak.def(this, value, true);
  }
}, weak, false, true);
},{"./_collection":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection.js","./_collection-weak":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-weak.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.array.includes.js":[function(require,module,exports){
'use strict';
// https://github.com/tc39/Array.prototype.includes
var $export   = require('./_export')
  , $includes = require('./_array-includes')(true);

$export($export.P, 'Array', {
  includes: function includes(el /*, fromIndex = 0 */){
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

require('./_add-to-unscopables')('includes');
},{"./_add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_add-to-unscopables.js","./_array-includes":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-includes.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.error.is-error.js":[function(require,module,exports){
// https://github.com/ljharb/proposal-is-error
var $export = require('./_export')
  , cof     = require('./_cof');

$export($export.S, 'Error', {
  isError: function isError(it){
    return cof(it) === 'Error';
  }
});
},{"./_cof":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.map.to-json.js":[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./_export');

$export($export.P + $export.R, 'Map', {toJSON: require('./_collection-to-json')('Map')});
},{"./_collection-to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-to-json.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.iaddh.js":[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  iaddh: function iaddh(x0, x1, y0, y1){
    var $x0 = x0 >>> 0
      , $x1 = x1 >>> 0
      , $y0 = y0 >>> 0;
    return $x1 + (y1 >>> 0) + (($x0 & $y0 | ($x0 | $y0) & ~($x0 + $y0 >>> 0)) >>> 31) | 0;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.imulh.js":[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  imulh: function imulh(u, v){
    var UINT16 = 0xffff
      , $u = +u
      , $v = +v
      , u0 = $u & UINT16
      , v0 = $v & UINT16
      , u1 = $u >> 16
      , v1 = $v >> 16
      , t  = (u1 * v0 >>> 0) + (u0 * v0 >>> 16);
    return u1 * v1 + (t >> 16) + ((u0 * v1 >>> 0) + (t & UINT16) >> 16);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.isubh.js":[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  isubh: function isubh(x0, x1, y0, y1){
    var $x0 = x0 >>> 0
      , $x1 = x1 >>> 0
      , $y0 = y0 >>> 0;
    return $x1 - (y1 >>> 0) - ((~$x0 & $y0 | ~($x0 ^ $y0) & $x0 - $y0 >>> 0) >>> 31) | 0;
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.umulh.js":[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  umulh: function umulh(u, v){
    var UINT16 = 0xffff
      , $u = +u
      , $v = +v
      , u0 = $u & UINT16
      , v0 = $v & UINT16
      , u1 = $u >>> 16
      , v1 = $v >>> 16
      , t  = (u1 * v0 >>> 0) + (u0 * v0 >>> 16);
    return u1 * v1 + (t >>> 16) + ((u0 * v1 >>> 0) + (t & UINT16) >>> 16);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.define-getter.js":[function(require,module,exports){
'use strict';
var $export         = require('./_export')
  , toObject        = require('./_to-object')
  , aFunction       = require('./_a-function')
  , $defineProperty = require('./_object-dp');

// B.2.2.2 Object.prototype.__defineGetter__(P, getter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineGetter__: function __defineGetter__(P, getter){
    $defineProperty.f(toObject(this), P, {get: aFunction(getter), enumerable: true, configurable: true});
  }
});
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-forced-pam":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-forced-pam.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.define-setter.js":[function(require,module,exports){
'use strict';
var $export         = require('./_export')
  , toObject        = require('./_to-object')
  , aFunction       = require('./_a-function')
  , $defineProperty = require('./_object-dp');

// B.2.2.3 Object.prototype.__defineSetter__(P, setter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineSetter__: function __defineSetter__(P, setter){
    $defineProperty.f(toObject(this), P, {set: aFunction(setter), enumerable: true, configurable: true});
  }
});
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-dp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-dp.js","./_object-forced-pam":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-forced-pam.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.entries.js":[function(require,module,exports){
// https://github.com/tc39/proposal-object-values-entries
var $export  = require('./_export')
  , $entries = require('./_object-to-array')(true);

$export($export.S, 'Object', {
  entries: function entries(it){
    return $entries(it);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-to-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-to-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.get-own-property-descriptors.js":[function(require,module,exports){
// https://github.com/tc39/proposal-object-getownpropertydescriptors
var $export        = require('./_export')
  , ownKeys        = require('./_own-keys')
  , toIObject      = require('./_to-iobject')
  , gOPD           = require('./_object-gopd')
  , createProperty = require('./_create-property');

$export($export.S, 'Object', {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object){
    var O       = toIObject(object)
      , getDesc = gOPD.f
      , keys    = ownKeys(O)
      , result  = {}
      , i       = 0
      , key, D;
    while(keys.length > i)createProperty(result, key = keys[i++], getDesc(O, key));
    return result;
  }
});
},{"./_create-property":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_create-property.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_own-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_own-keys.js","./_to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.lookup-getter.js":[function(require,module,exports){
'use strict';
var $export                  = require('./_export')
  , toObject                 = require('./_to-object')
  , toPrimitive              = require('./_to-primitive')
  , getPrototypeOf           = require('./_object-gpo')
  , getOwnPropertyDescriptor = require('./_object-gopd').f;

// B.2.2.4 Object.prototype.__lookupGetter__(P)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __lookupGetter__: function __lookupGetter__(P){
    var O = toObject(this)
      , K = toPrimitive(P, true)
      , D;
    do {
      if(D = getOwnPropertyDescriptor(O, K))return D.get;
    } while(O = getPrototypeOf(O));
  }
});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-forced-pam":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-forced-pam.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.lookup-setter.js":[function(require,module,exports){
'use strict';
var $export                  = require('./_export')
  , toObject                 = require('./_to-object')
  , toPrimitive              = require('./_to-primitive')
  , getPrototypeOf           = require('./_object-gpo')
  , getOwnPropertyDescriptor = require('./_object-gopd').f;

// B.2.2.5 Object.prototype.__lookupSetter__(P)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __lookupSetter__: function __lookupSetter__(P){
    var O = toObject(this)
      , K = toPrimitive(P, true)
      , D;
    do {
      if(D = getOwnPropertyDescriptor(O, K))return D.set;
    } while(O = getPrototypeOf(O));
  }
});
},{"./_descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_descriptors.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-forced-pam":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-forced-pam.js","./_object-gopd":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gopd.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./_to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-object.js","./_to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-primitive.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.values.js":[function(require,module,exports){
// https://github.com/tc39/proposal-object-values-entries
var $export = require('./_export')
  , $values = require('./_object-to-array')(false);

$export($export.S, 'Object', {
  values: function values(it){
    return $values(it);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_object-to-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-to-array.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.define-metadata.js":[function(require,module,exports){
var metadata                  = require('./_metadata')
  , anObject                  = require('./_an-object')
  , toMetaKey                 = metadata.key
  , ordinaryDefineOwnMetadata = metadata.set;

metadata.exp({defineMetadata: function defineMetadata(metadataKey, metadataValue, target, targetKey){
  ordinaryDefineOwnMetadata(metadataKey, metadataValue, anObject(target), toMetaKey(targetKey));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.delete-metadata.js":[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , toMetaKey              = metadata.key
  , getOrCreateMetadataMap = metadata.map
  , store                  = metadata.store;

metadata.exp({deleteMetadata: function deleteMetadata(metadataKey, target /*, targetKey */){
  var targetKey   = arguments.length < 3 ? undefined : toMetaKey(arguments[2])
    , metadataMap = getOrCreateMetadataMap(anObject(target), targetKey, false);
  if(metadataMap === undefined || !metadataMap['delete'](metadataKey))return false;
  if(metadataMap.size)return true;
  var targetMetadata = store.get(target);
  targetMetadata['delete'](targetKey);
  return !!targetMetadata.size || store['delete'](target);
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-metadata-keys.js":[function(require,module,exports){
var Set                     = require('./es6.set')
  , from                    = require('./_array-from-iterable')
  , metadata                = require('./_metadata')
  , anObject                = require('./_an-object')
  , getPrototypeOf          = require('./_object-gpo')
  , ordinaryOwnMetadataKeys = metadata.keys
  , toMetaKey               = metadata.key;

var ordinaryMetadataKeys = function(O, P){
  var oKeys  = ordinaryOwnMetadataKeys(O, P)
    , parent = getPrototypeOf(O);
  if(parent === null)return oKeys;
  var pKeys  = ordinaryMetadataKeys(parent, P);
  return pKeys.length ? oKeys.length ? from(new Set(oKeys.concat(pKeys))) : pKeys : oKeys;
};

metadata.exp({getMetadataKeys: function getMetadataKeys(target /*, targetKey */){
  return ordinaryMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_array-from-iterable":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_array-from-iterable.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js","./es6.set":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.set.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-metadata.js":[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , getPrototypeOf         = require('./_object-gpo')
  , ordinaryHasOwnMetadata = metadata.has
  , ordinaryGetOwnMetadata = metadata.get
  , toMetaKey              = metadata.key;

var ordinaryGetMetadata = function(MetadataKey, O, P){
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if(hasOwn)return ordinaryGetOwnMetadata(MetadataKey, O, P);
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryGetMetadata(MetadataKey, parent, P) : undefined;
};

metadata.exp({getMetadata: function getMetadata(metadataKey, target /*, targetKey */){
  return ordinaryGetMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-own-metadata-keys.js":[function(require,module,exports){
var metadata                = require('./_metadata')
  , anObject                = require('./_an-object')
  , ordinaryOwnMetadataKeys = metadata.keys
  , toMetaKey               = metadata.key;

metadata.exp({getOwnMetadataKeys: function getOwnMetadataKeys(target /*, targetKey */){
  return ordinaryOwnMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-own-metadata.js":[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , ordinaryGetOwnMetadata = metadata.get
  , toMetaKey              = metadata.key;

metadata.exp({getOwnMetadata: function getOwnMetadata(metadataKey, target /*, targetKey */){
  return ordinaryGetOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.has-metadata.js":[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , getPrototypeOf         = require('./_object-gpo')
  , ordinaryHasOwnMetadata = metadata.has
  , toMetaKey              = metadata.key;

var ordinaryHasMetadata = function(MetadataKey, O, P){
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if(hasOwn)return true;
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryHasMetadata(MetadataKey, parent, P) : false;
};

metadata.exp({hasMetadata: function hasMetadata(metadataKey, target /*, targetKey */){
  return ordinaryHasMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js","./_object-gpo":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_object-gpo.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.has-own-metadata.js":[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , ordinaryHasOwnMetadata = metadata.has
  , toMetaKey              = metadata.key;

metadata.exp({hasOwnMetadata: function hasOwnMetadata(metadataKey, target /*, targetKey */){
  return ordinaryHasOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.metadata.js":[function(require,module,exports){
var metadata                  = require('./_metadata')
  , anObject                  = require('./_an-object')
  , aFunction                 = require('./_a-function')
  , toMetaKey                 = metadata.key
  , ordinaryDefineOwnMetadata = metadata.set;

metadata.exp({metadata: function metadata(metadataKey, metadataValue){
  return function decorator(target, targetKey){
    ordinaryDefineOwnMetadata(
      metadataKey, metadataValue,
      (targetKey !== undefined ? anObject : aFunction)(target),
      toMetaKey(targetKey)
    );
  };
}});
},{"./_a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js","./_an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_an-object.js","./_metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_metadata.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.set.to-json.js":[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./_export');

$export($export.P + $export.R, 'Set', {toJSON: require('./_collection-to-json')('Set')});
},{"./_collection-to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_collection-to-json.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.at.js":[function(require,module,exports){
'use strict';
// https://github.com/mathiasbynens/String.prototype.at
var $export = require('./_export')
  , $at     = require('./_string-at')(true);

$export($export.P, 'String', {
  at: function at(pos){
    return $at(this, pos);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_string-at":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-at.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.match-all.js":[function(require,module,exports){
'use strict';
// https://tc39.github.io/String.prototype.matchAll/
var $export     = require('./_export')
  , defined     = require('./_defined')
  , toLength    = require('./_to-length')
  , isRegExp    = require('./_is-regexp')
  , getFlags    = require('./_flags')
  , RegExpProto = RegExp.prototype;

var $RegExpStringIterator = function(regexp, string){
  this._r = regexp;
  this._s = string;
};

require('./_iter-create')($RegExpStringIterator, 'RegExp String', function next(){
  var match = this._r.exec(this._s);
  return {value: match, done: match === null};
});

$export($export.P, 'String', {
  matchAll: function matchAll(regexp){
    defined(this);
    if(!isRegExp(regexp))throw TypeError(regexp + ' is not a regexp!');
    var S     = String(this)
      , flags = 'flags' in RegExpProto ? String(regexp.flags) : getFlags.call(regexp)
      , rx    = new RegExp(regexp.source, ~flags.indexOf('g') ? flags : 'g' + flags);
    rx.lastIndex = toLength(regexp.lastIndex);
    return new $RegExpStringIterator(rx, S);
  }
});
},{"./_defined":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js","./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_flags":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_flags.js","./_is-regexp":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-regexp.js","./_iter-create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-create.js","./_to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-length.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.pad-end.js":[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export')
  , $pad    = require('./_string-pad');

$export($export.P, 'String', {
  padEnd: function padEnd(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_string-pad":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-pad.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.pad-start.js":[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export')
  , $pad    = require('./_string-pad');

$export($export.P, 'String', {
  padStart: function padStart(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
  }
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_string-pad":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-pad.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.trim-left.js":[function(require,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
require('./_string-trim')('trimLeft', function($trim){
  return function trimLeft(){
    return $trim(this, 1);
  };
}, 'trimStart');
},{"./_string-trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.trim-right.js":[function(require,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
require('./_string-trim')('trimRight', function($trim){
  return function trimRight(){
    return $trim(this, 2);
  };
}, 'trimEnd');
},{"./_string-trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_string-trim.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.system.global.js":[function(require,module,exports){
// https://github.com/ljharb/proposal-global
var $export = require('./_export');

$export($export.S, 'System', {global: require('./_global')});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/web.dom.iterable.js":[function(require,module,exports){
var $iterators    = require('./es6.array.iterator')
  , redefine      = require('./_redefine')
  , global        = require('./_global')
  , hide          = require('./_hide')
  , Iterators     = require('./_iterators')
  , wks           = require('./_wks')
  , ITERATOR      = wks('iterator')
  , TO_STRING_TAG = wks('toStringTag')
  , ArrayValues   = Iterators.Array;

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global[NAME]
    , proto      = Collection && Collection.prototype
    , key;
  if(proto){
    if(!proto[ITERATOR])hide(proto, ITERATOR, ArrayValues);
    if(!proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    for(key in $iterators)if(!proto[key])redefine(proto, key, $iterators[key], true);
  }
}
},{"./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_hide":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_hide.js","./_iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js","./_redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_redefine.js","./_wks":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_wks.js","./es6.array.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.iterator.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/web.immediate.js":[function(require,module,exports){
var $export = require('./_export')
  , $task   = require('./_task');
$export($export.G + $export.B, {
  setImmediate:   $task.set,
  clearImmediate: $task.clear
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_task":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_task.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/web.timers.js":[function(require,module,exports){
// ie9- setTimeout & setInterval additional parameters fix
var global     = require('./_global')
  , $export    = require('./_export')
  , invoke     = require('./_invoke')
  , partial    = require('./_partial')
  , navigator  = global.navigator
  , MSIE       = !!navigator && /MSIE .\./.test(navigator.userAgent); // <- dirty ie9- check
var wrap = function(set){
  return MSIE ? function(fn, time /*, ...args */){
    return set(invoke(
      partial,
      [].slice.call(arguments, 2),
      typeof fn == 'function' ? fn : Function(fn)
    ), time);
  } : set;
};
$export($export.G + $export.B + $export.F * MSIE, {
  setTimeout:  wrap(global.setTimeout),
  setInterval: wrap(global.setInterval)
});
},{"./_export":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_export.js","./_global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js","./_invoke":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_invoke.js","./_partial":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_partial.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/shim.js":[function(require,module,exports){
require('./modules/es6.symbol');
require('./modules/es6.object.create');
require('./modules/es6.object.define-property');
require('./modules/es6.object.define-properties');
require('./modules/es6.object.get-own-property-descriptor');
require('./modules/es6.object.get-prototype-of');
require('./modules/es6.object.keys');
require('./modules/es6.object.get-own-property-names');
require('./modules/es6.object.freeze');
require('./modules/es6.object.seal');
require('./modules/es6.object.prevent-extensions');
require('./modules/es6.object.is-frozen');
require('./modules/es6.object.is-sealed');
require('./modules/es6.object.is-extensible');
require('./modules/es6.object.assign');
require('./modules/es6.object.is');
require('./modules/es6.object.set-prototype-of');
require('./modules/es6.object.to-string');
require('./modules/es6.function.bind');
require('./modules/es6.function.name');
require('./modules/es6.function.has-instance');
require('./modules/es6.parse-int');
require('./modules/es6.parse-float');
require('./modules/es6.number.constructor');
require('./modules/es6.number.to-fixed');
require('./modules/es6.number.to-precision');
require('./modules/es6.number.epsilon');
require('./modules/es6.number.is-finite');
require('./modules/es6.number.is-integer');
require('./modules/es6.number.is-nan');
require('./modules/es6.number.is-safe-integer');
require('./modules/es6.number.max-safe-integer');
require('./modules/es6.number.min-safe-integer');
require('./modules/es6.number.parse-float');
require('./modules/es6.number.parse-int');
require('./modules/es6.math.acosh');
require('./modules/es6.math.asinh');
require('./modules/es6.math.atanh');
require('./modules/es6.math.cbrt');
require('./modules/es6.math.clz32');
require('./modules/es6.math.cosh');
require('./modules/es6.math.expm1');
require('./modules/es6.math.fround');
require('./modules/es6.math.hypot');
require('./modules/es6.math.imul');
require('./modules/es6.math.log10');
require('./modules/es6.math.log1p');
require('./modules/es6.math.log2');
require('./modules/es6.math.sign');
require('./modules/es6.math.sinh');
require('./modules/es6.math.tanh');
require('./modules/es6.math.trunc');
require('./modules/es6.string.from-code-point');
require('./modules/es6.string.raw');
require('./modules/es6.string.trim');
require('./modules/es6.string.iterator');
require('./modules/es6.string.code-point-at');
require('./modules/es6.string.ends-with');
require('./modules/es6.string.includes');
require('./modules/es6.string.repeat');
require('./modules/es6.string.starts-with');
require('./modules/es6.string.anchor');
require('./modules/es6.string.big');
require('./modules/es6.string.blink');
require('./modules/es6.string.bold');
require('./modules/es6.string.fixed');
require('./modules/es6.string.fontcolor');
require('./modules/es6.string.fontsize');
require('./modules/es6.string.italics');
require('./modules/es6.string.link');
require('./modules/es6.string.small');
require('./modules/es6.string.strike');
require('./modules/es6.string.sub');
require('./modules/es6.string.sup');
require('./modules/es6.date.now');
require('./modules/es6.date.to-json');
require('./modules/es6.date.to-iso-string');
require('./modules/es6.date.to-string');
require('./modules/es6.date.to-primitive');
require('./modules/es6.array.is-array');
require('./modules/es6.array.from');
require('./modules/es6.array.of');
require('./modules/es6.array.join');
require('./modules/es6.array.slice');
require('./modules/es6.array.sort');
require('./modules/es6.array.for-each');
require('./modules/es6.array.map');
require('./modules/es6.array.filter');
require('./modules/es6.array.some');
require('./modules/es6.array.every');
require('./modules/es6.array.reduce');
require('./modules/es6.array.reduce-right');
require('./modules/es6.array.index-of');
require('./modules/es6.array.last-index-of');
require('./modules/es6.array.copy-within');
require('./modules/es6.array.fill');
require('./modules/es6.array.find');
require('./modules/es6.array.find-index');
require('./modules/es6.array.species');
require('./modules/es6.array.iterator');
require('./modules/es6.regexp.constructor');
require('./modules/es6.regexp.to-string');
require('./modules/es6.regexp.flags');
require('./modules/es6.regexp.match');
require('./modules/es6.regexp.replace');
require('./modules/es6.regexp.search');
require('./modules/es6.regexp.split');
require('./modules/es6.promise');
require('./modules/es6.map');
require('./modules/es6.set');
require('./modules/es6.weak-map');
require('./modules/es6.weak-set');
require('./modules/es6.typed.array-buffer');
require('./modules/es6.typed.data-view');
require('./modules/es6.typed.int8-array');
require('./modules/es6.typed.uint8-array');
require('./modules/es6.typed.uint8-clamped-array');
require('./modules/es6.typed.int16-array');
require('./modules/es6.typed.uint16-array');
require('./modules/es6.typed.int32-array');
require('./modules/es6.typed.uint32-array');
require('./modules/es6.typed.float32-array');
require('./modules/es6.typed.float64-array');
require('./modules/es6.reflect.apply');
require('./modules/es6.reflect.construct');
require('./modules/es6.reflect.define-property');
require('./modules/es6.reflect.delete-property');
require('./modules/es6.reflect.enumerate');
require('./modules/es6.reflect.get');
require('./modules/es6.reflect.get-own-property-descriptor');
require('./modules/es6.reflect.get-prototype-of');
require('./modules/es6.reflect.has');
require('./modules/es6.reflect.is-extensible');
require('./modules/es6.reflect.own-keys');
require('./modules/es6.reflect.prevent-extensions');
require('./modules/es6.reflect.set');
require('./modules/es6.reflect.set-prototype-of');
require('./modules/es7.array.includes');
require('./modules/es7.string.at');
require('./modules/es7.string.pad-start');
require('./modules/es7.string.pad-end');
require('./modules/es7.string.trim-left');
require('./modules/es7.string.trim-right');
require('./modules/es7.string.match-all');
require('./modules/es7.object.get-own-property-descriptors');
require('./modules/es7.object.values');
require('./modules/es7.object.entries');
require('./modules/es7.object.define-getter');
require('./modules/es7.object.define-setter');
require('./modules/es7.object.lookup-getter');
require('./modules/es7.object.lookup-setter');
require('./modules/es7.map.to-json');
require('./modules/es7.set.to-json');
require('./modules/es7.system.global');
require('./modules/es7.error.is-error');
require('./modules/es7.math.iaddh');
require('./modules/es7.math.isubh');
require('./modules/es7.math.imulh');
require('./modules/es7.math.umulh');
require('./modules/es7.reflect.define-metadata');
require('./modules/es7.reflect.delete-metadata');
require('./modules/es7.reflect.get-metadata');
require('./modules/es7.reflect.get-metadata-keys');
require('./modules/es7.reflect.get-own-metadata');
require('./modules/es7.reflect.get-own-metadata-keys');
require('./modules/es7.reflect.has-metadata');
require('./modules/es7.reflect.has-own-metadata');
require('./modules/es7.reflect.metadata');
require('./modules/web.timers');
require('./modules/web.immediate');
require('./modules/web.dom.iterable');
module.exports = require('./modules/_core');
},{"./modules/_core":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_core.js","./modules/es6.array.copy-within":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.copy-within.js","./modules/es6.array.every":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.every.js","./modules/es6.array.fill":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.fill.js","./modules/es6.array.filter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.filter.js","./modules/es6.array.find":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.find.js","./modules/es6.array.find-index":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.find-index.js","./modules/es6.array.for-each":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.for-each.js","./modules/es6.array.from":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.from.js","./modules/es6.array.index-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.index-of.js","./modules/es6.array.is-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.is-array.js","./modules/es6.array.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.iterator.js","./modules/es6.array.join":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.join.js","./modules/es6.array.last-index-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.last-index-of.js","./modules/es6.array.map":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.map.js","./modules/es6.array.of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.of.js","./modules/es6.array.reduce":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.reduce.js","./modules/es6.array.reduce-right":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.reduce-right.js","./modules/es6.array.slice":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.slice.js","./modules/es6.array.some":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.some.js","./modules/es6.array.sort":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.sort.js","./modules/es6.array.species":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.array.species.js","./modules/es6.date.now":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.now.js","./modules/es6.date.to-iso-string":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-iso-string.js","./modules/es6.date.to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-json.js","./modules/es6.date.to-primitive":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-primitive.js","./modules/es6.date.to-string":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.date.to-string.js","./modules/es6.function.bind":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.function.bind.js","./modules/es6.function.has-instance":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.function.has-instance.js","./modules/es6.function.name":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.function.name.js","./modules/es6.map":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.map.js","./modules/es6.math.acosh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.acosh.js","./modules/es6.math.asinh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.asinh.js","./modules/es6.math.atanh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.atanh.js","./modules/es6.math.cbrt":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.cbrt.js","./modules/es6.math.clz32":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.clz32.js","./modules/es6.math.cosh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.cosh.js","./modules/es6.math.expm1":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.expm1.js","./modules/es6.math.fround":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.fround.js","./modules/es6.math.hypot":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.hypot.js","./modules/es6.math.imul":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.imul.js","./modules/es6.math.log10":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.log10.js","./modules/es6.math.log1p":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.log1p.js","./modules/es6.math.log2":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.log2.js","./modules/es6.math.sign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.sign.js","./modules/es6.math.sinh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.sinh.js","./modules/es6.math.tanh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.tanh.js","./modules/es6.math.trunc":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.math.trunc.js","./modules/es6.number.constructor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.constructor.js","./modules/es6.number.epsilon":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.epsilon.js","./modules/es6.number.is-finite":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-finite.js","./modules/es6.number.is-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-integer.js","./modules/es6.number.is-nan":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-nan.js","./modules/es6.number.is-safe-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.is-safe-integer.js","./modules/es6.number.max-safe-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.max-safe-integer.js","./modules/es6.number.min-safe-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.min-safe-integer.js","./modules/es6.number.parse-float":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.parse-float.js","./modules/es6.number.parse-int":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.parse-int.js","./modules/es6.number.to-fixed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.to-fixed.js","./modules/es6.number.to-precision":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.number.to-precision.js","./modules/es6.object.assign":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.assign.js","./modules/es6.object.create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.create.js","./modules/es6.object.define-properties":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.define-properties.js","./modules/es6.object.define-property":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.define-property.js","./modules/es6.object.freeze":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.freeze.js","./modules/es6.object.get-own-property-descriptor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.get-own-property-descriptor.js","./modules/es6.object.get-own-property-names":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.get-own-property-names.js","./modules/es6.object.get-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.get-prototype-of.js","./modules/es6.object.is":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is.js","./modules/es6.object.is-extensible":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is-extensible.js","./modules/es6.object.is-frozen":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is-frozen.js","./modules/es6.object.is-sealed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.is-sealed.js","./modules/es6.object.keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.keys.js","./modules/es6.object.prevent-extensions":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.prevent-extensions.js","./modules/es6.object.seal":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.seal.js","./modules/es6.object.set-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.set-prototype-of.js","./modules/es6.object.to-string":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.object.to-string.js","./modules/es6.parse-float":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.parse-float.js","./modules/es6.parse-int":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.parse-int.js","./modules/es6.promise":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.promise.js","./modules/es6.reflect.apply":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.apply.js","./modules/es6.reflect.construct":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.construct.js","./modules/es6.reflect.define-property":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.define-property.js","./modules/es6.reflect.delete-property":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.delete-property.js","./modules/es6.reflect.enumerate":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.enumerate.js","./modules/es6.reflect.get":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.get.js","./modules/es6.reflect.get-own-property-descriptor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.get-own-property-descriptor.js","./modules/es6.reflect.get-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.get-prototype-of.js","./modules/es6.reflect.has":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.has.js","./modules/es6.reflect.is-extensible":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.is-extensible.js","./modules/es6.reflect.own-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.own-keys.js","./modules/es6.reflect.prevent-extensions":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.prevent-extensions.js","./modules/es6.reflect.set":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.set.js","./modules/es6.reflect.set-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.reflect.set-prototype-of.js","./modules/es6.regexp.constructor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.constructor.js","./modules/es6.regexp.flags":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.flags.js","./modules/es6.regexp.match":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.match.js","./modules/es6.regexp.replace":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.replace.js","./modules/es6.regexp.search":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.search.js","./modules/es6.regexp.split":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.split.js","./modules/es6.regexp.to-string":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.regexp.to-string.js","./modules/es6.set":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.set.js","./modules/es6.string.anchor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.anchor.js","./modules/es6.string.big":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.big.js","./modules/es6.string.blink":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.blink.js","./modules/es6.string.bold":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.bold.js","./modules/es6.string.code-point-at":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.code-point-at.js","./modules/es6.string.ends-with":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.ends-with.js","./modules/es6.string.fixed":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.fixed.js","./modules/es6.string.fontcolor":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.fontcolor.js","./modules/es6.string.fontsize":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.fontsize.js","./modules/es6.string.from-code-point":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.from-code-point.js","./modules/es6.string.includes":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.includes.js","./modules/es6.string.italics":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.italics.js","./modules/es6.string.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.iterator.js","./modules/es6.string.link":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.link.js","./modules/es6.string.raw":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.raw.js","./modules/es6.string.repeat":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.repeat.js","./modules/es6.string.small":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.small.js","./modules/es6.string.starts-with":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.starts-with.js","./modules/es6.string.strike":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.strike.js","./modules/es6.string.sub":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.sub.js","./modules/es6.string.sup":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.sup.js","./modules/es6.string.trim":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.string.trim.js","./modules/es6.symbol":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.symbol.js","./modules/es6.typed.array-buffer":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.array-buffer.js","./modules/es6.typed.data-view":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.data-view.js","./modules/es6.typed.float32-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.float32-array.js","./modules/es6.typed.float64-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.float64-array.js","./modules/es6.typed.int16-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.int16-array.js","./modules/es6.typed.int32-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.int32-array.js","./modules/es6.typed.int8-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.int8-array.js","./modules/es6.typed.uint16-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint16-array.js","./modules/es6.typed.uint32-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint32-array.js","./modules/es6.typed.uint8-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint8-array.js","./modules/es6.typed.uint8-clamped-array":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.typed.uint8-clamped-array.js","./modules/es6.weak-map":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.weak-map.js","./modules/es6.weak-set":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es6.weak-set.js","./modules/es7.array.includes":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.array.includes.js","./modules/es7.error.is-error":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.error.is-error.js","./modules/es7.map.to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.map.to-json.js","./modules/es7.math.iaddh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.iaddh.js","./modules/es7.math.imulh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.imulh.js","./modules/es7.math.isubh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.isubh.js","./modules/es7.math.umulh":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.math.umulh.js","./modules/es7.object.define-getter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.define-getter.js","./modules/es7.object.define-setter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.define-setter.js","./modules/es7.object.entries":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.entries.js","./modules/es7.object.get-own-property-descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.get-own-property-descriptors.js","./modules/es7.object.lookup-getter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.lookup-getter.js","./modules/es7.object.lookup-setter":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.lookup-setter.js","./modules/es7.object.values":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.object.values.js","./modules/es7.reflect.define-metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.define-metadata.js","./modules/es7.reflect.delete-metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.delete-metadata.js","./modules/es7.reflect.get-metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-metadata.js","./modules/es7.reflect.get-metadata-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-metadata-keys.js","./modules/es7.reflect.get-own-metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-own-metadata.js","./modules/es7.reflect.get-own-metadata-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.get-own-metadata-keys.js","./modules/es7.reflect.has-metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.has-metadata.js","./modules/es7.reflect.has-own-metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.has-own-metadata.js","./modules/es7.reflect.metadata":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.reflect.metadata.js","./modules/es7.set.to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.set.to-json.js","./modules/es7.string.at":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.at.js","./modules/es7.string.match-all":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.match-all.js","./modules/es7.string.pad-end":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.pad-end.js","./modules/es7.string.pad-start":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.pad-start.js","./modules/es7.string.trim-left":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.trim-left.js","./modules/es7.string.trim-right":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.string.trim-right.js","./modules/es7.system.global":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/es7.system.global.js","./modules/web.dom.iterable":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/web.dom.iterable.js","./modules/web.immediate":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/web.immediate.js","./modules/web.timers":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/web.timers.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-regenerator-runtime/runtime.js":[function(require,module,exports){
(function (process,global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol =
    typeof Symbol === "function" && Symbol.iterator || "@@iterator";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    // This invoke function is written in a style that assumes some
    // calling function (or Promise) will handle exceptions.
    function invoke(method, arg) {
      var result = generator[method](arg);
      var value = result.value;
      return value instanceof AwaitArgument
        ? Promise.resolve(value.arg).then(invokeNext, invokeThrow)
        : Promise.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration. If the Promise is rejected, however, the
            // result for this iteration will be rejected with the same
            // reason. Note that rejections of yielded Promises are not
            // thrown back into the generator function, as is the case
            // when an awaited Promise is rejected. This difference in
            // behavior between yield and await is important, because it
            // allows the consumer to decide what to do with the yielded
            // rejection (swallow it and continue, manually .throw it back
            // into the generator, abandon iteration, whatever). With
            // await, by contrast, there is no opportunity to examine the
            // rejection reason outside the generator function, so the
            // only option is to throw it from the await expression, and
            // let the generator function handle the exception.
            result.value = unwrapped;
            return result;
          });
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var invokeNext = invoke.bind(generator, "next");
    var invokeThrow = invoke.bind(generator, "throw");
    var invokeReturn = invoke.bind(generator, "return");
    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return invoke(method, arg);
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : new Promise(function (resolve) {
          resolve(callInvokeWithMethodAndArg());
        });
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          context._sent = arg;

          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }
        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9iYWJlbC1yZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBodHRwczovL3Jhdy5naXRodWIuY29tL2ZhY2Vib29rL3JlZ2VuZXJhdG9yL21hc3Rlci9MSUNFTlNFIGZpbGUuIEFuXG4gKiBhZGRpdGlvbmFsIGdyYW50IG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW5cbiAqIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG4hKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyIHVuZGVmaW5lZDsgLy8gTW9yZSBjb21wcmVzc2libGUgdGhhbiB2b2lkIDAuXG4gIHZhciBpdGVyYXRvclN5bWJvbCA9XG4gICAgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciB8fCBcIkBAaXRlcmF0b3JcIjtcblxuICB2YXIgaW5Nb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiO1xuICB2YXIgcnVudGltZSA9IGdsb2JhbC5yZWdlbmVyYXRvclJ1bnRpbWU7XG4gIGlmIChydW50aW1lKSB7XG4gICAgaWYgKGluTW9kdWxlKSB7XG4gICAgICAvLyBJZiByZWdlbmVyYXRvclJ1bnRpbWUgaXMgZGVmaW5lZCBnbG9iYWxseSBhbmQgd2UncmUgaW4gYSBtb2R1bGUsXG4gICAgICAvLyBtYWtlIHRoZSBleHBvcnRzIG9iamVjdCBpZGVudGljYWwgdG8gcmVnZW5lcmF0b3JSdW50aW1lLlxuICAgICAgbW9kdWxlLmV4cG9ydHMgPSBydW50aW1lO1xuICAgIH1cbiAgICAvLyBEb24ndCBib3RoZXIgZXZhbHVhdGluZyB0aGUgcmVzdCBvZiB0aGlzIGZpbGUgaWYgdGhlIHJ1bnRpbWUgd2FzXG4gICAgLy8gYWxyZWFkeSBkZWZpbmVkIGdsb2JhbGx5LlxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIERlZmluZSB0aGUgcnVudGltZSBnbG9iYWxseSAoYXMgZXhwZWN0ZWQgYnkgZ2VuZXJhdGVkIGNvZGUpIGFzIGVpdGhlclxuICAvLyBtb2R1bGUuZXhwb3J0cyAoaWYgd2UncmUgaW4gYSBtb2R1bGUpIG9yIGEgbmV3LCBlbXB0eSBvYmplY3QuXG4gIHJ1bnRpbWUgPSBnbG9iYWwucmVnZW5lcmF0b3JSdW50aW1lID0gaW5Nb2R1bGUgPyBtb2R1bGUuZXhwb3J0cyA6IHt9O1xuXG4gIGZ1bmN0aW9uIHdyYXAoaW5uZXJGbiwgb3V0ZXJGbiwgc2VsZiwgdHJ5TG9jc0xpc3QpIHtcbiAgICAvLyBJZiBvdXRlckZuIHByb3ZpZGVkLCB0aGVuIG91dGVyRm4ucHJvdG90eXBlIGluc3RhbmNlb2YgR2VuZXJhdG9yLlxuICAgIHZhciBnZW5lcmF0b3IgPSBPYmplY3QuY3JlYXRlKChvdXRlckZuIHx8IEdlbmVyYXRvcikucHJvdG90eXBlKTtcbiAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHRyeUxvY3NMaXN0IHx8IFtdKTtcblxuICAgIC8vIFRoZSAuX2ludm9rZSBtZXRob2QgdW5pZmllcyB0aGUgaW1wbGVtZW50YXRpb25zIG9mIHRoZSAubmV4dCxcbiAgICAvLyAudGhyb3csIGFuZCAucmV0dXJuIG1ldGhvZHMuXG4gICAgZ2VuZXJhdG9yLl9pbnZva2UgPSBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpO1xuXG4gICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgfVxuICBydW50aW1lLndyYXAgPSB3cmFwO1xuXG4gIC8vIFRyeS9jYXRjaCBoZWxwZXIgdG8gbWluaW1pemUgZGVvcHRpbWl6YXRpb25zLiBSZXR1cm5zIGEgY29tcGxldGlvblxuICAvLyByZWNvcmQgbGlrZSBjb250ZXh0LnRyeUVudHJpZXNbaV0uY29tcGxldGlvbi4gVGhpcyBpbnRlcmZhY2UgY291bGRcbiAgLy8gaGF2ZSBiZWVuIChhbmQgd2FzIHByZXZpb3VzbHkpIGRlc2lnbmVkIHRvIHRha2UgYSBjbG9zdXJlIHRvIGJlXG4gIC8vIGludm9rZWQgd2l0aG91dCBhcmd1bWVudHMsIGJ1dCBpbiBhbGwgdGhlIGNhc2VzIHdlIGNhcmUgYWJvdXQgd2VcbiAgLy8gYWxyZWFkeSBoYXZlIGFuIGV4aXN0aW5nIG1ldGhvZCB3ZSB3YW50IHRvIGNhbGwsIHNvIHRoZXJlJ3Mgbm8gbmVlZFxuICAvLyB0byBjcmVhdGUgYSBuZXcgZnVuY3Rpb24gb2JqZWN0LiBXZSBjYW4gZXZlbiBnZXQgYXdheSB3aXRoIGFzc3VtaW5nXG4gIC8vIHRoZSBtZXRob2QgdGFrZXMgZXhhY3RseSBvbmUgYXJndW1lbnQsIHNpbmNlIHRoYXQgaGFwcGVucyB0byBiZSB0cnVlXG4gIC8vIGluIGV2ZXJ5IGNhc2UsIHNvIHdlIGRvbid0IGhhdmUgdG8gdG91Y2ggdGhlIGFyZ3VtZW50cyBvYmplY3QuIFRoZVxuICAvLyBvbmx5IGFkZGl0aW9uYWwgYWxsb2NhdGlvbiByZXF1aXJlZCBpcyB0aGUgY29tcGxldGlvbiByZWNvcmQsIHdoaWNoXG4gIC8vIGhhcyBhIHN0YWJsZSBzaGFwZSBhbmQgc28gaG9wZWZ1bGx5IHNob3VsZCBiZSBjaGVhcCB0byBhbGxvY2F0ZS5cbiAgZnVuY3Rpb24gdHJ5Q2F0Y2goZm4sIG9iaiwgYXJnKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwibm9ybWFsXCIsIGFyZzogZm4uY2FsbChvYmosIGFyZykgfTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwidGhyb3dcIiwgYXJnOiBlcnIgfTtcbiAgICB9XG4gIH1cblxuICB2YXIgR2VuU3RhdGVTdXNwZW5kZWRTdGFydCA9IFwic3VzcGVuZGVkU3RhcnRcIjtcbiAgdmFyIEdlblN0YXRlU3VzcGVuZGVkWWllbGQgPSBcInN1c3BlbmRlZFlpZWxkXCI7XG4gIHZhciBHZW5TdGF0ZUV4ZWN1dGluZyA9IFwiZXhlY3V0aW5nXCI7XG4gIHZhciBHZW5TdGF0ZUNvbXBsZXRlZCA9IFwiY29tcGxldGVkXCI7XG5cbiAgLy8gUmV0dXJuaW5nIHRoaXMgb2JqZWN0IGZyb20gdGhlIGlubmVyRm4gaGFzIHRoZSBzYW1lIGVmZmVjdCBhc1xuICAvLyBicmVha2luZyBvdXQgb2YgdGhlIGRpc3BhdGNoIHN3aXRjaCBzdGF0ZW1lbnQuXG4gIHZhciBDb250aW51ZVNlbnRpbmVsID0ge307XG5cbiAgLy8gRHVtbXkgY29uc3RydWN0b3IgZnVuY3Rpb25zIHRoYXQgd2UgdXNlIGFzIHRoZSAuY29uc3RydWN0b3IgYW5kXG4gIC8vIC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgcHJvcGVydGllcyBmb3IgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIEdlbmVyYXRvclxuICAvLyBvYmplY3RzLiBGb3IgZnVsbCBzcGVjIGNvbXBsaWFuY2UsIHlvdSBtYXkgd2lzaCB0byBjb25maWd1cmUgeW91clxuICAvLyBtaW5pZmllciBub3QgdG8gbWFuZ2xlIHRoZSBuYW1lcyBvZiB0aGVzZSB0d28gZnVuY3Rpb25zLlxuICBmdW5jdGlvbiBHZW5lcmF0b3IoKSB7fVxuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvbigpIHt9XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKCkge31cblxuICB2YXIgR3AgPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUgPSBHZW5lcmF0b3IucHJvdG90eXBlO1xuICBHZW5lcmF0b3JGdW5jdGlvbi5wcm90b3R5cGUgPSBHcC5jb25zdHJ1Y3RvciA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEdlbmVyYXRvckZ1bmN0aW9uO1xuICBHZW5lcmF0b3JGdW5jdGlvbi5kaXNwbGF5TmFtZSA9IFwiR2VuZXJhdG9yRnVuY3Rpb25cIjtcblxuICAvLyBIZWxwZXIgZm9yIGRlZmluaW5nIHRoZSAubmV4dCwgLnRocm93LCBhbmQgLnJldHVybiBtZXRob2RzIG9mIHRoZVxuICAvLyBJdGVyYXRvciBpbnRlcmZhY2UgaW4gdGVybXMgb2YgYSBzaW5nbGUgLl9pbnZva2UgbWV0aG9kLlxuICBmdW5jdGlvbiBkZWZpbmVJdGVyYXRvck1ldGhvZHMocHJvdG90eXBlKSB7XG4gICAgW1wibmV4dFwiLCBcInRocm93XCIsIFwicmV0dXJuXCJdLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICBwcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKGFyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5faW52b2tlKG1ldGhvZCwgYXJnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBydW50aW1lLmlzR2VuZXJhdG9yRnVuY3Rpb24gPSBmdW5jdGlvbihnZW5GdW4pIHtcbiAgICB2YXIgY3RvciA9IHR5cGVvZiBnZW5GdW4gPT09IFwiZnVuY3Rpb25cIiAmJiBnZW5GdW4uY29uc3RydWN0b3I7XG4gICAgcmV0dXJuIGN0b3JcbiAgICAgID8gY3RvciA9PT0gR2VuZXJhdG9yRnVuY3Rpb24gfHxcbiAgICAgICAgLy8gRm9yIHRoZSBuYXRpdmUgR2VuZXJhdG9yRnVuY3Rpb24gY29uc3RydWN0b3IsIHRoZSBiZXN0IHdlIGNhblxuICAgICAgICAvLyBkbyBpcyB0byBjaGVjayBpdHMgLm5hbWUgcHJvcGVydHkuXG4gICAgICAgIChjdG9yLmRpc3BsYXlOYW1lIHx8IGN0b3IubmFtZSkgPT09IFwiR2VuZXJhdG9yRnVuY3Rpb25cIlxuICAgICAgOiBmYWxzZTtcbiAgfTtcblxuICBydW50aW1lLm1hcmsgPSBmdW5jdGlvbihnZW5GdW4pIHtcbiAgICBpZiAoT2JqZWN0LnNldFByb3RvdHlwZU9mKSB7XG4gICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoZ2VuRnVuLCBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdlbkZ1bi5fX3Byb3RvX18gPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZTtcbiAgICB9XG4gICAgZ2VuRnVuLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR3ApO1xuICAgIHJldHVybiBnZW5GdW47XG4gIH07XG5cbiAgLy8gV2l0aGluIHRoZSBib2R5IG9mIGFueSBhc3luYyBmdW5jdGlvbiwgYGF3YWl0IHhgIGlzIHRyYW5zZm9ybWVkIHRvXG4gIC8vIGB5aWVsZCByZWdlbmVyYXRvclJ1bnRpbWUuYXdyYXAoeClgLCBzbyB0aGF0IHRoZSBydW50aW1lIGNhbiB0ZXN0XG4gIC8vIGB2YWx1ZSBpbnN0YW5jZW9mIEF3YWl0QXJndW1lbnRgIHRvIGRldGVybWluZSBpZiB0aGUgeWllbGRlZCB2YWx1ZSBpc1xuICAvLyBtZWFudCB0byBiZSBhd2FpdGVkLiBTb21lIG1heSBjb25zaWRlciB0aGUgbmFtZSBvZiB0aGlzIG1ldGhvZCB0b29cbiAgLy8gY3V0ZXN5LCBidXQgdGhleSBhcmUgY3VybXVkZ2VvbnMuXG4gIHJ1bnRpbWUuYXdyYXAgPSBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gbmV3IEF3YWl0QXJndW1lbnQoYXJnKTtcbiAgfTtcblxuICBmdW5jdGlvbiBBd2FpdEFyZ3VtZW50KGFyZykge1xuICAgIHRoaXMuYXJnID0gYXJnO1xuICB9XG5cbiAgZnVuY3Rpb24gQXN5bmNJdGVyYXRvcihnZW5lcmF0b3IpIHtcbiAgICAvLyBUaGlzIGludm9rZSBmdW5jdGlvbiBpcyB3cml0dGVuIGluIGEgc3R5bGUgdGhhdCBhc3N1bWVzIHNvbWVcbiAgICAvLyBjYWxsaW5nIGZ1bmN0aW9uIChvciBQcm9taXNlKSB3aWxsIGhhbmRsZSBleGNlcHRpb25zLlxuICAgIGZ1bmN0aW9uIGludm9rZShtZXRob2QsIGFyZykge1xuICAgICAgdmFyIHJlc3VsdCA9IGdlbmVyYXRvclttZXRob2RdKGFyZyk7XG4gICAgICB2YXIgdmFsdWUgPSByZXN1bHQudmFsdWU7XG4gICAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBBd2FpdEFyZ3VtZW50XG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHZhbHVlLmFyZykudGhlbihpbnZva2VOZXh0LCBpbnZva2VUaHJvdylcbiAgICAgICAgOiBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4oZnVuY3Rpb24odW53cmFwcGVkKSB7XG4gICAgICAgICAgICAvLyBXaGVuIGEgeWllbGRlZCBQcm9taXNlIGlzIHJlc29sdmVkLCBpdHMgZmluYWwgdmFsdWUgYmVjb21lc1xuICAgICAgICAgICAgLy8gdGhlIC52YWx1ZSBvZiB0aGUgUHJvbWlzZTx7dmFsdWUsZG9uZX0+IHJlc3VsdCBmb3IgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGl0ZXJhdGlvbi4gSWYgdGhlIFByb21pc2UgaXMgcmVqZWN0ZWQsIGhvd2V2ZXIsIHRoZVxuICAgICAgICAgICAgLy8gcmVzdWx0IGZvciB0aGlzIGl0ZXJhdGlvbiB3aWxsIGJlIHJlamVjdGVkIHdpdGggdGhlIHNhbWVcbiAgICAgICAgICAgIC8vIHJlYXNvbi4gTm90ZSB0aGF0IHJlamVjdGlvbnMgb2YgeWllbGRlZCBQcm9taXNlcyBhcmUgbm90XG4gICAgICAgICAgICAvLyB0aHJvd24gYmFjayBpbnRvIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24sIGFzIGlzIHRoZSBjYXNlXG4gICAgICAgICAgICAvLyB3aGVuIGFuIGF3YWl0ZWQgUHJvbWlzZSBpcyByZWplY3RlZC4gVGhpcyBkaWZmZXJlbmNlIGluXG4gICAgICAgICAgICAvLyBiZWhhdmlvciBiZXR3ZWVuIHlpZWxkIGFuZCBhd2FpdCBpcyBpbXBvcnRhbnQsIGJlY2F1c2UgaXRcbiAgICAgICAgICAgIC8vIGFsbG93cyB0aGUgY29uc3VtZXIgdG8gZGVjaWRlIHdoYXQgdG8gZG8gd2l0aCB0aGUgeWllbGRlZFxuICAgICAgICAgICAgLy8gcmVqZWN0aW9uIChzd2FsbG93IGl0IGFuZCBjb250aW51ZSwgbWFudWFsbHkgLnRocm93IGl0IGJhY2tcbiAgICAgICAgICAgIC8vIGludG8gdGhlIGdlbmVyYXRvciwgYWJhbmRvbiBpdGVyYXRpb24sIHdoYXRldmVyKS4gV2l0aFxuICAgICAgICAgICAgLy8gYXdhaXQsIGJ5IGNvbnRyYXN0LCB0aGVyZSBpcyBubyBvcHBvcnR1bml0eSB0byBleGFtaW5lIHRoZVxuICAgICAgICAgICAgLy8gcmVqZWN0aW9uIHJlYXNvbiBvdXRzaWRlIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24sIHNvIHRoZVxuICAgICAgICAgICAgLy8gb25seSBvcHRpb24gaXMgdG8gdGhyb3cgaXQgZnJvbSB0aGUgYXdhaXQgZXhwcmVzc2lvbiwgYW5kXG4gICAgICAgICAgICAvLyBsZXQgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBoYW5kbGUgdGhlIGV4Y2VwdGlvbi5cbiAgICAgICAgICAgIHJlc3VsdC52YWx1ZSA9IHVud3JhcHBlZDtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICBpbnZva2UgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKGludm9rZSk7XG4gICAgfVxuXG4gICAgdmFyIGludm9rZU5leHQgPSBpbnZva2UuYmluZChnZW5lcmF0b3IsIFwibmV4dFwiKTtcbiAgICB2YXIgaW52b2tlVGhyb3cgPSBpbnZva2UuYmluZChnZW5lcmF0b3IsIFwidGhyb3dcIik7XG4gICAgdmFyIGludm9rZVJldHVybiA9IGludm9rZS5iaW5kKGdlbmVyYXRvciwgXCJyZXR1cm5cIik7XG4gICAgdmFyIHByZXZpb3VzUHJvbWlzZTtcblxuICAgIGZ1bmN0aW9uIGVucXVldWUobWV0aG9kLCBhcmcpIHtcbiAgICAgIGZ1bmN0aW9uIGNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnKCkge1xuICAgICAgICByZXR1cm4gaW52b2tlKG1ldGhvZCwgYXJnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZXZpb3VzUHJvbWlzZSA9XG4gICAgICAgIC8vIElmIGVucXVldWUgaGFzIGJlZW4gY2FsbGVkIGJlZm9yZSwgdGhlbiB3ZSB3YW50IHRvIHdhaXQgdW50aWxcbiAgICAgICAgLy8gYWxsIHByZXZpb3VzIFByb21pc2VzIGhhdmUgYmVlbiByZXNvbHZlZCBiZWZvcmUgY2FsbGluZyBpbnZva2UsXG4gICAgICAgIC8vIHNvIHRoYXQgcmVzdWx0cyBhcmUgYWx3YXlzIGRlbGl2ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlci4gSWZcbiAgICAgICAgLy8gZW5xdWV1ZSBoYXMgbm90IGJlZW4gY2FsbGVkIGJlZm9yZSwgdGhlbiBpdCBpcyBpbXBvcnRhbnQgdG9cbiAgICAgICAgLy8gY2FsbCBpbnZva2UgaW1tZWRpYXRlbHksIHdpdGhvdXQgd2FpdGluZyBvbiBhIGNhbGxiYWNrIHRvIGZpcmUsXG4gICAgICAgIC8vIHNvIHRoYXQgdGhlIGFzeW5jIGdlbmVyYXRvciBmdW5jdGlvbiBoYXMgdGhlIG9wcG9ydHVuaXR5IHRvIGRvXG4gICAgICAgIC8vIGFueSBuZWNlc3Nhcnkgc2V0dXAgaW4gYSBwcmVkaWN0YWJsZSB3YXkuIFRoaXMgcHJlZGljdGFiaWxpdHlcbiAgICAgICAgLy8gaXMgd2h5IHRoZSBQcm9taXNlIGNvbnN0cnVjdG9yIHN5bmNocm9ub3VzbHkgaW52b2tlcyBpdHNcbiAgICAgICAgLy8gZXhlY3V0b3IgY2FsbGJhY2ssIGFuZCB3aHkgYXN5bmMgZnVuY3Rpb25zIHN5bmNocm9ub3VzbHlcbiAgICAgICAgLy8gZXhlY3V0ZSBjb2RlIGJlZm9yZSB0aGUgZmlyc3QgYXdhaXQuIFNpbmNlIHdlIGltcGxlbWVudCBzaW1wbGVcbiAgICAgICAgLy8gYXN5bmMgZnVuY3Rpb25zIGluIHRlcm1zIG9mIGFzeW5jIGdlbmVyYXRvcnMsIGl0IGlzIGVzcGVjaWFsbHlcbiAgICAgICAgLy8gaW1wb3J0YW50IHRvIGdldCB0aGlzIHJpZ2h0LCBldmVuIHRob3VnaCBpdCByZXF1aXJlcyBjYXJlLlxuICAgICAgICBwcmV2aW91c1Byb21pc2UgPyBwcmV2aW91c1Byb21pc2UudGhlbihcbiAgICAgICAgICBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZyxcbiAgICAgICAgICAvLyBBdm9pZCBwcm9wYWdhdGluZyBmYWlsdXJlcyB0byBQcm9taXNlcyByZXR1cm5lZCBieSBsYXRlclxuICAgICAgICAgIC8vIGludm9jYXRpb25zIG9mIHRoZSBpdGVyYXRvci5cbiAgICAgICAgICBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZ1xuICAgICAgICApIDogbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgICByZXNvbHZlKGNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnKCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBEZWZpbmUgdGhlIHVuaWZpZWQgaGVscGVyIG1ldGhvZCB0aGF0IGlzIHVzZWQgdG8gaW1wbGVtZW50IC5uZXh0LFxuICAgIC8vIC50aHJvdywgYW5kIC5yZXR1cm4gKHNlZSBkZWZpbmVJdGVyYXRvck1ldGhvZHMpLlxuICAgIHRoaXMuX2ludm9rZSA9IGVucXVldWU7XG4gIH1cblxuICBkZWZpbmVJdGVyYXRvck1ldGhvZHMoQXN5bmNJdGVyYXRvci5wcm90b3R5cGUpO1xuXG4gIC8vIE5vdGUgdGhhdCBzaW1wbGUgYXN5bmMgZnVuY3Rpb25zIGFyZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAgLy8gQXN5bmNJdGVyYXRvciBvYmplY3RzOyB0aGV5IGp1c3QgcmV0dXJuIGEgUHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9mXG4gIC8vIHRoZSBmaW5hbCByZXN1bHQgcHJvZHVjZWQgYnkgdGhlIGl0ZXJhdG9yLlxuICBydW50aW1lLmFzeW5jID0gZnVuY3Rpb24oaW5uZXJGbiwgb3V0ZXJGbiwgc2VsZiwgdHJ5TG9jc0xpc3QpIHtcbiAgICB2YXIgaXRlciA9IG5ldyBBc3luY0l0ZXJhdG9yKFxuICAgICAgd3JhcChpbm5lckZuLCBvdXRlckZuLCBzZWxmLCB0cnlMb2NzTGlzdClcbiAgICApO1xuXG4gICAgcmV0dXJuIHJ1bnRpbWUuaXNHZW5lcmF0b3JGdW5jdGlvbihvdXRlckZuKVxuICAgICAgPyBpdGVyIC8vIElmIG91dGVyRm4gaXMgYSBnZW5lcmF0b3IsIHJldHVybiB0aGUgZnVsbCBpdGVyYXRvci5cbiAgICAgIDogaXRlci5uZXh0KCkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0LmRvbmUgPyByZXN1bHQudmFsdWUgOiBpdGVyLm5leHQoKTtcbiAgICAgICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gbWFrZUludm9rZU1ldGhvZChpbm5lckZuLCBzZWxmLCBjb250ZXh0KSB7XG4gICAgdmFyIHN0YXRlID0gR2VuU3RhdGVTdXNwZW5kZWRTdGFydDtcblxuICAgIHJldHVybiBmdW5jdGlvbiBpbnZva2UobWV0aG9kLCBhcmcpIHtcbiAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVFeGVjdXRpbmcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgcnVubmluZ1wiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXRlID09PSBHZW5TdGF0ZUNvbXBsZXRlZCkge1xuICAgICAgICBpZiAobWV0aG9kID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICB0aHJvdyBhcmc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCZSBmb3JnaXZpbmcsIHBlciAyNS4zLjMuMy4zIG9mIHRoZSBzcGVjOlxuICAgICAgICAvLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtZ2VuZXJhdG9ycmVzdW1lXG4gICAgICAgIHJldHVybiBkb25lUmVzdWx0KCk7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9IGNvbnRleHQuZGVsZWdhdGU7XG4gICAgICAgIGlmIChkZWxlZ2F0ZSkge1xuICAgICAgICAgIGlmIChtZXRob2QgPT09IFwicmV0dXJuXCIgfHxcbiAgICAgICAgICAgICAgKG1ldGhvZCA9PT0gXCJ0aHJvd1wiICYmIGRlbGVnYXRlLml0ZXJhdG9yW21ldGhvZF0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIC8vIEEgcmV0dXJuIG9yIHRocm93ICh3aGVuIHRoZSBkZWxlZ2F0ZSBpdGVyYXRvciBoYXMgbm8gdGhyb3dcbiAgICAgICAgICAgIC8vIG1ldGhvZCkgYWx3YXlzIHRlcm1pbmF0ZXMgdGhlIHlpZWxkKiBsb29wLlxuICAgICAgICAgICAgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBkZWxlZ2F0ZSBpdGVyYXRvciBoYXMgYSByZXR1cm4gbWV0aG9kLCBnaXZlIGl0IGFcbiAgICAgICAgICAgIC8vIGNoYW5jZSB0byBjbGVhbiB1cC5cbiAgICAgICAgICAgIHZhciByZXR1cm5NZXRob2QgPSBkZWxlZ2F0ZS5pdGVyYXRvcltcInJldHVyblwiXTtcbiAgICAgICAgICAgIGlmIChyZXR1cm5NZXRob2QpIHtcbiAgICAgICAgICAgICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKHJldHVybk1ldGhvZCwgZGVsZWdhdGUuaXRlcmF0b3IsIGFyZyk7XG4gICAgICAgICAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJldHVybiBtZXRob2QgdGhyZXcgYW4gZXhjZXB0aW9uLCBsZXQgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGV4Y2VwdGlvbiBwcmV2YWlsIG92ZXIgdGhlIG9yaWdpbmFsIHJldHVybiBvciB0aHJvdy5cbiAgICAgICAgICAgICAgICBtZXRob2QgPSBcInRocm93XCI7XG4gICAgICAgICAgICAgICAgYXJnID0gcmVjb3JkLmFyZztcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWV0aG9kID09PSBcInJldHVyblwiKSB7XG4gICAgICAgICAgICAgIC8vIENvbnRpbnVlIHdpdGggdGhlIG91dGVyIHJldHVybiwgbm93IHRoYXQgdGhlIGRlbGVnYXRlXG4gICAgICAgICAgICAgIC8vIGl0ZXJhdG9yIGhhcyBiZWVuIHRlcm1pbmF0ZWQuXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciByZWNvcmQgPSB0cnlDYXRjaChcbiAgICAgICAgICAgIGRlbGVnYXRlLml0ZXJhdG9yW21ldGhvZF0sXG4gICAgICAgICAgICBkZWxlZ2F0ZS5pdGVyYXRvcixcbiAgICAgICAgICAgIGFyZ1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgICAgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIExpa2UgcmV0dXJuaW5nIGdlbmVyYXRvci50aHJvdyh1bmNhdWdodCksIGJ1dCB3aXRob3V0IHRoZVxuICAgICAgICAgICAgLy8gb3ZlcmhlYWQgb2YgYW4gZXh0cmEgZnVuY3Rpb24gY2FsbC5cbiAgICAgICAgICAgIG1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgICAgICAgIGFyZyA9IHJlY29yZC5hcmc7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEZWxlZ2F0ZSBnZW5lcmF0b3IgcmFuIGFuZCBoYW5kbGVkIGl0cyBvd24gZXhjZXB0aW9ucyBzb1xuICAgICAgICAgIC8vIHJlZ2FyZGxlc3Mgb2Ygd2hhdCB0aGUgbWV0aG9kIHdhcywgd2UgY29udGludWUgYXMgaWYgaXQgaXNcbiAgICAgICAgICAvLyBcIm5leHRcIiB3aXRoIGFuIHVuZGVmaW5lZCBhcmcuXG4gICAgICAgICAgbWV0aG9kID0gXCJuZXh0XCI7XG4gICAgICAgICAgYXJnID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgdmFyIGluZm8gPSByZWNvcmQuYXJnO1xuICAgICAgICAgIGlmIChpbmZvLmRvbmUpIHtcbiAgICAgICAgICAgIGNvbnRleHRbZGVsZWdhdGUucmVzdWx0TmFtZV0gPSBpbmZvLnZhbHVlO1xuICAgICAgICAgICAgY29udGV4dC5uZXh0ID0gZGVsZWdhdGUubmV4dExvYztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZVN1c3BlbmRlZFlpZWxkO1xuICAgICAgICAgICAgcmV0dXJuIGluZm87XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWV0aG9kID09PSBcIm5leHRcIikge1xuICAgICAgICAgIGNvbnRleHQuX3NlbnQgPSBhcmc7XG5cbiAgICAgICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlU3VzcGVuZGVkWWllbGQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuc2VudCA9IGFyZztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dC5zZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtZXRob2QgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVTdXNwZW5kZWRTdGFydCkge1xuICAgICAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZUNvbXBsZXRlZDtcbiAgICAgICAgICAgIHRocm93IGFyZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29udGV4dC5kaXNwYXRjaEV4Y2VwdGlvbihhcmcpKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGlzcGF0Y2hlZCBleGNlcHRpb24gd2FzIGNhdWdodCBieSBhIGNhdGNoIGJsb2NrLFxuICAgICAgICAgICAgLy8gdGhlbiBsZXQgdGhhdCBjYXRjaCBibG9jayBoYW5kbGUgdGhlIGV4Y2VwdGlvbiBub3JtYWxseS5cbiAgICAgICAgICAgIG1ldGhvZCA9IFwibmV4dFwiO1xuICAgICAgICAgICAgYXJnID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKG1ldGhvZCA9PT0gXCJyZXR1cm5cIikge1xuICAgICAgICAgIGNvbnRleHQuYWJydXB0KFwicmV0dXJuXCIsIGFyZyk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZSA9IEdlblN0YXRlRXhlY3V0aW5nO1xuXG4gICAgICAgIHZhciByZWNvcmQgPSB0cnlDYXRjaChpbm5lckZuLCBzZWxmLCBjb250ZXh0KTtcbiAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcIm5vcm1hbFwiKSB7XG4gICAgICAgICAgLy8gSWYgYW4gZXhjZXB0aW9uIGlzIHRocm93biBmcm9tIGlubmVyRm4sIHdlIGxlYXZlIHN0YXRlID09PVxuICAgICAgICAgIC8vIEdlblN0YXRlRXhlY3V0aW5nIGFuZCBsb29wIGJhY2sgZm9yIGFub3RoZXIgaW52b2NhdGlvbi5cbiAgICAgICAgICBzdGF0ZSA9IGNvbnRleHQuZG9uZVxuICAgICAgICAgICAgPyBHZW5TdGF0ZUNvbXBsZXRlZFxuICAgICAgICAgICAgOiBHZW5TdGF0ZVN1c3BlbmRlZFlpZWxkO1xuXG4gICAgICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgICAgICB2YWx1ZTogcmVjb3JkLmFyZyxcbiAgICAgICAgICAgIGRvbmU6IGNvbnRleHQuZG9uZVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAocmVjb3JkLmFyZyA9PT0gQ29udGludWVTZW50aW5lbCkge1xuICAgICAgICAgICAgaWYgKGNvbnRleHQuZGVsZWdhdGUgJiYgbWV0aG9kID09PSBcIm5leHRcIikge1xuICAgICAgICAgICAgICAvLyBEZWxpYmVyYXRlbHkgZm9yZ2V0IHRoZSBsYXN0IHNlbnQgdmFsdWUgc28gdGhhdCB3ZSBkb24ndFxuICAgICAgICAgICAgICAvLyBhY2NpZGVudGFsbHkgcGFzcyBpdCBvbiB0byB0aGUgZGVsZWdhdGUuXG4gICAgICAgICAgICAgIGFyZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGluZm87XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIHN0YXRlID0gR2VuU3RhdGVDb21wbGV0ZWQ7XG4gICAgICAgICAgLy8gRGlzcGF0Y2ggdGhlIGV4Y2VwdGlvbiBieSBsb29waW5nIGJhY2sgYXJvdW5kIHRvIHRoZVxuICAgICAgICAgIC8vIGNvbnRleHQuZGlzcGF0Y2hFeGNlcHRpb24oYXJnKSBjYWxsIGFib3ZlLlxuICAgICAgICAgIG1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgICAgICBhcmcgPSByZWNvcmQuYXJnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIERlZmluZSBHZW5lcmF0b3IucHJvdG90eXBlLntuZXh0LHRocm93LHJldHVybn0gaW4gdGVybXMgb2YgdGhlXG4gIC8vIHVuaWZpZWQgLl9pbnZva2UgaGVscGVyIG1ldGhvZC5cbiAgZGVmaW5lSXRlcmF0b3JNZXRob2RzKEdwKTtcblxuICBHcFtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBHcC50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgR2VuZXJhdG9yXVwiO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHB1c2hUcnlFbnRyeShsb2NzKSB7XG4gICAgdmFyIGVudHJ5ID0geyB0cnlMb2M6IGxvY3NbMF0gfTtcblxuICAgIGlmICgxIGluIGxvY3MpIHtcbiAgICAgIGVudHJ5LmNhdGNoTG9jID0gbG9jc1sxXTtcbiAgICB9XG5cbiAgICBpZiAoMiBpbiBsb2NzKSB7XG4gICAgICBlbnRyeS5maW5hbGx5TG9jID0gbG9jc1syXTtcbiAgICAgIGVudHJ5LmFmdGVyTG9jID0gbG9jc1szXTtcbiAgICB9XG5cbiAgICB0aGlzLnRyeUVudHJpZXMucHVzaChlbnRyeSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldFRyeUVudHJ5KGVudHJ5KSB7XG4gICAgdmFyIHJlY29yZCA9IGVudHJ5LmNvbXBsZXRpb24gfHwge307XG4gICAgcmVjb3JkLnR5cGUgPSBcIm5vcm1hbFwiO1xuICAgIGRlbGV0ZSByZWNvcmQuYXJnO1xuICAgIGVudHJ5LmNvbXBsZXRpb24gPSByZWNvcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBDb250ZXh0KHRyeUxvY3NMaXN0KSB7XG4gICAgLy8gVGhlIHJvb3QgZW50cnkgb2JqZWN0IChlZmZlY3RpdmVseSBhIHRyeSBzdGF0ZW1lbnQgd2l0aG91dCBhIGNhdGNoXG4gICAgLy8gb3IgYSBmaW5hbGx5IGJsb2NrKSBnaXZlcyB1cyBhIHBsYWNlIHRvIHN0b3JlIHZhbHVlcyB0aHJvd24gZnJvbVxuICAgIC8vIGxvY2F0aW9ucyB3aGVyZSB0aGVyZSBpcyBubyBlbmNsb3NpbmcgdHJ5IHN0YXRlbWVudC5cbiAgICB0aGlzLnRyeUVudHJpZXMgPSBbeyB0cnlMb2M6IFwicm9vdFwiIH1dO1xuICAgIHRyeUxvY3NMaXN0LmZvckVhY2gocHVzaFRyeUVudHJ5LCB0aGlzKTtcbiAgICB0aGlzLnJlc2V0KHRydWUpO1xuICB9XG5cbiAgcnVudGltZS5rZXlzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICB9XG4gICAga2V5cy5yZXZlcnNlKCk7XG5cbiAgICAvLyBSYXRoZXIgdGhhbiByZXR1cm5pbmcgYW4gb2JqZWN0IHdpdGggYSBuZXh0IG1ldGhvZCwgd2Uga2VlcFxuICAgIC8vIHRoaW5ncyBzaW1wbGUgYW5kIHJldHVybiB0aGUgbmV4dCBmdW5jdGlvbiBpdHNlbGYuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICB3aGlsZSAoa2V5cy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXMucG9wKCk7XG4gICAgICAgIGlmIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgbmV4dC52YWx1ZSA9IGtleTtcbiAgICAgICAgICBuZXh0LmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUbyBhdm9pZCBjcmVhdGluZyBhbiBhZGRpdGlvbmFsIG9iamVjdCwgd2UganVzdCBoYW5nIHRoZSAudmFsdWVcbiAgICAgIC8vIGFuZCAuZG9uZSBwcm9wZXJ0aWVzIG9mZiB0aGUgbmV4dCBmdW5jdGlvbiBvYmplY3QgaXRzZWxmLiBUaGlzXG4gICAgICAvLyBhbHNvIGVuc3VyZXMgdGhhdCB0aGUgbWluaWZpZXIgd2lsbCBub3QgYW5vbnltaXplIHRoZSBmdW5jdGlvbi5cbiAgICAgIG5leHQuZG9uZSA9IHRydWU7XG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHZhbHVlcyhpdGVyYWJsZSkge1xuICAgIGlmIChpdGVyYWJsZSkge1xuICAgICAgdmFyIGl0ZXJhdG9yTWV0aG9kID0gaXRlcmFibGVbaXRlcmF0b3JTeW1ib2xdO1xuICAgICAgaWYgKGl0ZXJhdG9yTWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvck1ldGhvZC5jYWxsKGl0ZXJhYmxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBpdGVyYWJsZS5uZXh0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhYmxlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzTmFOKGl0ZXJhYmxlLmxlbmd0aCkpIHtcbiAgICAgICAgdmFyIGkgPSAtMSwgbmV4dCA9IGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgd2hpbGUgKCsraSA8IGl0ZXJhYmxlLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGl0ZXJhYmxlLCBpKSkge1xuICAgICAgICAgICAgICBuZXh0LnZhbHVlID0gaXRlcmFibGVbaV07XG4gICAgICAgICAgICAgIG5leHQuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBuZXh0LnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIG5leHQuZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbmV4dC5uZXh0ID0gbmV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gYW4gaXRlcmF0b3Igd2l0aCBubyB2YWx1ZXMuXG4gICAgcmV0dXJuIHsgbmV4dDogZG9uZVJlc3VsdCB9O1xuICB9XG4gIHJ1bnRpbWUudmFsdWVzID0gdmFsdWVzO1xuXG4gIGZ1bmN0aW9uIGRvbmVSZXN1bHQoKSB7XG4gICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICB9XG5cbiAgQ29udGV4dC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IENvbnRleHQsXG5cbiAgICByZXNldDogZnVuY3Rpb24oc2tpcFRlbXBSZXNldCkge1xuICAgICAgdGhpcy5wcmV2ID0gMDtcbiAgICAgIHRoaXMubmV4dCA9IDA7XG4gICAgICB0aGlzLnNlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSBudWxsO1xuXG4gICAgICB0aGlzLnRyeUVudHJpZXMuZm9yRWFjaChyZXNldFRyeUVudHJ5KTtcblxuICAgICAgaWYgKCFza2lwVGVtcFJlc2V0KSB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcykge1xuICAgICAgICAgIC8vIE5vdCBzdXJlIGFib3V0IHRoZSBvcHRpbWFsIG9yZGVyIG9mIHRoZXNlIGNvbmRpdGlvbnM6XG4gICAgICAgICAgaWYgKG5hbWUuY2hhckF0KDApID09PSBcInRcIiAmJlxuICAgICAgICAgICAgICBoYXNPd24uY2FsbCh0aGlzLCBuYW1lKSAmJlxuICAgICAgICAgICAgICAhaXNOYU4oK25hbWUuc2xpY2UoMSkpKSB7XG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG5cbiAgICAgIHZhciByb290RW50cnkgPSB0aGlzLnRyeUVudHJpZXNbMF07XG4gICAgICB2YXIgcm9vdFJlY29yZCA9IHJvb3RFbnRyeS5jb21wbGV0aW9uO1xuICAgICAgaWYgKHJvb3RSZWNvcmQudHlwZSA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgIHRocm93IHJvb3RSZWNvcmQuYXJnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5ydmFsO1xuICAgIH0sXG5cbiAgICBkaXNwYXRjaEV4Y2VwdGlvbjogZnVuY3Rpb24oZXhjZXB0aW9uKSB7XG4gICAgICBpZiAodGhpcy5kb25lKSB7XG4gICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuICAgICAgZnVuY3Rpb24gaGFuZGxlKGxvYywgY2F1Z2h0KSB7XG4gICAgICAgIHJlY29yZC50eXBlID0gXCJ0aHJvd1wiO1xuICAgICAgICByZWNvcmQuYXJnID0gZXhjZXB0aW9uO1xuICAgICAgICBjb250ZXh0Lm5leHQgPSBsb2M7XG4gICAgICAgIHJldHVybiAhIWNhdWdodDtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07XG4gICAgICAgIHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uO1xuXG4gICAgICAgIGlmIChlbnRyeS50cnlMb2MgPT09IFwicm9vdFwiKSB7XG4gICAgICAgICAgLy8gRXhjZXB0aW9uIHRocm93biBvdXRzaWRlIG9mIGFueSB0cnkgYmxvY2sgdGhhdCBjb3VsZCBoYW5kbGVcbiAgICAgICAgICAvLyBpdCwgc28gc2V0IHRoZSBjb21wbGV0aW9uIHZhbHVlIG9mIHRoZSBlbnRpcmUgZnVuY3Rpb24gdG9cbiAgICAgICAgICAvLyB0aHJvdyB0aGUgZXhjZXB0aW9uLlxuICAgICAgICAgIHJldHVybiBoYW5kbGUoXCJlbmRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZW50cnkudHJ5TG9jIDw9IHRoaXMucHJldikge1xuICAgICAgICAgIHZhciBoYXNDYXRjaCA9IGhhc093bi5jYWxsKGVudHJ5LCBcImNhdGNoTG9jXCIpO1xuICAgICAgICAgIHZhciBoYXNGaW5hbGx5ID0gaGFzT3duLmNhbGwoZW50cnksIFwiZmluYWxseUxvY1wiKTtcblxuICAgICAgICAgIGlmIChoYXNDYXRjaCAmJiBoYXNGaW5hbGx5KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2IDwgZW50cnkuY2F0Y2hMb2MpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZShlbnRyeS5jYXRjaExvYywgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZShlbnRyeS5maW5hbGx5TG9jKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH0gZWxzZSBpZiAoaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5jYXRjaExvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmNhdGNoTG9jLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH0gZWxzZSBpZiAoaGFzRmluYWxseSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZShlbnRyeS5maW5hbGx5TG9jKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0cnkgc3RhdGVtZW50IHdpdGhvdXQgY2F0Y2ggb3IgZmluYWxseVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYWJydXB0OiBmdW5jdGlvbih0eXBlLCBhcmcpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICBpZiAoZW50cnkudHJ5TG9jIDw9IHRoaXMucHJldiAmJlxuICAgICAgICAgICAgaGFzT3duLmNhbGwoZW50cnksIFwiZmluYWxseUxvY1wiKSAmJlxuICAgICAgICAgICAgdGhpcy5wcmV2IDwgZW50cnkuZmluYWxseUxvYykge1xuICAgICAgICAgIHZhciBmaW5hbGx5RW50cnkgPSBlbnRyeTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZmluYWxseUVudHJ5ICYmXG4gICAgICAgICAgKHR5cGUgPT09IFwiYnJlYWtcIiB8fFxuICAgICAgICAgICB0eXBlID09PSBcImNvbnRpbnVlXCIpICYmXG4gICAgICAgICAgZmluYWxseUVudHJ5LnRyeUxvYyA8PSBhcmcgJiZcbiAgICAgICAgICBhcmcgPD0gZmluYWxseUVudHJ5LmZpbmFsbHlMb2MpIHtcbiAgICAgICAgLy8gSWdub3JlIHRoZSBmaW5hbGx5IGVudHJ5IGlmIGNvbnRyb2wgaXMgbm90IGp1bXBpbmcgdG8gYVxuICAgICAgICAvLyBsb2NhdGlvbiBvdXRzaWRlIHRoZSB0cnkvY2F0Y2ggYmxvY2suXG4gICAgICAgIGZpbmFsbHlFbnRyeSA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHZhciByZWNvcmQgPSBmaW5hbGx5RW50cnkgPyBmaW5hbGx5RW50cnkuY29tcGxldGlvbiA6IHt9O1xuICAgICAgcmVjb3JkLnR5cGUgPSB0eXBlO1xuICAgICAgcmVjb3JkLmFyZyA9IGFyZztcblxuICAgICAgaWYgKGZpbmFsbHlFbnRyeSkge1xuICAgICAgICB0aGlzLm5leHQgPSBmaW5hbGx5RW50cnkuZmluYWxseUxvYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY29tcGxldGUocmVjb3JkKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgfSxcblxuICAgIGNvbXBsZXRlOiBmdW5jdGlvbihyZWNvcmQsIGFmdGVyTG9jKSB7XG4gICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICB0aHJvdyByZWNvcmQuYXJnO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwiYnJlYWtcIiB8fFxuICAgICAgICAgIHJlY29yZC50eXBlID09PSBcImNvbnRpbnVlXCIpIHtcbiAgICAgICAgdGhpcy5uZXh0ID0gcmVjb3JkLmFyZztcbiAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09IFwicmV0dXJuXCIpIHtcbiAgICAgICAgdGhpcy5ydmFsID0gcmVjb3JkLmFyZztcbiAgICAgICAgdGhpcy5uZXh0ID0gXCJlbmRcIjtcbiAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09IFwibm9ybWFsXCIgJiYgYWZ0ZXJMb2MpIHtcbiAgICAgICAgdGhpcy5uZXh0ID0gYWZ0ZXJMb2M7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24oZmluYWxseUxvYykge1xuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07XG4gICAgICAgIGlmIChlbnRyeS5maW5hbGx5TG9jID09PSBmaW5hbGx5TG9jKSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZShlbnRyeS5jb21wbGV0aW9uLCBlbnRyeS5hZnRlckxvYyk7XG4gICAgICAgICAgcmVzZXRUcnlFbnRyeShlbnRyeSk7XG4gICAgICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgXCJjYXRjaFwiOiBmdW5jdGlvbih0cnlMb2MpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICBpZiAoZW50cnkudHJ5TG9jID09PSB0cnlMb2MpIHtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjtcbiAgICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgICAgdmFyIHRocm93biA9IHJlY29yZC5hcmc7XG4gICAgICAgICAgICByZXNldFRyeUVudHJ5KGVudHJ5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRocm93bjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUaGUgY29udGV4dC5jYXRjaCBtZXRob2QgbXVzdCBvbmx5IGJlIGNhbGxlZCB3aXRoIGEgbG9jYXRpb25cbiAgICAgIC8vIGFyZ3VtZW50IHRoYXQgY29ycmVzcG9uZHMgdG8gYSBrbm93biBjYXRjaCBibG9jay5cbiAgICAgIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgY2F0Y2ggYXR0ZW1wdFwiKTtcbiAgICB9LFxuXG4gICAgZGVsZWdhdGVZaWVsZDogZnVuY3Rpb24oaXRlcmFibGUsIHJlc3VsdE5hbWUsIG5leHRMb2MpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSB7XG4gICAgICAgIGl0ZXJhdG9yOiB2YWx1ZXMoaXRlcmFibGUpLFxuICAgICAgICByZXN1bHROYW1lOiByZXN1bHROYW1lLFxuICAgICAgICBuZXh0TG9jOiBuZXh0TG9jXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgICB9XG4gIH07XG59KShcbiAgLy8gQW1vbmcgdGhlIHZhcmlvdXMgdHJpY2tzIGZvciBvYnRhaW5pbmcgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbFxuICAvLyBvYmplY3QsIHRoaXMgc2VlbXMgdG8gYmUgdGhlIG1vc3QgcmVsaWFibGUgdGVjaG5pcXVlIHRoYXQgZG9lcyBub3RcbiAgLy8gdXNlIGluZGlyZWN0IGV2YWwgKHdoaWNoIHZpb2xhdGVzIENvbnRlbnQgU2VjdXJpdHkgUG9saWN5KS5cbiAgdHlwZW9mIGdsb2JhbCA9PT0gXCJvYmplY3RcIiA/IGdsb2JhbCA6XG4gIHR5cGVvZiB3aW5kb3cgPT09IFwib2JqZWN0XCIgPyB3aW5kb3cgOlxuICB0eXBlb2Ygc2VsZiA9PT0gXCJvYmplY3RcIiA/IHNlbGYgOiB0aGlzXG4pO1xuIl19
},{"_process":"/home/jon/Dropbox/dev/sudoku/node_modules/process/browser.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/array/from.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/array/from"), __esModule: true };
},{"core-js/library/fn/array/from":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/array/from.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/json/stringify.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/json/stringify"), __esModule: true };
},{"core-js/library/fn/json/stringify":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/json/stringify.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/object/create.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/object/create.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/object/set-prototype-of.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/object/set-prototype-of.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/promise.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/promise"), __esModule: true };
},{"core-js/library/fn/promise":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/promise.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/set.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/set"), __esModule: true };
},{"core-js/library/fn/set":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/set.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/symbol.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol"), __esModule: true };
},{"core-js/library/fn/symbol":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/symbol/index.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/helpers/toConsumableArray.js":[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _from = require("../core-js/array/from");

var _from2 = _interopRequireDefault(_from);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  } else {
    return (0, _from2.default)(arr);
  }
};
},{"../core-js/array/from":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/array/from.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/regenerator/index.js":[function(require,module,exports){
(function (global){
// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g =
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this;

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

module.exports = require("./runtime");

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

module.exports = { "default": module.exports, __esModule: true };

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL3JlZ2VuZXJhdG9yL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhpcyBtZXRob2Qgb2Ygb2J0YWluaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0IG5lZWRzIHRvIGJlXG4vLyBrZXB0IGlkZW50aWNhbCB0byB0aGUgd2F5IGl0IGlzIG9idGFpbmVkIGluIHJ1bnRpbWUuanNcbnZhciBnID1cbiAgdHlwZW9mIGdsb2JhbCA9PT0gXCJvYmplY3RcIiA/IGdsb2JhbCA6XG4gIHR5cGVvZiB3aW5kb3cgPT09IFwib2JqZWN0XCIgPyB3aW5kb3cgOlxuICB0eXBlb2Ygc2VsZiA9PT0gXCJvYmplY3RcIiA/IHNlbGYgOiB0aGlzO1xuXG4vLyBVc2UgYGdldE93blByb3BlcnR5TmFtZXNgIGJlY2F1c2Ugbm90IGFsbCBicm93c2VycyBzdXBwb3J0IGNhbGxpbmdcbi8vIGBoYXNPd25Qcm9wZXJ0eWAgb24gdGhlIGdsb2JhbCBgc2VsZmAgb2JqZWN0IGluIGEgd29ya2VyLiBTZWUgIzE4My5cbnZhciBoYWRSdW50aW1lID0gZy5yZWdlbmVyYXRvclJ1bnRpbWUgJiZcbiAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZykuaW5kZXhPZihcInJlZ2VuZXJhdG9yUnVudGltZVwiKSA+PSAwO1xuXG4vLyBTYXZlIHRoZSBvbGQgcmVnZW5lcmF0b3JSdW50aW1lIGluIGNhc2UgaXQgbmVlZHMgdG8gYmUgcmVzdG9yZWQgbGF0ZXIuXG52YXIgb2xkUnVudGltZSA9IGhhZFJ1bnRpbWUgJiYgZy5yZWdlbmVyYXRvclJ1bnRpbWU7XG5cbi8vIEZvcmNlIHJlZXZhbHV0YXRpb24gb2YgcnVudGltZS5qcy5cbmcucmVnZW5lcmF0b3JSdW50aW1lID0gdW5kZWZpbmVkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3J1bnRpbWVcIik7XG5cbmlmIChoYWRSdW50aW1lKSB7XG4gIC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIHJ1bnRpbWUuXG4gIGcucmVnZW5lcmF0b3JSdW50aW1lID0gb2xkUnVudGltZTtcbn0gZWxzZSB7XG4gIC8vIFJlbW92ZSB0aGUgZ2xvYmFsIHByb3BlcnR5IGFkZGVkIGJ5IHJ1bnRpbWUuanMuXG4gIHRyeSB7XG4gICAgZGVsZXRlIGcucmVnZW5lcmF0b3JSdW50aW1lO1xuICB9IGNhdGNoKGUpIHtcbiAgICBnLnJlZ2VuZXJhdG9yUnVudGltZSA9IHVuZGVmaW5lZDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IG1vZHVsZS5leHBvcnRzLCBfX2VzTW9kdWxlOiB0cnVlIH07XG4iXX0=
},{"./runtime":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/regenerator/runtime.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/regenerator/runtime.js":[function(require,module,exports){
(function (process,global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

"use strict";

var _Symbol = require("babel-runtime/core-js/symbol")["default"];

var _Object$create = require("babel-runtime/core-js/object/create")["default"];

var _Object$setPrototypeOf = require("babel-runtime/core-js/object/set-prototype-of")["default"];

var _Promise = require("babel-runtime/core-js/promise")["default"];

!(function (global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof _Symbol === "function" ? _Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = _Object$create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      prototype[method] = function (arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction ||
    // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  runtime.mark = function (genFun) {
    if (_Object$setPrototypeOf) {
      _Object$setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = _Object$create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function (arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return _Promise.resolve(value.arg).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return _Promise.resolve(value).then(function (unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new _Promise(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
      // If enqueue has been called before, then we want to wait until
      // all previous Promises have been resolved before calling invoke,
      // so that results are always delivered in the correct order. If
      // enqueue has not been called before, then it is important to
      // call invoke immediately, without waiting on a callback to fire,
      // so that the async generator function has the opportunity to do
      // any necessary setup in a predictable way. This predictability
      // is why the Promise constructor synchronously invokes its
      // executor callback, and why async functions synchronously
      // execute code before the first await. Since we implement simple
      // async functions in terms of async generators, it is especially
      // important to get this right, even though it requires care.
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
      // Avoid propagating failures to Promises returned by later
      // invocations of the iterator.
      callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }
        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }
        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }
        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function () {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function (object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function stop() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
// Among the various tricks for obtaining a reference to the global
// object, this seems to be the most reliable technique that does not
// use indirect eval (which violates Content Security Policy).
typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined);
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL3JlZ2VuZXJhdG9yL3J1bnRpbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20vZmFjZWJvb2svcmVnZW5lcmF0b3IvbWFzdGVyL0xJQ0VOU0UgZmlsZS4gQW5cbiAqIGFkZGl0aW9uYWwgZ3JhbnQgb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpblxuICogdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgX1N5bWJvbCA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvc3ltYm9sXCIpW1wiZGVmYXVsdFwiXTtcblxudmFyIF9PYmplY3QkY3JlYXRlID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvY3JlYXRlXCIpW1wiZGVmYXVsdFwiXTtcblxudmFyIF9PYmplY3Qkc2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9zZXQtcHJvdG90eXBlLW9mXCIpW1wiZGVmYXVsdFwiXTtcblxudmFyIF9Qcm9taXNlID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9wcm9taXNlXCIpW1wiZGVmYXVsdFwiXTtcblxuIShmdW5jdGlvbiAoZ2xvYmFsKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgdW5kZWZpbmVkOyAvLyBNb3JlIGNvbXByZXNzaWJsZSB0aGFuIHZvaWQgMC5cbiAgdmFyICRTeW1ib2wgPSB0eXBlb2YgX1N5bWJvbCA9PT0gXCJmdW5jdGlvblwiID8gX1N5bWJvbCA6IHt9O1xuICB2YXIgaXRlcmF0b3JTeW1ib2wgPSAkU3ltYm9sLml0ZXJhdG9yIHx8IFwiQEBpdGVyYXRvclwiO1xuICB2YXIgdG9TdHJpbmdUYWdTeW1ib2wgPSAkU3ltYm9sLnRvU3RyaW5nVGFnIHx8IFwiQEB0b1N0cmluZ1RhZ1wiO1xuXG4gIHZhciBpbk1vZHVsZSA9IHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCI7XG4gIHZhciBydW50aW1lID0gZ2xvYmFsLnJlZ2VuZXJhdG9yUnVudGltZTtcbiAgaWYgKHJ1bnRpbWUpIHtcbiAgICBpZiAoaW5Nb2R1bGUpIHtcbiAgICAgIC8vIElmIHJlZ2VuZXJhdG9yUnVudGltZSBpcyBkZWZpbmVkIGdsb2JhbGx5IGFuZCB3ZSdyZSBpbiBhIG1vZHVsZSxcbiAgICAgIC8vIG1ha2UgdGhlIGV4cG9ydHMgb2JqZWN0IGlkZW50aWNhbCB0byByZWdlbmVyYXRvclJ1bnRpbWUuXG4gICAgICBtb2R1bGUuZXhwb3J0cyA9IHJ1bnRpbWU7XG4gICAgfVxuICAgIC8vIERvbid0IGJvdGhlciBldmFsdWF0aW5nIHRoZSByZXN0IG9mIHRoaXMgZmlsZSBpZiB0aGUgcnVudGltZSB3YXNcbiAgICAvLyBhbHJlYWR5IGRlZmluZWQgZ2xvYmFsbHkuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVmaW5lIHRoZSBydW50aW1lIGdsb2JhbGx5IChhcyBleHBlY3RlZCBieSBnZW5lcmF0ZWQgY29kZSkgYXMgZWl0aGVyXG4gIC8vIG1vZHVsZS5leHBvcnRzIChpZiB3ZSdyZSBpbiBhIG1vZHVsZSkgb3IgYSBuZXcsIGVtcHR5IG9iamVjdC5cbiAgcnVudGltZSA9IGdsb2JhbC5yZWdlbmVyYXRvclJ1bnRpbWUgPSBpbk1vZHVsZSA/IG1vZHVsZS5leHBvcnRzIDoge307XG5cbiAgZnVuY3Rpb24gd3JhcChpbm5lckZuLCBvdXRlckZuLCBzZWxmLCB0cnlMb2NzTGlzdCkge1xuICAgIC8vIElmIG91dGVyRm4gcHJvdmlkZWQsIHRoZW4gb3V0ZXJGbi5wcm90b3R5cGUgaW5zdGFuY2VvZiBHZW5lcmF0b3IuXG4gICAgdmFyIGdlbmVyYXRvciA9IF9PYmplY3QkY3JlYXRlKChvdXRlckZuIHx8IEdlbmVyYXRvcikucHJvdG90eXBlKTtcbiAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHRyeUxvY3NMaXN0IHx8IFtdKTtcblxuICAgIC8vIFRoZSAuX2ludm9rZSBtZXRob2QgdW5pZmllcyB0aGUgaW1wbGVtZW50YXRpb25zIG9mIHRoZSAubmV4dCxcbiAgICAvLyAudGhyb3csIGFuZCAucmV0dXJuIG1ldGhvZHMuXG4gICAgZ2VuZXJhdG9yLl9pbnZva2UgPSBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpO1xuXG4gICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgfVxuICBydW50aW1lLndyYXAgPSB3cmFwO1xuXG4gIC8vIFRyeS9jYXRjaCBoZWxwZXIgdG8gbWluaW1pemUgZGVvcHRpbWl6YXRpb25zLiBSZXR1cm5zIGEgY29tcGxldGlvblxuICAvLyByZWNvcmQgbGlrZSBjb250ZXh0LnRyeUVudHJpZXNbaV0uY29tcGxldGlvbi4gVGhpcyBpbnRlcmZhY2UgY291bGRcbiAgLy8gaGF2ZSBiZWVuIChhbmQgd2FzIHByZXZpb3VzbHkpIGRlc2lnbmVkIHRvIHRha2UgYSBjbG9zdXJlIHRvIGJlXG4gIC8vIGludm9rZWQgd2l0aG91dCBhcmd1bWVudHMsIGJ1dCBpbiBhbGwgdGhlIGNhc2VzIHdlIGNhcmUgYWJvdXQgd2VcbiAgLy8gYWxyZWFkeSBoYXZlIGFuIGV4aXN0aW5nIG1ldGhvZCB3ZSB3YW50IHRvIGNhbGwsIHNvIHRoZXJlJ3Mgbm8gbmVlZFxuICAvLyB0byBjcmVhdGUgYSBuZXcgZnVuY3Rpb24gb2JqZWN0LiBXZSBjYW4gZXZlbiBnZXQgYXdheSB3aXRoIGFzc3VtaW5nXG4gIC8vIHRoZSBtZXRob2QgdGFrZXMgZXhhY3RseSBvbmUgYXJndW1lbnQsIHNpbmNlIHRoYXQgaGFwcGVucyB0byBiZSB0cnVlXG4gIC8vIGluIGV2ZXJ5IGNhc2UsIHNvIHdlIGRvbid0IGhhdmUgdG8gdG91Y2ggdGhlIGFyZ3VtZW50cyBvYmplY3QuIFRoZVxuICAvLyBvbmx5IGFkZGl0aW9uYWwgYWxsb2NhdGlvbiByZXF1aXJlZCBpcyB0aGUgY29tcGxldGlvbiByZWNvcmQsIHdoaWNoXG4gIC8vIGhhcyBhIHN0YWJsZSBzaGFwZSBhbmQgc28gaG9wZWZ1bGx5IHNob3VsZCBiZSBjaGVhcCB0byBhbGxvY2F0ZS5cbiAgZnVuY3Rpb24gdHJ5Q2F0Y2goZm4sIG9iaiwgYXJnKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwibm9ybWFsXCIsIGFyZzogZm4uY2FsbChvYmosIGFyZykgfTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwidGhyb3dcIiwgYXJnOiBlcnIgfTtcbiAgICB9XG4gIH1cblxuICB2YXIgR2VuU3RhdGVTdXNwZW5kZWRTdGFydCA9IFwic3VzcGVuZGVkU3RhcnRcIjtcbiAgdmFyIEdlblN0YXRlU3VzcGVuZGVkWWllbGQgPSBcInN1c3BlbmRlZFlpZWxkXCI7XG4gIHZhciBHZW5TdGF0ZUV4ZWN1dGluZyA9IFwiZXhlY3V0aW5nXCI7XG4gIHZhciBHZW5TdGF0ZUNvbXBsZXRlZCA9IFwiY29tcGxldGVkXCI7XG5cbiAgLy8gUmV0dXJuaW5nIHRoaXMgb2JqZWN0IGZyb20gdGhlIGlubmVyRm4gaGFzIHRoZSBzYW1lIGVmZmVjdCBhc1xuICAvLyBicmVha2luZyBvdXQgb2YgdGhlIGRpc3BhdGNoIHN3aXRjaCBzdGF0ZW1lbnQuXG4gIHZhciBDb250aW51ZVNlbnRpbmVsID0ge307XG5cbiAgLy8gRHVtbXkgY29uc3RydWN0b3IgZnVuY3Rpb25zIHRoYXQgd2UgdXNlIGFzIHRoZSAuY29uc3RydWN0b3IgYW5kXG4gIC8vIC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgcHJvcGVydGllcyBmb3IgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIEdlbmVyYXRvclxuICAvLyBvYmplY3RzLiBGb3IgZnVsbCBzcGVjIGNvbXBsaWFuY2UsIHlvdSBtYXkgd2lzaCB0byBjb25maWd1cmUgeW91clxuICAvLyBtaW5pZmllciBub3QgdG8gbWFuZ2xlIHRoZSBuYW1lcyBvZiB0aGVzZSB0d28gZnVuY3Rpb25zLlxuICBmdW5jdGlvbiBHZW5lcmF0b3IoKSB7fVxuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvbigpIHt9XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKCkge31cblxuICB2YXIgR3AgPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUgPSBHZW5lcmF0b3IucHJvdG90eXBlO1xuICBHZW5lcmF0b3JGdW5jdGlvbi5wcm90b3R5cGUgPSBHcC5jb25zdHJ1Y3RvciA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEdlbmVyYXRvckZ1bmN0aW9uO1xuICBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZVt0b1N0cmluZ1RhZ1N5bWJvbF0gPSBHZW5lcmF0b3JGdW5jdGlvbi5kaXNwbGF5TmFtZSA9IFwiR2VuZXJhdG9yRnVuY3Rpb25cIjtcblxuICAvLyBIZWxwZXIgZm9yIGRlZmluaW5nIHRoZSAubmV4dCwgLnRocm93LCBhbmQgLnJldHVybiBtZXRob2RzIG9mIHRoZVxuICAvLyBJdGVyYXRvciBpbnRlcmZhY2UgaW4gdGVybXMgb2YgYSBzaW5nbGUgLl9pbnZva2UgbWV0aG9kLlxuICBmdW5jdGlvbiBkZWZpbmVJdGVyYXRvck1ldGhvZHMocHJvdG90eXBlKSB7XG4gICAgW1wibmV4dFwiLCBcInRocm93XCIsIFwicmV0dXJuXCJdLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgcHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnZva2UobWV0aG9kLCBhcmcpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHJ1bnRpbWUuaXNHZW5lcmF0b3JGdW5jdGlvbiA9IGZ1bmN0aW9uIChnZW5GdW4pIHtcbiAgICB2YXIgY3RvciA9IHR5cGVvZiBnZW5GdW4gPT09IFwiZnVuY3Rpb25cIiAmJiBnZW5GdW4uY29uc3RydWN0b3I7XG4gICAgcmV0dXJuIGN0b3IgPyBjdG9yID09PSBHZW5lcmF0b3JGdW5jdGlvbiB8fFxuICAgIC8vIEZvciB0aGUgbmF0aXZlIEdlbmVyYXRvckZ1bmN0aW9uIGNvbnN0cnVjdG9yLCB0aGUgYmVzdCB3ZSBjYW5cbiAgICAvLyBkbyBpcyB0byBjaGVjayBpdHMgLm5hbWUgcHJvcGVydHkuXG4gICAgKGN0b3IuZGlzcGxheU5hbWUgfHwgY3Rvci5uYW1lKSA9PT0gXCJHZW5lcmF0b3JGdW5jdGlvblwiIDogZmFsc2U7XG4gIH07XG5cbiAgcnVudGltZS5tYXJrID0gZnVuY3Rpb24gKGdlbkZ1bikge1xuICAgIGlmIChfT2JqZWN0JHNldFByb3RvdHlwZU9mKSB7XG4gICAgICBfT2JqZWN0JHNldFByb3RvdHlwZU9mKGdlbkZ1biwgR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnZW5GdW4uX19wcm90b19fID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGU7XG4gICAgICBpZiAoISh0b1N0cmluZ1RhZ1N5bWJvbCBpbiBnZW5GdW4pKSB7XG4gICAgICAgIGdlbkZ1blt0b1N0cmluZ1RhZ1N5bWJvbF0gPSBcIkdlbmVyYXRvckZ1bmN0aW9uXCI7XG4gICAgICB9XG4gICAgfVxuICAgIGdlbkZ1bi5wcm90b3R5cGUgPSBfT2JqZWN0JGNyZWF0ZShHcCk7XG4gICAgcmV0dXJuIGdlbkZ1bjtcbiAgfTtcblxuICAvLyBXaXRoaW4gdGhlIGJvZHkgb2YgYW55IGFzeW5jIGZ1bmN0aW9uLCBgYXdhaXQgeGAgaXMgdHJhbnNmb3JtZWQgdG9cbiAgLy8gYHlpZWxkIHJlZ2VuZXJhdG9yUnVudGltZS5hd3JhcCh4KWAsIHNvIHRoYXQgdGhlIHJ1bnRpbWUgY2FuIHRlc3RcbiAgLy8gYHZhbHVlIGluc3RhbmNlb2YgQXdhaXRBcmd1bWVudGAgdG8gZGV0ZXJtaW5lIGlmIHRoZSB5aWVsZGVkIHZhbHVlIGlzXG4gIC8vIG1lYW50IHRvIGJlIGF3YWl0ZWQuIFNvbWUgbWF5IGNvbnNpZGVyIHRoZSBuYW1lIG9mIHRoaXMgbWV0aG9kIHRvb1xuICAvLyBjdXRlc3ksIGJ1dCB0aGV5IGFyZSBjdXJtdWRnZW9ucy5cbiAgcnVudGltZS5hd3JhcCA9IGZ1bmN0aW9uIChhcmcpIHtcbiAgICByZXR1cm4gbmV3IEF3YWl0QXJndW1lbnQoYXJnKTtcbiAgfTtcblxuICBmdW5jdGlvbiBBd2FpdEFyZ3VtZW50KGFyZykge1xuICAgIHRoaXMuYXJnID0gYXJnO1xuICB9XG5cbiAgZnVuY3Rpb24gQXN5bmNJdGVyYXRvcihnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBpbnZva2UobWV0aG9kLCBhcmcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGdlbmVyYXRvclttZXRob2RdLCBnZW5lcmF0b3IsIGFyZyk7XG4gICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICByZWplY3QocmVjb3JkLmFyZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcmVzdWx0ID0gcmVjb3JkLmFyZztcbiAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBd2FpdEFyZ3VtZW50KSB7XG4gICAgICAgICAgcmV0dXJuIF9Qcm9taXNlLnJlc29sdmUodmFsdWUuYXJnKS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaW52b2tlKFwibmV4dFwiLCB2YWx1ZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpbnZva2UoXCJ0aHJvd1wiLCBlcnIsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gX1Byb21pc2UucmVzb2x2ZSh2YWx1ZSkudGhlbihmdW5jdGlvbiAodW53cmFwcGVkKSB7XG4gICAgICAgICAgLy8gV2hlbiBhIHlpZWxkZWQgUHJvbWlzZSBpcyByZXNvbHZlZCwgaXRzIGZpbmFsIHZhbHVlIGJlY29tZXNcbiAgICAgICAgICAvLyB0aGUgLnZhbHVlIG9mIHRoZSBQcm9taXNlPHt2YWx1ZSxkb25lfT4gcmVzdWx0IGZvciB0aGVcbiAgICAgICAgICAvLyBjdXJyZW50IGl0ZXJhdGlvbi4gSWYgdGhlIFByb21pc2UgaXMgcmVqZWN0ZWQsIGhvd2V2ZXIsIHRoZVxuICAgICAgICAgIC8vIHJlc3VsdCBmb3IgdGhpcyBpdGVyYXRpb24gd2lsbCBiZSByZWplY3RlZCB3aXRoIHRoZSBzYW1lXG4gICAgICAgICAgLy8gcmVhc29uLiBOb3RlIHRoYXQgcmVqZWN0aW9ucyBvZiB5aWVsZGVkIFByb21pc2VzIGFyZSBub3RcbiAgICAgICAgICAvLyB0aHJvd24gYmFjayBpbnRvIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24sIGFzIGlzIHRoZSBjYXNlXG4gICAgICAgICAgLy8gd2hlbiBhbiBhd2FpdGVkIFByb21pc2UgaXMgcmVqZWN0ZWQuIFRoaXMgZGlmZmVyZW5jZSBpblxuICAgICAgICAgIC8vIGJlaGF2aW9yIGJldHdlZW4geWllbGQgYW5kIGF3YWl0IGlzIGltcG9ydGFudCwgYmVjYXVzZSBpdFxuICAgICAgICAgIC8vIGFsbG93cyB0aGUgY29uc3VtZXIgdG8gZGVjaWRlIHdoYXQgdG8gZG8gd2l0aCB0aGUgeWllbGRlZFxuICAgICAgICAgIC8vIHJlamVjdGlvbiAoc3dhbGxvdyBpdCBhbmQgY29udGludWUsIG1hbnVhbGx5IC50aHJvdyBpdCBiYWNrXG4gICAgICAgICAgLy8gaW50byB0aGUgZ2VuZXJhdG9yLCBhYmFuZG9uIGl0ZXJhdGlvbiwgd2hhdGV2ZXIpLiBXaXRoXG4gICAgICAgICAgLy8gYXdhaXQsIGJ5IGNvbnRyYXN0LCB0aGVyZSBpcyBubyBvcHBvcnR1bml0eSB0byBleGFtaW5lIHRoZVxuICAgICAgICAgIC8vIHJlamVjdGlvbiByZWFzb24gb3V0c2lkZSB0aGUgZ2VuZXJhdG9yIGZ1bmN0aW9uLCBzbyB0aGVcbiAgICAgICAgICAvLyBvbmx5IG9wdGlvbiBpcyB0byB0aHJvdyBpdCBmcm9tIHRoZSBhd2FpdCBleHByZXNzaW9uLCBhbmRcbiAgICAgICAgICAvLyBsZXQgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBoYW5kbGUgdGhlIGV4Y2VwdGlvbi5cbiAgICAgICAgICByZXN1bHQudmFsdWUgPSB1bndyYXBwZWQ7XG4gICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9LCByZWplY3QpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgaW52b2tlID0gcHJvY2Vzcy5kb21haW4uYmluZChpbnZva2UpO1xuICAgIH1cblxuICAgIHZhciBwcmV2aW91c1Byb21pc2U7XG5cbiAgICBmdW5jdGlvbiBlbnF1ZXVlKG1ldGhvZCwgYXJnKSB7XG4gICAgICBmdW5jdGlvbiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBfUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgaW52b2tlKG1ldGhvZCwgYXJnLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZXZpb3VzUHJvbWlzZSA9XG4gICAgICAvLyBJZiBlbnF1ZXVlIGhhcyBiZWVuIGNhbGxlZCBiZWZvcmUsIHRoZW4gd2Ugd2FudCB0byB3YWl0IHVudGlsXG4gICAgICAvLyBhbGwgcHJldmlvdXMgUHJvbWlzZXMgaGF2ZSBiZWVuIHJlc29sdmVkIGJlZm9yZSBjYWxsaW5nIGludm9rZSxcbiAgICAgIC8vIHNvIHRoYXQgcmVzdWx0cyBhcmUgYWx3YXlzIGRlbGl2ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlci4gSWZcbiAgICAgIC8vIGVucXVldWUgaGFzIG5vdCBiZWVuIGNhbGxlZCBiZWZvcmUsIHRoZW4gaXQgaXMgaW1wb3J0YW50IHRvXG4gICAgICAvLyBjYWxsIGludm9rZSBpbW1lZGlhdGVseSwgd2l0aG91dCB3YWl0aW5nIG9uIGEgY2FsbGJhY2sgdG8gZmlyZSxcbiAgICAgIC8vIHNvIHRoYXQgdGhlIGFzeW5jIGdlbmVyYXRvciBmdW5jdGlvbiBoYXMgdGhlIG9wcG9ydHVuaXR5IHRvIGRvXG4gICAgICAvLyBhbnkgbmVjZXNzYXJ5IHNldHVwIGluIGEgcHJlZGljdGFibGUgd2F5LiBUaGlzIHByZWRpY3RhYmlsaXR5XG4gICAgICAvLyBpcyB3aHkgdGhlIFByb21pc2UgY29uc3RydWN0b3Igc3luY2hyb25vdXNseSBpbnZva2VzIGl0c1xuICAgICAgLy8gZXhlY3V0b3IgY2FsbGJhY2ssIGFuZCB3aHkgYXN5bmMgZnVuY3Rpb25zIHN5bmNocm9ub3VzbHlcbiAgICAgIC8vIGV4ZWN1dGUgY29kZSBiZWZvcmUgdGhlIGZpcnN0IGF3YWl0LiBTaW5jZSB3ZSBpbXBsZW1lbnQgc2ltcGxlXG4gICAgICAvLyBhc3luYyBmdW5jdGlvbnMgaW4gdGVybXMgb2YgYXN5bmMgZ2VuZXJhdG9ycywgaXQgaXMgZXNwZWNpYWxseVxuICAgICAgLy8gaW1wb3J0YW50IHRvIGdldCB0aGlzIHJpZ2h0LCBldmVuIHRob3VnaCBpdCByZXF1aXJlcyBjYXJlLlxuICAgICAgcHJldmlvdXNQcm9taXNlID8gcHJldmlvdXNQcm9taXNlLnRoZW4oY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcsXG4gICAgICAvLyBBdm9pZCBwcm9wYWdhdGluZyBmYWlsdXJlcyB0byBQcm9taXNlcyByZXR1cm5lZCBieSBsYXRlclxuICAgICAgLy8gaW52b2NhdGlvbnMgb2YgdGhlIGl0ZXJhdG9yLlxuICAgICAgY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcpIDogY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcoKTtcbiAgICB9XG5cbiAgICAvLyBEZWZpbmUgdGhlIHVuaWZpZWQgaGVscGVyIG1ldGhvZCB0aGF0IGlzIHVzZWQgdG8gaW1wbGVtZW50IC5uZXh0LFxuICAgIC8vIC50aHJvdywgYW5kIC5yZXR1cm4gKHNlZSBkZWZpbmVJdGVyYXRvck1ldGhvZHMpLlxuICAgIHRoaXMuX2ludm9rZSA9IGVucXVldWU7XG4gIH1cblxuICBkZWZpbmVJdGVyYXRvck1ldGhvZHMoQXN5bmNJdGVyYXRvci5wcm90b3R5cGUpO1xuXG4gIC8vIE5vdGUgdGhhdCBzaW1wbGUgYXN5bmMgZnVuY3Rpb25zIGFyZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAgLy8gQXN5bmNJdGVyYXRvciBvYmplY3RzOyB0aGV5IGp1c3QgcmV0dXJuIGEgUHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9mXG4gIC8vIHRoZSBmaW5hbCByZXN1bHQgcHJvZHVjZWQgYnkgdGhlIGl0ZXJhdG9yLlxuICBydW50aW1lLmFzeW5jID0gZnVuY3Rpb24gKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSB7XG4gICAgdmFyIGl0ZXIgPSBuZXcgQXN5bmNJdGVyYXRvcih3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSk7XG5cbiAgICByZXR1cm4gcnVudGltZS5pc0dlbmVyYXRvckZ1bmN0aW9uKG91dGVyRm4pID8gaXRlciAvLyBJZiBvdXRlckZuIGlzIGEgZ2VuZXJhdG9yLCByZXR1cm4gdGhlIGZ1bGwgaXRlcmF0b3IuXG4gICAgOiBpdGVyLm5leHQoKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQuZG9uZSA/IHJlc3VsdC52YWx1ZSA6IGl0ZXIubmV4dCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1ha2VJbnZva2VNZXRob2QoaW5uZXJGbiwgc2VsZiwgY29udGV4dCkge1xuICAgIHZhciBzdGF0ZSA9IEdlblN0YXRlU3VzcGVuZGVkU3RhcnQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gaW52b2tlKG1ldGhvZCwgYXJnKSB7XG4gICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlRXhlY3V0aW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IHJ1bm5pbmdcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVDb21wbGV0ZWQpIHtcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgdGhyb3cgYXJnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmUgZm9yZ2l2aW5nLCBwZXIgMjUuMy4zLjMuMyBvZiB0aGUgc3BlYzpcbiAgICAgICAgLy8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLWdlbmVyYXRvcnJlc3VtZVxuICAgICAgICByZXR1cm4gZG9uZVJlc3VsdCgpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB2YXIgZGVsZWdhdGUgPSBjb250ZXh0LmRlbGVnYXRlO1xuICAgICAgICBpZiAoZGVsZWdhdGUpIHtcbiAgICAgICAgICBpZiAobWV0aG9kID09PSBcInJldHVyblwiIHx8IG1ldGhvZCA9PT0gXCJ0aHJvd1wiICYmIGRlbGVnYXRlLml0ZXJhdG9yW21ldGhvZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gQSByZXR1cm4gb3IgdGhyb3cgKHdoZW4gdGhlIGRlbGVnYXRlIGl0ZXJhdG9yIGhhcyBubyB0aHJvd1xuICAgICAgICAgICAgLy8gbWV0aG9kKSBhbHdheXMgdGVybWluYXRlcyB0aGUgeWllbGQqIGxvb3AuXG4gICAgICAgICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gSWYgdGhlIGRlbGVnYXRlIGl0ZXJhdG9yIGhhcyBhIHJldHVybiBtZXRob2QsIGdpdmUgaXQgYVxuICAgICAgICAgICAgLy8gY2hhbmNlIHRvIGNsZWFuIHVwLlxuICAgICAgICAgICAgdmFyIHJldHVybk1ldGhvZCA9IGRlbGVnYXRlLml0ZXJhdG9yW1wicmV0dXJuXCJdO1xuICAgICAgICAgICAgaWYgKHJldHVybk1ldGhvZCkge1xuICAgICAgICAgICAgICB2YXIgcmVjb3JkID0gdHJ5Q2F0Y2gocmV0dXJuTWV0aG9kLCBkZWxlZ2F0ZS5pdGVyYXRvciwgYXJnKTtcbiAgICAgICAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmV0dXJuIG1ldGhvZCB0aHJldyBhbiBleGNlcHRpb24sIGxldCB0aGF0XG4gICAgICAgICAgICAgICAgLy8gZXhjZXB0aW9uIHByZXZhaWwgb3ZlciB0aGUgb3JpZ2luYWwgcmV0dXJuIG9yIHRocm93LlxuICAgICAgICAgICAgICAgIG1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgICAgICAgICAgICBhcmcgPSByZWNvcmQuYXJnO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtZXRob2QgPT09IFwicmV0dXJuXCIpIHtcbiAgICAgICAgICAgICAgLy8gQ29udGludWUgd2l0aCB0aGUgb3V0ZXIgcmV0dXJuLCBub3cgdGhhdCB0aGUgZGVsZWdhdGVcbiAgICAgICAgICAgICAgLy8gaXRlcmF0b3IgaGFzIGJlZW4gdGVybWluYXRlZC5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGRlbGVnYXRlLml0ZXJhdG9yW21ldGhvZF0sIGRlbGVnYXRlLml0ZXJhdG9yLCBhcmcpO1xuXG4gICAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICAgIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsO1xuXG4gICAgICAgICAgICAvLyBMaWtlIHJldHVybmluZyBnZW5lcmF0b3IudGhyb3codW5jYXVnaHQpLCBidXQgd2l0aG91dCB0aGVcbiAgICAgICAgICAgIC8vIG92ZXJoZWFkIG9mIGFuIGV4dHJhIGZ1bmN0aW9uIGNhbGwuXG4gICAgICAgICAgICBtZXRob2QgPSBcInRocm93XCI7XG4gICAgICAgICAgICBhcmcgPSByZWNvcmQuYXJnO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRGVsZWdhdGUgZ2VuZXJhdG9yIHJhbiBhbmQgaGFuZGxlZCBpdHMgb3duIGV4Y2VwdGlvbnMgc29cbiAgICAgICAgICAvLyByZWdhcmRsZXNzIG9mIHdoYXQgdGhlIG1ldGhvZCB3YXMsIHdlIGNvbnRpbnVlIGFzIGlmIGl0IGlzXG4gICAgICAgICAgLy8gXCJuZXh0XCIgd2l0aCBhbiB1bmRlZmluZWQgYXJnLlxuICAgICAgICAgIG1ldGhvZCA9IFwibmV4dFwiO1xuICAgICAgICAgIGFyZyA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgIHZhciBpbmZvID0gcmVjb3JkLmFyZztcbiAgICAgICAgICBpZiAoaW5mby5kb25lKSB7XG4gICAgICAgICAgICBjb250ZXh0W2RlbGVnYXRlLnJlc3VsdE5hbWVdID0gaW5mby52YWx1ZTtcbiAgICAgICAgICAgIGNvbnRleHQubmV4dCA9IGRlbGVnYXRlLm5leHRMb2M7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlID0gR2VuU3RhdGVTdXNwZW5kZWRZaWVsZDtcbiAgICAgICAgICAgIHJldHVybiBpbmZvO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gXCJuZXh0XCIpIHtcbiAgICAgICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlU3VzcGVuZGVkWWllbGQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuc2VudCA9IGFyZztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dC5zZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtZXRob2QgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVTdXNwZW5kZWRTdGFydCkge1xuICAgICAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZUNvbXBsZXRlZDtcbiAgICAgICAgICAgIHRocm93IGFyZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29udGV4dC5kaXNwYXRjaEV4Y2VwdGlvbihhcmcpKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGlzcGF0Y2hlZCBleGNlcHRpb24gd2FzIGNhdWdodCBieSBhIGNhdGNoIGJsb2NrLFxuICAgICAgICAgICAgLy8gdGhlbiBsZXQgdGhhdCBjYXRjaCBibG9jayBoYW5kbGUgdGhlIGV4Y2VwdGlvbiBub3JtYWxseS5cbiAgICAgICAgICAgIG1ldGhvZCA9IFwibmV4dFwiO1xuICAgICAgICAgICAgYXJnID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtZXRob2QgPT09IFwicmV0dXJuXCIpIHtcbiAgICAgICAgICBjb250ZXh0LmFicnVwdChcInJldHVyblwiLCBhcmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZUV4ZWN1dGluZztcblxuICAgICAgICB2YXIgcmVjb3JkID0gdHJ5Q2F0Y2goaW5uZXJGbiwgc2VsZiwgY29udGV4dCk7XG4gICAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJub3JtYWxcIikge1xuICAgICAgICAgIC8vIElmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24gZnJvbSBpbm5lckZuLCB3ZSBsZWF2ZSBzdGF0ZSA9PT1cbiAgICAgICAgICAvLyBHZW5TdGF0ZUV4ZWN1dGluZyBhbmQgbG9vcCBiYWNrIGZvciBhbm90aGVyIGludm9jYXRpb24uXG4gICAgICAgICAgc3RhdGUgPSBjb250ZXh0LmRvbmUgPyBHZW5TdGF0ZUNvbXBsZXRlZCA6IEdlblN0YXRlU3VzcGVuZGVkWWllbGQ7XG5cbiAgICAgICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgICAgIHZhbHVlOiByZWNvcmQuYXJnLFxuICAgICAgICAgICAgZG9uZTogY29udGV4dC5kb25lXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChyZWNvcmQuYXJnID09PSBDb250aW51ZVNlbnRpbmVsKSB7XG4gICAgICAgICAgICBpZiAoY29udGV4dC5kZWxlZ2F0ZSAmJiBtZXRob2QgPT09IFwibmV4dFwiKSB7XG4gICAgICAgICAgICAgIC8vIERlbGliZXJhdGVseSBmb3JnZXQgdGhlIGxhc3Qgc2VudCB2YWx1ZSBzbyB0aGF0IHdlIGRvbid0XG4gICAgICAgICAgICAgIC8vIGFjY2lkZW50YWxseSBwYXNzIGl0IG9uIHRvIHRoZSBkZWxlZ2F0ZS5cbiAgICAgICAgICAgICAgYXJnID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW5mbztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIHN0YXRlID0gR2VuU3RhdGVDb21wbGV0ZWQ7XG4gICAgICAgICAgLy8gRGlzcGF0Y2ggdGhlIGV4Y2VwdGlvbiBieSBsb29waW5nIGJhY2sgYXJvdW5kIHRvIHRoZVxuICAgICAgICAgIC8vIGNvbnRleHQuZGlzcGF0Y2hFeGNlcHRpb24oYXJnKSBjYWxsIGFib3ZlLlxuICAgICAgICAgIG1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgICAgICBhcmcgPSByZWNvcmQuYXJnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIERlZmluZSBHZW5lcmF0b3IucHJvdG90eXBlLntuZXh0LHRocm93LHJldHVybn0gaW4gdGVybXMgb2YgdGhlXG4gIC8vIHVuaWZpZWQgLl9pbnZva2UgaGVscGVyIG1ldGhvZC5cbiAgZGVmaW5lSXRlcmF0b3JNZXRob2RzKEdwKTtcblxuICBHcFtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgR3BbdG9TdHJpbmdUYWdTeW1ib2xdID0gXCJHZW5lcmF0b3JcIjtcblxuICBHcC50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IEdlbmVyYXRvcl1cIjtcbiAgfTtcblxuICBmdW5jdGlvbiBwdXNoVHJ5RW50cnkobG9jcykge1xuICAgIHZhciBlbnRyeSA9IHsgdHJ5TG9jOiBsb2NzWzBdIH07XG5cbiAgICBpZiAoMSBpbiBsb2NzKSB7XG4gICAgICBlbnRyeS5jYXRjaExvYyA9IGxvY3NbMV07XG4gICAgfVxuXG4gICAgaWYgKDIgaW4gbG9jcykge1xuICAgICAgZW50cnkuZmluYWxseUxvYyA9IGxvY3NbMl07XG4gICAgICBlbnRyeS5hZnRlckxvYyA9IGxvY3NbM107XG4gICAgfVxuXG4gICAgdGhpcy50cnlFbnRyaWVzLnB1c2goZW50cnkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXRUcnlFbnRyeShlbnRyeSkge1xuICAgIHZhciByZWNvcmQgPSBlbnRyeS5jb21wbGV0aW9uIHx8IHt9O1xuICAgIHJlY29yZC50eXBlID0gXCJub3JtYWxcIjtcbiAgICBkZWxldGUgcmVjb3JkLmFyZztcbiAgICBlbnRyeS5jb21wbGV0aW9uID0gcmVjb3JkO1xuICB9XG5cbiAgZnVuY3Rpb24gQ29udGV4dCh0cnlMb2NzTGlzdCkge1xuICAgIC8vIFRoZSByb290IGVudHJ5IG9iamVjdCAoZWZmZWN0aXZlbHkgYSB0cnkgc3RhdGVtZW50IHdpdGhvdXQgYSBjYXRjaFxuICAgIC8vIG9yIGEgZmluYWxseSBibG9jaykgZ2l2ZXMgdXMgYSBwbGFjZSB0byBzdG9yZSB2YWx1ZXMgdGhyb3duIGZyb21cbiAgICAvLyBsb2NhdGlvbnMgd2hlcmUgdGhlcmUgaXMgbm8gZW5jbG9zaW5nIHRyeSBzdGF0ZW1lbnQuXG4gICAgdGhpcy50cnlFbnRyaWVzID0gW3sgdHJ5TG9jOiBcInJvb3RcIiB9XTtcbiAgICB0cnlMb2NzTGlzdC5mb3JFYWNoKHB1c2hUcnlFbnRyeSwgdGhpcyk7XG4gICAgdGhpcy5yZXNldCh0cnVlKTtcbiAgfVxuXG4gIHJ1bnRpbWUua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGtleXMucHVzaChrZXkpO1xuICAgIH1cbiAgICBrZXlzLnJldmVyc2UoKTtcblxuICAgIC8vIFJhdGhlciB0aGFuIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhIG5leHQgbWV0aG9kLCB3ZSBrZWVwXG4gICAgLy8gdGhpbmdzIHNpbXBsZSBhbmQgcmV0dXJuIHRoZSBuZXh0IGZ1bmN0aW9uIGl0c2VsZi5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCkge1xuICAgICAgICB2YXIga2V5ID0ga2V5cy5wb3AoKTtcbiAgICAgICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICBuZXh0LnZhbHVlID0ga2V5O1xuICAgICAgICAgIG5leHQuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRvIGF2b2lkIGNyZWF0aW5nIGFuIGFkZGl0aW9uYWwgb2JqZWN0LCB3ZSBqdXN0IGhhbmcgdGhlIC52YWx1ZVxuICAgICAgLy8gYW5kIC5kb25lIHByb3BlcnRpZXMgb2ZmIHRoZSBuZXh0IGZ1bmN0aW9uIG9iamVjdCBpdHNlbGYuIFRoaXNcbiAgICAgIC8vIGFsc28gZW5zdXJlcyB0aGF0IHRoZSBtaW5pZmllciB3aWxsIG5vdCBhbm9ueW1pemUgdGhlIGZ1bmN0aW9uLlxuICAgICAgbmV4dC5kb25lID0gdHJ1ZTtcbiAgICAgIHJldHVybiBuZXh0O1xuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gdmFsdWVzKGl0ZXJhYmxlKSB7XG4gICAgaWYgKGl0ZXJhYmxlKSB7XG4gICAgICB2YXIgaXRlcmF0b3JNZXRob2QgPSBpdGVyYWJsZVtpdGVyYXRvclN5bWJvbF07XG4gICAgICBpZiAoaXRlcmF0b3JNZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yTWV0aG9kLmNhbGwoaXRlcmFibGUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGl0ZXJhYmxlLm5leHQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gaXRlcmFibGU7XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNOYU4oaXRlcmFibGUubGVuZ3RoKSkge1xuICAgICAgICB2YXIgaSA9IC0xLFxuICAgICAgICAgICAgbmV4dCA9IGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgd2hpbGUgKCsraSA8IGl0ZXJhYmxlLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGl0ZXJhYmxlLCBpKSkge1xuICAgICAgICAgICAgICBuZXh0LnZhbHVlID0gaXRlcmFibGVbaV07XG4gICAgICAgICAgICAgIG5leHQuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBuZXh0LnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIG5leHQuZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbmV4dC5uZXh0ID0gbmV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gYW4gaXRlcmF0b3Igd2l0aCBubyB2YWx1ZXMuXG4gICAgcmV0dXJuIHsgbmV4dDogZG9uZVJlc3VsdCB9O1xuICB9XG4gIHJ1bnRpbWUudmFsdWVzID0gdmFsdWVzO1xuXG4gIGZ1bmN0aW9uIGRvbmVSZXN1bHQoKSB7XG4gICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICB9XG5cbiAgQ29udGV4dC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IENvbnRleHQsXG5cbiAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoc2tpcFRlbXBSZXNldCkge1xuICAgICAgdGhpcy5wcmV2ID0gMDtcbiAgICAgIHRoaXMubmV4dCA9IDA7XG4gICAgICB0aGlzLnNlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSBudWxsO1xuXG4gICAgICB0aGlzLnRyeUVudHJpZXMuZm9yRWFjaChyZXNldFRyeUVudHJ5KTtcblxuICAgICAgaWYgKCFza2lwVGVtcFJlc2V0KSB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcykge1xuICAgICAgICAgIC8vIE5vdCBzdXJlIGFib3V0IHRoZSBvcHRpbWFsIG9yZGVyIG9mIHRoZXNlIGNvbmRpdGlvbnM6XG4gICAgICAgICAgaWYgKG5hbWUuY2hhckF0KDApID09PSBcInRcIiAmJiBoYXNPd24uY2FsbCh0aGlzLCBuYW1lKSAmJiAhaXNOYU4oK25hbWUuc2xpY2UoMSkpKSB7XG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcblxuICAgICAgdmFyIHJvb3RFbnRyeSA9IHRoaXMudHJ5RW50cmllc1swXTtcbiAgICAgIHZhciByb290UmVjb3JkID0gcm9vdEVudHJ5LmNvbXBsZXRpb247XG4gICAgICBpZiAocm9vdFJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgdGhyb3cgcm9vdFJlY29yZC5hcmc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnJ2YWw7XG4gICAgfSxcblxuICAgIGRpc3BhdGNoRXhjZXB0aW9uOiBmdW5jdGlvbiBkaXNwYXRjaEV4Y2VwdGlvbihleGNlcHRpb24pIHtcbiAgICAgIGlmICh0aGlzLmRvbmUpIHtcbiAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgfVxuXG4gICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG4gICAgICBmdW5jdGlvbiBoYW5kbGUobG9jLCBjYXVnaHQpIHtcbiAgICAgICAgcmVjb3JkLnR5cGUgPSBcInRocm93XCI7XG4gICAgICAgIHJlY29yZC5hcmcgPSBleGNlcHRpb247XG4gICAgICAgIGNvbnRleHQubmV4dCA9IGxvYztcbiAgICAgICAgcmV0dXJuICEhY2F1Z2h0O1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTtcbiAgICAgICAgdmFyIHJlY29yZCA9IGVudHJ5LmNvbXBsZXRpb247XG5cbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA9PT0gXCJyb290XCIpIHtcbiAgICAgICAgICAvLyBFeGNlcHRpb24gdGhyb3duIG91dHNpZGUgb2YgYW55IHRyeSBibG9jayB0aGF0IGNvdWxkIGhhbmRsZVxuICAgICAgICAgIC8vIGl0LCBzbyBzZXQgdGhlIGNvbXBsZXRpb24gdmFsdWUgb2YgdGhlIGVudGlyZSBmdW5jdGlvbiB0b1xuICAgICAgICAgIC8vIHRocm93IHRoZSBleGNlcHRpb24uXG4gICAgICAgICAgcmV0dXJuIGhhbmRsZShcImVuZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbnRyeS50cnlMb2MgPD0gdGhpcy5wcmV2KSB7XG4gICAgICAgICAgdmFyIGhhc0NhdGNoID0gaGFzT3duLmNhbGwoZW50cnksIFwiY2F0Y2hMb2NcIik7XG4gICAgICAgICAgdmFyIGhhc0ZpbmFsbHkgPSBoYXNPd24uY2FsbChlbnRyeSwgXCJmaW5hbGx5TG9jXCIpO1xuXG4gICAgICAgICAgaWYgKGhhc0NhdGNoICYmIGhhc0ZpbmFsbHkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5jYXRjaExvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmNhdGNoTG9jLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcmV2IDwgZW50cnkuZmluYWxseUxvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmZpbmFsbHlMb2MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5jYXRjaExvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmNhdGNoTG9jLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc0ZpbmFsbHkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuZmluYWxseUxvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRyeSBzdGF0ZW1lbnQgd2l0aG91dCBjYXRjaCBvciBmaW5hbGx5XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBhYnJ1cHQ6IGZ1bmN0aW9uIGFicnVwdCh0eXBlLCBhcmcpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICBpZiAoZW50cnkudHJ5TG9jIDw9IHRoaXMucHJldiAmJiBoYXNPd24uY2FsbChlbnRyeSwgXCJmaW5hbGx5TG9jXCIpICYmIHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHtcbiAgICAgICAgICB2YXIgZmluYWxseUVudHJ5ID0gZW50cnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZpbmFsbHlFbnRyeSAmJiAodHlwZSA9PT0gXCJicmVha1wiIHx8IHR5cGUgPT09IFwiY29udGludWVcIikgJiYgZmluYWxseUVudHJ5LnRyeUxvYyA8PSBhcmcgJiYgYXJnIDw9IGZpbmFsbHlFbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgZmluYWxseSBlbnRyeSBpZiBjb250cm9sIGlzIG5vdCBqdW1waW5nIHRvIGFcbiAgICAgICAgLy8gbG9jYXRpb24gb3V0c2lkZSB0aGUgdHJ5L2NhdGNoIGJsb2NrLlxuICAgICAgICBmaW5hbGx5RW50cnkgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVjb3JkID0gZmluYWxseUVudHJ5ID8gZmluYWxseUVudHJ5LmNvbXBsZXRpb24gOiB7fTtcbiAgICAgIHJlY29yZC50eXBlID0gdHlwZTtcbiAgICAgIHJlY29yZC5hcmcgPSBhcmc7XG5cbiAgICAgIGlmIChmaW5hbGx5RW50cnkpIHtcbiAgICAgICAgdGhpcy5uZXh0ID0gZmluYWxseUVudHJ5LmZpbmFsbHlMb2M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbXBsZXRlKHJlY29yZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH0sXG5cbiAgICBjb21wbGV0ZTogZnVuY3Rpb24gY29tcGxldGUocmVjb3JkLCBhZnRlckxvYykge1xuICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgdGhyb3cgcmVjb3JkLmFyZztcbiAgICAgIH1cblxuICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcImJyZWFrXCIgfHwgcmVjb3JkLnR5cGUgPT09IFwiY29udGludWVcIikge1xuICAgICAgICB0aGlzLm5leHQgPSByZWNvcmQuYXJnO1xuICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gXCJyZXR1cm5cIikge1xuICAgICAgICB0aGlzLnJ2YWwgPSByZWNvcmQuYXJnO1xuICAgICAgICB0aGlzLm5leHQgPSBcImVuZFwiO1xuICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gXCJub3JtYWxcIiAmJiBhZnRlckxvYykge1xuICAgICAgICB0aGlzLm5leHQgPSBhZnRlckxvYztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZmluaXNoOiBmdW5jdGlvbiBmaW5pc2goZmluYWxseUxvYykge1xuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07XG4gICAgICAgIGlmIChlbnRyeS5maW5hbGx5TG9jID09PSBmaW5hbGx5TG9jKSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZShlbnRyeS5jb21wbGV0aW9uLCBlbnRyeS5hZnRlckxvYyk7XG4gICAgICAgICAgcmVzZXRUcnlFbnRyeShlbnRyeSk7XG4gICAgICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgXCJjYXRjaFwiOiBmdW5jdGlvbiBfY2F0Y2godHJ5TG9jKSB7XG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTtcbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA9PT0gdHJ5TG9jKSB7XG4gICAgICAgICAgdmFyIHJlY29yZCA9IGVudHJ5LmNvbXBsZXRpb247XG4gICAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICAgIHZhciB0aHJvd24gPSByZWNvcmQuYXJnO1xuICAgICAgICAgICAgcmVzZXRUcnlFbnRyeShlbnRyeSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aHJvd247XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGNvbnRleHQuY2F0Y2ggbWV0aG9kIG11c3Qgb25seSBiZSBjYWxsZWQgd2l0aCBhIGxvY2F0aW9uXG4gICAgICAvLyBhcmd1bWVudCB0aGF0IGNvcnJlc3BvbmRzIHRvIGEga25vd24gY2F0Y2ggYmxvY2suXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbGxlZ2FsIGNhdGNoIGF0dGVtcHRcIik7XG4gICAgfSxcblxuICAgIGRlbGVnYXRlWWllbGQ6IGZ1bmN0aW9uIGRlbGVnYXRlWWllbGQoaXRlcmFibGUsIHJlc3VsdE5hbWUsIG5leHRMb2MpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSB7XG4gICAgICAgIGl0ZXJhdG9yOiB2YWx1ZXMoaXRlcmFibGUpLFxuICAgICAgICByZXN1bHROYW1lOiByZXN1bHROYW1lLFxuICAgICAgICBuZXh0TG9jOiBuZXh0TG9jXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgICB9XG4gIH07XG59KShcbi8vIEFtb25nIHRoZSB2YXJpb3VzIHRyaWNrcyBmb3Igb2J0YWluaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWxcbi8vIG9iamVjdCwgdGhpcyBzZWVtcyB0byBiZSB0aGUgbW9zdCByZWxpYWJsZSB0ZWNobmlxdWUgdGhhdCBkb2VzIG5vdFxuLy8gdXNlIGluZGlyZWN0IGV2YWwgKHdoaWNoIHZpb2xhdGVzIENvbnRlbnQgU2VjdXJpdHkgUG9saWN5KS5cbnR5cGVvZiBnbG9iYWwgPT09IFwib2JqZWN0XCIgPyBnbG9iYWwgOiB0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiID8gd2luZG93IDogdHlwZW9mIHNlbGYgPT09IFwib2JqZWN0XCIgPyBzZWxmIDogdW5kZWZpbmVkKTsiXX0=
},{"_process":"/home/jon/Dropbox/dev/sudoku/node_modules/process/browser.js","babel-runtime/core-js/object/create":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/object/create.js","babel-runtime/core-js/object/set-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/object/set-prototype-of.js","babel-runtime/core-js/promise":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/promise.js","babel-runtime/core-js/symbol":"/home/jon/Dropbox/dev/sudoku/node_modules/babel-runtime/core-js/symbol.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/array/from.js":[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/es6.array.from');
module.exports = require('../../modules/$.core').Array.from;
},{"../../modules/$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","../../modules/es6.array.from":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.array.from.js","../../modules/es6.string.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.string.iterator.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/json/stringify.js":[function(require,module,exports){
var core = require('../../modules/$.core');
module.exports = function stringify(it){ // eslint-disable-line no-unused-vars
  return (core.JSON && core.JSON.stringify || JSON.stringify).apply(JSON, arguments);
};
},{"../../modules/$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/object/create.js":[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function create(P, D){
  return $.create(P, D);
};
},{"../../modules/$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/object/set-prototype-of.js":[function(require,module,exports){
require('../../modules/es6.object.set-prototype-of');
module.exports = require('../../modules/$.core').Object.setPrototypeOf;
},{"../../modules/$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","../../modules/es6.object.set-prototype-of":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.object.set-prototype-of.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/promise.js":[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.promise');
module.exports = require('../modules/$.core').Promise;
},{"../modules/$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","../modules/es6.object.to-string":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.object.to-string.js","../modules/es6.promise":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.promise.js","../modules/es6.string.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.string.iterator.js","../modules/web.dom.iterable":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/web.dom.iterable.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/set.js":[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.set');
require('../modules/es7.set.to-json');
module.exports = require('../modules/$.core').Set;
},{"../modules/$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","../modules/es6.object.to-string":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.object.to-string.js","../modules/es6.set":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.set.js","../modules/es6.string.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.string.iterator.js","../modules/es7.set.to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es7.set.to-json.js","../modules/web.dom.iterable":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/web.dom.iterable.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/fn/symbol/index.js":[function(require,module,exports){
require('../../modules/es6.symbol');
require('../../modules/es6.object.to-string');
module.exports = require('../../modules/$.core').Symbol;
},{"../../modules/$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","../../modules/es6.object.to-string":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.object.to-string.js","../../modules/es6.symbol":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.symbol.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.a-function.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_a-function.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.add-to-unscopables.js":[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js":[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.classof.js":[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./$.cof')
  , TAG = require('./$.wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./$.cof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.cof.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.cof.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_cof.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.collection-strong.js":[function(require,module,exports){
'use strict';
var $            = require('./$')
  , hide         = require('./$.hide')
  , redefineAll  = require('./$.redefine-all')
  , ctx          = require('./$.ctx')
  , strictNew    = require('./$.strict-new')
  , defined      = require('./$.defined')
  , forOf        = require('./$.for-of')
  , $iterDefine  = require('./$.iter-define')
  , step         = require('./$.iter-step')
  , ID           = require('./$.uid')('id')
  , $has         = require('./$.has')
  , isObject     = require('./$.is-object')
  , setSpecies   = require('./$.set-species')
  , DESCRIPTORS  = require('./$.descriptors')
  , isExtensible = Object.isExtensible || isObject
  , SIZE         = DESCRIPTORS ? '_s' : 'size'
  , id           = 0;

var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!$has(it, ID)){
    // can't set id to frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add id
    if(!create)return 'E';
    // add missing object id
    hide(it, ID, ++id);
  // return object id with prefix
  } return 'O' + it[ID];
};

var getEntry = function(that, key){
  // fast case
  var index = fastKey(key), entry;
  if(index !== 'F')return that._i[index];
  // frozen object case
  for(entry = that._f; entry; entry = entry.n){
    if(entry.k == key)return entry;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      strictNew(that, C, NAME);
      that._i = $.create(null); // index
      that._f = undefined;      // first entry
      that._l = undefined;      // last entry
      that[SIZE] = 0;           // size
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear(){
        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
          entry.r = true;
          if(entry.p)entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(key){
        var that  = this
          , entry = getEntry(that, key);
        if(entry){
          var next = entry.n
            , prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if(prev)prev.n = next;
          if(next)next.p = prev;
          if(that._f == entry)that._f = next;
          if(that._l == entry)that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /*, that = undefined */){
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
          , entry;
        while(entry = entry ? entry.n : this._f){
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while(entry && entry.r)entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key){
        return !!getEntry(this, key);
      }
    });
    if(DESCRIPTORS)$.setDesc(C.prototype, 'size', {
      get: function(){
        return defined(this[SIZE]);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry){
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that._f)that._f = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index !== 'F')that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function(C, NAME, IS_MAP){
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function(iterated, kind){
      this._t = iterated;  // target
      this._k = kind;      // kind
      this._l = undefined; // previous
    }, function(){
      var that  = this
        , kind  = that._k
        , entry = that._l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if(kind == 'keys'  )return step(0, entry.k);
      if(kind == 'values')return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.defined":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.defined.js","./$.descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js","./$.for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.for-of.js","./$.has":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.has.js","./$.hide":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.hide.js","./$.is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js","./$.iter-define":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-define.js","./$.iter-step":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-step.js","./$.redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine-all.js","./$.set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-species.js","./$.strict-new":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.strict-new.js","./$.uid":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.collection-to-json.js":[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var forOf   = require('./$.for-of')
  , classof = require('./$.classof');
module.exports = function(NAME){
  return function toJSON(){
    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
    var arr = [];
    forOf(this, false, arr.push, arr);
    return arr;
  };
};
},{"./$.classof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.classof.js","./$.for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.for-of.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.collection.js":[function(require,module,exports){
'use strict';
var $              = require('./$')
  , global         = require('./$.global')
  , $export        = require('./$.export')
  , fails          = require('./$.fails')
  , hide           = require('./$.hide')
  , redefineAll    = require('./$.redefine-all')
  , forOf          = require('./$.for-of')
  , strictNew      = require('./$.strict-new')
  , isObject       = require('./$.is-object')
  , setToStringTag = require('./$.set-to-string-tag')
  , DESCRIPTORS    = require('./$.descriptors');

module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
  var Base  = global[NAME]
    , C     = Base
    , ADDER = IS_MAP ? 'set' : 'add'
    , proto = C && C.prototype
    , O     = {};
  if(!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
    new C().entries().next();
  }))){
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
  } else {
    C = wrapper(function(target, iterable){
      strictNew(target, C, NAME);
      target._c = new Base;
      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
    });
    $.each.call('add,clear,delete,forEach,get,has,set,keys,values,entries'.split(','),function(KEY){
      var IS_ADDER = KEY == 'add' || KEY == 'set';
      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
        if(!IS_ADDER && IS_WEAK && !isObject(a))return KEY == 'get' ? undefined : false;
        var result = this._c[KEY](a === 0 ? 0 : a, b);
        return IS_ADDER ? this : result;
      });
    });
    if('size' in proto)$.setDesc(C.prototype, 'size', {
      get: function(){
        return this._c.size;
      }
    });
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F, O);

  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

  return C;
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js","./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js","./$.fails":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.fails.js","./$.for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.for-of.js","./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.hide":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.hide.js","./$.is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js","./$.redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine-all.js","./$.set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-to-string-tag.js","./$.strict-new":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.strict-new.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js":[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js":[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.a-function.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.defined.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_defined.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js":[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.fails.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.dom-create.js":[function(require,module,exports){
var isObject = require('./$.is-object')
  , document = require('./$.global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.enum-keys.js":[function(require,module,exports){
// all enumerable object keys, includes symbols
var $ = require('./$');
module.exports = function(it){
  var keys       = $.getKeys(it)
    , getSymbols = $.getSymbols;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = $.isEnum
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
  }
  return keys;
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js":[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , ctx       = require('./$.ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    if(IS_PROTO)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"./$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.fails.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_fails.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.for-of.js":[function(require,module,exports){
var ctx         = require('./$.ctx')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , anObject    = require('./$.an-object')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
module.exports = function(iterable, entries, fn, that){
  var iterFn = getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"./$.an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js","./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.is-array-iter":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-array-iter.js","./$.iter-call":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-call.js","./$.to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-length.js","./core.get-iterator-method":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/core.get-iterator-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.get-names.js":[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./$.to-iobject')
  , getNames  = require('./$').getNames
  , toString  = {}.toString;

var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return getNames(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.get = function getOwnPropertyNames(it){
  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
  return getNames(toIObject(it));
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_global.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.has.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_has.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.hide.js":[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js","./$.property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.property-desc.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.html.js":[function(require,module,exports){
module.exports = require('./$.global').document && document.documentElement;
},{"./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.invoke.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_invoke.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iobject.js":[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.cof.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-array-iter.js":[function(require,module,exports){
// check on default Array iterator
var Iterators  = require('./$.iterators')
  , ITERATOR   = require('./$.wks')('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
},{"./$.iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iterators.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-array.js":[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.cof.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_is-object.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-call.js":[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./$.an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./$.an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-create.js":[function(require,module,exports){
'use strict';
var $              = require('./$')
  , descriptor     = require('./$.property-desc')
  , setToStringTag = require('./$.set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./$.hide')(IteratorPrototype, require('./$.wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.hide":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.hide.js","./$.property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.property-desc.js","./$.set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-to-string-tag.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-define.js":[function(require,module,exports){
'use strict';
var LIBRARY        = require('./$.library')
  , $export        = require('./$.export')
  , redefine       = require('./$.redefine')
  , hide           = require('./$.hide')
  , has            = require('./$.has')
  , Iterators      = require('./$.iterators')
  , $iterCreate    = require('./$.iter-create')
  , setToStringTag = require('./$.set-to-string-tag')
  , getProto       = require('./$').getProto
  , ITERATOR       = require('./$.wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , methods, key;
  // Fix native
  if($native){
    var IteratorPrototype = getProto($default.call(new Base));
    // Set @@toStringTag to native iterators
    setToStringTag(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    // fix Array#{values, @@iterator}.name in V8 / FF
    if(DEF_VALUES && $native.name !== VALUES){
      VALUES_BUG = true;
      $default = function values(){ return $native.call(this); };
    }
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES  ? $default : getMethod(VALUES),
      keys:    IS_SET      ? $default : getMethod(KEYS),
      entries: !DEF_VALUES ? $default : getMethod('entries')
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js","./$.has":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.has.js","./$.hide":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.hide.js","./$.iter-create":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-create.js","./$.iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iterators.js","./$.library":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.library.js","./$.redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine.js","./$.set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-to-string-tag.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-detect.js":[function(require,module,exports){
var ITERATOR     = require('./$.wks')('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ safe = true; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-step.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iter-step.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iterators.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_iterators.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js":[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.keyof.js":[function(require,module,exports){
var $         = require('./$')
  , toIObject = require('./$.to-iobject');
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = $.getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.library.js":[function(require,module,exports){
module.exports = true;
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.microtask.js":[function(require,module,exports){
var global    = require('./$.global')
  , macrotask = require('./$.task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = require('./$.cof')(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, domain, fn;
  if(isNode && (parent = process.domain)){
    process.domain = null;
    parent.exit();
  }
  while(head){
    domain = head.domain;
    fn     = head.fn;
    if(domain)domain.enter();
    fn(); // <- currently we use it only for Promise - try / catch not required
    if(domain)domain.exit();
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = 1
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = -toggle;
  };
// environments with maybe non-completely correct, but existent Promise
} else if(Promise && Promise.resolve){
  notify = function(){
    Promise.resolve().then(flush);
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function asap(fn){
  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"./$.cof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.cof.js","./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.task":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.task.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.property-desc.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_property-desc.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine-all.js":[function(require,module,exports){
var redefine = require('./$.redefine');
module.exports = function(target, src){
  for(var key in src)redefine(target, key, src[key]);
  return target;
};
},{"./$.redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine.js":[function(require,module,exports){
module.exports = require('./$.hide');
},{"./$.hide":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.hide.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.same-value.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_same-value.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-proto.js":[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = require('./$').getDesc
  , isObject = require('./$.is-object')
  , anObject = require('./$.an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./$.ctx')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js","./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-species.js":[function(require,module,exports){
'use strict';
var core        = require('./$.core')
  , $           = require('./$')
  , DESCRIPTORS = require('./$.descriptors')
  , SPECIES     = require('./$.wks')('species');

module.exports = function(KEY){
  var C = core[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","./$.descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-to-string-tag.js":[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.has":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.has.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.shared.js":[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.species-constructor.js":[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./$.an-object')
  , aFunction = require('./$.a-function')
  , SPECIES   = require('./$.wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./$.a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.a-function.js","./$.an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.strict-new.js":[function(require,module,exports){
module.exports = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.string-at.js":[function(require,module,exports){
var toInteger = require('./$.to-integer')
  , defined   = require('./$.defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$.defined":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.defined.js","./$.to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.task.js":[function(require,module,exports){
var ctx                = require('./$.ctx')
  , invoke             = require('./$.invoke')
  , html               = require('./$.html')
  , cel                = require('./$.dom-create')
  , global             = require('./$.global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listner = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./$.cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listner, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./$.cof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.cof.js","./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.dom-create":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.dom-create.js","./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.html":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.html.js","./$.invoke":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.invoke.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-integer.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_to-integer.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-iobject.js":[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.defined.js","./$.iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-length.js":[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-integer.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-object.js":[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.defined.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.uid.js":[function(require,module,exports){
arguments[4]["/home/jon/Dropbox/dev/sudoku/node_modules/babel-polyfill/node_modules/core-js/modules/_uid.js"][0].apply(exports,arguments)
},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js":[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , uid    = require('./$.uid')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.shared":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.shared.js","./$.uid":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.uid.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/core.get-iterator-method.js":[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.classof.js","./$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","./$.iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iterators.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.array.from.js":[function(require,module,exports){
'use strict';
var ctx         = require('./$.ctx')
  , $export     = require('./$.export')
  , toObject    = require('./$.to-object')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
$export($export.S + $export.F * !require('./$.iter-detect')(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , $$      = arguments
      , $$len   = $$.length
      , mapfn   = $$len > 1 ? $$[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, $$len > 2 ? $$[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        result[index] = mapping ? mapfn(O[index], index) : O[index];
      }
    }
    result.length = index;
    return result;
  }
});

},{"./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js","./$.is-array-iter":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-array-iter.js","./$.iter-call":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-call.js","./$.iter-detect":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-detect.js","./$.to-length":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-length.js","./$.to-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-object.js","./core.get-iterator-method":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/core.get-iterator-method.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.array.iterator.js":[function(require,module,exports){
'use strict';
var addToUnscopables = require('./$.add-to-unscopables')
  , step             = require('./$.iter-step')
  , Iterators        = require('./$.iterators')
  , toIObject        = require('./$.to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./$.add-to-unscopables":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.add-to-unscopables.js","./$.iter-define":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-define.js","./$.iter-step":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-step.js","./$.iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iterators.js","./$.to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-iobject.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.object.set-prototype-of.js":[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./$.export');
$export($export.S, 'Object', {setPrototypeOf: require('./$.set-proto').set});
},{"./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js","./$.set-proto":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-proto.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.object.to-string.js":[function(require,module,exports){

},{}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.promise.js":[function(require,module,exports){
'use strict';
var $          = require('./$')
  , LIBRARY    = require('./$.library')
  , global     = require('./$.global')
  , ctx        = require('./$.ctx')
  , classof    = require('./$.classof')
  , $export    = require('./$.export')
  , isObject   = require('./$.is-object')
  , anObject   = require('./$.an-object')
  , aFunction  = require('./$.a-function')
  , strictNew  = require('./$.strict-new')
  , forOf      = require('./$.for-of')
  , setProto   = require('./$.set-proto').set
  , same       = require('./$.same-value')
  , SPECIES    = require('./$.wks')('species')
  , speciesConstructor = require('./$.species-constructor')
  , asap       = require('./$.microtask')
  , PROMISE    = 'Promise'
  , process    = global.process
  , isNode     = classof(process) == 'process'
  , P          = global[PROMISE]
  , Wrapper;

var testResolve = function(sub){
  var test = new P(function(){});
  if(sub)test.constructor = Object;
  return P.resolve(test) === test;
};

var USE_NATIVE = function(){
  var works = false;
  function P2(x){
    var self = new P(x);
    setProto(self, P2.prototype);
    return self;
  }
  try {
    works = P && P.resolve && testResolve();
    setProto(P2, P);
    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
    // actual Firefox has broken subclass support, test that
    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
      works = false;
    }
    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
    if(works && require('./$.descriptors')){
      var thenableThenGotten = false;
      P.resolve($.setDesc({}, 'then', {
        get: function(){ thenableThenGotten = true; }
      }));
      works = thenableThenGotten;
    }
  } catch(e){ works = false; }
  return works;
}();

// helpers
var sameConstructor = function(a, b){
  // library wrapper special case
  if(LIBRARY && a === P && b === Wrapper)return true;
  return same(a, b);
};
var getConstructor = function(C){
  var S = anObject(C)[SPECIES];
  return S != undefined ? S : C;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var PromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve),
  this.reject  = aFunction(reject)
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(record, isReject){
  if(record.n)return;
  record.n = true;
  var chain = record.c;
  asap(function(){
    var value = record.v
      , ok    = record.s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , result, then;
      try {
        if(handler){
          if(!ok)record.h = true;
          result = handler === true ? value : handler(value);
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    chain.length = 0;
    record.n = false;
    if(isReject)setTimeout(function(){
      var promise = record.p
        , handler, console;
      if(isUnhandled(promise)){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      } record.a = undefined;
    }, 1);
  });
};
var isUnhandled = function(promise){
  var record = promise._d
    , chain  = record.a || record.c
    , i      = 0
    , reaction;
  if(record.h)return false;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var $reject = function(value){
  var record = this;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  record.v = value;
  record.s = 2;
  record.a = record.c.slice();
  notify(record, true);
};
var $resolve = function(value){
  var record = this
    , then;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  try {
    if(record.p === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      asap(function(){
        var wrapper = {r: record, d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      record.v = value;
      record.s = 1;
      notify(record, false);
    }
  } catch(e){
    $reject.call({r: record, d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  P = function Promise(executor){
    aFunction(executor);
    var record = this._d = {
      p: strictNew(this, P, PROMISE),         // <- promise
      c: [],                                  // <- awaiting reactions
      a: undefined,                           // <- checked in isUnhandled reactions
      s: 0,                                   // <- state
      d: false,                               // <- done
      v: undefined,                           // <- value
      h: false,                               // <- handled rejection
      n: false                                // <- notify
    };
    try {
      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
    } catch(err){
      $reject.call(record, err);
    }
  };
  require('./$.redefine-all')(P.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction = new PromiseCapability(speciesConstructor(this, P))
        , promise  = reaction.promise
        , record   = this._d;
      reaction.ok   = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      record.c.push(reaction);
      if(record.a)record.a.push(reaction);
      if(record.s)notify(record, false);
      return promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: P});
require('./$.set-to-string-tag')(P, PROMISE);
require('./$.set-species')(PROMISE);
Wrapper = require('./$.core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = new PromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof P && sameConstructor(x.constructor, this))return x;
    var capability = new PromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./$.iter-detect')(function(iter){
  P.all(iter)['catch'](function(){});
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject
      , values     = [];
    var abrupt = perform(function(){
      forOf(iterable, false, values.push, values);
      var remaining = values.length
        , results   = Array(remaining);
      if(remaining)$.each.call(values, function(promise, index){
        var alreadyCalled = false;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled = true;
          results[index] = value;
          --remaining || resolve(results);
        }, reject);
      });
      else resolve(results);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.a-function":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.a-function.js","./$.an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js","./$.classof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.classof.js","./$.core":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.core.js","./$.ctx":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.ctx.js","./$.descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js","./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js","./$.for-of":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.for-of.js","./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.is-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-object.js","./$.iter-detect":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-detect.js","./$.library":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.library.js","./$.microtask":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.microtask.js","./$.redefine-all":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine-all.js","./$.same-value":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.same-value.js","./$.set-proto":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-proto.js","./$.set-species":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-species.js","./$.set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-to-string-tag.js","./$.species-constructor":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.species-constructor.js","./$.strict-new":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.strict-new.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.set.js":[function(require,module,exports){
'use strict';
var strong = require('./$.collection-strong');

// 23.2 Set Objects
require('./$.collection')('Set', function(get){
  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value){
    return strong.def(this, value = value === 0 ? 0 : value, value);
  }
}, strong);
},{"./$.collection":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.collection.js","./$.collection-strong":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.collection-strong.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.string.iterator.js":[function(require,module,exports){
'use strict';
var $at  = require('./$.string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./$.iter-define":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iter-define.js","./$.string-at":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.string-at.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.symbol.js":[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var $              = require('./$')
  , global         = require('./$.global')
  , has            = require('./$.has')
  , DESCRIPTORS    = require('./$.descriptors')
  , $export        = require('./$.export')
  , redefine       = require('./$.redefine')
  , $fails         = require('./$.fails')
  , shared         = require('./$.shared')
  , setToStringTag = require('./$.set-to-string-tag')
  , uid            = require('./$.uid')
  , wks            = require('./$.wks')
  , keyOf          = require('./$.keyof')
  , $names         = require('./$.get-names')
  , enumKeys       = require('./$.enum-keys')
  , isArray        = require('./$.is-array')
  , anObject       = require('./$.an-object')
  , toIObject      = require('./$.to-iobject')
  , createDesc     = require('./$.property-desc')
  , getDesc        = $.getDesc
  , setDesc        = $.setDesc
  , _create        = $.create
  , getNames       = $names.get
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , setter         = false
  , HIDDEN         = wks('_hidden')
  , isEnum         = $.isEnum
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , useNative      = typeof $Symbol == 'function'
  , ObjectProto    = Object.prototype;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(setDesc({}, 'a', {
    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = getDesc(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  setDesc(it, key, D);
  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
} : setDesc;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol.prototype);
  sym._k = tag;
  DESCRIPTORS && setter && setSymbolDesc(ObjectProto, tag, {
    configurable: true,
    set: function(value){
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    }
  });
  return sym;
};

var isSymbol = function(it){
  return typeof it == 'symbol';
};

var $defineProperty = function defineProperty(it, key, D){
  if(D && has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return setDesc(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key);
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
    ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  var D = getDesc(it = toIObject(it), key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
  return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
  return result;
};
var $stringify = function stringify(it){
  if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
  var args = [it]
    , i    = 1
    , $$   = arguments
    , replacer, $replacer;
  while($$.length > i)args.push($$[i++]);
  replacer = args[1];
  if(typeof replacer == 'function')$replacer = replacer;
  if($replacer || !isArray(replacer))replacer = function(key, value){
    if($replacer)value = $replacer.call(this, key, value);
    if(!isSymbol(value))return value;
  };
  args[1] = replacer;
  return _stringify.apply($JSON, args);
};
var buggyJSON = $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
});

// 19.4.1.1 Symbol([description])
if(!useNative){
  $Symbol = function Symbol(){
    if(isSymbol(this))throw TypeError('Symbol is not a constructor');
    return wrap(uid(arguments.length > 0 ? arguments[0] : undefined));
  };
  redefine($Symbol.prototype, 'toString', function toString(){
    return this._k;
  });

  isSymbol = function(it){
    return it instanceof $Symbol;
  };

  $.create     = $create;
  $.isEnum     = $propertyIsEnumerable;
  $.getDesc    = $getOwnPropertyDescriptor;
  $.setDesc    = $defineProperty;
  $.setDescs   = $defineProperties;
  $.getNames   = $names.get = $getOwnPropertyNames;
  $.getSymbols = $getOwnPropertySymbols;

  if(DESCRIPTORS && !require('./$.library')){
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }
}

var symbolStatics = {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    return keyOf(SymbolRegistry, key);
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
};
// 19.4.2.2 Symbol.hasInstance
// 19.4.2.3 Symbol.isConcatSpreadable
// 19.4.2.4 Symbol.iterator
// 19.4.2.6 Symbol.match
// 19.4.2.8 Symbol.replace
// 19.4.2.9 Symbol.search
// 19.4.2.10 Symbol.species
// 19.4.2.11 Symbol.split
// 19.4.2.12 Symbol.toPrimitive
// 19.4.2.13 Symbol.toStringTag
// 19.4.2.14 Symbol.unscopables
$.each.call((
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
  'species,split,toPrimitive,toStringTag,unscopables'
).split(','), function(it){
  var sym = wks(it);
  symbolStatics[it] = useNative ? sym : wrap(sym);
});

setter = true;

$export($export.G + $export.W, {Symbol: $Symbol});

$export($export.S, 'Symbol', symbolStatics);

$export($export.S + $export.F * !useNative, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!useNative || buggyJSON), 'JSON', {stringify: $stringify});

// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);
},{"./$":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.js","./$.an-object":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.an-object.js","./$.descriptors":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.descriptors.js","./$.enum-keys":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.enum-keys.js","./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js","./$.fails":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.fails.js","./$.get-names":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.get-names.js","./$.global":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.global.js","./$.has":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.has.js","./$.is-array":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.is-array.js","./$.keyof":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.keyof.js","./$.library":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.library.js","./$.property-desc":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.property-desc.js","./$.redefine":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.redefine.js","./$.set-to-string-tag":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.set-to-string-tag.js","./$.shared":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.shared.js","./$.to-iobject":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.to-iobject.js","./$.uid":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.uid.js","./$.wks":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.wks.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es7.set.to-json.js":[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./$.export');

$export($export.P, 'Set', {toJSON: require('./$.collection-to-json')('Set')});
},{"./$.collection-to-json":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.collection-to-json.js","./$.export":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.export.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/web.dom.iterable.js":[function(require,module,exports){
require('./es6.array.iterator');
var Iterators = require('./$.iterators');
Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
},{"./$.iterators":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/$.iterators.js","./es6.array.iterator":"/home/jon/Dropbox/dev/sudoku/node_modules/core-js/library/modules/es6.array.iterator.js"}],"/home/jon/Dropbox/dev/sudoku/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},["./script.js"])