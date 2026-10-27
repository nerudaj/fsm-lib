/**
 * @param {any} obj 
 */
function ManifestModel(obj) {
    /** @type {number} */
    this.version = 1;
    /** @type {string[]} */
    this.actionNames = [];
    /** @type {string[]} */
    this.conditionNames = [];

    if (obj === null) {
        return;
    }
    else if (obj["version"] !== 1) {
        console.log("Unsupported or missing manifest version");
    }

    for (const key in obj["actionNames"]) {
        this.actionNames.push(obj["actionNames"][key]);
    }
    for (const key in obj["conditionNames"]) {
        this.conditionNames.push(obj["conditionNames"][key]);
    }
}
