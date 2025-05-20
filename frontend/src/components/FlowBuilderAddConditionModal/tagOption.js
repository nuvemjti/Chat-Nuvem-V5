import React, { useState, useRef } from "react";
import { Trash } from "lucide-react";
import {
  Button,
  Box,
} from "@mui/material";


export const TagOption = () => {    
    const inputRef = useRef(); // Reference to the custom select input element
const [ticketLabel, setTicketLabel] = useState(`Igual ➡`);
    const [showMenu, setShowMenu] = useState(false); // Controls the visibility of the dropdown menu
    const closeSelectView = (e) => {
      setShowMenu(!showMenu);
    };
  
    const updateTicketLabel = (booleanLabel, ticketLabel) => {
      setTicketLabel(`${booleanLabel} ➡ ${ticketLabel}`);
    };
  
    // Icon component
    const Icon = () => {
      return (
        <Button>
          <Trash size={14} />
        </Button>
      );
    };
  
    return (
      <Box display="flex" flexDirection="column" gap={2} width={300}>
        <Box
          sx={{
            padding: "18px",
          }}
        >
          <Box
            sx={{
              border: "solid 1px #ccc",
              py: "20px",
              px: "10px",
              fontSize: 16,
              fontFamily: "sans-serif",
              cursor: "default",
              borderRadius: 2,
            }}
            ref={inputRef}
            onClick={closeSelectView}
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <div>{ticketLabel}</div>
            <Box>
              <div className="dropdown-tool">
                <Icon isOpen={showMenu} />
              </div>
            </Box>
          </Box>
        </Box>
      </Box>
    )
}