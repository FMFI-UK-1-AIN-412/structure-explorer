import {
  IMPORT_APP,
  LOCK_CONSTANT_VALUE,
  LOCK_DOMAIN,
  LOCK_FUNCTION_VALUE,
  LOCK_PREDICATE_VALUE,
  LOCK_VARIABLES,
  SET_CONSTANT_VALUE,
  SET_CONSTANTS,
  SET_DOMAIN,
  SET_FUNCTION_VALUE_TABLE,
  SET_FUNCTION_VALUE_TEXT,
  SET_FUNCTIONS,
  SET_PREDICATE_VALUE_TABLE,
  SET_PREDICATE_VALUE_TEXT,
  SET_PREDICATES,
  SET_VARIABLES_VALUE,
  TOGGLE_EDIT_TABLE,
  TOGGLE_EDIT_DATABASE,
  RENAME_DOMAIN_NODE,
  ADD_DOMAIN_NODE,
  REMOVE_DOMAIN_NODE,
  ADD_CONSTANT_NODE,
  REMOVE_CONSTANT_NODE,
  ADD_UNARY_PREDICATE,
  RENAME_CONSTANT_NODE,
  SET_CONSTANT_VALUE_FROM_LINK,
  REMOVE_UNARY_PREDICATE,
  ADD_BINARY_PREDICATE,
  REMOVE_BINARY_PREDICATE,
  CHANGE_DIRECTION_OF_BINARY_RELATION,
  ADD_UNARY_FUNCTION,
  REMOVE_UNARY_FUNCTION,
  ADD_TERNARY_PREDICATE,
  REMOVE_TERNARY_PREDICATE,
  REMOVE_BINARY_FUNCTION,
  ADD_QUATERNARY_PREDICATE,
  REMOVE_QUATERNARY_PREDICATE,
  REMOVE_TERNARY_FUNCTION,
  ADD_TERNARY_FUNCTION,
  ADD_BINARY_FUNCTION
} from "../actions/action_types";
import {
  EMPTY_CONSTANT_VALUE, EMPTY_DOMAIN, FUNCTION_NOT_FULL_DEFINED, ITEM_IN_LANGUAGE,
  ITEM_NOT_IN_DOMAIN
} from "../../constants/messages";
import {defaultInputData, DOMAIN, FUNCTION, PREDICATE, VARIABLE} from "../../constants";
import {BOTH, FROM, PREDICATE as PRED, TO} from "../../graph_view/nodes/ConstantNames";
import {
  validateStructureConstants,
  validateStructurePredicates,
  validateStructureFunctions
} from "./functions/validation";
import {parseStructure} from "./functions/parsers";
import produce from "immer";

const constantDefaultInput = () => ({...defaultInputData(), errorMessage: EMPTY_CONSTANT_VALUE});
const predicateDefaultInput = () => ({...defaultInputData(), tableEnabled: false});
const functionDefaultInput = () => predicateDefaultInput();


export function defaultState(){
  return{
    constants: {},
    predicates: {},
    functions: {},
    variables: {...defaultInputData()},
    domain: {...defaultInputData(), errorMessage: EMPTY_DOMAIN}
  }
}

