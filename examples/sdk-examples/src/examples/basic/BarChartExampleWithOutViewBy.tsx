// (C) 2007-2019 GoodData Corporation
import React from "react";
import { BarChart } from "@gooddata/sdk-ui-charts";
import { LdmExt } from "../../ldm";

const style = { height: 300 };

export const BarChartExampleWithOutViewBy: React.FC = () => {
    return (
        <div style={style} className="s-bar-chart">
            <BarChart measures={[LdmExt.TotalSales1]} />
        </div>
    );
};
