import express from 'express';

const app = express();

app.get("/", (req, res) => {
	res.send("the vps routes app says hello world");
});

if (process.argv[2] && process.argv[2] === "--rundev") {
	console.log("[LOG] dev env detected, hosting server");
	const PORT = process.env.PORT || 8080;
	app.listen(PORT, () => {
		console.log("[LOG] app listening on port " + PORT.toString());
	});
}

export default app;