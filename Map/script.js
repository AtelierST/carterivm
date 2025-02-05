const API_BASE_URL = "https://api-samenmeten.rivm.nl/v1.0";

// Initialize the Leaflet map
const map = L.map("map").setView([52.232, 5.996], 6); // Default center is set to some coordinates

// Add OpenStreetMap tile layer to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Fetch all sensor locations with pagination
async function fetchSensorLocations() {
    let sensors = [];
    let nextLink = `${API_BASE_URL}/Locations`;

    try {
        while (nextLink) {
            const response = await fetch(nextLink);
            if (!response.ok) throw new Error("Failed to fetch sensor locations");

            const data = await response.json();
            console.log("Fetched Locations:", data); // Debugging
            sensors = [...sensors, ...(data.value || [])];

            // Check if there is a next page
            nextLink = data["@iot.nextLink"];
        }

        return sensors;
    } catch (error) {
        console.error("Error fetching sensor locations:", error);
        return [];
    }
}

// Fetch the description from observed properties based on the datastream's name
async function fetchDescriptionFromObservedProperties(datastreamName) {
    let description = "Description not available";

    if (datastreamName.includes("temp")) {
        description = "temperatuur";
    } else if (datastreamName.includes("pres")) {
        description = "atmosferische druk";
    } else if (datastreamName.includes("rh")) {
        description = "relatieve vochtigheid";
    } else if (datastreamName.includes("nh3")) {
        description = "ammoniak";
    } else if (datastreamName.includes("no2")) {
        description = "stikstofdioxide";
    } else if (datastreamName.includes("pm25_kal")) {
        description = "fijnstof gekalibreerd < 2.5microm";
    } else if (datastreamName.includes("pm10_kal")) {
        description = "fijnstof gekalibreerd < 10microm";
    } else if (datastreamName.includes("pm25")) {
        description = "fijnstof < 2.5microm";
    } else if (datastreamName.includes("pm10")) {
        description = "fijnstof < 10microm";
    }

    return description;
}

// Fetch the latest measurement for a sensor's datastream
async function fetchLatestMeasurement(datastreamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Datastreams(${datastreamId})/Observations?$top=1&$orderby=phenomenonTime desc`);
        if (!response.ok) throw new Error("Failed to fetch observation");

        const data = await response.json();
        console.log("Fetched Observation:", data); // Debugging
        return data.value.length > 0 ? data.value[0].result : "No Data";
    } catch (error) {
        console.error("Error fetching observation:", error);
        return "Error";
    }
}

// Add a marker for each sensor to the map
async function addMarkersToMap() {
    const sensors = await fetchSensorLocations();

    if (sensors.length === 0) {
        alert("No sensors found.");
        return;
    }

    console.log("Adding markers to map..."); // Debugging

    // Loop through sensors and add a marker for each one
    for (const sensor of sensors) {
        console.log("Processing Sensor:", sensor);

        const { coordinates } = sensor.location || {};
        const latitude = coordinates && coordinates[1] ? coordinates[1] : 0;
        const longitude = coordinates && coordinates[0] ? coordinates[0] : 0;

        // Fetch associated thing
        const thingResponse = await fetch(sensor["Things@iot.navigationLink"]);
        const thingData = await thingResponse.json();
        const thing = thingData.value[0];

        if (!thing || !thing["Datastreams@iot.navigationLink"]) {
            console.warn("No datastreams for thing:", thing);
            continue;
        }

        // Fetch datastreams for the sensor
        const datastreamResponse = await fetch(thing["Datastreams@iot.navigationLink"]);
        const datastreamData = await datastreamResponse.json();

        for (const datastream of datastreamData.value) {
            const measurement = await fetchLatestMeasurement(datastream["@iot.id"]);
            const description = await fetchDescriptionFromObservedProperties(datastream.name);

            // Create a marker and add it to the map
            const marker = L.marker([latitude, longitude]).addTo(map);
            marker.bindPopup(`
                <strong>${thing.name || "Unknown Sensor"}</strong> (${datastream.name}): ${measurement} (${description})<br>
                <strong>Location:</strong> ${latitude}, ${longitude}
            `);
        }
    }
}

// Load sensor data and add markers to the map
addMarkersToMap();
