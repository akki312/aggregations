// handleError.js
const handleError = (logger, error, customMessage) => {
    logger.error(`${customMessage}: ${error.message}`);
    throw new Error(`${customMessage}: ${error.message}`);
  };
  
  module.exports = handleError;
  