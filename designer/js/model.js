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
    /** @type {FsmTransitionModel[]|undefined} */
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

const StateKind = {
    Entry: "Entry",
    Regular: "Regular"
};

function FsmFormStateModel() {
    /** @type {string} */
    this.stateName = "";
    /** @type {FsmTransitionModel[]} */
    this.transitions = [];
    /** @type {string} */
    this.actionName = "";
    /** @type {string} */
    this.destinationTargetName = "";
    /** @type {string} */
    this.stateKind = StateKind.Regular;
}

/**
 * Destination targets the C++ importer understands on top of state names.
 */
const ReservedTarget = {
    Error: "__error__",
    Finish: "__finish__"
};

/**
 * Converts a designer machine into a model digestible by fsm::JsonModelImporter.
 *
 * The IR keys states by ID and references them by ID, while the importer keys
 * them by name, so every reference has to be remapped. Everything that would
 * make the importer reject the file is reported at once instead of exporting
 * a model that only fails later, in C++.
 *
 * @param {GraphMachineIR} machine
 * @returns {FsmModel|Fail}
 */
FsmModel.fromGraphMachine = function (machine) {
    /** @type {string[]} */
    const problems = [];
    /** @type {GraphStateIR[]} */
    const states = Object.values(machine.states);

    if (states.length === 0) {
        problems.push("Machine has no states");
    }

    /** @type {{[key: string]: string}} */
    const idToName = {};
    /** @type {Set<string>} */
    const usedNames = new Set();

    for (const state of states) {
        const name = state.name.trim();
        idToName[state.id] = name;

        if (name === "") {
            problems.push(`State ${state.id} has an empty name`);
        }
        else if (usedNames.has(name)) {
            problems.push(`Two states are named '${name}'`);
        }

        usedNames.add(name);
    }

    if (machine.entryStateId === "") {
        problems.push("Machine has no entry state");
    }
    else if (!(machine.entryStateId in machine.states)) {
        problems.push(`Entry state ${machine.entryStateId} is not among the states`);
    }

    /**
     * @param {string} destinationId
     * @returns {string|null} Name the importer expects, null if it resolves to nothing
     */
    const resolveTarget = (destinationId) => {
        if (destinationId === ReservedTarget.Error || destinationId === ReservedTarget.Finish) {
            return destinationId;
        }

        return destinationId in idToName ? idToName[destinationId] : null;
    };

    for (const state of states) {
        const label = idToName[state.id] === "" ? state.id : idToName[state.id];

        if (state.actionName.trim() === "") {
            problems.push(`State '${label}' has no action`);
        }

        if (state.destinationId === "") {
            problems.push(`State '${label}' has no default destination`);
        }
        else if (state.destinationId === ReservedTarget.Error) {
            // fsm::Factory refuses to error out from a default transition
            problems.push(`State '${label}' cannot use ${ReservedTarget.Error} as a default destination`);
        }
        else if (resolveTarget(state.destinationId) === null) {
            problems.push(`Default destination of state '${label}' points to unknown state ${state.destinationId}`);
        }

        state.transitions.forEach((transition, index) => {
            if (transition.conditionName.trim() === "") {
                problems.push(`Transition ${index + 1} of state '${label}' has no condition`);
            }

            if (transition.destinationId === "") {
                problems.push(`Transition ${index + 1} of state '${label}' has no destination`);
            }
            else if (resolveTarget(transition.destinationId) === null) {
                problems.push(`Transition ${index + 1} of state '${label}' points to unknown state ${transition.destinationId}`);
            }
        });
    }

    if (problems.length !== 0) {
        return new Fail(problems.map(problem => `  - ${problem}`).join("\n"));
    }

    const model = new FsmModel(null);
    model.entryStateName = idToName[machine.entryStateId];

    for (const state of states) {
        const exported = new FsmStateModel();

        exported.actionName = state.actionName.trim();
        exported.destinationTargetName = resolveTarget(state.destinationId);
        // transitions are optional for the importer, so states without any
        // are exported without the empty array
        exported.transitions = state.transitions.length === 0
            ? undefined
            : state.transitions.map((transition) => new FsmTransitionModel(
                transition.conditionName.trim(),
                resolveTarget(transition.destinationId)));

        model.states[idToName[state.id]] = exported;
    }

    return model;
};
