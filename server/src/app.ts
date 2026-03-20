import express from 'express';

const app = express();

app.use(express.json());


// Routes
app.use('/', (req, res) => {
    res.send("Working");
})


export default app;