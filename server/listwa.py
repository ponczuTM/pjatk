import requests
import time

IP = "172.19.240.69"
PASSPHRASE = "" 
BASE_URL = f"http://{IP}/netio.cgi?pass={PASSPHRASE}"

def send_command(params):
    url = f"{BASE_URL}&{params}"
    try:
        response = requests.get(url)
        print(f"Wysłano: {params} | Status: {response.status_code}")
    except Exception as e:
        print(f"Błąd przy wysyłaniu polecenia: {e}")

print("Wyłączanie wszystkich gniazd...")
send_command("output1=0&output2=0&output3=0&output4=0")
time.sleep(10)

print("Włączanie gniazda 1...")
send_command("output1=1&output2=5&output3=5&output4=5")
time.sleep(10)

print("Włączanie gniazda 4...")
send_command("output1=5&output2=5&output3=5&output4=1")
time.sleep(10)

print("Włączanie wszystkich gniazd...")
send_command("output1=1&output2=1&output3=1&output4=1")
print("Zakończono sekwencję.")