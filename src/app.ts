import express from 'express';
import bandRoutes from './routes/band.routes'
// import handlers

const app = express();

app.use(express.json());
app.use('/api/v1/band/', bandRoutes);
// app.use(handlers);

export default app;