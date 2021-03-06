// (C) 2007-2020 GoodData Corporation
import { flatten } from "lodash";
import {
    ImportDeclarationStructure,
    OptionalKind,
    Project,
    SourceFile,
    VariableDeclarationKind,
    VariableStatementStructure,
} from "ts-morph";
import { Attribute, DateDataSet, DisplayForm, Fact, Metric, ProjectMetadata } from "../base/types";
import { createUniqueVariableName, TakenNamesSet } from "./titles";

export type TypescriptOutput = {
    project: Project;
    sourceFile: SourceFile;
};

//
// Constants
//

const FILE_DIRECTIVES = ["/* eslint-disable */"];
const FILE_HEADER = `/* THIS FILE WAS AUTO-GENERATED USING CATALOG EXPORTER; YOU SHOULD NOT EDIT THIS FILE; GENERATE TIME: ${new Date().toISOString()}; */`;
const INSIGHT_MAP_VARNAME = "Insights";
const FACT_AGGREGATIONS = ["sum", "count", "avg", "min", "max", "median", "runsum"];

//
// Variable naming support & strategies
//

let GlobalNameScope: TakenNamesSet = {};

type NamingStrategy = (title: string, scope: TakenNamesSet) => string;

type AttributeNaming = {
    attribute: NamingStrategy;
    displayForm: NamingStrategy;
};

const DefaultNaming: AttributeNaming = {
    attribute: uniqueVariable,
    displayForm: uniqueVariable,
};

const DateDataSetNaming: AttributeNaming = {
    attribute: dateAttributeSwitcharoo,
    displayForm: dateDisplayFormStrip,
};

/**
 * This is a wrapper on top of createUniqueVariableName() which mutates the input name scope - it enters
 * the variable name into the scope.
 *
 * @param title - md object title
 * @param nameScope - scope containing already taken variable names, defaults to global scope
 */
function uniqueVariable(title: string, nameScope: TakenNamesSet = GlobalNameScope): string {
    const variableName = createUniqueVariableName(title, nameScope);
    nameScope[variableName] = true;

    return variableName;
}

/**
 * This is a wrapper on top of uniqueVariable and is useful when naming date data set attributes. They have
 * a convention where date data set name is in parenthesis at the end of the attr/df title. This function
 * takes the ds name and moves it at the beginning of the title. That way all variables for same date data set
 * start with the same prefix.
 *
 * @param title - title to play with
 * @param nameScope - scope containing already taken variable names
 */
function dateAttributeSwitcharoo(title: string, nameScope: TakenNamesSet = GlobalNameScope): string {
    const datasetStart = title.lastIndexOf("(");
    const switchedTitle = `${title.substr(datasetStart)} ${title.substr(0, datasetStart)}`;

    return uniqueVariable(switchedTitle, nameScope);
}

/**
 * This is a wrapper on top of uniqueVariable and is useful for stripping date data set display forms off
 * superfluous stuff such as example format & date dimension name. It assumes that the format of
 * display form names is "Something (Example) (DD Name)"
 *
 * @param title - display form title
 * @param nameScope - name scope in which to keep var names unique
 */
function dateDisplayFormStrip(title: string, nameScope: TakenNamesSet = GlobalNameScope): string {
    const metaStart = title.indexOf("(");

    return uniqueVariable(title.substr(0, metaStart), nameScope);
}

//
// Transformation to ts-morph structures
//

function initialize(outputFile: string): TypescriptOutput {
    const project = new Project({});
    const sourceFile = project.createSourceFile(
        outputFile,
        {
            leadingTrivia: [...FILE_DIRECTIVES, FILE_HEADER],
        },
        { overwrite: true },
    );

    return {
        project,
        sourceFile,
    };
}

function generateSdkModelImports(): OptionalKind<ImportDeclarationStructure> {
    return {
        moduleSpecifier: "@gooddata/sdk-model",
        namedImports: ["newAttribute", "newMeasure", "IAttribute", "IMeasure", "IMeasureDefinition", "idRef"],
    };
}

