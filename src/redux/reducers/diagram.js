import {
  ADD_CONSTANT_NODE,
  ADD_DOMAIN_NODE, RENAME_DOMAIN_NODE, CHECK_BAD_NAME, REMOVE_CONSTANT_NODE,
  REMOVE_DOMAIN_NODE,
  SET_DIAGRAM,
  SYNC_DIAGRAM, SYNC_MATH_STATE, TOGGLE_EDITABLE_NODES
} from "../actions/action_types";
import {UnBinaryNodeModel} from "../../graph_view/nodes/unbinary/UnBinaryNodeModel";
import {INPORT, UNBINARY} from "../../graph_view/nodes/ConstantNames";
import {ConstantNodeModel} from "../../graph_view/nodes/constant/ConstantNodeModel";
import {DefaultLinkModel} from "@projectstorm/react-diagrams-defaults";
import {DiagramModel} from "@projectstorm/react-diagrams";
import {BinaryLinkModel} from "../../graph_view/links/binary/BinaryLinkModel";
import {DiagramApplication} from "../../graph_view/DiagramAplication";


//let state = {};

export function defaultState(){
  let diagramModel = new DiagramModel();
  return{
    diagramModel: diagramModel,
    diagramEngine: new DiagramApplication(diagramModel).diagramEngine,
    domainNodes: new Map(),
    constantNodes: new Map(),
    functionNodes: new Map(),
    editableNodes: {
      editable:false
    }
  }
}

function diagramReducer(state, action) {
  //console.log("before",s);
  //state = copyState(s);
  //console.log("after",state);

  switch (action.type) {
    case SET_DIAGRAM:
      state.diagramModel = action.diagramModel;
      return state;
    case SYNC_DIAGRAM:
      syncDomain(action.value);
      syncPredicates(action.value);
      syncConstants(action.value);
      return state;
    case ADD_DOMAIN_NODE:
      state.domainNodes.set(action.nodeName,action.nodeObject);
      return state;
    case REMOVE_DOMAIN_NODE:
      state.domainNodes.delete(action.nodeName);
      return state;
    case ADD_CONSTANT_NODE:
      state.constantNodes.set(action.nodeName,action.nodeObject);
      return state;
    case REMOVE_CONSTANT_NODE:
      state.constantNodes.delete(action.nodeName);
      return state;
    case CHECK_BAD_NAME:
      checkIfNameCanBeUsed(state,action);
      return state;
    case RENAME_DOMAIN_NODE:
      state.domainNodes.set(action.value,state.domainNodes.get(action.oldValue));
      state.domainNodes.delete(action.oldValue);
      return state;
    case SYNC_MATH_STATE:
      deleteAllLabels(state);
      return state;
    case TOGGLE_EDITABLE_NODES:
      state.editableNodes.editable = action.value;
        //state.editableNodes = {editable:action.value};
      return state;
    default:
      return state;
  }
}

const copyState = (state) => ({
  diagramModel: state.diagramModel,
  diagramEngine: state.diagramEngine,
  /*domainNodes: {...state.domainNodes},
  constantNodes: {...state.constantNodes},
  functionNodes: {...state.functionNodes},*/
  domainNodes: state.domainNodes,
  constantNodes: state.constantNodes,
  functionNodes: state.functionNodes,
  editableNodes:{...state.editableNodes}
});

function deleteAllLabels(action) {
  for (let a = 0; a < action.diagramModel.getNodes().length; a++) {
    let node = action.diagramModel.getNodes()[a];
    for (let [portName, port] of Object.entries(node.getPorts())) {
      for (let [linkName, link] of Object.entries(port.getLinks())) {
        if (link instanceof BinaryLinkModel) {
          link.clearLabels();
        }
      }
    }
  }
}

function checkIfNameCanBeUsed(state,action){
  if(action.oldName === action.newName){
    action.nodeBadNameSetState(false);
    return;
  }

  if(action.newName.length === 0 ){
    action.nodeBadNameSetState(true);
    return;
  }

  if(action.newName.includes(",")){
    action.nodeBadNameSetState(true);
    return;
  }

  let nodes;
  if(action.nodeType === UNBINARY){
    nodes = state.domainNodes;
  }
  //REWORK
  else{
    nodes = state.constantNodes;
  }

  if(nodes.has(action.newName)){
    action.nodeBadNameSetState(true);
  }
  else{
    action.nodeBadNameSetState(false);
  }
}

function createNode(nodeObject,nodeName,nameOfSet,diagramModel,diagramCanvas){
  let canvasWidth = diagramCanvas.clientWidth;
  let canvasHeight = diagramCanvas.clientHeight;

  nodeObject.setPosition(Math.random() * (canvasWidth - canvasWidth * 0.1) + canvasWidth * 0.05, Math.random() * (canvasHeight - canvasHeight * 0.1) + canvasHeight * 0.05);
  addNodeState(nodeName, nodeObject, nameOfSet);
  diagramModel.addNode(nodeObject);
}

function createLink(sourcePort,targetPort,diagramModel){
  let link = new DefaultLinkModel();
  link.setSourcePort(sourcePort);
  link.setTargetPort(targetPort);
  diagramModel.addAll(link);
}

