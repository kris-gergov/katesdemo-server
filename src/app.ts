import db from '@utils/db';
import logger from './utils/logger';
import { createServer } from './utils/server';

db.open()
  .then(() => createServer())
  .then(server => {
    server.listen(process.env.PORT || 5000, () => {
      logger.info(`Listening on https://katesdemo.onrender.com`);
    });
  })
  .catch(err => {
    logger.error(`Error: ${err}`);
  });
