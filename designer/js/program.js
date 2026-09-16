class Program {
    constructor() {
        /** @type {GraphIR} */
        this.ir = new GraphIR();

        /** @type {string|null} */
        this.selectedState = null;

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

        /** @type {ProgramHistory} */
        this.history = new ProgramHistory();

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
                this.log(`Selected file: ${file.name}`);
                this.log(`Parsed JSON: ${model}`);
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
        this.ir.updateStatePosition(id, x, y);
    }

    /** 
     * @param {string} stateName
     * @param {string} actionName 
     */
    addNewState(stateName, actionName) {
        this.log(`Adding state ${stateName} with action ${actionName}`);

        const id = this.ir.getNewStateId();
        this.getCurrentStates()[id] = new GraphStateIR(
            id,
            stateName,
            actionName);

        this.graph.add([
            { group: 'nodes', data: { id: id, label: `${stateName} (${actionName})` } },
        ]);

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

        this.log(`Changing action of ${this.selectedState} to ${newAction}`);

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

        this.log(`Changing destination of ${this.selectedState} to ${newDestination}`);

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
 * Rebuilds the Cytoscape graph from the current GraphIR.
 *
 * Existing node positions are preserved when possible.
 */
    rebuildGraph() {
        const states = this.getCurrentStates();

        // Preserve positions before replacing graph elements.
        const positions = {};

        this.graph.nodes().forEach((node) => {
            positions[node.id()] = {
                x: node.position("x"),
                y: node.position("y")
            };
        });

        const nodes = [];
        const edges = [];

        for (const [stateId, state] of Object.entries(states)) {
            nodes.push({
                group: "nodes",
                data: {
                    id: stateId,
                    label: `${state.name} (${state.actionName})`
                },
                position: positions[stateId] ?? {
                    x: 100 + nodes.length * 250,
                    y: 100
                }
            });

            // Default transition.
            if (state.destinationId) {
                edges.push({
                    group: "edges",
                    data: {
                        id: `${stateId}::default`,
                        source: stateId,
                        target: state.destinationId,
                        label: "default"
                    }
                });
            }

            // Conditional transitions.
            for (const [index, transition] of state.transitions.entries()) {
                if (!transition.destinationId) {
                    continue;
                }

                edges.push({
                    group: "edges",
                    data: {
                        // The index makes parallel transitions unique.
                        id: `${stateId}::transition::${index}`,
                        source: stateId,
                        target: transition.destinationId,
                        label: transition.conditionName
                    }
                });
            }
        }

        this.graph.elements().remove();
        this.graph.add([...nodes, ...edges]);

        // Reapply the positions explicitly. This also handles Cytoscape versions
        // that do not preserve positions supplied in the element definition.
        for (const node of nodes) {
            const position = node.position;
            this.graph.$id(node.data.id).position(position);
        }

        this.graph.fit(40);
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

        this.snapshotAndExecute(() => {
            this.ir.updateStateProperties(
                this.selectedState,
                null, newTransitions, null, null);

            this.rebuildGraph();
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
