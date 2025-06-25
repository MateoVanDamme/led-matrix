function rgbToHex(r, g, b) {
    return [r, g, b]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

function reorderSerpentine(rgbArray, width = 16, height = 16) {
    const reordered = [];

    for (let y = 0; y < height; y++) {
        if (y % 2 === 0) {
            // Even row - left to right (normal)
            for (let x = 0; x < width; x++) {
                reordered.push(rgbArray[y * width + x]);
            }
        } else {
            // Odd row - right to left (reverse)
            for (let x = width - 1; x >= 0; x--) {
                reordered.push(rgbArray[y * width + x]);
            }
        }
    }

    return reordered;
}

// Upload RGB array to WLED
function displayRgbArray(rgbArray, wledIp) {
    return new Promise((resolve, reject) => {
        if (!rgbArray || !wledIp) {
            reject("Missing RGB array or WLED IP");
            return;
        }

        const hexColors = rgbArray.map(([r, g, b]) => rgbToHex(r, g, b));

        const payload = {
            on: true,
            seg: [{ id: 0, i: hexColors }],
        };

        fetch(`http://${wledIp}/json/state`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => {
                if (!res.ok) {
                    return res.text().then((text) => {
                        throw new Error(text || res.statusText);
                    });
                }
                return res.text();
            })
            .then((text) => resolve(text))
            .catch((err) => reject("Network error: " + err));
    });
}

// Read image file, resize to 16x16, extract RGB array, then upload
function displayFile(file, wledIp) {
    return new Promise((resolve, reject) => {
        if (!file || !wledIp) {
            reject("Please select an image and enter WLED IP.");
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = function (e) {
            img.onload = function () {
                // Create offscreen canvas
                const canvas = document.createElement("canvas");
                canvas.width = 16;
                canvas.height = 16;
                const ctx = canvas.getContext("2d");
                // ctx.imageSmoothingEnabled = false;
                // ctx.imageSmoothingQuality = "low";

                ctx.clearRect(0, 0, 16, 16);
                ctx.drawImage(img, 0, 0, 16, 16);

                const imageData = ctx.getImageData(0, 0, 16, 16).data;
                const rgbArray = [];

                for (let i = 0; i < imageData.length; i += 4) {
                    rgbArray.push([
                        imageData[i],     // r
                        imageData[i + 1], // g
                        imageData[i + 2], // b
                    ]);
                }

                // Call displayRgbArray with the extracted data
                const correctedArray = reorderSerpentine(rgbArray, 16, 16);
                displayRgbArray(correctedArray, wledIp)
                    .then(resolve)
                    .catch(reject);

            };

            img.onerror = () => reject("Failed to load the image.");
            img.src = e.target.result;
        };

        reader.onerror = () => reject("Failed to read the file.");
        reader.readAsDataURL(file);
    });
}