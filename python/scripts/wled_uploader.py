import requests
from PIL import Image
import json

def send_image_to_wled(image_path, wled_ip, led_count=256):
    img = Image.open(image_path)
    img = img.resize((16, 16))
    img = img.convert('RGB')
    width, height = img.size

    pixels = list(img.getdata())

    reordered_pixels = []
    for row in range(height):
        start = row * width
        end = start + width
        row_pixels = pixels[start:end]

        # For odd rows (1, 3, 5...), reverse the pixels for serpentine wiring
        if row % 2 == 1:
            row_pixels.reverse()

        reordered_pixels.extend(row_pixels)

    hex_colors = ['{:02X}{:02X}{:02X}'.format(r, g, b) for r, g, b in reordered_pixels]
    hex_colors = hex_colors[:led_count]

    payload = {
        "on": True,
        "seg": [
            {
                "id": 0,
                "i": hex_colors
            }
        ]
    }

    url = f"http://{wled_ip}/json/state"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, headers=headers, data=json.dumps(payload))