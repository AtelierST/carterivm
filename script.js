const API_BASE_URL = "https://api-samenmeten.rivm.nl/v1.0";
const sensorList = document.getElementById("sensor-list");

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

// Fetch latest measurement for a sensor's datastream
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

// Fetch unit of measurement for the datastream
async function fetchUnitOfMeasurement(datastreamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Datastreams(${datastreamId})`);
        if (!response.ok) throw new Error("Failed to fetch datastream");

        const data = await response.json();
        console.log("Fetched Datastream Data:", data); // Log full response to check the structure

        const unitOfMeasurement = data.value[0]?.unitOfMeasurement;
        if (unitOfMeasurement && unitOfMeasurement.symbol) {
            console.log("Unit of Measurement Symbol:", unitOfMeasurement.symbol); // Debug log for symbol
            return unitOfMeasurement.symbol; // Return the symbol if it exists
        } else {
            console.log("Unit of Measurement Symbol not found or is missing");
            return "Unit not available"; // Default if symbol is not available
        }
    } catch (error) {
        console.error("Error fetching unit of measurement:", error);
        return "Unit not available"; // Default in case of error
    }
}

// Fetch the datastreams for a specific thing
async function fetchDatastreamsForThing(thingLink) {
    const response = await fetch(thingLink);
    const data = await response.json();
    return data.value[0]?.["Datastreams@iot.navigationLink"];
}

// Load sensors and display the latest data for each datastream
async function loadSensorData() {
    sensorList.innerHTML = "Loading sensors...";
    const sensors = await fetchSensorLocations();
    if (sensors.length === 0) {
        sensorList.innerHTML = "<li>No sensors found.</li>";
        return;
    }

    sensorList.innerHTML = ""; // Clear loading message

    for (const sensor of sensors) {
        console.log("Processing Sensor:", sensor);

        // Extract latitude and longitude from the sensor location
        const { coordinates } = sensor.location || {};
        const latitude = coordinates && coordinates[1] ? coordinates[1] : "Latitude not available";
        const longitude = coordinates && coordinates[0] ? coordinates[0] : "Longitude not available";

        // Fetch associated thing
        const thingResponse = await fetch(sensor["Things@iot.navigationLink"]);
        const thingData = await thingResponse.json();
        console.log("Fetched Thing:", thingData);

        const thing = thingData.value[0];
        if (!thing || !thing["Datastreams@iot.navigationLink"]) {
            console.warn("No datastreams for thing:", thing);
            continue;
        }

        // Fetch datastreams for the sensor
        const datastreamResponse = await fetch(thing["Datastreams@iot.navigationLink"]);
        const datastreamData = await datastreamResponse.json();
        console.log("Fetched Datastreams:", datastreamData);

        for (const datastream of datastreamData.value) {
            const measurement = await fetchLatestMeasurement(datastream["@iot.id"]);
            const unitOfMeasurement = await fetchUnitOfMeasurement(datastream["@iot.id"]);

            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${thing.name || "Unknown Sensor"}</strong> (${datastream.name}): ${measurement} ${unitOfMeasurement}<br>
                <strong>Location:</strong> ${latitude}, ${longitude}
            `;
            sensorList.appendChild(listItem);
        }
    }
}

// Load sensor data when page loads
loadSensorData();
