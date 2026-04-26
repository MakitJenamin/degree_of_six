import { useState, useEffect } from 'react';

export function usePeople() {
  const [people, setPeople] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tự động gọi API lấy danh sách tên ngay khi trang Web vừa load xong
    fetch('http://localhost:3001/api/people')
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
