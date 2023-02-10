const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../../middleware/auth");
const crypto = require("crypto");
const User = require("../../models/User");
const config = require("config");

const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

const nodemailer = require("nodemailer");
const userMail = config.get("emailUser");
const userPassword = config.get("password");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: userMail,
    pass: userPassword,
  },
});

//@route    GET api/auth
//@desc     Get user by token
//@access   Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    POST api/auth
//@desc     Authenticate/login user and get token
//@access   Public
router.post(
  "/",
  [
    check("email", "Please inclue a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    /* console.log(req.body); */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // see if user exist
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      //Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    POST api/auth
//@desc     Reset Password link email
//@access   Public
router.post(
  "/reset-password",
  [check("email", "Please inclue a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const token = await crypto.randomBytes(32).toString("hex");

      const updates = {
        resetToken: token,
        expireToken: Date.now() + 3600000,
      };
      //console.log(token);

      const user = await User.findOneAndUpdate(
        { email: req.body.email },
        updates,
        {
          new: true,
        }
      );
      await user.save();
      //sending email
      var mailOptions = {
        from: "no-reply@crm.com",
        to: user.email,
        subject: `Password Reset Request`,

        html: `<p>You requested for password reset</p>
        <p>Note this link is valid for one hour only</p>
      <h4>Click on this<a href="http://localhost:3000/reset/${token}">link</a> to reset password</h5>`,
      };
      await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      res.json({ message: "Check your Email" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    PUT api/auth//new-password
//@description  reset password
//@access   Public

router.put(
  "/new-password",
  [
    check("password", "Password should be 6 characters long").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updates = {
        password: req.body.password,
      };

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
      4;

      const sentToken = req.body.token;

      const user = await User.findOneAndUpdate(
        { resetToken: sentToken, expireToken: { $gt: Date.now() } },
        updates,
        {
          new: true,
        }
      );
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Try again session expired" }] });
      }
      await user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
