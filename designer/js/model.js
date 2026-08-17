/**
 * @param {string} conditionName 
 * @param {string} destinationTargetName 
 */
function FsmTransitionModel(conditionName, destinationTargetName) {
    /** @type {string} */
    this.conditionName = conditionName;
    /** @type {string} */
    this.destinationTargetName = destinationTargetName;
}

function FsmStateModel() {
    /** @type {FsmTransitionModel[]} */
    this.transitions = [];
    /** @type {string} */
    this.actionName = "";
    /** @type {string} */
    this.destinationTargetName = "";
}

/**
 * @param {any} obj 
 */
function FsmModel(obj) {
    /** @type {number} */
    this.version = 1;
    /** @type {string} */
    this.entryStateName = "";
    /** @type {{ [key: string]: FsmStateModel }} */
    this.states = {};

    if (!obj) return;

    if (obj.version !== this.version) {
        console.error("Unsupported FSM model version:", obj.version);
        return;
    }

    this.entryStateName = obj.entryStateName;
    this.states = obj.states;
}
