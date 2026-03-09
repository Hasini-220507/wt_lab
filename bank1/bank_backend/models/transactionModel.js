const db = require('../config/db');

class Transaction {
  static async create(userId, type, amount, receiverId = null, note = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Ensure amounts are treated as numbers
      const numericAmount = parseFloat(amount);

      // 1. Insert transaction record
      const [result] = await connection.query(
        'INSERT INTO transactions (user_id, type, amount, receiver_id, note) VALUES (?, ?, ?, ?, ?)',
        [userId, type, numericAmount, receiverId, note]
      );

      // 2. Update user balance
      if (type === 'deposit') {
        await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [numericAmount, userId]);
      } else if (type === 'withdraw') {
        await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [numericAmount, userId]);
      } else if (type === 'transfer') {
        await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [numericAmount, userId]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [numericAmount, receiverId]);
      }

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getHistoryByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? OR receiver_id = ? ORDER BY created_at DESC',
      [userId, userId]
    );
    return rows;
  }
}

module.exports = Transaction;
