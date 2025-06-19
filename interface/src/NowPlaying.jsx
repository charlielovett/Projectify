import { useEffect, useState } from 'react';

export default function NowPlaying() {
  const [track, setTrack] = useState(null);
  const [progressMs, setProgressMs] = useState(0);

  useEffect(() => {
    let progressInterval;

    const fetchTrack = async () => {
      try {
        const response = await fetch('/currently-playing');
        if (response.status === 204 || !response.ok) {
          setTrack(null);
          setProgressMs(0);
          return;
        }

        const data = await response.json();
        if (!data.name || !data.artist || !data.albumCover) {
          setTrack(null);
          setProgressMs(0);
          return;
        }

        setTrack(data);
        setProgressMs(data.progressMs);

        if (progressInterval) clearInterval(progressInterval);
        if (data.isPlaying) {
          progressInterval = setInterval(() => {
            setProgressMs((prev) => prev + 1000);
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching track:', err);
        setTrack(null);
        setProgressMs(0);
      }
    };

    fetchTrack();
    const pollInterval = setInterval(fetchTrack, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, []);

  if (!track) return <p>No song currently playing</p>;
  if (!track.isPlaying) return <p>⏸ Playback is paused</p>;

  const percentage = (progressMs / track.durationMs) * 100;

  return (
    <div>
      <img src={track.albumCover} alt="Album cover" style={{ width: 200, height: 200 }} />
      <h2>{track.name}</h2>
      <p>{track.artist}</p>
      <input
        type="range"
        min={0}
        max={100}
        value={percentage}
        readOnly
        style={{ width: 300 }}
      />
    </div>
  );
}