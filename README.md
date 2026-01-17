# **Vercel VPS Proxy**

<div>
    <img style="height:50px;border-radius:50%" src="https://avatars.githubusercontent.com/u/14985020">
    <img style="height: 50px" src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/2048px-Typescript_logo_2020.svg.png">
    <img style="height: 50px" src="https://avatars.githubusercontent.com/u/9950313?s=48&v=4">
    <img style="height: 50px;border-radius:50%" src="https://avatars.githubusercontent.com/u/5658226?s=200&v=4">
</div>
<br>

This project allows you to host services running on your VPS behind Vercel’s infrastructure, giving you free HTTPS, CDN performance, and DDoS protection without configuring SSL or Cloudflare on your VPS.

It acts like a [reverse proxy](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/), forwarding requests from your Vercel domain to your VPS (or any other target) while keeping your VPS IP hidden in most cases.

You can specify paths and the URL to which they lead along with their HTTP method,<br>
or you can mirror your VPS's IP entirely under the assigned Vercel URL (or any domain that you have registered on the Vercel dash).

This also means that you can host projects that you were originally hosting under different ports on your VPS under different subpaths of your Vercel project's URL.<br>
e.g. <br>
xxx.xxx.xxx.xxx:8080 > xxx.vercel.app/project1 <br>
xxx.xxx.xxx.xxx:8081 > xxx.vercel.app/project2

> ⚠️ **Important Note**: Your VPS IP may still leak if your VPS makes outbound requests.
For example, if your VPS fetches a user-supplied URL (e.g., web-screenshot API), the destination server will see your VPS IP.
To prevent this, route outbound traffic through a VPN or proxy inside the VPS.

## Specifying Routes
Routes are specified in a json file name `routes.json` at the location `/routes/routes.json` for local testing.<br>
For deploying, stringify the `routes.json` file and paste it's content as a secret environment variable named `ROUTES` from the Vercel project settings such that it is accessible through `process.env.ROUTES`.

 **⚠️Important**: A `routes.json` file is required to test the project locally. It does not exist at the specified path by default so simply forking and running this will cause an error.

> Treat your `routes.json` file with the same level of security as a `.env` file as it would contain all your VPS IPs.

A `sample.routes.json` file exists by default at the specified path, you can rename it to `routes.json` to start off.<br>

There are 4 modes available: `GET`, `POST`, `REDIRECT` and `MIRROR`.<br><br>
The `MIRROR` mode is the best and recommended way to use this project.<br><br>
While `GET` and `POST` do work, they currently do not pass on headers and other stuff which may cause mismatches between what was actually sent and what was recieved by the client / VPS. This is currently work-in-progress and may be fixed in the future.


Sample routes file content
```json
{
    "/": {
        "mode": "GET",
        "path": "https://example.com"
    },
    "/redirect": {
        "mode": "REDIRECT",
        "path": "https://example.com"
    },
	"/github": {
		"mode": "MIRROR",
		"path": "https://github.com/"
	},
    "/postexample": {
        "mode": "POST",
        "path": "https://example.com"
    },
    "/nested": {
        "nest1": {
            "nest2": {
                "mode": "GET",
                "path": "https://example.com"
            }
        }
    }
}
```
The above file specifies the following routes:
- `/`
    - this points to https://example.com as a simple GET request
- `/redirect`
    - this redirects to https://example.com
- `/github`
    - this mirrors https://github.com/ under the subpath /github i.e relative urls like `./a/b` from `/github` will point to `/github/a/b` and be resolved as `https://github.com/a/b`, without ever revealing the IP address of https://github.com (which in our case would be the IP address of our VPS)
> Please note that even though the github website is mirrored, CORS still exists which would prevent most of the API request github requires to work. This is just a proof-of-concept.
- `/postexample`
    - this points to https://example.com as a POST request and passes on only the body of the request to https://example.com
- `/nested/nest1/nest2`
    - this points to https://example.com as a simple GET request and was kept as an example of nested routes


## Steps to test locally

- install deps
```
pnpm i
```
- start local server (default PORT is 8080)
```
pnpm run dev
```
- 127.0.0.1:8080 or localhost:8080 will be the base URL to test locally

## Deploying to Vercel
As `.gitignore` includes `routes/routes.json` and also as mentioned under [**Specifying Routes**](#specifying-routes),
before deploying the project, stringify the `routes.json` file and paste it's content as a secret environment variable named `ROUTES` from the Vercel project settings such that it is accessible through `process.env.ROUTES`. You need to do this every time you edit `routes.json` before deploying.