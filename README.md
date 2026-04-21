# ML-WAF Angular Migration

This project is a modern Angular frontend migration of the original Flask-based ML-WAF (Machine Learning Web Application Firewall) dashboard.

## Project Structure

```
mlwaf-angular/
|-- backend/                 # Flask API-only backend
|   |-- api.py              # Main API server
|   |-- *.py                # Original WAF modules
|   |-- config.json         # WAF configuration
|   |-- requirements.txt    # Python dependencies
|   |-- models/             # ML model files
|
|-- frontend/               # Angular frontend
|   |-- src/
|   |   |-- app/
|   |   |   |-- components/
|   |   |   |   |-- login/      # Login component
|   |   |   |   |-- dashboard/  # Main dashboard
|   |   |   |-- services/
|   |   |   |   |-- api.service.ts  # API service
|   |   |   |-- guards/
|   |   |   |   |-- auth.guard.ts   # Authentication guard
|   |   |   |-- app.routes.ts       # App routing
|   |   |   |-- app.ts              # App component
|   |   |-- styles.scss             # Global styles
|   |   |-- index.html
|   |-- package.json
|   |-- angular.json
|
|-- README.md
```

## Features

### Backend (Flask API)
- **RESTful API**: Complete API-only backend serving JSON endpoints
- **Authentication**: Token-based authentication system
- **CORS Support**: Enabled for Angular frontend
- **Endpoints**:
  - `/api/auth/*` - Authentication endpoints
  - `/api/stats` - Dashboard statistics
  - `/api/logs` - Request logs and search
  - `/api/alerts` - Security alerts
  - `/api/config` - Configuration management
  - `/api/chart/*` - Chart data endpoints
  - `/api/proxy/*` - Proxy management
  - `/api/status` - System status

### Frontend (Angular)
- **Modern UI**: Built with Angular 17+ and Bootstrap 5
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Auto-refreshing dashboard data
- **Interactive Charts**: Traffic and attack visualization
- **Authentication**: Secure login/logout functionality
- **Components**:
  - **Login**: User authentication interface
  - **Dashboard**: Main monitoring dashboard with:
    - Statistics cards with animations
    - Real-time traffic charts
    - Attack type distribution
    - Recent activity feed
    - Top blocked IPs table
    - System status indicators

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL (optional, falls back to SQLite)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the API server:
```bash
python api.py
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

The Angular app will be available at `http://localhost:4200`

## Usage

1. Start both the backend and frontend servers
2. Open `http://localhost:4200` in your browser
3. Login with your WAF credentials
4. Monitor the real-time dashboard

## Configuration

- Backend configuration is in `backend/config.json`
- ML models should be placed in `backend/models/`
- Default API port: 5000
- Default Angular port: 4200

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change_password` - Change password

### Dashboard
- `GET /api/stats` - Get dashboard statistics
- `GET /api/logs` - Get request logs
- `GET /api/alerts` - Get security alerts
- `GET /api/status` - Get system status

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config/update` - Update configuration
- `POST /api/content_filter/category/{action}` - Enable/disable content filter categories
- `POST /api/content_filter/blacklist` - Add to blacklist
- `DELETE /api/content_filter/blacklist` - Remove from blacklist

### Charts
- `GET /api/chart/traffic` - Get traffic chart data
- `GET /api/chart/attacks` - Get attack distribution data

### Proxy Management
- `POST /api/proxy/start` - Start WAF proxy
- `POST /api/proxy/stop` - Stop WAF proxy

## Development

### Adding New Components

1. Generate a new standalone component:
```bash
ng generate component components/new-component --standalone
```

2. Add routing in `app.routes.ts`
3. Implement API calls in `api.service.ts`
4. Add guards if authentication is required

### Styling

- Global styles in `src/styles.scss`
- Component-specific styles in component SCSS files
- Uses Bootstrap 5 for responsive layout
- FontAwesome 6 for icons

## Original vs Migrated Features

| Feature | Original (Flask) | Migrated (Angular) |
|---------|------------------|-------------------|
| Authentication | Session-based | Token-based |
| UI Updates | Page reloads | Real-time updates |
| Charts | Chart.js (server) | Chart.js (client) |
| Mobile Support | Limited | Fully responsive |
| Performance | Server-rendered | SPA with lazy loading |
| State Management | Flask sessions | Angular services |

## Security Notes

- Change the default secret key in `api.py`
- Use HTTPS in production
- Implement proper token expiration
- Add rate limiting to API endpoints
- Validate all user inputs

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the Flask API has CORS enabled
2. **Authentication Failures**: Check token storage and API headers
3. **Chart Loading**: Verify Chart.js and ng2-charts are properly installed
4. **Database Connection**: Ensure PostgreSQL is running or SQLite fallback is working

### Debug Mode

- Backend: Set `debug=True` in `api.py`
- Frontend: Use browser developer tools for network requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project maintains the same license as the original ML-WAF project.
