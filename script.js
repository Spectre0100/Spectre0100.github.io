// StopPoint Objects for each station
class StopPoint {
    constructor(code, line, id, direction) {
        this.code = code; // 3 letter code of stop
        this.line = line; // Tube line, Elizabeth or DLR
        this.id = id; // TfL StopPoint ID
        this.direction = direction; // "inbound" or "outbound" 
        this.url = `https://api.tfl.gov.uk/Line/${this.line}/Arrivals/${this.id}?direction=${this.direction}`; // URL for arrival times API
    }
}

// Add new stations and lines here /////////////////////////
const BLA = new StopPoint("bla", "dlr", "940GZZDLBLA", "inbound");
const CAN = new StopPoint("can", "elizabeth", "910GCANWHRF", "outbound");
const BST = new StopPoint("bst", "elizabeth", "910GBONDST", "inbound");
const TOT = new StopPoint("tot", "elizabeth", "910GTOTCTRD", "inbound");
const CYF = new StopPoint("cyf", "jubilee", "940GZZLUCYF", "inbound");

const STOP_POINTS = [BLA, CAN, BST, TOT, CYF];
const LINES = ["elizabeth", "dlr", "jubilee"];
//////////////////////////////////////////////////

// Create disruption description paragraphs
var DISRUPTIONS = LINES.map(line => {
    return {
        line: line,
        description: "empty"
    };
})

// Global flag for any disruption on any line, used to show/hide disruption container
var DISRUPTION_FLAG = false;

// Need to wait for tables to be created first before populating them
async function main() {
    for (stop of STOP_POINTS) {
        await createArrivalsTable(stop);
        getArrivalsTable(stop);
    }
}

//// RUN ON WINDOW LOAD
window.onload = () => {
    // Call function to create and get disruptions
    createLineDisruptions();

    // Call function to get arrivals tables for each stop
    main();
};

//// UTILITY FUNCTONS

// Simplifies station names
getName = function(s) {
    return s.replace(/ Underground| Station| Rail| DLR/g, '')
}

// Set timer between fetch requests
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//// DISRUPTION FUNCTONS

// Create HTML disruption paragraphs
async function createLineDisruptions() {
    // Wait to get data first before setting the text
    await getLineDisruptions(LINES);

    const container = document.getElementById('disruptions-container');

    // Only need to run if there is a disruption!
    if (DISRUPTION_FLAG == false) {
        container.style.display = "none";
        return;
    }

    // Now we have at least one disruption, so show the container
    DISRUPTIONS.forEach(item => {
        // Create the title div
        const titleDiv = document.createElement('div');
        titleDiv.className = `disruption-title`;
        titleDiv.id = `${item.line}-disruption-title`;
        // Add line-coloured dot
        const dot = document.createElement('span');
        dot.classList = `dot ${item.line}`;
        titleDiv.appendChild(dot);

        // Append the line name text node separately
        const lineText = document.createTextNode(item.line.toUpperCase());
        titleDiv.appendChild(lineText);

        titleDiv.onclick = () => toggleParagraph(`${item.line}-disruption-desc`);
        // Create the content div
        const descDiv = document.createElement('p');
        descDiv.classList = 'disruption-desc status';
        descDiv.id = `${item.line}-disruption-desc`;
        descDiv.textContent = item.description;

        // Append to the container and hide text
        container.appendChild(titleDiv);
        container.appendChild(descDiv);
        document.getElementById(`${item.line}-disruption-desc`).style.display = "none";

        // Display disruptions only if there is one
        if (item.description == "empty") {
            document.getElementById(`${item.line}-disruption-title`).style.display = "none";
        }
    });
}

// Get and write line disruption data
async function getLineDisruptions(lines) {
    let disruption_url = `https://api.tfl.gov.uk/Line/${lines}/Status`;
    const disruption_response = await fetch(disruption_url);
    const disruption_data = await disruption_response.json();

    // Keep track if any disruption
    for (const line of disruption_data) {
        lineStatus = line.lineStatuses[0];
        // If we have a disruption, display this
        if (lineStatus.statusSeverityDescription != "Good Service") {
            // Set flag since we have a disruption
            DISRUPTION_FLAG = true;
            console.log(line.name, lineStatus.reason);
            DISRUPTIONS.find(item => item.line == line.id).description = lineStatus.reason;
        }
    }
}

