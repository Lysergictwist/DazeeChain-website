// Map instances
let mapboxMap, leafletMap, olMap;
let currentProvider = 'mapbox';
let markers = [];

// Initialize all map providers
function initMaps() {
    initMapbox();
    initLeaflet();
    initOpenLayers();
    
    // Show default provider
    showMap('mapbox');
    
    // Add event listeners for map toggle buttons
    document.querySelectorAll('.map-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const provider = btn.dataset.provider;
            showMap(provider);
            
            // Update active state
            document.querySelectorAll('.map-toggle-btn').forEach(b => 
                b.classList.toggle('active', b === btn)
            );
        });
    });
}

// Mapbox Implementation
function initMapbox() {
    mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
    
    mapboxMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM
    });
    
    // Add navigation controls
    mapboxMap.addControl(new mapboxgl.NavigationControl());
}

// Leaflet Implementation
function initLeaflet() {
    leafletMap = L.map('map', {
        center: CONFIG.MAP_CENTER.reverse(),
        zoom: CONFIG.DEFAULT_ZOOM,
        style: 'mapbox://styles/mapbox/dark-v10'
    });
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
}

// OpenLayers Implementation
function initOpenLayers() {
    olMap = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(CONFIG.MAP_CENTER),
            zoom: CONFIG.DEFAULT_ZOOM
        })
    });
}

// Show selected map provider
function showMap(provider) {
    currentProvider = provider;
    const mapElement = document.getElementById('map');
    
    // Reset map container
    mapElement.innerHTML = '';
    
    switch(provider) {
        case 'mapbox':
            mapboxMap = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/dark-v10',
                center: CONFIG.MAP_CENTER,
                zoom: CONFIG.DEFAULT_ZOOM
            });
            break;
            
        case 'leaflet':
            leafletMap = L.map('map').setView(CONFIG.MAP_CENTER.reverse(), CONFIG.DEFAULT_ZOOM);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(leafletMap);
            break;
            
        case 'openlayers':
            olMap = new ol.Map({
                target: 'map',
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                ],
                view: new ol.View({
                    center: ol.proj.fromLonLat(CONFIG.MAP_CENTER),
                    zoom: CONFIG.DEFAULT_ZOOM
                })
            });
            break;
    }
}

// Search for location using Mapbox Geocoding API
async function searchLocation() {
    const query = document.getElementById('locationInput').value;
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX_TOKEN}`;
    
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            
            // Center map based on current provider
            switch(currentProvider) {
                case 'mapbox':
                    mapboxMap.flyTo({
                        center: [lng, lat],
                        zoom: 12
                    });
                    break;
                    
                case 'leaflet':
                    leafletMap.flyTo([lat, lng], 12);
                    break;
                    
                case 'openlayers':
                    olMap.getView().animate({
                        center: ol.proj.fromLonLat([lng, lat]),
                        zoom: 12
                    });
                    break;
            }
            
            // Search for nearby shelters
            searchNearbyShelters(lat, lng);
        }
    } catch (error) {
        console.error('Error searching location:', error);
    }
}

// Search for nearby shelters using Overpass API (OpenStreetMap data)
async function searchNearbyShelters(lat, lng) {
    const radius = 10000; // 10km radius
    const query = `
        [out:json][timeout:25];
        (
          node["animal"="shelter"](around:${radius},${lat},${lng});
          way["animal"="shelter"](around:${radius},${lat},${lng});
          relation["animal"="shelter"](around:${radius},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
    `;
    
    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });
        
        const data = await response.json();
        displayShelters(data.elements);
    } catch (error) {
        console.error('Error searching shelters:', error);
    }
}

// Display shelters on the map and in the results list
function displayShelters(shelters) {
    clearMarkers();
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    
    shelters.forEach(shelter => {
        // Add marker based on current provider
        addMarker(shelter);
        
        // Add to results list
        const card = document.createElement('div');
        card.className = 'shelter-card p-4 rounded-lg';
        card.innerHTML = `
            <h3 class="font-bold text-lg">${shelter.tags.name || 'Unnamed Shelter'}</h3>
            <p class="text-gray-400">${shelter.tags.address || 'No address available'}</p>
            <button onclick="focusMarker(${shelter.id})"
                    class="mt-3 w-full bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                View on Map
            </button>
        `;
        resultsList.appendChild(card);
    });
}

// Add marker to the map based on current provider
function addMarker(shelter) {
    const lat = shelter.lat;
    const lng = shelter.lon;
    
    switch(currentProvider) {
        case 'mapbox':
            const marker = new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .addTo(mapboxMap);
            markers.push(marker);
            break;
            
        case 'leaflet':
            const lMarker = L.marker([lat, lng]).addTo(leafletMap);
            markers.push(lMarker);
            break;
            
        case 'openlayers':
            const feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([lng, lat]))
            });
            
            const vectorSource = new ol.source.Vector({
                features: [feature]
            });
            
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource
            });
            
            olMap.addLayer(vectorLayer);
            markers.push(vectorLayer);
            break;
    }
}

// Clear all markers
function clearMarkers() {
    switch(currentProvider) {
        case 'mapbox':
            markers.forEach(marker => marker.remove());
            break;
            
        case 'leaflet':
            markers.forEach(marker => leafletMap.removeLayer(marker));
            break;
            
        case 'openlayers':
            markers.forEach(layer => olMap.removeLayer(layer));
            break;
    }
    markers = [];
}

// Focus on a specific marker
function focusMarker(shelterId) {
    const shelter = markers.find(m => m.id === shelterId);
    if (shelter) {
        switch(currentProvider) {
            case 'mapbox':
                mapboxMap.flyTo({
                    center: shelter.getLngLat(),
                    zoom: 15
                });
                break;
                
            case 'leaflet':
                leafletMap.flyTo(shelter.getLatLng(), 15);
                break;
                
            case 'openlayers':
                const extent = shelter.getSource().getExtent();
                olMap.getView().fit(extent, {
                    maxZoom: 15,
                    duration: 500
                });
                break;
        }
    }
}

// Initialize maps when the page loads
document.addEventListener('DOMContentLoaded', initMaps);
