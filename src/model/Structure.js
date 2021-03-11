import {EMPTY_CONSTANT_VALUE} from "../constants/messages";

/**
 * Represent components_parts
 * @author Milan Cifra
 * @class
 */
class Structure {

  /**
   *
   * @param {Language} language
   */

  constructor(language, parsedDomain, constants,
              predicates, functions) {
    this.language = language;
    this.domain = new Set();
    this.iConstant = new Map();
    this.iPredicate = new Map();
    this.iFunction = new Map();
    parsedDomain.forEach(i => {
      this.domain.add(i);
    });

    constants.forEach(constant => {
      this.iConstant.set(constant.name, constant.value);
    });

    functions.forEach(func => {
      this.iPredicate.set(func.name, {});
      if(func.values === undefined){
        return;
      }
      func.values.forEach(tuple => {
        let params = tuple.slice(0, tuple.length - 1);
        let value = tuple[tuple.length - 1];
        this.iFunction.get(func.name)[JSON.stringify(params)] = value;
      });
    });

    predicates.forEach(predicate => {
      this.iPredicate.set(predicate.name, []);
      if(predicate.values === undefined){
        return;
      }
      predicate.values.forEach(tuple => {
        this.iPredicate.get(predicate.name).push(tuple);
      });
    });
    console.log(this);
  }
}

export default Structure;