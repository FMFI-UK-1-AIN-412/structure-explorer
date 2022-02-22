import {defaultExpressionData, FORMULA, TERM} from "../../constants";
import {
  defaultHintikkaGameData, GAME_EQUIVALENCE,
  GAME_IMPLICATION,
  GAME_OPERATOR,
  GAME_QUANTIFIER, gameEntry,
  NEGATION
} from "../../constants/gameConstants";
import Implication from "../../model/formula/Formula.Implication";
import {
  ADD_EXPRESSION,
  RENAME_DOMAIN_NODE,
  CHECK_SYNTAX,
  IMPORT_APP,
  LOCK_EXPRESSION_ANSWER,
  LOCK_EXPRESSION_VALUE,
  REMOVE_EXPRESSION,
  SET_CONSTANT_VALUE,
  SET_CONSTANTS,
  SET_EXPRESSION_ANSWER,
  SET_FUNCTION_VALUE_TABLE,
  SET_FUNCTION_VALUE_TEXT,
  SET_FUNCTIONS,
  SET_PREDICATE_VALUE_TABLE,
  SET_PREDICATE_VALUE_TEXT,
  SET_PREDICATES,
  SET_VARIABLES_VALUE,
  ADD_DOMAIN_NODE,
  SET_CONSTANT_VALUE_FROM_LINK,
  REMOVE_CONSTANT_NODE,
  ADD_UNARY_PREDICATE,
  REMOVE_UNARY_PREDICATE,
  ADD_BINARY_PREDICATE,
  REMOVE_BINARY_PREDICATE,
  ADD_CONSTANT_NODE,
  RENAME_CONSTANT_NODE,
  REMOVE_DOMAIN_NODE,
  ADD_TERNARY_PREDICATE,
  REMOVE_TERNARY_PREDICATE,
  ADD_QUATERNARY_PREDICATE,
  REMOVE_QUATERNARY_PREDICATE,
  ADD_BINARY_FUNCTION,
  REMOVE_BINARY_FUNCTION,
  ADD_TERNARY_FUNCTION,
  REMOVE_TERNARY_FUNCTION,
  ADD_UNARY_FUNCTION,
  REMOVE_UNARY_FUNCTION,
  REMOVE_QUATERNARY_NODE,
  REMOVE_TERNARY_NODE,
  IMPORT_DIAGRAM_STATE,
  CHANGE_DIRECTION_OF_BINARY_RELATION,
  INITIATE_GAME,
  SET_GAME_COMMITMENT,
  CONTINUE_GAME,
  SET_GAME_DOMAIN_CHOICE, SET_GAME_NEXT_FORMULA, END_GAME, GO_BACK, GET_VARIABLES
} from "../actions/action_types";
import {getStructureObject} from "../selectors/structureObject";
import {parseExpression} from "./functions/parsers";
import produce from "immer";
import {getValuationObject} from "../selectors/valuationObject";
import {last} from "mathjs/es/utils/array";

export function defaultState(){
  return {
    formulas: [],
    terms: []
  }
}