function generateAttributeDisplayForm(
    displayForm: DisplayForm,
    attributeVariableName: string,
    nameScope: TakenNamesSet,
    naming: AttributeNaming,
): string {
    const { meta } = displayForm;
    const dfVariableName = naming.displayForm(meta.title, nameScope);
    let variableName = attributeVariableName === dfVariableName ? "Default" : dfVariableName;

    if (variableName.startsWith(attributeVariableName)) {
        variableName = variableName.substr(attributeVariableName.length);
    }

    return `/** \n* Display Form Title: ${meta.title}  \n* Display Form ID: ${meta.identifier}\n*/\n${variableName}: newAttribute('${meta.identifier}')`;
}

/**
 * Generates attribute definitions. Works as follows:
 *
 * - If the attribute has single display form, generates a constant of DfTitle => newAttribute(id)
 * - If the attribute has multiple display forms, generates a constant that is an object mapping different
 *   DfTitles => newAttribute(dfId)
 *
 * @param attribute - attribute to generate definitions for
 * @param naming - naming scope to ensure variable name uniqueness
 */
function generateAttribute(
    attribute: Attribute,
    naming: AttributeNaming = DefaultNaming,
): OptionalKind<VariableStatementStructure> {
    const { meta } = attribute.attribute;
    const variableName = naming.attribute(meta.title, GlobalNameScope);
    const { displayForms } = attribute.attribute.content;

    if (displayForms.length === 1) {
        /*
         * If there is a single DF for the attribute, then have const AttrName = newAttribute(...)
         */
        const displayForm = displayForms[0];

        return {
            declarationKind: VariableDeclarationKind.Const,
            isExported: true,
            docs: [`Attribute Title: ${meta.title}\nDisplay Form ID: ${meta.identifier}`],
            declarations: [
                {
                    name: variableName,
                    type: "IAttribute",
                    initializer: `newAttribute('${displayForm.meta.identifier}')`,
                },
            ],
        };
    } else {
        /*
         * If there are multiple DFs, have mapping of const AttrName = { DfName: newAttribute(), OtherDfName: newAttribute()}
         */
        const localNameScope: TakenNamesSet = {};
        const displayFormInits: string[] = attribute.attribute.content.displayForms.map((df) =>
            generateAttributeDisplayForm(df, variableName, localNameScope, naming),
        );

        return {
            declarationKind: VariableDeclarationKind.Const,
            isExported: true,
            declarations: [
                {
                    name: variableName,
                    initializer: `{ ${displayFormInits.join(",")} }`,
                },
            ],
        };
    }
}

function generateAttributes(
    projectMeta: ProjectMetadata,
): ReadonlyArray<OptionalKind<VariableStatementStructure>> {
    return projectMeta.catalog.attributes.map((a) => generateAttribute(a));
}

function generateMeasureFromMetric(metric: Metric): OptionalKind<VariableStatementStructure> {
    const { meta } = metric.metric;
    const variableName = uniqueVariable(meta.title);

    return {
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        docs: [`Metric Title: ${meta.title}\nMetric ID: ${meta.identifier}\nMetric Type: MAQL Metric`],
        declarations: [
            {
                name: variableName,
                type: "IMeasure<IMeasureDefinition>",
                initializer: `newMeasure(idRef('${meta.identifier}', "measure"))`,
            },
        ],
    };
}

function generateFactAggregations(fact: Fact): string[] {
    const { meta } = fact.fact;

    return FACT_AGGREGATIONS.map((aggregation) => {
        const jsDoc = `/** \n* Fact Title: ${meta.title}  \n* Fact ID: ${meta.identifier}\n * Fact Aggregation: ${aggregation}\n*/`;
        const name = aggregation.charAt(0).toUpperCase() + aggregation.substr(1);

        return `${jsDoc}\n${name}: newMeasure(idRef('${meta.identifier}', "fact"), m => m.aggregation('${aggregation}'))`;
    });
}

function generateMeasuresFromFacts(fact: Fact): OptionalKind<VariableStatementStructure> {
    const { meta } = fact.fact;
    const variableName = uniqueVariable(meta.title);

    const aggregationInits: string[] = generateFactAggregations(fact);

    return {
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        docs: [`Fact Title: ${meta.title}\nFact ID: ${meta.identifier}`],
        declarations: [
            {
                name: variableName,
                initializer: `{ ${aggregationInits.join(",")} } `,
            },
        ],
    };
}

