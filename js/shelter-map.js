// Map instance and markers array
let map;
let markers = [];

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing map...');
    initMap();
    initEventListeners();
});

function initMap() {
    try {
        console.log('Initializing map with token:', CONFIG.MAPBOX_TOKEN);
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
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

function initEventListeners() {
    try {
        console.log('Setting up event listeners');
        
        // Direct DOM element references
        const searchButton = document.getElementById('searchButton');
        const locationInput = document.getElementById('locationInput');

        console.log('Search elements found:', { 
            searchButton: !!searchButton, 
            locationInput: !!locationInput 
        });

        if (searchButton && locationInput) {
            // Add event listener for search button
            searchButton.addEventListener('click', function() {
                console.log('Search button clicked');
                searchLocation();
            });
            
            // Add event listener for Enter key in search input
            locationInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in search input');
                    searchLocation();
                }
            });
            
            console.log('Event listeners attached successfully');
        } else {
            console.error('Search elements not found');
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Search for location using Mapbox Geocoding API
function searchLocation() {
    try {
        console.log('searchLocation function called');
        const locationInput = document.getElementById('locationInput');
        if (!locationInput) {
            console.error('Location input not found');
            return;
        }

        const query = locationInput.value.trim();
        console.log('Search query:', query);
        
        if (!query) {
            alert('Please enter a location to search');
            return;
        }

        console.log('Searching for location:', query);
        
        // Use fetch with .then instead of async/await
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${CONFIG.MAPBOX_TOKEN}&country=US`)
            .then(response => {
                console.log('Geocoding API response received');
                return response.json();
            })
            .then(data => {
                console.log('Geocoding data:', data);
                
                if (data.features && data.features.length > 0) {
                    const [lng, lat] = data.features[0].center;
                    console.log('Found coordinates:', lng, lat);
                    
                    // Fly to location
                    map.flyTo({
                        center: [lng, lat],
                        zoom: 12,
                        essential: true
                    });
                    
                    // Search for shelters
                    searchNearbyShelters(lat, lng);
                } else {
                    alert('Location not found. Please try a different search.');
                }
            })
            .catch(error => {
                console.error('Error searching location:', error);
                alert('Error searching location. Please try again.');
            });
    } catch (error) {
        console.error('Error in searchLocation function:', error);
    }
}

// Search for nearby shelters using Mapbox Places API
function searchNearbyShelters(lat, lng) {
    console.log('Searching for shelters near:', lat, lng);
    
    // Use fetch with .then instead of async/await
    fetch(`https://api.mapbox.com/v4/mapbox.poi-places/tilequery/${lng},${lat}.json?radius=10000&limit=50&access_token=${CONFIG.MAPBOX_TOKEN}`)
        .then(response => {
            console.log('Shelter API response received');
            return response.json();
        })
        .then(data => {
            console.log('Shelter search response:', data);
            
            // Filter for animal shelters and veterinarians
            const shelters = data.features.filter(feature => 
                feature.properties.category_en?.toLowerCase().includes('animal') ||
                feature.properties.category_en?.toLowerCase().includes('pet') ||
                feature.properties.category_en?.toLowerCase().includes('veterinar')
            );
            
            console.log('Found shelters:', shelters);
            displayShelters(shelters);
        })
        .catch(error => {
            console.error('Error searching shelters:', error);
            alert('Error finding shelters. Please try again.');
        });
}

// Display shelters on map and in results list
function displayShelters(shelters) {
    try {
        console.log('Displaying shelters:', shelters.length);
        
        // Clear existing markers and results
        clearMarkers();
        const resultsList = document.getElementById('resultsList');
        if (!resultsList) {
            console.error('Results list element not found');
            return;
        }
        
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
                            <div class="mt-3">
                                <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
                                target="_blank" 
                                class="bg-orange-500 px-3 py-1 rounded text-sm hover:bg-orange-600 transition">
                                    Get Directions
                                </a>
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
                <div class="mt-3">
                    <button onclick="flyToMarker(${index})"
                            class="w-full bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                        View on Map
                    </button>
                </div>
            `;
            resultsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error displaying shelters:', error);
    }
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
}

// Make functions available globally for event handlers
function flyToMarker(index) {
    console.log('Flying to marker:', index);
    const marker = markers[index];
    if (marker) {
        map.flyTo({
            center: marker.getLngLat(),
            zoom: 15,
            essential: true
        });
        marker.togglePopup();
    }
}

// Make flyToMarker globally available
window.flyToMarker = flyToMarker;
