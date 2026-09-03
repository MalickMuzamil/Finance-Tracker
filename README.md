<h1 align="center">💰 Finance Tracker</h1>
<h3 align="center">Personal Finance Management • React + Vite • Node.js + Express • MongoDB</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-MongoDB-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Currency-PKR-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/UI-Glassmorphism-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Responsive-YES-success?style=for-the-badge" />
</p>

---

## 🚀 Overview

**Finance Tracker** is a modern full-stack personal finance management application designed to help users manage and track their financial activities from a single platform.

The application provides dedicated modules for **Dashboard, Home Finance, Vehicles, and Len Den (Udhaar)** while maintaining secure, user-specific financial data.

Built with a modern **React + Vite frontend**, **Node.js + Express backend**, and **MongoDB/Mongoose**, the application follows a clean and reusable architecture with JWT-based authentication and protected routes.

The application is designed specifically for **Pakistan**, using **PKR (Pakistani Rupee)** as the default currency.

---

## 🌟 Key Features

### 📊 Dashboard
- Financial overview at a glance
- Summary of financial activities
- Expense and income insights
- User-specific financial data
- Reusable date filtering

### 🏠 Home Finance
- Track household financial activities
- Manage income and expenses
- Add, edit and delete records
- Financial summaries
- PKR-based currency formatting
- Date-based filtering

### 🚗 Vehicle Finance
- Manage vehicle-related financial records
- Track vehicle expenses
- Vehicle-specific financial information
- Add, edit and delete records
- PKR currency support
- Date filtering

### 🤝 Len Den / Udhaar Management
- Track personal lending and borrowing
- Create shared transactions
- Share transactions with registered users
- Receiver can **Accept** or **Dispute**
- Both users remain connected to the same transaction
- Transaction history
- Date-based filtering

### 🔐 Authentication & Authorization
- User registration
- Secure login
- JWT authentication
- Protected routes
- User-specific data isolation
- Role-based access control
- Super Admin support

### 👑 Super Admin
The application includes a dedicated Super Admin account architecture.

Super Admin:

