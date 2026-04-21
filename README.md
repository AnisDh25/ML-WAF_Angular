# ML-WAF (Machine Learning Web Application Firewall)

A comprehensive Web Application Firewall with machine learning capabilities, featuring an Angular frontend and Python Flask backend.

## 🚀 Features

- **Machine Learning Protection**: Advanced ML models for threat detection
- **Real-time Monitoring**: Live dashboard with system statistics
- **User Management**: Role-based access control (Admin, IT-Responsible, User)
- **Content Filtering**: Configurable content categories and blacklists
- **Popup Blocking**: Intelligent popup and ad blocking
- **Attack Detection**: SQL Injection, XSS, CSRF, and more
- **Modern UI**: Responsive Angular frontend with real-time updates
- **Database Integration**: MySQL with proper data management

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+** and **npm**
- **MySQL 8.0+**
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/AnisDh25/ML-WAF_Angular.git
cd ML-WAF_Angular
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure MySQL Database
```bash
# Create database
mysql -u root -p
CREATE DATABASE waf_database;
CREATE USER 'waf_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON waf_database.* TO 'waf_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Environment Variables (Optional)
Create `.env` file in `backend/` directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=waf_database
DB_USER=waf_user
DB_PASSWORD=your_password
```

#### Initialize Database
```bash
python init_mysql.py
```

#### Start Backend Server
```bash
python api.py
```
Backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Node.js Dependencies
```bash
cd frontend
npm install
```

#### Start Angular Development Server
```bash
ng serve
```
Frontend will run on `http://localhost:4200`

## 🔧 Configuration

### Backend Configuration
Edit `backend/config.json` for WAF settings:
```json
{
  "proxy": {
    "host": "localhost",
    "port": 8080
  },
  "ml_classifier": {
    "threshold": 0.7
  },
  "content_filter": {
    "enabled": true,
    "categories": ["adult", "gambling", "social"]
  }
}
```

### Frontend Configuration
Edit `frontend/src/app/services/api.service.ts` to change API endpoint:
```typescript
private apiUrl = 'http://localhost:5000/api';
```

## 🚦 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator

## 📊 Features Overview

### Dashboard
- Real-time statistics (requests, blocks, threats)
- Traffic overview charts
- Attack type distribution
- Top blocked IPs
- System health monitoring

### User Management
- Create, edit, delete users
- Role-based permissions
- Password management
- Activity tracking

### WAF Settings
- ML model configuration
- Content filter rules
- Popup blocker settings
- Blacklist/whitelist management

### System Status
- Service health monitoring
- Resource usage (CPU, Memory, Disk)
- Database status
- Network statistics

## 🔒 Security Features

### ML-Based Detection
- SQL Injection detection
- XSS attack prevention
- CSRF protection
- Path traversal detection
- Command injection blocking

### Content Filtering
- Category-based filtering
- URL blacklisting
- Domain whitelisting
- Custom filter rules

### Popup Blocking
- Aggressive popup blocking
- Ad filtering
- Script blocking options

## 🗂️ Project Structure

```
ML-WAF_Angular/
├── backend/
│   ├── api.py              # Main Flask API server
│   ├── auth.py             # Authentication module
│   ├── dashboard.py         # Dashboard data provider
│   ├── ml_waf.py          # Core WAF logic
│   ├── database_config.py   # Database configuration
│   ├── init_mysql.py       # Database initialization
│   ├── requirements.txt     # Python dependencies
│   └── models/            # ML models directory
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Angular components
│   │   │   ├── services/    # API services
│   │   │   └── guards/     # Route guards
│   ├── package.json        # Node.js dependencies
│   └── angular.json        # Angular configuration
└── README.md
```

## 🚀 Deployment

### Production Deployment (Backend)
```bash
cd backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api:app
```

### Production Deployment (Frontend)
```bash
cd frontend
npm run build
# Deploy dist/ folder to web server
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Frontend API Connection Error**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Ensure API endpoint URL is correct

3. **ML Model Loading Error**
   - Check models directory exists
   - Verify model files are not corrupted
   - Check scikit-learn version compatibility

4. **Permission Issues**
   - Run with appropriate permissions
   - Check file permissions for models directory
   - Verify database user privileges

### Logs
- Backend logs: `backend/logs/`
- Frontend logs: Browser console
- Database logs: MySQL error log

## 📝 Development

### Adding New ML Models
1. Train model using `train_model.py`
2. Save to `backend/models/`
3. Update `waf_predictor.py` to load new model

### Adding New API Endpoints
1. Add route in `api.py`
2. Implement logic in respective module
3. Update frontend service if needed

### Frontend Development
```bash
cd frontend
ng generate component component-name
ng serve --configuration development
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check troubleshooting section
- Review logs for error details

## 🔗 Technologies Used

### Backend
- **Flask** - Web framework
- **MySQL** - Database
- **SQLAlchemy** - ORM
- **Scikit-learn** - Machine learning
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing

### Frontend
- **Angular** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Chart.js** - Data visualization
- **Bootstrap** - UI framework
- **RxJS** - Reactive programming

### DevOps
- **Git** - Version control
- **npm** - Package management
- **Gunicorn** - WSGI server

---

**⚡ Protect your web applications with intelligent, machine learning-powered security!**
