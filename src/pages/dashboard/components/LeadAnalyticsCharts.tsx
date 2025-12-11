import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, XCircle } from 'lucide-react';
import { ILeadAnalytics } from '@/service/reportingServices';
import { CHART_DIMENSIONS, chartConfig, COLORS } from '../dashboard.constant';

interface LeadAnalyticsChartsProps {
  leadAnalytics: ILeadAnalytics | null;
}

export const LeadAnalyticsCharts: React.FC<LeadAnalyticsChartsProps> = ({
  leadAnalytics,
}) => {
  if (!leadAnalytics) {
    return null;
  }

  return (
    <div className="mb-8 flex gap-8">
      {/* Unqualified Reasons Pie Chart */}
      {leadAnalytics.unqualifiedReasons && leadAnalytics.unqualifiedReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              <XCircle className="h-5 w-5 text-red-600" />
              Unqualified Reasons
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto lg:overflow-visible">
            <div
              style={{ minWidth: CHART_DIMENSIONS.minWidth }}
              className="lg:min-w-0"
            >
              <ChartContainer
                config={chartConfig}
                style={{ height: CHART_DIMENSIONS.height }}
              >
                <PieChart>
                  <Pie
                    data={leadAnalytics.unqualifiedReasons}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={110}
                    innerRadius={0}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="totalLeads"
                  >
                    {leadAnalytics.unqualifiedReasons.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900 mb-1">
                              {data.reason}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                Count:
                              </span>{" "}
                              {data.totalLeads}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                Percentage:
                              </span>{" "}
                              {data.percentage}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Day of Week Analysis Chart */}
      {leadAnalytics.dayOfWeekData && leadAnalytics.dayOfWeekData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Day of Week Analysis
            </CardTitle>
            {/* Color Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: "#94a3b8" }}
                ></div>
                <span className="text-sm text-gray-600">
                  Total Leads
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: "#10b981" }}
                ></div>
                <span className="text-sm text-gray-600">
                  Estimate Set Leads
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto lg:overflow-visible">
              <div
                style={{ minWidth: CHART_DIMENSIONS.minWidth }}
                className="lg:min-w-0"
              >
                <ChartContainer
                  config={chartConfig}
                  style={{ height: CHART_DIMENSIONS.height }}
                >
                  <BarChart data={leadAnalytics.dayOfWeekData}>
                    <defs>
                      <linearGradient
                        id="totalGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#94a3b8"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#cbd5e1"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="estimateGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#34d399"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (
                          active &&
                          payload &&
                          payload.length &&
                          label
                        ) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-900 mb-2">
                                {label}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">
                                  Total leads:
                                </span>{" "}
                                {data.totalLeads}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">
                                  Estimate Set:
                                </span>{" "}
                                {data.estimateSetCount}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">
                                  Estimate Set Rate:{" "}
                                </span>{" "}
                                {data.estimateSetRate}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="totalLeads"
                      fill="url(#totalGradient)"
                      name="Total Leads"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="estimateSetCount"
                      fill="url(#estimateGradient)"
                      name="Estimate Set Leads"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

