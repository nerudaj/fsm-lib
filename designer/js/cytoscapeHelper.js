class CytoscapeHelper {
    /**
     * Cytoscape cannot be directly styled with CSS.
     * Instead read the styles applied to the graph element as a whole
     * and convert it to JS object compatible with Cytoscape.
     * @param {Element} container The graph container element
     * @returns {any[]} A Cytoscape stylesheet
     */
    static readGraphStyleFromCss(container) {
        const computed = getComputedStyle(container);

        /**
         * @param {string} name
         * @returns {string}
         */
        function text(name) {
            const value = computed.getPropertyValue(name).trim();

            if (!value) {
                console.error("Missing CSS custom property " + name + " on the graph container");
            }

            return value;
        }

        /**
         * @param {string} name
         * @returns {number}
         */
        function number(name) {
            return parseFloat(text(name));
        }

        return [
            {
                selector: "node",
                style: {
                    label: "data(label)",
                    shape: text("--graph-node-shape"),
                    "background-color": text("--graph-node-background-color"),
                    color: text("--graph-node-text-color"),
                    "text-valign": text("--graph-node-text-valign"),
                    "text-halign": text("--graph-node-text-halign"),
                    width: number("--graph-node-width"),
                    "font-size": number("--graph-node-font-size"),
                    "text-wrap": text("--graph-node-text-wrap"),
                    "text-max-width": number("--graph-node-text-max-width"),
                    "text-justification": text("--graph-node-text-justification"),
                }
            },
            {
                selector: "edge",
                style: {
                    width: number("--graph-edge-width"),
                    "line-color": text("--graph-edge-line-color"),
                    "target-arrow-color": text("--graph-edge-target-arrow-color"),
                    "target-arrow-shape": text("--graph-edge-target-arrow-shape"),
                    "curve-style": text("--graph-edge-curve-style")
                }
            }
        ];
    }

    /**
     * @returns {cytoscape} A default graph instance
     */
    static createDefaultGraph() {
        // docs https://js.cytoscape.org/
        const container = document.getElementById("Graph");

        const cy = cytoscape({
            container: container,
            elements: [
                //{ data: { id: "Start", label: "Start" } },
                //{ data: { id: "B_loop", source: "B", target: "B" } }
            ],
            style: readGraphStyleFromCss(container),
            layout: {
                name: "preset"
            }
        });


        /*cy.$id("Start").position({ x: 120, y: 120 });
        cy.fit(40);*/

        return cy;
    }
}