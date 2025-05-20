import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
} from "react";
import { SiOpenai } from "react-icons/si";
import typebotIcon from "../../assets/typebot-ico.png";

import MultipleStopIcon from "@mui/icons-material/MultipleStop";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import audioNode from "./nodes/audioNode";
import typebotNode from "./nodes/typebotNode";
import openaiNode from "./nodes/openaiNode";
import messageNode from "./nodes/messageNode.js";
import startNode from "./nodes/startNode";
import menuNode from "./nodes/menuNode";
import intervalNode from "./nodes/intervalNode";
import imgNode from "./nodes/imgNode";
import randomizerNode from "./nodes/randomizerNode";
import videoNode from "./nodes/videoNode";
import questionNode from "./nodes/questionNode";
import switchFlowNode from "./nodes/switchFlowNode";
import attendantNode from "./nodes/attendantNode";
import tagNode from "./nodes/tagNode";
import tagKanbanNode from "./nodes/tagKanbanNode";
import requestNode from "./nodes/requestNode";
import api from "../../services/api";

import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import { Box, CircularProgress } from "@material-ui/core";
import BallotIcon from "@mui/icons-material/Ballot";

import "reactflow/dist/style.css";

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  onElementsRemove,
  useReactFlow,
} from "react-flow-renderer";

import {
  AccessTime,
  CallSplit,
  DynamicFeed,
  Image,
  ImportExport,
  LibraryBooks,
  HeadsetMic,
  Message,
  MicNone,
  RocketLaunch,
  Videocam,
  CloseRounded,
} from "@mui/icons-material";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import RemoveEdge from "./nodes/removeEdge";

import FlowBuilderAddImgModal from "../../components/FlowBuilderAddImgModal";
import FlowBuilderTicketModal from "../../components/FlowBuilderAddTicketModal";
import FlowBuilderAddAudioModal from "../../components/FlowBuilderAddAudioModal";
import FlowBuilderTypebotModal from "../../components/FlowBuilderAddTypebotModal";
import FlowBuilderOpenAIModal from "../../components/FlowBuilderAddOpenAIModal";
import FlowBuilderAddQuestionModal from "../../components/FlowBuilderAddQuestionModal";
import FlowBuilderRandomizerModal from "../../components/FlowBuilderRandomizerModal";
import FlowBuilderAddVideoModal from "../../components/FlowBuilderAddVideoModal";
import FlowBuilderSingleBlockModal from "../../components/FlowBuilderSingleBlockModal";
import FlowBuilderAddTextModal from "../../components/FlowBuilderAddTextModal";
import FlowBuilderIntervalModal from "../../components/FlowBuilderIntervalModal";
import FlowBuilderAddConditionModal from "../../components/FlowBuilderAddConditionModal";
import FlowBuilderMenuModal from "../../components/FlowBuilderMenuModal";
import FlowBuilderAddSwitchFlowModal from "../../components/FlowBuilderAddSwitchFlowModal";
import FlowBuilderTagModal from "../../components/FlowBuilderAddTagModal";
import FlowBuilderAttendantModal from "../../components/FlowBuilderAddAttendantModal";
import FlowBuilderAddRequestHTTPModal from "../../components/FlowBuilderAddRequestHTTPModal";

import { useNodeStorage } from "../../stores/useNodeStorage";
import singleBlockNode from "./nodes/singleBlockNode";
import ticketNode from "./nodes/ticketNode";
import { ConfirmationNumber, SwapHorizontalCircle } from "@material-ui/icons";
import FlowBuilderTagKanbanModal from "../../components/FlowBuilderAddTagKanbanModal";
import { EqualNot } from "lucide-react";
import conditionNode from "./nodes/conditionNode";
import FlowBuilderSidebar from "../../components/FlowBuilderSidebar";
import closeTicketNode from "./nodes/closeTicketNode";
import { FlowVariablesContext } from "../../context/FlowVariables";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    position: "relative",
    backgroundColor: "#F8F9FA",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  speeddial: {
    backgroundColor: "red",
  },
  contentWithSidebar: {
    marginLeft: "80px",
    width: "calc(100% - 256px)",
  },
}));

