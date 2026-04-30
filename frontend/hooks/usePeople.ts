import { useState, useEffect } from 'react';

export function usePeople() {
  const [people, setPeople] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tự động gọi API lấy danh sách tên ngay khi trang Web vừa load xong
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    fetch(`${backendUrl}/api/people`)
      .then((res) => res.json())
      .then((data) => {
        setPeople(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách diễn viên:', err);
        setIsLoading(false);
      });
  }, []);

  return { people, isLoading };
}
