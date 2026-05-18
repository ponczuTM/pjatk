const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 3001;
const POWER_LIMIT = 18000;
const REQUIRED_LEVEL1_POWER_MIN = 12000;

const LEVEL1_STRIP_METADATA = [
  {
    id: 0,
    critical: false,
    devices: [
      { power: 900, required: true, server: false },
      { power: 1200, required: true, server: false },
      { power: 1400, required: true, server: false, annoying: true },
      { power: 250, required: false, server: false },
    ],
  },
  {
    id: 1,
    critical: false,
    devices: [
      { power: 1200, required: true, server: false },
      { power: 1000, required: true, server: false },
      { power: 450, required: false, server: false },
      { power: 150, required: false, server: false },
    ],
  },
  {
    id: 2,
    critical: false,
    devices: [
      { power: 900, required: true, server: false },
      { power: 500, required: true, server: false },
      { power: 300, required: true, server: false },
      { power: 500, required: false, server: false },
    ],
  },
  {
    id: 3,
    critical: false,
    devices: [
      { power: 900, required: true, server: false },
      { power: 400, required: true, server: false },
      { power: 1200, required: false, server: false, annoying: true },
      { power: 2000, required: false, server: false, annoying: true },
    ],
  },
  {
    id: 4,
    critical: false,
    devices: [
      { power: 1800, required: true, server: false },
      { power: 300, required: true, server: false },
      { power: 700, required: true, server: false },
      { power: 250, required: false, server: false },
    ],
  },
  {
    id: 5,
    critical: false,
    devices: [
      { power: 2400, required: true, server: true },
      { power: 600, required: true, server: false },
      { power: 350, required: true, server: false },
      { power: 250, required: false, server: false },
    ],
  },
  {
    id: 6,
    critical: false,
    devices: [
      { power: 400, required: false, server: false },
      { power: 1600, required: false, server: false },
      { power: 1200, required: false, server: false },
      { power: 200, required: true, server: false },
    ],
  },
  {
    id: 7,
    critical: false,
    devices: [
      { power: 1900, required: true, server: true },
      { power: 400, required: true, server: false },
      { power: 250, required: true, server: false },
      { power: 1700, required: false, server: false, annoying: true },
    ],
  },
  {
    id: 8,
    critical: false,
    devices: [
      { power: 1100, required: true, server: false },
      { power: 600, required: true, server: false },
      { power: 300, required: true, server: false },
      { power: 200, required: false, server: false },
    ],
  },
  {
    id: 9,
    critical: true,
    devices: [
      { power: 3000, required: true, server: true },
      { power: 900, required: true, server: false },
      { power: 500, required: true, server: false },
      { power: 1500, required: true, server: false },
    ],
  },
];

// ========== GLOBAL STATE ==========
const globalState = {
  currentLevel: 1,
  levelCompleted: false,
  users: {},

  level1: {
    strips: LEVEL1_STRIP_METADATA.map((strip) => ({
      ...strip,
      sockets: [false, false, false, false],
      enabled: strip.id === 9,
      powerUsage: 0,
    })),
    totalPower: 0,
    stableSince: null,
    breakerTriggered: false,
    blackoutUntil: null,
    serverShutdownUntil: null,
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
      { id: 1, text: "120 PLN", updated: false },
      { id: 2, text: "220 PLN", updated: false },
      { id: 3, text: "310 PLN", updated: false },
    ],
    foundBeacon: false,
    sensorData: {
      temperature: 22.5,
      humidity: 45,
      battery: 85,
      lastUpdate: Date.now(),
    },
    irData: {
      zone: "CENTER",
      distance: 50,
    },
    pirData: {
      motionDetected: false,
      lastMotion: null,
    },
  },

  level3: {
    incidents: [],
    nextIncidentId: 1,
  },
};

// ========== HELPER FUNCTIONS ==========
function emitState() {
  io.emit("stateUpdate", globalState);
}

function resetLevel1() {
  globalState.level1.strips.forEach((strip) => {
    strip.sockets = [false, false, false, false];
    strip.enabled = true;
    strip.powerUsage = 0;
  });
  globalState.level1.totalPower = 0;
  globalState.levelCompleted = false;
}

