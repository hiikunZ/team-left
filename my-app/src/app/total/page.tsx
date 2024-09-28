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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("https://hiikunz.pythonanywhere.com/json");
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const result: ApiResponse = await response.json();
      if (result.status === "OK") {
        setScoreData(result.data);
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

  // 楽しい (正のスコア) と疲れた (負のスコアを正の数に変換して集計)
  const totalData = scoreData.reduce(
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
