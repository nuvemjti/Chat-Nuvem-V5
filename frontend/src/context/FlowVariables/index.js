import React, { createContext, useContext, useState } from "react";
import useFlowVariables from "../../hooks/useFlowVariables";

const FlowVariablesContext = createContext({});

const FlowVariablesProvider = ({ children }) => {
  const {variables, setVariables} = useFlowVariables();


  return (
    <FlowVariablesContext.Provider
      value={{
        variables,
        setVariables,
      }}
    >
      {children}
    </FlowVariablesContext.Provider>
  );
};

export { FlowVariablesProvider, FlowVariablesContext };