# Circuit Studio

Circuit Studio is a browser-based 3D circuit workbench built with Next.js, React Three Fiber, Express, and MongoDB. Its starter project is an ESP32 climate monitor wired to a DHT22 sensor and a resistor-protected status LED.

## What works

- Add and search ESP32, breadboard, DHT22, LED, and resistor parts.
- Select, move, rotate, and delete 3D components; orbit, pan, and zoom the scene.
- Click two component pins to add a wire. Click a wire to remove it.
- Run, stop, and reset the circuit simulation. Toggle ESP32 GPIO2, GPIO4, and GPIO5 while running.
- Inspect component properties, pinouts, sensor readings, LED state, and wiring warnings.
- Save and reopen projects through the MongoDB API. If the API is unavailable, the editor clearly saves to this browser instead.
- Export and import project JSON; copy share links for projects saved through the API.

The simulator currently models basic pin connectivity and the starter ESP32/DHT22/LED circuit. It is a learning simulator, not a SPICE engine or a replacement for testing physical hardware.

## Run locally

### 1. Start MongoDB and the API

Use a local MongoDB instance or a MongoDB Atlas connection string. Copy `server/.env.example` to `server/.env` and set your MongoDB URI as `MONGODB_URI` or `MONGO_URI`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/circuit-studio
PORT=8000
CLIENT_URL=http://localhost:3000
```

Then run:

```bash
cd server
npm install
npm run dev
```

The API health endpoint is `http://localhost:8000/health`. Project endpoints are `GET/POST /api/projects`, `GET /api/projects/:id`, and `PUT /api/projects/:id`.

### 2. Start the web app

In another terminal:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `client/.env.example` to `client/.env.local` and change `NEXT_PUBLIC_API_URL` if the API is hosted somewhere other than `http://localhost:8000/api`.

Production commands:

```bash
# client
npm run build
npm run start

# server
npm run build
npm run start
```

## Architecture

- `client/src/app` contains the landing page and editor route.
- `client/src/components/three` renders circuit parts, pin targets, wires, and camera/transform controls.
- `client/src/store/circuitStore.ts` is the shared editor and simulation state.
- `client/src/lib/circuitSimulation.ts` evaluates connectivity and the demo circuit behavior.
- `server/src/models/Project.ts` stores project JSON in MongoDB; Express routes and controllers expose project persistence.
- `sample-project.json` is an importable copy of the ESP32 demo project.

## Deploy

Deploy the Next.js client and Express API separately. Configure `NEXT_PUBLIC_API_URL` on the client and `MONGODB_URI`, `PORT`, and `CLIENT_URL` on the API. The API only starts when it can connect to MongoDB. A live deployment URL and demonstration recording must be supplied by the deployment owner.
