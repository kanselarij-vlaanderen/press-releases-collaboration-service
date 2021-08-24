import { app, errorHandler } from 'mu';

app.post('/collaboration-activities/:id/share', async (req, res, next) => {
    try {
        const id = req.params.id;
        console.log(id);

        res.sendStatus(202);
    } catch (err) {
        console.error(err, e);
        next(err);
    }
});


// use mu errorHandler middleware.
app.use(errorHandler);

