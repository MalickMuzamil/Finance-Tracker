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

## 🧩 Frontend Architecture

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

## These components are shared across multiple modules to maintain:

Consistent UI
Consistent behavior
Less duplicated code
Easier maintenance
Faster feature development

---


## ♻️ Reusable Component Architecture
                Reusable Components
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     Dashboard    Home Finance     Vehicles
                       │
                       ↓
                  Len Den

For example, the same:

-  Modal

- Form

- Button

- Toast

- DateFilter

- Currency Formatter

can be reused across different financial modules.

This follows the DRY (Don't Repeat Yourself) principle.

---

## 📦 Modular Page Architecture

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

---

## 🔌 API Service Layer

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

---

## 🔐 Authentication & Authorization

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

1- USER

2- ADMIN

3- SUPER_ADMIN

The backend remains the final authority for authorization.

Frontend role checks are used for UI visibility, while sensitive authorization is enforced server-side.

---


## 👤 User Data Isolation

Financial data is isolated per authenticated user.

User A
   ↓
User A Financial Records

User B
   ↓
User B Financial Records


## 🤝 Shared Transaction Architecture

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

---


## 💰 Centralized Currency Formatting

The application uses PKR (Pakistani Rupee) as its financial currency.

Currency formatting is centralized instead of being manually implemented across individual pages.

Example:

PKR 10,000
PKR 50,000
PKR 250,000

---

Production database:

FinanceTracker

The database runs inside the existing MongoDB Atlas cluster while remaining logically separated from other application databases.

MongoDB Cluster
│
├── vaultly
│
└── FinanceTracker

---

## ⚙️ Backend Architecture

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

---

## 🛡️ Security Architecture

Security considerations include:

1- JWT authentication

2- Protected API routes

3- Protected frontend routes

4- Role-based authorization

5- User ownership validation

6-Per-user data isolation

7-Environment-based secrets

8-Backend authorization enforcement

9-No credentials committed to Git

10- Production secrets managed through deployment environment variables


## 🎨 UI Architecture

The frontend uses a reusable Glassmorphism + Aura design system.

The UI emphasizes:

- Reusable cards

- Reusable buttons

- Reusable forms

- Reusable modals

- Consistent spacing

- Consistent typography

- Responsive layouts

- Toast notifications

- Loading states

- Empty states

- Error states

Heavy visual effects are avoided where they can negatively affect performance.

---

## 📱 Responsive Design

The component architecture supports:

1- Desktop

2- Tablet

3- Mobile

4- Large Screens

Reusable components automatically adapt to different viewport sizes.

Financial tables and forms are designed to remain usable on smaller screens.

---

## 📂 Project Structure
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

---

## 🔄 Git Branching Strategy

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

---

## 🧱 Component-Based Design

Pages are composed from smaller reusable components instead of large monolithic components.

---

## 🔌 Separation of Concerns

UI, API communication, business logic, authentication and database operations are separated.

---

## 🔒 Security First

Authorization and ownership validation are enforced on the backend.

---

## 📈 Scalability

The modular structure allows new financial modules and components to be added without rewriting existing features.


---


## ⚡ Performance

Backend filtering, reusable components and lightweight UI effects are preferred over unnecessary client-side processing and heavy visual effects.

This project is developed for personal/business financial management purposes.

Unauthorized redistribution or commercial reuse of the source code is not permitted without permission from the project owner.

👤 Developed By

Muzamil Saleem

Full Stack Developer

Finance Tracker
