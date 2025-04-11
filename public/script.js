document.addEventListener('DOMContentLoaded', initializeApp);

// Global variable for app data - accessible across functions
let appData = {};

async function initializeApp() {
  console.log('initializeApp: Application initialization started.');

  // Select DOM elements
  const elements = selectDOMelements();
  if (!elements) {
    console.error('initializeApp: Failed to select all required DOM elements.');
    displayError(null, 'Failed to initialize application.');
    return;
  }

  // Initialize app data structure
  appData = initializeAppData();

  try {
    // Load data from API
    await loadInitialData(appData);
    
    // Set up the initial UI
    renderInitialUI(elements, appData);
    
    // Set up interactive elements
    setupEventListeners(elements, appData);

    console.log('initializeApp: Application initialized successfully.');
  } catch (error) {
    console.error('initializeApp: Error during initialization:', error);
    displayError(elements.kTrucksGrid, 'Failed to load initial data.');
  }
}

/**
 * Select all required DOM elements
 * @returns {Object|null} Object with DOM elements or null if any elements missing
 */
function selectDOMelements() {
  try {
    const containers = document.querySelectorAll('.section-container');
    const sidebar = document.querySelector('.sidebar-container');
    const sidebarDetails = document.querySelector('.sidebar-details');
    const submenuDetails = Array.from(document.querySelectorAll('.submenu-details'));
    const body = document.body;
    const kTrucksGrid = document.getElementById('ktrucks-grid');
    const kTruckModal = document.getElementById('ktruck-modal');

    if (!containers.length || !sidebar || !sidebarDetails || !submenuDetails.length || !body) {
      console.warn('selectDOMelements: Basic elements not found.');
      return null;
    }

    return {
      containers,
      sidebar,
      sidebarDetails,
      submenuDetails,
      body,
      kTrucksGrid: kTrucksGrid || null,
      kTruckModal: kTruckModal || null,
    };
  } catch (error) {
    console.error('selectDOMelements: Error selecting elements:', error);
    return null;
  }
}

/**
 * Initialize application data structure
 * @returns {Object} Initial data structure
 */
function initializeAppData() {
  return {
    kTruckImages: [],
    kTruckDescriptions: [],
    externalLink: 'https://skiptskool.onrender.com/',
    externalSvg: './assets/SKPTSKL-T1.svg',
  };
}

/**
 * Load initial data from API endpoints
 * @param {Object} appData Data object to populate
 * @returns {Promise} Resolves when all data is loaded
 */
async function loadInitialData(appData) {
  try {
    console.log('loadInitialData: Starting to load data from API');
    
    // Load data in parallel for better performance
    const [kTruckImages, kTruckDescriptions, linksData] = await Promise.all([
      fetchData('/api/data/ktruckimage.json'),
      fetchData('/api/data/ktruckdescription.json'),
      fetchData('/api/data/links.json')
    ]);

    console.log('Data loaded from API:');
    console.log('- K Truck Images:', kTruckImages?.length || 0, 'items');
    console.log('- K Truck Descriptions:', kTruckDescriptions?.length || 0, 'items');
    
    // Fix image paths if needed
    const fixedImages = fixImagePaths(kTruckImages || []);
    
    // Populate app data
    appData.kTruckImages = fixedImages;
    appData.kTruckDescriptions = kTruckDescriptions || [];
    
    // Only update if data exists
    if (linksData && linksData.skiptSkool) {
      appData.externalLink = linksData.skiptSkool;
    }
    if (linksData && linksData.svgImage) {
      appData.externalSvg = linksData.svgImage;
    }
  } catch (error) {
    console.error('loadInitialData: Error:', error);
    throw error;
  }
}

/**
 * Fix image paths in truck data
 * @param {Array} trucks Truck data
 * @returns {Array} Trucks with fixed image paths
 */
