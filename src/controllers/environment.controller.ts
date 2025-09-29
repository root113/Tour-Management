import { Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHandler";
// import service
// import dtos

// initialize service

//* --- GET OPERATIONS ---

const getCity = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getAllCities = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getClubChain = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getAllClubs = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getClubsByGenre = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getClubsByCity = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});





//* --- POST OPERATIONS ---

const createClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});





//* --- PUT OPERATIONS ---

const updateClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const updateClubs = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});





//* --- DELETE OPERATIONS ---

const deleteClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const deleteClubs = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

//* Exports

const environmentController = {
    getCity,
    getAllCities,
    getClub,
    getClubChain,
    getAllClubs,
    getClubsByGenre,
    getClubsByCity,
    createClub,
    updateClub,
    updateClubs,
    deleteClub,
    deleteClubs,
} as const;

export default environmentController;