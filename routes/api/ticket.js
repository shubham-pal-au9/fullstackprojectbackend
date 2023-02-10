const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Ticket = require("../../models/Ticket");
const User = require("../../models/User");

const nodemailer = require("nodemailer");
const config = require("config");
const userMail = config.get("emailUser");
const userPassword = config.get("password");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: userMail,
    pass: userPassword,
  },
});

//@route    POST api/ticket
//@desc     Create a ticket
//@access    Private
router.post(
  "/",
  [
    auth,
    [
      check("ticket_issue", "Ticket Issue is required").not().isEmpty(),
      check("priority", "Priority is required").not().isEmpty(),
      check("desc", "Description is required").not().isEmpty(),
      check("req_category", "req_category is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      //getting user from db without password
      const user = await User.findById(req.user.id).select("-password");

      const newTicket = new Ticket({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        user: req.user.id,
        ticket_issue: req.body.ticket_issue,
        priority: req.body.priority,
        desc: req.body.desc,
        req_category: req.body.req_category,
      });
      const ticket = await newTicket.save();

      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    GET api/ticket
//@desc     Get all ticket
//@access    Private
router.get("/", auth, async (req, res) => {
  try {
    //tickets sorted by date tickets recent one first
    const ticket = await Ticket.find().sort({ date: -1 });
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    GET api/ticket/:id
//@desc     Get ticket by id
//@access    Private
router.get("/:id", auth, async (req, res) => {
  try {
    //post sorted by date post recent one first
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ msg: "Post not Found" });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Ticket not Found" });
    }
    res.status(500).send("Server Error");
  }
});

//@route    POST api/ticket/conversation/:id
//@desc     reply conversation on a ticket
//@access    Private
router.post(
  "/conversation/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      //getting user from db without password
      const user = await User.findById(req.user.id).select("-password");

      const ticket = await Ticket.findById(req.params.id);

      const newConversation = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      ticket.conversation.unshift(newConversation);
      await ticket.save();

      res.json(ticket.conversation);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    PUT api/ticket/updateticket/:id
//@description  update ticket status
//@access   Private

router.put(
  "/updateticket/:id",
  auth,
  [check("status", "Status is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updates = {
        status: req.body.status,
      };

      const ticket = await Ticket.findOneAndUpdate(
        { _id: req.params.id },
        updates,
        {
          new: true,
        }
      );

      await ticket.save();

      //sending email
      const user = await User.findById(ticket.user).select("-password");
      var mailOptions = {
        from: "no-reply@crm.com",
        to: user.email,
        subject: `Ticket: ${ticket.ticket_issue} has been Updated`,
        text: "Hi ${user.name}, Ticket Status Updated to <b>${ticket.status}. For further enquiry please Login check Crm Ticketing Apllication.",
        html: `Hi <b>${user.name}</b>, <br/> Ticket Status Updated to <b>${ticket.status}</b>. <br/> For further enquiry please Login check Crm Ticketing Apllication.`,
      };
      await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
