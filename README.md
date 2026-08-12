# Mini ERP + CRM Operations Portal

## Overview

This is a full-stack ERP/CRM application designed to manage core business operations, including customer relationship management, product and inventory tracking, and sales dispatch challans. It features a modern, role-based user interface and a robust backend API.

## Business Context

The portal serves as a centralized system for small to medium-sized businesses to streamline their operations. It provides different views and permissions for various employee roles (Sales, Warehouse, Accounts, Admin) to ensure data security and operational efficiency. The core workflow revolves around managing customers, tracking product inventory, and processing sales through a challan system with a critical stock-aware confirmation process.

## Features

- **Authentication:** Secure JWT-based login with password hashing (bcrypt).
- **Role-Based Access Control (RBAC):** Four distinct user roles (Admin, Sales, Warehouse, Accounts) with granular permissions.
- **Dashboard:** A real-time operational snapshot showing key metrics like customer counts, product stock levels, and recent activities.
- **Customer CRM:** Full CRUD functionality for customer profiles, including status tracking (Lead, Active), type classification, and follow-up notes.
- **Product Management:** Full CRUD for the product catalog, including SKU, category, pricing, and warehouse location.
- **Inventory & Stock Management:** Real-time tracking of `currentStock` vs. `minimumStock`. Includes a "low stock" detection system and a full history of all stock movements (IN/OUT).
- **Sales Challans:** A comprehensive module to create, manage, and process dispatch challans. Includes a critical stock-validation workflow.
- **User Directory:** An admin-only view to see all registered users in the system.

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Vite
  - React Router
  - Axios
  - CSS3 (Custom Properties & Flexbox/Grid)
- **Backend:**
  - Node.js
  - Express
  - TypeScript
  - Prisma (ORM)
  - Zod (Validation)
- **Database:**
  - PostgreSQL

## Architecture

The project follows a classic client-server architecture:

```
  React Frontend (Vite)
        ↓
    (REST API)
        ↓
  Express Backend (Node.js)
        ↓
      Prisma
        ↓
    PostgreSQL
```

- The **frontend** is a single-page application (SPA) built with React. It handles all UI, state management, and user interaction.
- The **backend** is a RESTful API built with Express.js. It handles all business logic, database interactions, and authentication.
- **Prisma** serves as the ORM, providing a type-safe interface between the Node.js backend and the PostgreSQL database.

## Database Design

The database schema is defined in `backend/prisma/schema.prisma` and includes the following key models:
- `User`: Stores user credentials and roles.
- `Customer`: Stores CRM data.
- `Product`: Stores the product catalog and stock levels.
- `StockMovement`: A log of every change in a product's stock.
- `Challan`: Represents a sales dispatch, containing multiple `ChallanItem` records.
- `ChallanItem`: A line item within a challan, linking a product and quantity.
- `CustomerFollowUp`: A log of interactions with a customer.

## Authentication

Authentication is handled via JSON Web Tokens (JWT).
1. A user logs in with their email and password.
2. The backend validates the credentials and returns a short-lived JWT.
3. The frontend stores this JWT in `localStorage` and attaches it to the `Authorization` header for all subsequent API requests.
4. A 401 response from the API will automatically clear the token and redirect the user to the login page.

## Roles and Permissions

The application implements four user roles with specific permissions:

- **ADMIN:** Full access to all modules and settings. The only role that can view the user directory and (in the future) perform system-wide configurations.
- **SALES:** Can view the dashboard and manage CRM (Customers) and Sales (Challans). Can view products but cannot add new ones or manage stock.
- **WAREHOUSE:** Can view the dashboard, manage Products (including creating/editing), and manage Stock (including IN/OUT movements). Can view challans but not create or confirm them.
- **ACCOUNTS:** Can view the dashboard, customers, products, and challans for auditing and financial purposes, but has no write access.

## API Endpoints

The backend provides a RESTful API with the following primary resources:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `/api/customers` (GET, POST, PUT)
- `/api/products` (GET, POST, PUT)
- `/api/challans` (GET, POST, PUT)
- `POST /api/challans/:id/confirm`

## Environment Variables

You must create `.env` files for both the backend and frontend.

