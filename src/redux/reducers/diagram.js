import {
  ADD_CONSTANT_NODE,
  ADD_DOMAIN_NODE,
  RENAME_DOMAIN_NODE,
  REMOVE_CONSTANT_NODE,
  REMOVE_DOMAIN_NODE,
  SET_DIAGRAM,
  SYNC_DIAGRAM,
  SYNC_MATH_STATE,
  TOGGLE_EDITABLE_NODES,
  RENAME_CONSTANT_NODE,
  ADD_QUATERNARY_NODE,
  ADD_TERNARY_NODE, IMPORT_APP, IMPORT_DIAGRAM_STATE, REMOVE_QUATERNARY_NODE, REMOVE_TERNARY_NODE
} from "../actions/action_types";
import {UnBinaryNodeModel} from "../../graph_view/nodes/unbinary/UnBinaryNodeModel";
import {
  BASIC_CURVYNESS,
  BOTH,
  FROM,
  FUNCTION,
  PREDICATE, QUATERNARY,
  TERNARY,
  TO,
  UNBINARY
} from "../../graph_view/nodes/ConstantNames";
import {ConstantNodeModel} from "../../graph_view/nodes/constant/ConstantNodeModel";
import {DiagramModel} from "@projectstorm/react-diagrams";
import {BinaryLinkModel} from "../../graph_view/links/binary/BinaryLinkModel";
import {DiagramApplication} from "../../graph_view/DiagramAplication";
import _ from "lodash";
import {TernaryNodeModel} from "../../graph_view/nodes/ternary/TernaryNodeModel";

export function defaultState(){
  let diagramModel = new DiagramModel();
  return{
    diagramModel: diagramModel,
    diagramEngine: new DiagramApplication(diagramModel).diagramEngine,
    domainNodes: new Map(),
    constantNodes: new Map(),
    ternaryNodes: new Map(),
    quaternaryNodes: new Map(),
    editableNodes: false
  }
}

function diagramReducer(state, action) {
  switch (action.type) {
    case SET_DIAGRAM:
      state.diagramModel = action.diagramModel;
      return state;
    case SYNC_DIAGRAM:
      syncDomain(action.value,action.focusOnBodyFunc);
      syncLabels(state);
      syncPredicates(action.value,action.focusOnBodyFunc);
      syncFunctions(action.value,action.focusOnBodyFunc);
      syncConstants(action.value,action.focusOnBodyFunc);
      return state;
    case ADD_DOMAIN_NODE:
      state.domainNodes.set(action.nodeName, action.nodeObject);
      return state;
    case RENAME_DOMAIN_NODE:
      state.domainNodes.set(action.newName, state.domainNodes.get(action.oldName));
      state.domainNodes.delete(action.oldName);
      return state;
    case REMOVE_DOMAIN_NODE:
      state.domainNodes.delete(action.nodeName);
      return state;
    case ADD_CONSTANT_NODE:
      state.constantNodes.set(action.nodeName, action.nodeObject);
      return state;
    case RENAME_CONSTANT_NODE:
      state.constantNodes.set(action.newName, state.constantNodes.get(action.oldName));
      state.constantNodes.delete(action.oldName);
      return state;
    case REMOVE_CONSTANT_NODE:
      state.constantNodes.delete(action.nodeName);
      return state;
    case ADD_TERNARY_NODE:
      state.ternaryNodes.set(action.nodeName,action.nodeObject);
      return state;
    case REMOVE_TERNARY_NODE:
      state.ternaryNodes.delete(action.nodeName);
      return state;
    case ADD_QUATERNARY_NODE:
      state.quaternaryNodes.set(action.nodeName,action.nodeObject);
      return state;
    case REMOVE_QUATERNARY_NODE:
      state.quaternaryNodes.delete(action.nodeName);
      return state;
    case SYNC_MATH_STATE:
      deleteAllLabels(state);
      return state;
    case TOGGLE_EDITABLE_NODES:
      let nodeArray = state.diagramModel.getNodes();
      for (let a = 0; a < nodeArray.length; a++) {
        nodeArray[a].changeEditableState(action.value);
      }

      let linkArray = state.diagramModel.getLinks();
      for (let i = 0; i < linkArray.length; i++) {
        let labelArray = linkArray[i].getLabels();
        for (let y = 0; y < labelArray.length; y++) {
          labelArray[y].changeEditableState(action.value);
        }
      }
      state.diagramEngine.repaintCanvas();
      return {...state, editableNodes: action.value};

    case IMPORT_APP:
      let diagramModel = new DiagramModel();
      state.diagramEngine.setModel(diagramModel);
      clearDiagramState(state);
      return {...state,diagramModel:diagramModel,diagramCordState:JSON.parse(action.content).diagramCordState,imported:true};

    case IMPORT_DIAGRAM_STATE:
      syncDomain(action.state,action.focusOnBodyFunc);
      syncLabels(state);
      syncPredicates(action.state);
      syncFunctions(action.state);
      syncConstants(action.state,action.focusOnBodyFunc);
      syncNodesCords(state);
      return {...state,imported:false};
    default:
      return state;
  }
}

