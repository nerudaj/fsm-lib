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
            var inputs = element.getElementsByTagName("input");
            var selects = element.getElementsByTagName("select");

            if (inputs.length < 1) {
                throw new Error(`There is no <input> in the transition element`);
            }

            if (selects.length !== 2) {
                throw new Error(`There are not exactly two <select>s in the <li> element`);
            }

            result.transitions.push(new FsmTransitionModel(
                DomHelper.readToggleInput(inputs[0].id),
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
        li.id = DomHelper.generateRandomId(16);

        var conditionSelect = document.createElement("select");
        conditionSelect.className = "form-select mb-2 mb-md-0";
        conditionSelect.id = `${this.id}_TransitionFromSelect_` + Date.now(); // TODO: used?

        var destinationSelect = document.createElement("select");
        destinationSelect.className = "form-select";
        destinationSelect.id = `${this.id}_TransitionToSelect_` + Date.now(); // TODO: used?

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

        var negateCheck = DomHelper.createToggleButton(
            "Not", `${this.id}_Negate_` + Date.now(), "btn-outline-primary");
        negateCheck.className = "col-12 col-md-1";

        var colFrom = document.createElement("div");
        colFrom.className = "col-12 col-md-4";
        colFrom.appendChild(conditionSelect);

        var colArrow = document.createElement("div");
        colArrow.className = "col-12 col-md-2 text-center";
        colArrow.style.userSelect = "none";
        colArrow.textContent = "->";

        var colTo = document.createElement("div");
        colTo.className = "col-12 col-md-4";
        colTo.appendChild(destinationSelect);

        var trashBtn = document.createElement("button");
        trashBtn.className = "btn btn-outline-danger col-12 col-md-1";
        // Icon from font doesn't work for some reason
        trashBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"></path>
  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"></path>
</svg>`;
        trashBtn.onclick = () => {
            var element = document.getElementById(li.id);
            element?.remove();
        };

        row.appendChild(negateCheck);
        row.appendChild(colFrom);
        row.appendChild(colArrow);
        row.appendChild(colTo);
        row.appendChild(trashBtn);

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