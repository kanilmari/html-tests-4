let originalImg = null; // Tallenna tämä globaalisti

function initOriginalImg(ctx) {
    if (!originalImg) {
        originalImg = new Image();
        originalImg.src = ctx.canvas.toDataURL();
    }
}
    // Globaalit muuttujat kirkkauden ja kontrastin tallentamiseen
    let currentBrightness;
    let currentContrast;
    let currentSaturation;
    let currentColorTemperature;

    const sliders = ['brightness', 'contrast', 'colorTemperature', 'saturation'];

    sliders.forEach(sliderId => {
        resetValue(sliderId);
    });

    let isCropping = false;
    const canvas = document.getElementById('cropCanvas');
    const ctx = canvas.getContext('2d');
    const markers = document.getElementById('markers');
    
    document.addEventListener("DOMContentLoaded", function () {
        
        document.getElementById('imageUpload').addEventListener('change', function () {
            cropHandler(true);
            const file = this.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                // const img = new Image();
                let img = new Image(); 
                img.src = e.target.result;

                img.onload = async function () {
                    const canvasElement = document.getElementById('cropCanvas');
                    const previewImg = document.getElementById('preview');

                    const aspectRatio = img.width / img.height;

                    // Asetetaan kohdekanvaan koko säilyttäen kuvasuhde
                    const size = 600;
                    canvasElement.width = size;
                    canvasElement.height = size / aspectRatio;

                    // Pienennetään kuva pican avulla
                    try {
                        await pica().resize(img, canvasElement);
                    } catch (error) {
                        console.error("Pica resize error:", error);
                    }

                    // Päivitetään esikatselukuva
                    const resizedImageSrc = canvasElement.toDataURL();
                    previewImg.src = resizedImageSrc;
                    previewImg.dataset.original = resizedImageSrc;
                };
            };
            reader.readAsDataURL(file);
        });
    });


    // Editing filters

    function adjustBrightness() {
        const sliderValue = parseFloat(document.getElementById('brightness').value);
        const factor = 2; // Voit säätää tätä arvoa muuttaaksesi kirkkauden muutoksen voimakkuutta
        currentBrightness = 1 + (Math.log(sliderValue + 2) - 1) * factor;
        // // console.log(currentBrightness);
        applyFilters();
    }

    function adjustContrast() {
        const sliderValue = parseFloat(document.getElementById('contrast').value);
        currentContrast = sliderValue; // Suoraan säätimen arvo
        applyFilters();
    }

    function adjustColorTemperature() {
        const sliderValue = parseFloat(document.getElementById('colorTemperature').value);
        currentColorTemperature = sliderValue;
        applyFilters();
    }

    function adjustSaturation() {
        const sliderValue = parseFloat(document.getElementById('saturation').value);
        currentSaturation = sliderValue;
        applyFilters();
    }

    function resetValue(sliderId) {
        const slider = document.getElementById(sliderId);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const defaultValue = (max + min) / 2;

        slider.value = defaultValue;

        // Päivitetään filtterit
        if (sliderId === 'brightness') {
            adjustBrightness();
        } else if (sliderId === 'contrast') {
            adjustContrast();
        } else if (sliderId === 'colorTemperature') {
            adjustColorTemperature();
        } else if (sliderId === 'saturation') {
            adjustSaturation();
        }
    }

    function showOriginal(show) {
        const bypassLabel = document.getElementById('bypassFilters');
        const controls = document.querySelectorAll('#brightness, #contrast, #colorTemperature, #cropButton, #squareCrop, #rotateImage, #saturation');

        if (show) {
            bypassLabel.innerHTML = "Release to Stop Comparing";
            controls.forEach(control => control.setAttribute('disabled', 'disabled'));
        } else {
            bypassLabel.innerHTML = "Compare to original";
            controls.forEach(control => control.removeAttribute('disabled'));
        }

        // Muutetaan bypassFilters tilaa lennosta.
        applyFilters(show);
    }

    function applyFilters(bypass = false) {
        const img = document.getElementById('preview');
        const originalSrc = img.dataset.original;  // Nyt tämä viittaa pienennettyyn kuvaan
        const originalImg = new Image();
        originalImg.src = originalSrc;

        const bypassFilters = bypass;
        const bypassButton = document.querySelector('button[id="bypassFilters"]');

        // Jos "Show original" on valittu, korosta nappi-elementtiä
        if (bypassFilters) {
            bypassButton.classList.add('highlighted');
        } else {
            bypassButton.classList.remove('highlighted');
        }

        // Haetaan kaikki säätimet
        const controls = document.querySelectorAll('#brightness, #contrast, #colorTemperature, #cropButton, #squareCrop, #rotateImage, #saturation');

        // Jos "Show original" on valittu, disabloi säätimet
        if (bypassFilters) {
            controls.forEach(control => control.setAttribute('disabled', 'disabled'));
        } else {
            controls.forEach(control => control.removeAttribute('disabled'));
        }

        originalImg.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = originalImg.width;
            canvas.height = originalImg.height;

            if (bypassFilters) {
                // Jos säätimet on ohitettu, näytä normaali kuva
                ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
            } else {
                // Sovelletaan kirkkauden ja kontrastin säätö
                ctx.filter = `brightness(${currentBrightness}) contrast(${currentContrast}) saturate(${currentSaturation})`;
                ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);

                // Sovelletaan värilämpötilan korjaus
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    let redAdjustment, greenAdjustment, blueAdjustment;

                    if (currentColorTemperature > 0) {
                        redAdjustment = currentColorTemperature * 20;
                        greenAdjustment = currentColorTemperature * 0;
                        blueAdjustment = -20;
                    } else if (currentColorTemperature < 0) {
                        redAdjustment = -5;
                        greenAdjustment = 0;
                        blueAdjustment = currentColorTemperature * -15;
                    } else {
                        redAdjustment = 0;
                        greenAdjustment = 0;
                        blueAdjustment = 0;
                    }

                    data[i] += redAdjustment; // Punainen kanava
                    data[i + 1] += greenAdjustment; // Vihreä kanava
                    data[i + 2] += blueAdjustment; // Sininen kanava
                }
                ctx.filter = 'none'; // Poista suodatin, jotta värilämpötila säätö ei vaikuta uudelleen
                ctx.putImageData(imageData, 0, 0);
            }

            img.src = canvas.toDataURL();
        };
    }