// Toggle visibility of description on click
function toggleParagraph(id) {
    const content = document.getElementById(id);
    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
    } else {
        content.style.display = "none";
    }
}

//// FUNCTIONS FOR CREATING HTML ELEMENTS

// Create HTML arrivals tables
async function createArrivalsTable(stopPoint) {
    // Check if the elements already exist
    if (!document.getElementById(`${stopPoint.code} - title`)) {
        // Fetch and set station name for table title
        const main = document.getElementsByTagName('main')[0];

        const title = document.createElement('p');
        title.classList.add(`${stopPoint.line}`, 'header'); // Add table header classes
        title.id = `${stopPoint.code} - title`; // Add table header id
        const stopName_response = await fetch(`https://api.tfl.gov.uk/StopPoint/${stopPoint.id}`);
        const stopName = await stopName_response.json();
        title.textContent = getName(stopName.commonName);
        main.appendChild(title);

        // Create loading div and add classes + id
        const loading = document.createElement('div');
        loading.classList.add('loading');
        loading.id = `${stopPoint.code}-loading`;
        main.appendChild(loading);

        // Create station status paragraph (e.g. "no data", failure)
        const status = document.createElement('p');
        status.classList.add('status');
        status.id = `${stopPoint.code}-status`;
        main.appendChild(status);

        // Create table for arrival entries
        const table = document.createElement('table');
        table.classList.add('fixed');
        const tableHead = document.createElement('thead');
        const tableBody = document.createElement('tbody');
        tableBody.id = `${stopPoint.code}-table`;
        table.appendChild(tableHead);
        table.appendChild(tableBody);
        main.appendChild(table);
    }
}

// Get and write the arrivals data
async function getArrivalsTable(stopPoint) {
    try {
        // Show loading while fetching data
        loading = document.getElementById(`${stopPoint.code}-loading`);
        loading.style.display = "block";

        // Fetch data
        const arrivals_response = await fetch(stopPoint.url);
        const arrivals_data = await arrivals_response.json();

        // Hide loading message when data is fetched
        loading.style.display = "none";

        // Retrieved no data, e.g. service is closed 
        if (arrivals_data.length == 0) {
            document.getElementById(`${stopPoint.code}-status`).innerHTML = "No data.";
            return;
        }

        // Format arrivals data
        let arrivals = [];
        for (const arrival of arrivals_data) {
            seconds = arrival.timeToStation;
            // Add flag to indicate seconds or minutes
            if (seconds < 60) {
                arrivals.push({
                    'dest': getName(arrival.destinationName),
                    'time': seconds,
                    'secFlag': true
                });
            } else {
                arrivals.push({
                    'dest': getName(arrival.destinationName),
                    'time': seconds,
                    'secFlag': false
                });
            }
        }
        // Sort arrivals closest first and display next 3 max
        arrivals.sort((a, b) => a.time - b.time);
        arrivals = arrivals.slice(0, 3);
        // console.log(arrivals);

        // Clear table to update with new data
        const tableBody = document.getElementById(`${stopPoint.code}-table`);
        tableBody.innerHTML = "";

        // Write to table
        for (const arrival of arrivals) {
            const row = document.createElement('tr');
            const destinationCell = document.createElement('td');
            destinationCell.textContent = arrival.dest;
            const timeToArrivalCell = document.createElement('td');
            // If less than 60 seconds display seconds, else minutes 
            timeToArrivalCell.textContent = arrival.secFlag ? arrival.time + " sec" : Math.round(arrival.time / 60) + " min";
            row.appendChild(destinationCell);
            row.appendChild(timeToArrivalCell);
            tableBody.appendChild(row);
        }

    } catch (error) {
        // Error fetching data
        console.log(error);

        // DLR stations may encounter TypeErrors when fetching
        if (error instanceof TypeError) {
            document.getElementById(`${stopPoint.code}-status`).innerHTML = "Failed to fetch.";
            return;
        }

        throw new Error("Error fetching arrivals data.");
    }

    // Fetch new data every 5 seconds
    await timeout(5000);
    getArrivalsTable(stopPoint);
}
