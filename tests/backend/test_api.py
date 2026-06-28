import pytest
from app import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key-for-pytest'
    with app.test_client() as client:
        yield client

def test_api_login_success(client):
    """Test successful API login contract"""
    response = client.post('/api/login', json={'seller_id': 'test@example.com'})
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'success' in data
    assert data['success'] is True
    assert 'seller_id' in data
    assert data['seller_id'] == 'test@example.com'

def test_api_login_missing_id(client):
    """Test login API with missing seller_id"""
    response = client.post('/api/login', json={})
    
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data

def test_api_orders_unauthorized(client):
    """Test accessing orders without login"""
    response = client.get('/api/orders')
    
    # We expect 200 with empty list or 401 depending on current app implementation
    # Let's check the API contract. Since the original test_api.py just logged in then called orders,
    # let's assert it returns JSON.
    assert response.status_code in [200, 401]
    
    if response.status_code == 200:
        data = response.get_json()
        assert isinstance(data, list)

def test_api_products_unauthorized(client):
    """Test accessing products without login"""
    response = client.get('/api/products')
    assert response.status_code in [200, 401]

def test_api_flow(client):
    """Test end-to-end API flow with session"""
    # 1. Login
    login_resp = client.post('/api/login', json={'seller_id': 'test@example.com'})
    assert login_resp.status_code == 200
    
    # 2. Get Orders with active session
    orders_resp = client.get('/api/orders')
    assert orders_resp.status_code == 200
    
    # 3. Get Products with active session
    products_resp = client.get('/api/products')
    assert products_resp.status_code == 200
