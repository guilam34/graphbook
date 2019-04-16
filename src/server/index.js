import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import compress from "compression";
import services from "./services";

const root = path.join(__dirname, "../../");
const app = express();

// config headers
if (process.env.NODE_ENV === "development") {
	app.use(helmet());
	app.use(
		helmet.contentSecurityPolicy({
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", "data:", "*.amazonaws.com"]
			}
		})
	);
	app.use(helmet.referrerPolicy({ policy: "same-origin" }));
}

// compress responses
app.use(compress());

// enable CORS
app.use(cors());	

const serviceNames = Object.keys(services);
for (let i = 0; i < serviceNames.length; i += 1) {
	const name = serviceNames[i];
	if (name === "graphql") {
		services[name].applyMiddleware({ app });
	} else {
		app.use(`/${name}`, services[name]);
	}
}

app.listen(8000, () => console.log("Listening on port 8000!"));