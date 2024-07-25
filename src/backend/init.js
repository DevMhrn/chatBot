const sequelize = require('./database');
const Conversation = require('./Conversation');
// Assuming there's a Booking model defined in booking.js
 

const initModels = async () => {
  await sequelize.sync();
};

module.exports = {
  Conversation,
  initModels,
};
