const buildMapLink = (linkId: string) =>
  new URL(`map/${linkId}`, window.location.href).toString();

export default buildMapLink;
