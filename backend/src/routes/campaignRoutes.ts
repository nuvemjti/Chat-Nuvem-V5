import { Router } from 'express';
import multer from 'multer';
import CampaignController from '../controllers/CampaignController';
import uploadConfig from '../config/upload';
import isAuth from '../middleware/isAuth';

const upload = multer(uploadConfig);
const campaignRoutes = Router();

campaignRoutes.get('/campaigns/list', isAuth, CampaignController.findList);

campaignRoutes.get("/campaigns", isAuth, CampaignController.index);

campaignRoutes.get("/campaigns/:id", isAuth, CampaignController.show);

campaignRoutes.post("/campaigns", isAuth, CampaignController.store);

campaignRoutes.put("/campaigns/:id", isAuth, CampaignController.update);

campaignRoutes.delete("/campaigns/:id", isAuth, CampaignController.remove);

campaignRoutes.delete("/campaigns/clear", isAuth, CampaignController.clearData);

campaignRoutes.post("/campaigns/:id/cancel", isAuth, CampaignController.cancel);

campaignRoutes.post("/campaigns/:id/restart", isAuth, CampaignController.restart);


campaignRoutes.post(
  '/campaigns/import',
  isAuth,
  upload.single('file'),
  CampaignController.importData
);


campaignRoutes.delete(
  "/campaigns/:id/media-upload",
  isAuth,
  CampaignController.deleteMedia
);

export default campaignRoutes;
