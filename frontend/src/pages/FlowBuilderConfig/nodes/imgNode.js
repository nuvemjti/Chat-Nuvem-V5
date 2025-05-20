import { ContentCopy, Delete, Image, Message, ArrowForwardIos } from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {

  const link = process.env.REACT_APP_BACKEND_URL === 'https://localhost:8090' ? 'https://localhost:8090' : process.env.REACT_APP_BACKEND_URL

  const storageItems = useNodeStorage();

  return (
    <div style={{backgroundColor: '#E8F5E9', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} >
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
        onConnect={(params) => console.log("handle onConnect", params)}
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
      <div style={{color: '#333', fontSize: '16px', flexDirection: 'row', display: 'flex'}}>
        <Image sx={{width: '16px', height: '16px', marginRight: '4px', marginTop: '4px', color: '#1976d2'}}/>
        <div style={{color: '#333', fontSize: '16px', fontWeight: 'bold'}}>
        Imagem
        </div>
      </div>
      <div style={{color: '#333', fontSize: '12px', width: 180}}>
        <img src={`${link}/public/${data.url}`} style={{width: '180px', borderRadius: '4px', marginTop: '4px'}} />
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
