// (C) 2020-2021 Minh Luu
import React, { useState, Component } from "react";
import { SourceContainer } from "./SourceContainer";
import { UnControlled as CodeMirror } from "react-codemirror2";
import { BubbleChartExample } from "../examples/basic/BubbleChartExample";
import { ColumnChartExample } from "../examples/basic/ColumnChartExample";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import { BarChartExample } from "../examples/basic/BarChartExample";
interface IExampleWithSourceProps {
    for: React.ComponentType;
    source: string;
    sourceJS?: string;
}

export interface ICodeMirrorProps {
    runCode: boolean;
    code: string;
}

export interface IReactNodeProps {
    reactNode: React.ReactNode;
}

class MyComponent extends Component<ICodeMirrorProps> {
    componentNames = {
        BubbleChartExample: BubbleChartExample,
        BarChartExample: BarChartExample,
        ColumnChartExample: ColumnChartExample,
    };
    render() {
        const TagName = this.componentNames["ColumnChartExample"];
        return <TagName />;
    }
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
        code: "Try it yourself" + "Input at here",
    });
    const [css, setSource] = useState<any>(<Component />);

    const toggle = () => setState(!hidden);
    const runCode = () => {
        // @ts-ignore
        setProps({ runCode: true, code: props.code });
        setSource(<MyComponent runCode={props.runCode} code={props.code} />);
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
            <div className="example">{css}</div>
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
            </div>
            <textarea>abc</textarea>
        </div>
    );
};
