# Trading Journal

A free and open-source trading journal application built with React, FastAPI, and PostgreSQL.

## Features

- **Manual Trade Entry**: Add trades manually with detailed information including entry/exit prices, timestamps, quantities, and tags
- **CSV Upload**: Bulk import trades from CSV files
- **Performance Analytics**: View key performance indicators (KPIs) like total P&L, win rate, and profit factor
- **Equity Curve**: Visual representation of your cumulative P&L over time
- **Tag-based Analysis**: Categorize trades with custom tags and analyze performance by category
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Ready for JWT implementation
- **Documentation**: Auto-generated API docs at `/docs`

### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Routing**: React Router
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Database**: PostgreSQL 15

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development without Docker)

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trading-journal
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database**
   - Ensure PostgreSQL is running and create a database named `trading_journal`
   - Copy `.env.example` to `.env` and update database connection string

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Start the backend**
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   > **Tip:** When running a production preview (`npm run preview`) or serving the built assets from another origin, create a `.env` file in `frontend/` with `VITE_API_URL=http://localhost:8000` (or your backend host; the `/api` suffix is appended automatically). The frontend will automatically pick this base URL for API calls.

## API Endpoints

### Trades
- `POST /api/trades/manual` - Create a manual trade
- `POST /api/trades/csv` - Upload trades from CSV
- `GET /api/trades` - Get list of trades with pagination and filtering

### Dashboard
- `GET /api/dashboard/kpis` - Get key performance indicators
- `GET /api/dashboard/equity-curve` - Get equity curve data
- `GET /api/dashboard/performance-by-tag` - Get performance analysis by tags

## Database Schema

### Trades Table
- `id` (UUID): Primary key
- `account_id` (UUID): Associated trading account
- `symbol` (VARCHAR): Trading symbol (e.g., AAPL)
- `entry_timestamp` (DATETIME): Trade entry time
- `exit_timestamp` (DATETIME): Trade exit time
- `entry_price` (DECIMAL): Entry price
- `exit_price` (DECIMAL): Exit price
- `quantity` (DECIMAL): Trade quantity
- `commissions` (DECIMAL): Commission fees
- `net_pnl` (DECIMAL): Net profit/loss
- `import_method` (VARCHAR): Import method (manual/csv)

### Tags Table
- `id` (UUID): Primary key
- `name` (VARCHAR): Tag name
- `type` (VARCHAR): Tag type (setup, error, emotion, etc.)

### Trade_Tags Table (Many-to-many relationship)
- `trade_id` (UUID): Foreign key to trades
- `tag_id` (UUID): Foreign key to tags

## CSV Upload Format

The CSV file should have the following columns:
```csv
symbol,entry_timestamp,exit_timestamp,entry_price,exit_price,quantity,commissions,net_pnl
AAPL,2024-01-15T10:30:00,2024-01-15T11:45:00,150.00,155.00,100,5.00,495.00
GOOGL,2024-01-15T09:15:00,2024-01-15T10:30:00,2800.00,2750.00,10,10.00,-510.00
```

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `backend/app/routers/`
2. **Frontend**: Create new components in `frontend/src/components/`
3. **Database**: Update models in `backend/app/models.py` and create migrations

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] User authentication and profiles
- [ ] Multiple trading accounts support
- [ ] Advanced charting and technical indicators
- [ ] Mobile app (React Native)
- [ ] Real-time data integration with brokers
- [ ] Advanced reporting and export features
- [ ] Community features and sharing options
