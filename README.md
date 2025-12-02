# http-server-ts

## Why this even exists

Look, I just wanted to stop being the guy punching in random HTTP requests and acting like I know what "listening on a port" means. So I started making an HTTP server by myself. No frameworks, no magic. Just plain TypeScript and me sweating the small stuff because I never actually understood sockets properly before.

## Why TypeScript?

Because, I keep making dumb mistakes in TypeScript and wanted to finally get good and stop breaking everything. What about performance ? I mean who cares, I need to understand first, then I can make it quick by writin in C++ or another language (At the end of the day, language is just a tool).

## The Plan (It Could Be a Broken Plan :) )

- Get a dumb TCP echo server working. Just something you can throw bytes at and see it bounce back. - Done

- Then make it barely talk HTTP. Read the raw text, parse a request line, send back the absolute minimum 200 OK response. - Done

- After that, add stuff: headers, methods, routes, maybe serve a file, maybe log a bug. As a result of it, with small challenges, I want to reach my goal and have my own http server (even if it is slow). - Done
- Optimize with Keep Alive: That was spontaneous though , i was creating a connection for each request :)
- Refactor to clean architecture:  Heyy at least I tried
- Response compression: (I will figure it out)
- Static file caching: Done 99 %
- **Write tests!** - I gotta do that for reducing manual testing
- Better Error messaging for debugging
- I gotta find bottlenecks and focus on them , I already found but, hey I need time :(
- I gotta figure out other stuff

## Quick Start
```bash
npm install

npm run build

npm start

npm run format

# Server runs on http://127.0.0.1:8080
```

### Test It Out
```bash
# Basic request
curl http://localhost:8080/

# Get server status
curl http://localhost:8080/status

# Create a user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Yoyo","age":46}'

# Test Keep-Alive (connection reuse)
curl -v http://localhost:8080/ http://localhost:8080/ http://localhost:8080/
# Look for "Re-using existing connection" in output
```

### Adding Tests

Adding tests will be a priority to be sure that when something crashes, I can correct my dumb mistake.

### What Is the Goal

Eventually, I want this server to kinda do everything I'd expect a "real" server to do, which will give me enough confidence about the architecture of http server and so on

**Repo layout (initial plan which can be changed)**
```text
http-server-ts/
├── src/
│   ├── main.ts                          # entry point 
│   │
│   ├── server/
│   │   └── httpServer.ts                # Core server orchestration
│   │
│   ├── routes/
│   │    ├── index.ts                # Route registration
│   │    └── router.ts               # Path matching & dispatch
│   │
│   ├── http/
│   │   ├── builder/
│   │   │   ├── headerBuilder.ts         # Builds header strings
│   │   │   ├── responseBuilder.ts       # Fluent API for responses
│   │   │   └── statusLine.ts            # Builds "HTTP/1.1 200 OK"
│   │   │
│   │   │── handlers/
│   │   │      └── staticFileHandler.ts # Serve files from disk or cache 
│   │   │  
│   │   ├── middleware/
│   │   │   ├── bodyParserMiddleware.ts  # Parses JSON/form data
│   │   │   ├── errorhandlermiddleware.ts# Global error wrapper
│   │   │   ├── loggerMiddleware.ts      # Request/response logging
│   │   │   ├── middlewareChain.ts       # Middleware execution
│   │   │   └── types.ts                 # Middleware types
│   │   │
│   │   ├── models/
│   │   │   ├── headers.ts               # Case-insensitive headers
│   │   │   ├── request.ts               # HttpRequest model
│   │   │   ├── response.ts              # HttpResponse model
│   │   │   └── StatusCode.ts            # HTTP status codes
│   │   │
│   │   └── parser/
│   │       ├── bodyParser.ts            # Body extraction
│   │       ├── headerParser.ts          # Header parsing
│   │       ├── requestLine.ts           # Request line parsing
│   │       └── requestParser.ts         # Complete request parser
│   │
│   │── network/
│   │   ├── connection.ts                # Socket wrapper with isAlive()
│   │   ├── keepAliveManager.ts          # Connection reuse logic 
│   │   ├── listener.ts                  # TCP server
│   │   ├── requestBuffer.ts             # Zero-copy buffering 
│   │   └── types.ts                     # Network interfaces
│   │── utils/
│         ├── fileCache.ts            # LRU cache
│         └── mimeTypes.ts            # File extension
│  
├── package.json
├── tsconfig.json
└── README.md
```
```

## Next Steps
- Add features when I feel brave
- Try not to give up on adding docs
- Learn by actually making the stuff
- Write more tests as I break stuff

 If anyone wants to point out dumb mistakes, go ahead. If you want to contribute, fork and clone the repo and good luck :).