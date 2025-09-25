import { Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHandler";
// import service
// import dtos

// initialize service

//* --- GET OPERATIONS ---

const getBandInfo = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandsInfo = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandOngoingTourPlan = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandPastTourPlan = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandAllTourPlans = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandTourPlanEventDays = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandVisitedCities = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandUpcomingCityVisits = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandVisitedClubs = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandUpcomingClubVisits = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandConcertInfo = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandConcertHistoryInCity = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandUpcomingConcertsInCity = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandConcertHistoryInClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandUpcomingConcertsInClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandConcertCountInCity = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandConcertCountInClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandLastCityVisit = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const getBandLastClubVisit = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});





//* --- POST OPERATIONS ---

const createBand = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const createBands = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const createBandTourPlan = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const createBandConcerts = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const createBandConcertsInClub = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});





//* --- PUT OPERATIONS ---

const updateBandInfo = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const updateBandTourPlan = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const updateBandConcerts = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});





//* --- DELETE OPERATIONS ---

const deleteBand = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const deleteBandTourPlan = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});

const deleteBandConcerts = asyncHandler(async (req: Request, res: Response) => {
    // to be implemented
});


//* Export

const bandController = {
    getBandInfo,
    getBandsInfo,
    getBandOngoingTourPlan,
    getBandPastTourPlan,
    getBandAllTourPlans,
    getBandTourPlanEventDays,
    getBandVisitedCities,
    getBandUpcomingCityVisits,
    getBandVisitedClubs,
    getBandUpcomingClubVisits,
    getBandConcertInfo,
    getBandConcertHistoryInCity,
    getBandUpcomingConcertsInCity,
    getBandConcertHistoryInClub,
    getBandUpcomingConcertsInClub,
    getBandConcertCountInCity,
    getBandConcertCountInClub,
    getBandLastCityVisit,
    getBandLastClubVisit,
    createBand,
    createBands,
    createBandTourPlan,
    createBandConcerts,
    createBandConcertsInClub,
    updateBandInfo,
    updateBandTourPlan,
    updateBandConcerts,
    deleteBand,
    deleteBandTourPlan,
    deleteBandConcerts,
} as const;

export default bandController;