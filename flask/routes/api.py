# flask/routes/api.py
from flask import Blueprint, jsonify, current_app
from datetime import datetime
import pandas as pd
import os
from extensions import db

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

