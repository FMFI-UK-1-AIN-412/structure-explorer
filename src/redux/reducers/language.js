import {
  ADD_BINARY_PREDICATE,
  ADD_CONSTANT_NODE,
  ADD_UNARY_PREDICATE,
  IMPORT_APP,
  LOCK_CONSTANTS,
  LOCK_FUNCTIONS,
  LOCK_PREDICATES,
  REMOVE_CONSTANT_NODE,
  RENAME_CONSTANT_NODE,
  SET_CONSTANTS,
  SET_FUNCTIONS,
  SET_PREDICATES
} from "../actions/action_types";
import {RULE_CONSTANTS, RULE_DOMAIN, RULE_FUNCTIONS, RULE_PREDICATES} from "../../constants/parser_start_rules";
import {defaultInputData} from "../../constants";

let functions = require('./functions/functions');

let state = {};
let structure = null;

export function defaultState(){
  return{
    constants: defaultInputData(),
    predicates: defaultInputData(),
    functions: defaultInputData()
  }
}

function languageReducer(s, action, struct) {
  state = copyState(s);
  structure = struct;
  switch (action.type) {
    case SET_CONSTANTS:
      functions.parseText(action.value, state.constants, {startRule: RULE_CONSTANTS});
      setConstants();
      setPredicates();
      setFunctions();
      return state;
    case SET_PREDICATES:
      functions.parseText(action.value, state.predicates, {startRule: RULE_PREDICATES});
      setPredicates();
      setConstants();
      setFunctions();
      return state;
    case SET_FUNCTIONS:
      functions.parseText(action.value, state.functions, {startRule: RULE_FUNCTIONS});
      setFunctions();
      setPredicates();
      setConstants();
      return state;
    case ADD_UNARY_PREDICATE:
      addPredicate(action.predicateName,1);
      return state;
    case ADD_BINARY_PREDICATE:
      addPredicate(action.predicateName,2);
      return state;
    case ADD_CONSTANT_NODE:
      console.log(structure);
      let constantState = state.constants.value;

      if(constantState.charAt(constantState.length-1)==="," || !state.constants.parsed || state.constants.parsed.length===0){
        constantState+=action.nodeName;
      }
      else{
        constantState=constantState+","+action.nodeName;
      }

      functions.parseText(constantState, state.constants, {startRule: RULE_CONSTANTS});
      setConstants();
      return state;

    case REMOVE_CONSTANT_NODE:
      let currentConstantState = state.constants.value;

      if(!state.constants.parsed || state.constants.parsed.length===1){
        currentConstantState = "";
      }

      else{
        let nodeRegex1 = new RegExp(action.nodeName+",","g");
        let nodeRegex2 = new RegExp(action.nodeName,"g");
        currentConstantState = currentConstantState.replace(nodeRegex1,"");
        currentConstantState = currentConstantState.replace(nodeRegex2,"");

        if(currentConstantState.charAt(currentConstantState.length-1)===","){
          currentConstantState = currentConstantState.substring(0,currentConstantState.length-1);
        }
      }

      functions.parseText(currentConstantState, state.constants, {startRule: RULE_DOMAIN});
      setConstants();
      return state;

    case RENAME_CONSTANT_NODE:
      let currConstantState = functions.replaceAllOccurrences(action.oldName,action.newName,state.constants.value);

      if (currConstantState.charAt(currConstantState.length - 1) === ",") {
        currConstantState = currConstantState.substring(0, currConstantState.length - 1);
      }

      functions.parseText(currConstantState, state.constants, {startRule: RULE_CONSTANTS});
      setConstants();

      return state;

    case LOCK_CONSTANTS:
      state.constants.locked = !state.constants.locked;
      return state;
    case LOCK_PREDICATES:
      state.predicates.locked = !state.predicates.locked;
      return state;
    case LOCK_FUNCTIONS:
      state.functions.locked = !state.functions.locked;
      return state;
    case IMPORT_APP:
      setConstants();
      setPredicates();
      setFunctions();
      return state;
    default:
      return state;
  }
}
function addPredicate(predicateName,predicateArity){
  let predicateNameWithArity = predicateName+"/"+predicateArity;
  let parsedPredicatesMap = structure.language.predicates;
  let newPredValue = "";

  for(let [predValue,predArity] of parsedPredicatesMap.entries()){
    newPredValue+=predValue+"/"+predArity+", ";
  }

  if(newPredValue.length!==0){
    if(!parsedPredicatesMap.has(predicateName)) {
      newPredValue += predicateNameWithArity;
    }
    else{
      newPredValue = newPredValue.substring(0,newPredValue.length-2);
    }
  }
  else{
    newPredValue = predicateNameWithArity;
  }

  functions.parseText(newPredValue, state.predicates, {startRule: RULE_PREDICATES});
  setPredicates();
}

function setConstants() {
  if (!state.constants.parsed) {
    return;
  }
  state.constants.errorMessage = structure.setLanguageConstants(state.constants.parsed);
}

function setPredicates() {
  if (!state.predicates.parsed) {
    return;
  }
  state.predicates.errorMessage = structure.setLanguagePredicates(state.predicates.parsed);
}

function setFunctions() {
  if (!state.functions.parsed) {
    return;
  }
  state.functions.errorMessage = structure.setLanguageFunctions(state.functions.parsed);
}

const copyState = (state) => ({
  ...state,
  constants: {...state.constants},
  predicates: {...state.predicates},
  functions: {...state.functions}
});

export default languageReducer;