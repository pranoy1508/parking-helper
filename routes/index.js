const Express = require("express");
const Auth = require("../middleware/is-auth.js");
const loginController=require("../controllers/loginController.js");
const adminController=require("../controllers/adminController.js");
const userController=require("../controllers/userController");
const parkingController=require("../controllers/parkingController.js");

const router = Express.Router();

router.get("/", loginController.index);
router.post("/login_post", loginController.login_post);
router.get("/logout", loginController.logout);


router.get("/onLoad", Auth, adminController.onLoad);
router.post("/admin/get_parking_locations", Auth, adminController.getParkingLocationsByOffice);
router.post("/admin/get_location_details", Auth, adminController.getParkingDetails);
router.post("/admin/update_location_details",Auth,adminController.updateLocationDetails);

router.post("/user/add_user",Auth,userController.addUser);



router.get("/openSecurity", Auth, parkingController.onLoad);


module.exports = router; 