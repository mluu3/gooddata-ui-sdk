// (C) 2007-2019 GoodData Corporation

const stories = require("./stories");

/*
 * BackstopJS global configuration for scenarios created for storybook stories.
 *
 * This contains list of objects as:
 *
 * {
 *    idRegex: pattern,
 *    config: { ... }
 * }
 *
 * Where
 *
 * - idRegex is regular expression to match against the scenario identifier. Scenario identifier is
 *   constructed as "storybookKind_storybookName".
 *
 * - config is object with BackstopJS configuration; typically should contain at least the readySelector. This
 *   object will be passed to BackstopJS as-is.
 *
 * If no config matches the scenario ID, then the scenario will not be tested using BackstopJS
 */

const ScenarioConfig = [
    {
        // this is for customization stories that generate multiple variants with different config; we have
        // a special ready wrapper for these
        idRegex: /.*(data labels|coloring|legend)/g,
        config: {
            readySelector: ".screenshot-ready-wrapper-done",
        },
    },
    {
        /*
         * Tests for visualization stories - either created automatically for test scenarios or created manually
         */
        idRegex: /(01|02).*/g,
        config: {
            readySelector: ".screenshot-ready-wrapper-done",
        },
    },
    {
        /*
         * Tests for pluggable visualizations. All backstop config is provided on per-story basis.
         */
        idRegex: /04.*/g,
        config: {},
    },
    {
        /*
         * Tests for Filtering components
         */
        idRegex: /(10).*/g,
        config: {
            readySelector: ".screenshot-target",
        },
    },
    {
        /*
         * Tests for configuration controls components
         */
        idRegex: /(11).*/g,
        config: {
            readySelector: ".screenshot-target",
        },
    },
];

// --------------------------------------------------------------------
// Internals;
//
// there should be no need to touch these when customizing backstop scenarios config for stories
// --------------------------------------------------------------------

function scenarioLabel(storyKind, storyName, scenarioName) {
    const storyDerivedName = `${storyKind} - ${storyName}`;

    return scenarioName !== undefined ? `${storyDerivedName} - ${scenarioName}` : storyDerivedName;
}

function scenarioUrlForId(id) {
    return `http://storybook/iframe.html?id=${encodeURIComponent(id)}`;
}

/**
 * As a convenience, the screenshot testing infrastructure allows to globally define backstop JS configurations
 * to associate to scenarios automatically created for storybook stories. The association is done based on
 * story kind & name regex match.
 *
 * @param kind story kind
 * @param name story name
 * @return {{}|*} backstop config or empty object
 */
function scenarioGlobalConfig(kind, name) {
    const id = `${kind}_${name}`;

    const foundConfig = ScenarioConfig.find(({ idRegex }) => {
        return id.match(idRegex) !== null;
    });

    if (foundConfig === undefined) {
        return {};
    }

    return foundConfig.config;
}

module.exports = stories
    .map((story) => {
        const { storyId, storyKind, storyName, scenarioName, scenarioConfig: localConfig } = story;
        const label = scenarioLabel(storyKind, storyName, scenarioName);

        /*
         * Create configuration for this scenario. Find global configuration that applies for scenario done
         * for this kind of story (if any) and then overlay the config with local scenario (if any)
         *
         * If the resulting configuration is empty, then the story will not be tested using backstop - as it is
         * not clear what to wait for.
         */
        const globalConfig = scenarioGlobalConfig(storyKind, storyName);
        const scenarioConfig = {
            ...globalConfig,
            ...localConfig,
        };

        if (Object.keys(scenarioConfig).length === 0) {
            console.warn(
                `Cannot determine BackstopJS configuration for scenario from story: ${label}; This story will not be screenshot tested using Backstop.`,
            );

            return undefined;
        }

        return {
            label: label,
            url: scenarioUrlForId(storyId),
            ...scenarioConfig,
        };
    })
    .filter((scenario) => scenario !== undefined);
