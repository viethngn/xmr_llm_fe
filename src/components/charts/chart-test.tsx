import UniversalChart from './universal-chart';

// Test component to verify chart functionality
export default function ChartTest() {
  // Test data for different chart types
  const barChartData = [
    { month: '2017-01', avg_resale_price: 600000 },
    { month: '2017-02', avg_resale_price: 680000 },
    { month: '2017-03', avg_resale_price: 650000 },
    { month: '2017-04', avg_resale_price: 640000 },
    { month: '2017-05', avg_resale_price: 710000 },
    { month: '2017-06', avg_resale_price: 670000 },
    { month: '2017-07', avg_resale_price: 700000 },
    { month: '2017-08', avg_resale_price: 630000 },
    { month: '2017-09', avg_resale_price: 630000 },
    { month: '2017-10', avg_resale_price: 610000 },
    { month: '2017-11', avg_resale_price: 620000 },
    { month: '2017-12', avg_resale_price: 720000 },
  ];

  const lineChartData = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 150 },
    { name: 'Mar', value: 120 },
    { name: 'Apr', value: 180 },
  ];

  const pieChartData = [
    { name: 'Category A', value: 400 },
    { name: 'Category B', value: 300 },
    { name: 'Category C', value: 200 },
    { name: 'Category D', value: 100 },
  ];

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold">Chart Test Components</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Bar Chart Test</h3>
        <UniversalChart
          data={barChartData}
          chartType="bar"
          title="Bar Chart - month vs avg_resale_price"
          xAxisKey="month"
          yAxisKey="avg_resale_price"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Line Chart Test</h3>
        <UniversalChart
          data={lineChartData}
          chartType="line"
          title="Line Chart Test"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Pie Chart Test</h3>
        <UniversalChart
          data={pieChartData}
          chartType="pie"
          title="Pie Chart Test"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Empty Data Test</h3>
        <UniversalChart
          data={[]}
          chartType="bar"
          title="Empty Data Test"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Null Data Test</h3>
        <UniversalChart
          data={null}
          chartType="line"
          title="Null Data Test"
        />
      </div>
    </div>
  );
}