///////////
    function rotateImage() {
        cropHandler(true);
        const img = document.getElementById('preview');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Vaihda leveys ja korkeus
        canvas.width = img.naturalHeight;
        canvas.height = img.naturalWidth;

        // Tallenna nykyinen tila
        ctx.save();

        // Siirrä piirtoaluetta ja kierrä
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(90 * Math.PI / 180);

        // Piirrä kuva kierrettynä
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);

        // Palauta tila
        ctx.restore();

        // Päivitä kuvan src
        img.src = canvas.toDataURL();

        // Päivitä myös alkuperäinen kuva, jotta kierrot säilyvät
        img.dataset.original = img.src;
        // Aseta croppingStarted takaisin falseksi
        croppingStarted = false;
        // Päivitä cropCanvas koko ja sijainti
        const cropCanvas = document.getElementById('cropCanvas');
        cropCanvas.width = img.clientWidth;
        cropCanvas.height = img.clientHeight;
        cropCanvas.style.left = img.offsetLeft + 'px';
        cropCanvas.style.top = img.offsetTop + 'px';
    }

    ///////////////////////
    function cropHandler(stop) {
        if (isCropping) {
            stopCropping();
        } else if (!stop) {
            startCropping();
        }
    }

    let resizing = false;
    let resizeDirection = '';
    let cropStartX = 0;
    let cropStartY = 0;
    let cropWidth = 0;
    let cropHeight = 0;

    function isNear(value1, value2) {
        const tolerance = 20; // Voit säätää tätä arvoa tarpeen mukaan
        return Math.abs(value1 - value2) < tolerance;
    }

    function stopCropping() {
        if (typeof resizing !== 'undefined') resizing = false;
        if (typeof resizeDirection !== 'undefined') resizeDirection = '';
        if (typeof cropStartX !== 'undefined') cropStartX = 0;
        if (typeof cropStartY !== 'undefined') cropStartY = 0;
        if (typeof cropWidth !== 'undefined') cropWidth = 0;
        if (typeof cropHeight !== 'undefined') cropHeight = 0;
        console.log('Resetting offsetX and ...Y');
        if (typeof offsetX !== 'undefined') offsetX = 0;
        if (typeof offsetY !== 'undefined') offsetY = 0;
        if (typeof hasLeftCanvas !== 'undefined') hasLeftCanvas = false;

        // Remove document-level mouse events
        document.onmousemove = null;
        document.onmouseup = null;

        // Hide the markers and canvas
        markers.style.display = 'none';
        canvas.style.display = 'none';

        // Reset isCropping state
        isCropping = false;

        // Reset cursor to default
        document.body.style.cursor = 'default';

        console.log("Turning off cropping");
    }

    let offsetX = 0; // Hiiren ja rajausalueen x-koordinaatin välinen ero
    let offsetY = 0; // Hiiren ja rajausalueen y-koordinaatin välinen ero
    function startCropping() {

        // Varaudutaan muuttamaan kursorin tyyliä...
        document.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            updateCursor(x, y);
        });

        const img = document.getElementById('preview');

        // checkForStopCropping


        // Aseta kankaan koko ja sijainti kuvan mukaiseksi
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        canvas.style.left = img.offsetLeft + 'px';
        canvas.style.top = img.offsetTop + 'px';
        canvas.style.display = 'block';

        // Aseta rajausalueen koko kuvan kapeamman sivun mukaiseksi
        cropWidth = cropHeight = Math.min(canvas.width, canvas.height);

        // Aseta rajausalueen sijainti kuvan keskelle
        cropStartX = (canvas.width - cropWidth) / 2;
        cropStartY = (canvas.height - cropHeight) / 2;

        // Piirrä tummennettu filmi ja rajausalue
        drawCropBox(ctx, cropStartX, cropStartY, cropWidth, cropHeight);

        // Lisää tapahtumankäsittelijät rajausalueen koon muuttamiseen
        const rect = canvas.getBoundingClientRect(); // Hae kankaan suhteellinen sijainti

        let hasLeftCanvas = false; // Lisää tämä muuttuja koodisi alkuun
        function handleMouseMove(e) {
            // // console.log("handleMouseMove called");
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const boundedX = Math.max(0, Math.min(x, canvas.width));
            const boundedY = Math.max(0, Math.min(y, canvas.height));


            // Katsotaan, onko kursori vielä kankaalla...
            if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
                hasLeftCanvas = true;
            } else if (hasLeftCanvas) {
                hasLeftCanvas = false;
                offsetX = boundedX - cropStartX;
                offsetY = boundedY - cropStartY;
            }

            // Päivitä kursori, vaikka ei oltaisikaan resizing-tilassa
            updateCursor(boundedX, boundedY);

            if (resizing) {
                switch (resizeDirection) {
                    case 'move':
                        cropStartX = boundedX - offsetX;
                        cropStartY = boundedY - offsetY;
                        break;
                    case 'top-left':
                        cropWidth = cropStartX + cropWidth - boundedX;
                        cropHeight = cropStartY + cropHeight - boundedY;
                        cropStartX = boundedX;
                        cropStartY = boundedY;
                        break;
                    case 'top-right':
                        cropWidth = boundedX - cropStartX;
                        cropHeight = cropStartY + cropHeight - boundedY;
                        cropStartY = boundedY;
                        break;
                    case 'bottom-left':
                        cropWidth = cropStartX + cropWidth - boundedX;
                        cropHeight = boundedY - cropStartY;
                        cropStartX = boundedX;
                        break;
                    case 'bottom-right':
                        cropWidth = boundedX - cropStartX;
                        cropHeight = boundedY - cropStartY;
                        break;
                    case 'top':
                        cropHeight = cropStartY + cropHeight - boundedY;
                        cropStartY = boundedY;
                        break;
                    case 'bottom':
                        cropHeight = boundedY - cropStartY;
                        break;
                    case 'left':
                        cropWidth = cropStartX + cropWidth - boundedX;
                        cropStartX = boundedX;
                        break;
                    case 'right':
                        cropWidth = boundedX - cropStartX;
                        break;
                }

                // Päivitä tartuntakohtaa lähestyttäessä kuvan reunaa
                if (resizeDirection === 'move') {
                    // Vasen reuna
                    if ((cropStartX <= 0 && boundedX < cropStartX + cropWidth) || boundedX <= 0) {
                        offsetX = boundedX;
                    }
                    // Oikea reuna
                    else if ((cropStartX + cropWidth >= canvas.width && boundedX > cropStartX) || boundedX >= canvas.width) {
                        offsetX = boundedX - canvas.width + cropWidth;
                    }

                    // Yläreuna
                    if ((cropStartY <= 0 && boundedY < cropStartY + cropHeight) || boundedY <= 0) {
                        offsetY = boundedY;
                    }
                    // Alareuna
                    else if ((cropStartY + cropHeight >= canvas.height && boundedY > cropStartY) || boundedY >= canvas.height) {
                        offsetY = boundedY - canvas.height + cropHeight;
                    }
                }

                // Tarkista, ettei rajaus mene kuvan ulkopuolelle
                cropStartX = Math.max(0, Math.min(cropStartX, canvas.width - cropWidth));
                cropStartY = Math.max(0, Math.min(cropStartY, canvas.height - cropHeight));
                cropWidth = Math.min(canvas.width - cropStartX, cropWidth);
                cropHeight = Math.min(canvas.height - cropStartY, cropHeight);
                drawCropBox(ctx, cropStartX, cropStartY, cropWidth, cropHeight);
                // isCropping = true; // Aseta rajauksen tila päälle
                // console.log("Turning on cropping"); // Debug
            }

        }
        isCropping = true; // Aseta rajauksen tila päälle
        canvas.addEventListener('mousemove', handleMouseMove);

        function updateCursor(x, y) {
            if (isNear(x, cropStartX) && isNear(y, cropStartY)) document.body.style.cursor = 'nwse-resize';
            else if (isNear(x, cropStartX + cropWidth) && isNear(y, cropStartY)) document.body.style.cursor = 'nesw-resize';
            else if (isNear(x, cropStartX) && isNear(y, cropStartY + cropHeight)) document.body.style.cursor = 'nesw-resize';
            else if (isNear(x, cropStartX + cropWidth) && isNear(y, cropStartY + cropHeight)) document.body.style.cursor = 'nwse-resize';
            else if (isNear(x, cropStartX + cropWidth / 2) && isNear(y, cropStartY)) document.body.style.cursor = 'ns-resize';
            else if (isNear(x, cropStartX + cropWidth / 2) && isNear(y, cropStartY + cropHeight)) document.body.style.cursor = 'ns-resize';
            else if (isNear(y, cropStartY + cropHeight / 2) && isNear(x, cropStartX)) document.body.style.cursor = 'ew-resize';
            else if (isNear(y, cropStartY + cropHeight / 2) && isNear(x, cropStartX + cropWidth)) document.body.style.cursor = 'ew-resize';
            else document.body.style.cursor = 'default';
        }

        document.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (isNear(x, cropStartX) && isNear(y, cropStartY)) resizeDirection = 'top-left';
            else if (isNear(x, cropStartX + cropWidth) && isNear(y, cropStartY)) resizeDirection = 'top-right';
            else if (isNear(x, cropStartX) && isNear(y, cropStartY + cropHeight)) resizeDirection = 'bottom-left';
            else if (isNear(x, cropStartX + cropWidth) && isNear(y, cropStartY + cropHeight)) resizeDirection = 'bottom-right';
            else if (isNear(x, cropStartX + cropWidth / 2) && isNear(y, cropStartY)) resizeDirection = 'top';
            else if (isNear(x, cropStartX + cropWidth / 2) && isNear(y, cropStartY + cropHeight)) resizeDirection = 'bottom';
            else if (isNear(y, cropStartY + cropHeight / 2) && isNear(x, cropStartX)) resizeDirection = 'left';
            else if (isNear(y, cropStartY + cropHeight / 2) && isNear(x, cropStartX + cropWidth)) resizeDirection = 'right';

            if (resizeDirection) {
                resizing = true;
            } else if (x > cropStartX && x < cropStartX + cropWidth && y > cropStartY && y < cropStartY + cropHeight) {
                resizing = true;
                resizeDirection = 'move';
                offsetX = x - cropStartX;
                offsetY = y - cropStartY;
            }
            document.onmousemove = handleMouseMove;
            document.onmouseup = handleMouseReleaseOrLeave;
        });

        // canvas.onmousemove = handleMouseMove;

        function handleMouseReleaseOrLeave() {
            // Tarkista, onko rajausalue kääntynyt
            if (cropWidth < 0) {
                cropStartX += cropWidth;
                cropWidth = Math.abs(cropWidth);
            }
            if (cropHeight < 0) {
                cropStartY += cropHeight;
                cropHeight = Math.abs(cropHeight);
            }

            resizing = false;
            resizeDirection = null;
            // Nollaa document.onmousemove ja document.onmouseup
            document.onmousemove = null;
            document.onmouseup = null;
        }
        markers.style.display = 'block'; // Näytä rajausmerkit, kun aloitat rajauksen
        isCropping = true; // Aseta rajauksen tila päälle
        console.log("Turning on cropping"); // Debug
    }

    function showMarkers(x, y, width, height) {
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
            // This is a closing call, returning...
            return;
        }
        const markers = document.getElementById('markers');
        markers.style.display = 'block';

        const topLeft = document.getElementById('top-left');
        topLeft.style.left = `${x - 5}px`;
        topLeft.style.top = `${y - 5}px`;

        const topRight = document.getElementById('top-right');
        topRight.style.left = `${x + width - 5}px`;
        topRight.style.top = `${y - 5}px`;

        const bottomLeft = document.getElementById('bottom-left');
        bottomLeft.style.left = `${x - 5}px`;
        bottomLeft.style.top = `${y + height - 5}px`;

        const bottomRight = document.getElementById('bottom-right');
        bottomRight.style.left = `${x + width - 5}px`;
        bottomRight.style.top = `${y + height - 5}px`;

        const topCenter = document.getElementById('top-center');
        topCenter.style.left = `${x + width / 2 - 5}px`;
        topCenter.style.top = `${y - 5}px`;

        const bottomCenter = document.getElementById('bottom-center');
        bottomCenter.style.left = `${x + width / 2 - 5}px`;
        bottomCenter.style.top = `${y + height - 5}px`;

        const leftCenter = document.getElementById('left-center');
        leftCenter.style.left = `${x - 5}px`;
        leftCenter.style.top = `${y + height / 2 - 5}px`;

        const rightCenter = document.getElementById('right-center');
        rightCenter.style.left = `${x + width - 5}px`;
        rightCenter.style.top = `${y + height / 2 - 5}px`;
    }

    // function drawCropBox(ctx, x, y, width, height) {
    //     // Tyhjennä koko kangas
    //     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //     // Piirrä tummennettu filmi
    //     ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    //     ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //     // Poista tummennus rajausalueelta
    //     ctx.save();
    //     ctx.globalCompositeOperation = 'destination-out';
    //     ctx.fillRect(x, y, width, height);
    //     ctx.restore();

    //     // Piirrä rajausalueen reunat
    //     ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    //     ctx.lineWidth = 2;
    //     ctx.strokeRect(x, y, width, height);

    //     // Piirrä neliöt
    //     const shouldDrawOutside = (width === ctx.canvas.width - 10 || height === ctx.canvas.height - 10); // Huomioi lisätty 10px
    //     if (shouldDrawOutside) {
    //         ctx.globalCompositeOperation = 'source-over';
    //     }

    //     // Päivitä CSS-elementtien sijainti
    //     showMarkers(x, y, width, height);
    // }
