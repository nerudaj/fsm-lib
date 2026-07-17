/**
 * @returns {cytoscape} A default graph instance
 */
function createDefaultGraph() {
    const cy = cytoscape({
        container: document.getElementById("Graph"),
        elements: [
            //{ data: { id: "Start", label: "Start" } },
            //{ data: { id: "B_loop", source: "B", target: "B" } }
        ],
        // TODO: ideally place the styles in styles.css without declaring them in JS
        style: [
            {
                selector: "node",
                style: {
                    label: "data(label)",
                    "background-color": "#3b82f6",
                    color: "#fff",
                    "text-valign": "center",
                    "text-halign": "center",
                    width: 44,
                    height: 44
                }
            },
            {
                selector: "edge",
                style: {
                    width: 2,
                    "line-color": "#64748b",
                    "target-arrow-color": "#64748b",
                    "target-arrow-shape": "triangle",
                    "curve-style": "bezier"
                }
            }
        ],
        layout: {
            name: "preset"
        }
    });


    /*cy.$id("Start").position({ x: 120, y: 120 });
    cy.fit(40);*/

    return cy;
}

class Program {
    constructor() {
        /** @type {ManifestModel} */
        this.manifest = new ManifestModel(null);

        /** @type {FsmModel} */
        this.fsm = new FsmModel(null);

        /** @type {cytoscape} */
        this.graph = createDefaultGraph();
        this.graph.on("dbltap", "node", /** @param {any} evt */(evt) => {
            const node = evt.target;
            this.onNodeClicked(node);
        });
    }

    /**
     * 
     * @param {HTMLSelectElement} select 
     */
    updateActionNameSelect(select) {
        for (var i = 0; i < select.options.length; i++) {
            select.remove(0);
        }

        for (const actionName of this.manifest.actionNames) {
            const option = document.createElement("option");
            option.value = actionName;
            option.text = actionName;
            select.add(option);
        }
    }

    /**
     * @param {HTMLSelectElement} select 
     */
    updateTransitionDestinationSelect(select) {
        for (var i = 0; i < select.options.length; i++) {
            select.remove(0);
        }

        for (const state in this.fsm.states) {
            const option = document.createElement("option");
            option.value = state;
            option.text = state;
            select.add(option);
        }
    }

    /**
     * @param {File} file 
     */
    loadManifestFromFile(file) {
        file.text()
            .then((jsonText) => {
                const manifest = JSON.parse(jsonText);
                console.log("Selected file:", file.name);
                console.log("Parsed JSON:", manifest);
                this.manifest = new ManifestModel(manifest);

                // Update modals
                var select = document.getElementById("StateActionName");
                if (select && select instanceof HTMLSelectElement) {
                    this.updateActionNameSelect(select);
                }
            })
            .catch((error) => {
                console.error("Failed to parse manifest JSON:", error);
            });
    }

    /**
     * @param {File} file 
     */
    loadModelFromFile(file) {
        file.text()
            .then((jsonText) => {
                const model = JSON.parse(jsonText);
                console.log("Selected file:", file.name);
                console.log("Parsed JSON:", model);
                this.fsm = new FsmModel(model);
            })
            .catch((error) => {
                console.error("Failed to parse FSM model JSON:", error);
            });
    }

    /**
     * @param {File} file 
     */
    saveModelToFile(file) {
        const jsonText = JSON.stringify(this.fsm, null, 2);
        const blob = new Blob([jsonText], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * @param {any} node 
     */
    onNodeClicked(node) {
        var oldStateNameInput = document.getElementById("EditModalOldStateNameInput");
        var stateNameInput = document.getElementById("EditModalStateNameInput");
        var actionNameSelect = document.getElementById("EditModalStateActionName");
        var defaultTransitionSelect = document.getElementById("EditModalDefaultTransition");

        if (!program) return;
        if (!oldStateNameInput || !(oldStateNameInput instanceof HTMLInputElement)) return;
        if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) return;
        if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) return;
        if (!defaultTransitionSelect || !(defaultTransitionSelect instanceof HTMLSelectElement)) return;

        this.updateActionNameSelect(actionNameSelect);
        this.updateTransitionDestinationSelect(defaultTransitionSelect);

        const stateName = node.id();
        oldStateNameInput.value = stateName;
        stateNameInput.value = stateName;
        actionNameSelect.value = program.fsm.states[stateName].actionName;
        defaultTransitionSelect.value = program.fsm.states[stateName].destinationTargetName;

        const modalElement = document.getElementById("EditStateModal");
        if (!modalElement) {
            console.error("Modal element not found.");
            return;
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }

    /** 
     * @param {string} stateName
     * @param {string} actionName 
     */
    addNewState(stateName, actionName) {
        if (stateName in this.fsm.states) {
            console.error(`State "${stateName}" already exists.`);
            return;
        }

        this.fsm.states[stateName] = new FsmStateModel();
        this.fsm.states[stateName].actionName = actionName;
        this.graph.add([
            { group: 'nodes', data: { id: stateName, label: `${stateName} (${actionName})` } },
        ]);

        this.graph.layout({ name: 'cose' }).run();
    }

    /**
     * @param {string} oldStateName 
     * @param {string} newStateName 
     * @param {string} actionName 
     * @param {string} defaultTransition 
     */
    updateState(oldStateName, newStateName, actionName, defaultTransition) {
        if (!(oldStateName in this.fsm.states)) {
            console.error(`State "${oldStateName}" does not exist.`);
            return;
        }

        // Update the state in the FSM model
        const state = this.fsm.states[oldStateName];
        delete this.fsm.states[oldStateName];
        state.actionName = actionName;
        state.destinationTargetName = defaultTransition;
        this.fsm.states[newStateName] = state;

        // TODO: all references to this state need to be updated
    }

    undo() { }

    redo() { }
}
