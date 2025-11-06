import { Request, Response } from "express";

import asyncHandler from "../middlewares/asyncHandler";
// import service
// import dtos

// initialize service

//* --- GET OPERATIONS ---

const getCalendarOfYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const getCalendarEventsOfYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const getCalendarDateScale = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const getCalendarYearStartDate = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const getCalendarYearEndDate = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const getCalendarConcertsOfYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const getCalendarConcertsOfDate = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});





//* --- POST OPERATIONS ---

const createCalendarForYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const createCalendarForTimeline = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const createEventForYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});





//* --- PUT OPERATIONS ---

const updateCalendarForYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateCalendarForTimeline = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateCalendarDateOfYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateCalendarEventOfYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateCalendarScaleDatesOfYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});





//* --- DELETE OPERATIONS ---

const deleteCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

//* Export

const calendarController = {
    getCalendarOfYear,
    getCalendarEventsOfYear,
    getCalendarDateScale,
    getCalendarYearStartDate,
    getCalendarYearEndDate,
    getCalendarConcertsOfYear,
    getCalendarConcertsOfDate,
    createCalendarForYear,
    createCalendarForTimeline,
    createEventForYear,
    updateCalendarForYear,
    updateCalendarForTimeline,
    updateCalendarDateOfYear,
    updateCalendarEventOfYear,
    updateCalendarScaleDatesOfYear,
    updateEvent,
    deleteCalendarEvent,
    deleteEvent,
} as const;

export default calendarController;