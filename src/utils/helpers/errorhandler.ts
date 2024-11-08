import Rollbar from "rollbar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandler = (error: any, rollbar: Rollbar, showAlert = true) => {
  rollbar.error(error);
  if (showAlert) {
    const errorStatus = error.status || "Error";
    if (error.response && error.response.message) {
      alert(`${errorStatus}: ${error.response.message}`);
      return;
    }
    alert(error);
  }
};

export default errorHandler;
