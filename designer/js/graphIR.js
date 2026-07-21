class GraphTransitionIR {
    /**
     * @param {string} conditionName
     * @param {string} destinationId
     */
    constructor(conditionName, destinationId) {
        /** @type {string} */ this.conditionName = conditionName;
        /** @type {string} */ this.destinationId = destinationId;
    }
}

class GraphStateIR {
    /**
     * @param {string} id
     * @param {string} name
     * @param {string} actionName
     */
    constructor(id, name, actionName) {
        /** @type {number} */ this.x = 0;
        /** @type {number} */ this.y = 0;
        /** @type {string} */ this.id = id;
        /** @type {string} */ this.name = name;
        /** @type {GraphTransitionIR[]} */ this.transitions = [];
        /** @type {string} */ this.actionName = actionName;
        /** @type {string} */ this.destinationId = "";
    }
}

class GraphMachineIR {
    /**
     * Initialize machine with entry state
     * @param {GraphStateIR|null} entryState 
     */
    constructor(entryState) {
        /** @type {string} */
        this.entryStateId = "";
        /** @type {{[key: string]: GraphStateIR }} */
        this.states = {};

        if (entryState instanceof GraphStateIR) {
            this.entryStateId = entryState.id;
            this.states[entryState.id] = entryState;
        }

    }
}

class GraphIR {
    constructor() {
        /** @type {ManifestModel} */ this.manifest = new ManifestModel(null);
        /** @type {string} */ this.currentMachineId = "Main";
        /** @type {{ [key: string]: GraphMachineIR }} */
        this.machines = {
            "Main": new GraphMachineIR(null)
        };
        /** @type {number} */ this.stateCounter = 0;
    }

    /**
     * @return {GraphMachineIR}
     */
    getCurrentMachine() {
        if (!(this.currentMachineId in this.machines)) {
            alert("Current machine ID not in machines dict!");
        }

        return this.machines[this.currentMachineId];
    }

    /**
     * @returns {Result}
     */
    isValid() {
        return new Result(false, "Not implemented yet");
    }

    /**
     * @returns {string}
     */
    getNewStateId() {
        this.stateCounter++;
        return `State${this.stateCounter}`;
    }

    /**
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     */
    updateStatePosition(id, x, y) {
        if (!(id in this.getCurrentMachine().states)) {
            alert(`State ${id} not present in current FSM`);
            return;
        }

        this.getCurrentMachine().states[id].x = x;
        this.getCurrentMachine().states[id].y = y;
    }

    /**
     * @param {string} id
     * @param {string} newName
     * @param {[GraphTransitionIR]|[]} newTransitions
     * @param {string} newAction
     * @param {string} newDestination
     */
    updateStateProperties(id, newName, newTransitions, newAction, newDestination) {
        if (!(id in this.getCurrentMachine().states)) {
            alert(`State ${id} not present in current FSM`);
            return;
        }

        let state = this.getCurrentMachine().states[id];

        state.name = newName;
        state.transitions = newTransitions;
        state.actionName = newAction;
        state.destinationId = newDestination;
    }
}
