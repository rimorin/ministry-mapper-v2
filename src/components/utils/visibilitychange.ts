const useVisibilityChange = (callback: () => void) => {
  if (document.visibilityState === "visible") {
    callback();
  }
};

export default useVisibilityChange;
