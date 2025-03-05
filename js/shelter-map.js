// Map instance and markers array
let map;
let markers = [];

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initEventListeners();
});

function initMap() {
    mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
    
    // Initialize map
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());
}

function initEventListeners() {
    // Add event listener for search button
    document.getElementById('searchButton').addEventListener('click', searchLocation);
    
    // Add event listener for Enter key in search input
    document.getElementById('locationInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
}

// Search for location using Mapbox Geocoding API
async function searchLocation() {
    const query = document.getElementById('locationInput').value;
    if (!query) return;

    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX_TOKEN}&country=US`
        );
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            
            // Fly to location
            map.flyTo({
                center: [lng, lat],
                zoom: 12,
                essential: true
            });
            
            // Search for shelters
            searchNearbyShelters(lat, lng);
        }
    } catch (error) {
        console.error('Error searching location:', error);
        alert('Error searching location. Please try again.');
    }
}

// Search for nearby shelters using Mapbox Places API
async function searchNearbyShelters(lat, lng) {
    try {
        // Use Mapbox Tilequery API to find animal shelters
        const response = await fetch(
            `https://api.mapbox.com/v4/mapbox.poi-places/tilequery/${lng},${lat}.json?radius=10000&limit=50&access_token=${CONFIG.MAPBOX_TOKEN}`
        );
        
        const data = await response.json();
        
        // Filter for animal shelters and veterinarians
        const shelters = data.features.filter(feature => 
            feature.properties.category_en?.toLowerCase().includes('animal') ||
            feature.properties.category_en?.toLowerCase().includes('pet') ||
            feature.properties.category_en?.toLowerCase().includes('veterinar')
        );
        
        displayShelters(shelters);
    } catch (error) {
        console.error('Error searching shelters:', error);
        alert('Error finding shelters. Please try again.');
    }
}

// Display shelters on map and in results list
function displayShelters(shelters) {
    // Clear existing markers and results
    clearMarkers();
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    
    if (shelters.length === 0) {
        resultsList.innerHTML = `
            <div class="p-4 bg-gray-800 rounded-lg">
                <p class="text-gray-300">No animal shelters found in this area.</p>
                <p class="text-gray-400 text-sm mt-2">Try searching a different location or expanding your search radius.</p>
            </div>
        `;
        return;
    }

    shelters.forEach((shelter, index) => {
        const [lng, lat] = shelter.geometry.coordinates;
        const name = shelter.properties.name || 'Unnamed Shelter';
        const address = shelter.properties.address || 'Address not available';
        
        // Create marker
        const markerEl = document.createElement('div');
        markerEl.className = 'marker';
        markerEl.innerHTML = `<i class="fas fa-paw text-orange-500 text-2xl"></i>`;
        
        // Add marker to map
        const marker = new mapboxgl.Marker(markerEl)
            .setLngLat([lng, lat])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
                        <h3 class="font-bold text-lg mb-2">${name}</h3>
                        <p class="text-gray-300">${address}</p>
                        <div class="mt-3 flex gap-2">
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
                               target="_blank" 
                               class="bg-orange-500 px-3 py-1 rounded text-sm hover:bg-orange-600 transition">
                                Get Directions
                            </a>
                            <button onclick="window.saveFavorite('${name}', ${lat}, ${lng})"
                                    class="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600 transition">
                                Save
                            </button>
                        </div>
                    `)
            )
            .addTo(map);
        
        markers.push(marker);
        
        // Add to results list
        const card = document.createElement('div');
        card.className = 'shelter-card p-4 rounded-lg';
        card.innerHTML = `
            <h3 class="font-bold text-lg">${name}</h3>
            <p class="text-gray-400">${address}</p>
            <div class="mt-3 flex gap-2">
                <button onclick="window.flyToMarker(${index})"
                        class="flex-1 bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                    View on Map
                </button>
                <button onclick="window.saveFavorite('${name}', ${lat}, ${lng})"
                        class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        `;
        resultsList.appendChild(card);
    });
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
}

// Make functions available globally for event handlers
window.flyToMarker = function(index) {
    const marker = markers[index];
    if (marker) {
        map.flyTo({
            center: marker.getLngLat(),
            zoom: 15,
            essential: true
        });
        marker.togglePopup();
    }
};

// Save shelter to favorites (can be expanded later)
window.saveFavorite = function(name, lat, lng) {
    // For now, just store in localStorage
    const favorites = JSON.parse(localStorage.getItem('shelterFavorites') || '[]');
    favorites.push({ name, lat, lng });
    localStorage.setItem('shelterFavorites', JSON.stringify(favorites));
    
    alert(`${name} has been saved to your favorites!`);
};
