module.exports = (req, res, next) => {
  const stored_session = req.session;
  const users_id = stored_session.users_id;
  if (!users_id) {
    res.redirect("/");
  }
  next();
};
