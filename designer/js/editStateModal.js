class EditStateModal {
    /**
     * @param {string} id
     * @param {(selectElement: HTMLSelectElement) => void} updateActionNameSelect
     * @param {(selectElement: HTMLSelectElement) => void} updateConditionSelect
     * @param {(selectElement: HTMLSelectElement) => void} updateTransitionDestinationSelect
     */
    constructor(
        id,
        updateActionNameSelect,
        updateConditionSelect,
        updateTransitionDestinationSelect) {
        this.id = id;
        this.updateActionNameSelect = updateActionNameSelect;
        this.updateConditionSelect = updateConditionSelect;
        this.updateTransitionDestinationSelect = updateTransitionDestinationSelect;
    }

    /**
     * @returns {FsmFormStateModel}
     */
    readForm() {
        var result = new FsmFormStateModel();

        result.stateName = DomHelper.readTextInput(`${this.id}_NameInput`);
        result.actionName = DomHelper.readSelectInput(`${this.id}_ActionSelect`);
        result.destinationTargetName = DomHelper.readSelectInput(`${this.id}_DestinationSelect`);
        result.stateKind = DomHelper.readRadioInput(`${this.id}_RadioStateKindEntry`)
            ? StateKind.Entry
            : StateKind.Regular;

        DomHelper.iterateUlChildren(`${this.id}_TransitionList`, (element) => {
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

    /**
     * @param {GraphStateIR} state 
     * @param {string} stateKind
     */
    bootstrapForm(state, stateKind) {
        var stateNameInput = document.getElementById(`${this.id}_NameInput`);
        var addTransitionButton = document.getElementById(`${this.id}_AddTransitionButton`);
        var actionNameSelect = document.getElementById(`${this.id}_ActionSelect`);
        var defaultTransitionSelect = document.getElementById(`${this.id}_DestinationSelect`);

        if (!addTransitionButton || !(addTransitionButton instanceof HTMLButtonElement)) return;
        else if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) return;
        else if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) return;
        else if (!defaultTransitionSelect || !(defaultTransitionSelect instanceof HTMLSelectElement)) return;

        this.updateActionNameSelect(actionNameSelect);
        this.updateTransitionDestinationSelect(defaultTransitionSelect);

        this.clearAllTransitions();
        for (var transition of state.transitions) {
            this.addTransitionSelection(
                transition.conditionName,
                transition.destinationId);
        }

        stateNameInput.value = state.name;
        actionNameSelect.value = state.actionName;
        defaultTransitionSelect.value = state.destinationId;

        var idToCheck = stateKind === StateKind.Entry
            ? `${this.id}_RadioStateKindEntry`
            : `${this.id}_RadioStateKindRegular`;
        DomHelper.setRadioInput(idToCheck, `${this.id}_StateKindRadio`);
    }

    /**
     * @param {string|null} chosenCondition
     * @param {string|null} chosenDestination
     */
    addTransitionSelection(chosenCondition, chosenDestination) {
        var dom = document.getElementById(`${this.id}_TransitionList`);
        if (!dom) {
            console.error("EditStateModal:addTransitionSelection: Transition list container not found");
            return;
        }

        var li = document.createElement("li");
        li.className = "list-group-item";

        var conditionSelect = document.createElement("select");
        conditionSelect.className = "form-select mb-2 mb-md-0";
        conditionSelect.id = `${this.id}_TransitionFromSelect_` + Date.now();

        var destinationSelect = document.createElement("select");
        destinationSelect.className = "form-select";
        destinationSelect.id = `${this.id}_TransitionToSelect_` + Date.now();

        this.updateConditionSelect(conditionSelect);
        this.updateTransitionDestinationSelect(destinationSelect);

        if (chosenCondition) {
            conditionSelect.value = chosenCondition;
        }
        if (chosenDestination) {
            destinationSelect.value = chosenDestination;
        }

        var row = document.createElement("div");
        row.className = "row g-2 align-items-center";

        var colFrom = document.createElement("div");
        colFrom.className = "col-12 col-md-5";
        colFrom.appendChild(conditionSelect);

        var colArrow = document.createElement("div");
        colArrow.className = "col-12 col-md-2 text-center";
        colArrow.style.userSelect = "none";
        colArrow.textContent = "->";

        var colTo = document.createElement("div");
        colTo.className = "col-12 col-md-5";
        colTo.appendChild(destinationSelect);

        row.appendChild(colFrom);
        row.appendChild(colArrow);
        row.appendChild(colTo);

        li.appendChild(row);
        dom.appendChild(li);
    }

    clearAllTransitions() {
        var dom = document.getElementById(`${this.id}_TransitionList`);
        if (!dom) {
            console.error("EditStateModal:clearAllTransitions: Transition list container not found");
            return;
        }

        dom.innerHTML = "";
    }
}