function syncNodesCords(state){
  let nodeState = new Map([["domainNodes", state.domainNodes],["constantNodes", state.constantNodes],["ternaryNodes", state.ternaryNodes],["quaternaryNodes",state.quaternaryNodes]]);
  let diagramCordState = state.diagramCordState;

  for(let mapName of nodeState.keys()){
    for(let [nodeName,nodeObject] of nodeState.get(mapName).entries()){
      if(diagramCordState.hasOwnProperty(mapName)){
        if(diagramCordState[mapName].hasOwnProperty(nodeName)){
          let cord = diagramCordState[mapName][nodeName];
          nodeObject.setPosition(cord.x,cord.y);
        }
      }
    }
  }
  state.diagramEngine.repaintCanvas();
}

function syncLabels(state){
  let linkArray = state.diagramModel.getLinks();
  for (let i = 0; i<linkArray.length;i++) {
    if(linkArray[i].label && linkArray[i].getLabels().length === 0){
      linkArray[i].addLabel(linkArray[i].label);
    }
  }
}

function deleteAllLabels(action) {
  let linkArray = action.diagramModel.getLinks();
  for(let i = 0; i<linkArray.length;i++){
    if (linkArray[i] instanceof BinaryLinkModel) {
      linkArray[i].clearLabels();
    }
  }
}

function createNode(nodeObject,nodeName,nodeSet,diagramModel,diagramCanvas){
  let canvasWidth = diagramCanvas.clientWidth;
  let canvasHeight = diagramCanvas.clientHeight;

  nodeObject.setPosition(Math.random() * (canvasWidth - canvasWidth * 0.2) + canvasWidth * 0.05, Math.random() * (canvasHeight - canvasHeight * 0.2) + canvasHeight * 0.05);

  addNodeState(nodeName, nodeObject, nodeSet);
  diagramModel.addNode(nodeObject);
}

function createLink(sourcePort,targetPort,diagramModel){
  let link = new BinaryLinkModel({},false);
  link.setSourcePort(sourcePort);
  link.setTargetPort(targetPort);
  diagramModel.addAll(link);
  return link;
}

function createLabel(linkWhereLabelShouldBeAdded){
  let label = new BinaryLinkModel({},false);
  if(linkWhereLabelShouldBeAdded.getTargetPort().getNode() === linkWhereLabelShouldBeAdded.getSourcePort().getNode()){
    label.setCurvyness(BASIC_CURVYNESS);
  }
  linkWhereLabelShouldBeAdded.addLabel(label);
}

