function rgbToHex(r, g, b) {
    return [r, g, b]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

function serpentineIndex(x, y, width = 16) {
    return (y % 2 === 0) ? y * width + x : y * width + (width - 1 - x);
}

function setPixelColor(index, [r, g, b], serverIp) {
    return new Promise((resolve, reject) => {
        if (
            !index ||
            !Array.isArray(index) || index.length !== 2 ||
            !Array.isArray([r, g, b]) ||
            !serverIp
        ) {
            reject("Missing or invalid index, RGB array, or server IP.");
            return;
        }

        const [x, y] = index;

        if (
            typeof x !== "number" || x < 0 || x > 15 ||
            typeof y !== "number" || y < 0 || y > 15
        ) {
            reject("x and y must be numbers between 0 and 15.");
            return;
        }

        console.log(`Placing pixel at (${x}, ${y}) with color RGB(${r}, ${g}, ${b}) via ${serverIp}`);

        fetch(`${serverIp}/image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x, y, r, g, b }),
        })
            .then((res) => {
                if (!res.ok) {
                    return res.text().then((text) => {
                        throw new Error(text || res.statusText);
                    });
                }
                return res.json();
            })
            .then((json) => resolve(json))
            .catch((err) => reject("Network error: " + err));
    });
}

function fetchAndDrawImage(serverIp) {
    console.log(`Fetching image data from ${serverIp}/image`);

    fetch(`${serverIp}/image`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to fetch image data");
            }
            return res.json();
        })
        .then(imageData => {
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");

            // Clear canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < imageData.length; y++) {
                for (let x = 0; x < imageData[y].length; x++) {
                    const [r, g, b] = imageData[y][x];
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            console.log(`Image drawn to canvas from ${serverIp}`);
        })
        .catch(err => {
            console.error(`Error loading image from ${serverIp}:`, err);
        });
}
