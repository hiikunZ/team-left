"use client"

import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ScoreData {
  created_at: string;
  id: number;
  score: number;
}

interface ApiResponse {
  data: ScoreData[];
  status: string;
}

export default function Home() {
  const [scoreData, setScoreData] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('http://hiikunz.pythonanywhere.com/json');
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const result: ApiResponse = await response.json();
      if (result.status === 'OK') {
        setScoreData(result.data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      } else {
        throw new Error('APIからの応答が正常ではありません');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // 初回データ取得

    const intervalId = setInterval(() => {
      fetchData(); // 10秒ごとにデータを取得
    }, 1000);

    return () => clearInterval(intervalId); // コンポーネントのアンマウント時にインターバルをクリア
  }, [fetchData]);

  const chartData = {
    labels: scoreData.map(item => item.created_at),
    datasets: [
      {
        label: 'スコア',
        data: scoreData.map(item => item.score),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '10秒ごとに更新されるスコア変化',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '日時'
        }
      },
      y: {
        title: {
          display: true,
          text: 'スコア'
        }
      }
    }
  };

  if (loading && scoreData.length === 0) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">10秒ごとに更新されるスコアデータグラフ</h1>
      <div className="w-full h-96">
        <Line data={chartData} options={options} />
      </div>
      <h2 className="text-xl font-bold mt-8 mb-4">最新のデータ</h2>
      {scoreData.slice(-5).reverse().map((item) => (
        <div key={item.id} className="bg-white shadow-md rounded-lg p-4 mb-4">
          <p className="text-lg font-semibold">スコア: {item.score}</p>
          <p className="text-sm text-gray-600">作成日時: {item.created_at}</p>
          <p className="text-sm text-gray-600">ID: {item.id}</p>
        </div>
      ))}
    </div>
  );
}