const structureReducer = produce((structure, action, state) => {
  switch (action.type) {
    case SET_CONSTANTS:
    case SET_PREDICATES:
    case SET_FUNCTIONS:
      syncLanguageWithStructure(structure, state.language);
      setVariables(structure, state.language);
      return;

    case ADD_CONSTANT_NODE:
      insertNewInputs(structure, state.language);
      return;

    case REMOVE_CONSTANT_NODE:
      deleteUnusedInputs(structure, state.language);
      return;

    case SET_CONSTANT_VALUE_FROM_LINK:
      setConstantValue(structure, action.constantNodeName, action.domainNodeName);
      return;

    case RENAME_CONSTANT_NODE:
      let newStateConstantObject = Object.keys(structure.constants).map(key => {
        let newKey = key === action.oldName ? action.newName : key;
        return {[newKey]: structure.constants[key]}
      });

      structure.constants = Object.assign({}, ...newStateConstantObject);
      syncLanguageWithStructure(structure, state.language);
      return;

    case ADD_UNARY_PREDICATE:
      addPredicateLanguageElement(structure, state.language, action.predicateName, 1, [action.nodeName]);
      return;

    case ADD_BINARY_PREDICATE:
      addPredicateLanguageElement(structure, state.language, action.predicateName, 2, [action.sourceNodeName, action.targetNodeName], action.direction);
      return;

    case ADD_TERNARY_PREDICATE:
      addPredicateLanguageElement(structure, state.language, action.predicateName,3,action.nodeName);
      return;

    case ADD_QUATERNARY_PREDICATE:
      addPredicateLanguageElement(structure, state.language, action.predicateName, 4,action.nodeName);
      return;

    case ADD_BINARY_FUNCTION:
      addFunctionLanguageElement(structure, state.language, action.functionName,2,action.nodeName);
      return;

    case ADD_TERNARY_FUNCTION:
      addFunctionLanguageElement(structure, state.language, action.functionName,3,action.nodeName);
      return;

    case REMOVE_UNARY_PREDICATE:
      removePredicateLanguageElement(structure, action.predicateName, 1, [action.nodeName]);
      return;

    case REMOVE_BINARY_PREDICATE:
      removePredicateLanguageElementInGivenDirection(structure, action.predicateName, action.direction, action.sourceNodeName, action.targetNodeName);
      return;

    case REMOVE_TERNARY_PREDICATE:
      removePredicateLanguageElement(structure, action.predicateName,3,action.nodeName);
      return;

    case REMOVE_QUATERNARY_PREDICATE:
      removePredicateLanguageElement(structure, action.predicateName,4,action.nodeName);
      return;

    case REMOVE_BINARY_FUNCTION:
      removeFunctionLanguageElement(structure, action.functionName,2,action.nodeName);
      return;

    case REMOVE_TERNARY_FUNCTION:
      removeFunctionLanguageElement(structure, action.functionName,3,action.nodeName);
      return;

    case CHANGE_DIRECTION_OF_BINARY_RELATION:
      let arity = action.langType === PRED ? 2 : 1;
      let nodeNames;
      if (action.direction === FROM) {
        nodeNames = [action.targetNodeName, action.sourceNodeName];
      } else if (action.direction === TO) {
        nodeNames = [action.sourceNodeName, action.targetNodeName];
      }
      if(action.langType === PRED) {
        removePredicateLanguageElement(structure, action.languageElementName, arity, nodeNames);
        addPredicateLanguageElement(structure, state.language, action.languageElementName, arity,
            [action.sourceNodeName, action.targetNodeName], action.direction);
      } else {
        removeFunctionLanguageElement(structure, action.languageElementName, arity, nodeNames);
        addFunctionLanguageElement(structure, state.language, action.languageElementName, arity,
            [action.sourceNodeName, action.targetNodeName], action.direction);
      }
      return;

    case ADD_UNARY_FUNCTION:
      addFunctionLanguageElement(structure, state.language, action.functionName, 1, [action.sourceNodeName, action.targetNodeName], action.direction);
      return;

    case REMOVE_UNARY_FUNCTION:
      removeFunctionLanguageElementInGivenDirection(structure, action.functionName, action.direction, action.sourceNodeName, action.targetNodeName);
      return;

    case SET_CONSTANT_VALUE:
      setConstantValue(structure, action.constantName, action.value);
      return;

    case SET_PREDICATE_VALUE_TEXT:
      parseStructure(structure.predicates[action.predicateName], action.value, state, PREDICATE);
      checkPredicateValue(structure, action.predicateName);
      return;

    case SET_PREDICATE_VALUE_TABLE:
      if (action.checked) {
        if(structure.predicates[action.predicateName].parsed.some(tuple => JSON.stringify(tuple) === JSON.stringify(action.value))){
          return;
        }
        structure.predicates[action.predicateName].parsed.push(action.value);
      } else {
        let index = 0;
        structure.predicates[action.predicateName].parsed.forEach(tuple =>{
          if(JSON.stringify(tuple) === JSON.stringify(action.value)){
            structure.predicates[action.predicateName].parsed.splice(index, 1);
            return;
          }
          index++;
        })
      }
      structure.predicates[action.predicateName].value = parsedToValue(structure.predicates[action.predicateName].parsed);
      checkPredicateValue(structure, action.predicateName);
      return;

    case SET_FUNCTION_VALUE_TEXT:
      parseStructure(structure.functions[action.functionName], action.value, state, FUNCTION);
      checkFunctionValue(structure, action.functionName);
      return;

    case SET_FUNCTION_VALUE_TABLE:
      let params = action.value.slice(0, action.value.length - 1);
      let value = action.value[action.value.length - 1];
      let index = 0;
      structure.functions[action.functionName].parsed.forEach(tuple => {
        if(JSON.stringify(tuple.slice(0, tuple.length - 1)) === JSON.stringify(params)){
          structure.functions[action.functionName].parsed.splice(index, 1);
          return;
        }
        index++;
      });
      if(value !== "") {
        structure.functions[action.functionName].parsed.push(action.value);
      }
      structure.functions[action.functionName].value = parsedToValue(structure.functions[action.functionName].parsed);
      checkFunctionValue(structure, action.functionName);
      return;

    case SET_VARIABLES_VALUE:
      parseStructure(structure.variables, action.value, state, VARIABLE);
      setVariables(structure, state.language);
      return;

    case RENAME_DOMAIN_NODE:
      syncLanguageWithStructure(structure, state.language);
      structure.domain.parsed = structure.domain.parsed.map(value => value === action.oldName ? action.newName : value);
      structure.domain.value = structure.domain.parsed.join(", ");
      setDomain(structure);
      if(structure.domain.parsed.length !== 0){
        structure.domain.errorMessage = '';
      }

      Object.keys(structure.constants).forEach(c => {
        if (structure.constants[c].value === action.oldName) {
          structure.constants[c].value = action.newName;
        }
      });
      setConstantsValues(structure);
      changePredicatesValues(structure, state.language, action.oldName, action.newName);
      return;

    case ADD_DOMAIN_NODE:
      structure.domain.parsed.push(action.nodeName);
      structure.domain.value = structure.domain.parsed.join(", ");
      setDomain(structure);
      if(structure.domain.parsed.length !== 0){
        structure.domain.errorMessage = '';
      }
      return;

    case REMOVE_DOMAIN_NODE:
      structure.domain.parsed = structure.domain.parsed.filter(value => value !== action.nodeName);
      structure.domain.value = structure.domain.parsed.join(", ");
      setDomain(structure);
      if(structure.domain.parsed.length !== 0){
        structure.domain.errorMessage = '';
      }

      //toto mozem pretoze tu nie je input okno takze toto sa "neda" pokazit takym sposobom
      state.language.constants.parsed.forEach(c => {
        if (structure.constants[c].value === action.oldName) {
          structure.constants[c].value = "";
        }
      });
      setConstantsValues(structure);
      return;

    case SET_DOMAIN:
      parseStructure(structure.domain, action.value, state, DOMAIN);
      setDomain(structure);
      setConstantsValues(structure);
      setPredicatesValues(structure);
      setFunctionsValues(structure);
      setVariables(structure, state.language);
      return;

    case TOGGLE_EDIT_TABLE:
      if(action.itemType === PREDICATE){
        structure.predicates[action.name].tableEnabled = !structure.predicates[action.name].tableEnabled;
        if(structure.predicates[action.name].tableEnabled){
          structure.predicates[action.name].databaseEnabled = false;
        }
      } else if(action.itemType === FUNCTION){
        structure.functions[action.name].tableEnabled = !structure.functions[action.name].tableEnabled;
        if(structure.functions[action.name].tableEnabled){
          structure.functions[action.name].databaseEnabled = false;
        }
      }
      return;

    case TOGGLE_EDIT_DATABASE:
      if(action.itemType === PREDICATE){
        structure.predicates[action.name].databaseEnabled = !structure.predicates[action.name].databaseEnabled;
        if(structure.predicates[action.name].databaseEnabled){
          structure.predicates[action.name].tableEnabled = false;
        }
      } else if(action.itemType === FUNCTION){
        structure.functions[action.name].databaseEnabled = !structure.functions[action.name].databaseEnabled;
        if(structure.functions[action.name].databaseEnabled){
          structure.functions[action.name].tableEnabled = false;
        }
      }
      return;

    case LOCK_DOMAIN:
      structure.domain.locked = !structure.domain.locked;
      return;

    case LOCK_CONSTANT_VALUE:
      structure.constants[action.constantName].locked = !structure.constants[action.constantName].locked;
      return;

    case LOCK_PREDICATE_VALUE:
      structure.predicates[action.predicateName].locked = !structure.predicates[action.predicateName].locked;
      return;

    case LOCK_FUNCTION_VALUE:
      structure.functions[action.functionName].locked = !structure.functions[action.functionName].locked;
      return;
    case LOCK_VARIABLES:
      structure.variables.locked = !structure.variables.locked;
      return;

    case IMPORT_APP:
      setDomain(structure);
      setConstantsValues(structure);
      setPredicatesValues(structure);
      setFunctionsValues(structure);
      setVariables(structure, state.language);
      return;

    default:
      return;
  }
})

