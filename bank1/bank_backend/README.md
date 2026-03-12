# Mini Banking System Backend

This backend API provides secure banking functionalities like authentication, depositing, withdrawing, transferring funds, and viewing history. Built with Node.js, Express, and MySQL.

## Prerequisites
- Node.js (v14 or above)
- MySQL Server

## Setup Instructions

1. **Database Setup**
   - Open your MySQL client (e.g., phpMyAdmin, MySQL Workbench, or CLI).
   - Execute the queries inside `database.sql` to create the `mini_bank` database and its tables.

2. **Environment Configuration**
   - Open the `.env` file and update your MySQL credentials (`DB_USER`, `DB_PASSWORD`), if different from the defaults.

3. **Install Dependencies**
   Run the following command in the project root (`bank_backend` directory):
   ```bash
   npm install
   ```

4. **Start the Server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` : Register a new user (`name`, `email`, `password`)
- `POST /api/auth/login` : Login a user (`email`, `password`), returns a JWT token.

### Transactions (Requires `Authorization: Bearer <token>` Header)
- `POST /api/transaction/deposit` : Deposit money (`amount`)
- `POST /api/transaction/withdraw` : Withdraw money (`amount`)
- `POST /api/transaction/transfer` : Transfer money to another user (`receiverId`, `amount`)
- `GET /api/transaction/history` : Get the transaction history for the logged-in user.
