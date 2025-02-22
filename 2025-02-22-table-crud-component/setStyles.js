// setStyles.js // Viittaus tähän esim. app.js:ssä

// Haetaan lomake-elementit
const tableMarginInput = document.getElementById('tableMargin');
const tableBorderSpacingInput = document.getElementById('tableBorderSpacing');

const cellPaddingInput = document.getElementById('cellPadding');
const cellRadiusInput = document.getElementById('cellRadius');
const cellBorderWidthInput = document.getElementById('cellBorderWidth');
const cellBorderSideSelect = document.getElementById('cellBorderSide');

// Ajetaan alussa kerran, jotta arvot tulevat voimaan
updateTableCSS(getOptionsFromInputs());

// Lisätään kuuntelijat, jotka päivittyvät välittömästi (input tai change)
[ tableMarginInput,
  tableBorderSpacingInput,
  cellPaddingInput,
  cellRadiusInput,
  cellBorderWidthInput,
  cellBorderSideSelect
].forEach(elem => {
  elem.addEventListener('input',  handleStyleChange);
  elem.addEventListener('change', handleStyleChange);
});

// Funktio, joka lukee syötteet ja päivittää CSS:n
function handleStyleChange() {
  updateTableCSS(getOptionsFromInputs());
}

function getOptionsFromInputs() {
  return {
    // .table
    margin: parseInt(tableMarginInput.value, 10),
    borderSpacing: parseInt(tableBorderSpacingInput.value, 10),

    // .cell
    padding: parseInt(cellPaddingInput.value, 10),
    borderRadius: parseInt(cellRadiusInput.value, 10),
    borderWidth: parseInt(cellBorderWidthInput.value, 10),
    borderSide: cellBorderSideSelect.value
  };
}

/**
 * Päivitetään/lisätään dynaaminen <style id="dynamicTableStyles">
 * niin, että .table ja .cell saavat halutut arvot.
 */
function updateTableCSS(options) {
  // Hae tai luo dynamic-tyylit
  let styleElem = document.getElementById('dynamicTableStyles');
  if (!styleElem) {
    styleElem = document.createElement('style');
    styleElem.id = 'dynamicTableStyles';
    document.head.appendChild(styleElem);
  }

  // Määritellään border-säännöt riippuen valitusta reunasta
  let borderRules = '';

  // Jos borderSide=none, ei piirretä mitään reunaa
  if (options.borderSide === 'none') {
    // Sekoilematon tapa on asettaa "border: none;"
    borderRules = `
      border: none;
    `;
  } else if (options.borderSide === 'all') {
    // Kaikille reunoille
    borderRules = `
      border-width: ${options.borderWidth}px;
      border-style: solid;
      border-color: #ddd;
    `;
  } else {
    // esim. bottom/top/left/right
    // Poistetaan muilta reunoilta border
    const sides = ['top','right','bottom','left'];
    const chosenSide = options.borderSide;
    const borderLines = sides.map(side => {
      // jos side=valittu -> border-X: Xpx solid #ddd; muutoin border-X: none;
      if (side === chosenSide) {
        return `border-${side}: ${options.borderWidth}px solid #ddd;`;
      } else {
        return `border-${side}: none;`;
      }
    }).join('\n');
    borderRules = borderLines;
  }

  // Kootaan uusi CSS merkkijonona
  // .table
  const newCSS = `
    .table {
      margin: ${options.margin}px auto; /* keskitys "auto" halutessa */
      ${options.borderSpacing >= 0
        ? `border-spacing: ${options.borderSpacing}px;`
        : ''
      }
      /* HUOM: Jos haluat border-collapse: collapse;, silloin border-spacing
         ei toimi. Valitse kumpaa logiikkaa haluat käyttää. */
      display: table;
    }
    .row {
      display: table-row;
    }
    .cell {
      display: table-cell;
      background-color: #fff;
      vertical-align: middle;

      ${options.padding >= 0
         ? `padding: ${options.padding}px;`
         : ''
      }
      ${options.borderRadius >= 0
         ? `border-radius: ${options.borderRadius}px;`
         : ''
      }
      ${borderRules}
    }
  `;

  // Päivitetään <style>-elementin sisältö
  styleElem.innerHTML = newCSS;
}

// <!-- Tyylinsäätölomake, lLisättävissä html:ään -->
// <div id="styleControls" style="margin-top: 1rem; border: 1px solid #ccc; padding: 10px;">
//     <h3>Taulun tyylien säätö</h3>

//     <!-- .table-elementin margin -->
//     <label for="tableMargin">Taulukon margin (px):</label>
//     <input type="number" id="tableMargin" value="20" min="0" style="width: 60px;">

//     <!-- .table-elementin border-spacing (vaihtoehto border-collapse:lle) -->
//     <label for="tableBorderSpacing">Border-spacing (px):</label>
//     <input type="number" id="tableBorderSpacing" value="10" min="0" style="width: 60px;">

//     <br><br>

//     <!-- .cell-elementin padding -->
//     <label for="cellPadding">Solujen sisäjättö (padding, px):</label>
//     <input type="number" id="cellPadding" value="10" min="0" style="width: 60px;">

//     <!-- .cell-elementin border-radius -->
//     <label for="cellRadius">Pyöristys (border-radius, px):</label>
//     <input type="number" id="cellRadius" value="5" min="0" style="width: 60px;">

//     <!-- .cell-elementin border-width -->
//     <label for="cellBorderWidth">Reunan paksuus (px):</label>
//     <input type="number" id="cellBorderWidth" value="1" min="0" style="width: 60px;">

//     <!-- Valinta: mitä reunaa piirretään (all, bottom, top jne.) -->
//     <label for="cellBorderSide">Näytettävä reuna:</label>
//     <select id="cellBorderSide">
//         <option value="all" selected>Kaikki reunat</option>
//         <option value="bottom">Vain alareuna</option>
//         <option value="top">Vain yläreuna</option>
//         <option value="left">Vain vasen reuna</option>
//         <option value="right">Vain oikea reuna</option>
//         <option value="none">Ei reunaa</option>
//     </select>
// </div>