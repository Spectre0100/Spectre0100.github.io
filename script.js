// ==================================================
// CONFIGURATION - Add/remove stations and lines
// ==================================================

const CONFIG = {
    // Define stations
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
        bakerloo: "#B26300",
        central: "#DC241F",
        circle: "#FFC80A",
        district: "#007D32",
        dlr: '#00AFAD',
        elizabeth: "#60399E",
        hammersmith_city: "#F589A6",
        jubilee: "#838D93",
        metropolitan: "#9b0056",
        northern: "#000000",
        piccadilly: "#0019A8",
        victoria: "#039BE5",
        waterloo_city: "#76D0BD"
    },

    // Refresh interval in milliseconds
    refreshInterval: 10000,
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
        this.arrivalsUrl = `https://api.tfl.gov.uk/line/${this.line}/arrivals/${this.id}?direction=${this.direction}`;
        this.timetableUrl = `https://api.tfl.gov.uk/line/${this.line}/timetable/${this.id}?direction=${this.direction}`;
    }
}

// Initialise stop points and get unique lines
const STOP_POINTS = CONFIG.stations.map((station) => new StopPoint(station));
const LINES = [...new Set(CONFIG.stations.map((s) => s.line))];

// Define order for the timetable days
const DAY_ORDER = {
    "Monday - Thursday": 1,
    "Friday": 2,
    "Saturday (also Good Friday)": 3,
    "Sunday": 4
};

// Initialise variables for timetable and disruption data
const timetableCache = new Map();
let disruptions = [];
let stopPointNameCache = {};

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

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

// Modal functions
async function openTimetableModal(stopCode) {
    const modal = document.getElementById('timetable-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');

    // Show modal with loading state
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modalBody.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading timetable...</span>
        </div>
    `;

    // Get stop point details
    const stopPoint = STOP_POINTS.find(s => s.code === stopCode);
    modalTitle.textContent = `${stopPoint.displayName} - ${toTitleCase(stopPoint.line)}`;

    // Load data (from cache or API)
    const data = await loadTimetableData(stopCode);

    // Render content
    if (data && data.routes && data.routes.length > 0) {
        renderTimetableContent(modalBody, data);
    } else {
        modalBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-text">No timetable data available</div>
            </div>
        `;
    }
}

