import React from 'react';
import FontAwesome from 'react-fontawesome';
import {Button, ButtonGroup, ButtonToolbar} from 'react-bootstrap';
import ModalComponent from '../math_view/components_parts/ModalComponent';
import HelpGraphButton from "./HelpGraphButton";

const ButtonToolbarComponent = ({clearGraphSelection,exportState,setExerciseNameState,modalShowState,diagramToggledState,teacherModeState,setDiagramToggledState, setModelShowState, importState, setTeacherModeState}) => (
    <ButtonToolbar>
        <ButtonGroup className='mr-2'>
        <Button variant='outline-primary' title='Switch to set view' className={diagramToggledState?'':' active'} onClick={() => {
            setDiagramToggledState(false);
        }}>
            <strong>&#123;&nbsp;&#125;</strong>
            <span className='d-none d-sm-inline'>&nbsp;Sets</span>
        </Button>

        <Button variant='outline-primary' title='Switch to graph view' className={diagramToggledState?' active':''} onClick={() => setDiagramToggledState(true)}>
            <FontAwesome name='fas fa-project-diagram'/>
            <span className='d-none d-sm-inline'>&nbsp;Graph</span>
        </Button>
        </ButtonGroup>

        <ButtonGroup className='mr-2'>
        <Button size="md" variant='secondary' title='Export this exercise' onClick={() => {setModelShowState(true);clearGraphSelection();}}>
            <FontAwesome name='fas fa-file-export'/>
            <span className='d-none d-sm-inline'>&nbsp;Export</span>
        </Button>

        <Button variant='secondary' title='Import an exercise'
                onClick={() => document.getElementById('uploadInput').click()}>
            <FontAwesome name='fas fa-file-import'/>
            <input id='uploadInput' type='file' name='jsonFile'
                   onChange={(e) => {
                       importState(e);
                   }}
                   hidden={true}
                   style={{display: 'none'}}/>
            <span className='d-none d-sm-inline'>&nbsp;Import</span>
        </Button>
        </ButtonGroup>

        {diagramToggledState ?
            <ButtonGroup className='mr-2'>
                <HelpGraphButton/>
            </ButtonGroup>: null
        }

        <ModalComponent exportState={exportState} modalShowState={modalShowState} setExerciseNameState={setExerciseNameState} setModalShowState={setModelShowState}/>

        {/*<ButtonGroup>
        <Button variant={'outline-success'} size='lg' title='Teacher mode' className={(teacherModeState?'active':'')} onClick={() => setTeacherModeState()}>
            <FontAwesome name='fas fa-user-edit'/>
            <span className='d-none d-sm-inline'>&nbsp;Teacher mode</span>
        </Button>
        </ButtonGroup>*/}
    </ButtonToolbar>
);

export default ButtonToolbarComponent;