function fixImagePaths(trucks) {
  return trucks.map(truck => {
    // Make a copy of the truck object
    const fixedTruck = {...truck};
    
    // Fix paths by ensuring they start with /assets/ or assets/
    if (fixedTruck.imageUrl && !fixedTruck.imageUrl.includes('assets')) {
      fixedTruck.imageUrl = `/assets/${fixedTruck.imageUrl.split('/').pop()}`;
    }
    
    if (fixedTruck.thumbnailUrl && !fixedTruck.thumbnailUrl.includes('assets')) {
      fixedTruck.thumbnailUrl = `/assets/${fixedTruck.thumbnailUrl.split('/').pop()}`;
    }
    
    return fixedTruck;
  });
}

/**
 * Render initial UI components
 * @param {Object} elements DOM elements
 * @param {Object} appData Application data
 */
function renderInitialUI(elements, appData) {
  console.log('renderInitialUI: Starting to render UI');
  
  const initialSections = {
    section1: { title: 'K Trucks', content: 'Browse our selection of compact Japanese Kei trucks, perfect for urban deliveries and small businesses. Features include excellent fuel economy and easy maneuverability.' },
    section2: { title: 'Kotatsu', content: 'Authentic Japanese Kotatsu tables, combining comfort and functionality. Perfect for keeping warm during winter while enjoying meals or relaxing.' },
    section3: { title: 'Anime', content: 'Explore our collection of Japanese animation, movies, music, and other media. Direct imports from Japan with original packaging.' },
    section4: { title: 'Japanese Store', content: 'Discover unique Japanese clothing styles and household items. From traditional wear to modern Japanese home goods.' },
    section5: { title: 'Gaijin Haiku', content: '' },
  };

  updateSections(elements.containers, initialSections, appData);
  
  // Add a small delay to ensure DOM is updated before trying to populate
  setTimeout(() => {
    console.log('Delayed grid population starting');
    // Try to get the grid element directly
    const kTrucksGrid = document.getElementById('ktrucks-grid');
    if (kTrucksGrid) {
      console.log('Found ktrucks-grid element, populating with', appData.kTruckImages.length, 'trucks');
      populateKTrucksGrid(kTrucksGrid, appData.kTruckImages);
    } else {
      console.error('Could not find ktrucks-grid element after timeout');
    }
  }, 100);
  
  // Add click listeners to section details to handle dynamic content
  setupSectionListeners(appData);
}

/**
 * Setup section detail listeners for dynamic content loading
 * @param {Object} appData Application data
 */
function setupSectionListeners(appData) {
  // Get the K Trucks section
  const kTrucksSection = document.querySelector('#section1 .section-details');
  
  if (kTrucksSection) {
    kTrucksSection.addEventListener('toggle', () => {
      if (kTrucksSection.open) {
        console.log('K Trucks section opened, ensuring grid is populated');
        const kTrucksGrid = document.getElementById('ktrucks-grid');
        if (kTrucksGrid && (!kTrucksGrid.children.length || kTrucksGrid.children.length === 1 && kTrucksGrid.querySelector('.loading-indicator'))) {
          console.log('Grid appears empty, repopulating');
          populateKTrucksGrid(kTrucksGrid, appData.kTruckImages);
        }
      }
    });
  }
}

/**
 * Update content sections
 * @param {NodeList} containers Section container elements
 * @param {Object} sections Section content data
 * @param {Object} appData Application data
 */
function updateSections(containers, sections, appData) {
  if (!containers || !sections || !appData) return;
  
  containers.forEach((container, index) => {
    const sectionKey = `section${index + 1}`;
    const section = sections[sectionKey];

    if (section) {
      const summaryElement = container.querySelector('.section-summary');
      if (summaryElement) {
        summaryElement.textContent = section.title;
      }
      
      const contentDiv = container.querySelector('.section-content');
      if (contentDiv) {
        if (sectionKey === 'section5') {
          renderGaijinHaiku(contentDiv, appData);
        } else if (sectionKey === 'section1') {
          renderKTrucks(contentDiv, section.content);
        } else {
          contentDiv.innerHTML = `<p>${section.content}</p>`;
        }
      }
    }
  });
}

