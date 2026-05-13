const token = jwt.sign(
  { id: user._id },   // IMPORTANT
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
