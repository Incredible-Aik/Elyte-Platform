const { executeQuery } = require('../../database/config/database');

// Ghana mobile money providers
const MOBILE_MONEY_PROVIDERS = {
  mtn: {
    name: 'MTN Mobile Money',
    prefixes: ['024', '054', '055', '059'],
    ussdCode: '*170#',
    apiEndpoint: process.env.MTN_API_ENDPOINT
  },
  vodafone: {
    name: 'Vodafone Cash',
    prefixes: ['020', '050'],
    ussdCode: '*110#',
    apiEndpoint: process.env.VODAFONE_API_ENDPOINT
  },
  airteltigo: {
    name: 'AirtelTigo Money',
    prefixes: ['027', '057', '026', '056'],
    ussdCode: '*110#',
    apiEndpoint: process.env.AIRTELTIGO_API_ENDPOINT
  }
};

// Ghana regions and their major cities
const GHANA_REGIONS = {
  'Greater Accra': ['Accra', 'Tema', 'Adenta', 'Ashaiman', 'Ga East', 'Ga West', 'Ga South'],
  'Ashanti': ['Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Konongo', 'Agogo'],
  'Western': ['Takoradi', 'Sekondi', 'Tarkwa', 'Prestea', 'Axim', 'Half Assini'],
  'Western North': ['Sefwi Wiawso', 'Aowin', 'Bia East', 'Bia West'],
  'Central': ['Cape Coast', 'Winneba', 'Elmina', 'Kasoa', 'Dunkwa', 'Assin Fosu'],
  'Eastern': ['Koforidua', 'Akosombo', 'Nkawkaw', 'Mpraeso', 'Begoro'],
  'Volta': ['Ho', 'Hohoe', 'Keta', 'Anloga', 'Dzodze'],
  'Oti': ['Dambai', 'Nkwanta', 'Kadjebi', 'Jasikan'],
  'Northern': ['Tamale', 'Yendi', 'Gushegu', 'Karaga', 'Kumbungu'],
  'North East': ['Nalerigu', 'Gambaga', 'Walewale'],
  'Savannah': ['Damongo', 'Bole', 'Salaga', 'Buipe'],
  'Upper East': ['Bolgatanga', 'Navrongo', 'Bawku', 'Zebilla'],
  'Upper West': ['Wa', 'Lawra', 'Jirapa', 'Tumu'],
  'Brong-Ahafo': ['Sunyani', 'Techiman', 'Berekum', 'Dormaa Ahenkro'],
  'Bono': ['Sunyani', 'Wenchi', 'Bechem'],
  'Bono East': ['Techiman', 'Atebubu', 'Kintampo'],
  'Ahafo': ['Goaso', 'Bechem', 'Hwidiem']
};

/**
 * Validate Ghana phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} - Validation result with provider info
 */
function validateGhanaPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check for Ghana country code
  let localNumber;
  if (cleanNumber.startsWith('233')) {
    localNumber = cleanNumber.substring(3);
  } else if (cleanNumber.startsWith('0')) {
    localNumber = cleanNumber.substring(1);
  } else if (cleanNumber.length === 9) {
    localNumber = cleanNumber;
  } else {
    return { isValid: false, error: 'Invalid Ghana phone number format' };
  }
  
  // Validate length (should be 9 digits after country code)
  if (localNumber.length !== 9) {
    return { isValid: false, error: 'Ghana phone numbers must be 9 digits' };
  }
  
  // Get the prefix (first 3 digits)
  const prefix = localNumber.substring(0, 3);
  
  // Find mobile money provider
  let provider = null;
  for (const [key, info] of Object.entries(MOBILE_MONEY_PROVIDERS)) {
    if (info.prefixes.includes(prefix)) {
      provider = { key, ...info };
      break;
    }
  }
  
  // Format the number
  const formattedNumber = `+233${localNumber}`;
  const displayNumber = `0${localNumber}`;
  
  return {
    isValid: true,
    formattedNumber,
    displayNumber,
    localNumber,
    prefix,
    provider,
    supportsMobileMoney: provider !== null
  };
}

/**
 * Validate Ghana ID number (old format or Ghana Card)
 * @param {string} idNumber - ID number to validate
 * @returns {Object} - Validation result
 */
function validateGhanaIDNumber(idNumber) {
  if (!idNumber) {
    return { isValid: false, error: 'ID number is required' };
  }
  
  const cleanId = idNumber.trim().toUpperCase();
  
  // Ghana Card format: GHA-XXXXXXXXX-X
  const ghanaCardPattern = /^GHA-\d{9}-\d$/;
  
  // Old ID format: various patterns
  const oldIdPattern = /^[A-Z]{1,2}\d{7,9}$/;
  
  if (ghanaCardPattern.test(cleanId)) {
    return {
      isValid: true,
      type: 'ghana_card',
      formattedId: cleanId,
      isNewFormat: true
    };
  } else if (oldIdPattern.test(cleanId)) {
    return {
      isValid: true,
      type: 'old_id',
      formattedId: cleanId,
      isNewFormat: false
    };
  } else {
    return {
      isValid: false,
      error: 'Invalid Ghana ID number format'
    };
  }
}

/**
 * Validate Ghana driver's license number
 * @param {string} licenseNumber - License number to validate
 * @returns {Object} - Validation result
 */
