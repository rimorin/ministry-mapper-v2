export const getAssetUrl = (filename: string): string => {
  const baseUrl = "https://assets.ministry-mapper.com";
  return `${baseUrl}/${filename}`;
};
