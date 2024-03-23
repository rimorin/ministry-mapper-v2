import type { Preview } from "@storybook/react";
import "./../src/css/admin.css";
import "./../src/css/common.css";
import "./../src/css/main.css";
import "./../src/css/slip.css";
import "react-calendar/dist/Calendar.css";
import { mockDateDecorator } from "storybook-mock-date-decorator";
export const decorators = [mockDateDecorator];

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  }
};

export default preview;
