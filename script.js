// ==================================================
// CONFIGURATION - Add/remove stations and lines
// ==================================================

const CONFIG = {
    // Define stations
    // Format: { code, line, id (TfL API), direction, displayName }
    stations: [
        {
            code: "wmb",
            line: "metropolitan",
            id: "940GZZLUWYP",
            direction: "outbound",
            displayName: "Wembley Park",
        },
        {
            code: "wyp",
            line: "jubilee",
            id: "940GZZLUWYP",
            direction: "outbound",
            displayName: "Wembley Park",
        },
        {
            code: "tot",
            line: "elizabeth",
            id: "910GTOTCTRD",
            direction: "inbound",
            displayName: "Tottenham Court Road",
        },
        {
            code: "can",
            line: "elizabeth",
            id: "910GCANWHRF",
            direction: "outbound",
            displayName: "Canary Wharf",
        },
        {
            code: "cyf",
            line: "jubilee",
            id: "940GZZLUCYF",
            direction: "inbound",
            displayName: "Canary Wharf",
        },
    ],

    // Define line colors
    lineColors: {
        // 'dlr': '#00AFAD',
        elizabeth: "#60399E",
        jubilee: "#838D93",
        metropolitan: "#9b0056",
    },

    // Refresh interval in milliseconds
    refreshInterval: 5000,
};

// ==================================================
// MAIN CODE
// ==================================================

class StopPoint {
    constructor(config) {
        this.code = config.code;
        this.line = config.line;
        this.id = config.id;
        this.direction = config.direction;
        this.displayName = config.displayName || null;
        this.url = `https://api.tfl.gov.uk/Line/${this.line}/Arrivals/${this.id}?direction=${this.direction}`;
    }
}

// Initialise stop points and get unique lines
const STOP_POINTS = CONFIG.stations.map((station) => new StopPoint(station));
const LINES = [...new Set(CONFIG.stations.map((s) => s.line))];

let disruptions = [];

// Utility functions
function getName(s) {
    return s.replace(/ Underground| Station| Rail| DLR/g, "");
}

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateLastUpdatedTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    document.getElementById("last-updated").textContent = `Updated at ${timeStr}`;
}

// Disruptions functions
function toggleDisruptions() {
    const content = document.getElementById("disruptions-content");
    const icon = document.getElementById("expand-icon");
    const text = document.getElementById("disruptions-hint");
    content.classList.toggle("expanded");
    icon.classList.toggle("expanded");
    text.classList.toggle("hidden");
}

async function fetchLineDisruptions() {
    try {
        const url = `https://api.tfl.gov.uk/Line/${LINES.join(",")}/Status`;
        const response = await fetch(url);
        const data = await response.json();

        disruptions = [];
        let hasDisruption = false;

        for (const line of data) {
            const lineStatus = line.lineStatuses[0];
            if (lineStatus.statusSeverityDescription !== "Good Service") {
                hasDisruption = true;
                disruptions.push({
                    line: line.id,
                    description:
                        lineStatus.reason || lineStatus.statusSeverityDescription,
                });
            }
        }

        const banner = document.getElementById("disruptions-banner");
        if (hasDisruption) {
            banner.classList.remove("hidden");
            renderDisruptions();
        } else {
            banner.classList.add("hidden");
        }
    } catch (error) {
        console.error("Error fetching disruptions:", error);
    }
}

function renderDisruptions() {
  const container = document.getElementById("disruptions-content");

  container.innerHTML = disruptions
    .map((item) => {
      const cleanedDescription = item.description.replace(
        /^[A-Za-z\s]+Line:\s*/i,
        ""
      );

      return `
        <div class="disruption-item">
          <div class="disruption-line">
            <span class="line-badge ${item.line}"></span>
            ${item.line.charAt(0).toUpperCase() + item.line.slice(1)} Line
          </div>
          <div class="disruption-text">${cleanedDescription}</div>
        </div>
      `;
    })
    .join("");
}

// Station rendering functions
async function createStationCard(stopPoint) {
    const container = document.getElementById("stations-container");

    const card = document.createElement("div");
    card.className = `station-card ${stopPoint.line}`;
    card.id = `station-${stopPoint.code}`;

    // Get station name
    let stationName = stopPoint.displayName;
    if (!stationName) {
        try {
            const response = await fetch(
                `https://api.tfl.gov.uk/StopPoint/${stopPoint.id}`,
            );
            const data = await response.json();
            stationName = getName(data.commonName);
        } catch (error) {
            stationName = stopPoint.code.toUpperCase();
        }
    }

    // Build card 
    card.innerHTML = `
    <div class="line-indicator ${stopPoint.line}"></div>
    <div class="station-header">
        <div class="station-icon ${stopPoint.line}">
            <svg class="roundel" viewBox="0 0 512 512" aria-hidden="true">
                <use href="#tfl-roundel"></use>
            </svg>
        </div>
        <div class="station-name">${stationName}</div>
    </div>
    <div class="station-body" id="body-${stopPoint.code}">
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading arrivals...</span>
        </div>
    </div>
  `;

    container.appendChild(card);
}

async function updateArrivals(stopPoint) {
    const bodyEl = document.getElementById(`body-${stopPoint.code}`);

    try {
        const response = await fetch(stopPoint.url);
        const data = await response.json();

        if (data.length === 0) {
            bodyEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚇</div>
          <div class="empty-text">No arrivals data</div>
        </div>
      `;
            return;
        }

        // Format and sort arrivals
        let arrivals = data
            .map((arrival) => ({
                dest: getName(arrival.destinationName),
                time: arrival.timeToStation,
            }))
            .sort((a, b) => a.time - b.time)
            .slice(0, 3);

        // Render arrivals
        bodyEl.innerHTML = `
      <div class="arrivals-list">
        ${arrivals
                .map((arrival) => {
                    const isUrgent = arrival.time < 60;
                    const timeText = isUrgent
                        ? `${arrival.time}s`
                        : `${Math.round(arrival.time / 60)} min`;

                    return `
            <div class="arrival-row">
              <div class="arrival-destination">${arrival.dest}</div>
              <div class="arrival-time ${isUrgent ? "urgent" : ""}">${timeText}</div>
            </div>
          `;
                })
                .join("")}
      </div>
    `;
    } catch (error) {
        console.error(`Error fetching arrivals for ${stopPoint.code}:`, error);
        bodyEl.innerHTML = `
      <div class="status-message">
        Unable to load arrivals. Retrying...
      </div>
    `;
    }
}

// Main execution
async function initialise() {
    // Create all station cards
    for (const stop of STOP_POINTS) {
        await createStationCard(stop);
    }

    // Initial data fetch
    await fetchLineDisruptions();
    for (const stop of STOP_POINTS) {
        await updateArrivals(stop);
    }
    updateLastUpdatedTime();

    // Set up refresh cycle
    setInterval(async () => {
        await fetchLineDisruptions();
        for (const stop of STOP_POINTS) {
            await updateArrivals(stop);
        }
        updateLastUpdatedTime();
    }, CONFIG.refreshInterval);
}

// Start on page load
window.addEventListener("DOMContentLoaded", initialise);
