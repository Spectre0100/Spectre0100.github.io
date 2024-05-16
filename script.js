// URLs for TFL API calls
const url_bla = 'https://api.tfl.gov.uk/Line/dlr/Arrivals/940GZZDLBLA?direction=inbound';
const url_can = 'https://api.tfl.gov.uk/Line/elizabeth/Arrivals/910GCANWHRF?direction=outbound';
const url_bst = 'https://api.tfl.gov.uk/Line/elizabeth/Arrivals/910GBONDST?direction=inbound';
const url_cyf = 'https://api.tfl.gov.uk/Line/jubilee/Arrivals/940GZZLUCYF?direction=inbound';


// Simplifies station names
getName = function(s) {
  return s.replace(/ Underground| Station| Rail| DLR/g, '')
}

// Set timer between fetch requests
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get and write the arrivals data
async function getArrivalsTable(stationUrl, stationCode) {
  try {
    // Show loading while fetching data
    loading = document.getElementById(`${stationCode}loading`);
    loading.style.display = "block";

    // Fetch data
    const response = await fetch(stationUrl);
    const data = await response.json();

    // Hide loading message when data is fetched
    loading.style.display = "none";

    // Retrieved no data, e.g. service is closed 
    if (data.length == 0) {
      document.getElementById(`${stationCode}Status`).innerHTML = "No data.";
      return;
    }

    // Format arrivals data
    let arrivals = [];
    for (const arrival of data) {
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
    const tableBody = document.getElementById(stationCode);
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
      document.getElementById(`${stationCode}Status`).innerHTML = "Failed to fetch.";
      return;
    }

    throw new Error("Error fetching arrivals data.");
  }

  // Fetch new data every 5 seconds
  await timeout(5000);
  getArrivalsTable(stationUrl, stationCode);
}

// Call function to populate arrivals tables
getArrivalsTable(url_bla, 'BLA');
getArrivalsTable(url_can, 'CAN');
getArrivalsTable(url_bst, 'BST');
getArrivalsTable(url_cyf, 'CYF');
