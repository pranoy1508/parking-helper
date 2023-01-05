module.exports = (req, res, next) => {
  const stored_session = req.session;
  const users_id = stored_session.users_id;
  if (!users_id) {
    res.redirect("/");
  }
  if (req.originalUrl.toUpperCase() == "/ONLOAD" && stored_session.users_id.userRole != "ADMIN") {
    res.redirect("/");
  }
  if (req.originalUrl.toUpperCase() == "/OPENSECURITY" && stored_session.users_id.userRole != "SUPPORT") {
    res.redirect("/");
  }
  if (req.originalUrl.toUpperCase() == "/DASHBOARD" && stored_session.users_id.userRole == "SUPPORT") {
    res.redirect("/");
  }
  next();
};
