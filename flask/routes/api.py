# flask/routes/api.py
from flask import Blueprint, jsonify, current_app, request
from datetime import datetime
from extensions import db
from models.accounts import Accounts, Account_Snapshots

bp = Blueprint('api', __name__)

@bp.route('/hello')
def hello():
    return jsonify({
        'message': 'Hello, World!',
        'timestamp': datetime.now().isoformat()
    })

@bp.route('/health')
def health():
    return jsonify({'status': 'healthy'})

# =============================================================================
# ACCOUNTS CRUD OPERATIONS
# =============================================================================
# CREATE - Add a new account
@bp.route('/accounts', methods=['POST'])
def create_account():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['description', 'account_name', 'account_type']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create new account
        account = Accounts(
            description=data['description'],
            account_name=data['account_name'],
            account_type=data['account_type']
        )
        
        db.session.add(account)
        db.session.commit()
        
        return jsonify({
            'message': 'Account created successfully',
            'account': {
                'id': account.id,
                'description': account.description,
                'account_name': account.account_name,
                'account_type': account.account_type,
                'created_at': account.created_at.isoformat(),
                'updated_at': account.updated_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# READ - Get all accounts or specific account
@bp.route('/accounts', methods=['GET'])
@bp.route('/accounts/<int:account_id>', methods=['GET'])
def get_accounts(account_id=None):
    try:
        pass    
    except Exception as e:
        return jsonify({'error': str(e)}), 500