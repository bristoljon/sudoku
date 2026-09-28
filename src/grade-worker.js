// Grades off the main thread: the hardest puzzles take a few seconds on a
// phone and would otherwise freeze the page.
import { grade } from './grader.js';

self.onmessage = ({ data: { id, values } }) => {
  try {
    self.postMessage({ id, result: grade(values) });
  }
  catch (e) {
    self.postMessage({ id, error: e.message });
  }
};
