// Errors thrown after a stale-deploy reload starts aren't worth reporting.
let reloading = false;

export const reloadForNewDeploy = () => {
  reloading = true;
  window.location.reload();
};

export const isReloadingForNewDeploy = () => reloading;
