// (C) 2007-2019 GoodData Corporation
import React, { useState } from "react";
import { SourceContainer } from "./SourceContainer";
import { UnControlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import fs from "fs";
interface IExampleWithSourceProps {
    for: React.ComponentType;
    source: string;
    sourceJS?: string;
}

export interface ICodeMirrorProps {
    runCode: boolean;
    code: string;
}

export const ExampleWithSource: React.FC<IExampleWithSourceProps> = ({
    for: Component,
    source,
    sourceJS,
}) => {
    const [hidden, setState] = useState<boolean>(true);
    const [viewJS, setViewJS] = useState<boolean>(true);
    const [props, setProps] = useState<ICodeMirrorProps>({
        runCode: false,
        code: source,
    });

    const toggle = () => setState(!hidden);
    const runCode = () => {
        // @ts-ignore
        setProps({ runCode: true, code: props.code });
        const dir = "webpack:///src/components/Menu.tsx";
        fs.writeFile(dir, props.code, (err) => {
            // throws an error, you could also catch it here
            if (err) throw err;

            // success case, the file was saved
            console.log("Lyric saved!");
        });
    };
    const switchLang = (switchToJS: boolean) => setViewJS(switchToJS);
    const iconClassName = hidden ? "icon-navigatedown" : "icon-navigateup";

    // @ts-ignore
    return (
        <div className="example-with-source">
            <style jsx>{`
                .example-with-source {
                    flex: 1 0 auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: stretch;
                    margin-top: 30px;
                }

                .example {
                    padding: 20px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
                    background-color: white;
                }

                .source {
                    margin: 20px 0;
                }

                :global(pre) {
                    overflow: auto;
                }
            `}</style>
            <div className="example">
                <Component />
            </div>
            <div className="source">
                <button
                    className={`gd-button gd-button-secondary button-dropdown icon-right ${iconClassName}`}
                    onClick={toggle}
                >
                    source code
                </button>
                <button className={`gdc-button button-run`} onClick={runCode}>
                    run code
                </button>
                {hidden ? (
                    ""
                ) : (
                    <div>
                        <SourceContainer
                            toggleIsJS={switchLang}
                            isJS={viewJS}
                            source={source}
                            sourceJS={sourceJS}
                        />
                    </div>
                )}
                <CodeMirror
                    value={props.code}
                    options={{
                        mode: "typescript",
                        theme: "material",
                        lineNumbers: true,
                    }}
                    //@ts-ignore
                    onChange={(editor, data, value) => {
                        setProps({
                            runCode: false,
                            code: value,
                        });
                    }}
                />
                <div className="Output">
                    <pre>{props.runCode && props.code}</pre>
                </div>
            </div>
        </div>
    );
};
