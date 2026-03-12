const db = require('../config/db');

class User {
  static async create(name, email, hashedPassword) {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return result;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async updatePassword(id, hashedPassword) {
    const [result] = await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    return result;
  }

  static async saveResetToken(email, token, expiry) {
    const [result] = await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );
    return result;
  }

  static async findByResetToken(token) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async clearResetToken(id) {
    const [result] = await db.query(
      'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [id]
    );
    return result;
  }

  static async updateProfilePhoto(id, photoPath) {
    const [result] = await db.query('UPDATE users SET profile_photo = ? WHERE id = ?', [photoPath, id]);
    return result;
  }

  static async deleteUser(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete transactions (if they should be completely removed, or keep them with logic)
      await connection.query('DELETE FROM transactions WHERE user_id = ? OR receiver_id = ?', [id, id]);

      // Delete user
      await connection.query('DELETE FROM users WHERE id = ?', [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = User;
