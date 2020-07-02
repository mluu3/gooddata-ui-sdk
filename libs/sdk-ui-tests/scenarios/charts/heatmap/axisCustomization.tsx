// (C) 2007-2019 GoodData Corporation
import { scenariosFor } from "../../../src";
import { ScenarioGroupNames } from "../_infra/groupNames";
import { HeatmapWithMeasureRowsAndColumns } from "./base";
import { axisNameCustomization } from "../_infra/axisNameCustomization";
import { IHeatmapProps, Heatmap } from "@gooddata/sdk-ui-charts";

export default scenariosFor<IHeatmapProps>("Heatmap", Heatmap)
    .withGroupNames(ScenarioGroupNames.ConfigurationCustomization)
    .withVisualTestConfig({ groupUnder: "axis name configuration" })
    .withDefaultTags("vis-config-only", "mock-no-scenario-meta")
    .addScenarios("axis name configuration", HeatmapWithMeasureRowsAndColumns, axisNameCustomization);
