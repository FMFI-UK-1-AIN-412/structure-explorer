import Formula from "./Formula";
import {ATOM} from "../../constants/gameConstants";

/**
 * Represent predicate symbol
 * @author Milan Cifra
 * @class
 * @extends Formula
 */
class PredicateAtom extends Formula {

  /**
   *
   * @param {string} name
   * @param {Term[]} terms
   */
  constructor(name, terms = []) {
    super();
    this.name = name;
    this.terms = terms;
  }

  /**
   *
   * @param {Structure} structure
   * @param {Map} e
   * @return {boolean}
   */
  eval(structure, e) {
    let translatedTerms = [];
    this.terms.forEach(term => {
      translatedTerms.push(term.eval(structure, e));
    });
    let arity = structure.language.predicates.get(this.name);
    if (structure.iPredicate.get(this.name + '/' + arity) === undefined) {
      throw `Interpretácia predikátového symbolu ${this.name} nie je definovaná`;
    }
    let value = structure.iPredicate.get(this.name + '/' + arity);
    return value.findIndex(e => JSON.stringify(e) === JSON.stringify(translatedTerms)) > -1;
  }

  /**
   *
   * @returns {string}
   */
  toString() {
    let res = this.name + '(';
    for (let i = 0; i < this.terms.length; i++) {
      if (i > 0) {
        res += ', ';
      }
      res += this.terms[i].toString();
    }
    res += ')';
    return res;
  }

  createCopy(){
    let terms = [];
    for(let term of this.terms){
        terms.push(term.createCopy());
    }
    let name = this.name;
    return new PredicateAtom(name, terms);
  }

  getType(commitment){
    return ATOM;
  }

  getSubFormulas(){
    return [];
  }

  substitute(from, to){
    return new PredicateAtom(this.name, this.terms.map(term => term.substitute(from, to)));
  }

  getSubFormulasCommitment(commitment){
    return [];
  }

  getVariables(){
    return this.terms.flatMap(term => term.getVariables());
  }
}

export default PredicateAtom;