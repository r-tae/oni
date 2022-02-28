import {getLogger} from "../../services";
import {elasticBootstrap, elasticIndex} from "../../indexer/elastic";
import {bootstrap} from "../../services/bootstrap";

const log = getLogger();

export function setupAdminRoutes({server, configuration}) {
  server.get("/admin/elastic/index", async (req, res, next) => {
    try {
      log.debug('running elastic indexer');
      await elasticBootstrap({configuration});
      await elasticIndex({configuration});
      res.send({message: 'done: elastic indexer'});
    } catch (e) {
      log.error(e);
      res.send({error: 'Error debugging index', message: e.message}).status(500);
    }
  });
  server.get("/admin/database/index", async (req, res, next) => {
    try {
      log.debug('running database indexer');
      await bootstrap({ configuration });
      res.send({message: 'done: database indexer'});
    } catch (e) {
      log.error(e);
      res.send({error: 'Error database index', message: e.message}).status(500);
    }
  });
}
