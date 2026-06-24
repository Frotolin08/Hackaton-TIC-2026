import React, { useEffect, useState } from 'react';
import { getTopScores } from '../services/leaderboard';
import ShareButton from './ShareButton';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      const data = await getTopScores(10);
      setScores(data);
      setLoading(false);
    }
    fetchScores();
  }, []);

  return (
    <div className="container">
      <h1 className="mt-2 mb-2">🏆 Leaderboard</h1>
      <ShareButton />
      {loading ? (
        <p>Loading scores…</p>
      ) : (
        <table className="leaderboard-table bg-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>{item.name}</td>
                <td>{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
