const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const inventoryRoutes = require('./routes/inventory'); // Adjust the path as needed
const patientRoutes = require('./routes/patient');

const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect('mongodb+srv://akshithsistla:ccipnWsoxp5NQ0nm@cluster0.iljkeyx.mongodb.net/docisn', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

app.use(bodyParser.json());

app.use('/inventory', inventoryRoutes);
app.use('/patients', patientRoutes);
app

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
