/**
 * @returns {cytoscape} A default graph instance
 */
function createDefaultGraph() {
    // docs https://js.cytoscape.org/
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
                    shape: 'round-rectangle',
                    "background-color": "#3b82f6",
                    color: "#fff",
                    "text-valign": "center",
                    "text-halign": "center",
                    width: 200,
                    "font-size": 10,
                    "text-wrap": "wrap",
                    "text-max-width": 200,
                    "text-justification": "center",
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
        /** @type {GraphIR} */
        this.ir = new GraphIR();

        /** @type {string|null} */
        this.selectedState = null;

        /** @type {cytoscape} */
        this.graph = createDefaultGraph();
        this.graph.on("tap", /** @param {any} evt */(evt) => {
            if (evt.target === this.graph) {
                this.onNodeUnselected();
            }
            else if (evt.target.isNode()) {
                this.onNodeClicked(evt.target);
            }
        });

        this.graph.on("dragfree", "node", /** @param {any} evt */(evt) => {
            this.onNodeDragged(evt.target);

        });

        /** @type {ProgramHistory} */
        this.history = new ProgramHistory();
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
        populateSelectElement(
            select,
            this.ir.manifest.actionNames.map(actionName => ({ value: actionName, label: actionName })));
    }

    /**
     * @param {HTMLSelectElement} select 
     */
    updateTransitionDestinationSelect(select) {
        populateSelectElement(
            select,
            Object.entries(this.getCurrentStates()).map(([state, ir]) => ({ value: state, label: ir.name })));
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
     * @param {boolean} enabled 
     * @param {string} stateName 
     * @param {string} actionName 
     * @param {string} destinationId 
     */
    bootstrapStateEditForm(enabled, stateName, actionName, destinationId) {
        var stateNameInput = document.getElementById("EditState_NameInput");
        var addTransitionButton = document.getElementById("EditState_AddTransitionButton");
        var actionNameSelect = document.getElementById("EditState_ActionSelect");
        var defaultTransitionSelect = document.getElementById("EditState_DestinationSelect");

        if (!addTransitionButton || !(addTransitionButton instanceof HTMLButtonElement)) return;
        else if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) return;
        else if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) return;
        else if (!defaultTransitionSelect || !(defaultTransitionSelect instanceof HTMLSelectElement)) return;

        if (enabled) {
            this.updateActionNameSelect(actionNameSelect);
            this.updateTransitionDestinationSelect(defaultTransitionSelect);
        }

        stateNameInput.disabled = !enabled;
        addTransitionButton.disabled = !enabled;
        actionNameSelect.disabled = !enabled;
        defaultTransitionSelect.disabled = !enabled;

        stateNameInput.value = stateName;
        actionNameSelect.value = actionName;
        defaultTransitionSelect.value = destinationId;
    }

    /**
     * @param {any} node 
     */
    onNodeClicked(node) {
        const stateName = node.id();
        this.selectedState = stateName;

        this.bootstrapStateEditForm(
            /* enabled */ true,
            this.getCurrentStates()[stateName].name,
            this.getCurrentStates()[stateName].actionName,
            this.getCurrentStates()[stateName].destinationId);
    }

    onNodeUnselected() {
        this.selectedState = null;

        this.bootstrapStateEditForm(
            /* enabled */ false,
            "",
            "",
            "");
    }

    /**
     * @param {any} node
     */
    onNodeDragged(node) {
        const id = node.id();
        const x = node.position().x;
        const y = node.position().y;
        console.log(`Updating position of ${id} to [${x}, ${y}]`);
        this.ir.updateStatePosition(id, x, y);
    }

    /** 
     * @param {string} stateName
     * @param {string} actionName 
     */
    addNewState(stateName, actionName) {
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
     * @param {string} nodeId 
     * @param {string} name 
     * @param {string} action 
     */
    renameGraphNode(nodeId, name, action) {
        this.graph.$id(nodeId)[0].data('label', `${name} (${action})`);
    }

    /**
     * @param {string} newName 
     */
    onSelectedStateNameChange(newName) {
        if (!this.selectedState) {
            console.error("selected state is null");
            return;
        }

        this.snapshotAndExecute(() => {
            this.ir.updateStateProperties(
                this.selectedState,
                newName, null, null, null);
        });

        this.renameGraphNode(this.selectedState, newName, this.getCurrentStates()[this.selectedState].actionName);
    }

    /**
     * @param {string} newAction 
     */
    onSelectedStateActionChange(newAction) {
        if (!this.selectedState) {
            console.error("selected state is null");
            return;
        }

        this.snapshotAndExecute(() => {
            this.ir.updateStateProperties(
                this.selectedState,
                null, null, newAction, null);
        });

        this.renameGraphNode(this.selectedState, this.getCurrentStates()[this.selectedState].name, newAction);
    }

    /**
     * @param {string} newDestination
     */
    onSelectedStateDestinationChange(newDestination) {
        if (!this.selectedState) {
            console.error("selected state is null");
            return;
        }

        this.snapshotAndExecute(() => {
            this.ir.updateStateProperties(
                this.selectedState,
                null, null, null, newDestination);

            // TODO: self-loop doesn't work yet
            this.graph.add([{
                group: "edges",
                data: {
                    id: `${this.selectedState}_${newDestination}`,
                    source: this.selectedState,
                    target: newDestination,
                    label: "default"
                }
            }])
        });
    }

    /**
     * @param {() => void} action 
     */
    snapshotAndExecute(action) {
        this.history.addSnapshot(JSON.stringify(this.ir));
        action();
    }

    undo() {
        const previousState = this.history.undo();
        if (previousState === null) {
            console.error("No history to undo.");
            return;
        }

        this.ir = JSON.parse(previousState);
    }

    redo() {
        const nextState = this.history.redo();
        if (nextState === null) {
            console.error("No history to redo.");
            return;
        }

        this.ir = JSON.parse(nextState);
    }
}
