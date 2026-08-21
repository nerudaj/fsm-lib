/**
 * @param {HTMLSelectElement} selectElement 
 * @param {Array<{value: string, label: string}>} options
 */
function populateSelectElement(selectElement, options) {
    for (var i = selectElement.options.length - 1; i >= 0; i--) {
        selectElement.remove(i);
    }

    for (var { value, label } of options) {
        var option = document.createElement("option");
        option.value = value;
        option.text = label;
        selectElement.add(option);
    }
}

class DomHelper {
    /**
     * @param {HTMLSelectElement} selectElement 
     * @param {Array<{value: string, label: string}>} options
     */
    static populateSelectElement(selectElement, options) {
        for (var i = selectElement.options.length - 1; i >= 0; i--) {
            selectElement.remove(i);
        }

        for (var { value, label } of options) {
            var option = document.createElement("option");
            option.value = value;
            option.text = label;
            selectElement.add(option);
        }
    }

    /**
     * @param {string} id 
     * @returns {string}
     */
    static readTextInput(id) {
        var input = document.getElementById(id);
        if (!input) {
            throw new Error(`Element ${id} does not exist`);
        }
        else if (!(input instanceof HTMLInputElement)) {
            throw new Error(`Element ${id} is not HTMLInputElement`);
        }

        return input.value;
    }

    /**
     * @param {string} id 
     * @returns {string}
     */
    static readSelectInput(id) {
        var select = document.getElementById(id);
        if (!select) {
            throw new Error(`Element ${id} does not exist`);
        }
        else if (!(select instanceof HTMLSelectElement)) {
            throw new Error(`Element ${id} is not HTMLSelectElement`);
        }

        return select.value;
    }

    /**
     * @param {string} id 
     * @param {(element: HTMLLIElement) => void} callback
     */
    static iterateUlChildren(id, callback) {
        var ol = document.getElementById(id);
        if (!ol) {
            throw new Error(`Element ${id} does not exist`);
        }
        else if (!(ol instanceof HTMLOListElement)) {
            throw new Error(`Element ${id} is not HTMLOListElement`);
        }

        for (var child of ol.children) {
            if (child instanceof HTMLLIElement) {
                callback(child);
            }
            else {
                // TODO: remove this once validated the logic works
                console.log(child, "is not <li>");
            }
        }
    }
}