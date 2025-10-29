# MPJobs

A modern job board application connecting job seekers with employers through an intuitive platform.

## Features

- 👥 **Three User Roles**: Job Seekers, Employers, and Admins
- 📧 **Email-Based Applications**: Simple application process via email
- ✅ **Job Approval System**: Admin review before jobs go live
- 🎨 **Modern UI**: Beautiful, responsive design
- 🔐 **Secure Authentication**: JWT-based auth system
- 📊 **Analytics**: Track application clicks and engagement

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- Axios
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/0skibidi/MPjobs.git
cd MPjobs
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

4. Start the development servers
```bash
# From the root directory
npm run dev
```

This will start:
- Backend on http://localhost:5002
- Frontend on http://localhost:5173

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy (Recommended)

**Frontend (Vercel):**
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` environment variable
4. Deploy!

**Backend (Railway):**
1. Import project on [railway.app](https://railway.app)
2. Add MongoDB database
3. Set environment variables
4. Deploy!

## Project Structure

```
mpjobs/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── types/
│   └── package.json
└── scripts/
```

## Environment Variables

### Backend
- `PORT` - Server port (default: 5002)
- `MONGODB_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Frontend URL for CORS

### Frontend
- `VITE_API_URL` - Backend API URL

## Scripts

```bash
# Development
npm run dev              # Run both frontend and backend

# Backend only
cd backend
npm run dev             # Development with hot reload
npm run build           # Build for production
npm start               # Start production server

# Frontend only
cd frontend
npm run dev             # Development server
npm run build           # Build for production
npm run preview         # Preview production build
```

## Contributing

For contributions or questions, please contact the project maintainers.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

