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
        /** @type {cytoscape} */
        this.graph = createDefaultGraph();
        this.graph.on("tap", "node", /** @param {any} evt */(evt) => {
            const node = evt.target;
            this.onNodeClicked(node);
        });

        this.graph.on("dragfree", "node", /** @param {any} evt */(evt) => {
            const node = evt.target;
            const id = node.id();
            const x = node.position().x;
            const y = node.position().y;
            console.log(`Updating position of ${id} to [${x}, ${y}]`);
            this.ir.updateStatePosition(id, x, y);
        })

        this.ir = new GraphIR();
    }

    /**
     * @returns {{[key: string]: GraphStateIR}}
     */
    getCurrentStates() {
        return this.ir.getCurrentMachine().states;
    }

    /**
     * 
     * @param {HTMLSelectElement} select 
     */
    updateActionNameSelect(select) {
        for (var i = 0; i < select.options.length; i++) {
            select.remove(0);
        }

        for (const actionName of this.ir.manifest.actionNames) {
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

        for (const state in this.getCurrentStates()) {
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
                this.ir.manifest = new ManifestModel(manifest);

                // Update modals
                var select = document.getElementById("AddState_ActionInput");
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
        var stateNameInput = document.getElementById("EditState_NameInput");
        var addTransitionButton = document.getElementById("EditState_AddTransitionButton");
        var actionNameSelect = document.getElementById("EditState_ActionSelect");
        var defaultTransitionSelect = document.getElementById("EditState_DestinationSelect");

        if (!program) return;
        if (!addTransitionButton || !(addTransitionButton instanceof HTMLButtonElement)) return;
        if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) return;
        if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) return;
        if (!defaultTransitionSelect || !(defaultTransitionSelect instanceof HTMLSelectElement)) return;

        this.updateActionNameSelect(actionNameSelect);
        this.updateTransitionDestinationSelect(defaultTransitionSelect);

        stateNameInput.disabled = false;
        addTransitionButton.disabled = false;
        actionNameSelect.disabled = false;
        defaultTransitionSelect.disabled = false;

        const stateName = node.id();
        stateNameInput.value = stateName;
        actionNameSelect.value = this.getCurrentStates()[stateName].actionName;
        defaultTransitionSelect.value = this.getCurrentStates()[stateName].destinationId;
    }

    /** 
     * @param {string} stateName
     * @param {string} actionName 
     */
    addNewState(stateName, actionName) {
        if (stateName in this.getCurrentStates()) {
            console.error(`State "${stateName}" already exists.`);
            return;
        }

        const id = this.ir.getNewStateId();
        this.getCurrentStates()[id] = new GraphStateIR(
            id,
            stateName,
            actionName);

        this.graph.add([
            { group: 'nodes', data: { id: id, label: `${stateName} (${actionName})` } },
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
        // TODO: all of this

        if (!(oldStateName in this.getCurrentStates())) {
            console.error(`State "${oldStateName}" does not exist.`);
            return;
        }

        // Update the state in the FSM model
        this.ir.updateStateProperties("TODO", newStateName, [], actionName, defaultTransition);

        // TODO: all references to this state need to be updated
    }

    undo() { }

    redo() { }
}