const expressionsReducer = produce((expressions, action, state) => {
  const variablesObject = getValuationObject(state);
  switch (action.type) {
    case SET_CONSTANTS:
    case SET_PREDICATES:
    case SET_FUNCTIONS:
      syncExpressionsValue(expressions, state, variablesObject,true);
      return;
    case IMPORT_APP:
      syncExpressionsValue(expressions, state, variablesObject,true);
      expressions.formulas.forEach( (formula) => endGame(formula) );
      return;
    case SET_CONSTANT_VALUE:
    case SET_PREDICATE_VALUE_TEXT:
    case SET_PREDICATE_VALUE_TABLE:
    case SET_FUNCTION_VALUE_TEXT:
    case SET_FUNCTION_VALUE_TABLE:
    case SET_VARIABLES_VALUE:
      syncExpressionsValue(expressions, state, variablesObject);
      return;

    case ADD_EXPRESSION:
      addExpression(expressions, action.expressionType);
      return;

    case REMOVE_EXPRESSION:
      removeExpression(expressions, action.expressionType, action.index);
      return;

    case SET_EXPRESSION_ANSWER:
      setExpressionAnswer(expressions, action.expressionType, action.index, action.answer);
      return;

    case LOCK_EXPRESSION_VALUE:
      lockExpressionValue(expressions, action.expressionType, action.expressionIndex);
      return;

    case LOCK_EXPRESSION_ANSWER:
      lockExpressionAnswer(expressions, action.expressionType, action.expressionIndex);
      return;

    case CHECK_SYNTAX:
      checkExpressionSyntax(expressions, state, action, variablesObject);
      return;

    case ADD_DOMAIN_NODE:
    case RENAME_DOMAIN_NODE:
    case REMOVE_DOMAIN_NODE:
    case ADD_CONSTANT_NODE:
    case RENAME_CONSTANT_NODE:
    case REMOVE_CONSTANT_NODE:
    case ADD_UNARY_PREDICATE:
    case REMOVE_UNARY_PREDICATE:
    case ADD_UNARY_FUNCTION:
    case REMOVE_UNARY_FUNCTION:
    case ADD_BINARY_PREDICATE:
    case REMOVE_BINARY_PREDICATE:
    case ADD_TERNARY_PREDICATE:
    case REMOVE_TERNARY_PREDICATE:
    case ADD_QUATERNARY_PREDICATE:
    case REMOVE_QUATERNARY_PREDICATE:
    case ADD_BINARY_FUNCTION:
    case REMOVE_BINARY_FUNCTION:
    case ADD_TERNARY_FUNCTION:
    case REMOVE_TERNARY_FUNCTION:
    case REMOVE_TERNARY_NODE:
    case REMOVE_QUATERNARY_NODE:
    case SET_CONSTANT_VALUE_FROM_LINK:
    case IMPORT_DIAGRAM_STATE:
    case CHANGE_DIRECTION_OF_BINARY_RELATION:
      syncExpressionsValue(expressions, state, variablesObject,true);
      return;

    case INITIATE_GAME:
    case SET_GAME_COMMITMENT:
    case CONTINUE_GAME:
    case SET_GAME_DOMAIN_CHOICE:
    case SET_GAME_NEXT_FORMULA:
    case END_GAME:
    case GET_VARIABLES:
    case GO_BACK:
      game(expressions.formulas[action.index], action, state, variablesObject);
      return;

    default:
      return;
  }
})

