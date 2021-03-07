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
  ADD_BINARY_FUNCTION,
  LOCK_LANGUAGE_COMPONENT, LOCK_VARIABLES_COMPONENT
} from "../actions/action_types";
import {
  EMPTY_CONSTANT_VALUE, EMPTY_DOMAIN, FUNCTION_ALREADY_DEFINED, FUNCTION_NOT_FULL_DEFINED, ITEM_IN_LANGUAGE,
  ITEM_NOT_IN_DOMAIN
} from "../../constants/messages";
import {
  RULE_DOMAIN,
  RULE_PREDICATES_FUNCTIONS_VALUE,
  RULE_VARIABLE_VALUATION
} from "../../constants/parser_start_rules";
import {defaultInputData, DOMAIN, FUNCTION, PREDICATE, VARIABLE} from "../../constants";
import {BOTH, FROM, PREDICATE as PRED,FUNCTION as FUNC, TO} from "../../graph_view/nodes/ConstantNames";
import {
  validateStructureConstants,
  validateStructurePredicates,
  validateStructureFunctions
} from "./functions/validation";
import {parseStructure} from "./functions/parsers";

const constantDefaultInput = () => ({...defaultInputData(), errorMessage: EMPTY_CONSTANT_VALUE});
const predicateDefaultInput = () => ({...defaultInputData(), tableEnabled: false});
const functionDefaultInput = () => predicateDefaultInput();


export function defaultState(){
  return{
    constants: {},
    predicates: {},
    functions: {},
    variables: {...defaultInputData(), object: new Map()},
    domain: {...defaultInputData(), errorMessage: EMPTY_DOMAIN}
  }
}

