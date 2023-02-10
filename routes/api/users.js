const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const auth = require("../../middleware/auth");

const User = require("../../models/User");
//@route        POST api/user
//@description  Create user
//@access        Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password should be 6 characters long").isLength({
      min: 6,
    }),
    check("role", "User Role is required").not().isEmpty(),
  ],
  async (req, res) => {
    /* console.log(req.body); */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      // see if user exist
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exsist" }] });
      }

      // get users gravatars
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
        role,
      });

      //encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      //save data to db
      await user.save();
      res.json("User Registered successfully");
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    GET api/users/allusers
//@description  Get all users
//@access   Private
router.get("/allusers", auth, async (req, res) => {
  try {
    const user = await User.find().select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    PUT api/users/editprofile/:id
//@description  update user profile
//@access   Private

router.put(
  "/editprofile/:id",
  auth,
  [
    check("name", "Name is required").not().isEmpty(),
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
        name: req.body.name,
        avatar: req.body.avatar,
        password: req.body.password,
      };

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);

      const user = await User.findOneAndUpdate(
        { _id: req.params.id },
        updates,
        {
          new: true,
        }
      );

      await user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    DELETE api/users/deleteUser/:id
//@description  delete users 
//@access   Private

router.delete("/deleteUser/:id", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);
  res.send("User deleted Successsfully")


    

  } catch (err) {
    console.error(err.response);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "User not Found" });
    }
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
