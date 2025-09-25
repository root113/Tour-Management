import { Router } from "express";
import calendarController from "../controllers/calendar.controller";
// import middlewares
// import dtos

const router = Router();

router.post('/new/year/:popYearId', calendarController.createCalendarForYear);
router.post('/new/timeline/:popYearId/:popYearId', calendarController.createCalendarForTimeline);
router.post('/new/event/year/:popYearId', calendarController.createEventForYear);
router.put('/update/year/:popYearId', calendarController.updateCalendarForYear);
router.put('/update/timeline/:popYearId/:popYearId', calendarController.updateCalendarForTimeline);
router.put('/update/events/year/:popYearId', calendarController.updateCalendarEventOfYear);
router.put('/dates/update/year/:popYearId', calendarController.updateCalendarDateOfYear);
router.put('/dates/scale/update/:popYearId/:popYearId', calendarController.updateCalendarScaleDatesOfYear);
router.put('/event/update/:eventId', calendarController.updateEvent);
router.delete('/event/delete/:eventId', calendarController.deleteEvent);
router.delete('/delete/event/:eventId', calendarController.deleteCalendarEvent);

//? Info sub-router
const infoRouter = Router();
router.use('/info', infoRouter);

infoRouter.get('/year/:popYearId', calendarController.getCalendarOfYear);
infoRouter.get('/events/year/:popYearId', calendarController.getCalendarEventsOfYear);
infoRouter.get('/dates/scale/:popYearId/:popYearId', calendarController.getCalendarDateScale);
infoRouter.get('/dates/year/start/:popYearId', calendarController.getCalendarYearStartDate);
infoRouter.get('/dates/year/end/:popYearId', calendarController.getCalendarYearEndDate);
infoRouter.get('/concerts/year/:popYearId', calendarController.getCalendarConcertsOfYear);
infoRouter.get('/concerts/date', calendarController.getCalendarConcertsOfDate);

export default router;
