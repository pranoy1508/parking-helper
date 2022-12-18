const Express = require("express");
const Auth = require("../middleware/is-auth.js");
const loginController=require("../controllers/loginController.js");


const router = Express.Router();

router.get("/", loginController.index);
router.post("/login_post", loginController.login_post);
router.get("/logout", loginController.logout);

module.exports = router;