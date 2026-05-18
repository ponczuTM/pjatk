const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = 3001;

const POWER_LIMIT = 18000;

const globalState = {
  currentLevel: 1,

  users: {},

  level1: {
    strips: Array.from({ length: 30 }, (_, i) => ({
      id: i,
      sockets: [false, false, false, false],
      powerUsage: 0,
    })),
    totalPower: 0,
    stableSince: null,
    breakerTriggered: false,
  },

  level2: {
    products: [
      { id: 1, name: "Sensor-X", x: 120, y: 180, price: 120 },
      { id: 2, name: "Beacon-Y", x: 380, y: 120, price: 220 },
      { id: 3, name: "Router-Z", x: 540, y: 280, price: 310 },
    ],

    gateways: [
      { id: 1, x: 100, y: 100 },
      { id: 2, x: 350, y: 200 },
      { id: 3, x: 600, y: 150 },
    ],

    beacons: [
      { id: 1, x: 80, y: 90, dx: 2, dy: 1 },
      { id: 2, x: 420, y: 250, dx: -2, dy: 1 },
    ],

    einkLabels: [
      { id: 1, text: "120 PLN" },
      { id: 2, text: "220 PLN" },
      { id: 3, text: "310 PLN" },
    ],
  },

  level3: {
    incidents: [],
    nextIncidentId: 1,
  },
};

function calculatePower() {
  let total = 0;

  globalState.level1.strips.forEach((strip) => {
    let usage = 0;

    strip.sockets.forEach((socket) => {
      if (socket) {
        usage += 1500;
      }
    });

    strip.powerUsage = usage;
    total += usage;
  });

  globalState.level1.totalPower = total;

  if (total > POWER_LIMIT) {
    globalState.level1.breakerTriggered = true;

    globalState.level1.strips.forEach((strip) => {
      strip.sockets = [false, false, false, false];
      strip.powerUsage = 0;
    });

    globalState.level1.totalPower = 0;
  } else {
    globalState.level1.breakerTriggered = false;
  }
}

function checkLevelProgression() {
  const l1 = globalState.level1;

  if (
    globalState.currentLevel === 1 &&
    l1.totalPower > 0 &&
    l1.totalPower < POWER_LIMIT * 0.8
  ) {
    if (!l1.stableSince) {
      l1.stableSince = Date.now();
    }

    const stableTime = Date.now() - l1.stableSince;

    if (stableTime >= 60000) {
      globalState.currentLevel = 2;
      io.emit("levelChanged", 2);
    }
  } else {
    l1.stableSince = null;
  }
}

function generateIncident() {
  if (globalState.currentLevel !== 3) return;

  const types = ["MOTION", "SOS"];

  const incident = {
    id: globalState.level3.nextIncidentId++,
    type: types[Math.floor(Math.random() * types.length)],
    room: ["A1", "B2", "C3"][Math.floor(Math.random() * 3)],
    timestamp: Date.now(),
    resolved: false,
  };

  globalState.level3.incidents.push(incident);

  io.emit("stateUpdate", globalState);
}

setInterval(() => {
  globalState.level2.beacons.forEach((b) => {
    b.x += b.dx;
    b.y += b.dy;

    if (b.x < 20 || b.x > 700) b.dx *= -1;
    if (b.y < 20 || b.y > 350) b.dy *= -1;
  });

  io.emit("stateUpdate", globalState);
}, 1000);

setInterval(() => {
  checkLevelProgression();
}, 2000);

setInterval(() => {
  generateIncident();
}, 10000);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  globalState.users[socket.id] = {
    id: socket.id,
    connectedAt: Date.now(),
  };

  socket.emit("stateUpdate", globalState);

  io.emit("usersUpdate", Object.values(globalState.users));

  socket.on("toggleSocket", ({ stripId, socketIndex }) => {
    const strip = globalState.level1.strips[stripId];

    if (!strip) return;

    strip.sockets[socketIndex] = !strip.sockets[socketIndex];

    calculatePower();

    io.emit("stateUpdate", globalState);
  });

  socket.on("scanGateway", ({ gatewayId }) => {
    const gateway = globalState.level2.gateways.find(
      (g) => g.id === gatewayId
    );

    if (!gateway) return;

    const beaconData = globalState.level2.beacons.map((b) => {
      const distance = Math.sqrt(
        Math.pow(gateway.x - b.x, 2) + Math.pow(gateway.y - b.y, 2)
      );

      return {
        beaconId: b.id,
        rssi: Math.max(-90, -distance / 5),
      };
    });

    socket.emit("gatewayData", beaconData);
  });

  socket.on("updatePrice", ({ labelId, newPrice }) => {
    const label = globalState.level2.einkLabels.find(
      (l) => l.id === labelId
    );

    if (!label) return;

    label.text = `${newPrice} PLN`;

    io.emit("stateUpdate", globalState);
  });

  socket.on("resolveIncident", (incidentId) => {
    const incident = globalState.level3.incidents.find(
      (i) => i.id === incidentId
    );

    if (!incident) return;

    incident.resolved = true;

    io.emit("stateUpdate", globalState);
  });

  socket.on("adminNextLevel", () => {
    if (globalState.currentLevel < 3) {
      globalState.currentLevel += 1;

      io.emit("stateUpdate", globalState);
    }
  });

  socket.on("disconnect", () => {
    delete globalState.users[socket.id];

    io.emit("usersUpdate", Object.values(globalState.users));

    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("IoT Digital Twin Simulation Server Running");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});