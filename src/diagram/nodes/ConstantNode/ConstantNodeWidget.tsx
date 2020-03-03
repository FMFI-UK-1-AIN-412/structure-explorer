import * as React from 'react';
import { ConstantNodeModel } from './ConstantNodeModel';
import { DiagramEngine, PortWidget, PortModel } from '@projectstorm/react-diagrams';
import styled from '@emotion/styled';
import _ from 'lodash';
import { Port } from "./ConstantPortLabelWidget";

export interface ConstantNodeWidgetProps {
	node: ConstantNodeModel;
	engine: DiagramEngine;
	setDomain:any;
	changeDomain:any;
	name?:string;
	size?: number;
}

interface ConstantNodeWidgetState {
	renameActive?:boolean;
	titleChanged?:boolean;
	nodeName?:string;
}

export const Node = styled.div<{ background: string; selected: boolean }>`
		background-color: ${p => p.background};
		border-radius: 50%;
		font-family: sans-serif;
		color: black;
		border: solid 2px black;
		overflow: hidden;
		font-size: 11px;
		border: solid 2.5px ${p => (p.selected ? 'rgb(0,192,255)' : 'black')};
		justify-items: center;
		text-align:center;
	`;

export const Title = styled.div`
		//background: rgba(0, 0, 0, 0.3);
		display: flex;
		white-space: nowrap;
		justify-items: center;
		text-align:center;
	`;

export const TitleName = styled.div`
		flex-grow: 1;
		padding: 10px 10px;
				
		&:hover {
			background: #90EE90;
		}
	`;

export const Ports = styled.div`
		display: flex;
		//background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
	`;

export const PortsContainer = styled.div`
		flex-grow: 1;
		display: flex;
		flex-direction: column;

		&:first-of-type {
			margin-right: 10px;
		}

		&:only-child {
			margin-right: 0px;
		}
	`;

export class ConstantNodeWidget extends React.Component<ConstantNodeWidgetProps,ConstantNodeWidgetState> {
	constructor(props:ConstantNodeWidgetProps){
		super(props);

		this.state={
			renameActive:false,
			titleChanged:false,
			nodeName:this.props.node.getOptions().name
		}
	}

	generatePort = (port:any) =>{
		if(port.options.name!=="+") {
			return (
				//<ConstantPortLabelWidget engine={this.props.engine} port={port} width={this.props.node.getOptions().name.length*10}/>
				<PortWidget engine={this.props.engine} port={this.props.node.getPort(port.options.name)}>
					<Port height={20} width={this.props.node.getOptions().name.length * 10}>{port.options.name}</Port>
				</PortWidget>
			)
		}
	};

	componentDidUpdate(prevProps: Readonly<ConstantNodeWidgetProps>, prevState: Readonly<ConstantNodeWidgetState>, snapshot?: any): void {
		if(this.state.renameActive){
			this.props.node.setLocked(true);
		}
		else{
			this.props.node.setLocked(false);

			if(this.state.nodeName!==this.props.node.getNodeName()){
				//call redux store

				let state = this.props.changeDomain(this.state.nodeName,this.props.node.getNodeName());
				this.props.node.renameNode(this.state.nodeName);
			}
		}
	}

	render() {
		return (
			<Node
				data-basic-node-name={this.props.name}
				selected={this.props.node.isSelected()}
				background={this.props.node.getOptions().color}>
				<Title>
					<TitleName onDoubleClick={() => {
						this.setState({renameActive: !this.state.renameActive});
					}}>
						{!this.state.renameActive ? this.state.nodeName :
							<input autoFocus type="text" style={{width:this.props.node.getOptions().name.length * 8+"px",height:20+"px"}} name="" value={this.state.nodeName} onChange={e => this.setState({nodeName:e.target.value})}/>
						}
					</TitleName>
				</Title>
				<Ports>
					<PortsContainer>{_.map(this.props.node.getPorts(), this.generatePort)}</PortsContainer>
				</Ports>
			</Node>)
	}
}