**Backend (`backend/.env`):**
Copy from `backend/.env.example`.
```
# Connection string for your PostgreSQL database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# A secure, random string for signing JWTs
JWT_SECRET="your-super-secret-key"

# The port the backend server will run on
PORT=5000

# The URL of the frontend client for CORS
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
Copy from `frontend/.env.example`.
```
# The base URL of the backend API
VITE_API_URL=http://localhost:5000/api
```

## Local Setup

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Set up your `backend/.env` file as described above.
4. Run database migrations: `npm run prisma:migrate:dev`
5. Seed the database with test data: `npm run prisma:seed`
6. Start the development server: `npm run dev`
   - The backend will be running at `http://localhost:5000`.

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Set up your `frontend/.env` file if the backend URL is different.
4. Start the development server: `npm run dev`
   - The frontend will be running at `http://localhost:5173`.

## Test Credentials

After seeding the database, you can use the following credentials to log in:

| Role      | Email             | Password      |
|-----------|-------------------|---------------|
| Admin     | `admin@erp.com`     | `Admin@123`     |
| Sales     | `sales@erp.com`     | `Sales@123`     |
| Warehouse | `warehouse@erp.com` | `Warehouse@123` |
| Accounts  | `accounts@erp.com`  | `Accounts@123`  |

## Business Logic: The Challan Flow

The most critical business logic in the application is the challan confirmation process, which is designed to be transactional and stock-aware.

1.  **Draft Challan:** A new challan is always created with the status `DRAFT`. In this state, it acts as a quote or a dispatch plan. **No stock is deducted from inventory when a challan is saved as a draft.**

2.  **Confirm Challan:** When a user confirms a challan:
    - The backend initiates a transaction.
    - It checks if there is sufficient `currentStock` for **every single product** listed in the challan.
    - **If insufficient stock is found for any item:**
        - The entire transaction is rolled back.
        - The API returns an `HTTP 400` error with a specific message (e.g., "Insufficient stock for Laptop. Available: 4, Requested: 6").
        - The challan's status remains `DRAFT`.
        - No stock levels are changed.
    - **If stock is sufficient for all items:**
        - The `currentStock` for each product is reduced accordingly.
        - An `OUT` movement is recorded in the `StockMovement` table for each item.
        - The challan's status is updated to `CONFIRMED`.
        - The transaction is committed.

This ensures that inventory levels are always accurate and that the business cannot sell products it does not have in stock.

## Postman Collection

A Postman collection is available in `postman/Mini-ERP-CRM.postman_collection.json`.

To use it:
1. Import the file into Postman.
2. The collection uses a `baseUrl` variable, which defaults to `http://localhost:5000/api`.
3. The collection is configured to use Bearer Token authentication, sourcing the token from a `token` variable.
4. Run the **Login Admin** (or any other login) request first. A test script will automatically capture the JWT and save it to the `token` collection variable.
5. You can now run any other authenticated request.

## Deployment

The application is prepared for deployment on modern hosting platforms.

- **Frontend (Vite/React):** Recommended platform is **Vercel**.
- **Backend (Node/Express):** Recommended platform is **Render**.
- **Database (PostgreSQL):** Recommended platform is **Neon**.

### Production Environment Variables

- **Frontend:**
  - `VITE_API_URL`: Set this to the public URL of your deployed backend API.
- **Backend:**
  - `DATABASE_URL`: Your production database connection string from Neon.
  - `JWT_SECRET`: A long, secure, randomly generated string.
  - `CLIENT_URL`: The public URL of your deployed frontend application (for CORS).
  - `PORT`: This is typically provided by the hosting service (e.g., Render).

## Screenshots

<img width="1919" height="926" alt="image" src="https://github.com/user-attachments/assets/c4e8c4fc-4e9d-42c5-9953-f5e75d9a56dc" />
<img width="1917" height="926" alt="image" src="https://github.com/user-attachments/assets/35e8cee3-6bdd-4883-8f35-eb283f030296" />
<img width="1919" height="919" alt="image" src="https://github.com/user-attachments/assets/536d5243-f759-47cd-8150-9ce811e3670a" />
<img width="1919" height="936" alt="image" src="https://github.com/user-attachments/assets/9292e57e-7437-444c-bf95-8ddb673293ae" />
<img width="1919" height="920" alt="image" src="https://github.com/user-attachments/assets/d98f8981-878a-4038-91aa-3b22a1a904d9" />






## Live Demo URLs

https://drive.google.com/file/d/1-w952eV9PXqRCjzZo4rGhE9LH1rdTsLn/view?usp=drive_link
