import {parseConstants, parsePredicates, parseFunctions, parseDomain, parseTuples, parseValuation, parseTerm, parseFormulaStrict} from '@fmfi-uk-1-ain-412/js-fol-parser';
import {CONSTANT, PREDICATE, FUNCTION, DOMAIN, VARIABLE, TERM} from "../../../constants";
import {getLanguageObject} from "../../selectors/languageObject";
import Variable from "../../../model/term/Term.Variable";
import Constant from "../../../model/term/Term.Constant";
import FunctionTerm from "../../../model/term/Term.FunctionTerm";
import PredicateAtom from "../../../model/formula/Formula.PredicateAtom";
import EqualityAtom from "../../../model/formula/Formula.EqualityAtom";
import Negation from "../../../model/formula/Formula.Negation";
import Conjunction from "../../../model/formula/Formula.Conjunction";
import Disjunction from "../../../model/formula/Formula.Disjunction";
import Implication from "../../../model/formula/Formula.Implication";
import ExistentialQuant from "../../../model/formula/Formula.ExistentialQuant";
import UniversalQuant from "../../../model/formula/Formula.UniversalQuant";
import Equivalence from "../../../model/formula/Formula.Equivalence";

export function parseLanguage(state, value, type){
    let previousParsed = state.parsed;
    state.value = value;
    state.errorMessage = '';
    if (value.length === 0) {
        state.parsed = [];
        return;
    }
    try {
        let parsedValue;
        switch(type){
            case CONSTANT:
                parsedValue = parseConstants(value);
                break;
            case PREDICATE:
                parsedValue = parsePredicates(value);
                break;
            case FUNCTION:
                parsedValue = parseFunctions(value);
                break;
        }

        if (parsedValue.items) {
            state.parsed = parsedValue.items;
        } else {
            state.parsed = parsedValue;
        }
    } catch (e) {
        console.error(e);
        state.errorMessage = e.message;
        state.parsed = previousParsed;
    }
}

export function parseStructure(state, value, wholeState, type){
    state.value = value;
    state.errorMessage = '';
    if (value.length === 0) {
        state.parsed = [];
        return;
    }
    try {
        let parsedValue;
        switch(type){
            case DOMAIN:
                parsedValue = parseDomain(value);
                break;
            case PREDICATE:
            case FUNCTION:
                parsedValue = parseTuples(value);
                break;
            case VARIABLE:
                parsedValue = parseValuation(value, getLanguageObject(wholeState).getLanguage());
                break;
        }

        if (parsedValue.items) {
            state.parsed = parsedValue.items;
        } else {
            state.parsed = parsedValue;
        }
    } catch (e) {
        console.error(e);
        state.errorMessage = e.message;
        state.parsed = [];
    }
}

export function parseExpression(state, value, wholeState, type){
    let language = getLanguageObject(wholeState);
    state.value = value;
    state.errorMessage = '';
    if (value.length === 0) {
        state.parsed = null;
        return;
    }
    try {
        let parsedValue;
        if(type === TERM){
            const termFactories = getTermFactories(language);
            parsedValue = parseTerm(value, language.getLanguage(), termFactories);
        } else {
            const formulaFactories = getFormulaFactories(language);
            parsedValue = parseFormulaStrict(value, language.getLanguage(), formulaFactories);
        }
        if (parsedValue.items) {
            state.parsed = parsedValue.items;
        } else {
            state.parsed = parsedValue;
        }
    } catch (e) {
        console.error(e);
        state.errorMessage = e.message;
        state.parsed = null;
    }
}

function getTermFactories(language){
    return({
        variable: (symbol, _) =>
            new Variable(symbol),
        constant: (symbol, _) =>
            new Constant(symbol),
        functionApplication: (funSymbol, args, ee) => {
            language.checkFunctionArity(funSymbol, args, ee);
            return new FunctionTerm(funSymbol, args);
        }
    });
}

function getFormulaFactories(language){
    return({...getTermFactories(language), ...{
        predicateAtom: (predSymbol, args, ee) => {
            language.checkPredicateArity(predSymbol, args, ee);
            return new PredicateAtom(predSymbol, args);
        },
        equalityAtom: (lhs, rhs, _) =>
            new EqualityAtom(lhs, rhs),
        negation: (formula, _) =>
            new Negation(formula),
        conjunction: (lhs, rhs, _) =>
            new Conjunction(lhs, rhs),
        disjunction: (lhs, rhs, _) =>
            new Disjunction(lhs, rhs),
        implication: (lhs, rhs, _) =>
            new Implication(lhs, rhs),
        equivalence: (lhs, rhs, _) =>
            new Equivalence(lhs, rhs),
        existentialQuant: (variable, formula, _) =>
            new ExistentialQuant(variable, formula),
        universalQuant: (variable, formula, _) =>
            new UniversalQuant(variable, formula)
    }});
}


