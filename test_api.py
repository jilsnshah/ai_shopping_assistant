import requests

session = requests.Session()

# 1. Login to set session cookie
res1 = session.post('http://127.0.0.1:5002/api/login', json={'seller_id': 'jilsnshah@gmail.com'})
print("Login Status:", res1.status_code)
print("Login Response:", res1.json())
print("Cookies:", session.cookies.get_dict())

# 2. Get Orders
res2 = session.get('http://127.0.0.1:5002/api/orders')
print("\nOrders Status:", res2.status_code)
print("Orders Response:", res2.json())

# 3. Get Products
res3 = session.get('http://127.0.0.1:5002/api/products')
print("\nProducts Status:", res3.status_code)
print("Products Response:", res3.json())
