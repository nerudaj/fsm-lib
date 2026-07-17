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

    // TODO: update add new state modal with list of action names
    // TODO: update edit state modal with list of action names and condition names
}

function loadModel() {
    selectFileAndExecute((file) => {
        if (program) {
            program.loadModelFromFile(file);
        }
    });
}

function saveModel() {
    selectFileAndExecute((file) => {
        if (program) {
            program.saveModelToFile(file);
        }
    });
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
    var stateNameInput = document.getElementById("StateNameInput");
    var actionNameSelect = document.getElementById("StateActionName");

    if (!program) return;
    if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) return;
    if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) return;

    program.addNewState(
        stateNameInput.value,
        actionNameSelect.value);
}

/**
 * @param {any} e
 */
function updateState(e) {
    var oldStateNameInput = document.getElementById("EditModalOldStateNameInput");
    var stateNameInput = document.getElementById("EditModalStateNameInput");
    var actionNameSelect = document.getElementById("EditModalStateActionName");
    var defaultTransitionSelect = document.getElementById("EditModalDefaultTransition");

    if (!program) return;
    if (!oldStateNameInput || !(oldStateNameInput instanceof HTMLInputElement)) return;
    if (!stateNameInput || !(stateNameInput instanceof HTMLInputElement)) return;
    if (!actionNameSelect || !(actionNameSelect instanceof HTMLSelectElement)) return;
    if (!defaultTransitionSelect || !(defaultTransitionSelect instanceof HTMLSelectElement)) return;

    program.updateState(
        oldStateNameInput.value,
        stateNameInput.value,
        actionNameSelect.value,
        defaultTransitionSelect.value);
}

function main() {
    console.log("main started");

    program = new Program();

    console.log("main finished");
}
