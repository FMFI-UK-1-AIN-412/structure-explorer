import * as React from 'react';
import { UnBinaryNodeModel } from './UnBinaryNodeModel';
import { DiagramEngine, PortWidget } from '@projectstorm/react-diagrams';
import styled from '@emotion/styled';
import _ from 'lodash';
import { Port } from "./UnBinaryPortLabelWidget";
import {ADDPORT, ADDPORTSELECTED, UNBINARY} from "../ConstantNames";
import FontAwesome from "react-fontawesome";
import {Predicate, PredicateRowContainer} from "../../labels/binary/BinaryLabelWidget";
import {DropDownMenuWidget} from "../DropDownMenuWidget";

export interface UnBinaryNodeWidgetProps {
	node: UnBinaryNodeModel;
	engine: DiagramEngine;
	renameDomainNode:any;
	removeDomainNode:any;
	checkBadName:any;
	name?:string;
	size?: number;
}

interface UnBinaryNodeWidgetState {
	renameActive?:boolean;
	titleChanged?:boolean;
	nodeName?:string;
	badName?:boolean;
	predicateDropDownMenu?:boolean;
	badNameForNewPredicate?:boolean;
	inputElementTextLength?:number;
}

export const Node = styled.div<{ background: string; selected: boolean, pointerEvents: string, cursor:string}>`
		width: 100%;
		pointer-events: ${p => p.pointerEvents};
		cursor: ${p => p.cursor};
		/*background-color: ${p => p.background};*/
		background-color: green;
		border-radius: 5px;
		font-family: sans-serif;
		font-weight: bold;
		color: black;
		overflow: visible;
		font-size: 13px;
		border: solid 2px ${p => (p.selected ? 'rgb(0,192,255)' : 'black')};
	`;

export const DropDownNode = styled.div<{ background: string; selected: boolean, pointerEvents: string, cursor:string}>`
		width: 100%;
		pointer-events: ${p => p.pointerEvents};
		cursor: ${p => p.cursor};
		/*background-color: ${p => p.background};*/
		background-color: green;
		border-radius: 5px;
		font-family: sans-serif;
		font-weight: bold;
		color: black;
		overflow: visible;
		font-size: 13px;
		border: solid 2px black;
	`;

export const DropDownPorts = styled.div`
		display: flex;
		background-image: linear-gradient(rgba(256, 256, 256, 0.9), rgba(256, 256, 256, 0.9));
	`;

export const Title = styled.div`
		width: 100%;
		background: rgba(256, 256, 256, 0.45);
		display: flex;
		white-space: nowrap;
		justify-items: center;
		text-align:center;
	`;

export const TitleName = styled.div`
		width: 100%;
		flex-grow: 1;
		padding: 5px 5px;
				
		&:hover {
			background: rgba(256, 256, 256, 0.7);
		}
	`;

export const Ports = styled.div`
		display: flex;
		background-image: linear-gradient(rgba(256, 256, 256, 0.55), rgba(256, 256, 256, 0.65));
	`;

export const PortsContainer = styled.div`
		width: auto;
		display: flex;
		flex-direction: column;
		flex: 1 0 0;
	`;

export const PredicateButton = styled.div`
		outline: none;
		cursor: pointer;
		height: 20px;
		background: rgba(white, 0.1);
		color: black;
		text-align:center;
		padding-left:0.2em;
		padding-right:0.2em;
		
		&:hover {
			background: #00ff80;
		}
	`;

export const InputElement = styled.div`
		width: 100%;
		flex-grow: 1;
		padding: 3px 3px;
	`;

export class UnBinaryNodeWidget extends React.Component<UnBinaryNodeWidgetProps,UnBinaryNodeWidgetState> {
	_isMounted:boolean = true;

	constructor(props: UnBinaryNodeWidgetProps) {
		super(props);

		this.state = {
			renameActive: false,
			titleChanged: false,
			nodeName: this.props.node.getOptions().name,
			badName: false,
			badNameForNewPredicate: false,
			predicateDropDownMenu: false,
			inputElementTextLength: 0
		};
		this.setBadNameState = this.setBadNameState.bind(this);
		this.setBadNameForNewPredicateState = this.setBadNameForNewPredicateState.bind(this);
		this.setInputElementTextLength = this.setInputElementTextLength.bind(this);
	}

	componentWillUnmount(): void {
		//this._isMounted = false;
	}

	componentDidMount(): void {
		this._isMounted = true;
	}

	componentDidUpdate(prevProps: Readonly<UnBinaryNodeWidgetProps>, prevState: Readonly<UnBinaryNodeWidgetState>, snapshot?: any): void {
		this.isPredicateDropDownMenu();
	}

	generatePredicate = (predicate: string) => {
		return (

			<PredicateRowContainer key={predicate} >
				<Predicate>
					{predicate}
				</Predicate>
				<PredicateButton onClick={() =>{
					this.props.node.removeUnaryPredicate(predicate);
					this.props.engine.repaintCanvas();
				}}><FontAwesome name={"fas fa-trash"}/></PredicateButton>
			</PredicateRowContainer>
		)
	};

	generateAvailablePredicate = (predicate: string) => {
		return (
			<PredicateRowContainer key={predicate} >
				<Predicate onClick={() =>{
					this.props.node.addUnaryPredicate(predicate);
					this.props.engine.repaintCanvas();
				}}>
					{predicate}
				</Predicate>
				<PredicateButton onClick={() =>{
					this.props.node.addUnaryPredicate(predicate);
					this.props.engine.repaintCanvas();
				}}><FontAwesome name={"fas fa-plus"}/></PredicateButton>
			</PredicateRowContainer>
		)
	};