function syncConstants(values,focusOnBodyFunc){
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
          "addConstantNode": values.addConstantNode,
          "renameConstantNode": values.renameConstantNode,
          "removeConstantNode": values.removeConstantNode,
          "setConstantValueFromLink": values.setConstantValueFromLink,
          "focusOnBodyElement": focusOnBodyFunc,
          "store": values.store,
        });
        createNode(node,nodeName,constantState,diagramModel,diagramCanvas);
        if(nodeProperties.value.length!==0){
          createLink(node.getMainPort(),domainState.get(nodeProperties.value).getMainPort(),diagramModel);
        }
      }
      else{
        let nodeObject = constantState.get(nodeName);

        //When entity is removed it would cause a dispatch of another Redux Function and we would get error, by setting callReduxFunc on false we will avoid this problem
        interruptCallingReduxFunc(nodeObject.getMainPort());

        nodeObject.removeAllLinks();
        if(nodeProperties.value.length!==0){
          createLink(nodeObject.getMainPort(),domainState.get(nodeProperties.value).getMainPort(),diagramModel);
        }
      }
    }
  }
}

function interruptCallingReduxFunc(port){
  for (let link of _.values(port.getLinks())) {
    if(link instanceof BinaryLinkModel){
      link.setCallReduxFunc(false);
    }
  }
}

function addNodeState(nodeName,nodeObject,nodeSet){
  nodeSet.set(nodeName,nodeObject);
}

function removeNodeState(nodeName,nodeSet){
  nodeSet.delete(nodeName);
}

function clearDiagramState(diagramState){
  diagramState.domainNodes.clear();
  diagramState.constantNodes.clear();
  diagramState.ternaryNodes.clear();
  diagramState.quaternaryNodes.clear();
}

function clearCertainNodeState(nodeState){
  nodeState.clear();
}

function syncLanguageElementType(values,type) {
  let elementInterpretationMap = type === PREDICATE ? values.structureObject.iPredicate : values.structureObject.iFunction;
  let portMap = new Map([["1", new Map()], ["2", new Map()], ["3", new Map()], ["4", new Map()]]);

  if (elementInterpretationMap && elementInterpretationMap.size > 0) {
    for (let [key, value] of elementInterpretationMap.entries()) {
      let keyWithoutArity = key.split('/')[0];
      let arityWithoutKey = key.split('/')[1];
      let portMapArity = portMap.get(arityWithoutKey);

      if (type === PREDICATE) {
        addToPredicatePortMap(portMapArity, value, keyWithoutArity);
      } else {
        addToFunctionPortMap(portMapArity, value, keyWithoutArity);
      }
    }
  }
  return portMap;
}

function addToPredicatePortMap(portMapArity,value,keyWithoutArity) {
  for (let currentNodeValue of value) {
    currentNodeValue = currentNodeValue.join(",");
    if (portMapArity.has(currentNodeValue)) {
      portMapArity.get(currentNodeValue).add(keyWithoutArity);
    } else {
      portMapArity.set(currentNodeValue, new Set());
      portMapArity.get(currentNodeValue).add(keyWithoutArity);
    }
  }
}

function addToFunctionPortMap(portMapArity,value,keyWithoutArity) {
  for (let currentNodeValue in value) {
    if (value.hasOwnProperty(currentNodeValue)) {
      let currNodeValueParsed = JSON.parse(currentNodeValue).join(",") + ("," + value[currentNodeValue]);
      if (portMapArity.has(currNodeValueParsed)) {
        portMapArity.get(currNodeValueParsed).add(keyWithoutArity);
      } else {
        portMapArity.set(currNodeValueParsed, new Set());
        portMapArity.get(currNodeValueParsed).add(keyWithoutArity);
      }
    }
  }
}

