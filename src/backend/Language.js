/**
 * Represent language of logic
 * @author Milan Cifra
 * @class
 */
import InvalidLanguageException from "../exceptions/InvalidLanguageException";

class Language {

    /**
     *
     * @param {Set.<string>} constants Names of constants
     * @param {Map.<string, int>} functions Names of functions
     * @param {Map.<string, int>} predicates Names of predicates
     */
    constructor(constants = new Set(), functions = new Map(), predicates = new Map()) {
        this.constants = constants;
        this.functions = functions;
        this.predicates = predicates;
    }

    hasItem(item) {
        return this.hasConstant(item) || this.hasFunction(item) || this.hasPredicate(item);
    }

    clearAll() {
        this.constants = new Set();
        this.functions = new Map();
        this.predicates = new Map();
    }

    clearConstants() {
        this.constants.clear();
    }

    clearFunctions() {
        this.functions.clear();
    }

    clearPredicates() {
        this.predicates.clear();
    }

    setConstants(constants) {
        let newConstants = new Set();
        for (let i = 0; i < constants.length; i++) {
            if (this.predicates.has(constants[i])) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje predikát ' + constants[i]);
            }
            if (this.functions.has(constants[i])) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje funkciu ' + constants[i]);
            }
            if (newConstants.has(constants[i])) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje konštantu ' + constants[i]);
            }
            newConstants.add(constants[i]);
        }
        this.constants = newConstants;
    }

    setPredicates(predicates) {
        let newPredicates = new Map();
        for (let i = 0; i < predicates.length; i++) {
            if (this.constants.has(predicates[i].name)) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje konštantu ' + predicates[i].name);
            }
            if (this.functions.has(predicates[i].name)) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje funkciu ' + predicates[i].name);
            }
            if (newPredicates.has(predicates[i].name)) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje predikát ' + predicates[i].name);
            }
            newPredicates.set(predicates[i].name, predicates[i].arity);
        }
        this.predicates = newPredicates;
    }

    setFunctions(functions) {
        let newFunctions = new Map();
        for (let i = 0; i < functions.length; i++) {
            if (this.constants.has(functions[i].name)) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje konštantu ' + functions[i].name);
            }
            if (this.predicates.has(functions[i].name)) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje predikát ' + functions[i].name);
            }
            if (newFunctions.has(functions[i].name)) {
                throw new InvalidLanguageException('Jazyk štruktúry už obsahuje funkciu ' + functions[i].name);
            }
            newFunctions.set(functions[i].name, functions[i].arity);
        }
        this.functions = newFunctions;
    }

    /**
     * Add constant name to the language
     * @param {string} constantName Constant name
     */
    addConstant(constantName) {
        this.constants.add(constantName);
    }

    /**
     * Add function name to the language
     * @param {string} functionName Name of function
     * @param {int} arity Arity of function
     */
    addFunction(functionName, arity) {
        this.functions.set(functionName, arity);
    }

    /**
     * Add predicate name to the language
     * @param {string} predicateName Name of the predicate
     * @param {int} arity Arity of predicate
     */
    addPredicate(predicateName, arity) {
        this.predicates.set(predicateName, arity);
    }

    hasConstant(constantName) {
        return this.constants.has(constantName);
    }

    hasFunction(functionName) {
        return this.functions.has(functionName);
    }

    hasPredicate(predicateName) {
        return this.predicates.has(predicateName);
    }

    deleteConstant(constantName) {
        this.constants.delete(constantName);
    }

    deleteFunction(functionName) {
        this.functions.delete(functionName);
    }

    deletePredicate(predicateName) {
        this.predicates.delete(predicateName);
    }

    /**
     * Return arity of the function
     * @param {string} functionName
     * @return {int} arity of the function
     */
    getFunction(functionName) {
        return this.functions.get(functionName);
    }

    /**
     * Return arity of the predicate
     * @param {string} predicateName
     * @return {int} arity of the predicate
     */
    getPredicate(predicateName) {
        return this.predicates.get(predicateName);
    }

}

export default Language;