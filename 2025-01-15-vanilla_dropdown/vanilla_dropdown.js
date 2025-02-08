/**
 * vanilla_dropdown.js
 * 
 * Yksinkertainen JavaScript-kirjasto, joka muuttaa HTML-elementin
 * (tai valinnaisesti <select>-elementin) hakupalkilliseksi alasvetovalikoksi.
 */

/**
 * Luo yhden tason dropdownin, jossa on hakutoiminto.
 * 
 * @param {Object} config - Konfiguraatio-olio
 * @param {HTMLElement} config.containerElement - HTML-elementti, johon dropdown kiinnitetään
 * @param {Array<Object>|Array<string>} config.options - Lista valinnoista.
 *                  - Vaihtoehto 1: [{ value: "arvo1", label: "Näkyvä teksti 1" }, { value: "arvo2", label: "Teksti 2" }, ...]
 *                  - Vaihtoehto 2: ["arvo1", "arvo2", "arvo3", ...] jolloin arvot ja labelit ovat samoja
 * @param {string} [config.placeholder="Valitse..."] - Teksti, joka näkyy dropdownin kentässä ennen valintaa
 * @param {string} [config.searchPlaceholder="Hae..."] - Hakukentässä näytettävä vihjeteksti
 * @param {boolean} [config.showClearButton=true] - Näytetäänkö tyhjennys-/nollauspainike
 * @param {function} [config.onChange] - Callback-funktio, joka kutsutaan aina, kun valinta muuttuu (parametrina valittu arvo)
 * 
 * @returns {Object} Palauttaa oliota, josta saa luettua ja asetettua dropdownin valintaa:
 *     - getValue(): hakee valitun arvon
 *     - setValue(arvo): asettaa dropdowniin valitun arvon
 *     - close(): sulkee dropdown-valikon
 *     - open(): avaa dropdown-valikon
 */
export function createDropdownWithSearch({
    containerElement,
    options,
    placeholder = "Valitse...",
    searchPlaceholder = "Hae...",
    showClearButton = true,
    onChange
  }) {
    if (!containerElement) {
      throw new Error("containerElement puuttuu tai on virheellinen.");
    }
  
    // Jos options on puhdas string-lista, tehdään siitä olio-lista {value, label}
    const normalizedOptions = normalizeOptions(options);
  
    // Luodaan perusrakenne: input (näkyvä), dropdown-lista, hakukenttä
    containerElement.classList.add("dws-dropdown-container");
  
    // Luodaan näkyvä kenttä, johon valinta kirjoitetaan
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.classList.add("dws-dropdown-input");
    inputElement.placeholder = placeholder;
    inputElement.readOnly = true;
    containerElement.appendChild(inputElement);
  
    // Luodaan dropdown-listan kääre-elementti
    const listWrapper = document.createElement("div");
    listWrapper.classList.add("dws-dropdown-list");
    listWrapper.style.display = "none"; // oletuksena piilossa
    containerElement.appendChild(listWrapper);
  
    // Luodaan hakukenttä
    const searchContainer = document.createElement("div");
    searchContainer.classList.add("dws-dropdown-search");
    listWrapper.appendChild(searchContainer);
  
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = searchPlaceholder;
    searchInput.classList.add("dws-dropdown-search-input");
    searchContainer.appendChild(searchInput);
  
    // Näytettävien vaihtoehtojen luettelo
    const optionsList = document.createElement("div");
    optionsList.classList.add("dws-dropdown-options");
    listWrapper.appendChild(optionsList);
  
    // Luodaan selkeyden vuoksi yksittäinen funktio listan renderöintiin
    function renderOptions(filterText = "") {
      // Tyhjennetään
      optionsList.innerHTML = "";
  
      // Suodatetaan hakuehdon perusteella
      const filtered = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(filterText.toLowerCase())
      );
  
      // Rakennetaan jokaisesta itemistä DOM-elementti
      filtered.forEach(opt => {
        const optionItem = document.createElement("div");
        optionItem.classList.add("dws-dropdown-option");
        optionItem.textContent = opt.label;
        optionItem.dataset.value = opt.value;
  
        optionItem.addEventListener("click", () => {
          setValue(opt.value, true);
          close();
        });
  
        optionsList.appendChild(optionItem);
      });
  
      // Jos ei löytynyt yhtään tulosta
      if (filtered.length === 0) {
        const noResults = document.createElement("div");
        noResults.classList.add("dws-dropdown-no-results");
        noResults.textContent = "Ei tuloksia";
        optionsList.appendChild(noResults);
      }
    }
  
    renderOptions();
  
    // Tapahtumakuuntelija hakukentälle
    searchInput.addEventListener("input", () => {
      const filterText = searchInput.value.trim();
      renderOptions(filterText);
    });
  
    // Klikkaus inputtiin avaa/sulkee dropdownin
    inputElement.addEventListener("click", (e) => {
      e.stopPropagation(); // estetään document-click -sulkeminen heti
      toggle();
    });
  
    // Klikkaus minne tahansa muualle sivulla sulkee dropdownin
    document.addEventListener("click", (e) => {
      if (!containerElement.contains(e.target)) {
        close();
      }
    });
  
    // Halutaanko näyttää "Tyhjennä valinta" -painike?
    let clearButton = null;
    if (showClearButton) {
      clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.classList.add("dws-dropdown-clear-btn");
      clearButton.innerHTML = "&times;"; // pieni rasti
      clearButton.title = "Tyhjennä valinta";
      clearButton.style.display = "none";
      containerElement.appendChild(clearButton);
  
      clearButton.addEventListener("click", (e) => {
        e.stopPropagation();
        setValue("", true);
        close();
      });
    }
  
    // Seurataan valittua arvoa
    let selectedValue = "";
  
    function getValue() {
      return selectedValue;
    }
  
    function setValue(value, callOnChange = false) {
      selectedValue = value;
      const found = normalizedOptions.find(opt => opt.value === value);
      if (found) {
        inputElement.value = found.label;
      } else {
        inputElement.value = "";
      }
      if (clearButton) {
        clearButton.style.display = selectedValue ? "inline-block" : "none";
      }
      if (callOnChange && typeof onChange === "function") {
        onChange(selectedValue);
      }
    }
  
    function open() {
      listWrapper.style.display = "block";
      searchInput.value = "";  // nollataan haku, kun avataan
      renderOptions("");
    }
  
    function close() {
      listWrapper.style.display = "none";
    }
  
    function toggle() {
      if (listWrapper.style.display === "none") {
        open();
      } else {
        close();
      }
    }
  
    // Palautetaan oliomainen käyttöliittymä
    return {
      getValue,
      setValue,
      open,
      close
    };
  }
  
  /**
   * Apufunktio, joka muuntaa string-listan -> { value, label } -listaksi,
   * jos se ei ole jo valmiiksi oikeassa muodossa.
   * 
   * @param {Array<Object>|Array<string>} arr 
   * @returns {Array<Object>}
   */
  function normalizeOptions(arr) {
    if (!Array.isArray(arr)) return [];
  
    // Jos taulukon ensimmäinen alkio on string, oletetaan kaikkien olevan stringejä
    if (typeof arr[0] === "string") {
      return arr.map(item => {
        return {
          value: item,
          label: item
        };
      });
    }
  
    // Muuten oletetaan, että ne ovat jo {value, label} -olioita
    // tai ainakin niissä on kentät 'value' ja 'label'
    return arr.map(item => {
      return {
        value: item.value,
        label: item.label
      };
    });
  }
  