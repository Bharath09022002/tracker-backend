const express = require('express');

const createRouter = (Model) => {
    const router = express.Router();

    // GET all entries
    router.get('/', async (req, res) => {
        try {
            const data = await Model.find().sort({ date: -1 });
            res.json(data);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // POST a new entry
    router.post('/', async (req, res) => {
        try {
            const newEntry = new Model(req.body);
            const saved = await newEntry.save();
            res.status(201).json(saved);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // PATCH an entry
    router.patch('/:id', async (req, res) => {
        try {
            const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    // DELETE an entry
    router.delete('/:id', async (req, res) => {
        try {
            await Model.findByIdAndDelete(req.params.id);
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    return router;
};

module.exports = createRouter;
