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
     * @returns {boolean} Whether the radio button is selected
     */
    static readRadioInput(id) {
        var input = document.getElementById(id);
        if (!input) {
            throw new Error(`Element ${id} does not exist`);
        }
        else if (!(input instanceof HTMLInputElement)) {
            throw new Error(`Element ${id} is not HTMLInputElement`);
        }
        else if (input.type !== "radio") {
            throw new Error(`Element ${id} is not a radio button`);
        }

        return input.checked;
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

    /**
     * @param {string} fileName
     * @param {string} text
     * @param {string} mimeType
     */
    static downloadTextFile(fileName, text, mimeType) {
        const url = URL.createObjectURL(new Blob([text], { type: mimeType }));

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();

        // Revoking synchronously can cancel a download that has not started.
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}
