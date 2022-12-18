const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(err);
};

const errorHandler = (err, req, res, next) => {
  console.log("Error Found");
  console.log(err);

  if (
    req.xhr ||
    (req.headers &&
      req.headers.accept &&
      req.headers.accept.indexOf("json") > -1)
  ) {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
      status: false,
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  } else {
    // res.render("404");
  }
};

module.exports = {
  notFound,
  errorHandler,
};
