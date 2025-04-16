const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const logger = require('./utils/Logger');
const routes = require('./routes');

// Log application startup details
logger.info(`Starting Gource Tools application`);
logger.info(`Current working directory: ${process.cwd()}`);
logger.info(`Application root directory: ${path.resolve(__dirname, '../')}`);

const app = express();
// ... existing code ... 