function game(expression, action, state, variablesObject){
  let nextMove;
  let currentFormula;
  let variables;
  let lastEntry;
  if(expression.gameHistory.length > 0) {
     lastEntry = expression.gameHistory[expression.gameHistory.length - 1];
  }
  switch (action.type) {
    case INITIATE_GAME:
          if(expression.parsed) {
            expression.gameEnabled = !expression.gameEnabled;
            expression.gameHistory = new Array();
            variables = new Map(variablesObject);
            expression.variableIndex = setValidVariableIndex(expression.parsed, 1, variables);
            addToHistory(expression, expression.parsed, null, null, variables, [], []);
          }
          return;

    case SET_GAME_COMMITMENT:
          nextMove = getNextStepForGame(lastEntry.currentFormula, action.commitment, getStructureObject(state), lastEntry.gameVariables, expression);
          addToHistory(expression, lastEntry.currentFormula, action.commitment, nextMove, lastEntry.gameVariables, action.gameMessages, action.userMessages);
          return;

    case CONTINUE_GAME:
          variables = new Map(lastEntry.gameVariables);
          if(lastEntry.currentFormula.getType(lastEntry.gameCommitment) === GAME_QUANTIFIER){
            variables.set(lastEntry.nextMove.variables[0], lastEntry.nextMove.variables[1]);
          }
          nextMove = getNextStepForGame(lastEntry.nextMove.formula, lastEntry.nextMove.commitment, getStructureObject(state), variables, expression);
          addToHistory(expression, lastEntry.nextMove.formula, lastEntry.nextMove.commitment, nextMove, variables, action.gameMessages, action.userMessages);
          return;

    case SET_GAME_DOMAIN_CHOICE:
          variables = new Map(lastEntry.gameVariables);
          let varName = 'n' + expression.variableIndex;
          variables.set(varName, action.value);
          currentFormula = lastEntry.currentFormula.subFormula.substitute(lastEntry.currentFormula.variableName, varName);
          setValidVariableIndex(currentFormula, expression.variableIndex, variables);
          nextMove = getNextStepForGame(currentFormula, lastEntry.gameCommitment, getStructureObject(state), variables, expression);
          addToHistory(expression, currentFormula, lastEntry.gameCommitment, nextMove, variables, action.gameMessages, action.userMessages);
          return;

    case SET_GAME_NEXT_FORMULA:
          currentFormula = action.formula.createCopy();
          nextMove = getNextStepForGame(currentFormula, action.commitment, getStructureObject(state), lastEntry.gameVariables, expression);
          addToHistory(expression, currentFormula, action.commitment, nextMove, lastEntry.gameVariables, action.gameMessages, action.userMessages);
          return;

    case END_GAME:
          endGame(expression);
          return;

    case GET_VARIABLES:
          expression.showVariables = !expression.showVariables;
          return;

    case GO_BACK:
          expression.gameHistory = expression.gameHistory.slice(0, action.historyIndex);
          return;

    default:
          return;
    }
}

function endGame(expression) {
  expression.gameHistory = new Array();
  expression.showVariables = false;
  expression.gameEnabled = false;
  expression.variableIndex = 1;
}

function addExpression(expressions, expressionType) {
  if (expressionType === FORMULA) {
    expressions.formulas.push({...defaultExpressionData(), ...defaultHintikkaGameData()});
  } else if (expressionType === TERM) {
    expressions.terms.push(defaultExpressionData());
  }
}

function removeExpression(expressions, expressionType, expressionIndex) {
  if (expressionType === FORMULA && expressionIndex < expressions.formulas.length) {
    expressions.formulas.splice(expressionIndex, 1);
  } else if (expressionType === TERM && expressionIndex < expressions.terms.length) {
    expressions.terms.splice(expressionIndex, 1);
  }
}

function syncExpressionsValue(expressions, state, variables, parse = false) {
  expressions.formulas.forEach(formula => {
    if (parse) {
      parseExpression(formula, formula.value, state, FORMULA);
      // noinspection JSUndefinedPropertyAssignment
    }
    evalExpression(state, formula, variables);
  });
  expressions.terms.forEach(term => {
    if (parse) {
      parseExpression(term, term.value, state, TERM);
    }
    evalExpression(state, term, variables);
  });
}

function evalExpression(state, expression, variables) {
  if (!expression.parsed || expression.parsed.length === 0) {
    return;
  }
  expression.errorMessage = '';
  try {
    expression.expressionValue = expression.parsed.eval(getStructureObject(state), variables);
  } catch (e) {
    expression.errorMessage = e;
    expression.expressionValue = null;
  }
}

function checkExpressionSyntax(expressions, state, action, variables) {
  let expressionText = action.value;
  let expression = expressions.terms[action.index];
  if (action.expressionType === FORMULA) {
    expression = expressions.formulas[action.index];
  }
  parseExpression(expression, expressionText, state, action.expressionType);
  expression.value = action.value; // aby tam neboli zatvorky
  if (expression.errorMessage.length === 0) {
    expression.validSyntax = true;
    evalExpression(state, expression, variables);
  } else {
    expression.validSyntax = false;
  }
}

