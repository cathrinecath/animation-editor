import "@testing-library/jest-dom/vitest";

// jsdom does not implement the Pointer Capture API. Stub these as no-ops so
// pointer-event handlers that call them (e.g. useDrag) don't throw in tests.
// In a real browser these are provided by the platform.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
