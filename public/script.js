document.addEventListener('DOMContentLoaded', initializeApp);

// Global variable for app data - accessible across functions
let appData = {};

async function initializeApp() {
  console.log('initializeApp: Application initialization started.');

  await updateSidebarFromCopyJson();


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


//********* SIDEBAR */

async function updateSidebarFromCopyJson() {
  try {
    const response = await fetch('/api/data/copy.json');

    const websiteCopy = await response.json();
    const sidebar = document.getElementById('dynamic-sidebar');
    if (!sidebar) return console.error('Sidebar container not found.');

    sidebar.innerHTML = ''; // Clear any existing content

    Object.entries(websiteCopy).forEach(([sectionKey, sectionData]) => {
      const mainDetails = document.createElement('li');
      mainDetails.innerHTML = `
        <details class="submenu-details">
          <summary class="nav-link">${sectionData.title}</summary>
          <div class="submenu"></div>
        </details>
      `;
      
      const submenu = mainDetails.querySelector('.submenu');

      // Sub-sections
      if (sectionData.sections && Array.isArray(sectionData.sections)) {
        sectionData.sections.forEach(sub => {
          const subLinkWrapper = document.createElement('div');
          subLinkWrapper.className = 'submenu-link';
          subLinkWrapper.innerHTML = `<strong>${sub.title}</strong>`;
          
          submenu.appendChild(subLinkWrapper);

          // Optional: Sub-submenu if product/options exist
          if (sub.products && Array.isArray(sub.products)) {
            sub.products.forEach(product => {
              const typeWrapper = document.createElement('div');
              typeWrapper.style.paddingLeft = '10px';
              typeWrapper.innerHTML = `<em>${product.type} - ${product.design}</em>`;
              submenu.appendChild(typeWrapper);

              product.options?.forEach(opt => {
                const optDiv = document.createElement('div');
                optDiv.className = 'submenu-link';
                optDiv.style.paddingLeft = '20px';
                optDiv.textContent = `${opt.color} (${opt.status})`;
                submenu.appendChild(optDiv);
              });
            });
          }
        });
      } else if (sectionData.content) {
        // If no sub-sections, just show content
        const content = document.createElement('div');
        content.className = 'submenu-link';
        content.innerHTML = sectionData.content.slice(0, 100) + '...';
        submenu.appendChild(content);
      }

      sidebar.appendChild(mainDetails);
    });
  } catch (error) {
    console.error('Failed to build sidebar from copy.json:', error);
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
    const kotatsuGrid = document.getElementById('kotatsu-grid');
    const kotatsuModal = document.getElementById('kotatsu-modal');
    const animeGrid = document.getElementById('anime-grid');
    const animeModal = document.getElementById('anime-modal');
    const jstoreGrid = document.getElementById('jstore-grid');
    const jstoreModal = document.getElementById('jstore-modal');
    const gaijinGrid = document.getElementById('gaijin-grid');
    const gaijinModal = document.getElementById('gaijin-modal');
    const wsskateGrid = document.getElementById('wsskate-grid');
    const wsskateModal = document.getElementById('wsskate-modal');

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
      kotatsuGrid: kotatsuGrid || null,
      kotatsuModal: kotatsuModal || null,
      animeGrid: animeGrid || null,
      animeModal: animeModal || null,
      jstoreGrid: jstoreGrid || null,
      jstoreModal: jstoreModal || null,
      gaijinGrid: gaijinGrid || null,
      gaijinModal: gaijinModal || null,
      wsskateGrid: wsskateGrid || null,
      wsskateModal: wsskateModal || null
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
    kotatsuImages: [],
    kotatsuDescriptions: [],
    animeImages: [],
    animeDescriptions: [],
    jstoreImages: [],
    jstoreDescriptions: [],
    gaijinImages: [],
    gaijinDescriptions: [],
    wsskateImages: [],
    wsskateDescriptions: [],
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
    const [
      kTruckImages, 
      kTruckDescriptions, 
      kotatsuImages, 
      kotatsuDescriptions,
      animeImages,
      animeDescriptions,
      jstoreImages,
      jstoreDescriptions,
      gaijinImages,
      gaijinDescriptions,
      wsskateImages,
      wsskateDescriptions,
      linksData
    ] = await Promise.all([
      fetchData('/api/data/ktruckimage.json').catch(() => []),
      fetchData('/api/data/ktruckdescription.json').catch(() => []),
      fetchData('/api/data/kotatsu.json').catch(() => generatePlaceholderData('kotatsu', 5)),
      fetchData('/api/data/kotatsudescription.json').catch(() => generatePlaceholderDescriptions('kotatsu', 5)),
      fetchData('/api/data/anime.json').catch(() => generatePlaceholderData('anime', 5)),
      fetchData('/api/data/animedescription.json').catch(() => generatePlaceholderDescriptions('anime', 5)),
      fetchData('/api/data/jstore.json').catch(() => generatePlaceholderData('jstore', 5)),
      fetchData('/api/data/jstoredescription.json').catch(() => generatePlaceholderDescriptions('jstore', 5)),
      fetchData('/api/data/gaijin.json').catch(() => generatePlaceholderData('gaijin', 5)),
      fetchData('/api/data/gaijindescription.json').catch(() => generatePlaceholderDescriptions('gaijin', 5)),
      fetchData('/api/data/wsskate.json').catch(() => generatePlaceholderData('wsskate', 5)),
      fetchData('/api/data/wsskatedescription.json').catch(() => generatePlaceholderDescriptions('wsskate', 5)),
      fetchData('/api/data/links.json').catch(() => ({}))
    ]);

    console.log('Data loaded from API:');
    console.log('- K Truck Images:', kTruckImages?.length || 0, 'items');
    console.log('- K Truck Descriptions:', kTruckDescriptions?.length || 0, 'items');
    console.log('- Kotatsu Images:', kotatsuImages?.length || 0, 'items');
    console.log('- Kotatsu Descriptions:', kotatsuDescriptions?.length || 0, 'items');
    console.log('- Anime Images:', animeImages?.length || 0, 'items');
    console.log('- Anime Descriptions:', animeDescriptions?.length || 0, 'items');
    console.log('- Japanese Store Images:', jstoreImages?.length || 0, 'items');
    console.log('- Japanese Store Descriptions:', jstoreDescriptions?.length || 0, 'items');
    console.log('- Gaijin Haiku Images:', gaijinImages?.length || 0, 'items');
    console.log('- Gaijin Haiku Descriptions:', gaijinDescriptions?.length || 0, 'items');
    console.log('- WS SKATE Images:', wsskateImages?.length || 0, 'items');
    console.log('- WS SKATE Descriptions:', wsskateDescriptions?.length || 0, 'items');
    
    // Fix image paths if needed
    const fixedKTruckImages = fixImagePaths(kTruckImages || []);
    const fixedKotatsuImages = fixImagePaths(kotatsuImages || []);
    const fixedAnimeImages = fixImagePaths(animeImages || []);
    const fixedJstoreImages = fixImagePaths(jstoreImages || []);
    const fixedGaijinImages = fixImagePaths(gaijinImages || []);
    const fixedWsskateImages = fixImagePaths(wsskateImages || []);
    
    // Populate app data
    appData.kTruckImages = fixedKTruckImages;
    appData.kTruckDescriptions = kTruckDescriptions || [];
    appData.kotatsuImages = fixedKotatsuImages;
    appData.kotatsuDescriptions = kotatsuDescriptions || [];
    appData.animeImages = fixedAnimeImages;
    appData.animeDescriptions = animeDescriptions || [];
    appData.jstoreImages = fixedJstoreImages;
    appData.jstoreDescriptions = jstoreDescriptions || [];
    appData.gaijinImages = fixedGaijinImages;
    appData.gaijinDescriptions = gaijinDescriptions || [];
    appData.wsskateImages = fixedWsskateImages;
    appData.wsskateDescriptions = wsskateDescriptions || [];
    
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
 * Generate placeholder data for testing when API fails
 * @param {string} type Type of data to generate
 * @param {number} count Number of items to generate
 * @returns {Array} Array of placeholder data objects
 */
function generatePlaceholderData(type, count) {
  console.log(`Generating ${count} placeholder items for ${type}`);
  const items = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      id: `${type}-${i}`,
      imageUrl: `https://via.placeholder.com/800x500?text=${type}+Item+${i}`,
      thumbnailUrl: `https://via.placeholder.com/200x150?text=${type}+Item+${i}`,
      alt: `${type.charAt(0).toUpperCase() + type.slice(1)} Item ${i}`
    });
  }
  return items;
}

