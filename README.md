# Rapport: Implementatie van Sensor Data Weergave

## 1. Inleiding
Dit rapport beschrijft de implementatie en werking van het JavaScript-script dat sensorgegevens ophaalt en weergeeft vanuit de SamenMeten API van RIVM. Het script haalt sensorlocaties op, verkrijgt de bijbehorende metingen en toont de relevante informatie, inclusief meetwaarde, datum en locatie.

## 2. Doel van het Script
Het doel van dit script is om actuele sensorinformatie overzichtelijk weer te geven in een HTML-lijst. Specifiek worden de volgende taken uitgevoerd:
- Ophalen van alle beschikbare sensorlocaties.
- Ophalen van de bijbehorende datastromen (datastreams) per sensor.
- Ophalen van de meest recente meting per datastream.
- Weergeven van de sensorgegevens in een gestructureerde lijst.

## 3. Technische Implementatie

### 3.1 Ophalen van Sensorlocaties
De functie `fetchSensorLocations()` maakt gebruik van de SamenMeten API en doorloopt paginagewijs alle locaties. Dit gebeurt met een `while`-loop die de `@iot.nextLink` controleert voor vervolgpagina’s.

### 3.2 Ophalen van de Meest Recente Meting
De functie `fetchLatestMeasurement(datastreamId)` haalt de meest recente observatie op voor een specifieke datastream. De metingen worden gesorteerd op `phenomenonTime desc`, zodat de nieuwste meting als eerste verschijnt. De datum wordt geformatteerd naar de Nederlandse notatie met `toLocaleString("nl-NL")`.

### 3.3 Bepalen van de Geobserveerde Eigenschap
De functie `fetchDescriptionFromObservedProperties(datastreamName)` koppelt een beschrijving aan een meetwaarde op basis van de naam van de datastream. Dit helpt bij het beter begrijpen van de weergegeven gegevens.

### 3.4 Verwerken en Weergeven van Sensor Data
De functie `loadSensorData()` doorloopt de opgehaalde sensoren en haalt de relevante gegevens op:
1. Het ophalen van locatiegegevens (coördinaten).
2. Het ophalen van de gekoppelde `Thing` van de sensor.
3. Het ophalen van de datastreams voor de `Thing`.
4. Het ophalen van de meest recente meting en bijbehorende datum.
5. Het dynamisch toevoegen van de gegevens aan de lijst in de HTML.

## 4. Verbeteringen en Optimalisaties
Tijdens de ontwikkeling zijn verschillende verbeteringen aangebracht:
- **Datumweergave toegevoegd:** De meest recente observatie toont nu ook de datum en tijd van de meting.
- **Robuustere foutafhandeling:** Extra `try-catch` blokken zorgen ervoor dat fouten correct worden afgehandeld en gelogd.
- **Efficiëntere API-aanroepen:** De API wordt zo efficiënt mogelijk bevraagd door paginatie te hanteren en dubbele verzoeken te vermijden.

## 5. Conclusie
Dit script biedt een gestructureerde en overzichtelijke manier om sensorgegevens van de SamenMeten API weer te geven. De toevoeging van datumweergave en optimalisaties maken het robuuster en gebruiksvriendelijker. Mogelijke uitbreidingen omvatten visualisaties (bijv. een kaartweergave) en het implementeren van filters voor een nog betere gebruikerservaring.

