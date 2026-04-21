# Quick Start Guide

## Servers Status

Both servers are now running successfully:

- **Backend API**: http://localhost:5000 (Flask)
- **Frontend**: http://localhost:4200 (Angular)

## Access the Application

1. Open your browser and navigate to: **http://localhost:4200**
2. You'll see the ML-WAF login page
3. Use your existing WAF credentials to login

## What's Working

### Backend (Flask API)
- REST API endpoints active
- CORS enabled for Angular
- Authentication system ready
- Database connectivity established

### Frontend (Angular)
- Modern responsive interface
- Real-time dashboard updates
- Interactive charts and visualizations
- Mobile-friendly design

## Next Steps

1. **Test Login**: Try logging in with your credentials
2. **Explore Dashboard**: Check the real-time monitoring features
3. **Verify Data**: Ensure all WAF data is loading correctly
4. **Test Features**: Try blocking IPs, viewing logs, and checking system status

## Troubleshooting

If you encounter any issues:

1. **Check browser console** for any JavaScript errors
2. **Verify backend API** by visiting http://localhost:5000/api/stats
3. **Check network tab** in browser dev tools for API calls
4. **Restart servers** if needed (Ctrl+C and run again)

## Development Notes

- Angular app auto-reloads on file changes
- Backend API restarts automatically on file changes
- Both servers are running in development mode
- All original WAF functionality should be preserved

## Security Reminder

- Change the default secret key in `backend/api.py` for production
- Ensure proper firewall rules for production deployment
- Use HTTPS in production environments