function removePredicateLanguageElementInGivenDirection(state, elementName, direction, sourceNodeName, targetNodeName) {
  let nodeNames = [sourceNodeName, targetNodeName]; //FROM direction

  if (direction === TO) {
    nodeNames = [targetNodeName,sourceNodeName];
  } else {
    removePredicateLanguageElement(state, elementName, 2, [targetNodeName, sourceNodeName]); //deleting BOTH direction, starting with TO direction
  }
  removePredicateLanguageElement(state, elementName, 2, nodeNames);
}

function removeFunctionLanguageElementInGivenDirection(state, elementName, direction, sourceNodeName, targetNodeName) {
  let nodeNames = [sourceNodeName, targetNodeName]; //FROM direction

  if (direction === TO) {
    nodeNames = [targetNodeName,sourceNodeName];
  } else {
    removeFunctionLanguageElement(state, elementName, 1, [targetNodeName, sourceNodeName]); //deleting BOTH direction, starting with TO direction
  }
  removeFunctionLanguageElement(state, elementName, 1, nodeNames);
}

function changePredicatesValues(state, language, oldNodeName, newNodeName) {
  language.predicates.parsed.forEach(predicate => {
      let predicateName = predicate.name + "/" + predicate.arity;
      state.predicates[predicateName].parsed = state.predicates[predicateName].parsed
          .map(tuple => tuple.map(value => value === oldNodeName ? newNodeName : value));
      state.predicates[predicateName].value = parsedToValue(state.predicates[predicateName].parsed);
  });
}

