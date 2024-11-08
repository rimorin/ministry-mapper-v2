import Rollbar from "rollbar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandler = (error: any, rollbar: Rollbar, showAlert = true) => {
  rollbar.error(error);
  if (showAlert) {
    // check if error is ClientResponseError type of exception
    if (error.response && error.response.data) {
      alert(`${error.message}
${JSON.stringify(error.response.data)}`);
      return;
    }
    alert(error);
  }
};

export default errorHandler;
