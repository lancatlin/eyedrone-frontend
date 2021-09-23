import React, { useEffect, useState, useRef } from "react";
import ProgressBar from "./ProgressBar";
import Table from 'react-bootstrap/Table'
import '../popUp.css';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import axios from "../components/axios";



function useOutsideAlerter(ref, props) {
    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                props.onClick(null);
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);
}

function ModuleInfoPopUp(props) {
    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef, props);

    async function delModel() {
        if(!window.confirm("確定要刪除該模型?")) return;
        try {
            let res = await axios.delete('/api/models/' + props.id);
            console.log(res);
            window.location.reload();
        } catch(e) {
            console.log(e);
        }
    }

    return <div className="popUp-background">
        <div className="popUp" style={{ textAlign: "start", overflowY: "scroll"}} ref={wrapperRef}>
            <DeleteIcon style={{float: "right", margin: "20px"}} onClick={delModel}/>
            <EditIcon style={{float: "right", margin: "20px 5px"}} onClick={()=>{window.location.href="/newModule?id="+props.id}}/>
            <div style={{ margin: "20px" }}>
                <h2 style={{ fontWeight: "700" }}>{props.modelName}</h2>
                {props.substances.map((val, index) => {
                    return <div key={index}>
                        <h4 style={{ marginLeft: "0px" }}>{props.substances[index].name}</h4>
                        <Table striped bordered>
                            <tbody>
                                <tr>
                                    <td>formula</td>
                                    <td>{props.substances[index].formula}</td>
                                </tr>
                                <tr>
                                    <td rowSpan={props.substances[index].features.length}>features</td>
                                    <td key={0}>{props.substances[index].features[index]}</td>
                                </tr>
                                {props.substances[index].features.map((val, index) => index > 0 ? <tr key={2*index}><td>{val}</td></tr> : null)}

                                <tr>
                                    <td rowSpan={props.substances[index].coefficients.length}>coefficients</td>
                                    <td key={0}>{props.substances[index].coefficients[0]}</td>
                                </tr>
                                {props.substances[index].coefficients.map((val, index) => index > 0 ? <tr key={2*index+1}><td>{val}</td></tr> : null)}

                                <tr>
                                    <td>intercept</td>
                                    <td>{props.substances[index].intercept}</td>
                                </tr>
                                <tr>
                                    <td>r2</td>
                                    <td>{props.substances[index].r2}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                })}

            </div>
        </div>
    </div>
}

export default ModuleInfoPopUp;