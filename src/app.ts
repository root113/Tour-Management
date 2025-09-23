import express from 'express';
// import routes
// import handlers

const app = express();

app.use(express.json());
// app.use('/path', routes);
// app.use(handlers);

export default app;