function closeModal() {
    // Close on clicking outside modal
    document.addEventListener("click", (event) => {
        if (event.target.id !== `timetable-modal`) {
            return;
        }
    });

    const modal = document.getElementById('timetable-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function renderTimetableContent(container, data) {
    const routesHTML = data.routes.map(route => {
        const schedulesHTML = route.schedules
            .slice()
            .sort((a, b) => {
                return (DAY_ORDER[a.name] ?? 99) - (DAY_ORDER[b.name] ?? 99);
            })
            .map(schedule => `
                <tr>
                    <td class="schedule-day">${schedule.name}</td>
                    <td class="schedule-time">${schedule.firstService}</td>
                    <td class="schedule-time">${schedule.lastService}</td>
                    <td class="schedule-terminal">${schedule.terminalName || 'N/A'}</td>
                </tr>
            `)
            .join('');

        return `
            <div class="timetable-section">
                ${data.routes.length > 1 ? `<h4>To ${route.schedules[0]?.terminalName || 'Unknown'}</h4>` : ''}
                <table class="timetable-table">
                    <thead>
                        <tr>
                            <th>Days</th>
                            <th>First</th>
                            <th>Last</th>
                            <th>Destination</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedulesHTML}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');

    container.innerHTML = routesHTML;
}

// Create single modal on page load
function createTimetableModal() {
    const modal = document.createElement('div');
    modal.className = 'timetable-modal hidden';
    modal.id = 'timetable-modal';
    modal.onclick = (e) => {
        if (e.target.id === 'timetable-modal') {
            closeModal();
        }
    };
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3 id="modal-title">First/Last Trains</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function loadTimetableData(stopCode) {
    // Check cache first
    if (timetableCache.has(stopCode)) {
        return timetableCache.get(stopCode);
    }

    // Fetch and cache
    const stopPoint = STOP_POINTS.find(s => s.code === stopCode);
    const data = await fetchFirstLastServices(stopPoint);

    if (data) {
        timetableCache.set(stopCode, data);
    }

    return data;
}

// Disruptions functions
function toggleDisruptions() {
    const content = document.getElementById("disruptions-content");
    const icon = document.getElementById("expand-icon");
    const text = document.getElementById("disruptions-hint");
    const line_badges = document.getElementById("disruptions-title-badges");

    content.classList.toggle("expanded");
    icon.classList.toggle("expanded");
    text.classList.toggle("hidden");
    line_badges.classList.toggle("hidden");
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

// Fetch & cache all stopPoint names for a line
async function getStopPointNameMap(line) {
    // Return cached version if it exists
    if (stopPointNameCache[line]) {
        return stopPointNameCache[line];
    }

    try {
        const response = await fetch(
            `https://api.tfl.gov.uk/line/${line}/stoppoints`
        );
        const stations = await response.json();

        // Build id -> cleanName map
        const nameMap = {};

        for (const station of stations) {
            if (!station.id || !station.commonName) continue;

            nameMap[station.id] = station.commonName
                .replace(
                    / Underground Station| Rail Station| DLR Station| Station/g,
                    ''
                )
                .trim();
        }

        // Cache it
        stopPointNameCache[line] = nameMap;
        return nameMap;

    } catch (error) {
        console.error(
            `Error fetching StopPoints for line ${line}:`,
            error
        );
        return {};
    }
}

async function fetchFirstLastServices(stopPoint) {
    try {
        const response = await fetch(stopPoint.timetableUrl);
        const data = await response.json();

        // Get routes and stations
        const routes = data.timetable.routes;

        if (!routes || routes.length === 0) {
            console.log("No routes found");
            return null;
        }

        // Helper function to format journey times
        const formatTime = (journey) => {
            let hour = parseInt(journey.hour);
            const minute = journey.minute.padStart(2, '0');

            // Handle times after midnight (hour >= 24)
            if (hour >= 24) {
                hour = hour - 24;
            }

            return `${hour.toString().padStart(2, '0')}:${minute}`;
        };

        // Process each route
        const routesData = await Promise.all(
            routes.map(async (route, routeIndex) => {
                // Get terminal stations for this route
                const stopPointNameMap = await getStopPointNameMap(stopPoint.line);
                const terminals = await Promise.all(
                    route.stationIntervals.map(async stationInterval => {
                        const intervals = stationInterval.intervals;
                        const terminalStopId = intervals[intervals.length - 1].stopId;

                        return {
                            routeId: stationInterval.id,
                            terminalStopId,
                            terminalName: stopPointNameMap[terminalStopId] || terminalStopId
                        };
                    })
                );

                // Process each schedule for this route
                const schedulesData = route.schedules.map(schedule => {
                    // Get the first journey's intervalId to match with terminal
                    const firstJourneyIntervalId = schedule.firstJourney.intervalId || "0";
                    const terminal = terminals.find(t => t.routeId === firstJourneyIntervalId);

                    return {
                        name: schedule.name,
                        firstService: formatTime(schedule.firstJourney),
                        lastService: formatTime(schedule.lastJourney),
                        terminalStopId: terminal ? terminal.terminalStopId : null,
                        terminalName: terminal ? terminal.terminalName : null
                    };
                });

                return {
                    routeIndex: routeIndex,
                    schedules: schedulesData
                };
            })
        );

        console.log({
            station: stopPoint.displayName,
            line: stopPoint.line,
            direction: stopPoint.direction,
            routes: routesData
        });

        return {
            station: stopPoint.displayName,
            line: stopPoint.line,
            direction: stopPoint.direction,
            routes: routesData
        };

    } catch (error) {
        console.error(`Error fetching first/last services for ${stopPoint.displayName}:`, error);
        return null;
    }
}

function renderDisruptions() {
    const container = document.getElementById("disruptions-content");
    const linesContainer = document.querySelector('.disruptions-title-badges');

    // Line badges
    linesContainer.innerHTML = disruptions
        .map(item => `<span class="line-badge ${item.line}"></span>`)
        .join('');

    // Disruption details
    container.innerHTML = disruptions
        .map((item) => {
            const cleanedDescription = item.description.replace(
                /^[A-Za-z\s]+Line:\s*/i,
                ""
            );

            return `
        <div class="disruption-item">
          <div class="disruption-detail">
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
            <button class="timetable-button" id="timetable-btn-${stopPoint.code}" style="display: none;" onclick="openTimetableModal('${stopPoint.code}')">
                First/Last Trains
            </button>
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
    const body_code = document.getElementById(`body-${stopPoint.code}`);

    try {
        const response = await fetch(stopPoint.arrivalsUrl);
        const data = await response.json();

        if (data.length === 0) {
            body_code.innerHTML = `
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
        body_code.innerHTML = `
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
                        </div>`;
                }).join("")
            }
        </div>`;
    } catch (error) {
        console.error(`Error fetching arrivals for ${stopPoint.code}:`, error);
        body_code.innerHTML = `
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

    // Create modal for first/last train times
    createTimetableModal();

    // Fetch timetable data and show buttons
    for (const stop of STOP_POINTS) {
        if (stop.timetableUrl) {
            const data = await loadTimetableData(stop.code);
            if (data && data.routes && data.routes.length > 0) {
                // Show the timetable button
                const button = document.getElementById(`timetable-btn-${stop.code}`);
                if (button) {
                    button.style.display = 'block';
                }
            }
        }
    }

    // Initial data fetch
    await fetchLineDisruptions();
    for (const stop of STOP_POINTS) {
        await updateArrivals(stop);
    }
    updateLastUpdatedTime();

    // Set up refresh cycle for arrivals and disruptions data only
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
