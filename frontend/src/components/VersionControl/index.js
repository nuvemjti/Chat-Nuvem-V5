import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Button from "@material-ui/core/Button";
import { Tooltip } from "@material-ui/core";

import { TriangleAlert } from "lucide-react";
import { i18n } from "../../translate/i18n";

const packageVersion = require("../../../package.json").version;

const VersionControl = () => {
  const [storedVersion] = useState(
    window.localStorage.getItem("version") || "0.0.0"
  );

  const handleUpdateVersion = async () => {
    window.localStorage.setItem("version", packageVersion);

    // Mantive apenas para salvar no banco a versao atual
    const { data } = await api.post("/version", {
      version: packageVersion,
    });

    // Limpar o cache do navegador
    caches.keys().then(function (names) {
      for (let name of names) caches.delete(name);
    });

    // Atraso para garantir que o cache foi limpo
    setTimeout(() => {
      window.location.reload(true); // Recarregar a página
    }, 1000);
  };

  return (
    <div
      style={{
        display: "flex",

        justifyContent: "center",
        alignItems: "center",
        width: 35,
        height: 35,
        borderRadius: 20,
        paddingTop: "5px",
      }}
    >
      {storedVersion !== packageVersion && (
        <Tooltip
          title={i18n.t("mainDrawer.appBar.user.newVersion")}
          arrow
          placement="bottom"
        >
          <div onClick={handleUpdateVersion}>
            {" "}
            <TriangleAlert
              style={{
                width: "20px",
                height: "20px",

                color: "#FF0",
                cursor: "pointer",
              }}
            />
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default VersionControl;