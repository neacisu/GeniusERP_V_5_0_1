import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type FinancialChartProps = {
  data: {
    name: string;
    venituri: number;
    cheltuieli: number;
  }[];
};

export default function FinancialChart({ data }: FinancialChartProps) {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Situație Financiară</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'month' 
                ? 'border text-primary border-primary bg-white' 
                : 'text-gray-500 bg-gray-50'
            }`}
            onClick={() => setPeriod('month')}
          >
            Luna
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'quarter' 
                ? 'border text-primary border-primary bg-white' 
                : 'text-gray-500 bg-gray-50'
            }`}
            onClick={() => setPeriod('quarter')}
          >
            Trimestru
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-md ${
              period === 'year' 
                ? 'border text-primary border-primary bg-white' 
                : 'text-gray-500 bg-gray-50'
            }`}
            onClick={() => setPeriod('year')}
          >
            An
          </button>
        </div>
      </div>
      
      <div className="w-full h-80 bg-white rounded-md mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} RON`}
            />
            <Legend />
            <Bar dataKey="venituri" fill="#9155FD" name="Venituri" />
            <Bar dataKey="cheltuieli" fill="#FF4C51" name="Cheltuieli" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-10">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-gray-500 ml-2">Venituri</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-error-main"></div>
          <span className="text-sm text-gray-500 ml-2">Cheltuieli</span>
        </div>
      </div>
    </div>
  );
}
