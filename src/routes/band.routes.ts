import { Router } from "express";
import bandController from "../controllers/band.controller";


const router = Router();

router.get('/info', bandController.getBandsInfo);
router.post('/create', bandController.createBand);
router.post('/create-multiple', bandController.createBands);
router.delete('/delete/:bandId', bandController.deleteBand);

//? Info sub-router
const infoRouter = Router();
router.use('/:bandId', infoRouter);

infoRouter.get('/info', bandController.getBandInfo);
infoRouter.get('/visited/city', bandController.getBandVisitedCities);
infoRouter.get('/visited/club', bandController.getBandVisitedClubs);
infoRouter.get('/upcoming-visits/city/:cityId', bandController.getBandUpcomingCityVisits);
infoRouter.get('/upcoming-visits/club/:clubId', bandController.getBandUpcomingClubVisits);
infoRouter.get('/last-visit/city/:cityId', bandController.getBandLastCityVisit);
infoRouter.get('/last-visit/club/:clubId', bandController.getBandLastClubVisit);
infoRouter.put('/update', bandController.updateBandInfo);

//? Tour plan sub-router
const tourPlanRouter = Router();
router.use('/:bandId/tour-plans/', tourPlanRouter);

tourPlanRouter.get('/all', bandController.getBandAllTourPlans);
tourPlanRouter.get('/active', bandController.getBandOngoingTourPlan);
tourPlanRouter.get('/past', bandController.getBandPastTourPlan);
tourPlanRouter.get('/events', bandController.getBandTourPlanEventDays);
tourPlanRouter.post('/create', bandController.createBandTourPlan);
tourPlanRouter.put('/update', bandController.updateBandTourPlan);
tourPlanRouter.delete('/delete/:popYearId/:popYearId', bandController.deleteBandTourPlan);

//? Concert sub-router
const concertRouter = Router();
router.use('/:bandId/concerts', concertRouter);

concertRouter.get('/info/:concertId', bandController.getBandConcertInfo);
concertRouter.get('/history/city/:cityId', bandController.getBandConcertHistoryInCity);
concertRouter.get('/history/club/:clubId', bandController.getBandConcertHistoryInClub);
concertRouter.get('/upcoming/city/:cityId', bandController.getBandUpcomingConcertsInCity);
concertRouter.get('/upcoming/club/:clubId', bandController.getBandUpcomingConcertsInClub);
concertRouter.get('/count/city/:cityId', bandController.getBandConcertCountInCity);
concertRouter.get('/count/club/:clubId', bandController.getBandConcertCountInClub);
concertRouter.post('/create', bandController.createBandConcerts);
concertRouter.post('/create/club/:clubId', bandController.createBandConcertsInClub);
concertRouter.put('/update', bandController.updateBandConcerts);
concertRouter.delete('/delete', bandController.deleteBandConcerts);

export default router;
