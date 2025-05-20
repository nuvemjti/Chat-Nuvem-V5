import {
  ContentCopy,
  Delete,
  Image,
  Message,
  Videocam,
  ArrowForwardIos
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const link =
    process.env.REACT_APP_BACKEND_URL === "https://localhost:8090"
      ? "https://localhost:8090"
      : process.env.REACT_APP_BACKEND_URL;

  const storageItems = useNodeStorage();

  return (
    <div
      style={{ 
        backgroundColor: "#F3E5F5", 
        padding: "8px", 
        borderRadius: "8px",
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#0000FF",
          width: "18px",
          height: "18px",
          top: "20px",
          left: "-12px",
          cursor: 'pointer'
        }}
        onConnect={params => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "3.5px",
            marginBottom: "1px",
            pointerEvents: "none"
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
          gap: 6
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{ width: "12px", height: "12px", color: "#333" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#333" }}
        />
      </div>
      {/* <div style={{position: 'absolute', right: 5, top: 5, cursor: 'pointer'}}>
        <Delete sx={{width: '12px', height: '12px', color: '#ffff'}}/>
      </div> */}
      <div
        style={{
          color: "#333",
          fontSize: "16px",
          flexDirection: "row",
          display: "flex"
        }}
      >
        <Videocam
          sx={{
            width: "16px",
            height: "16px",
            marginRight: "4px",
            marginTop: "4px",
            color: "#9C27B0"
          }}
        />
        <div style={{ color: "#333", fontSize: "16px", fontWeight: "bold" }}>Vídeo</div>
      </div>
      <div style={{ color: "#333", fontSize: "12px", width: 180 }}>
        <video controls="controls" width="180px" style={{ borderRadius: "4px", marginTop: "4px" }}>
          <source src={`${link}/public/${data.url}`} type="video/mp4" />
          seu navegador não suporta HTML5
        </video>
      </div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#0000FF",
          width: "18px",
          height: "18px",
          top: "70%",
          right: "-11px",
          cursor: 'pointer'
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
            pointerEvents: "none"
          }}
        />
      </Handle>
    </div>
  );
});
