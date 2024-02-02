import { Transition } from "react-transition-group";
import { Box } from "@mui/material";
import React from "react";

interface TransitionProps {
  in?: boolean;
  timeout?: number;
  height?: number;
}

type TransitionStatus =
  | "entering"
  | "entered"
  | "exiting"
  | "exited"
  | "unmounted";

const withTransition = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return ({
    in: inProp,
    timeout,
    height = 100,
    ...props
  }: P & TransitionProps) => (
    <Transition
      in={inProp}
      timeout={timeout || 500}
      addEndListener={() => {
        return;
      }}
    >
      {(state: TransitionStatus) => (
        <Box
          sx={{
            transition: `opacity 300ms ease-in-out, height 500ms ease-in-out, transform 500ms ease-in-out`,
            ...{
              entering: {
                opacity: 1,
                height: height,
                transform: "translateY(0)"
              },
              entered: {
                opacity: 1,
                height: height,
                transform: "translateY(0)"
              },
              exiting: {
                opacity: 0,
                height: 0,
                transform: "translateY(-50%)"
              },
              exited: {
                opacity: 0,
                height: 0,
                transform: "translateY(-50%)"
              },
              unmounted: {
                opacity: 0,
                height: 0,
                transform: "translateY(-50%)"
              }
            }[state]
          }}
        >
          <WrappedComponent {...(props as P)} />
        </Box>
      )}
    </Transition>
  );
};

export default withTransition;
