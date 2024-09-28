"use client";

import { useState, useEffect, useCallback } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ScoreData {
  created_at: string;
  id: number;
  score: number;
}

interface ApiResponse {
  data: ScoreData[];
  status: string;
}

export default function TotalScore() {
  const [scoreData, setScoreData] = useState<ScoreData[]>([]);
  const [filteredData, setFilteredData] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  ); // 初期値は今日の日付
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  ); // 初期値は今日の日付
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 23]); // 時間範囲を保持（0時から23時）

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("https://hiikunz.pythonanywhere.com/json");
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const result: ApiResponse = await response.json();
      if (result.status === "OK") {
        setScoreData(result.data);
        setFilteredData(result.data); // 初回はすべてのデータを表示
      } else {
        throw new Error("APIからの応答が正常ではありません");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // 初回データ取得
  }, [fetchData]);

  // 日付と時間フィルターを適用する関数
  const applyDateFilter = () => {
    if (startDate && endDate) {
      const filtered = scoreData.filter((item) => {
        const createdAt = new Date(item.created_at).getTime();
        const start = new Date(
          `${startDate}T${String(timeRange[0]).padStart(2, "0")}:00`
        ).getTime();
        const end = new Date(
          `${endDate}T${String(timeRange[1]).padStart(2, "0")}:59`
        ).getTime();
        return createdAt >= start && createdAt <= end;
      });
      setFilteredData(filtered);
    }
  };

  // 楽しい (正のスコア) と疲れた (負のスコアを正の数に変換して集計)
  const totalData = filteredData.reduce(
    (acc, item) => {
      if (item.score >= 0) {
        acc.fun += item.score; // 楽しいのスコアを合計
      } else {
        acc.tired += Math.abs(item.score); // 疲れたのスコアを正の数に変換して合計
      }
      return acc;
    },
    { fun: 0, tired: 0 }
  );

  // 円グラフのデータ
  const pieChartData = {
    labels: ["楽しい", "疲れた"],
    datasets: [
      {
        label: "スコア分布",
        data: [totalData.fun, totalData.tired], // 楽しいと疲れたの合計
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)", // 疲れた用
          "rgba(75, 192, 192, 0.6)", // 楽しい用
        ],
        borderWidth: 1,
      },
    ],
  };

  // グラフのオプション
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "楽しい vs 疲れた (スコアの割合)",
      },
    },
  };

  // ローディングやエラーの処理
  if (loading && scoreData.length === 0) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">楽しい vs 疲れた (総計)</h1>

      {/* 日付範囲指定のUI */}
      <div className="mb-4">
        <label className="block text-lg font-semibold mb-2">開始日</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border rounded-md"
        />

        <label className="block text-lg font-semibold mt-4 mb-2">終了日</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border rounded-md"
        />

        {/* 時間範囲指定のスライダー */}
        <div className="mt-4">
          <label className="block text-lg font-semibold mb-2">時間範囲</label>
          <input
            type="range"
            min="0"
            max="23"
            value={timeRange[0]}
            onChange={(e) =>
              setTimeRange([Number(e.target.value), timeRange[1]])
            }
            className="w-full mb-2"
          />
          <input
            type="range"
            min="0"
            max="23"
            value={timeRange[1]}
            onChange={(e) =>
              setTimeRange([timeRange[0], Number(e.target.value)])
            }
            className="w-full"
          />
          <div className="mt-2">
            <span>開始時間: {timeRange[0]}時 </span>
            <span>終了時間: {timeRange[1]}時</span>
          </div>
        </div>

        <button
          onClick={applyDateFilter}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md"
        >
          フィルターを適用
        </button>
      </div>

      <div className="w-full h-96">
        <Pie data={pieChartData} options={options} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold">総計</h2>
        <p>楽しい: {totalData.fun} ポイント</p>
        <p>疲れた: {totalData.tired} ポイント</p>
      </div>
    </div>
  );
}
