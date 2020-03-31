import {Col, Form} from "react-bootstrap";
import {PREDICATE} from "../../constants";
import React from "react";
import {RelationalTable,DatabasePredicate} from './index'
import TextInput from "./TextInput";

function PredicateInterpretation({structure,predicates,setPredicateValueText,lockPredicateValue,toggleTable,toggleDatabase,domain,setPredicateValueTable,structureObject,teacherMode,lengthOfCol}){
    return(
        <Col lg={lengthOfCol}>
            <Form.Label>Interpretácia predikátových symbolov</Form.Label>
                {predicates.map((name) =>
                    <Form.Group>
                        <TextInput
                                   errorProperty={structure.predicates[name].errorMessage}
                                   onChange={(e) => setPredicateValueText(e.target.value, name)}
                                   onLock={() => lockPredicateValue(name)}
                                   textData={structure.predicates[name]}
                                   label={<span><var>i</var>({name.split('/')[0]}) = &#123;</span>}
                                   teacherMode={teacherMode}
                                   id={'predicate-' + name}
                                   toggleTable={() => toggleTable(PREDICATE, name)}
                                   toggleDatabase={() => toggleDatabase(PREDICATE, name)}
                                   databaseEnabled={structure.predicates[name].databaseEnabled}
                                   tableEnabled={structure.predicates[name].tableEnabled}
                                   arity={parseInt(name.split('/')[1])}
                                   domain={domain}
                                   placeholder='(1,2), (2,2), (3,1), ...'/>
                        {structure.predicates[name].tableEnabled && domain.length > 0 ? (
                            <RelationalTable name={name} domain={structureObject.domain}
                                             arity={structureObject.language.getPredicate(name.split('/')[0])}
                                             value={structureObject.iPredicate.get(name) ? structureObject.iPredicate.get(name) : []}
                                             onInputChange={setPredicateValueTable}
                                             type={PREDICATE}
                                             disabled={structure.predicates[name].locked}/>
                        ) : null}
                        {structure.predicates[name].databaseEnabled && domain.length > 0? (
                            <DatabasePredicate name={name} domain={structureObject.domain}
                                              arity={structureObject.language.getPredicate(name.split('/')[0])}
                                              value={structureObject.iPredicate.has(name) ? structureObject.iPredicate.get(name) : {}}
                                              onInputChange={setPredicateValueTable}
                                              disabled={structure.predicates[name].locked}
                                              type={PREDICATE}/>
                        ) : null}
                    </Form.Group>
                )}
        </Col>
    )
}
export default PredicateInterpretation;