function calculatePower() {
  let total = 0;
  globalState.level1.strips.forEach((strip) => {
    let usage = 0;
    if (strip.enabled) {
      strip.sockets.forEach((socket, idx) => {
        if (socket && strip.devices?.[idx]) {
          usage += strip.devices[idx].power;
        }
      });
    }
    strip.powerUsage = usage;
    total += usage;
  });
  globalState.level1.totalPower = total;

  if (total > POWER_LIMIT) {
    globalState.level1.breakerTriggered = true;
    globalState.level1.blackoutUntil = Date.now() + 5000;
    resetLevel1();
    emitState();
    setTimeout(() => {
      globalState.level1.breakerTriggered = false;
      globalState.level1.blackoutUntil = null;
      emitState();
    }, 5000);
    return;
  }

  globalState.level1.breakerTriggered = false;
  if (
    total >= REQUIRED_LEVEL1_POWER_MIN &&
    total <= POWER_LIMIT &&
    globalState.currentLevel === 1
  ) {
    globalState.levelCompleted = true;
  } else {
    globalState.levelCompleted = false;
  }
}

function shutdownServerRoom() {
  globalState.level1.serverShutdownUntil = Date.now() + 10000;
  resetLevel1();
  emitState();
  setTimeout(() => {
    globalState.level1.serverShutdownUntil = null;
    emitState();
  }, 10000);
}

function validateLevel2Completion() {
  const labelsUpdated = globalState.level2.einkLabels.every((label) => label.updated);
  if (labelsUpdated && globalState.level2.foundBeacon) {
    globalState.levelCompleted = true;
  } else {
    globalState.levelCompleted = false;
  }
}

function validateLevel3Completion() {
  const unresolved = globalState.level3.incidents.filter((i) => !i.resolved);
  if (unresolved.length === 0 && globalState.level3.incidents.length > 0) {
    globalState.levelCompleted = true;
  } else {
    globalState.levelCompleted = false;
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
  validateLevel3Completion();
  emitState();
}

function generateSensorData() {
  const now = Date.now();
  const t = now / 1000;
  const tempBase = 22 + 5 * Math.sin(t / 30);
  const temperature = Number((tempBase + (Math.random() - 0.5) * 1.5).toFixed(1));
  const humidityBase = 50 + 15 * Math.sin(t / 45);
  const humidity = Number((humidityBase + (Math.random() - 0.5) * 3).toFixed(0));
  let battery = globalState.level2.sensorData.battery;
  if (battery <= 20) battery = 100;
  else battery = Number((battery - (Math.random() * 0.05)).toFixed(1));
  
  globalState.level2.sensorData = {
    temperature,
    humidity,
    battery,
    lastUpdate: now,
  };

  const motionDetected = Math.random() < 0.15;
  if (motionDetected) {
    globalState.level2.pirData.motionDetected = true;
    globalState.level2.pirData.lastMotion = now;
    setTimeout(() => {
      if (globalState.level2.pirData.lastMotion === now) {
        globalState.level2.pirData.motionDetected = false;
        emitState();
      }
    }, 2000);
  }

  io.emit("sensorUpdate", {
    mvs: globalState.level2.sensorData,
    pir: globalState.level2.pirData,
    ir: globalState.level2.irData,
  });
  emitState();
}

let sensorInterval = null;
function startSensorInterval() {
  if (sensorInterval) clearInterval(sensorInterval);
  sensorInterval = setInterval(() => {
    if (globalState.currentLevel === 2) {
      generateSensorData();
    }
  }, 1000);
}
startSensorInterval();

setInterval(() => {
  globalState.level2.beacons.forEach((b) => {
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < 20 || b.x > 700) b.dx *= -1;
    if (b.y < 20 || b.y > 350) b.dy *= -1;
  });
  emitState();
}, 1000);

setInterval(() => {
  generateIncident();
}, 10000);

