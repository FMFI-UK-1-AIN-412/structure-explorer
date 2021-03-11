import { createSelector } from 'reselect'
import Structure from "../../model/Structure";
import {getLanguageObject} from "./languageObject";

const getConstants = state => getDataFromStructure(state.structure.constants)
const getFunctions = state => getDataFromStructure(state.structure.functions)
const getPredicates = state => getDataFromStructure(state.structure.predicates)
const getParsedDomain = state => state.structure.domain.parsed

export const getStructureObject = createSelector(
    [getLanguageObject, getConstants, getFunctions, getPredicates, getParsedDomain],
    (language, constants, functions, predicates, parsedDomain) => {
       return new Structure(language, parsedDomain, constants, predicates, functions);
    }
)

function getDataFromStructure(state){
    let keys = Object.keys(state);
    let array = [];
    if(keys.length === 0){
        return array;
    }
    for(let key of keys){
        array.push({name: key, values: state[key].parsed, value: state[key].value})
    }
    console.log(array);
    return array;
}
