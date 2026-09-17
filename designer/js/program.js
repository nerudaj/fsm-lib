class Program {
    constructor() {
        /** @type {GraphIR} */
        this.ir = new GraphIR();

        /** @type {string|null} */
        this.selectedState = "";

        /** @type {string} */
        this.modelFileName = "project.json";

        /** @type {string|null} Remembered only once the user names an export */
        this.exportFileName = null;

        /** @type {EditStateModal} */
        this.editStateModal = new EditStateModal(
            "EditState",
            (selectElement) => this.updateActionNameSelect(selectElement),
            (selectElement) => this.updateConditionSelect(selectElement),
            (selectElement) => this.updateTransitionDestinationSelect(selectElement)
        );

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
    updateConditionSelect(select) {
        DomHelper.populateSelectElement(
            select,
            this.ir.manifest.conditionNames.map(conditionName => ({ value: conditionName, label: conditionName })));
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
                this.exportFileName = null;

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

        for (const [id, _] of Object.entries(this.ir.getCurrentMachine().states)) {
            this.setStateColorBasedOnKind(
                id,
                this.ir.getCurrentMachine().entryStateId == id
                    ? StateKind.Entry
                    : StateKind.Regular);
        }
    }

    /**
     * Writes text through the save dialog, falling back to a plain download.
     * @param {string} suggestedName
     * @param {string} text
     * @returns {Promise<string>} Name the file was written under
     */
    async saveTextToFile(suggestedName, text) {
        if (typeof window.showSaveFilePicker === "function") {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: "FSM model",
                        accept: { "application/json": [".json"] }
                    }]
                });

                const writable = await handle.createWritable();
                await writable.write(text);
                await writable.close();

                return handle.name;
            }
            catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return suggestedName;
                }

                console.error("Save dialog failed, falling back to download:", error);
            }
        }

        DomHelper.downloadTextFile(suggestedName, text, "application/json");
        return suggestedName;
    }

    async saveModelToFile() {
        this.modelFileName = await this.saveTextToFile(
            this.modelFileName,
            JSON.stringify(this.ir, null, 2));
    }

    /**
     * @returns {string}
     */
    getExportFileName() {
        if (this.exportFileName) {
            return this.exportFileName;
        }

        return this.modelFileName.replace(/\.json$/i, "") + ".export.json";
    }

    /**
     * Exports the current machine as a model the C++ importer can load.
     */
    async exportModelToFile() {
        const model = FsmModel.fromGraphMachine(this.ir.getCurrentMachine());

        if (model instanceof Fail) {
            alert(`Cannot export the model:\n${model.message}`);
            return;
        }

        this.exportFileName = await this.saveTextToFile(
            this.getExportFileName(),
            JSON.stringify(model, null, 2));
    }

    /**
     * @param {any} node 
     */
    onNodeClicked(node) {
        const stateName = node.id();
        this.selectedState = stateName;
        this.editStateModal.bootstrapForm(
            this.getCurrentStates()[stateName], StateKind.Regular);

        new bootstrap.Modal(document.getElementById('stateInspectorModal')).show();
    }

    onNodeUnselected() { /* current unused */ }

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

        var isFirstState = false
        this.executeAndSnapshot(() => {
            state.id = this.ir.getNewStateId();
            isFirstState = Object.keys(this.getCurrentStates()).length === 0;
            this.getCurrentStates()[state.id] = state;

            if (isFirstState) {
                this.ir.getCurrentMachine().entryStateId = state.id;
            }
        });

        this.graph.add([{
            group: "nodes",
            data: { id: state.id, label: `${stateName} (${actionName})` },
            position: { x: state.x, y: state.y }
        }]);

        this.selectedState = state.id;
        this.onSelectedStateDestinationChange(state.id);

        if (isFirstState) {
            this.setStateColorBasedOnKind(state.id, StateKind.Entry);
        }
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

    /**
     * @param {string} stateId 
     * @param {string} stateKind 
     */
    setStateColorBasedOnKind(stateId, stateKind) {
        const node = this.graph.$id(stateId);

        if (node.empty()) {
            console.error(`program::setStateColorBasedOnKind: no node with ID ${stateId}`);
            return;
        }

        node.toggleClass("entry-state", stateKind === StateKind.Entry);
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

    updateSelectedState() {
        if (!this.selectedState) {
            console.error("program::updateSelectedState: selectedState is null");
            return;
        }

        var formModel = this.editStateModal.readForm();
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

        var isThisStateEntryOne = this.ir.getCurrentMachine().entryStateId == selectedState.id;
        if (formModel.stateKind == StateKind.Entry && !isThisStateEntryOne) {
            this.setStateColorBasedOnKind(selectedState.id, StateKind.Entry);
            this.setStateColorBasedOnKind(this.ir.getCurrentMachine().entryStateId, StateKind.Regular);
            this.ir.getCurrentMachine().entryStateId = selectedState.id;
        }
    }
}