function validateGhanaLicenseNumber(licenseNumber) {
  if (!licenseNumber) {
    return { isValid: false, error: 'License number is required' };
  }
  
  const cleanLicense = licenseNumber.trim().toUpperCase();
  
  // Ghana license format: varies but typically alphanumeric
  const licensePattern = /^[A-Z0-9]{6,12}$/;
  
  if (licensePattern.test(cleanLicense)) {
    return {
      isValid: true,
      formattedLicense: cleanLicense
    };
  } else {
    return {
      isValid: false,
      error: 'Invalid Ghana driver\'s license format'
    };
  }
}

/**
 * Validate Ghana vehicle registration number
 * @param {string} plateNumber - Plate number to validate
 * @returns {Object} - Validation result
 */
function validateGhanaPlateNumber(plateNumber) {
  if (!plateNumber) {
    return { isValid: false, error: 'Plate number is required' };
  }
  
  const cleanPlate = plateNumber.trim().toUpperCase().replace(/\s+/g, ' ');
  
  // Ghana plate formats: 
  // New format: GR-XXXX-XX or AS-XXXX-XX (Region-Number-Letter)
  // Old format: Various patterns
  const newPlatePattern = /^[A-Z]{2}-\d{1,4}-[A-Z]{1,2}$/;
  const oldPlatePattern = /^[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,2}$/;
  
  if (newPlatePattern.test(cleanPlate)) {
    return {
      isValid: true,
      type: 'new_format',
      formattedPlate: cleanPlate,
      region: cleanPlate.substring(0, 2)
    };
  } else if (oldPlatePattern.test(cleanPlate)) {
    return {
      isValid: true,
      type: 'old_format',
      formattedPlate: cleanPlate
    };
  } else {
    return {
      isValid: false,
      error: 'Invalid Ghana vehicle registration format'
    };
  }
}

/**
 * Validate Ghana location (region and city)
 * @param {string} region - Region name
 * @param {string} city - City name
 * @returns {Promise<Object>} - Validation result
 */
async function validateGhanaLocation(region, city) {
  if (!region || !city) {
    return { isValid: false, error: 'Region and city are required' };
  }
  
  try {
    // Check against database
    const locations = await executeQuery(`
      SELECT * FROM ghana_locations
      WHERE region = ? AND city = ? AND is_active = true
    `, [region, city]);
    
    if (locations.length > 0) {
      return {
        isValid: true,
        location: locations[0],
        coordinates: {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude
        }
      };
    }
    
    // Fallback to hardcoded regions
    if (GHANA_REGIONS[region] && GHANA_REGIONS[region].includes(city)) {
      return {
        isValid: true,
        region,
        city,
        source: 'fallback'
      };
    }
    
    return {
      isValid: false,
      error: 'Invalid Ghana region or city'
    };
  } catch (error) {
    console.error('Location validation error:', error.message);
    return {
      isValid: false,
      error: 'Location validation failed'
    };
  }
}

/**
 * Get mobile money provider from phone number
 * @param {string} phoneNumber - Phone number
 * @returns {Object|null} - Provider information
 */
function getMobileMoneyProvider(phoneNumber) {
  const validation = validateGhanaPhoneNumber(phoneNumber);
  return validation.isValid ? validation.provider : null;
}

/**
 * Validate mobile money account name
 * @param {string} accountName - Account name to validate
 * @returns {Object} - Validation result
 */
function validateMobileMoneyAccountName(accountName) {
  if (!accountName) {
    return { isValid: false, error: 'Account name is required' };
  }
  
  const cleanName = accountName.trim();
  
  // Basic validation for account name
  if (cleanName.length < 2) {
    return { isValid: false, error: 'Account name too short' };
  }
  
  if (cleanName.length > 100) {
    return { isValid: false, error: 'Account name too long' };
  }
  
  // Check for valid characters (letters, spaces, apostrophes, hyphens)
  const namePattern = /^[a-zA-Z\s'-]+$/;
  if (!namePattern.test(cleanName)) {
    return { isValid: false, error: 'Account name contains invalid characters' };
  }
  
  return {
    isValid: true,
    formattedName: cleanName.replace(/\s+/g, ' ') // Normalize spaces
  };
}

/**
 * Format Ghana Cedi amount
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount
 */
function formatGhanaCurrency(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Validate Ghana postal address
 * @param {string} address - Address to validate
 * @returns {Object} - Validation result
 */
function validateGhanaAddress(address) {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }
  
  const cleanAddress = address.trim();
  
  if (cleanAddress.length < 10) {
    return { isValid: false, error: 'Address too short' };
  }
  
  if (cleanAddress.length > 500) {
    return { isValid: false, error: 'Address too long' };
  }
  
  return {
    isValid: true,
    formattedAddress: cleanAddress
  };
}

/**
 * Get all Ghana regions
 * @returns {Array} - List of regions
 */
function getGhanaRegions() {
  return Object.keys(GHANA_REGIONS);
}

/**
 * Get cities for a specific region
 * @param {string} region - Region name
 * @returns {Array} - List of cities
 */
function getRegionCities(region) {
  return GHANA_REGIONS[region] || [];
}

/**
 * Get all mobile money providers
 * @returns {Object} - Mobile money providers
 */
function getMobileMoneyProviders() {
  return MOBILE_MONEY_PROVIDERS;
}

module.exports = {
  validateGhanaPhoneNumber,
  validateGhanaIDNumber,
  validateGhanaLicenseNumber,
  validateGhanaPlateNumber,
  validateGhanaLocation,
  getMobileMoneyProvider,
  validateMobileMoneyAccountName,
  formatGhanaCurrency,
  validateGhanaAddress,
  getGhanaRegions,
  getRegionCities,
  getMobileMoneyProviders,
  MOBILE_MONEY_PROVIDERS,
  GHANA_REGIONS
};