function buildTupleArray(nodeNames,direction){
  if(direction === BOTH){
    if(nodeNames[0] === nodeNames[1]){
      return [[nodeNames[0],nodeNames[1]]];
    }
    else{
      return [[nodeNames[0],nodeNames[1]], [nodeNames[1],nodeNames[0]]];
    }
  }
  else if(direction === FROM){
    return [[nodeNames[0],nodeNames[1]]];
  }
  else{
    return [[nodeNames[1],nodeNames[0]]];
  }
}

function addPredicateLanguageElement(state, language, elementName, elementArity, nodeNames, direction=""){
  let predicateName = elementName + "/" + elementArity;
  insertNewInputs(state, language);
  if(nodeNames !== null) {
    if (direction !== "") {
      let arrayNodeNames = buildTupleArray(nodeNames, direction);
      arrayNodeNames.forEach(tuple => {
        if(!state.predicates[predicateName].parsed.some(entry => arraysEqual(entry, tuple))) {
          state.predicates[predicateName].parsed.push(tuple);
        }
      });
    } else {
      state.predicates[predicateName].parsed.push(nodeNames);
    }
  }
  state.predicates[predicateName].value = parsedToValue(state.predicates[predicateName].parsed);
  checkPredicateValue(state, predicateName)
}

function addFunctionLanguageElement(state, language, elementName, elementArity, nodeNames, direction=""){
  let functionName = elementName + "/" + elementArity;
  insertNewInputs(state, language);
  if(nodeNames !== null) {
    if (direction !== "") {
      let arrayNodeNames = buildTupleArray(nodeNames, direction);
      arrayNodeNames.forEach(tuple => {
        if(!state.functions[functionName].parsed.some(entry => arraysEqual(entry, tuple))) {
          state.functions[functionName].parsed.push(tuple);
        }
      });
    } else {
      state.functions[functionName].parsed.push(nodeNames);
    }
  }
  state.functions[functionName].value = parsedToValue(state.functions[functionName].parsed);
  checkFunctionValue(state, functionName)
}

function removePredicateLanguageElement(state, elementName,elementArity,nodeNames){
  let predicateName = elementName+"/"+elementArity;
  const sNodeNames = JSON.stringify(nodeNames);
  state.predicates[predicateName].parsed = state.predicates[predicateName].parsed.filter(tuple => JSON.stringify(tuple) !== sNodeNames)
  state.predicates[predicateName].value = parsedToValue(state.predicates[predicateName].parsed);
  checkPredicateValue(state, predicateName)
}

function removeFunctionLanguageElement(state, elementName,elementArity,nodeNames){
  let functionName = elementName+"/"+elementArity;
  const sNodeNames = JSON.stringify(nodeNames);
  state.functions[functionName].parsed = state.functions[functionName].parsed.filter(tuple => JSON.stringify(tuple) !== sNodeNames)
  state.functions[functionName].value = parsedToValue(state.functions[functionName].parsed);
  checkFunctionValue(state, functionName)
}

