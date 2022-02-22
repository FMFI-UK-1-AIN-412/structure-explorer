import {
    CONSTANT_IN_LANGUAGE,
    EMPTY_CONSTANT_VALUE, FUNCTION_ALREADY_DEFINED,
    FUNCTION_IN_LANGUAGE, FUNCTION_NOT_FULL_DEFINED,
    PREDICATE_IN_LANGUAGE
} from "../../../constants/messages";


export function validateLanguageConstants(state){
    if(state.constants.errorMessage){
        return;
    }
    state.constants.parsed.forEach(c => {
        if (state.functions.parsed && state.functions.parsed.some(value => value.name === c)) {
            state.constants.errorMessage = `${FUNCTION_IN_LANGUAGE} ${c}`;
            return;
        }
        if (state.predicates.parsed && state.predicates.parsed.some(value => value.name === c)) {
            state.constants.errorMessage = `${PREDICATE_IN_LANGUAGE} ${c}`;
            return;
        }
        if (state.constants.parsed.filter(value => value === c).length > 1) {
            state.constants.errorMessage = `${CONSTANT_IN_LANGUAGE}  ${c}`;
            return;
        }
    });
}

export function validateLanguagePredicates(state){
    if(state.predicates.errorMessage){
        return;
    }
    state.predicates.parsed.forEach(p => {
        if (state.constants.parsed && state.constants.parsed.some(value => value === p.name)) {
            state.predicates.errorMessage = `${CONSTANT_IN_LANGUAGE} ${p.name}`;
            return;
        }
        if (state.functions.parsed && state.functions.parsed.some(value => value.name === p.name)) {
            state.predicates.errorMessage = `${FUNCTION_IN_LANGUAGE} ${p.name}`;
            return;
        }
        if(state.predicates.parsed.filter(value => value.name === p.name).length > 1){
            state.predicates.errorMessage = `${PREDICATE_IN_LANGUAGE} ${p.name}`;
            return;
        }
    });
}

export function validateLanguageFunctions(state){
    if(state.functions.errorMessage){
        return;
    }
    state.functions.parsed.forEach(f => {
        if (state.constants.parsed && state.constants.parsed.some(value => value === f.name)) {
            state.functions.errorMessage = `${CONSTANT_IN_LANGUAGE} ${f.name}`;
            return;
        }
        if (state.predicates.parsed && state.predicates.parsed.some(value => value.name === f.name)) {
            state.functions.errorMessage = `${PREDICATE_IN_LANGUAGE} ${f.name}`;
            return;
        }
        if(state.functions.parsed.filter(value => value.name === f.name).length > 1){
            state.functions.errorMessage = `${FUNCTION_IN_LANGUAGE} ${f.name}`;
            return;
        }
    });
}

export function validateStructureConstants(constantName, value, constants, domainValues){
    if (!constants[constantName]) {
        throw `Jazyk neobsahuje konštantu ${constantName}`;
    }
    if (!domainValues.includes(value)) {
        throw EMPTY_CONSTANT_VALUE;
    }
}

export function validateStructurePredicates(predicateValues, domainValues, arity){
    let message = '';
    predicateValues.forEach(tuple => {
        if(tuple.length !== parseInt(arity)){
            message = `N-tica ${tuple} nemá povolený počet prvkov`;
            return;
        }
        if (predicateValues.filter(t => JSON.stringify(t) === JSON.stringify(tuple)).length > 1) {
            message = `N-tica ${tuple} sa v predikáte už nachádza`;
            return;
        }
        let illegalItems = tuple.filter(t => !domainValues.includes(t));
        if(illegalItems.length > 0){
            message = `Prvok ${illegalItems[0]} nie je v doméne štruktúry`;
            return;
        }
    });
    return message;
}

export function validateStructureFunctions(functionValues, domainValues, arity){
    let message = '';
    let usedParams = [];
    arity = parseInt(arity);
    functionValues.forEach(tuple => {
        let params = tuple.slice(0, tuple.length - 1); //takes just the arguments of the function
        let stringParams = params.join(",");
        if(usedParams.includes(stringParams)){
            message = FUNCTION_ALREADY_DEFINED(params);
            return;
        }
        if(params.length !== arity){
            message = `Prvok ${tuple.length == 1 ? tuple : `(${tuple})`} nezodpovedá arite funkčného symbolu, prvky interpretácie musia byť ${arity + 1}-tice`;
            return;
        }
        let illegalItems = tuple.filter(t => !domainValues.includes(t));
        if (illegalItems.length > 0) {
            message = `Prvok ${illegalItems[0]} nie je v doméne štruktúry`;
            return;
        }
        usedParams.push(stringParams);
    });

    if(message === '') {
        if (functionValues.length !== Math.pow(domainValues.length, arity)) {
            message = FUNCTION_NOT_FULL_DEFINED;
        }
    }
    return message;
}