function drawCropBox(ctx, x, y, width, height) {
        // Tyhjennä koko kangas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Piirrä tummennettu filmi
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // // Poista tummennus rajausalueelta
        // ctx.save();
        // ctx.globalCompositeOperation = 'destination-out';
        // ctx.fillRect(x, y, width, height);
        // ctx.restore();

// Poista tummennus rajausalueelta
ctx.save();
ctx.globalCompositeOperation = 'destination-out';
ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Täysi läpinäkyvyys
ctx.fillRect(x, y, width, height);
ctx.restore();

        // Piirrä rajausalueen reunat
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Piirrä neliöt
        const shouldDrawOutside = (width === ctx.canvas.width - 10 || height === ctx.canvas.height - 10); // Huomioi lisätty 10px
        if (shouldDrawOutside) {
            ctx.globalCompositeOperation = 'source-over';
        }

        // Päivitä CSS-elementtien sijainti
        showMarkers(x, y, width, height);
}

    let originalValues = {};

    function saveOriginalValues() {
        originalValues = {
            cropStartX,
            cropStartY,
            cropWidth,
            cropHeight
        };
    }

    function restoreOriginalValues() {
        cropStartX = originalValues.cropStartX;
        cropStartY = originalValues.cropStartY;
        cropWidth = originalValues.cropWidth;
        cropHeight = originalValues.cropHeight;

        // Piirrä rajausalue uudelleen
        const canvas = document.getElementById('cropCanvas');
        const ctx = canvas.getContext('2d');
        drawCropBox(ctx, cropStartX, cropStartY, cropWidth, cropHeight);
    }

    function makeSquare() {
        // Tallenna alkuperäiset arvot
        saveOriginalValues();
        // Laske rajausalueen keskipiste
        const centerX = cropStartX + cropWidth / 2;
        const centerY = cropStartY + cropHeight / 2;

        // Hae kankaan koko
        const canvas = document.getElementById('cropCanvas');
        const maxSquareSize = Math.min(canvas.width, canvas.height);

        // Aseta rajausalueen uusi koko sen kapeamman sivun mukaiseksi
        let size = Math.max(cropWidth, cropHeight);

        // Jos koko on suurempi kuin kuvan lyhyempi sivu, palautetaan se kuvan lyhyemmän sivun kokoiseksi
        if (size > maxSquareSize) {
            size = maxSquareSize;
        }

        // Aseta rajausalueen uusi sijainti niin, että keskipiste säilyy
        cropStartX = centerX - size / 2;
        cropStartY = centerY - size / 2;
        cropWidth = cropHeight = size;

        // Tarkista, ettei rajausalue mene kuvan ulkopuolelle
        if (cropStartX < 0) cropStartX = 0;
        if (cropStartY < 0) cropStartY = 0;
        if (cropStartX + cropWidth > canvas.width) cropStartX = canvas.width - cropWidth;
        if (cropStartY + cropHeight > canvas.height) cropStartY = canvas.height - cropHeight;

        // Piirrä rajausalue uudelleen
        const ctx = canvas.getContext('2d');
        drawCropBox(ctx, cropStartX, cropStartY, cropWidth, cropHeight);
    }

    // Lisää tapahtumankäsittelijä napille
    document.getElementById('squareCrop').addEventListener('click', makeSquare);