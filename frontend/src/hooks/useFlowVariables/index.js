import { useState } from "react";

const useFlowVariables = () => {
    const [variables, setStoredVariables] = useState([]);
  
    console.log("useFlowVariables", variables)
    const setVariables = variables => {
        setStoredVariables(variables)
    }

    const updatedVariables = newVar => {
      setStoredVariables([...variables, newVar])
    }
    
    return {
      updatedVariables,
      variables,
      setVariables
    };
  };
  
  export default useFlowVariables;