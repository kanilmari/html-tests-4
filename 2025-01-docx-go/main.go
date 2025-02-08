// main.go
package main

import (
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// convert_to_html_handler lukee query-parametrista ?file=<jokuTiedosto>,
// konvertoi sen LibreOfficen avulla HTML:ksi, ja palauttaa HTML:n selainkäyttöön.
// Samalla lisätään <base href="/files/"> <head>-tagiin, jotta kuvat latautuvat
// oikeasta polusta, sekä piilotetaan <ol>-listojen numerointi CSS:llä.
func convert_to_html_handler(w http.ResponseWriter, r *http.Request) {
	// 1. Haetaan tiedostonimi query-parametrista, esim. /convert?file=myDoc.docx
	inputFileName := r.URL.Query().Get("file")
	if inputFileName == "" {
		http.Error(w, "missing 'file' parameter, e.g. ?file=myFile.docx", http.StatusBadRequest)
		return
	}

	// 2. Tiedosto sijaitsee ./files -hakemistossa
	inputPath := filepath.Join("./files", inputFileName)
	if _, err := os.Stat(inputPath); os.IsNotExist(err) {
		http.Error(w, fmt.Sprintf("file not found: %s", inputFileName), http.StatusNotFound)
		return
	}

	// 3. Määritellään, mihin HTML tallennetaan
	outputDir := "./files"
	baseName := filepath.Base(inputPath) // esim. "word.docx"
	baseNoExt := baseName[:len(baseName)-len(filepath.Ext(baseName))]
	htmlFileName := baseNoExt + ".html"
	htmlPath := filepath.Join(outputDir, htmlFileName)

	// Poistetaan aiempi HTML, jos sellaista on
	os.Remove(htmlPath)

	// 4. Kutsutaan LibreOfficea --headless-tilassa (docx -> html)
	cmd := exec.Command("soffice",
		"--headless",
		"--convert-to", "html",
		inputPath,
		"--outdir", outputDir,
	)
	if err := cmd.Run(); err != nil {
		http.Error(w, fmt.Sprintf("error converting %s to html: %v", inputFileName, err),
			http.StatusInternalServerError)
		return
	}

	// 5. Tarkistetaan, että HTML syntyi
	info, err := os.Stat(htmlPath)
	if err != nil || info.Size() == 0 {
		http.Error(w, fmt.Sprintf("html not found or empty after conversion: %s", htmlFileName),
			http.StatusInternalServerError)
		return
	}

	// 6. Luetaan generoitu HTML tiedostosta
	rawHTML, err := ioutil.ReadFile(htmlPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("error reading generated html: %v", err), http.StatusInternalServerError)
		return
	}

	// 7. Etsitään <head> (case-insensitive) ja lisätään base + CSS
	htmlStr := string(rawHTML)
	lowerStr := strings.ToLower(htmlStr)
	idx := strings.Index(lowerStr, "<head>")
	if idx != -1 {
		insertPos := idx + len("<head>")
		// Lisätään <base href="/files/"> ja CSS, joka piilottaa ol-numeroinnin
		injection := `<base href="/files/"><style>*{color:black;background:white;}td{border:1px solid black;padding:3px;font-size:14px!important;}</style>`
		htmlStr = htmlStr[:insertPos] + injection + htmlStr[insertPos:]
	}

	// 8. Lähetetään muokattu HTML selainkäyttöön
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, err = io.WriteString(w, htmlStr)
	if err != nil {
		http.Error(w, fmt.Sprintf("error sending html to client: %v", err), http.StatusInternalServerError)
		return
	}

	// 9. Halutessasi poista .html heti lähetyksen jälkeen
	// os.Remove(htmlPath)
}

func main() {
	// Tarjoillaan staattiset tiedostot juurihakemistosta
	// esim. index.html, josta voi kutsua /convert?file=xxx.docx
	http.Handle("/", http.FileServer(http.Dir(".")))

	// Reititetään /convert docx->html -muunnokselle
	http.HandleFunc("/convert", convert_to_html_handler)

	fmt.Println("Listening on :8086...")
	log.Fatal(http.ListenAndServe(":8086", nil))
}
