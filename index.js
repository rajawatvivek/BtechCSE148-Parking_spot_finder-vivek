const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const envPathFromRoot = path.resolve(__dirname, '../../.env');
const envPathFromBackend = path.resolve(__dirname, '../.env');

require('dotenv').config({
  path: fs.existsSync(envPathFromRoot) ? envPathFromRoot : envPathFromBackend,
});

const spotRoutes = require('./spotRoutes');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use('/api/spots', spotRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
