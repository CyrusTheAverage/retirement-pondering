# flask/routes/main.py
from flask import Blueprint, render_template

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/add-account')
def add_account():
    return render_template('add_account.html')

@bp.route('/accounts')
def accounts():
    return render_template('accounts.html')

@bp.route('/accounts/<int:account_id>')
def account_snapshots(account_id):
    return render_template('account_snapshots.html', account_id=account_id)