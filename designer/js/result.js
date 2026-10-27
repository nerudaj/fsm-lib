class Result {
    /**
     * @param {boolean} isOk 
     * @param {string} errorMessage 
     */
    constructor(isOk, errorMessage) {
        /** @type {boolean} */ this.success = isOk;
        /** @type {string} */ this.message = errorMessage;
    }
}
