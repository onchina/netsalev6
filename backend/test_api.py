import requests

login_data = {
    "username": "admin",
    "password": "password123" # assuming default maybe? Or check tests
}
# Try to login first, if we can't we'll just generate a JWT
