import qrcode
from PIL import Image

def generate_qr(data, filename):
    # Konfiguracja generatora QR
    # box_size=10 przy wersji 1 (21x21 modułów) + marginesach 
    # daje rozmiar zbliżony do 300x300px.
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(data)
    qr.make(fit=True)

    # Tworzenie obrazu (czarno-biały, klasyczny)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Skalowanie dokładnie do 300x300 pikseli
    img = img.resize((300, 300), Image.NEAREST)
    
    # Zapis pliku
    img.save(filename)
    print(f"Wygenerowano: {filename} dla adresu: {data}")

# Dane do wygenerowania
urls = [
    ("http://172.19.240.69:5173/", "qr_1.png"),
    ("http://172.19.240.69:5173/questions", "qr_2.png")
]

if __name__ == "__main__":
    for url, name in urls:
        generate_qr(url, name)