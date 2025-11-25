# http-server-ts

## Why this even exists

Look, I just wanted to stop being the guy punching in random HTTP requests and acting like I know what "listening on a port" means. So I started making an HTTP server by myself. No frameworks, no magic. Just plain TypeScript and me sweating the small stuff because I never actually understood sockets properly before.

## Why TypeScript?

Because, I keep making dumb mistakes in TypeScript and wanted to finally get good and stop breaking everything. What about performance ? I mean who cares, I need to understand first, then I can make it quick by writin in C++ or another language (At the end of the day, language is just a tool).

## The Plan (It Could Be a Broken Plan :) )

- Get a dumb TCP echo server working. Just something you can throw bytes at and see it bounce back.

- Then make it barely talk HTTP. Read the raw text, parse a request line, send back the absolute minimum 200 OK response.

- After that, add stuff: headers, methods, routes, maybe serve a file, maybe log a bug. As a result of it, with small challenges, I want to reach my goal and have my own http server (even if it is slow).

- I gotta figure out other stuff

### Adding Tests

Adding tests will be a priority to be sure that when something crashes, I can correct my dumb mistake.

### What Is the Goal

Eventually, I want this server to kinda do everything I'd expect a "real" server to do, which will give me enough confidence about the architecture of http server and so on

**Repo layout (initial plan which can be changed)**
```text
http-server-ts/
│
├── src/
│   ├── http/
│   │   ├── builder/
│   │   │   ├── headerBuilder.ts         # Builds header strings
│   │   │   ├── responseBuilder.ts       # Fluent API for building responses
│   │   │   └── statusLine.ts            # Builds "HTTP/1.1 200 OK"
│   │   │
│   │   ├── middleware/
│   │   │   ├── bodyParserMiddleware.ts      # Parses JSON/form data → req.parsedBody
│   │   │   ├── errorhandlermiddleware.ts    # Global try-catch wrapper
│   │   │   ├── loggerMiddleware.ts          # Logs requests & responses with timing
│   │   │   ├── middlewareChain.ts           # Executes middleware in sequence
│   │   │   └── types.ts                     # Middleware type definition
│   │   │
│   │   ├── models/
│   │   │   ├── headers.ts               # Case-insensitive header storage
│   │   │   ├── request.ts               # HttpRequest: method, path, headers, body, parsedBody
│   │   │   ├── response.ts              # HttpResponse: statusCode, headers, body, toString()
│   │   │   └── StatusCode.ts            # HTTP status codes enum & messages
│   │   │
│   │   └── parser/
│   │       ├── bodyParser.ts            # Extracts body using Content-Length
│   │       ├── headerParser.ts          # Parses header lines into Headers object
│   │       ├── requestLine.ts           # Parses "POST /api/users HTTP/1.1"
│   │       └── requestParser.ts         # Parses complete HTTP request from buffer
│   │
│   ├── main.ts                          # Entry point: creates listener, middleware, routes
│   │
│   └── network/
│       ├── connection.ts                # Wraps socket: onData, onClose, write, close
│       ├── listener.ts                  # Creates TCP server, accepts connections
│       └── types.ts                     # IListener, IConnection interfaces
│
└── README.md                            # Project documentation
```

## Next Steps
- Add features when I feel brave
- Try not to give up on adding docs
- Learn by actually making the stuff
- Write more tests as I break stuff

 If anyone wants to point out dumb mistakes, go ahead. If you want to contribute, fork and clone the repo and good luck :).