import React from 'react';
import './sqaureLoader.css';
import classnames from 'classnames';

const SquareLoader = ({ bodyClassName, msg, msgClass }) => {

    return (
        <div className={classnames(bodyClassName, "sqaureLoader__body")}>
            <div className="wrapper">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>

            </div>
            <div className={classnames(msgClass, 'mt-4 font-semibold text-lg')}> {msg}</div>
        </div>

    );
};

export default SquareLoader;
