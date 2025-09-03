/**
 * Helper function to get asset URLs from the ministry-mapper assets CDN
 * @param filename - The filename of the asset (e.g., 'target.svg', 'gmaps.svg')
 * @returns Complete URL to the asset
 */
export const getAssetUrl = (filename: string): string => {
  const baseUrl = "https://assets.ministry-mapper.com";
  return `${baseUrl}/${filename}`;
};

export default getAssetUrl;