/**
 * Render Gaijin Haiku section
 * @param {HTMLElement} contentDiv Section content container
 * @param {Object} appData Application data
 */
function renderGaijinHaiku(contentDiv, appData) {
  if (!contentDiv || !appData) return;
  
  // Create image object
  const img = new Image();
  img.src = appData.externalSvg;
  
  // Handle image load error
  img.onerror = () => {
    displayError(contentDiv, 'Failed to load SVG.');
    contentDiv.innerHTML = `
      <p><a href="${appData.externalLink}" target="_blank" rel="noopener noreferrer">SKIPT SKOOL</a></p>
      <div class="svg-container">
        <a href="${appData.externalLink}" target="_blank" rel="noopener noreferrer">
          <p style="color: #E04C4C; font-weight: bold;">SKIPT SKOOL</p>
        </a>
      </div>
    `;
  };
  
  // Handle successful image load
  img.onload = () => {
    contentDiv.innerHTML = `
      <p><a href="${appData.externalLink}" target="_blank" rel="noopener noreferrer">SKIPT SKOOL</a></p>
      <div class="svg-container">
        <a href="${appData.externalLink}" target="_blank" rel="noopener noreferrer">
          <img src="${appData.externalSvg}" alt="SKIPT SKOOL Logo" class="svg-image">
        </a>
      </div>
    `;
  };
}

/**
 * Render K Trucks section
 * @param {HTMLElement} contentDiv Section content container
 * @param {string} content Section text content
 */
function renderKTrucks(contentDiv, content) {
  if (!contentDiv) return;
  
  contentDiv.innerHTML = `
    <p>${content}</p>
    <div class="product-scroll-container">
      <div class="product-grid" id="ktrucks-grid"></div>
    </div>
    <div class="product-modal" id="ktruck-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div class="product-detail-container"></div>
      </div>
    </div>
  `;
}

/**
 * Populate K Trucks grid with truck data
 * @param {HTMLElement} gridElement Grid container element
 * @param {Array} trucks Truck data
 */
function populateKTrucksGrid(gridElement, trucks) {
  console.log('populateKTrucksGrid called with', trucks?.length, 'trucks');
  
  if (!gridElement) {
    console.error('populateKTrucksGrid: No grid element provided');
    return;
  }
  
  // Show loading message if no trucks available
  if (!trucks || !trucks.length) {
    console.warn('populateKTrucksGrid: No trucks data available');
    gridElement.innerHTML = '<div class="loading-indicator">No K Trucks available.</div>';
    return;
  }
  
  // Clear existing content
  gridElement.innerHTML = '';
  
  // Create document fragment for efficient DOM updates
  const fragment = document.createDocumentFragment();
  
  trucks.forEach(truck => {
    console.log('Creating truck item for', truck.id, truck.alt);
    const item = createTruckItem(truck);
    if (item) {
      fragment.appendChild(item);
    } else {
      console.error('Failed to create item for truck', truck.id);
    }
  });
  
  // Append all items at once
  gridElement.appendChild(fragment);
  console.log('Grid populated with', gridElement.children.length, 'truck items');
}

/**
 * Create truck item element
 * @param {Object} truck Truck data
 * @returns {HTMLElement|null} Truck item element or null if data invalid
 */
function createTruckItem(truck) {
  if (!truck || !truck.thumbnailUrl || !truck.alt || !truck.id) {
    console.error('createTruckItem: Invalid truck data', truck);
    return null;
  }

  const item = document.createElement('div');
  item.className = 'product-item';
  item.dataset.id = truck.id;
  
  // Make sure the URL starts with / or is an absolute URL
  const imgUrl = truck.thumbnailUrl.startsWith('/') ? truck.thumbnailUrl : `/${truck.thumbnailUrl}`;
  
  item.innerHTML = `
    <img class="product-image" src="${imgUrl}" alt="${truck.alt}" onerror="this.src='https://via.placeholder.com/200x150?text=${truck.id}'; console.log('Image load error for ${truck.id}');">
    <div class="product-title">${truck.alt}</div>
  `;
  
  // Add click event listener
  item.addEventListener('click', () => {
    console.log('Truck clicked:', truck.id);
    showTruckDetails(truck.id);
  });
  
  return item;
}

