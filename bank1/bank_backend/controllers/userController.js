const User = require('../models/userModel');

const uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  try {
    const photoPath = `/uploads/${req.file.filename}`;
    await User.updateProfilePhoto(req.user.id, photoPath);

    res.json({ message: 'Profile photo updated', profile_photo: photoPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during photo upload' });
  }
};

const deleteAccount = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Please provide password to confirm deletion' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Attempt to delete user
    await User.deleteUser(user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during account deletion' });
  }
};

module.exports = {
  uploadPhoto,
  deleteAccount
};
