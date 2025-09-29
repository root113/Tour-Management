import express from "express";
import bandRoutes from "./routes/band.routes";
import calendarRoutes from "./routes/calendar.routes";
import environmentRoutes from "./routes/environment.routes";
import adminRoutes from "./routes/admin.routes";
// import handlers

const app = express();

app.use(express.json());
app.use('/api/interface/admin', adminRoutes);
app.use('/api/v1/band', bandRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/environment', environmentRoutes);
// app.use(handlers);

export default app;