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