function structureReducer(state, action, language, wholeState) {
  let newState = copyState(state);
  let input = action.itemType === PREDICATE ? newState.predicates[action.name] : newState.functions[action.name];
  switch (action.type) {
    case SET_CONSTANTS:
    case SET_PREDICATES:
    case SET_FUNCTIONS:
      syncLanguageWithStructure(newState, language);
      setVariables(newState, language);
      return newState;

    case ADD_CONSTANT_NODE:
      insertNewInputs(newState, language);
      return newState;

    case REMOVE_CONSTANT_NODE:
      deleteUnusedInputs(newState, language);
      return newState;

    case SET_CONSTANT_VALUE_FROM_LINK:
      setConstantValue(newState, action.constantNodeName, action.domainNodeName);
      return newState;

    case RENAME_CONSTANT_NODE:
      let newStateConstantObject = Object.keys(newState.constants).map(key => {
        let newKey = key === action.oldName ? action.newName : key;
        return {[newKey]: newState.constants[key]}
      });

      newState.constants = Object.assign({}, ...newStateConstantObject);
      syncLanguageWithStructure(newState, language);
      return newState;

    case ADD_UNARY_PREDICATE:
      addPredicateLanguageElement(newState, language, action.predicateName, 1, [action.nodeName]);
      return newState;

    case ADD_BINARY_PREDICATE:
      addPredicateLanguageElement(newState, language, action.predicateName, 2, [action.sourceNodeName, action.targetNodeName], action.direction);
      return newState;

    case ADD_TERNARY_PREDICATE:
      addPredicateLanguageElement(newState, language, action.predicateName,3,action.nodeName);
      return newState;

    case ADD_QUATERNARY_PREDICATE:
      addPredicateLanguageElement(newState, language, action.predicateName, 4,action.nodeName);
      return newState;

    case ADD_BINARY_FUNCTION:
      addFunctionLanguageElement(newState, language, action.functionName,2,action.nodeName);
      return newState;

    case ADD_TERNARY_FUNCTION:
      addFunctionLanguageElement(newState, language, action.functionName,3,action.nodeName);
      return newState;

    case REMOVE_UNARY_PREDICATE:
      removePredicateLanguageElement(newState, action.predicateName, 1, [action.nodeName]);
      return newState;

    case REMOVE_BINARY_PREDICATE:
      removePredicateLanguageElementInGivenDirection(newState, action.predicateName, action.direction, action.sourceNodeName, action.targetNodeName);
      return newState;

    case REMOVE_TERNARY_PREDICATE:
      removePredicateLanguageElement(newState, action.predicateName,3,action.nodeName);
      return newState;

    case REMOVE_QUATERNARY_PREDICATE:
      removePredicateLanguageElement(newState, action.predicateName,4,action.nodeName);
      return newState;

    case REMOVE_BINARY_FUNCTION:
      removeFunctionLanguageElement(newState, action.functionName,2,action.nodeName);
      return newState;

    case REMOVE_TERNARY_FUNCTION:
      removeFunctionLanguageElement(newState, action.functionName,3,action.nodeName);
      return newState;

    case CHANGE_DIRECTION_OF_BINARY_RELATION:
      let arity = action.langType === PRED ? 2 : 1;
      let nodeNames;
      if (action.direction === FROM) {
        nodeNames = [action.targetNodeName, action.sourceNodeName];
      } else if (action.direction === TO) {
        nodeNames = [action.sourceNodeName, action.targetNodeName];
      }
      if(action.langType === PRED) {
        removePredicateLanguageElement(newState, action.languageElementName, arity, nodeNames);
        addPredicateLanguageElement(newState, language, action.languageElementName, arity,
            [action.sourceNodeName, action.targetNodeName], action.direction);
      } else {
        removeFunctionLanguageElement(newState, action.languageElementName, arity, nodeNames);
        addFunctionLanguageElement(newState, language, action.languageElementName, arity,
            [action.sourceNodeName, action.targetNodeName], action.direction);
      }
      return newState;

    case ADD_UNARY_FUNCTION:
      addFunctionLanguageElement(newState, language, action.functionName, 1, [action.sourceNodeName, action.targetNodeName], action.direction);
      return newState;

    case REMOVE_UNARY_FUNCTION:
      removeFunctionLanguageElementInGivenDirection(newState, action.functionName, action.direction, action.sourceNodeName, action.targetNodeName);
      return newState;

    case SET_CONSTANT_VALUE:
      setConstantValue(newState, action.constantName, action.value);
      return newState;
    case SET_PREDICATE_VALUE_TEXT:
      parseStructure(newState.predicates[action.predicateName], action.value, wholeState, PREDICATE);
      checkPredicateValue(newState, action.predicateName);
      return newState;
    case SET_PREDICATE_VALUE_TABLE:
      console.log("TABLE:");
      console.log(action);
      if (action.checked) {
        if(newState.predicates[action.predicateName].parsed.some(tuple => JSON.stringify(tuple) === JSON.stringify(action.value))){
          return newState;
        }
        newState.predicates[action.predicateName].parsed.push(action.value);
      } else {
        let index = 0;
        newState.predicates[action.predicateName].parsed.forEach(tuple =>{
          if(JSON.stringify(tuple) === JSON.stringify(action.value)){
            newState.predicates[action.predicateName].parsed.splice(index, 1);
            return;
          }
          index++;
        })
      }
      newState.predicates[action.predicateName].value = parsedToValue(newState.predicates[action.predicateName].parsed);
      checkPredicateValue(newState, action.predicateName);
      return newState;
    case SET_FUNCTION_VALUE_TEXT:
      parseStructure(newState.functions[action.functionName], action.value, wholeState, FUNCTION);
      checkFunctionValue(newState, action.functionName);
      return newState;
    case SET_FUNCTION_VALUE_TABLE:
      let params = action.value.slice(0, action.value.length - 1);
      let value = action.value[action.value.length - 1];
      let index = 0;
      newState.functions[action.functionName].parsed.forEach(tuple => {
        if(JSON.stringify(tuple.slice(0, tuple.length - 1)) === JSON.stringify(params)){
          newState.functions[action.functionName].parsed.splice(index, 1);
          return;
        }
        index++;
      });
      if(value !== "") {
        newState.functions[action.functionName].parsed.push(action.value);
      }
      newState.functions[action.functionName].value = parsedToValue(newState.functions[action.functionName].parsed);
      checkFunctionValue(newState, action.functionName);
      return newState;
    case SET_VARIABLES_VALUE:
      parseStructure(newState.variables, action.value, wholeState, VARIABLE);
      setVariables(newState, language);
      return newState;
    case RENAME_DOMAIN_NODE:
      syncLanguageWithStructure(newState, language);
      newState.domain.parsed = newState.domain.parsed.map(value => value === action.oldName ? action.newName : value);
      newState.domain.value = newState.domain.parsed.join(", ");
      setDomain(newState);

      Object.keys(newState.constants).forEach(c => {
        if (newState.constants[c].value === action.oldName) {
          newState.constants[c].value = action.newName;
        }
      });
      setConstantsValues(newState);
      changePredicatesValues(newState, language, action.oldName, action.newName);
      return newState;

    case ADD_DOMAIN_NODE:
      newState.domain.parsed.push(action.nodeName);
      newState.domain.value = newState.domain.parsed.join(", ");
      setDomain(newState);
      return newState;

    case REMOVE_DOMAIN_NODE:
      newState.domain.parsed = newState.domain.parsed.filter(value => value !== action.nodeName);
      newState.domain.value = newState.domain.parsed.join(", ");
      setDomain(newState);

      //toto mozem pretoze tu nie je input okno takze toto sa "neda" pokazit takym sposobom
      language.constants.parsed.forEach(c => {
        if (newState.constants[c].value === action.oldName) {
          newState.constants[c].value = "";
        }
      });
      setConstantsValues(newState);
      return newState;

    case SET_DOMAIN:
      parseStructure(newState.domain, action.value, wholeState, DOMAIN);
      setDomain(newState);
      setConstantsValues(newState);
      setPredicatesValues(newState);
      setFunctionsValues(newState);
      setVariables(newState, language);
      return newState;

    case TOGGLE_EDIT_TABLE:
      if (input) {
        input.tableEnabled = !input.tableEnabled;
        if (input.tableEnabled) {
          input.databaseEnabled = false;
        }
      }
      return newState;

    case TOGGLE_EDIT_DATABASE:
      if (input) {
        input.databaseEnabled = !input.databaseEnabled;
        if (input.databaseEnabled) {
          input.tableEnabled = false;
        }
      }
      return newState;

    case LOCK_DOMAIN:
      newState.domain.locked = !newState.domain.locked;
      return newState;
    case LOCK_CONSTANT_VALUE:
      newState.constants[action.constantName].locked = !newState.constants[action.constantName].locked;
      return newState;
    case LOCK_PREDICATE_VALUE:
      newState.predicates[action.predicateName].locked = !newState.predicates[action.predicateName].locked;
      return newState;
    case LOCK_FUNCTION_VALUE:
      newState.functions[action.functionName].locked = !newState.functions[action.functionName].locked;
      return newState;
    case LOCK_VARIABLES:
      newState.variables.locked = !newState.variables.locked;
      return newState;
    case IMPORT_APP:
      setDomain(newState);
      setConstantsValues(newState);
      setPredicatesValues(newState);
      setFunctionsValues(newState);
      setVariables(newState, language);
      return newState;
    default:
      return newState;
  }
}

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
      let arrayNodeNames = buildTupleArray(nodeNames, direction)
      arrayNodeNames.forEach(tuple => state.predicates[predicateName].parsed.push(tuple))
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
      let arrayNodeNames = buildTupleArray(nodeNames, direction)
      arrayNodeNames.forEach(tuple => state.functions[functionName].parsed.push(tuple))
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
        state.functions[functionName] = functionDefaultInput()
      }
    });
}

function setVariables(state, language) {
  if (!state.variables.parsed || state.variables.errorMessage !== '') {
    return;
  }
  if (!state.variables.object || !state.variables.object instanceof Map) {
    state.variables.object = new Map();
  } else {
    state.variables.object.clear();
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
    else {
      state.variables.object.set(variable, value);
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
  if (state.predicates[predicateName].parsed.length === 0) {
    return;
  }
  let arity = predicateName.split("/")[1];
  state.predicates[predicateName].errorMessage =
      validateStructurePredicates(state.predicates[predicateName].parsed, state.domain.parsed, arity);
}

function checkFunctionValue(state, functionName) {
  if (state.functions[functionName].parsed.length === 0) {
    state.functions[functionName].errorMessage = FUNCTION_NOT_FULL_DEFINED;
    return;
  }
  let arity = functionName.split("/")[1];
  state.functions[functionName].errorMessage =
      validateStructureFunctions(state.functions[functionName].parsed, state.domain.parsed, arity);
}

const copyState = (state) => ({
  ...state,
  constants: {...state.constants},
  predicates: {...state.predicates},
  functions: {...state.functions},
  variables: {...state.variables},
  domain: {...state.domain}
});

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

export default structureReducer;