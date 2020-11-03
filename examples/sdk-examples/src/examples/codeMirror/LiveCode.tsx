import React, { Component, useState } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
// @ts-ignore
import Pusher from "pusher-js";
// @ts-ignore
import pushid from "pushid";
import axios from "axios";

import "./App.css";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";

import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import "codemirror/mode/javascript/javascript";

export interface ISource {
    id: string;
    html: string;
    css: string;
    js: string;
}

const pusher = new Pusher("c4e8104d159a59041c8e", {
    cluster: "ap1",
    forceTLS: true,
});

const channel = pusher.subscribe("editor");

const [props, setProps] = useState<ISource>({
    id: "",
    html: "",
    css: "",
    js: "",
});

export default class LiveCode extends Component {
    componentDidUpdate() {
        this.runCode();
    }

    componentDidMount() {
        setProps({
            id: pushid(),
            html: props.html,
            css: props.css,
            js: props.js,
        });

        channel.bind("text-update", (data: { id: Readonly<{}>; html: any; css: any; js: any }) => {
            const id = props.id;
            if (data.id === id) return;

            this.setState({
                html: data.html,
                css: data.css,
                js: data.js,
            });
        });
    }

    syncUpdates = () => {
        const data = { ...props };

        axios.post("http://localhost:5000/update-editor", data).catch(console.error);
    };

    runCode = () => {
        const html = props.html;
        const css = props.css;
        const js = props.js;

        const iframe = this.refs.iframe;
        // @ts-ignore
        const document = iframe.contentDocument;
        const documentContents = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${html}

        <script type="text/javascript">
          ${js}
        </script>
      </body>
      </html>
    `;

        document.open();
        document.write(documentContents);
        document.close();
    };

    render = () => {
        const html = props.html;
        const css = props.css;
        const js = props.js;
        const codeMirrorOptions = {
            theme: "material",
            lineNumbers: true,
            scrollbarStyle: null,
            lineWrapping: true,
        };

        return (
            <div className="App">
                <section className="playground">
                    <div className="code-editor html-code">
                        <div className="editor-header">HTML</div>
                        <CodeMirror
                            value={html}
                            options={{
                                mode: "htmlmixed",
                                ...codeMirrorOptions,
                            }}
                            // @ts-ignore
                            onBeforeChange={(editor, data, html) => {
                                this.setState({ html }, () => this.syncUpdates());
                            }}
                        />
                    </div>
                    <div className="code-editor css-code">
                        <div className="editor-header">CSS</div>
                        <CodeMirror
                            value={css}
                            options={{
                                mode: "css",
                                ...codeMirrorOptions,
                            }}
                            // @ts-ignore
                            onBeforeChange={(editor, data, css) => {
                                this.setState({ css }, () => this.syncUpdates());
                            }}
                        />
                    </div>
                    <div className="code-editor js-code">
                        <div className="editor-header">JavaScript</div>
                        <CodeMirror
                            value={js}
                            options={{
                                mode: "javascript",
                                ...codeMirrorOptions,
                            }}
                            // @ts-ignore
                            onBeforeChange={(editor, data, js) => {
                                this.setState({ js }, () => this.syncUpdates());
                            }}
                        />
                    </div>
                </section>
                <section className="result">
                    <iframe title="result" className="iframe" ref="iframe" />
                </section>
            </div>
        );
    };
}