function syncConstants(values){
  if(values.structure.constants!== null){
    let constantObjects = new Map(Object.entries(values.structure.constants));
    let constantState = values.diagramState.constantNodes;
    let domainState = values.diagramState.domainNodes;
    let diagramModel = values.diagramState.diagramModel;
    let diagramCanvas = values.diagramState.diagramEngine.getCanvas();

    for(let [nodeName,nodeObject] of constantState.entries()) {
      if (!constantObjects.has(nodeName)) {
        removeNodeState(nodeName, constantState);
        removeWholeNode(nodeObject, diagramModel);
      }
    }

    for(let [nodeName,nodeProperties] of constantObjects.entries()) {
      if(!constantState.has(nodeName)) {
        let node = new ConstantNodeModel(nodeName, 'rgb(92,192,125)', {
          "renameDomainNode":values.renameDomainNode,
          "addConstantNode":values.addConstantNode,
          "removeConstantNode":values.removeConstantNode
        });
        createNode(node,nodeName,constantState,diagramModel,diagramCanvas);
        if(nodeProperties.value.length!==0){
          createLink(node.getConstantPort(),domainState.get(nodeProperties.value).getPort(INPORT),diagramModel);
        }
      }
      else{
        let nodeObject = constantState.get(nodeName);
        nodeObject.removeAllLinks();
        if(nodeProperties.value.length!==0){
          createLink(nodeObject.getConstantPort(),domainState.get(nodeProperties.value).getPort(INPORT),diagramModel);
        }
      }
    }
  }
}

function addNodeState(nodeName,nodeObject,nodeSet){
  nodeSet.set(nodeName,nodeObject);
}

function removeNodeState(nodeName,nodeSet){
  nodeSet.delete(nodeName);
}

function clearDiagramState(values){
  values.diagramState.domainNodes.clear();
  values.diagramState.constantNodes.clear();
  values.diagramState.functionNodes.clear();
}

function clearCertainNodeState(nodeState){
  nodeState.clear();
}

//atm refers all predicates to have unary level
function syncPredicates(values) {
  let predicatesObjects = values.structure.predicates;
  let domainState = values.diagramState.domainNodes;
  let portMap = new Map();

  if (predicatesObjects && Object.keys(predicatesObjects).length > 0) {
    for (let [key, value] of Object.entries(predicatesObjects)) {
      let parsedNodeValues = value.parsed;
      if (parsedNodeValues) {
        let keyWithoutArity = key.split('/')[0];
        let arityWithoutKey = key.split('/')[1];

        if (arityWithoutKey === '1') {
          parsedNodeValues.map((currentNodeVal) => {
            let currentNodeValue = currentNodeVal[0];
            if (portMap.has(currentNodeValue)) {
              portMap.get(currentNodeValue).add(keyWithoutArity);
            } else {
              portMap.set(currentNodeValue, new Set());
              portMap.get(currentNodeValue).add(keyWithoutArity);
            }
          });
        } else {

        }
      }

      for (let [currentNodeName, currentNodeObject] of domainState.entries()) {

        let setOfPredicatesForNode = portMap.get(currentNodeName);
        let nodePredicates = currentNodeObject.getUnaryPredicates();

        if (portMap.has(currentNodeName)) {
          for(let predicateName of setOfPredicatesForNode){
            if (!nodePredicates.has(predicateName)) {
              currentNodeObject.addUnaryPredicateToSet(predicateName);
            }
          }
        }

        for (let predicate of nodePredicates) {
          if (!setOfPredicatesForNode || !setOfPredicatesForNode.has(predicate)) {
            currentNodeObject.removeUnaryPredicateFromSet(predicate);
          }
        }
      }
    }
  }
  else{
    for (let [currentNodeName,currentNodeObject] of domainState.entries()) {
      currentNodeObject.clearPredicates();
    }
  }
}

function syncDomain(values) {
  let domain = (values.domain);
  let domainState = values.diagramState.domainNodes;
  let diagramModel = values.diagramState.diagramModel;
  let diagramCanvas = values.diagramState.diagramEngine.getCanvas();

  if (domain == null || domain.length === 0) {
    for(let node of domainState.values()){
      removeWholeNode(node, diagramModel);
    }
    clearCertainNodeState(domainState);
    return;
  }

  let existingDomainNodes = [];

  for (let [nodeName, nodeObject] of domainState.entries()) {
    if (domain.includes(nodeName)) {
      existingDomainNodes.push(nodeName);
    } else {
      removeNodeState(nodeName, domainState);
      removeWholeNode(nodeObject, diagramModel);
    }
  }

  domain.map(nodeName => {
    if (!existingDomainNodes.includes(nodeName)) {
      let node = new UnBinaryNodeModel(nodeName, 'rgb(92,192,125)', {
        "renameDomainNode": values.renameDomainNode,
        "addDomainNode":values.addDomainNode,
        "removeDomainNode":values.removeDomainNode,
        "checkBadName":values.checkBadName,
        "addUnaryPredicate":values.addUnaryPredicate,
        "removeUnaryPredicate":values.removeUnaryPredicate
      });
      createNode(node,nodeName,domainState,diagramModel,diagramCanvas);
    }
  });
}

function removeWholeNode(node,diagramModel){
  for(let portObject of Object.values(node.getPorts())){
    node.removePort(portObject); //ensures that all links are deleted
  }
 diagramModel.removeNode(node);
}

export default diagramReducer;