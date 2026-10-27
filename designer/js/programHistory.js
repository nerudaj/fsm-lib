class ProgramHistory {
    constructor() {
        /** @type{string[]} */
        this.history = [];

        /** @type{number} */
        this.historyIndex = -1;
    }

    /**
     * @param {string} snapshot 
     */
    addSnapshot(snapshot) {
        // Remove any redo history if we are not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(snapshot);
        this.historyIndex++;
    }

    /**
     * @returns {string|null}
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.history[this.historyIndex];
        }
        return null; // No more history to undo
    }

    /**
     * @returns {string|null}
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            return this.history[this.historyIndex];
        }
        return null; // No more history to redo
    }
}