function setExpressionAnswer(expressions, expressionType, expressionIndex, answer) {
  if (expressionType === FORMULA && expressionIndex < expressions.formulas.length) {
    let ans = (answer === 'true');
    if (answer === '-1')
      ans = '-1';
    expressions.formulas[expressionIndex].answerValue = ans;
  } else if (expressionType === TERM && expressionIndex < expressions.terms.length) {
    expressions.terms[expressionIndex].answerValue = answer;
  }
}

function lockExpressionAnswer(expressions, expressionType, expressionIndex) {
  if (expressionType === FORMULA && expressionIndex < expressions.formulas.length) {
    expressions.formulas[expressionIndex].answerLocked = !expressions.formulas[expressionIndex].answerLocked;
  } else if (expressionType === TERM && expressionIndex < expressions.terms.length) {
    expressions.terms[expressionIndex].answerLocked = !expressions.terms[expressionIndex].answerLocked;
  }
}

function lockExpressionValue(expressions, expressionType, expressionIndex) {
  if (expressionType === FORMULA && expressionIndex < expressions.formulas.length) {
    expressions.formulas[expressionIndex].inputLocked = !expressions.formulas[expressionIndex].inputLocked;
  } else if (expressionType === TERM && expressionIndex < expressions.terms.length) {
    expressions.terms[expressionIndex].inputLocked = !expressions.terms[expressionIndex].inputLocked;
  }
}

function addToHistory(expression, currentFormula, commitment, nextFormula, gameVariables, gameMessages, userMessages){
  expression.gameHistory.push(gameEntry(
        commitment,
        gameVariables,
        currentFormula.createCopy(),
        nextFormula,
        gameMessages,
        userMessages
  ));
}

function getNextStepForGame(currentFormula, commitment, structureObject, variableObject, expression){
    if(currentFormula.getType(commitment) === GAME_OPERATOR){
        const subFormulas = currentFormula.getSubFormulas();
        const subFormulasEval = subFormulas.map(formula => formula.eval(structureObject, variableObject));
        const subFormulasCommitment = currentFormula.getSubFormulasCommitment(commitment);
        const randomFormula = Math.floor(Math.random() * subFormulas.length);
        for(let i = 0; i < subFormulas.length; i++){
          if(subFormulasCommitment[i] !== subFormulasEval[i]){
            return {formula: subFormulas[i], commitment: subFormulasCommitment[i], variables: variableObject}
          }
        }
        return {formula: subFormulas[randomFormula], commitment: subFormulasCommitment[randomFormula], variables: variableObject}
    } else if(currentFormula.getType(commitment) === GAME_QUANTIFIER){
        const domain = Array.from(structureObject.domain);
        const randomDomainValue = Math.floor(Math.random() * domain.length);
        let variables = new Map(variableObject);
        const varName = 'n' + expression.variableIndex;
        let tmpFormula;
        for(let value of domain){
          tmpFormula = currentFormula.subFormula.substitute(currentFormula.variableName, varName);
          variables.set(varName, value);
          if(tmpFormula.eval(structureObject, variables) !== commitment){
            expression.variableIndex = setValidVariableIndex(tmpFormula, expression.variableIndex, variables);
            return {formula: tmpFormula, commitment: commitment, variables: [varName, value]};
          }
        }

        tmpFormula = currentFormula.subFormula.substitute(currentFormula.variableName, varName);
        variables.set(varName, domain[randomDomainValue]);
        expression.variableIndex = setValidVariableIndex(tmpFormula, expression.variableIndex, variables);
        return {formula: tmpFormula, commitment: commitment, variables: [varName, domain[randomDomainValue]]};
    }
    return null;
}

function setValidVariableIndex(formula, variableIndex, variables){
    const variablesInFormula = formula.getVariables();
    while(variablesInFormula.includes('n' + variableIndex) || variables.has('n' + variableIndex)){
        variableIndex++;
    }
    return variableIndex;
}


export default expressionsReducer;