function setDomain(state) {
  if (!state.domain.parsed) {
    return;
  }
  if(state.domain.parsed.length === 0 && state.domain.errorMessage === ''){
    state.domain.errorMessage = EMPTY_DOMAIN;
  }
}

function setConstantsValues(state) {
  Object.keys(state.constants).forEach(c => {
    setConstantValue(state, c, state.constants[c].value);
  })
}

function setPredicatesValues(state) {
  Object.keys(state.predicates).forEach(predicate => {
    checkPredicateValue(state, predicate);
  })
}

function setFunctionsValues(state) {
  Object.keys(state.functions).forEach(f => {
    checkFunctionValue(state, f);
  })
}

function syncLanguageWithStructure(state, language) {
  deleteUnusedInputs(state, language);
  insertNewInputs(state, language);
}

function deleteUnusedInputs(state, language) {
  Object.keys(state.constants).forEach(constantName => {
    if (!language.constants.parsed.some(c => c === constantName)) {
      delete state.constants[constantName];
    }
  });

  Object.keys(state.predicates).forEach(predicateName => {
    if (!language.predicates.parsed.some(p => (p.name + "/" + p.arity) === predicateName)) {
      delete state.predicates[predicateName];
    }
  });
  Object.keys(state.functions).forEach(functionName => {
    if (!language.functions.parsed.some(f => (f.name + "/" + f.arity) === functionName)) {
      delete state.functions[functionName];
    }
  });
}

function insertNewInputs(state, language) {
    language.constants.parsed.forEach(c => {
      if (!state.constants[c]) {
        state.constants[c] = constantDefaultInput();
      }
    });
    language.predicates.parsed.forEach(p => {
      let predicateName = p.name + "/" + p.arity;
      if (!state.predicates[predicateName]) {
        state.predicates[predicateName] = predicateDefaultInput()
      }
    });
    language.functions.parsed.forEach(f => {
      let functionName = f.name + "/" + f.arity;
      if (!state.functions[functionName]) {
        state.functions[functionName] = functionDefaultInput();
        checkFunctionValue(state, functionName);
      }
    });
}

function setVariables(state, language) {
  if (!state.variables.parsed || state.variables.errorMessage !== '') {
    return;
  }
  let errorMessage = '';
  state.variables.parsed.forEach(tuple => {
    let variable = tuple[0];
    let value = tuple[1];
    if (language.constants.parsed.some(c => c === variable)
          || language.functions.parsed.some(f => (f.name + "/" + f.arity) === variable)
          || language.predicates.parsed.some(p => (p.name + "/" + p.arity) === variable)) {
      errorMessage = ITEM_IN_LANGUAGE(variable);
    }
    else if (!state.domain.parsed.some(d => d === value)) {
      errorMessage = ITEM_NOT_IN_DOMAIN(value);
    }
  });
  state.variables.errorMessage = errorMessage;
}

function setConstantValue(state, constantName, value) {
  try {
    validateStructureConstants(constantName, value, state.constants, state.domain.parsed);
    state.constants[constantName].value = value;
    state.constants[constantName].errorMessage = '';
  } catch (e) {
    console.error(e);
    state.constants[constantName].errorMessage = e;
    state.constants[constantName].value = '';
  }
}

function checkPredicateValue(state, predicateName) {
  if (state.predicates[predicateName].errorMessage !== '') {
    return;
  }
  let arity = predicateName.split("/")[1];
  state.predicates[predicateName].errorMessage =
      validateStructurePredicates(state.predicates[predicateName].parsed, state.domain.parsed, arity);
}

function checkFunctionValue(state, functionName) {
  let arity = functionName.split("/")[1];
  state.functions[functionName].errorMessage =
      validateStructureFunctions(state.functions[functionName].parsed, state.domain.parsed, arity);
}

function tupleToString(tuple) {
  if (tuple.length === 0) {
    return '';
  }
  if (tuple.length === 1) {
    return tuple[0];
  }
  return "(" + tuple.join(", ") + ")"
}

function  parsedToValue(parsedValues) {
  if (parsedValues === undefined || parsedValues.length === 0) {
    return '';
  }
  return parsedValues.map(value => tupleToString(value)).join(", ");
}

function arraysEqual(array1, array2){
  return (
    (array1.length == array2.length) &&
    array1.every( (elem, index) => elem === array2[index] )
  );
}

export default structureReducer;