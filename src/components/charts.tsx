// Chart.js wrappers with theme-aware defaults.
import { useMemo } from 'react';
import {
  Chart as ChartJS, ArcElement, LineElement, BarElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { useStore } from '../utils/store';

ChartJS.register(ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export const PALETTE = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#4ade80', '#fb923c', '#22d3ee', '#e0c84e'];

export function useChartTheme() {
  const { theme } = useStore();
  return useMemo(() => {
    const dim = theme === 'dark' ? '#93a1b8' : '#4b5b76';
    const grid = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,35,70,0.08)';
    return { dim, grid };
  }, [theme]);
}

export function DoughnutChart({ labels, values, colors }: { labels: string[]; values: number[]; colors?: string[] }) {
  const { dim } = useChartTheme();
  return (
    <Doughnut
      data={{
        labels,
        datasets: [{ data: values, backgroundColor: colors || PALETTE, borderWidth: 0, hoverOffset: 6 }],
      }}
      options={{
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { color: dim, boxWidth: 10, font: { size: 10 }, padding: 12 } },
        },
        maintainAspectRatio: true,
      }}
    />
  );
}

export function LineChart({ labels, series }: {
  labels: (string | number)[];
  series: Array<{ label: string; data: (number | null)[]; color?: string; fill?: boolean; dashed?: boolean }>;
}) {
  const { dim, grid } = useChartTheme();
  return (
    <Line
      data={{
        labels,
        datasets: series.map((s, i) => ({
          label: s.label,
          data: s.data,
          borderColor: s.color || PALETTE[i % PALETTE.length],
          backgroundColor: s.fill ? (s.color || PALETTE[i % PALETTE.length]) + '22' : 'transparent',
          fill: !!s.fill,
          borderDash: s.dashed ? [6, 4] : undefined,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 12,
          borderWidth: 2,
        })),
      }}
      options={{
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: dim, boxWidth: 10, font: { size: 10 } } } },
        scales: {
          x: { ticks: { color: dim, maxTicksLimit: 8, font: { size: 9 } }, grid: { color: 'transparent' } },
          y: { ticks: { color: dim, font: { size: 9 } }, grid: { color: grid } },
        },
        maintainAspectRatio: false,
      }}
    />
  );
}

export function BarChart({ labels, series, horizontal = false }: {
  labels: string[];
  series: Array<{ label: string; data: number[]; color?: string | string[] }>;
  horizontal?: boolean;
}) {
  const { dim, grid } = useChartTheme();
  return (
    <Bar
      data={{
        labels,
        datasets: series.map((s, i) => ({
          label: s.label,
          data: s.data,
          backgroundColor: s.color || PALETTE[i % PALETTE.length],
          borderRadius: 6,
        })),
      }}
      options={{
        indexAxis: horizontal ? 'y' : 'x',
        plugins: { legend: { display: series.length > 1, labels: { color: dim, boxWidth: 10, font: { size: 10 } } } },
        scales: {
          x: { ticks: { color: dim, font: { size: 9 } }, grid: { color: horizontal ? grid : 'transparent' } },
          y: { ticks: { color: dim, font: { size: 9 } }, grid: { color: horizontal ? 'transparent' : grid } },
        },
        maintainAspectRatio: false,
      }}
    />
  );
}