/**
 * Generates simple measures from metrics and facts defined in the project.
 *
 * - For metrics (MAQL stuff) this will generate constant with MeasureTitle = newMeasure(id)
 * - For facts, this will generate constant initialized to an object which defines all possible
 *   aggregations of the measure.
 *
 * @param projectMeta
 */
function generateMeasures(
    projectMeta: ProjectMetadata,
): ReadonlyArray<OptionalKind<VariableStatementStructure>> {
    const fromMetrics = projectMeta.catalog.metrics.map(generateMeasureFromMetric);
    const fromFacts = projectMeta.catalog.facts.map(generateMeasuresFromFacts);

    return fromMetrics.concat(fromFacts);
}

/**
 * Keeping it simple for now - generate per-attr constants for each attribute in date data set. For now there's
 * no thing that connects all date data sets under one umbrella.
 *
 * @param dd - date data set
 * @param naming - naming strategies to use for date datasets and attributes; some variability is needed
 *  due to how different backends name date dimensions and their attributes
 */
function generateDateDataSet(
    dd: DateDataSet,
    naming: AttributeNaming,
): ReadonlyArray<OptionalKind<VariableStatementStructure>> {
    const { content } = dd.dateDataSet;

    return content.attributes.map((a) => generateAttribute(a, naming));
}

function generateDateDataSets(
    projectMeta: ProjectMetadata,
    tiger: boolean,
): ReadonlyArray<OptionalKind<VariableStatementStructure>> {
    let naming = DateDataSetNaming;

    if (tiger) {
        naming = DefaultNaming;
    }

    return flatten(projectMeta.dateDataSets.map((dd) => generateDateDataSet(dd, naming)));
}

/**
 * Declares a constant initialized to object mapping InsightTitle => insight identifier.
 *
 * @param projectMeta - project metadata containing the insights
 */
function generateInsights(projectMeta: ProjectMetadata): OptionalKind<VariableStatementStructure> {
    const insightInitializer: string[] = projectMeta.insights.map((insight) => {
        const propName = uniqueVariable(insight.title);
        const jsDoc = `/** \n* Insight Title: ${insight.title}  \n* Insight ID: ${insight.identifier}\n*/`;

        return `${jsDoc}\n${propName}: '${insight.identifier}'`;
    });

    return {
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
            {
                name: INSIGHT_MAP_VARNAME,
                initializer: `{ ${insightInitializer.join(",")} }`,
            },
        ],
    };
}

/**
 * Transforms project metadata into model definitions in TypeScript. The resulting TS source file will contain
 * constant declarations for the various objects in the metadata:
 *
 * - Attributes with single display form are transformed to constants initialized with respective newAttribute()
 * - Attributes with multiple display forms are transformed to constants initialized to map of df name => newAttribute()
 * - Metrics (MAQL) will be transformed to constants initialized with respective newMeasure()
 * - Metrics from facts will be transformed to constants initialized to map of aggregation => newMeasure()
 * - Date data set attributes will be transformed using the same logic as normal attributes, albeit with slightly
 *   modified variable naming strategy
 *
 * @param projectMeta - project metadata to transform to typescript
 * @param outputFile - output typescript file
 * @param tiger - indicates whether running against tiger, this influences naming strategy to use for date datasets as they are different from bear
 * @return return of the transformation process, new file is not saved at this point
 */
export function transformToTypescript(
    projectMeta: ProjectMetadata,
    outputFile: string,
    tiger: boolean,
): TypescriptOutput {
    GlobalNameScope = {};

    const output = initialize(outputFile);
    const { sourceFile } = output;

    sourceFile.addImportDeclaration(generateSdkModelImports());
    sourceFile.addVariableStatements(generateAttributes(projectMeta));
    sourceFile.addVariableStatements(generateMeasures(projectMeta));
    sourceFile.addVariableStatements(generateDateDataSets(projectMeta, tiger));
    sourceFile.addVariableStatement(generateInsights(projectMeta));

    return output;
}
