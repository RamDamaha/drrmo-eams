import '@testing-library/jest-dom/vitest';

// jsdom has no modal <dialog> support yet. This stand-in only toggles the open state.
if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
    };
}