/**
 * Show truck details in modal
 * @param {string} truckId Truck ID
 */
function showTruckDetails(truckId) {
  console.log('showTruckDetails called for', truckId);
  
  const modal = document.getElementById('ktruck-modal');
  if (!modal) {
    console.error('Modal element not found');
    return;
  }

  // Find truck data
  const image = appData.kTruckImages.find(img => img.id === truckId);
  const description = appData.kTruckDescriptions.find(desc => desc.id === truckId);

  if (!image || !description) {
    console.error('Truck data not found for ID:', truckId);
    displayError(null, 'Truck details not found.');
    return;
  }

  console.log('Found truck data:', image, description);
  
  // Populate and show modal
  const contentContainer = modal.querySelector('.product-detail-container');
  if (contentContainer) {
    contentContainer.innerHTML = createTruckDetailHTML(image, description);
  }
  
  modal.style.display = 'flex';

  // Set up close button
  const closeModal = modal.querySelector('.close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      console.log('Modal close button clicked');
      modal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      console.log('Modal background clicked');
      modal.style.display = 'none';
    }
  });
}

/**
 * Create truck detail HTML
 * @param {Object} image Truck image data
 * @param {Object} description Truck description data
 * @returns {string} HTML content
 */
function createTruckDetailHTML(image, description) {
  if (!image || !description) return '';
  
  // Make sure image URL is correct
  const imgUrl = image.imageUrl.startsWith('/') ? image.imageUrl : `/${image.imageUrl}`;
  
  return `
    <img class="product-detail-image" src="${imgUrl}" alt="${image.alt}" onerror="this.src='https://via.placeholder.com/800x500?text=${image.id}'; console.log('Detail image load error for ${image.id}');">
    <h2 class="product-detail-title">${description.title}</h2>
    <div class="product-detail-specs">
      ${Object.entries(description)
        .filter(([key]) => ['year', 'engine', 'transmission', 'capacity', 'mileage', 'price'].includes(key))
        .map(([key, value]) => `
          <div class="spec-item">
            <div class="spec-label">${key}</div>
            <div class="spec-value">${value}</div>
          </div>
        `)
        .join('')}
    </div>
    <p class="product-detail-description">${description.description}</p>
  `;
}

/**
 * Set up event listeners for interactive elements
 * @param {Object} elements DOM elements
 * @param {Object} appData Application data
 */
function setupEventListeners(elements, appData) {
  // Skip if required elements missing
  if (!elements || !elements.sidebarDetails || !elements.sidebar || !elements.body) return;
  
  // Sidebar toggle
  elements.sidebarDetails.addEventListener('toggle', () => {
    // Update sidebar expanded state
    elements.sidebar.classList.toggle('expanded', elements.sidebarDetails.open);
    elements.body.classList.toggle('menu-expanded', elements.sidebarDetails.open);
    
    // Handle submenu expanded state
    const anySubmenuOpen = elements.submenuDetails.some(detail => detail.open);
    if (elements.sidebarDetails.open && anySubmenuOpen) {
      elements.body.classList.add('submenu-expanded');
      elements.sidebar.classList.add('submenu-expanded');
    } else {
      elements.body.classList.remove('submenu-expanded');
      elements.sidebar.classList.remove('submenu-expanded');
    }
    
    // Close all submenus if sidebar is closed
    if (!elements.sidebarDetails.open) {
      closeAllSubmenus(elements.submenuDetails);
    }
  });

  // Submenu toggles
  elements.submenuDetails.forEach(submenu => {
    submenu.addEventListener('toggle', (event) => {
      event.stopPropagation();
      
      // Close other submenus when one is opened
      closeOtherSubmenus(elements.submenuDetails, submenu);
      
      // Direct class manipulation for submenu expanded state
      const anySubmenuOpen = elements.submenuDetails.some(detail => detail.open);
      if (anySubmenuOpen) {
        elements.body.classList.add('submenu-expanded');
        elements.sidebar.classList.add('submenu-expanded');
      } else {
        elements.body.classList.remove('submenu-expanded');
        elements.sidebar.classList.remove('submenu-expanded');
      }
      
      // Force reflow to ensure CSS is applied
      void elements.body.offsetWidth;
    });
  });

  // Escape key for modal
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.kTruckModal && elements.kTruckModal.style.display === 'flex') {
      elements.kTruckModal.style.display = 'none';
    }
  });
}

