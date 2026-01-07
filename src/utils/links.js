/**
 * Generates a Google Maps search link for a given query.
 * @param {string} query - The search query (location name, address, etc.)
 * @returns {string} - The Google Maps URL.
 */
export const getMapLink = (query) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
