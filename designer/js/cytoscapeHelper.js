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
                // Set by Program::setStateColorBasedOnKind. Declared after the
                // plain node rule so it overrides the regular background.
                selector: "node.entry-state",
                style: {
                    "background-color": text("--graph-node-entry-background-color")
                }
            },
            {
                selector: "edge",
                style: {
                    width: number("--graph-edge-width"),
                    "line-color": text("--graph-edge-line-color"),
                    "target-arrow-color": text("--graph-edge-target-arrow-color"),
                    "target-arrow-shape": text("--graph-edge-target-arrow-shape"),
                    "curve-style": text("--graph-edge-curve-style"),
                    label: "data(label)",
                    color: text("--graph-edge-text-color"),
                    "font-size": number("--graph-edge-font-size"),
                    "text-rotation": text("--graph-edge-text-rotation"),
                    "text-margin-y": number("--graph-edge-text-margin-y"),
                    "text-background-color": text("--graph-edge-text-background-color"),
                    "text-background-opacity": number("--graph-edge-text-background-opacity"),
                    "text-background-padding": number("--graph-edge-text-background-padding"),
                    "text-background-shape": text("--graph-edge-text-background-shape")
                }
            },
            {
                selector: "edge:loop",
                style: {
                    "loop-direction": text("--graph-loop-direction"),
                    "loop-sweep": text("--graph-loop-sweep"),
                    "control-point-step-size": number("--graph-loop-size")
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
            style: CytoscapeHelper.readGraphStyleFromCss(container),
            layout: {
                name: "preset"
            }
        });


        /*cy.$id("Start").position({ x: 120, y: 120 });
        cy.fit(40);*/

        return cy;
    }

    /**
     * @param {cytoscape} graph The graph to repopulate
     * @param {GraphMachineIR} machine Machine whose states are drawn
     */
    static rebuildGraph(graph, machine) {
        graph.elements().remove();

        const states = Object.values(machine.states);

        graph.add(states.map((state) => ({
            group: "nodes",
            data: { id: state.id, label: `${state.name} (${state.actionName})` },
            position: { x: state.x, y: state.y }
        })));

        for (const state of states) {
            CytoscapeHelper.rebuildStateEdges(graph, state.id, state);
        }
    }

    /**
     * @param {cytoscape} graph The graph the node lives in
     * @param {string} nodeId ID of the node whose edges are rebuilt
     * @param {GraphStateIR} state Model of the state the node maps to
     */
    static rebuildStateEdges(graph, nodeId, state) {
        const node = graph.$id(nodeId);

        if (node.empty()) {
            console.error(`CytoscapeHelper::rebuildStateEdges: no node with ID ${nodeId}`);
            return;
        }

        // outgoers() keeps self-loops, since their source is the node itself.
        node.outgoers("edge").remove();

        const edges = [];

        /**
         * @param {string} id
         * @param {string} destinationId
         * @param {string} label
         */
        function addEdge(id, destinationId, label) {
            if (!destinationId) return;

            if (graph.$id(destinationId).empty()) {
                console.error(`CytoscapeHelper::rebuildStateEdges: transition from ${nodeId} points to unknown node ${destinationId}`);
                return;
            }

            edges.push({
                group: "edges",
                data: {
                    id: id,
                    source: nodeId,
                    target: destinationId,
                    label: label
                }
            });
        }

        state.transitions.forEach((transition, index) => {
            // The index keeps parallel transitions to the same state apart.
            addEdge(`${nodeId}::transition::${index}`, transition.destinationId, transition.conditionName);
        });

        addEdge(`${nodeId}::default`, state.destinationId, "default");

        graph.add(edges);
    }
}