/**
 * Close all submenu details
 * @param {Array} submenus Submenu detail elements
 */
function closeAllSubmenus(submenus) {
  if (!submenus) return;
  
  submenus.forEach(submenu => {
    submenu.open = false;
  });
}

/**
 * Close all submenus except the current one
 * @param {Array} submenus Submenu detail elements
 * @param {HTMLElement} current Current submenu to keep open
 */
function closeOtherSubmenus(submenus, current) {
  if (!submenus || !current) return;
  
  submenus.forEach(submenu => {
    if (submenu !== current) {
      submenu.open = false;
    }
  });
}

/**
 * Fetch data from API endpoint
 * @param {string} url API endpoint URL
 * @returns {Promise<Object>} Parsed JSON response
 */
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`fetchData: ${error}`);
    throw error;
  }
}

/**
 * Display error message
 * @param {HTMLElement|null} element Element to display error in, or null for console only
 * @param {string} message Error message
 */
function displayError(element, message) {
  if (element) {
    element.innerHTML = `<div class="loading-indicator error">${message}</div>`;
  }
  console.error(`displayError: ${message}`);
}

/**
 * Force submenu expansion - useful for debugging
 */
function forceSubmenuExpansion() {
  const body = document.body;
  const sidebar = document.querySelector('.sidebar-container');
  
  if (body && sidebar) {
    body.classList.add('submenu-expanded');
    sidebar.classList.add('submenu-expanded');
    console.log('Forced submenu expansion classes applied');
  } else {
    console.error('Could not find required elements for submenu expansion');
  }
}

/**
 * Debugging helpers - you can run these in your browser console
 */
function forceGridPopulation() {
  const grid = document.getElementById('ktrucks-grid');
  if (grid) {
    console.log('Attempting to force populate grid with', appData.kTruckImages.length, 'items');
    populateKTrucksGrid(grid, appData.kTruckImages);
    return 'Grid population attempted';
  } else {
    return 'Could not find grid element';
  }
}

function testImageLoading() {
  if (!appData.kTruckImages || !appData.kTruckImages.length) {
    return 'No truck images in appData';
  }
  
  const results = [];
  appData.kTruckImages.forEach(truck => {
    const img = new Image();
    img.onload = () => results.push(`✅ ${truck.id}: ${truck.thumbnailUrl} loaded`);
    img.onerror = () => results.push(`❌ ${truck.id}: ${truck.thumbnailUrl} failed`);
    img.src = truck.thumbnailUrl;
  });
  
  // Check after a delay
  setTimeout(() => console.log(results.join('\n')), 2000);
  
  return 'Testing image loading, check console in 2 seconds';
}

function inspectElements() {
  const section = document.getElementById('section1');
  const details = section?.querySelector('.section-details');
  const content = section?.querySelector('.section-content');
  const grid = document.getElementById('ktrucks-grid');
  
  return {
    'Section exists': !!section,
    'Section details exists': !!details,
    'Section content exists': !!content,
    'Grid exists': !!grid,
    'Grid has children': grid ? grid.children.length : 'N/A',
    'Section has correct ID': section?.id === 'section1'
  };
}