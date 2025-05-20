import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  ConfirmationNumber,
} from "@mui/icons-material";
import React, { memo } from "react";
import TextField from "@mui/material/TextField";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";
import { Typography, Box } from "@material-ui/core";
import { SiOpenai } from "react-icons/si";
import { SwapHorizontalCircle } from "@material-ui/icons";
import { labels } from "../../../components/FlowBuilderAddConditionModal/constants";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  console.log(12, "ticketNode", data);
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
        border: "1px solid rgba(33, 94, 151, 0.25)",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#0872b9",
          width: "18px",
          height: "18px",
          top: "20px",
          left: "-12px",
          cursor: "pointer",
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: "none",
          }}
        />
      </Handle>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6,
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{ width: "12px", height: "12px", color: "#F7953B" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#F7953B" }}
        />
      </div>
      <div
        style={{
          color: "#ededed",
          fontSize: "16px",
          flexDirection: "row",
          display: "flex",
        }}
      >
        <SwapHorizontalCircle
          sx={{
            width: "16px",
            height: "16px",
            marginRight: "4px",
            marginTop: "4px",
            color: "#3aba38",
          }}
        />
        <div style={{ color: "#232323", fontSize: "16px" }}>Condição</div>
      </div>
      <div style={{ color: "#232323", fontSize: "12px", width: 250 }}>
        <div
          style={{
            marginBottom: "3px",
            borderRadius: "5px",
          }}
        >
          <div
            style={{
              gap: "20px",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {data.options.map((option) => (
              <div
                style={{
                  textAlign: "end",
                  backgroundColor: "#d8e2dc",
                  display: "grid",
                  borderRadius: "4px",
                  padding: "6px",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                  }}
                >
{labels[option.type]}                </span>
                <Box
                  sx={{
                    display: "grid",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      opacity: 0.9,
                    }}
                  >
                    {option.primaryCondition}
                  </span>
                  {option.type === "dayOfWeek" && (
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {option.variableName}
                    </span>
                  )}
                </Box>
              </div>
            ))}
            <Handle
              type="source"
              position="right"
              id={"positive"}
              style={{
                top: 50,
                background: "#0000FF",
                width: "18px",
                height: "18px",
                right: "-11px",
                cursor: "pointer",
              }}
              isConnectable={isConnectable}
            >
              <ArrowForwardIos
                sx={{
                  color: "#ffff",
                  width: "10px",
                  height: "10px",
                  marginLeft: "2.9px",
                  marginBottom: "1px",
                  pointerEvents: "none",
                }}
              />
            </Handle>
            <div
              style={{
                display: "flex",
                textAlign: "end",
                justifyContent: "end",
              }}
            >
              <span>Caso não atenda a condição o fluxo continua por aqui</span>
              <Handle
                type="source"
                position="right"
                id="negative"
                style={{
                  background: "#bc4749",
                  width: "18px",
                  height: "18px",
                  top: "70%",
                  right: "-11px",
                  cursor: "pointer",
                }}
                isConnectable={isConnectable}
              >
                <ArrowForwardIos
                  sx={{
                    color: "#ffff",
                    width: "10px",
                    height: "10px",
                    marginLeft: "2.9px",
                    marginBottom: "1px",
                    pointerEvents: "none",
                  }}
                />
              </Handle>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
