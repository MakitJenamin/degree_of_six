import { useState, useEffect } from "react";

export function useGraphData() {
  const [graphData, setGraphData] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/graph")
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch(console.error);
  }, []);

  return { graphData };
}
