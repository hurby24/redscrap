import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("Please provide a DATABASE_URL");
}
const sql = postgres(connectionString);

export default sql;