function syncPredicates(values,focusOnBodyFunc) {
  let portMap = syncLanguageElementType(values,PREDICATE);
  syncUnaryPredicates(portMap.get("1"),values.diagramState.domainNodes);
  syncBinaryLinkElement(portMap.get("2"),values.diagramState,PREDICATE);
  syncNaryPredicates(portMap.get("3"),values,values.diagramState,focusOnBodyFunc,TERNARY);
 }

 function syncNaryPredicates(portMap,values,diagramState,focusOnBodyFunc,type) {
   let nodes = new Map();
   let nodesOfType = type === TERNARY ? diagramState.ternaryNodes : diagramState.quaternaryNodes;

   for (let node of nodesOfType.values()) {
     let nodeValue = node.getNodeNameCombination();
     if (nodeValue) {
       nodes.set(nodeValue.join(","), node);
     }
   }

   let reduxProps = {
     "addTernaryNode":values.addTernaryNode,
     "removeTernaryNode":values.removeTernaryNode,
     "addTernaryPredicate":values.addTernaryPredicate,
     "addBinaryFunction":values.addBinaryFunction,
     "removeTernaryPredicate":values.removeTernaryPredicate,
     "removeBinaryFunction":values.removeBinaryFunction,
     "focusOnBodyElement": focusOnBodyFunc,
     "editable": values.diagramState.editableNodes,
     "store": values.store
   };

   for (let [nodePortMapCombination, nodePortMapCombinationSet] of portMap.entries()) {
     if (!nodes.has(nodePortMapCombination)) {
       let nodeName = getNodeName(nodesOfType,type);
       let node = new TernaryNodeModel({name:nodeName,reduxProps:reduxProps,numberOfPorts:3});
       createNode(node,nodeName,nodesOfType,diagramState.diagramModel,diagramState.diagramEngine.getCanvas());
       createLinksForNaryNodes(node,nodePortMapCombination.split(","),diagramState.domainNodes,diagramState.diagramModel);
     }

     //let naryNode =

   }
 }

 function createLinksForNaryNodes(naryNode,nodeNames,domainNodes,diagramModel){
  for(let i = 0; i<naryNode.getNumberOfPorts();i++){
    createLink(naryNode.getPortByIndex(i),domainNodes.get(nodeNames[i]).getMainPort(),diagramModel);
  }
 }

 function getNodeName(diagramStateNodesOfType,type){
  let name = type;
  let index = 0;
  while(diagramStateNodesOfType.has(name+index)){
    index++;
  }
  return name+index;
 }

function syncFunctions(values) {
  let portMap = syncLanguageElementType(values,FUNCTION);
  syncBinaryLinkElement(portMap.get("1"),values.diagramState,FUNCTION);
}

function syncUnaryPredicates(portMap,domainState) {
  for (let [currentNodeName, currentNodeObject] of domainState.entries()) {
    let setOfUnaryPredicatesForNode = portMap.get(currentNodeName);

    if (portMap.has(currentNodeName)) {
      //added new predicates
      let currentNodePredicates = currentNodeObject.getUnaryPredicates();
      for (let predicateName of setOfUnaryPredicatesForNode) {
        if (!currentNodePredicates.has(predicateName)) {
          currentNodeObject.addUnaryPredicateToSet(predicateName);
        }
      }

      //delete old predicates
      for (let predicate of currentNodePredicates) {
        if (!setOfUnaryPredicatesForNode.has(predicate)) {
          currentNodeObject.removeUnaryPredicateFromSet(predicate);
        }
      }

    } else {
      currentNodeObject.clearPredicates();
    }
  }
}

function createBinaryLinks(portMap,existingLinksCombination,diagramState){
  let linksToChange = new Set();
  for(let combination of portMap.keys()){
    let firstComb = combination.split(",")[0];
    let secondComb = combination.split(",")[1];
    let reversedComb = combination.split(",")[1]+","+combination.split(",")[0];
    if(!existingLinksCombination.has(combination) && !existingLinksCombination.has(reversedComb)){
      let sourcePort = diagramState.domainNodes.get(firstComb).getMainPort();
      let targetPort = diagramState.domainNodes.get(secondComb).getMainPort();
      if(sourcePort === targetPort){
        linksToChange.add(createLink(sourcePort,sourcePort.getNode().getAppendPort(),diagramState.diagramModel));
      }
      else{
        linksToChange.add(createLink(sourcePort,targetPort,diagramState.diagramModel));
      }
      existingLinksCombination.add(combination);
      existingLinksCombination.add(reversedComb);
    }
  }
  return linksToChange;
}

