import Formula from "./Formula";
import {GAME_QUANTIFIER, PLAYER_QUANTIFIER} from "../../constants/gameConstants";

/**
 * Represent universal quantificator
 * @author Milan Cifra
 * @class
 * @extends Formula
 */
class UniversalQuant extends Formula {

  /**
   *
   * @param {string} variableName
   * @param {Formula} subFormula
   */
  constructor(variableName, subFormula) {
    super();
    this.variableName = variableName;
    this.subFormula = subFormula;
  }

  /**
   *
   * @param {Structure} structure
   * @param {Map} e
   * @return {boolean}
   */
  eval(structure, e) {
    let eCopy = new Map(e);
    for (let item of structure.domain) {
      eCopy.set(this.variableName, item);
      if (!this.subFormula.eval(structure, eCopy)) {
        return false;
      }
    }
    return true;
  }

  /**
   *
   * @returns {string}
   */
  toString() {
    return `∀${this.variableName} (${this.subFormula.toString()})`;
  }

  createCopy(){
    let subFormula = this.subFormula.createCopy();
    let variableName = this.variableName;
    return new UniversalQuant(variableName, subFormula);
  }

  getType(commitment){
    return commitment ? GAME_QUANTIFIER : PLAYER_QUANTIFIER;
  }

  getSubFormulas(){
    return [this.subFormula];
  }

  setVariable(from, to){
    this.subFormula.setVariable(from, to);
  }
}

export default UniversalQuant;