// ========== SOCKET.IO ==========
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  globalState.users[socket.id] = { id: socket.id, connectedAt: Date.now() };
  socket.emit("stateUpdate", globalState);
  io.emit("usersUpdate", Object.values(globalState.users));

  // Level 1
  socket.on("toggleSocket", ({ stripId, socketIndex }) => {
    if (globalState.level1.breakerTriggered || globalState.level1.serverShutdownUntil) return;
    const strip = globalState.level1.strips[stripId];
    if (!strip || !strip.enabled) return;
    strip.sockets[socketIndex] = !strip.sockets[socketIndex];
    if (stripId === 9 && socketIndex === 0 && strip.sockets[socketIndex] === false) {
      shutdownServerRoom();
      return;
    }
    calculatePower();
    emitState();
  });

  socket.on("toggleStrip", ({ stripId }) => {
    if (globalState.level1.breakerTriggered || globalState.level1.serverShutdownUntil) return;
    const strip = globalState.level1.strips[stripId];
    if (!strip) return;
    strip.enabled = !strip.enabled;
    if (!strip.enabled && strip.id === 9) {
      shutdownServerRoom();
      return;
    }
    calculatePower();
    emitState();
  });

  socket.on("level1Completed", () => {
    globalState.levelCompleted = true;
    emitState();
  });

  // Level 2
  socket.on("scanGateway", ({ gatewayId }) => {
    const gateway = globalState.level2.gateways.find((g) => g.id === gatewayId);
    if (!gateway) return;
    const beaconData = globalState.level2.beacons.map((b) => {
      const distance = Math.sqrt(Math.pow(gateway.x - b.x, 2) + Math.pow(gateway.y - b.y, 2));
      const rssi = Math.max(-90, -distance / 5);
      if (rssi > -25) {
        globalState.level2.foundBeacon = true;
        validateLevel2Completion();
      }
      return { beaconId: b.id, rssi };
    });
    socket.emit("gatewayData", beaconData);
    emitState();
  });

  socket.on("updatePrice", ({ labelId, newPrice }) => {
    const label = globalState.level2.einkLabels.find((l) => l.id === labelId);
    if (!label) return;
    label.text = `${newPrice} PLN`;
    label.updated = true;
    validateLevel2Completion();
    emitState();
  });

  socket.on("irProximity", ({ zone, distance }) => {
    globalState.level2.irData = { zone, distance };
    emitState();
    socket.emit("irConfirmed", { zone, distance });
  });

  // Level 2 – zapisanie kodu (opcjonalne, ale dodane dla kompletności)
  socket.on("level2Completed", ({ accessCode }) => {
    console.log(`[Level2] Completed with code: ${accessCode} by ${socket.id}`);
    // Można zapisać w globalState lub bazie danych
    globalState.level2.accessCode = accessCode;
    emitState();
  });

  // Level 3 – nowe eventy dla System Mapping
  socket.on("level3Completed", () => {
    console.log(`[Level3] Completed by ${socket.id}`);
    globalState.levelCompleted = true;
    globalState.currentLevel = 3; // Ustawiamy aktualny poziom na 3 (już jest, ale dla pewności)
    emitState();
    // Możemy wysłać specjalny event do wszystkich, że gra ukończona
    io.emit("gameCompleted", { message: "Gratulacje! System miejski został poprawnie skonfigurowany." });
  });

  // Uniwersalny event do oznaczania ukończenia poziomu (dla kompatybilności)
  socket.on("levelComplete", ({ level }) => {
    if (level === 3) {
      console.log(`[LevelComplete] Level ${level} finished by ${socket.id}`);
      globalState.levelCompleted = true;
      globalState.currentLevel = level;
      emitState();
      if (level === 3) {
        io.emit("gameCompleted", { message: "System miejski w pełni operacyjny!" });
      }
    }
  });

  // Poziom 3 – rozwiązywanie incydentów (stary system, zostawiamy)
  socket.on("resolveIncident", (incidentId) => {
    const incident = globalState.level3.incidents.find((i) => i.id === incidentId);
    if (!incident) return;
    incident.resolved = true;
    validateLevel3Completion();
    emitState();
  });

  // Admin – ręczne przejście do następnego poziomu (jeśli ukończono)
  socket.on("adminNextLevel", () => {
    if (!globalState.levelCompleted) return;
    if (globalState.currentLevel < 3) {
      globalState.currentLevel += 1;
      globalState.levelCompleted = false;
      emitState();
    } else if (globalState.currentLevel === 3 && globalState.levelCompleted) {
      // Gra ukończona – można np. zresetować lub nic nie robić
      console.log("Game already completed.");
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