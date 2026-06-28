import firebase_db
from firebase_admin import db

firebase_db.initialize_firebase()
seller_id = "jilsnshah@gmail.com"
data = firebase_db.load_seller_data(seller_id)

orders = data.get('orders', [])
products = data.get('products', [])

print("Orders type:", type(orders))
if len(orders) > 0:
    if isinstance(orders, dict):
        print("First order key:", list(orders.keys())[0])
        print("First order val type:", type(list(orders.values())[0]))
    elif isinstance(orders, list):
        print("First order:", orders[0] if orders[0] is not None else (orders[1] if len(orders) > 1 else None))

print("Products type:", type(products))
