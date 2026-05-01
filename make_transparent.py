from PIL import Image

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    newData = []
    
    # Tolerances for white
    for item in datas:
        # Check if the pixel is white-ish
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(out_path, "PNG")

remove_white_bg("public/images/tata_harrier_ev.png", "public/images/tata_harrier_ev_transparent.png")
