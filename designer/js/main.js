// @ts-check

/** @type {Program|null} */
let program = null;

/**
 * 
 * @param {(file: File) => void} callback 
 */
function selectFileAndExecute(callback) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", function () {
        const file = input.files && input.files[0] ? input.files[0] : null;

        if (!file) {
            console.error("No file selected.");
            return;
        }

        callback(file);
    });

    input.click();
}

function loadManifest() {
    selectFileAndExecute((file) => {
        if (program) {
            program.loadManifestFromFile(file);
        }
    });
}

function loadModel() {
    selectFileAndExecute((file) => {
        if (program) {
            program.loadModelFromFile(file);
        }
    });
}

function saveModel() {
    if (!program) {
        console.error("Program is null");
        return;
    }

    program.saveModelToFile();
}

function exportModel() {
    if (!program) {
        console.error("Program is null");
        return;
    }

    program.exportModelToFile();
}

function undo() {
    if (program) {
        program.undo();
    }
}

function redo() {
    if (program) {
        program.redo();
    }
}

/**
 * @param {any} e 
 */
function addState(e) {
    console.log("addState:begin");
    var stateNameInput = document.getElementById("AddState_NameInput");
    var actionNameSelect = document.getElementById("AddState_ActionInput");

    if (!program) {
        console.error("Program is null");
        return;
    }
    else if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) {
        console.error("State name input is either null or wrong type");
        return;
    }
    else if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) {
        console.error("Action name input is either null or wrong type");
        return;
    }

    program.addNewState(
        stateNameInput.value,
        actionNameSelect.value);
    console.log("addState:end");
}

function addTransitionSelection() {
    if (!program) return;

    program.editStateModal.addTransitionSelection(null, null);
}

/**
 * @param {any} event 
 */
function onEditStateNameChange(event) {
    if (!program) {
        console.error("Program is null");
        return;
    }

    program.onSelectedStateNameChange(event.target.value);
}

/**
 * @param {any} event
 */
function onEditStateActionChange(event) {
    if (!program) {
        console.error("Program is null");
        return;
    }

    program.onSelectedStateActionChange(event.target.value);
}

function applyChangesToState() {
    if (program) {
        program.updateSelectedState();
    }
}

function main() {
    console.log("main started");

    program = new Program();

    console.log("main finished");
}
