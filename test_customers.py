import httpx

client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1")
res = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
if res.status_code == 200:
    token = res.json()["access_token"]
    res2 = client.get("/customers", headers={"Authorization": f"Bearer {token}"})
    print(res2.status_code)
    print(res2.text)
else:
    print("Login failed:")
    print(res.text)
