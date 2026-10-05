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
     * @returns {boolean}
     */
    static readToggleInput(id) {
        var input = document.getElementById(id);
        if (!input) {
            throw new Error(`Element ${id} does not exist`);
        }
        else if (!(input instanceof HTMLInputElement)) {
            throw new Error(`Element ${id} is not HTMLInputElement`);
        }
        else if (input.type !== "checkbox") {
            throw new Error(`Element ${id} is not a checkbox button`);
        }

        return input.checked;
    }

    /**
     * @param {string} idToCheck 
     * @param {string} name 
     */
    static setRadioInput(idToCheck, name) {
        var inputs = document.getElementsByName(name);
        for (var input of inputs) {
            if (input instanceof HTMLInputElement && input.type === "radio") {
                input.checked = (input.id === idToCheck);
            }
        }
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

    /**
     * @param {string} text 
     * @param {string} id
     * @param {string} labelClass
     * @returns {HTMLDivElement}
     */
    static createToggleButton(text, id, labelClass) {
        var div = document.createElement("div");

        var input = document.createElement("input");
        input.type = "checkbox";
        input.className = "btn-check";
        input.id = id;
        input.autocomplete = "off";


        var label = document.createElement("label");
        label.className = `btn ${labelClass}`;
        label.htmlFor = id;
        label.textContent = text;

        div.appendChild(input);
        div.appendChild(label);

        return div;
    }

    /**
     * @param {number} length 
     * @returns {string}
     */
    static generateRandomId(length) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * @param {string} id
     */
    static openModal(id) {
        new bootstrap.Modal(document.getElementById(id)).show();
    }

    /**
     * @param {string} id
     */
    static closeModal(id) {
        // hide() doesn't work for whatever reason
        new bootstrap.Modal(document.getElementById(id))._hideModal();
    }
}
