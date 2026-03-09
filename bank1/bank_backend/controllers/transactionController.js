const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');

const deposit = async (req, res) => {
  const { amount, note } = req.body;
  
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Please provide a valid deposit amount greater than 0' });
  }

  try {
    await Transaction.create(req.user.id, 'deposit', amount, null, note);
    const updatedUser = await User.findById(req.user.id);
    
    res.status(200).json({ 
      message: 'Deposit successful', 
      balance: updatedUser.balance 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during deposit' });
  }
};

const withdraw = async (req, res) => {
  const { amount, note } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Please provide a valid withdrawal amount greater than 0' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (parseFloat(user.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    await Transaction.create(req.user.id, 'withdraw', amount, null, note);
    const updatedUser = await User.findById(req.user.id);

    res.status(200).json({ 
      message: 'Withdrawal successful', 
      balance: updatedUser.balance 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during withdrawal' });
  }
};

const transfer = async (req, res) => {
  const { receiverEmail, amount, note } = req.body;

  if (!receiverEmail || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Please provide a valid receiver email and transfer amount greater than 0' });
  }

  try {
    const sender = await User.findById(req.user.id);
    const receiver = await User.findByEmail(receiverEmail);

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    if (parseInt(receiver.id) === parseInt(req.user.id)) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    if (parseFloat(sender.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient funds for transfer' });
    }

    await Transaction.create(req.user.id, 'transfer', amount, receiver.id, note);
    const updatedSender = await User.findById(req.user.id);

    res.status(200).json({ 
      message: 'Transfer successful', 
      balance: updatedSender.balance 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during transfer' });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await Transaction.getHistoryByUserId(req.user.id);
    res.status(200).json({ count: history.length, transactions: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching transaction history' });
  }
};

module.exports = {
  deposit,
  withdraw,
  transfer,
  getHistory
};
