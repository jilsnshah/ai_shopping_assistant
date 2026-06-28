import pytest
import firebase_db
from unittest.mock import patch, MagicMock

@pytest.fixture(autouse=True)
def mock_firebase_init():
    with patch('firebase_db.initialize_firebase'):
        yield

def test_load_seller_data_success():
    """Test retrieving seller data from Firebase"""
    mock_data = {
        'company_info': {'name': 'Test Company'},
        'orders': [{'id': '1', 'total': 100}],
        'products': [{'id': 'p1', 'name': 'Item'}]
    }
    
    with patch('firebase_db.db.reference') as mock_ref:
        mock_ref.return_value.get.return_value = mock_data
        
        result = firebase_db.load_seller_data('test_seller@gmail.com')
        
        assert result is not None
        assert result['company_info']['name'] == 'Test Company'
        assert len(result['orders']) == 1

def test_load_seller_data_not_found():
    """Test retrieving data for a non-existent seller"""
    with patch('firebase_db.db.reference') as mock_ref:
        mock_ref.return_value.get.return_value = None
        
        result = firebase_db.load_seller_data('unknown@gmail.com')
        assert result is not None
        assert result['company_info'] == {}

def test_save_seller_data():
    """Test saving seller data to Firebase"""
    mock_data = {'company_info': {'name': 'New Company'}}
    
    with patch('firebase_db.db.reference') as mock_ref:
        mock_ref_instance = mock_ref.return_value
        
        result = firebase_db.save_seller_data('test_seller@gmail.com', mock_data)
        
        mock_ref_instance.update.assert_called_once_with(mock_data)
        assert result is True
