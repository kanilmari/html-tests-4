    const picaInstance = pica();

    document.getElementById('imageInput').addEventListener('change', handleImageUpload);

    function handleImageUpload(event) {
        const file = event.target.files[0];

        if (!file) return;

        const img = new Image();
        const reader = new FileReader();

        reader.onload = function (e) {
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);

        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 600;

            // Calculate new height to maintain aspect ratio
            const aspectRatio = img.height / img.width;
            const newHeight = maxWidth * aspectRatio;

            // Set canvas size to resized dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            const outputCanvas = document.getElementById('outputCanvas');
            outputCanvas.width = maxWidth;
            outputCanvas.height = newHeight;

            // Resize image using Pica
            picaInstance.resize(canvas, outputCanvas, {
                quality: 3,
                unsharpAmount: 80,
                unsharpRadius: 0.6,
                unsharpThreshold: 2
            })
            .then(() => {
                console.log('Image resized successfully!');
            })
            .catch((error) => {
                console.error('Image resize error:', error);
            });
        };
    }