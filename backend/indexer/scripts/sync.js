import "../config.js"; // To load dotenv
import { connectDB } from "../db/client.js";
import { startIndexer } from "../indexer.js";

(async () => {
  await connectDB();
  await startIndexer();

})();
