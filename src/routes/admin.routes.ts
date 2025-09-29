import { Router } from "express";
import adminController from "../controllers/admin.controller";
//import middlewares
//import dtos

const router = Router();

router.post('/pop-year/new', adminController.createPopYear);
router.put('/pop-year/update/:popYearId', adminController.updatePopYear);
router.delete('/pop-year/delete/:popYearId', adminController.deletePopYear);

router.post('/pop-day/new', adminController.createPopDay);
router.put('/pop-day/update/:popDayId', adminController.updatePopDay);
router.delete('/pop-day/delete/:popDayId', adminController.deletePopDay);

router.post('/city/new', adminController.createCity);
router.put('/city/update/:cityId', adminController.updateCity);
router.delete('/city/delete/:cityId', adminController.deleteCity);

router.post('/club/new', adminController.createClub);
router.put('/club/update/:clubId', adminController.updateClub);
router.delete('/club/delete/:clubId', adminController.deleteClub);

router.post('/band/new', adminController.createBand);
router.put('/band/update/:bandId', adminController.updateBand);
router.delete('/band/delete/:bandId', adminController.deleteBand);

router.post('/concert/new', adminController.createConcert);
router.put('/concert/update/:concertId', adminController.updateConcert);
router.delete('/concert/delete/:concertId', adminController.deleteConcert);

router.post('/event/new', adminController.createEvent);
router.put('/event/update/:eventId', adminController.updateEvent);
router.delete('/event/delete/:eventId', adminController.deleteEvent);

export default router;