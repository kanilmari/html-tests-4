package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	"log"
	"math"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	_ "image/gif"
	_ "image/png"

	"github.com/nfnt/resize"
	_ "golang.org/x/image/webp"
)

// rotateImage rotates an image by the given angle in degrees.
func rotateImage(img image.Image, angle float64) image.Image {
	// Convert degrees to radians
	angle = angle * math.Pi / 180.0

	// Calculate new dimensions
	bounds := img.Bounds()
	newWidth := bounds.Dx()
	newHeight := bounds.Dy()

	rotatedImg := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	for y := 0; y < bounds.Dy(); y++ {
		for x := 0; x < bounds.Dx(); x++ {
			newX := int(float64(x)*math.Cos(angle) - float64(y)*math.Sin(angle))
			newY := int(float64(x)*math.Sin(angle) + float64(y)*math.Cos(angle))
			rotatedImg.Set(newX, newY, img.At(x, y))
		}
	}

	return rotatedImg
}

// cropToSquare crops the image to a square in the center.
func cropToSquare(img image.Image) image.Image {
	bounds := img.Bounds()
	size := min(bounds.Dx(), bounds.Dy())
	cropRect := image.Rect(
		(bounds.Dx()-size)/2,
		(bounds.Dy()-size)/2,
		(bounds.Dx()+size)/2,
		(bounds.Dy()+size)/2,
	)
	croppedImg := image.NewRGBA(cropRect)
	draw.Draw(croppedImg, cropRect, img, cropRect.Min, draw.Src)
	return croppedImg
}

// min returns the smaller of two integers.
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// decodeAndEditImage decodes the image, applies rotation, and crops it to a square.
func decodeAndEditImage(imageData []byte, rotateAngle float64, crop bool) (image.Image, error) {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %v", err)
	}

	// Apply rotation if angle is specified
	if rotateAngle != 0 {
		img = rotateImage(img, rotateAngle)
	}

	// Crop to square if requested
	if crop {
		img = cropToSquare(img)
	}

	// Resize the image to 600px height while maintaining aspect ratio
	resizedImg := resize.Resize(0, 600, img, resize.Lanczos3)

	return resizedImg, nil
}

// saveImageAsJPEG saves the image as a JPEG file.
func saveImageAsJPEG(img image.Image, filePath string) error {
	outFile, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer outFile.Close()

	err = jpeg.Encode(outFile, img, &jpeg.Options{Quality: 90})
	if err != nil {
		return fmt.Errorf("failed to encode image to JPEG: %v", err)
	}

	return nil
}

// saveImageAsWebPUsingMagick saves the image as a WebP file using ImageMagick.
func saveImageAsWebPUsingMagick(img image.Image, filePath string) error {
	// Create a temporary buffer to store the JPEG image
	var jpegBuffer bytes.Buffer
	err := jpeg.Encode(&jpegBuffer, img, &jpeg.Options{Quality: 90})
	if err != nil {
		return fmt.Errorf("failed to encode image to JPEG for conversion: %v", err)
	}

	// Use ImageMagick to convert JPEG to WebP
	cmd := exec.Command("magick", "convert", "jpeg:-", "webp:"+filePath)
	cmd.Stdin = &jpegBuffer
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to convert JPEG to WebP using ImageMagick: %v", err)
	}

	return nil
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	file, _, err := r.FormFile("image")
	if err != nil {
		log.Printf("Error reading file from request: %v", err)
		http.Error(w, "Failed to get image", http.StatusBadRequest)
		return
	}
	defer file.Close()

	imageData := bytes.NewBuffer(nil)
	if _, err := imageData.ReadFrom(file); err != nil {
		log.Printf("Error reading file content: %v", err)
		http.Error(w, "Failed to read image data", http.StatusInternalServerError)
		return
	}

	rotateAngle, _ := strconv.ParseFloat(r.FormValue("rotate"), 64)
	crop := r.FormValue("crop") == "on"

	start := time.Now()
	editedImage, err := decodeAndEditImage(imageData.Bytes(), rotateAngle, crop)
	duration := time.Since(start).Milliseconds()
	if err != nil {
		log.Printf("Error editing image: %v", err)
		http.Error(w, "Failed to edit image", http.StatusInternalServerError)
		return
	}

	// Save the edited image as both JPEG and WebP
	outputDir := "./static/images"
	os.MkdirAll(outputDir, os.ModePerm)

	fileName := fmt.Sprintf("edited-%d", time.Now().UnixNano())
	jpegPath := filepath.Join(outputDir, fileName+".jpg")
	webpPath := filepath.Join(outputDir, fileName+".webp")

	err = saveImageAsJPEG(editedImage, jpegPath)
	if err != nil {
		log.Printf("Error saving JPEG image: %v", err)
		http.Error(w, "Failed to save JPEG image", http.StatusInternalServerError)
		return
	}

	err = saveImageAsWebPUsingMagick(editedImage, webpPath)
	if err != nil {
		log.Printf("Error saving WebP image: %v", err)
		http.Error(w, "Failed to save WebP image", http.StatusInternalServerError)
		return
	}

	log.Printf("Files saved successfully: %s, %s", jpegPath, webpPath)

	// Respond with the URL of the JPEG image and the processing time
	relativeURL := "/images/" + fileName + ".jpg"
	jsonResp := map[string]interface{}{
		"url":      relativeURL,
		"duration": duration,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jsonResp)
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("./static/images"))))

	http.HandleFunc("/upload", uploadHandler)

	fmt.Println("Server started at http://localhost:8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
