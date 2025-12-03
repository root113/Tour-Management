import { Router } from "express";
import environmentController from "../controllers/environment.controller";

const router = Router();

router.get('/city/:cityId', environmentController.getCity);
router.get('/city/all', environmentController.getAllCities);
router.get('/club/:clubId', environmentController.getClub);
router.get('/club/chain', environmentController.getClubChain);
router.get('/club/all', environmentController.getAllClubs);
router.get('/club/genre/:genre', environmentController.getClubsByGenre);
router.get('/club/city/:cityId', environmentController.getClubsByCity);
router.post('/club/new', environmentController.createClub);
router.put('/club/update/:clubId', environmentController.updateClub);
router.put('/club/update', environmentController.updateClubs);
router.delete('/club/remove/:clubId', environmentController.deleteClub);
router.delete('/dlub/remove', environmentController.deleteClubs);

export default router;