function geraStringAleatoria(tamanho) {
  var stringAleatoria = "";
  var caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < tamanho; i++) {
    stringAleatoria += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }
  return stringAleatoria;
}

const nodeTypes = {
  message: messageNode,
  start: startNode,
  menu: menuNode,
  interval: intervalNode,
  img: imgNode,
  audio: audioNode,
  randomizer: randomizerNode,
  video: videoNode,
  singleBlock: singleBlockNode,
  ticket: ticketNode,
  typebot: typebotNode,
  openai: openaiNode,
  question: questionNode,
  switchFlow: switchFlowNode,
  attendant: attendantNode,
  tag: tagNode,
  tagKanban: tagKanbanNode,
  condition: conditionNode,
  request: requestNode,
  closeTicket: closeTicketNode,
};

const edgeTypes = {
  buttonedge: RemoveEdge,
};

const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 100 },
    data: { label: "Inicio do fluxo" },
    type: "start",
  },
];

const initialEdges = [];

export const FlowBuilderConfig = () => {
  const classes = useStyles();
  const history = useHistory();
  const { id } = useParams();

  const storageItems = useNodeStorage();

  const { setVariables } = useContext(FlowVariablesContext);


  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [dataNode, setDataNode] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [modalAddText, setModalAddText] = useState(null);
  const [modalAddInterval, setModalAddInterval] = useState(false);
  const [modalAddMenu, setModalAddMenu] = useState(null);
  const [modalAddImg, setModalAddImg] = useState(null);
  const [modalAddAudio, setModalAddAudio] = useState(null);
  const [modalAddRandomizer, setModalAddRandomizer] = useState(null);
  const [modalAddVideo, setModalAddVideo] = useState(null);
  const [modalAddSingleBlock, setModalAddSingleBlock] = useState(null);
  const [modalAddTicket, setModalAddTicket] = useState(null);
  const [modalAddTypebot, setModalAddTypebot] = useState(null);
  const [modalAddOpenAI, setModalAddOpenAI] = useState(null);
  const [modalAddQuestion, setModalAddQuestion] = useState(null);
  const [modalAddSwitchFlow, setModalAddSwitchFlow] = useState(null);
  const [modalAddAttendant, setModalAddAttendant] = useState(null);
  const [modalAddTag, setModalAddTag] = useState();
  const [modalAddTagKanban, setModalAddTagKanban] = useState(null);
  const [modalAddCondition, setModalAddCondition] = useState(null);
  const [modalAddRequestHTTP, setModalAddRequestHTTP] = useState();
  const [modalAddCloseTicket, setModalAddCloseTicket] = useState(null);

  const connectionLineStyle = { stroke: "#2b2b2b", strokeWidth: "6px" };

  const addNode = (type, data) => {
    const posY = nodes[nodes.length - 1].position.y;
    const posX =
      nodes[nodes.length - 1].position.x + nodes[nodes.length - 1].width + 40;
    if (type === "start") {
      return setNodes((old) => {
        return [
          //  ...old.filter((item) => item.id !== "1"),
          {
            id: "1",
            position: { x: posX, y: posY },
            data: { label: "Inicio do fluxo" },
            type: "start",
          },
        ];
      });
    }
    if (type === "text") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { label: data.text },
            type: "message",
          },
        ];
      });
    }
    if (type === "interval") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { label: `Intervalo ${data.sec} seg.`, sec: data.sec },
            type: "interval",
          },
        ];
      });
    }

    if (type === "menu") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: {
              message: data.message,
              arrayOption: data.arrayOption,
            },
            type: "menu",
          },
        ];
      });
    }
    if (type === "img") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url },
            type: "img",
          },
        ];
      });
    }
    if (type === "audio") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url, record: data.record },
            type: "audio",
          },
        ];
      });
    }
    if (type === "randomizer") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { percent: data.percent },
            type: "randomizer",
          },
        ];
      });
    }
    if (type === "video") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url },
            type: "video",
          },
        ];
      });
    }
    if (type === "singleBlock") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "singleBlock",
          },
        ];
      });
    }

    if (type === "ticket") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "ticket",
          },
        ];
      });
    }

    if (type === "typebot") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "typebot",
          },
        ];
      });
    }

    if (type === "openai") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "openai",
          },
        ];
      });
    }

    if (type === "question") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "question",
          },
        ];
      });
    }

    if (type === "switchFlow") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "switchFlow",
          },
        ];
      });
    }
    if (type === "attendant") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "attendant",
          },
        ];
      });
    }

    if (type === "tag") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "tag",
          },
        ];
      });
    }

    if (type === "tagKanban") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "tagKanban",
          },
        ];
      });
    }

    if (type === "condition") {
      console.log(383, "==== | CONDITION | ====", data);
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data.options },
            type: "condition",
          },
        ];
      });
    }

    if (type === "request") {
      console.log("request:data", data);
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "request",
          },
        ];
      });
    }

    if (type === "closeTicket") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "request",
            data: { label: "Fechar Ticket" },
            type: "closeTicket",
          },
        ];
      });
    }
  };

  const textAdd = (data) => {
    addNode("text", data);
  };

  const intervalAdd = (data) => {
    addNode("interval", data);
  };

  const menuAdd = (data) => {
    addNode("menu", data);
  };

  const imgAdd = (data) => {
    addNode("img", data);
  };

  const audioAdd = (data) => {
    addNode("audio", data);
  };

  const randomizerAdd = (data) => {
    addNode("randomizer", data);
  };

  const videoAdd = (data) => {
    addNode("video", data);
  };

  const singleBlockAdd = (data) => {
    addNode("singleBlock", data);
  };

  const ticketAdd = (data) => {
    addNode("ticket", data);
  };

  const typebotAdd = (data) => {
    addNode("typebot", data);
  };

  const openaiAdd = (data) => {
    addNode("openai", data);
  };

  const questionAdd = (data) => {
    addNode("question", data);
  };

  const switchAddFlow = (data) => {
    addNode("switchFlow", data);
  };

  const attendant = (data) => {
    addNode("attendant", data);
  };

  const tag = (data) => {
    addNode("tag", data);
  };

  const tagKanban = (data) => {
    addNode("tagKanban", data);
  };

  const conditionAdd = (data) => {
    addNode("condition", data);
  };

  const requestAdd = (data) => {
    addNode("request", data);
  };

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get(`/flowbuilder/flow/${id}`);
          if (data.flow.flow !== null) {
            const flowNodes = data.flow.flow.nodes;
            setNodes(flowNodes);
            setEdges(data.flow.flow.connections);

            var variables = [];
            const filterQuestionVariables = flowNodes.filter(
              (nd) => nd.type === "question"
            );
            const requestNodes = flowNodes.filter(
              (nd) => nd.type === "request"
            );

            // Pegando os campos "field" dos objetos dentro de "variables"
            const fields = requestNodes.flatMap(
              (obj) => obj.data?.request.variables?.map((v) => v.field) || []
            );

            const questionVar = filterQuestionVariables.map(
              (variable) => variable.data.typebotIntegration.answerKey
            );
      
            variables = [...fields, ...questionVar]

            console.log("variables", variables)

            setVariables(variables);
            
          }
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [id]);

  useEffect(() => {
    if (storageItems.action === "delete") {
      setNodes((old) => old.filter((item) => item.id !== storageItems.node));
      setEdges((old) => {
        const newData = old.filter((item) => item.source !== storageItems.node);
        const newClearTarget = newData.filter(
          (item) => item.target !== storageItems.node
        );
        return newClearTarget;
      });
      storageItems.setNodesStorage("");
      storageItems.setAct("idle");
    }
    if (storageItems.action === "duplicate") {
      const nodeDuplicate = nodes.filter(
        (item) => item.id === storageItems.node
      )[0];
      const maioresX = nodes.map((node) => node.position.x);
      const maiorX = Math.max(...maioresX);
      const finalY = nodes[nodes.length - 1].position.y;
      const nodeNew = {
        ...nodeDuplicate,
        id: geraStringAleatoria(30),
        position: {
          x: maiorX + 240,
          y: finalY,
        },
        selected: false,
        style: { backgroundColor: "#555555", padding: 0, borderRadius: 8 },
      };
      setNodes((old) => [...old, nodeNew]);
      storageItems.setNodesStorage("");
      storageItems.setAct("idle");
    }
  }, [storageItems.action]);

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const saveFlow = async () => {
    await api
      .post("/flowbuilder/flow", {
        idFlow: id,
        nodes: nodes,
        connections: edges,
      })
      .then((res) => {
        toast.success("Fluxo salvo com sucesso");
      });
  };

  const doubleClick = (event, node) => {
    console.log("NODE", node);
    setDataNode(node);
    if (node.type === "message") {
      setModalAddText("edit");
    }
    if (node.type === "interval") {
      setModalAddInterval("edit");
    }

    if (node.type === "menu") {
      setModalAddMenu("edit");
    }
    if (node.type === "img") {
      setModalAddImg("edit");
    }
    if (node.type === "audio") {
      setModalAddAudio("edit");
    }
    if (node.type === "randomizer") {
      setModalAddRandomizer("edit");
    }
    if (node.type === "singleBlock") {
      setModalAddSingleBlock("edit");
    }
    if (node.type === "ticket") {
      setModalAddTicket("edit");
    }
    if (node.type === "typebot") {
      setModalAddTypebot("edit");
    }
    if (node.type === "openai") {
      setModalAddOpenAI("edit");
    }
    if (node.type === "question") {
      setModalAddQuestion("edit");
    }
    if (node.type === "switchFlow") {
      setModalAddSwitchFlow("edit");
    }
    if (node.type === "attendant") {
      setModalAddAttendant("edit");
    }

    if (node.type === "tag") {
      setModalAddTag("edit");
    }

    if (node.type === "tagKanban") {
      setModalAddTagKanban("edit");
    }

    if (node.type === "condition") {
      setModalAddCondition("edit");
    }

    if (node.type === "request") {
      setModalAddRequestHTTP("edit");
    }
  };

  const clickNode = (event, node) => {
    setNodes((old) =>
      old.map((item) => {
        if (item.id === node.id) {
          return {
            ...item,
            style: { backgroundColor: "#0000FF", padding: 1, borderRadius: 8 },
          };
        }
        return {
          ...item,
          style: { backgroundColor: "#13111C", padding: 0, borderRadius: 8 },
        };
      })
    );
  };
  const clickEdge = (event, node) => {
    setNodes((old) =>
      old.map((item) => {
        return {
          ...item,
          style: { backgroundColor: "#13111C", padding: 0, borderRadius: 8 },
        };
      })
    );
  };

  const updateNode = (dataAlter) => {
    console.log("========| UPDATE NODE |========");
    console.log(dataAlter);
    console.log("===============================");
    setNodes((old) =>
      old.map((itemNode) => {
        if (itemNode.id === dataAlter.id) {
          return dataAlter;
        }
        return itemNode;
      })
    );
    setModalAddText(null);
    setModalAddInterval(null);
    setModalAddMenu(null);
    setModalAddOpenAI(null);
    setModalAddTypebot(null);
    setModalAddSwitchFlow(null);
    setModalAddTag(null);
  };

  const actions = [
    {
      icon: (
        <RocketLaunch
          style={{
            color: "#3ABA38",
          }}
        />
      ),
      name: "Inicio",
      type: "start",
    },
    {
      icon: (
        <LibraryBooks
          style={{
            color: "#EC5858",
          }}
        />
      ),
      name: "Conteúdo",
      type: "content",
    },
    {
      icon: (
        <DynamicFeed
          style={{
            color: "#683AC8",
          }}
        />
      ),
      name: "Menu",
      type: "menu",
    },
    {
      icon: (
        <CallSplit
          style={{
            color: "#1FBADC",
          }}
        />
      ),
      name: "Randomizador",
      type: "random",
    },
    {
      icon: (
        <AccessTime
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Intervalo",
      type: "interval",
    },
    {
      icon: (
        <ConfirmationNumber
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Ticket",
      type: "ticket",
    },
    {
      icon: (
        <Box
          component="img"
          style={{
            width: 24,
            height: 24,
            color: "#3aba38",
          }}
          src={typebotIcon}
          alt="icon"
        />
      ),
      name: "TypeBot",
      type: "typebot",
    },
    {
      icon: (
        <SiOpenai
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "OpenAI",
      type: "openai",
    },
    {
      icon: (
        <BallotIcon
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Pergunta",
      type: "question",
    },
    {
      icon: (
        <MultipleStopIcon
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "TrocarFlow",
      type: "switchFlow",
    },
    {
      icon: (
        <HeadsetMic
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Attendant",
      type: "attendant",
    },
    {
      icon: (
        <LocalOfferIcon
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Tag",
      type: "tag",
    },
    {
      icon: (
        <LocalOfferIcon
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "TagKanban",
      type: "tagKanban",
    },
    {
      icon: (
        <SwapHorizontalCircle
          style={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Condição",
      type: "condition",
    },
    {
      icon: (
        <CloseRounded
          style={{
            color: "#F44336",
          }}
        />
      ),
      name: "Fechar Ticket",
      type: "closeTicket",
    },
  ];

  const clickActions = (type) => {
    switch (type) {
      case "start":
        addNode("start");
        break;
      case "content":
        setModalAddSingleBlock("create");
        break;
      case "menu":
        setModalAddMenu("create");
        break;
      case "random":
        setModalAddRandomizer("create");
        break;
      case "interval":
        setModalAddInterval("create");
        break;
      case "ticket":
        setModalAddTicket("create");
        break;
      case "typebot":
        setModalAddTypebot("create");
        break;
      case "openai":
        setModalAddOpenAI("create");
        break;
      case "question":
        setModalAddQuestion("create");
        break;
      case "switchFlow":
        setModalAddSwitchFlow("create");
        break;
      case "attendant":
        setModalAddAttendant("create");
        break;
      case "tag":
        setModalAddTag("create");
        break;
      case "tagKanban":
        setModalAddTagKanban("create");
        break;
      case "condition":
        setModalAddCondition("create");
        break;
      case "img":
        setModalAddImg("create");
        break;
      case "audio":
        setModalAddAudio("create");
        break;
      case "video":
        setModalAddVideo("create");
        break;
      case "closeTicket":
        addNode("closeTicket");
        break;
      case "request":
        setModalAddRequestHTTP("create");
        break;
      default:
        break;
    }
  };

  return (
    <Stack sx={{ height: "100vh" }}>
      <FlowBuilderAddTextModal
        open={modalAddText}
        onSave={textAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddText}
      />
      <FlowBuilderIntervalModal
        open={modalAddInterval}
        onSave={intervalAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddInterval}
      />
      <FlowBuilderMenuModal
        open={modalAddMenu}
        onSave={menuAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddMenu}
      />
      <FlowBuilderAddImgModal
        open={modalAddImg}
        onSave={imgAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddImg}
      />
      <FlowBuilderAddAudioModal
        open={modalAddAudio}
        onSave={audioAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddAudio}
      />
      <FlowBuilderRandomizerModal
        open={modalAddRandomizer}
        onSave={randomizerAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddRandomizer}
      />
      <FlowBuilderAddVideoModal
        open={modalAddVideo}
        onSave={videoAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddVideo}
      />
      <FlowBuilderSingleBlockModal
        open={modalAddSingleBlock}
        onSave={singleBlockAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddSingleBlock}
      />
      <FlowBuilderTicketModal
        open={modalAddTicket}
        onSave={ticketAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTicket}
      />

      <FlowBuilderOpenAIModal
        open={modalAddOpenAI}
        onSave={openaiAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddOpenAI}
      />

      <FlowBuilderTypebotModal
        open={modalAddTypebot}
        onSave={typebotAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTypebot}
      />

      <FlowBuilderAddQuestionModal
        open={modalAddQuestion}
        onSave={questionAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddQuestion}
      />
      <FlowBuilderAddSwitchFlowModal
        open={modalAddSwitchFlow}
        onSave={switchAddFlow}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddSwitchFlow}
      />
      <FlowBuilderAttendantModal
        open={modalAddAttendant}
        onSave={attendant}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddAttendant}
      />
      <FlowBuilderTagModal
        open={modalAddTag}
        onSave={tag}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTag}
      />

      <FlowBuilderTagKanbanModal
        open={modalAddTagKanban}
        onSave={tagKanban}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTagKanban}
      />

      <FlowBuilderAddConditionModal
        open={modalAddCondition}
        onSave={conditionAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddCondition}
      />

      <FlowBuilderAddRequestHTTPModal
        open={modalAddRequestHTTP}
        onSave={requestAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddRequestHTTP}
      />

      <MainHeader>
        <Title>Desenhe seu fluxo</Title>
      </MainHeader>
      {!loading && (
        <Paper
          className={classes.mainPaper}
          variant="outlined"
          onScroll={handleScroll}
        >
          <Stack direction="row" style={{ height: "100%" }}>
            <FlowBuilderSidebar onNodeSelect={clickActions} />

            <Box style={{ width: "100%", padding: "10px", marginLeft: "80px" }}>
              <Stack
                sx={{
                  position: "relative",
                  justifyContent: "center",
                  flexDirection: "row",
                  width: "100%",
                  marginBottom: "10px",
                }}
              >
                <Typography
                  style={{ color: "#010101", textShadow: "#010101 1px 0 10px" }}
                >
                  Não se esqueça de salvar seu fluxo!
                </Typography>
              </Stack>

              <Stack
                direction={"row"}
                justifyContent={"end"}
                style={{ marginBottom: "10px" }}
              >
                <Button
                  sx={{ textTransform: "none" }}
                  variant="contained"
                  color="primary"
                  onClick={() => saveFlow()}
                >
                  Salvar
                </Button>
              </Stack>

              <Box
                style={{
                  height: "calc(100% - 80px)",
                  position: "relative",
                  display: "flex",
                }}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  deleteKeyCode={["Backspace", "Delete"]}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeDoubleClick={doubleClick}
                  onNodeClick={clickNode}
                  onEdgeClick={clickEdge}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                  connectionLineStyle={connectionLineStyle}
                  style={{
                    backgroundColor: "#F8F9FA",
                    width: "100%",
                    height: "100%",
                  }}
                  edgeTypes={edgeTypes}
                  variant={"cross"}
                  defaultEdgeOptions={{
                    style: { color: "#ff0000", strokeWidth: "6px" },
                    animated: false,
                  }}
                >
                  <Controls />
                  <MiniMap />
                  <Background variant="dots" gap={12} size={-1} />
                </ReactFlow>

                <Stack
                  style={{
                    backgroundColor: "#FAFAFA",
                    height: "20px",
                    width: "58px",
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    zIndex: 1111,
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}
      {loading && (
        <Stack justifyContent={"center"} alignItems={"center"} height={"70vh"}>
          <CircularProgress />
        </Stack>
      )}
    </Stack>
  );
};
