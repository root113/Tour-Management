import { Request, Response } from "express";

import asyncHandler from "../middlewares/asyncHandler";
// import service
// import dtos

// initialize service

//* PopYear

const createPopYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updatePopYear = asyncHandler(async (req: Request, res: Response) => {    
    // TODO: to be implemented
});

const deletePopYear = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});


//* PopDay

const createPopDay = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updatePopDay = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deletePopDay = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});


//* City

const createCity = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateCity = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deleteCity = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});


//* Club

const createClub = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateClub = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deleteClub = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});


//* Band

const createBand = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateBand = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deleteBand = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});


//* Concert

const createConcert = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateConcert = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deleteConcert = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});


//* Event

const createEvent = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    // TODO: to be implemented
});

const adminController = {
    createPopYear,
    updatePopYear,
    deletePopYear,
    createPopDay,
    updatePopDay,
    deletePopDay,
    createCity,
    updateCity,
    deleteCity,
    createClub,
    updateClub,
    deleteClub,
    createBand,
    updateBand,
    deleteBand,
    createConcert,
    updateConcert,
    deleteConcert,
    createEvent,
    updateEvent,
    deleteEvent,
} as const;

export default adminController;