/**
 * Generate placeholder descriptions for testing when API fails
 * @param {string} type Type of data to generate
 * @param {number} count Number of items to generate
 * @returns {Array} Array of placeholder description objects
 */
function generatePlaceholderDescriptions(type, count) {
  console.log(`Generating ${count} placeholder descriptions for ${type}`);
  const items = [];
  const specs = {
    kotatsu: ['size', 'material', 'heater', 'style', 'price'],
    anime: ['title', 'genre', 'episodes', 'year', 'price'],
    jstore: ['category', 'origin', 'material', 'size', 'price'],
    gaijin: ['title', 'author', 'style', 'year', 'price'],
    wsskate: ['title', 'length', 'format', 'year', 'price']
  };
  
  for (let i = 1; i <= count; i++) {
    const item = {
      id: `${type}-${i}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Item ${i}`,
      description: `This is a detailed description for ${type} item ${i}. It includes all the important information that a customer might want to know before making a purchase.`
    };
    
    // Add type-specific specs
    if (specs[type]) {
      specs[type].forEach(spec => {
        item[spec] = `Sample ${spec} ${i}`;
      });
    }
    
    items.push(item);
  }
  return items;
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
    if (fixedTruck.imageUrl && !fixedTruck.imageUrl.includes('assets') && !fixedTruck.imageUrl.startsWith('http')) {
      fixedTruck.imageUrl = `/assets/${fixedTruck.imageUrl.split('/').pop()}`;
    }
    
    if (fixedTruck.thumbnailUrl && !fixedTruck.thumbnailUrl.includes('assets') && !fixedTruck.thumbnailUrl.startsWith('http')) {
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
    section6: { title: 'WS SKATE Scene', content: 'Video Library' },
  };

  updateSections(elements.containers, initialSections, appData);
  
  // Add a small delay to ensure DOM is updated before trying to populate
  setTimeout(() => {
    console.log('Delayed grid population starting');
    
    // Try to get the grid elements directly
    const kTrucksGrid = document.getElementById('ktrucks-grid');
    const kotatsuGrid = document.getElementById('kotatsu-grid');
    const animeGrid = document.getElementById('anime-grid');
    const jstoreGrid = document.getElementById('jstore-grid');
    const gaijinGrid = document.getElementById('gaijin-grid');
    const wsskateGrid = document.getElementById('wsskate-grid');
    
    if (kTrucksGrid) {
      console.log('Found ktrucks-grid element, populating with', appData.kTruckImages.length, 'trucks');
      populateProductGrid(kTrucksGrid, appData.kTruckImages, 'ktruck');
    }
    
    if (kotatsuGrid) {
      console.log('Found kotatsu-grid element, populating with', appData.kotatsuImages.length, 'items');
      populateProductGrid(kotatsuGrid, appData.kotatsuImages, 'kotatsu');
    }
    
    if (animeGrid) {
      console.log('Found anime-grid element, populating with', appData.animeImages.length, 'items');
      populateProductGrid(animeGrid, appData.animeImages, 'anime');
    }
    
    if (jstoreGrid) {
      console.log('Found jstore-grid element, populating with', appData.jstoreImages.length, 'items');
      populateProductGrid(jstoreGrid, appData.jstoreImages, 'jstore');
    }
    
    if (gaijinGrid) {
      console.log('Found gaijin-grid element, populating with', appData.gaijinImages.length, 'items');
      populateProductGrid(gaijinGrid, appData.gaijinImages, 'gaijin');
    }
    
    if (wsskateGrid) {
      console.log('Found wsskate-grid element, populating with', appData.wsskateImages.length, 'items');
      populateProductGrid(wsskateGrid, appData.wsskateImages, 'wsskate');
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
  // Get all sections
  const sections = [
    { id: 'section1', type: 'ktruck', data: appData.kTruckImages },
    { id: 'section2', type: 'kotatsu', data: appData.kotatsuImages },
    { id: 'section3', type: 'anime', data: appData.animeImages },
    { id: 'section4', type: 'jstore', data: appData.jstoreImages },
    { id: 'section5', type: 'gaijin', data: appData.gaijinImages },
    { id: 'section6', type: 'wsskate', data: appData.wsskateImages }
  ];
  
  sections.forEach(({ id, type, data }) => {
    const section = document.querySelector(`#${id} .section-details`);
    
    if (section) {
      section.addEventListener('toggle', () => {
        if (section.open) {
          console.log(`${id} section opened, ensuring grid is populated`);
          const grid = document.getElementById(`${type}-grid`);
          if (grid && (!grid.children.length || (grid.children.length === 1 && grid.querySelector('.loading-indicator')))) {
            console.log('Grid appears empty, repopulating');
            populateProductGrid(grid, data, type);
          }
        }
      });
    }
  });
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
          renderProductSection(contentDiv, section.content, 'ktrucks', 'ktruck');
        } else if (sectionKey === 'section2') {
          renderProductSection(contentDiv, section.content, 'kotatsu', 'kotatsu');
        } else if (sectionKey === 'section3') {
          renderProductSection(contentDiv, section.content, 'anime', 'anime');
        } else if (sectionKey === 'section4') {
          renderProductSection(contentDiv, section.content, 'jstore', 'jstore');
        } else if (sectionKey === 'section6') {
          renderProductSection(contentDiv, section.content, 'wsskate', 'wsskate');
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
      <div class="product-scroll-container">
        <div class="product-grid" id="gaijin-grid"></div>
      </div>
      <div class="product-modal" id="gaijin-modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <div class="product-detail-container"></div>
        </div>
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
      <div class="product-scroll-container">
        <div class="product-grid" id="gaijin-grid"></div>
      </div>
      <div class="product-modal" id="gaijin-modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <div class="product-detail-container"></div>
        </div>
      </div>
    `;
  };
}

/**
 * Render product section with grid and modal
 * @param {HTMLElement} contentDiv Section content container
 * @param {string} content Section text content
 * @param {string} gridId Grid identifier
 * @param {string} modalPrefix Modal prefix
 */
function renderProductSection(contentDiv, content, gridId, modalPrefix) {
  if (!contentDiv) return;
  
  contentDiv.innerHTML = `
    <p>${content}</p>
    <div class="product-scroll-container">
      <div class="product-grid" id="${gridId}-grid"></div>
    </div>
    <div class="product-modal" id="${modalPrefix}-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div class="product-detail-container"></div>
      </div>
    </div>
  `;
}

/**
 * Populate product grid with data
 * @param {HTMLElement} gridElement Grid container element
 * @param {Array} items Product data
 * @param {string} type Product type identifier
 */
function populateProductGrid(gridElement, items, type) {
  console.log(`populateProductGrid called for ${type} with`, items?.length, 'items');
  
  if (!gridElement) {
    console.error(`populateProductGrid: No grid element provided for ${type}`);
    return;
  }
  
  // Show loading message if no items available
  if (!items || !items.length) {
    console.warn(`populateProductGrid: No ${type} data available`);
    gridElement.innerHTML = `<div class="loading-indicator">No ${type} items available.</div>`;
    return;
  }
  
  // Clear existing content
  gridElement.innerHTML = '';
  
  // Create document fragment for efficient DOM updates
  const fragment = document.createDocumentFragment();
  
  items.forEach(item => {
    console.log(`Creating ${type} item for`, item.id, item.alt);
    const itemElement = createProductItem(item, type);
    if (itemElement) {
      fragment.appendChild(itemElement);
    } else {
      console.error(`Failed to create item for ${type}`, item.id);
    }
  });
  
  // Append all items at once
  gridElement.appendChild(fragment);
  console.log(`Grid populated with`, gridElement.children.length, `${type} items`);
}

/**
 * Create product item element
 * @param {Object} item Product data
 * @param {string} type Product type
 * @returns {HTMLElement|null} Product item element or null if data invalid
 */
function createProductItem(item, type) {
  if (!item || !item.thumbnailUrl || !item.alt || !item.id) {
    console.error(`createProductItem: Invalid ${type} data`, item);
    return null;
  }

  const itemElement = document.createElement('div');
  itemElement.className = 'product-item';
  itemElement.dataset.id = item.id;
  
  // Make sure the URL starts with / or is an absolute URL
  const imgUrl = item.thumbnailUrl.startsWith('http')
    ? item.thumbnailUrl 
    : (item.thumbnailUrl.startsWith('/') ? item.thumbnailUrl : `/${item.thumbnailUrl}`);
  
  itemElement.innerHTML = `
    <img class="product-image"
         src="${imgUrl}"
         alt="${item.alt}"
         onerror="this.src='https://via.placeholder.com/200x150?text=${item.id}'; console.log('Image load error for ${item.id}');">
    <div class="product-title">${item.alt}</div>
  `;
  
  // Add click event listener
  itemElement.addEventListener('click', () => {
    console.log(`${type} clicked:`, item.id);
    showProductDetails(item.id, type);
  });
  
  return itemElement;
}

/**
 * Show product details in modal
 * @param {string} itemId Product ID
 * @param {string} type Product type
 */
function showProductDetails(itemId, type) {
  console.log(`showProductDetails called for ${type} with ID ${itemId}`);
  
  const modal = document.getElementById(`${type}-modal`);
  if (!modal) {
    console.error(`Modal element not found for ${type}`);
    return;
  }

  // Find item data based on type
  let image, description;
  
  switch (type) {
    case 'ktruck':
      image = appData.kTruckImages.find(img => img.id === itemId);
      description = appData.kTruckDescriptions.find(desc => desc.id === itemId);
      break;
    case 'kotatsu':
      image = appData.kotatsuImages.find(img => img.id === itemId);
      description = appData.kotatsuDescriptions.find(desc => desc.id === itemId);
      break;
    case 'anime':
      image = appData.animeImages.find(img => img.id === itemId);
      description = appData.animeDescriptions.find(desc => desc.id === itemId);
      break;
    case 'jstore':
      image = appData.jstoreImages.find(img => img.id === itemId);
      description = appData.jstoreDescriptions.find(desc => desc.id === itemId);
      break;
    case 'gaijin':
      image = appData.gaijinImages.find(img => img.id === itemId);
      description = appData.gaijinDescriptions.find(desc => desc.id === itemId);
      break;
    case 'wsskate':
      image = appData.wsskateImages.find(img => img.id === itemId);
      description = appData.wsskateDescriptions.find(desc => desc.id === itemId);
      break;
    default:
      console.error(`Unknown product type: ${type}`);
      return;
  }

  if (!image || !description) {
    console.error(`${type} data not found for ID:`, itemId);
    displayError(null, `${type} details not found.`);
    return;
  }

  console.log(`Found ${type} data:`, image, description);
  
  // Populate and show modal
  const contentContainer = modal.querySelector('.product-detail-container');
  if (contentContainer) {
    contentContainer.innerHTML = createProductDetailHTML(image, description);
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
 * Create product detail HTML
 * @param {Object} image Product image data
 * @param {Object} description Product description data
 * @returns {string} HTML content
 */
function createProductDetailHTML(image, description) {
  if (!image || !description) return '';

  const galleryImages = Array.isArray(image.gallery) ? image.gallery : [image.imageUrl];
  const imageElements = galleryImages.map((url, i) => `
    <img 
      class="carousel-image" 
      src="${url}" 
      alt="${image.alt} - ${i + 1}" 
      style="display: ${i === 0 ? 'block' : 'none'};"
      data-index="${i}"
    >
  `).join('');

  const specEntries = Object.entries(description)
    .filter(([key]) => !['id', 'title', 'description'].includes(key))
    .map(([key, value]) => `
      <div class="spec-item">
        <div class="spec-label">${key}</div>
        <div class="spec-value">${value}</div>
      </div>
    `)
    .join('');

  return `
    <div class="carousel-container">
      ${imageElements}
      <button class="carousel-button prev">&larr;</button>
      <button class="carousel-button next">&rarr;</button>
    </div>
    <h2 class="product-detail-title">${description.title}</h2>
    <div class="product-detail-specs">${specEntries}</div>
    <p class="product-detail-description">${description.description}</p>
  `;
}




document.addEventListener('click', (event) => {
  // Only handle carousel buttons
  if (event.target.classList.contains('carousel-button')) {
    event.stopPropagation(); // ✅ Prevent modal close

    const container = event.target.closest('.carousel-container');
    const images = container.querySelectorAll('.carousel-image');
    const total = images.length;

    let currentIndex = [...images].findIndex(img => img.style.display === 'block');
    images[currentIndex].style.display = 'none';

    if (event.target.classList.contains('next')) {
      currentIndex = (currentIndex + 1) % total;
    } else if (event.target.classList.contains('prev')) {
      currentIndex = (currentIndex - 1 + total) % total;
    }

    images[currentIndex].style.display = 'block';
  }
});



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

  // Escape key for all modals
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const modals = [
        elements.kTruckModal,
        elements.kotatsuModal,
        elements.animeModal,
        elements.jstoreModal,
        elements.gaijinModal,
        elements.wsskateModal
      ];
      
      modals.forEach(modal => {
        if (modal && modal.style.display === 'flex') {
          modal.style.display = 'none';
        }
      });
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
  const grids = {
    ktrucks: appData.kTruckImages,
    kotatsu: appData.kotatsuImages,
    anime: appData.animeImages,
    jstore: appData.jstoreImages,
    gaijin: appData.gaijinImages,
    wsskate: appData.wsskateImages
  };
  
  const results = {};
  
  for (const [gridId, data] of Object.entries(grids)) {
    const grid = document.getElementById(`${gridId}-grid`);
    if (grid) {
      console.log(`Attempting to force populate ${gridId} grid with`, data.length, 'items');
      populateProductGrid(grid, data, gridId.replace('s-grid', ''));
      results[gridId] = 'Grid population attempted';
    } else {
      results[gridId] = 'Could not find grid element';
    }
  }
  
  return results;
}

function testImageLoading() {
  const imageArrays = [
    { name: 'K Trucks', data: appData.kTruckImages },
    { name: 'Kotatsu', data: appData.kotatsuImages },
    { name: 'Anime', data: appData.animeImages },
    { name: 'Japanese Store', data: appData.jstoreImages },
    { name: 'Gaijin Haiku', data: appData.gaijinImages },
    { name: 'WS SKATE', data: appData.wsskateImages }
  ];
  
  const results = [];
  
  imageArrays.forEach(({ name, data }) => {
    if (!data || !data.length) {
      results.push(`No ${name} images in appData`);
      return;
    }
    
    results.push(`Testing ${name} images:`);
    data.forEach(item => {
      const img = new Image();
      img.onload = () => results.push(`✅ ${item.id}: ${item.thumbnailUrl} loaded`);
      img.onerror = () => results.push(`❌ ${item.id}: ${item.thumbnailUrl} failed`);
      img.src = item.thumbnailUrl;
    });
  });
  
  // Check after a delay
  setTimeout(() => console.log(results.join('\n')), 2000);
  
  return 'Testing image loading, check console in 2 seconds';
}

function inspectElements() {
  const sectionIds = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
  const gridIds = ['ktrucks-grid', 'kotatsu-grid', 'anime-grid', 'jstore-grid', 'gaijin-grid', 'wsskate-grid'];
  
  const results = {};
  
  sectionIds.forEach(id => {
    const section = document.getElementById(id);
    results[`${id} exists`] = !!section;
    results[`${id} details exists`] = !!section?.querySelector('.section-details');
    results[`${id} content exists`] = !!section?.querySelector('.section-content');
  });
  
  gridIds.forEach(id => {
    const grid = document.getElementById(id);
    results[`${id} exists`] = !!grid;
    results[`${id} has children`] = grid ? grid.children.length : 'N/A';
  });
  
  return results;
}
