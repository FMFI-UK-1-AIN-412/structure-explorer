import {BasePositionModelOptions} from "@projectstorm/react-canvas-core";
import {NodeModel, NodeModelGenerics, PortModelAlignment} from "@projectstorm/react-diagrams";
import {UnBinaryPortModel} from "./unbinary/UnBinaryPortModel";
import _ from "lodash";
import {NaryRelationPortModel} from "./NaryRelationPortModel";
import {UnBinaryNodeModel} from "./unbinary/UnBinaryNodeModel";
import {FUNCTION, PREDICATE} from "./ConstantNames";

export interface BaseNodeModelGenerics {
    PORT: NaryRelationPortModel;
    OPTIONS: BaseNodeModelOptions;
}

export interface BaseNodeModelOptions extends BasePositionModelOptions {
    name?: string;
    color?: string;
    numberOfPorts: number;
    reduxProps:any;
}

export class BaseNodeModel extends NodeModel<NodeModelGenerics & BaseNodeModelGenerics> {
    changeCounter: number;
    editable:boolean;
    predicates: Set<string>;
    functions: Set<string>;
    parameterPorts: Map<NaryRelationPortModel,UnBinaryNodeModel>;
    parameterPortsArray: Array<NaryRelationPortModel>;

    constructor(options?: BaseNodeModelOptions);
    constructor(options: any = {}) {
        super({
            ...options
        });

        this.changeCounter = 0;
        this.predicates = new Set();
        this.functions = new Set();
        this.parameterPorts = new Map<NaryRelationPortModel,UnBinaryNodeModel>();
        this.parameterPortsArray = new Array<NaryRelationPortModel>(this.getNumberOfPorts());
        this.editable = this.getReduxProps()["editable"];
        this.registerEvents();
        this.registerParameterPorts();
    }

    registerParameterPorts(){
        let directions = [PortModelAlignment.LEFT,PortModelAlignment.RIGHT,PortModelAlignment.TOP,PortModelAlignment.BOTTOM];
        for(let i = 0;i<this.getNumberOfPorts();i++){
            let port = this.addPort(new NaryRelationPortModel(directions[i]));
            this.parameterPorts.set(port,null);
            this.parameterPortsArray[i] = port;
        }
    }

    getNodeNameCombination(){
        let value = "";

        for(let i = 0; i<this.parameterPortsArray.length;i++){
            let portValue:UnBinaryNodeModel = this.parameterPorts.get(this.parameterPortsArray[i]);
            if(!portValue){
                return "";
            }
            value+=portValue.getNodeName()+",";
        }
        return value.substring(0,value.length-1);
    }

    getValueOfPort(port:NaryRelationPortModel){
        if(this.parameterPorts.has(port)){
            return this.parameterPorts.get(port);
        }
        return null;
    }

    getValueNameOfPort(port:NaryRelationPortModel){
        if(this.parameterPorts.has(port)){
            return this.parameterPorts.get(port).getNodeName();
        }
        return null;
    }

    removeValueFromPort(port:NaryRelationPortModel){
        this.parameterPorts.set(port,null);
    }

    removePredFuncFromMathView(previousValue:string){
        if(previousValue){
         //remove by calling action
        }
    }

    setValueToPort(port:NaryRelationPortModel,valueNode:UnBinaryNodeModel){
        this.parameterPorts.set(port,valueNode);
        console.log("new value",valueNode.getNodeName());
        console.log(this.getNodeNameCombination());
    }

    increaseChangeCounter(){
        this.changeCounter+=1;
    }

    getNumberOfPorts(){
        return this.getOptions().numberOfPorts;
    }

    clearPredicates() {
        this.predicates = new Set();
        this.increaseChangeCounter();
    }

    clearFunctions() {
        this.functions = new Set();
        this.increaseChangeCounter();
    }

    getPredicates() {
        return this.predicates;
    }

    getFunctions(){
        return this.functions;
    }

    removePort(port: UnBinaryPortModel): void {
        for (let link of _.values(port.getLinks())) {
            link.remove();
        }
        //clear the parent node reference
        if (this.ports[port.getName()]) {
            this.ports[port.getName()].setParent(null);
            delete this.ports[port.getName()];
        }
    }

    serialize() {
        return {
            ...super.serialize(),
            changeCounter: this.changeCounter,
            editable: this.editable
        };
    }

    getPortByIndex(index:number){
        if(index<0 || index>= this.getNumberOfPorts()){
            return null;
        }
        return this.parameterPortsArray[index];
    }

    deserialize(event: any) {
        super.deserialize(event);
        this.changeCounter = event.date.changeCounter;
        this.editable = event.data.editable;
    }

    registerEvents() {
        let node = this;
        this.registerListener({
            entityRemoved(): void {
                node.removeNodeFromMathView();
            }
        })
    }

    changeEditableState(value:boolean){
        this.editable = value;
    }

    getNodeName() {
        return this.getOptions().name;
    }

    renameNode(name: string) {
        this.getOptions().name = name;
    }

    isEditable():boolean{
        return this.editable;
    }

    addPredicateToSet(name: string){
        this.predicates.add(name);
        this.increaseChangeCounter();
    }

    addFunctionToSet(name: string){
        this.functions.add(name);
        this.increaseChangeCounter();
    }

    removePredicateFromSet(name: string){
        this.predicates.delete(name);
        this.increaseChangeCounter();
    }

    removeFunctionFromSet(name: string){
        this.predicates.delete(name);
        this.increaseChangeCounter();
    }

    removeNodeFromMathView(){
        throw new Error("This method should be implemented in child");
    }

    addPredicate(name:string){
        name = name.replace(/\s/g, "");
        if (!this.predicates.has(name)) {
            this.addPredicateToSet(name);
            this.addElementToMathView(name,PREDICATE);
        }
    }

    addFunction(name: string) {
        name = name.replace(/\s/g, "");
        if (!this.functions.has(name)) {
            this.addFunctionToSet(name);
            this.addElementToMathView(name,FUNCTION);
        }
    }

    removePredicate(name:string){
        if(this.predicates.has(name)){
            this.removeElementFromMathView(name,PREDICATE);
        }
        this.removePredicateFromSet(name);
    }

    removeFunction(name:string){
        if(this.functions.has(name)){
            this.removeElementFromMathView(name,FUNCTION);
        }
        this.removeFunctionFromSet(name);
    }


    addElementToMathView(name:string,type:string){
        throw new Error("This method should be implemented in child");
    }

    removeElementFromMathView(name:string,type:string){
        throw new Error("This method should be implemented in child");
    }

    getReduxProps(){
        return this.getOptions().reduxProps;
    }
}