```text
muzamilteamseven00@gmail.com

🧩 Frontend Architecture

The frontend follows a component-based and reusable architecture.

Instead of implementing the same UI separately on every page, common functionality is abstracted into reusable components.

Reusable UI Components

Examples include:

Button
Card
Modal
Input
Select
Form
Toast
Badge
Table
Loading State
Empty State
Error State
Date Filter

These components are shared across multiple modules to maintain:

Consistent UI
Consistent behavior
Less duplicated code
Easier maintenance
Faster feature development
♻️ Reusable Component Architecture
                Reusable Components
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     Dashboard    Home Finance     Vehicles
                       │
                       ↓
                  Len Den

For example, the same:

Modal
Form
Button
Toast
DateFilter
Currency Formatter

can be reused across different financial modules.

This follows the DRY (Don't Repeat Yourself) principle.

📦 Modular Page Architecture

Application features are separated into independent modules.

Pages
│
├── Dashboard
│
├── Home Finance
│
├── Vehicles
│
├── Len Den
│
├── Authentication
│
└── Administration

Each module uses shared components and services rather than duplicating common functionality.

🔌 API Service Layer

Frontend API communication is separated from UI components through reusable service functions.

Instead of directly writing API requests inside every component:

Component
    ↓
API Service
    ↓
Backend API

This provides:

Centralized API communication
Cleaner React components
Easier API maintenance
Consistent error handling
Easier backend URL configuration
🔐 Authentication & Authorization

The application implements authentication using JWT-based authentication.

Architecture:

Login
  ↓
Authentication
  ↓
JWT
  ↓
Protected Routes
  ↓
Authorized API Requests
Authorization

Role-based access control is implemented for:

USER
ADMIN
SUPER_ADMIN

The backend remains the final authority for authorization.

Frontend role checks are used for UI visibility, while sensitive authorization is enforced server-side.

👤 User Data Isolation

Financial data is isolated per authenticated user.

User A
   ↓
User A Financial Records

User B
   ↓
User B Financial Records

Backend queries use authenticated user context to ensure users cannot access another user's financial records.

This applies to:

Home Finance
Vehicles
Transactions
Len Den records
Shared transactions
🤝 Shared Transaction Architecture

Len Den supports shared Udhaar transactions between registered users.

User A
   │
   │ Create Transaction
   ↓
Shared Transaction
   │
   ↓
User B
   │
   ├── Accept
   │
   └── Dispute

The transaction remains associated with both users while maintaining ownership and authorization rules.

📅 Reusable Date Filtering

A centralized reusable DateFilter component is used across financial modules.

Supported filters include:

All Time
Today
This Week
This Month
Last Month
Last 3 Months
Last 6 Months
This Year
Custom Date Range

Filtering follows:

DateFilter
    ↓
startDate / endDate
    ↓
API Request
    ↓
Backend Query
    ↓
MongoDB

Filtering is performed at the backend/database level, rather than loading all records into React and filtering only on the client.

Example:

GET /api/transactions?startDate=2026-07-01&endDate=2026-07-31
💰 Centralized Currency Formatting

The application uses PKR (Pakistani Rupee) as its financial currency.

Currency formatting is centralized instead of being manually implemented across individual pages.

Example:

PKR 10,000
PKR 50,000
PKR 250,000

This keeps financial presentation consistent across:

Dashboard
Home Finance
Vehicles
Len Den
🗄️ Database Architecture

The application uses:

MongoDB
Mongoose
MongoDB Atlas

Production database:

FinanceTracker

The database runs inside the existing MongoDB Atlas cluster while remaining logically separated from other application databases.

MongoDB Cluster
│
├── vaultly
│
└── FinanceTracker
⚙️ Backend Architecture

The backend follows a modular REST API architecture.

Request
   ↓
Route
   ↓
Authentication Middleware
   ↓
Authorization
   ↓
Controller
   ↓
Service
   ↓
Mongoose Model
   ↓
MongoDB

This separation keeps business logic away from route definitions and improves maintainability.

🛡️ Security Architecture

Security considerations include:

JWT authentication
Protected API routes
Protected frontend routes
Role-based authorization
User ownership validation
Per-user data isolation
Environment-based secrets
Backend authorization enforcement
No credentials committed to Git
Production secrets managed through deployment environment variables
🎨 UI Architecture

The frontend uses a reusable Glassmorphism + Aura design system.

The UI emphasizes:

Reusable cards
Reusable buttons
Reusable forms
Reusable modals
Consistent spacing
Consistent typography
Responsive layouts
Toast notifications
Loading states
Empty states
Error states

Heavy visual effects are avoided where they can negatively affect performance.

📱 Responsive Design

The component architecture supports:

Desktop
Tablet
Mobile
Large Screens

Reusable components automatically adapt to different viewport sizes.

Financial tables and forms are designed to remain usable on smaller screens.

📂 Project Structure
Finance-Tracker/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── assets/
│   │   └── App.jsx
│   │
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
🔄 Git Branching Strategy

The project follows a protected production branch workflow.

development
      │
      ↓
Development & Testing
      │
      ↓
Pull Request
      │
      ↓
main
      │
      ↓
Production Deployment

The main branch is protected through GitHub Rulesets.

Main Branch Protection
Pull Request required
Approval required
Force pushes restricted
Branch deletion restricted
Conversation resolution required
Squash merge workflow

Development work is performed on:

development

Production code is maintained on:

main
🛠️ Technology Stack
Frontend
React
Vite
React Router
JavaScript
CSS
Component-based architecture
Reusable UI components
Backend
Node.js
Express.js
REST API
JWT
Middleware
Modular service architecture
Database
MongoDB
Mongoose
MongoDB Atlas
Development
Git
GitHub
Environment Variables
REST APIs
🚀 Setup
Backend
cd backend
npm install
npm run dev

Environment:

PORT=5000
MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<jwt-secret>
Frontend
cd frontend
npm install
npm run dev
🔐 Environment Security

Sensitive configuration must never be committed to GitHub.

Examples:

MONGODB_URI=...
JWT_SECRET=...

.env files must remain excluded through .gitignore.

Production secrets should be configured through the deployment platform's environment variable system.

📋 Engineering Principles

The project follows these core engineering principles:

♻️ Reusability

Common UI and functionality are implemented once and reused throughout the application.

🧱 Component-Based Design

Pages are composed from smaller reusable components instead of large monolithic components.

🔌 Separation of Concerns

UI, API communication, business logic, authentication and database operations are separated.

🔒 Security First

Authorization and ownership validation are enforced on the backend.

🚫 DRY

Duplicated UI and business logic are minimized.

📈 Scalability

The modular structure allows new financial modules and components to be added without rewriting existing features.

⚡ Performance

Backend filtering, reusable components and lightweight UI effects are preferred over unnecessary client-side processing and heavy visual effects.

🧪 Production Checklist
✓ Authentication
✓ JWT Protected Routes
✓ Role-Based Authorization
✓ User Data Isolation
✓ Reusable Components
✓ Modular Frontend
✓ REST API Architecture
✓ MongoDB Atlas
✓ PKR Currency
✓ Reusable Date Filtering
✓ Shared Len Den Transactions
✓ Accept / Dispute Workflow
✓ Responsive UI
✓ Loading / Empty / Error States
✓ Protected main Branch
✓ Environment-based Secrets
📄 License

This project is developed for personal/business financial management purposes.

Unauthorized redistribution or commercial reuse of the source code is not permitted without permission from the project owner.

👤 Developed By

Muzamil Saleem

Full Stack Developer

Finance Tracker