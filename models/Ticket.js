const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TicketSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  ticket_issue: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  name: {
    type: String,
  },
  avatar: {
    type: String,
  },
  status: {
    type: String,
    default: "New",
  },
  priority: {
    type: String,
    required: true,
  },
  req_category: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },

  conversation: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      text: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
      avatar: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = Ticket = mongoose.model("ticket", TicketSchema);
