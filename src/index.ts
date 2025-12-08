import express from 'express';
import fs from 'fs';
import path from 'path'
import { fileURLToPath } from 'url'
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_DEV_ENV = process.argv[2] && process.argv[2] === "--rundev";
if (IS_DEV_ENV) {
	console.log("[LOG] dev env detected");
}

const app = express();

type routePathInfo = {
	path: string,
	mode: 'GET' | 'POST' | 'MIRROR'
};
type routesType = { [routeName: string]: routePathInfo | routesType };

let ROUTES: routesType | false = false;
try {
	if (IS_DEV_ENV) {
		ROUTES = JSON.parse(fs.readFileSync(path.join(__dirname, "../../routes/routes.json")).toString());
	} else {
		ROUTES = JSON.parse(process.env.ROUTES);
	}
} catch (e) {
	console.log("Error while loading routes:", e);
}
if (ROUTES === false) {
	throw (IS_DEV_ENV ? "In dev environment." : "") + " Routes could not be loaded. Exiting";
}

function addRoute(routes: routesType, parentRoute: string = "") {
	for (const [route, pathInfo] of Object.entries(routes)) {
		if (pathInfo.mode && pathInfo.path) {
			const builtPath = path.join(parentRoute, route).replaceAll("\\", "/");

			if (pathInfo.mode === 'MIRROR') {
				// this gave me a headache but atleast it works
				//
				// a single difference of a / caused the subpath of an index.html 
				// file at that subpath to not be included for relative urls from 
				// that file.

				let builtPathWslash = builtPath;
				let builtPathWOslash = builtPath;
				while (builtPathWOslash.endsWith("/")) {
					builtPathWOslash = builtPathWOslash.slice(0, builtPath.length - 1);
				}
				if (!(builtPathWslash.endsWith("/"))) {
					builtPathWslash += "/";
				}

				app.use((req, res, next) => {
					if (req.path === builtPathWOslash) {
						const qs = req.url.slice(req.path.length) || '';
						return res.redirect(301, builtPathWslash + qs);
					}
					next();
				});

				app.use(builtPathWslash, createProxyMiddleware({
					target: pathInfo.path,
					changeOrigin: true,
					pathRewrite: {
						[`^${builtPathWslash}`]: ''
					}
				}));

			} else {

				const cb = (type: 'GET' | 'POST') => async (req: express.Request, res: express.Response) => {
					let isErr: string | false = false;

					const fetched = await (await fetch(pathInfo.path as string, {
						method: type,
						body: type === 'POST' ? req.body : undefined
					})).text().catch((err) => {
						isErr = err;
					});

					if (isErr) {
						res.send(isErr);
					} else {
						res.send(fetched);
					}
				}

				if (pathInfo.mode === "GET") {
					app.get(builtPath, cb(pathInfo.mode));
				} else if (pathInfo.mode === "POST") {
					const rawText = (req, res, next) => {
						express.text({ type: "*/*" })(req, res, next);
					};

					app.post(builtPath, rawText, cb(pathInfo.mode));
				}
			}

			console.log("[INFO] Route added: " + pathInfo.mode + " " + builtPath);
		} else {
			addRoute(pathInfo as routesType, parentRoute + route);
		}
	}
}

console.log("");
addRoute(ROUTES);
console.log("");

app.get("/", (req, res) => {
	res.send("the vps routes app says hello world");
});

if (IS_DEV_ENV) {
	const PORT = process.env.PORT || 8080;
	app.listen(PORT, () => {
		console.log("[LOG] app listening on port " + PORT.toString());
	});
}

export default app;