import express from "express";
import bandRoutes from "./routes/band.routes";
import calendarRoutes from "./routes/calendar.routes";
// import handlers

const app = express();

app.use(express.json());
app.use('/api/v1/band', bandRoutes);
app.use('/api/v1/calendar');
// app.use(handlers);

export default app;