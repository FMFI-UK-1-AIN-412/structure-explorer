import createEngine,{DiagramModel, DiagramEngine, DefaultDiagramState } from '@projectstorm/react-diagrams';
import {UnBinaryNodeFactory} from "./nodes/unbinary/UnBinaryNodeFactory";
import {ConstantNodeFactory} from "./nodes/constant/ConstantNodeFactory";
import {BinaryLabelFactory} from "./labels/binary/BinaryLabelFactory";
import { SimplePortFactory } from './nodes/SimplePortFactory';
import {BinaryLinkFactory} from "./links/binary/BinaryLinkFactory";
import {QuaternaryNodeFactory} from "./nodes/quaternary/QuaternaryNodeFactory";
import {TernaryNodeFactory} from "./nodes/ternary/TernaryNodeFactory";
import {NaryRelationPortModel} from "./nodes/NaryRelationPortModel";

export class DiagramApplication {
	protected activeModel: DiagramModel;
	protected diagramEngine: DiagramEngine;

	constructor(diagramModel:DiagramModel) {
		this.diagramEngine = createEngine();
		this.setState();
		this.setModel(diagramModel);

		//Custom ports access
		this.diagramEngine.getPortFactories().registerFactory(new SimplePortFactory('nary', config => new NaryRelationPortModel()));
		//Custom nodes access
		this.diagramEngine.getNodeFactories().registerFactory(new QuaternaryNodeFactory());
		this.diagramEngine.getNodeFactories().registerFactory(new UnBinaryNodeFactory());
		this.diagramEngine.getNodeFactories().registerFactory(new ConstantNodeFactory());
		this.diagramEngine.getNodeFactories().registerFactory(new TernaryNodeFactory());
		//Custom link access
		this.diagramEngine.getLinkFactories().registerFactory(new BinaryLinkFactory());
		//Custom labels access
		this.diagramEngine.getLabelFactories().registerFactory(new BinaryLabelFactory());
	}

	public setState(){
		const state = this.diagramEngine.getStateMachine().getCurrentState();
		if (state instanceof DefaultDiagramState) {
			state.dragNewLink.config.allowLooseLinks = false;
		}
	}

	public setModel(diagramModel: DiagramModel) {
		this.diagramEngine.setModel(diagramModel);
		this.activeModel = diagramModel;
		//set number of links to zero, so if we will select a link it will not create a point
		//this.getDiagramEngine().setMaxNumberPointsPerLink(0);
	}

	public getActiveModel(): DiagramModel {
		return this.activeModel;
	}

	public getDiagramEngine(): DiagramEngine {
		return this.diagramEngine;
	}
}
