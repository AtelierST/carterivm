const API_BASE_URL = "https://api-samenmeten.rivm.nl/v1.0";
const sensorList = document.getElementById("sensor-list");
const loadButton = document.createElement("button");
loadButton.textContent = "Most Recent Measurements";
loadButton.addEventListener("click", loadSensorData);
document.body.insertBefore(loadButton, sensorList);

async function fetchSensorLocations() {
    let sensors = [];
    let nextLink = `${API_BASE_URL}/Locations`;
    try {
        while (nextLink) {
            const response = await fetch(nextLink);
            if (!response.ok) throw new Error("Failed to fetch sensor locations");
            const data = await response.json();
            sensors = [...sensors, ...(data.value || [])];
            nextLink = data["@iot.nextLink"];
        }
        return sensors;
    } catch (error) {
        console.error("Error fetching sensor locations:", error);
        return [];
    }
}

async function fetchLatestMeasurement(datastreamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Datastreams(${datastreamId})/Observations?$top=1&$orderby=phenomenonTime desc`);
        if (!response.ok) throw new Error("Failed to fetch observation");
        const data = await response.json();
        if (data.value.length > 0) {
            const observation = data.value[0];
            return {
                result: observation.result,
                time: new Date(observation.phenomenonTime).toLocaleString("nl-NL")
            };
        }
        return { result: "No Data", time: "No Date" };
    } catch (error) {
        console.error("Error fetching observation:", error);
        return { result: "Error", time: "No Date" };
    }
}

async function fetchDescriptionFromObservedProperties(datastreamName) {
    const descriptions = {
        temp: "temperatuur",
        pres: "atmosferische druk",
        rh: "relatieve vochtigheid",
        nh3: "ammoniak",
        no2: "stikstofdioxide",
        pm25_kal: "fijnstof gekalibreerd < 2.5microm",
        pm10_kal: "fijnstof gekalibreerd < 10microm",
        pm25: "fijnstof < 2.5microm",
        pm10: "fijnstof < 10microm"
    };
    for (const key in descriptions) {
        if (datastreamName.includes(key)) return descriptions[key];
    }
    return "Description not available";
}

async function loadSensorData() {
    sensorList.innerHTML = "Loading sensors...";
    const sensors = await fetchSensorLocations();
    if (sensors.length === 0) {
        sensorList.innerHTML = "<li>No sensors found.</li>";
        return;
    }
    sensorList.innerHTML = "";
    for (const sensor of sensors) {
        const { coordinates } = sensor.location || {};
        const latitude = coordinates?.[1] ?? "Latitude not available";
        const longitude = coordinates?.[0] ?? "Longitude not available";
        const thingResponse = await fetch(sensor["Things@iot.navigationLink"]);
        const thingData = await thingResponse.json();
        const thing = thingData.value[0];
        if (!thing || !thing["Datastreams@iot.navigationLink"]) continue;
        const datastreamResponse = await fetch(thing["Datastreams@iot.navigationLink"]);
        const datastreamData = await datastreamResponse.json();
        for (const datastream of datastreamData.value) {
            const { result, time } = await fetchLatestMeasurement(datastream["@iot.id"]);
            const description = await fetchDescriptionFromObservedProperties(datastream.name);
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${thing.name || "Unknown Sensor"}</strong> (${datastream.name}): ${result} (${description})<br>
                <strong>Datum:</strong> ${time}<br>
                <strong>Locatie:</strong> ${latitude}, ${longitude}
            `;
            sensorList.appendChild(listItem);
        }
    }
}
