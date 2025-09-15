# Collaborative Notes Backend 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)

## 📖 About

The backend API for my collaborative notes application - a robust NestJS server that powers real-time note editing, user authentication, and hierarchical folder management. Built to handle multiple users collaborating on documents simultaneously with seamless real-time synchronization.

## ✨ Features

- 🔐 **Secure Authentication** - Better Auth integration with session management
- 📁 **Hierarchical Folders** - Nested folder structure with unlimited depth
- 📝 **Real-time Collaboration** - Live note editing with Socket.io
- 💬 **Real-time Messaging** - Built-in chat system for collaborators
- 📊 **RESTful API** - Clean, documented endpoints with Swagger
- 🔒 **Security First** - Helmet middleware, CORS, input validation
- 🗃️ **PostgreSQL Database** - Reliable data persistence with connection pooling
- 📋 **API Documentation** - Auto-generated Swagger docs

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: Better Auth
- **Real-time**: Socket.io
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS
- **Testing**: Jest

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaborative.notes.backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=collaborative_notes

   # Authentication
   BETTER_AUTH_SECRET=your_secret_key_here

   # Server Configuration
   PORT=4000
   FRONTEND_URL=http://localhost:5173
   ```

4. **Database Setup**

   Make sure PostgreSQL is running and create the database:
   ```sql
   CREATE DATABASE collaborative_notes;
   ```

5. **Start the server**
   ```bash
   # Development with hot reload
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:4000/api
- **API Base URL**: http://localhost:4000

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov
```

## 🏗️ Project Structure

```
src/
├── lib/                 # Shared utilities and configurations
│   └── auth.ts         # Better Auth configuration
├── modules/            # Feature modules (when added)
├── main.ts            # Application entry point
└── app.module.ts      # Root module

test/                  # E2E tests
```

## 🔧 Development Scripts

```bash
npm run start:dev      # Start development server with hot reload
npm run build          # Build for production
npm run start:prod     # Start production server
npm run lint           # Run ESLint with auto-fix
npm run format         # Run Prettier formatting
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
```

## 🌐 Related Projects

- **Frontend**: [Collaborative Notes Web](../collaborative.notes.web) - React frontend application

## 📝 License

This project is part of my personal portfolio. Feel free to explore the code!

## 🤝 Contributing

This is a personal project, but I'm open to suggestions and feedback. Feel free to open an issue or reach out!

---

Built with ❤️ using NestJS and TypeScript
