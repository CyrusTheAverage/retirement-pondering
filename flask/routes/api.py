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
        if account_id:
            # Get specific account with snapshots
            account = Accounts.query.get_or_404(account_id)
            snapshots = Account_Snapshots.query.filter_by(account_id=account_id).order_by(Account_Snapshots.snapshot_date.desc()).all()
            
            return jsonify({
                'account': {
                    'id': account.id,
                    'description': account.description,
                    'account_name': account.account_name,
                    'account_type': account.account_type,
                    'created_at': account.created_at.isoformat(),
                    'updated_at': account.updated_at.isoformat(),
                    'snapshots': [{
                        'id': snapshot.id,
                        'snapshot_date': snapshot.snapshot_date.isoformat(),
                        'amount': float(snapshot.amount),
                        'created_at': snapshot.created_at.isoformat(),
                        'updated_at': snapshot.updated_at.isoformat()
                    } for snapshot in snapshots]
                }
            })
        else:
            # Get all accounts with optional filtering
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            account_type = request.args.get('account_type')
            account_name = request.args.get('account_name')
            include_snapshots = request.args.get('include_snapshots', 'false').lower() == 'true'
            
            query = Accounts.query
            
            # Apply filters
            if account_type:
                query = query.filter(Accounts.account_type == account_type)
            if account_name:
                query = query.filter(Accounts.account_name == account_name)
            
            # Pagination
            accounts = query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            accounts_data = []
            for account in accounts.items:
                account_data = {
                    'id': account.id,
                    'description': account.description,
                    'account_name': account.account_name,
                    'account_type': account.account_type,
                    'created_at': account.created_at.isoformat(),
                    'updated_at': account.updated_at.isoformat()
                }
                
                if include_snapshots:
                    snapshots = Account_Snapshots.query.filter_by(account_id=account.id).order_by(Account_Snapshots.snapshot_date.desc()).all()
                    account_data['snapshots'] = [{
                        'id': snapshot.id,
                        'snapshot_date': snapshot.snapshot_date.isoformat(),
                        'amount': float(snapshot.amount),
                        'created_at': snapshot.created_at.isoformat(),
                        'updated_at': snapshot.updated_at.isoformat()
                    } for snapshot in snapshots]
                
                accounts_data.append(account_data)
            
            return jsonify({
                'accounts': accounts_data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': accounts.total,
                    'pages': accounts.pages,
                    'has_next': accounts.has_next,
                    'has_prev': accounts.has_prev
                }
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500