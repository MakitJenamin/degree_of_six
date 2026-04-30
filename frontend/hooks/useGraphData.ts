import { useState, useEffect } from "react";

export function useGraphData() {
  const [graphData, setGraphData] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    fetch(`${backendUrl}/api/graph`)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch(console.error);
  }, []);

  return { graphData };
}
