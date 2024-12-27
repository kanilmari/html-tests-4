// File: vanilla_tree.js
// Käytetään aina kokonaisena funktiota. Lisätään configiin ominaisuus button_action_function.

import { handle_checkbox_change, collect_checkbox_states, apply_checkbox_states } from './checkbox_logic.js';

export function renderTree(data, config) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 22 18 V 10 a 2 2 0 0 0 -2 -2 h -7 c -2 0 -1 -2 -3 -2 H 4 a 2 2 0 0 0 -2 2 v 10 
    a 2 2 0 0 0 2 2 h 16 a 2 2 0 0 0 2 -2 z"/></svg>`;

    const svgToggle = `<svg class="toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

    const globalConfig = {
        container_id: config.container_id || 'vanillaTree',
        id_suffix: config.id_suffix || '',
        render_mode: config.render_mode || 'checkbox',
        checkbox_mode: config.checkbox_mode || 'all',
        use_icons: config.use_icons || false,
        populate_checkbox_selection: config.populate_checkbox_selection || false,
        max_recursion_depth: config.max_recursion_depth || 32,
        tree_model: config.tree_model || 'flat',
        initial_open_level: config.initial_open_level || 0,
        show_node_count: config.show_node_count || false,
        show_search: config.show_search || false,
        title_text: config.title_text || '',
        button_action_function: config.button_action_function || null
    };

    const renderMode = globalConfig.render_mode;
    const containerId = globalConfig.container_id;
    const idSuffix = globalConfig.id_suffix;
    const searchInputId = 'treeSearch' + idSuffix;

    let checkboxStates = {};
    let nodesToOpen = [];

    function getContainer() {
        return document.getElementById(containerId);
    }

    // Luodaan kaikki rakenneosat dynaamisesti
    function createStructure() {
        const rootContainer = getContainer();
        if (!rootContainer) return;

        rootContainer.innerHTML = '';

        // Otsikko
        if (globalConfig.title_text) {
            const titleElem = document.createElement('h2');
            titleElem.textContent = globalConfig.title_text;
            rootContainer.appendChild(titleElem);
        }

        // Hakukenttä
        let searchInput = null;
        if (globalConfig.show_search) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.id = searchInputId;
            searchInput.placeholder = 'Haku...';
            rootContainer.appendChild(searchInput);
        }

        // Varsinainen puukontaineri
        const treeDiv = document.createElement('div');
        treeDiv.id = 'vanillaTree' + idSuffix;
        treeDiv.className = 'tree-container';
        rootContainer.appendChild(treeDiv);

        return {
            searchInput,
            treeContainer: treeDiv
        };
    }

    const { searchInput, treeContainer } = createStructure();

    function getTreeContainer() {
        return treeContainer;
    }

    function getSearchInput() {
        return searchInput || null;
    }

    function getSelectedNodeIds() {
        const tc = getTreeContainer();
        if (!tc) return [];
        const selectedCheckboxes = tc.querySelectorAll('.node:not(.hidden) input[type="checkbox"]:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(checkbox => {
            return checkbox.closest('.node').id;
        });
        return selectedIds;
    }

    function buildTree(flatData) {
        let root = null;
        const nodes = {};

        flatData.forEach(node => {
            nodes[node.id] = { ...node, children: [] };
        });

        flatData.forEach(node => {
            if (node.parent_id === null || node.parent_id === "null") {
                root = nodes[node.id];
            } else {
                if (nodes[node.parent_id]) {
                    nodes[node.parent_id].children.push(nodes[node.id]);
                }
            }
        });

        return root;
    }

    function createNode(nodeData, level = 0) {
        const tc = getTreeContainer();
        if (!tc) return document.createElement('div');

        const nodeElement = document.createElement('div');
        nodeElement.className = 'node';
        nodeElement.id = "tree_node_" + nodeData.id + idSuffix;
        nodeElement.style.userSelect = 'none';

        const rowElement = document.createElement('div');
        rowElement.className = 'node-row';
        rowElement.style.userSelect = 'none';
        rowElement.style.paddingLeft = (level * 23) + 'px';

        const toggle = document.createElement('div');
        toggle.classList.add('toggle');

        const hasChildren = Array.isArray(nodeData.children) && nodeData.children.length > 0;
        if (hasChildren) {
            toggle.innerHTML = svgToggle;
            toggle.addEventListener('click', function (event) {
                event.stopPropagation();
                const childrenContainer = nodeElement.querySelector('.children');
                if (childrenContainer) {
                    this.classList.toggle('rotated');
                    toggleChildrenVisibility(childrenContainer);
                }
            });
        } else {
            toggle.innerHTML = `<svg class="toggle-icon" viewBox="0 0 24 24" fill="none" 
            stroke="none" stroke-width="0"></svg>`;
        }
        rowElement.appendChild(toggle);

        const isLeaf = !hasChildren;
        const shouldIncludeCheckbox = (renderMode === 'checkbox') && ((globalConfig.checkbox_mode === 'all') ||
            (globalConfig.checkbox_mode === 'leaf' && isLeaf));

        let checkbox;
        let buttonElement;

        if (renderMode === 'checkbox' && shouldIncludeCheckbox) {
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.marginRight = '10px';
            checkbox.setAttribute('data-indeterminate', 'false');
            rowElement.appendChild(checkbox);

            checkbox.addEventListener('change', (e) => {
                handle_checkbox_change(e, globalConfig.max_recursion_depth);
                if (globalConfig.populate_checkbox_selection) {
                    const selectedNodeIds = getSelectedNodeIds();
                    console.log('Valitut solmut: ' + selectedNodeIds.join(', '));
                    const event = new CustomEvent('categorySelectionChanged', { detail: { selectedCategories: selectedNodeIds } });
                    document.dispatchEvent(event);
                }
            });

        } else if (renderMode === 'button' && isLeaf) {
            buttonElement = document.createElement('button');
            buttonElement.textContent = nodeData.name;
            buttonElement.style.marginRight = '10px';
            buttonElement.addEventListener('click', function (evt) {
                evt.stopPropagation();
                // Kutsutaan configista annettua funktiota, jos määritelty
                if (typeof globalConfig.button_action_function === 'function') {
                    globalConfig.button_action_function(nodeData);
                } else {
                    console.log("Valitsit painikkeen: " + nodeData.name);
                }
            });
            rowElement.appendChild(buttonElement);
        }

        if (globalConfig.use_icons) {
            const icon = document.createElement('div');
            icon.innerHTML = svgIcon;
            icon.classList.add('icon');
            rowElement.appendChild(icon);
        }

        let textSpan;
        if (!(renderMode === 'button' && isLeaf)) {
            textSpan = document.createElement('span');
            textSpan.textContent = nodeData.name;
            textSpan.style.userSelect = 'none';
            rowElement.appendChild(textSpan);
        }

        let countSpan = null;
        if (globalConfig.show_node_count && hasChildren && textSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'node-count';
            countSpan.style.marginLeft = '5px';
            countSpan.style.fontSize = '0.9em';
            countSpan.style.color = '#666';
            textSpan.appendChild(countSpan);
        }

        nodeElement.appendChild(rowElement);

        rowElement.addEventListener('click', function (event) {
            event.stopPropagation();
            if (event.target.closest('.toggle') 
             || event.target.tagName.toLowerCase() === 'input' 
             || event.target.tagName.toLowerCase() === 'button') {
                return;
            }

            const childrenContainer = nodeElement.querySelector('.children');
            if (childrenContainer) {
                const toggleIcon = rowElement.querySelector('.toggle');
                if (toggleIcon) {
                    toggleIcon.classList.toggle('rotated');
                }
                toggleChildrenVisibility(childrenContainer);
            }

            if (renderMode === 'checkbox') {
                const cb = this.querySelector('input[type="checkbox"]');
                if (cb) {
                    if (cb.indeterminate) {
                        cb.indeterminate = false;
                        cb.checked = true;
                    } else {
                        cb.checked = !cb.checked;
                    }
                    const changeEvent = new Event('change', { bubbles: true });
                    cb.dispatchEvent(changeEvent);
                }
            }
        });

        if (hasChildren) {
            let childrenContainer = document.createElement('div');
            childrenContainer.className = 'children';
            childrenContainer.style.overflow = 'hidden';
            childrenContainer.style.maxHeight = '0';
            childrenContainer.style.transition = 'max-height 0.25s ease-in-out';

            nodeData.children.forEach(child => {
                const childNode = createNode(child, level + 1);
                childrenContainer.appendChild(childNode);
            });
            nodeElement.appendChild(childrenContainer);

            if (level < globalConfig.initial_open_level) {
                nodesToOpen.push(nodeElement);
            }
        }

        return nodeElement;
    }

    function openChildren(nodeElement) {
        const container = nodeElement.querySelector('.children');
        if (!container) return;

        const children = container.children;
        let totalHeight = 0;

        for (let i = 0; i < children.length; i++) {
            totalHeight += children[i].offsetHeight;
        }

        if (totalHeight === 0) {
            container.style.maxHeight = 'none';
        } else {
            container.style.maxHeight = totalHeight + 'px';
        }

        let parentContainer = nodeElement.parentElement ? nodeElement.parentElement.closest('.children') : null;
        while (parentContainer) {
            parentContainer.style.maxHeight = 'none';
            parentContainer = parentContainer.parentElement ? parentContainer.parentElement.closest('.children') : null;
        }
    }

    function toggleChildrenVisibility(container) {
        if (!container) return;
        const children = container.children;
        let totalHeight = 0;

        for (let i = 0; i < children.length; i++) {
            if (!children[i].classList.contains('hidden')) {
                totalHeight += children[i].offsetHeight;
            }
        }

        if (container.style.maxHeight === '0px' || container.style.maxHeight === '') {
            container.style.maxHeight = totalHeight + 'px';
            let parentContainer = container.parentElement ? container.parentElement.closest('.children') : null;
            while (parentContainer) {
                if (parentContainer.style.maxHeight !== 'none') {
                    parentContainer.style.maxHeight = 'none';
                }
                parentContainer = parentContainer.parentElement ? parentContainer.parentElement.closest('.children') : null;
            }
        } else {
            container.style.maxHeight = container.scrollHeight + 'px';
            container.offsetHeight;
            container.style.maxHeight = '0';
        }
    }

    function updateCheckboxStates() {
        checkboxStates = collect_checkbox_states(getTreeContainer());
    }

    function restoreCheckboxStates() {
        apply_checkbox_states(checkboxStates, getTreeContainer());
    }

    function filterTreeNodes(searchTerm) {
        const tc = getTreeContainer();
        if (!tc) return;
        const nodes = tc.querySelectorAll('.node');
        nodes.forEach(node => {
            let textElem = node.querySelector('span, button');
            const text = textElem ? textElem.textContent.toLowerCase() : '';
            if (text.includes(searchTerm.toLowerCase())) {
                node.classList.remove('hidden');
                let parent = node.parentElement.closest('.node');
                while (parent) {
                    parent.classList.remove('hidden');
                    const childrenContainer = parent.querySelector('.children');
                    if (childrenContainer && childrenContainer.style.maxHeight === '0px') {
                        openChildren(parent);
                        const toggleIcon = parent.querySelector('.toggle');
                        if (toggleIcon) {
                            toggleIcon.classList.add('rotated');
                        }
                    }
                    parent = parent.parentElement.closest('.node');
                }
            } else {
                node.classList.add('hidden');
            }
        });
    }

    function updateFolderCounts() {
        if (!globalConfig.show_node_count) return;

        const tc = getTreeContainer();
        if (!tc) return;

        function countVisibleLeafDescendants(nodeElem) {
            const childrenContainer = nodeElem.querySelector(':scope > .children');
            const isHidden = nodeElem.classList.contains('hidden');
            if (!childrenContainer) {
                return isHidden ? 0 : 1;
            }
            let count = 0;
            const childNodes = childrenContainer.querySelectorAll(':scope > .node');
            childNodes.forEach(child => {
                count += countVisibleLeafDescendants(child);
            });
            return count;
        }

        const folders = tc.querySelectorAll('.node > .children');
        folders.forEach(folderContainer => {
            const parentNode = folderContainer.parentElement;
            const nodeCountSpan = parentNode.querySelector('.node-row span.node-count');
            if (!nodeCountSpan) {
                return;
            }
            const leafCount = countVisibleLeafDescendants(parentNode);
            nodeCountSpan.textContent = `(${leafCount})`;
        });
    }

    function render(data) {
        const tc = getTreeContainer();
        if (!tc) return;
        tc.innerHTML = '';

        if (globalConfig.tree_model === 'flat') {
            const hierarchicalData = buildTree(data);
            const rootNode = createNode(hierarchicalData, 0);
            tc.appendChild(rootNode);
        } else {
            tc.appendChild(createNode(data, 0));
        }

        restoreCheckboxStates();

        setTimeout(() => {
            nodesToOpen.forEach(nodeElement => {
                openChildren(nodeElement);
                const toggleIcon = nodeElement.querySelector('.toggle');
                if (toggleIcon) {
                    toggleIcon.classList.add('rotated');
                }
            });
            updateFolderCounts();
        }, 0);
    }

    // Alustetaan
    updateCheckboxStates();
    render(data);

    const actualSearchInput = getSearchInput();
    if (actualSearchInput) {
        actualSearchInput.addEventListener('input', function () {
            updateCheckboxStates();
            filterTreeNodes(this.value);
            let selectedNodeIds = getSelectedNodeIds();
            console.log('Valitut solmut: ' + selectedNodeIds.join(', '));
            const event = new CustomEvent('categorySelectionChanged', { detail: { selectedCategories: selectedNodeIds } });
            document.dispatchEvent(event);
            updateFolderCounts();
        });
    }
}
