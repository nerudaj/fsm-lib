class Program {
    constructor() {
        /** @type {GraphIR} */
        this.ir = new GraphIR();

        /** @type {string|null} */
        this.selectedState = null;

        /** @type {string} */
        this.modelFileName = "project.json";

        /** @type {cytoscape} */
        this.graph = CytoscapeHelper.createDefaultGraph();
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

        this.resetHistory();

        this.initTransitionListSorting();
    }

    initTransitionListSorting() {
        const list = document.getElementById("EditState_TransitionList");
        if (!list || !(list instanceof HTMLOListElement)) {
            return;
        }

        new Sortable(list, {
            animation: 150,
            draggable: "li",
            onEnd: () => {
                if (this.selectedState) {
                    this.updateSelectedState();
                }
            }
        });
    }

    /**
     * @param {string} message
     */
    log(message) {
        console.log(`PROGRAM: ${message}`);
    }

    /**
     * @returns {{[key: string]: GraphStateIR}}
     */
    getCurrentStates() {
        return this.ir.getCurrentMachine().states;
    }

    /**
     * @returns {Array<{value: string, label: string}>}
     */
    getStateNamesInCurrentMachine() {
        return Object.entries(this.getCurrentStates())
            .map(([state, ir]) => ({ value: state, label: ir.name }));
    }

    /**
     * 
     * @param {HTMLSelectElement} select 
     */
    updateActionNameSelect(select) {
        DomHelper.populateSelectElement(
            select,
            this.ir.manifest.actionNames.map(actionName => ({ value: actionName, label: actionName })));
    }

    /**
     * @param {HTMLSelectElement} select 
     */
    updateTransitionDestinationSelect(select) {
        DomHelper.populateSelectElement(
            select,
            this.getStateNamesInCurrentMachine());
    }

    /**
     * @param {File} file 
     */
    loadManifestFromFile(file) {
        file.text()
            .then((jsonText) => {
                const manifest = JSON.parse(jsonText);
                this.log(`Selected file: ${file.name}`);
                this.log(`Parsed JSON: ${manifest}`);
                this.ir.manifest = new ManifestModel(manifest);

                this.updateAddStateModal();
            })
            .catch((error) => {
                console.error("Failed to parse manifest JSON:", error);
            });
    }

    updateAddStateModal() {
        const select = document.getElementById("AddState_ActionInput");
        if (select && select instanceof HTMLSelectElement) {
            this.updateActionNameSelect(select);
        }
    }

    /**
     * @param {File} file 
     */
    loadModelFromFile(file) {
        file.text()
            .then((jsonText) => {
                this.log(`Selected file: ${file.name}`);
                this.ir = GraphIR.fromJSON(JSON.parse(jsonText));
                this.modelFileName = file.name;

                this.resetHistory();
                this.restoreFromIr();
            })
            .catch((error) => {
                console.error("Failed to load project:", error);
            });
    }

    /**
     * Redraws everything that is derived from the IR.
     */
    restoreFromIr() {
        this.onNodeUnselected();
        this.updateAddStateModal();
        CytoscapeHelper.rebuildGraph(this.graph, this.ir.getCurrentMachine());
    }

    async saveModelToFile() {
        const jsonText = JSON.stringify(this.ir, null, 2);

        if (typeof window.showSaveFilePicker === "function") {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: this.modelFileName,
                    types: [{
                        description: "FSM model",
                        accept: { "application/json": [".json"] }
                    }]
                });

                const writable = await handle.createWritable();
                await writable.write(jsonText);
                await writable.close();

                this.modelFileName = handle.name;
                return;
            }
            catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }

                console.error("Save dialog failed, falling back to download:", error);
            }
        }

        DomHelper.downloadTextFile(this.modelFileName, jsonText, "application/json");
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

        const modal = new bootstrap.Modal(document.getElementById('stateInspectorModal'));
        modal.show();

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
        this.log(`Updating position of ${id} to [${x}, ${y}]`);

        this.executeAndSnapshot(() => {
            this.ir.updateStatePosition(id, x, y);
        });
    }

    /** 
     * @param {string} stateName
     * @param {string} actionName 
     */
    addNewState(stateName, actionName) {
        this.log(`Adding state ${stateName} with action ${actionName}`);

        // Cytoscape would otherwise place the node somewhere the IR cannot
        // see, and the position would be lost on save.
        const index = Object.keys(this.getCurrentStates()).length;
        const state = new GraphStateIR("", stateName, actionName);
        state.x = 100 + (index % 4) * 250;
        state.y = 100 + Math.floor(index / 4) * 150;

        this.executeAndSnapshot(() => {
            state.id = this.ir.getNewStateId();
            this.getCurrentStates()[state.id] = state;
        });

        this.graph.add([{
            group: "nodes",
            data: { id: state.id, label: `${stateName} (${actionName})` },
            position: { x: state.x, y: state.y }
        }]);

        //this.graph.layout({ name: 'cose' }).run();
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

        this.log(`Renaming state ${this.selectedState} to ${newName}`);

        this.executeAndSnapshot(() => {
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

        this.log(`Changing action of ${this.selectedState} to ${newAction}`);

        this.executeAndSnapshot(() => {
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

        this.log(`Changing destination of ${this.selectedState} to ${newDestination}`);

        this.executeAndSnapshot(() => {
            this.ir.updateStateProperties(
                this.selectedState,
                null, null, null, newDestination);
        });

        CytoscapeHelper.rebuildStateEdges(
            this.graph,
            this.selectedState,
            this.getCurrentStates()[this.selectedState]);
    }


    /**
     * @param {Array<FsmTransitionModel>} newTransitions
     */
    onSelectedStateTransitionsChange(newTransitions) {
        if (!this.selectedState) {
            console.error("selected state is null");
            return;
        }

        this.log(`Updating transitions of ${this.selectedState}`);

        const transitions = newTransitions.map((transition) =>
            new GraphTransitionIR(transition.conditionName, transition.destinationTargetName));

        this.executeAndSnapshot(() => {
            this.ir.updateStateProperties(
                this.selectedState,
                null, transitions, null, null);
        });

        CytoscapeHelper.rebuildStateEdges(
            this.graph,
            this.selectedState,
            this.getCurrentStates()[this.selectedState]);
    }

    resetHistory() {
        /** @type {ProgramHistory} */
        this.history = new ProgramHistory();
        this.history.addSnapshot(JSON.stringify(this.ir));
    }

    /**
     * @param {() => void} action 
     */
    executeAndSnapshot(action) {
        action();
        this.history.addSnapshot(JSON.stringify(this.ir));
    }

    undo() {
        const previousState = this.history.undo();
        if (previousState === null) {
            console.error("No history to undo.");
            return;
        }

        this.restoreSnapshot(previousState);
    }

    redo() {
        const nextState = this.history.redo();
        if (nextState === null) {
            console.error("No history to redo.");
            return;
        }

        this.restoreSnapshot(nextState);
    }

    /**
     * @param {string} snapshot Serialized IR taken by executeAndSnapshot
     */
    restoreSnapshot(snapshot) {
        // JSON.parse alone would leave the IR without its prototypes.
        this.ir = GraphIR.fromJSON(JSON.parse(snapshot));
        this.restoreFromIr();
    }

    /**
     * @returns {FsmFormStateModel}
     */
    readEditStateModal() {
        var result = new FsmFormStateModel();

        result.stateName = DomHelper.readTextInput("EditState_NameInput");
        result.actionName = DomHelper.readSelectInput("EditState_ActionSelect");
        result.destinationTargetName = DomHelper.readSelectInput("EditState_DestinationSelect");

        DomHelper.iterateUlChildren("EditState_TransitionList", (element) => {
            var selects = element.getElementsByTagName("select");

            if (selects.length !== 2) {
                throw new Error(`There are not exactly two <select>s in the <li> element`);
            }

            result.transitions.push(new FsmTransitionModel(
                DomHelper.readSelectInput(selects[0].id),
                DomHelper.readSelectInput(selects[1].id)
            ));
        });

        return result;
    }

    updateSelectedState() {
        if (!this.selectedState) {
            console.error("program::updateSelectedState: selectedState is null");
            return;
        }

        var formModel = this.readEditStateModal();
        var selectedState = this.getCurrentStates()[this.selectedState];

        if (selectedState.name != formModel.stateName)
            this.onSelectedStateNameChange(formModel.stateName);

        if (selectedState.actionName != formModel.actionName)
            this.onSelectedStateActionChange(formModel.actionName);

        if (selectedState.destinationId != formModel.destinationTargetName)
            this.onSelectedStateDestinationChange(formModel.destinationTargetName);

        var transitionsChanged = (() => {
            if (selectedState.transitions.length != formModel.transitions.length)
                return true;

            for (var i = 0; i < selectedState.transitions.length; ++i) {
                if (selectedState.transitions[i].conditionName != formModel.transitions[i].conditionName)
                    return true;

                if (selectedState.transitions[i].destinationId != formModel.transitions[i].destinationTargetName)
                    return true;
            }

            return false;
        })();

        if (transitionsChanged)
            this.onSelectedStateTransitionsChange(formModel.transitions);
    }
}
