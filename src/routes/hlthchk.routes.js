import {Router} from "express";

import {healthcheck} from '../controllers/hlthchk.controller.js';

const router = Router();

//healthcheck when / is accessed
router.route("/").get(healthcheck);

export default router