class GraphTransitionIR {
    /**
     * @param {string} conditionName
     * @param {string} destinationId
     */
    constructor(conditionName, destinationId) {
        /** @type {string} */ this.conditionName = conditionName;
        /** @type {string} */ this.destinationId = destinationId;
    }

    /**
     * @param {any} obj
     * @returns {GraphTransitionIR}
     */
    static fromJSON(obj) {
        return new GraphTransitionIR(obj.conditionName, obj.destinationId);
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

    /**
     * @param {any} obj
     * @returns {GraphStateIR}
     */
    static fromJSON(obj) {
        const state = new GraphStateIR(obj.id, obj.name, obj.actionName);

        state.x = obj.x ?? 0;
        state.y = obj.y ?? 0;
        state.destinationId = obj.destinationId ?? "";
        state.transitions = (obj.transitions ?? []).map(GraphTransitionIR.fromJSON);

        return state;
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

    /**
     * @param {any} obj
     * @returns {GraphMachineIR}
     */
    static fromJSON(obj) {
        const machine = new GraphMachineIR(null);

        machine.entryStateId = obj.entryStateId ?? "";

        for (const [stateId, state] of Object.entries(obj.states ?? {})) {
            machine.states[stateId] = GraphStateIR.fromJSON(state);
        }

        return machine;
    }
}

class GraphIR {
    static VERSION = 1;

    constructor() {
        /** @type {number} */ this.version = GraphIR.VERSION;
        /** @type {ManifestModel} */ this.manifest = new ManifestModel(null);
        /** @type {string} */ this.currentMachineId = "Main";
        /** @type {{ [key: string]: GraphMachineIR }} */
        this.machines = {
            "Main": new GraphMachineIR(null)
        };
        /** @type {number} */ this.stateCounter = 0;
    }

    /**
     * Rebuilds a GraphIR from parsed project JSON. JSON.parse yields plain
     * objects, so every nested model has to be reconstructed to get its
     * prototype back.
     * @param {any} obj
     * @returns {GraphIR}
     */
    static fromJSON(obj) {
        if (!obj || typeof obj !== "object") {
            throw new Error("Project file is not an object");
        }
        else if (obj.version !== GraphIR.VERSION) {
            throw new Error(
                `Unsupported project version ${obj.version}, expected ${GraphIR.VERSION}`);
        }
        else if (!obj.machines || typeof obj.machines !== "object") {
            throw new Error("Project file has no machines");
        }

        const ir = new GraphIR();

        ir.manifest = new ManifestModel(obj.manifest ?? null);
        ir.currentMachineId = obj.currentMachineId;
        ir.stateCounter = obj.stateCounter ?? 0;
        ir.machines = {};

        for (const [machineId, machine] of Object.entries(obj.machines)) {
            ir.machines[machineId] = GraphMachineIR.fromJSON(machine);
        }

        if (!(ir.currentMachineId in ir.machines)) {
            throw new Error(`Current machine ${ir.currentMachineId} is not among the machines`);
        }

        return ir;
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
     * @param {string|null} newName
     * @param {[GraphTransitionIR]|null} newTransitions
     * @param {string|null} newAction
     * @param {string|null} newDestination
     */
    updateStateProperties(id, newName, newTransitions, newAction, newDestination) {
        if (!(id in this.getCurrentMachine().states)) {
            alert(`State ${id} not present in current FSM`);
            return;
        }

        let state = this.getCurrentMachine().states[id];

        if (newName) state.name = newName;
        if (newTransitions) state.transitions = newTransitions;
        if (newAction) state.actionName = newAction;
        if (newDestination) state.destinationId = newDestination;
    }
}
