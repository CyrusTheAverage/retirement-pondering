# flask/routes/api.py
from flask import Blueprint, jsonify, current_app, request
from datetime import datetime
from extensions import db
from models.accounts import Accounts
from models.account_snapshots import Account_Snapshots

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
        if account_id:
            # Get specific account
            account = Accounts.query.get(account_id)
            if not account:
                return jsonify({'error': f'Account with id {account_id} not found'}), 404
            
            return jsonify({
                'account': {
                    'id': account.id,
                    'description': account.description,
                    'account_name': account.account_name,
                    'account_type': account.account_type,
                    'created_at': account.created_at.isoformat(),
                    'updated_at': account.updated_at.isoformat()
                }
            }), 200
        else:
            # Get all accounts
            accounts = Accounts.query.order_by(Accounts.created_at.desc()).all()
            
            return jsonify({
                'accounts': [{
                    'id': account.id,
                    'description': account.description,
                    'account_name': account.account_name,
                    'account_type': account.account_type
                } for account in accounts],
                'total': len(accounts)
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/account-snapshots', methods=['POST'])
def create_account_snapshots():
    try:
        data = request.get_json()
        
        # Validate that we have snapshots data
        if 'snapshots' not in data or not isinstance(data['snapshots'], list):
            return jsonify({'error': 'Request must contain a "snapshots" array'}), 400
        
        if not data['snapshots']:
            return jsonify({'error': 'Snapshots array cannot be empty'}), 400
        
        created_snapshots = []
        
        for snapshot_data in data['snapshots']:
            # Validate required fields for each snapshot
            required_fields = ['account_id', 'snapshot_date', 'amount']
            for field in required_fields:
                if field not in snapshot_data or snapshot_data[field] is None:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            # Validate account_id exists
            account = Accounts.query.get(snapshot_data['account_id'])
            if not account:
                return jsonify({'error': f'Account with id {snapshot_data["account_id"]} not found'}), 404
            
            # Validate amount is a positive number
            try:
                amount = float(snapshot_data['amount'])
                if amount < 0:
                    return jsonify({'error': 'Amount must be a positive number'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Amount must be a valid number'}), 400
            
            # Validate and parse date
            try:
                if isinstance(snapshot_data['snapshot_date'], str):
                    snapshot_date = datetime.strptime(snapshot_data['snapshot_date'], '%Y-%m-%d').date()
                else:
                    snapshot_date = snapshot_data['snapshot_date']
            except (ValueError, TypeError):
                return jsonify({'error': 'snapshot_date must be a valid date in YYYY-MM-DD format'}), 400
            
            # Create new snapshot
            snapshot = Account_Snapshots(
                account_id=snapshot_data['account_id'],
                snapshot_date=snapshot_date,
                amount=amount
            )
            
            db.session.add(snapshot)
            created_snapshots.append({
                'id': snapshot.id,  # Will be populated after commit
                'account_id': snapshot.account_id,
                'snapshot_date': snapshot.snapshot_date.isoformat(),
                'amount': float(snapshot.amount)
            })
        
        # Commit all snapshots at once
        db.session.commit()
        
        # Update the IDs in the response after commit
        for i, snapshot in enumerate(created_snapshots):
            snapshot['id'] = db.session.query(Account_Snapshots).filter_by(
                account_id=snapshot['account_id'],
                snapshot_date=datetime.strptime(snapshot['snapshot_date'], '%Y-%m-%d').date(),
                amount=snapshot['amount']
            ).first().id
        
        return jsonify({
            'message': f'Successfully created {len(created_snapshots)} account snapshot(s)',
            'snapshots': created_snapshots
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