	checkBadPredName(predName:string,arity:string){
		predName = predName.replace(/\s/g, "");

		if(predName === ""){
			this.setState({badNameForNewPredicate:true});
			return;
		}

		this.setState({badNameForNewPredicate:!this.props.node.canUsePredicateForGivenArity(predName,arity)});
	}

	cancelRenameNode() {
		if(!this._isMounted){
			return;
		}
		this.setState({renameActive: false, nodeName: this.props.node.getNodeName(), badName: false});
		this.props.node.setLocked(false);
	}

	renameNode(nodeName:string) {
		if(!this._isMounted){
			return;
		}
		this.props.node.setLocked(false);

		if (nodeName !== this.props.node.getNodeName()) {
			if (!this.state.badName) {
				this.props.renameDomainNode(this.props.node.getNodeName(),nodeName);
				this.props.node.renameNode(nodeName);
			}
		}

		this.setState({nodeName: this.props.node.getNodeName()});
		this.setState({renameActive: false});
		this.setState({badName: false});
	}

	setBadNameState(bool: boolean) {
		if(!this._isMounted){
			return;
		}

		this.setState({badName: bool});
	}

	setInputElementTextLength(length: number){
		this.setState({inputElementTextLength:length});
	}

	setBadNameForNewPredicateState(bool:boolean){
		this.setState({badNameForNewPredicate: bool});
	}

	isPredicateDropDownMenu(){
		if(!this.props.node.isSelected() && this.state.predicateDropDownMenu){
			this.setState({predicateDropDownMenu:false});
		}
	}

	getWidestElement():number{
		let width:number = this.state.nodeName.length;
		let minimumWidth:number = this.props.node.getNodeName().length;

		if(this.state.renameActive){
			if(width<minimumWidth){
				width = minimumWidth;
			}
		}

		if(this.state.predicateDropDownMenu){
			let predicateWidth = this.props.node.getMaximumLengthOfPredicatesForGivenArity("1");
			if(width<predicateWidth){
				width = predicateWidth;
			}
			if(this.state.inputElementTextLength>width){
				width = this.state.inputElementTextLength;
			}
		}
		return width;
	}

	render() {
		let width = this.getWidestElement();

		return (
			<div>
			<Node
				data-basic-node-name={this.props.name}
				selected={this.props.node.isSelected()}
				background={this.props.node.getOptions().color}
				pointerEvents={this.props.node.isEditable()?"auto":"none"}
				cursor={this.props.node.isEditable()?"pointer":"move"}
			>
				<Title>
					<PortWidget style={{flexGrow: 1}} engine={this.props.engine} port={this.props.node.getMainPort()}>
						<TitleName onDoubleClick={() => {
							if(this.state.predicateDropDownMenu){
								this.setState({predicateDropDownMenu:false});
							}
							if (!this.state.renameActive  && this._isMounted) {
								this.setState({renameActive: true});
								this.props.node.setLocked(true);
								this.props.engine.getModel().clearSelection();
								this.props.node.setSelected(true);
							}
						}}>
							{!this.state.renameActive ? this.props.node.getNodeName() :
								<input autoFocus onBlur={() => {
									let name = this.state.nodeName.replace(/\s/g, "");
									this.renameNode(name);
								}
								}
									   onKeyDown={(e) => {
										   if (e.key === "Escape") {
											   this.cancelRenameNode();
										   } else if (e.key === "Enter") {
											   let name = this.state.nodeName.replace(/\s/g, "");
											   this.renameNode(name);
										   }
									   }
									   }

									   type="text" style={{
									width: (width+1.5)+"ch",
									height: 20 + "px",
									border: this.state.badName ? "1px solid red" : "1px solid black"
								}} name="" value={this.state.nodeName}
									   onChange={(e) => {
										   this.setState({nodeName: e.target.value});
										   let name:string = e.target.value.replace(/\s/g, "");
										   this.props.checkBadName(name, this.props.node.getNodeName(), this.setBadNameState, UNBINARY);
									   }}/>
							}
						</TitleName>
					</PortWidget>
				</Title>
				<Ports>
					<PortsContainer>
						{_.map(Array.from(this.props.node.getUnaryPredicates()), this.generatePredicate)}
						<PortWidget style={{flexGrow: 1}} engine={this.props.engine} port={this.props.node.getAppendPort()}>
							<Port onClick={() => {
								if(this.state.predicateDropDownMenu){
									this.setState({predicateDropDownMenu:false});
									this.props.engine.getModel().clearSelection();
									this.props.engine.repaintCanvas();
								}
								else{
									this.setState({predicateDropDownMenu:true, badNameForNewPredicate:true});
									this.props.engine.getModel().clearSelection();
									this.props.node.setSelected(true);
									this.props.engine.repaintCanvas();
								}
							}}
								   height={20} width={this.props.node.getOptions().name.length * 20}>{this.state.predicateDropDownMenu?ADDPORTSELECTED:ADDPORT}</Port>
						</PortWidget>
					</PortsContainer>
				</Ports>
			</Node>

				{(this.state.predicateDropDownMenu && this.props.node.isSelected())?
					<DropDownMenuWidget setStateInputElementTextLength={this.setInputElementTextLength} setStateBadNameForLanguageElement={this.setBadNameForNewPredicateState} activeDropDownMenu={this.state.predicateDropDownMenu} model={this.props.node} engine={this.props.engine} modelName={this.props.node.getNodeName()} badNameForLanguageElement={this.state.badNameForNewPredicate}/>:null
				}
			</div>
		)
	}
}
