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

// Fetch the description from observed properties based on the datastream's name
async function fetchDescriptionFromObservedProperties(datastreamName) {
    let description = "Description not available";

    // Match the name field and assign the corresponding description
    if (datastreamName.includes("temp")) {
        description = "temperatuur"; // Match for temperature
    } else if (datastreamName.includes("pres")) {
        description = "atmosferische druk"; // Match for atmospheric pressure
    } else if (datastreamName.includes("rh")) {
        description = "relatieve vochtigheid"; // Match for relative humidity
    } else if (datastreamName.includes("nh3")) {
        description = "ammoniak"; // Match for ammonia
    } else if (datastreamName.includes("no2")) {
        description = "stikstofdioxide"; // Match for nitrogen dioxide
    } else if (datastreamName.includes("pm25_kal")) {
        description = "fijnstof gekalibreerd < 2.5microm"; // Match for calibrated fine dust < 2.5 microns
    } else if (datastreamName.includes("pm10_kal")) {
        description = "fijnstof gekalibreerd < 10microm"; // Match for calibrated fine dust < 10 microns
    } else if (datastreamName.includes("pm25")) {
        description = "fijnstof < 2.5microm"; // Match for fine dust < 2.5 microns
    } else if (datastreamName.includes("pm10")) {
        description = "fijnstof < 10microm"; // Match for fine dust < 10 microns
    }

    return description;
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
            const description = await fetchDescriptionFromObservedProperties(datastream.name); // Fetch description based on the name field

            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${thing.name || "Unknown Sensor"}</strong> (${datastream.name}): ${measurement} (${description})<br>
                <strong>Location:</strong> ${latitude}, ${longitude}
            `;
            sensorList.appendChild(listItem);
        }
    }
}

// Load sensor data when page loads
loadSensorData();
