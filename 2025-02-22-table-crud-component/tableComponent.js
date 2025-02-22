// tableComponent.js

import {
    generateNormalTable,
    generateTransposedTable,
    generateTicketView
} from './tableView.js';

export class TableComponent {
    constructor({ data, headers, initialView = 'normal' }) {
        this.data = data || [];
        this.headers = headers || [];
        this.currentView = initialView;

        // Lajittelusuunnat
        this.sortDirections = {};
        this.headers.forEach(h => {
            this.sortDirections[h.key] = 'asc';
        });

        // Filtterit
        this.filterCriteria = {};
        this.headers.forEach(h => {
            this.filterCriteria[h.key] = '';
        });

        // Valintaan liittyvä tila
        this.isSelecting = false;
        this.startRow = null;
        this.startCol = null;

        // Pääelementti
        this.rootElement = document.createElement('div');
        this.rootElement.classList.add('table-component-root');

        // Valikko (jos halutaan sisäänrakennettuna)
        this.selectionMenu = document.createElement('div');
        this.selectionMenu.className = 'selection-menu';
        this.selectionMenu.style.position = 'absolute';
        this.selectionMenu.style.display = 'none';

        this.selectionMenu.innerHTML = `
        <button data-action="copy-headers">Kopioi otsikot + solut</button>
        <button data-action="copy-no-headers">Kopioi vain solut</button>
      `;
        this.rootElement.appendChild(this.selectionMenu);

        // Valikkonappien kuuntelijat
        this.selectionMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'copy-headers') {
                this.copySelected(true);
            } else if (action === 'copy-no-headers') {
                this.copySelected(false);
            }
            this.hideSelectionMenu();
        });

        // Ensimmäinen piirtäminen
        this.render();

        // Event-kuuntelut valintaa varten
        this.rootElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.rootElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.rootElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.rootElement.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    }

    getElement() {
        return this.rootElement;
    }

    // Uudelleendataus
    setData(newData) {
        this.data = newData;
        this.render();
    }

    // Filtterin asetus
    setFilter(key, value) {
        this.filterCriteria[key] = value.trim();
        this.render();
    }

    // Näkymän vaihtaminen
    setView(viewMode) {
        this.currentView = viewMode;
        this.render();
    }

    render() {
        // Säilytetään viite selectionMenu-elementtiin
        const menuRef = this.selectionMenu;
        this.rootElement.innerHTML = '';
    
        // Suodatettu data
        const filteredData = this.getFilteredData();
    
        let tableElement;
        if (this.currentView === 'normal') {
            tableElement = generateNormalTable(
                filteredData,
                this.headers,
                (key) => this.sortData(key),
                (fromCol, toCol) => this.reorderColumns(fromCol, toCol)
            );
        } else if (this.currentView === 'transposed') {
            tableElement = generateTransposedTable(
                filteredData,
                this.headers,
                (key) => this.sortData(key),
                (fromRow, toRow) => this.reorderColumnsTransposed(fromRow, toRow)
            );
        } else {
            tableElement = generateTicketView(filteredData, this.headers, (key) => this.sortData(key));
        }

        this.rootElement.appendChild(tableElement);

        this.rootElement.appendChild(menuRef);

        this.clearSelection();
        this.hideSelectionMenu();
    }

    getFilteredData() {
        return this.data.filter(item => {
            for (const key in this.filterCriteria) {
                const filterVal = this.filterCriteria[key];
                if (!filterVal) continue;

                const itemVal = String(item[key] || '').toLowerCase();
                if (!itemVal.includes(filterVal.toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
    }

    // Lajittelu
    sortData(key) {
        this.sortDirections[key] = (this.sortDirections[key] === 'asc') ? 'desc' : 'asc';
        const direction = this.sortDirections[key];

        this.data.sort((a, b) => {
            const valA = a[key];
            const valB = b[key];
            if (typeof valA === 'number' && typeof valB === 'number') {
                return (direction === 'asc') ? valA - valB : valB - valA;
            } else {
                return (direction === 'asc')
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            }
        });
        this.render();
    }

    /**
     * SARAKKEIDEN uudelleensijoittaminen (normal-näkymä).
     * fromIndex, toIndex = this.headers -taulukon indeksit.
     */
    reorderColumns(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const movedHeader = this.headers[fromIndex];
        this.headers.splice(fromIndex, 1);
        this.headers.splice(toIndex, 0, movedHeader);
        this.render();
    }

    /**
     * RIVIEN uudelleensijoittaminen (transposed-näkymä).
     * fromIndex, toIndex = this.headers -taulukon indeksit (koska transposed = header=rivi).
     */
    reorderColumnsTransposed(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const movedHeader = this.headers[fromIndex];
        this.headers.splice(fromIndex, 1);
        this.headers.splice(toIndex, 0, movedHeader);
        this.render();
    }

    // Maalausvalinnan aloitus
    // onMouseDown(e) {
    //   if (this.currentView === 'ticket') return; // Ei valintaa tiketti-näkymässä
    //   if (e.button !== 0) return; // vain vasen hiiren nappi

    //   if (!e.target.classList.contains('cell')) {
    //     // Klikattiin jonnekin muualle
    //     if (!this.selectionMenu.contains(e.target)) {
    //       this.clearSelection();
    //       this.hideSelectionMenu();
    //     }
    //     return;
    //   }

    //   this.isSelecting = true;
    //   this.clearSelection();
    //   this.hideSelectionMenu();

    //   this.startRow = parseInt(e.target.dataset.row, 10);
    //   this.startCol = parseInt(e.target.dataset.col, 10);

    //   // Korostetaan alkusolu
    //   this.highlightRegion(this.startRow, this.startCol, this.startRow, this.startCol);
    // }
    onMouseDown(e) {
        if (this.currentView === 'ticket') return; // Ei valintaa tiketti-näkymässä
        if (e.button !== 0) return; // Vain vasen hiiren nappi

        // Varmistetaan, että klikkaus kohdistuu soluun
        const cell = e.target.closest('.cell');
        if (!cell) {
            // Jos klikataan muualle kuin soluun ja se ei ole valikko, nollataan valinta
            if (!this.selectionMenu.contains(e.target)) {
                this.clearSelection();
                this.hideSelectionMenu();
            }
            return;
        }

        // Estetään valinta, jos klikataan raahauskahvaa
        if (e.target.classList.contains('drag-handle')) {
            return;
        }

        this.isSelecting = true;
        this.clearSelection();
        this.hideSelectionMenu();

        this.startRow = parseInt(cell.dataset.row, 10);
        this.startCol = parseInt(cell.dataset.col, 10);

        // Korostetaan alkusolu
        this.highlightRegion(this.startRow, this.startCol, this.startRow, this.startCol);
    }

    onMouseMove(e) {
        if (!this.isSelecting) return;
        if (!e.target.classList.contains('cell')) return;

        const currentRow = parseInt(e.target.dataset.row, 10);
        const currentCol = parseInt(e.target.dataset.col, 10);

        this.clearSelection();
        this.highlightRegion(this.startRow, this.startCol, currentRow, currentCol);
    }

    onMouseUp(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
    }

    // Oikeaklikkaus -> valikko
    onContextMenu(e) {
        if (e.target.classList.contains('cell') && e.target.classList.contains('selected')) {
            e.preventDefault();
            this.showSelectionMenu(e.pageX, e.pageY);
        }
    }

    highlightRegion(r1, c1, r2, c2) {
        if (r1 > r2) [r1, r2] = [r2, r1];
        if (c1 > c2) [c1, c2] = [c2, c1];

        for (let row = r1; row <= r2; row++) {
            for (let col = c1; col <= c2; col++) {
                const selector = `.cell[data-row='${row}'][data-col='${col}']`;
                const cell = this.rootElement.querySelector(selector);
                if (cell) {
                    cell.classList.add('selected');
                }
            }
        }
    }

    clearSelection() {
        this.rootElement.querySelectorAll('.cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    showSelectionMenu(x, y) {
        this.selectionMenu.style.left = x + 'px';
        this.selectionMenu.style.top = y + 'px';
        this.selectionMenu.style.display = 'block';
    }
    hideSelectionMenu() {
        this.selectionMenu.style.display = 'none';
    }

    // Kopioi valitut solut (normal- tai transposed-näkymä)
    copySelected(withHeaders) {
        const range = this.getSelectedRange();
        if (!range) return;

        const { minRow, maxRow, minCol, maxCol } = range;
        let copyText = '';

        if (this.currentView === 'normal') {
            // Normaali
            if (withHeaders) {
                // Otsikkorivi
                const headerRow = [];
                for (let col = minCol; col <= maxCol; col++) {
                    const headerCell = this.rootElement.querySelector(
                        `.cell[data-row='0'][data-col='${col}']`
                    );
                    headerRow.push(headerCell ? headerCell.textContent : '');
                }
                copyText += headerRow.join(',') + '\n';
            }
            // Data
            for (let row = minRow; row <= maxRow; row++) {
                const rowData = [];
                for (let col = minCol; col <= maxCol; col++) {
                    const cell = this.rootElement.querySelector(
                        `.cell[data-row='${row}'][data-col='${col}']`
                    );
                    rowData.push(cell ? cell.textContent : '');
                }
                copyText += rowData.join(',') + '\n';
            }

        } else if (this.currentView === 'transposed') {
            // Transposed
            if (withHeaders) {
                // Jokainen valittu rivi = header + data
                for (let row = minRow; row <= maxRow; row++) {
                    const rowData = [];
                    const headerCell = this.rootElement.querySelector(
                        `.cell[data-row='${row}'][data-col='0']`
                    );
                    rowData.push(headerCell ? headerCell.textContent : '');
                    for (let col = minCol; col <= maxCol; col++) {
                        const cell = this.rootElement.querySelector(
                            `.cell[data-row='${row}'][data-col='${col}']`
                        );
                        rowData.push(cell ? cell.textContent : '');
                    }
                    copyText += rowData.join(',') + '\n';
                }
            } else {
                // Ilman otsikoita
                for (let row = minRow; row <= maxRow; row++) {
                    const rowData = [];
                    for (let col = minCol; col <= maxCol; col++) {
                        const cell = this.rootElement.querySelector(
                            `.cell[data-row='${row}'][data-col='${col}']`
                        );
                        rowData.push(cell ? cell.textContent : '');
                    }
                    copyText += rowData.join(',') + '\n';
                }
            }
        }

        copyText = copyText.trim();
        navigator.clipboard.writeText(copyText)
            .then(() => {
                alert('Kopioitu leikepöydälle!');
            })
            .catch(err => {
                console.error('Kopiointi epäonnistui:', err);
                alert('Kopiointi epäonnistui.');
            });

        this.hideSelectionMenu();
    }

    getSelectedRange() {
        const selectedCells = this.rootElement.querySelectorAll('.cell.selected');
        if (!selectedCells.length) return null;

        let minRow = Infinity, maxRow = -Infinity;
        let minCol = Infinity, maxCol = -Infinity;

        selectedCells.forEach(cell => {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            if (row < minRow) minRow = row;
            if (row > maxRow) maxRow = row;
            if (col < minCol) minCol = col;
            if (col > maxCol) maxCol = col;
        });

        return { minRow, maxRow, minCol, maxCol };
    }

    // (Valinnainen) tuhoamisfunktio
    destroy() {
        if (this.rootElement && this.rootElement.parentNode) {
            this.rootElement.parentNode.removeChild(this.rootElement);
        }
    }
}
