import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Bar, BarChart, Line, LineChart, Pie, PieChart} from 'recharts';

// Exercise the legacy chart library with the patched lodash/d3 dependency graph.
const data = [
    {name: 'A', seconds: 1800},
    {name: 'B', seconds: 3600},
];

test('bar, line and pie charts render with the patched transitive dependencies', () => {
    const bar = renderToStaticMarkup(
        <BarChart width={400} height={200} data={data}>
            <Bar dataKey="seconds" fill="#123456" isAnimationActive={false} />
        </BarChart>
    );
    const line = renderToStaticMarkup(
        <LineChart width={400} height={200} data={data}>
            <Line dataKey="seconds" isAnimationActive={false} />
        </LineChart>
    );
    const pie = renderToStaticMarkup(
        <PieChart width={400} height={200}>
            <Pie data={data} dataKey="seconds" isAnimationActive={false} />
        </PieChart>
    );
    expect(bar).toContain('recharts-rectangle');
    expect(line).toContain('recharts-line-curve');
    expect(pie).toContain('recharts-sector');
    for (const svg of [bar, line, pie]) {
        expect(svg).toContain('<svg');
        expect(svg).not.toContain('NaN');
    }
});