function addLanguageElementToBinaryLinks(portMap,nodeCombinationKey,reversedNodeCombinationKey,label,type){
  if(portMap.has(nodeCombinationKey)){
    for(let languageElement of portMap.get(nodeCombinationKey)){
      type === PREDICATE?label.addBinaryPredicateToSetWithDirection(languageElement,FROM):label.addUnaryFunctionToSetWithDirection(languageElement,FROM);
    }
  }
  if(portMap.has(reversedNodeCombinationKey)){
    for(let languageElement of portMap.get(reversedNodeCombinationKey)){
      let labelLanguageSet = type === PREDICATE?label.getPredicates():label.getFunctions();
      if(labelLanguageSet.has(languageElement)){
        type === PREDICATE?label.addBinaryPredicateToSetWithDirection(languageElement,BOTH):label.addUnaryFunctionToSetWithDirection(languageElement,BOTH);
      }
      else{
        type === PREDICATE?label.addBinaryPredicateToSetWithDirection(languageElement,TO):label.addUnaryFunctionToSetWithDirection(languageElement,TO);
      }
    }
  }
}

function syncBinaryLinkElement(portMap,diagramState,type) {
  let linksToRemove = new Set();
  let existingLinksCombination = new Set();

  for(let link of diagramState.diagramModel.getLinks()){
    let label = link.getLabel();
    if(label){
      let labelLanguageSet = type===PREDICATE?label.getPredicates():label.getFunctions();

      type === PREDICATE?label.clearPredicates():label.clearFunctions();
      let nodeCombinationKey = label.getNodeCombinationKey();
      let reversedNodeCombinationKey = label.getReversedNodeCombinationKey();

      existingLinksCombination.add(nodeCombinationKey);
      existingLinksCombination.add(reversedNodeCombinationKey);

      addLanguageElementToBinaryLinks(portMap,nodeCombinationKey,reversedNodeCombinationKey,label,type);

      if(labelLanguageSet.size === 0){
        linksToRemove.add(link);
      }
    }
  }
  let linksToChange = createBinaryLinks(portMap,existingLinksCombination,diagramState);
  for(let link of linksToChange){
    let label = link.getLabel();
    addLanguageElementToBinaryLinks(portMap,label.getNodeCombinationKey(),label.getReversedNodeCombinationKey(),label,type);
  }
  //removeLinksToRemove(linksToRemove);
  return linksToRemove;
}

function removeLinksToRemove(linksToRemove){
  for(let link of linksToRemove){
    link.remove();
  }
}

function syncDomain(values,focusOnBodyFunc) {
  let domain = (values.structureObject.domain);
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
    if (domain.has(nodeName)) {
      existingDomainNodes.push(nodeName);
    } else {
      removeNodeState(nodeName, domainState);
      removeWholeNode(nodeObject, diagramModel);
    }
  }

  for(let nodeName of domain){
    if (!existingDomainNodes.includes(nodeName)) {
      let node = new UnBinaryNodeModel(nodeName, 'rgb(92,192,125)', {
        "addDomainNode":values.addDomainNode,
        "renameDomainNode": values.renameDomainNode,
        "removeDomainNode":values.removeDomainNode,
        "addUnaryPredicate":values.addUnaryPredicate,
        "addUnaryFunction": values.addUnaryFunction,
        "addBinaryPredicate": values.addBinaryPredicate,
        "removeUnaryPredicate":values.removeUnaryPredicate,
        "removeUnaryFunction": values.removeUnaryFunction,
        "removeBinaryPredicate": values.removeBinaryPredicate,
        "changeDirectionOfBinaryRelation": values.changeDirectionOfBinaryRelation,
        "focusOnBodyElement": focusOnBodyFunc,
        "editable":values.diagramState.editableNodes,
        "store":values.store,
      });
      createNode(node,nodeName,domainState,diagramModel,diagramCanvas);
    }
  }
}

function removeWholeNode(node,diagramModel){
  for(let portObject of Object.values(node.getPorts())){
    interruptCallingReduxFunc(portObject);
    node.removePort(portObject); //ensures that all links are deleted
  }
 diagramModel.removeNode(node);
}

export default diagramReducer;