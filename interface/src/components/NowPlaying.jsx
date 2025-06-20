import { useEffect, useState } from 'react';

const NowPlaying = () => {
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

  const percentage = (progressMs / track.durationMs) * 100;

  return (
    <div className="content-wrapper">
      <div style={{ position: 'relative', width: 300, height: 300 }} className="centered">
        <img
          src={track.albumCover}
          alt="Album cover"
          style={{ width: 300, height: 300, display: 'block' }}
        />

        {!track.isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              pointerEvents: 'none', // optional: so it doesn't block mouse clicks
            }}
          >
            ▶
          </div>
        )}
      </div>

      <h2 style={{ margin: 0 }}>{track.name}</h2>
      <p style={{ margin: 0 }}>{track.artist}</p>

      <input
        className="centered"
        type="range"
        min={0}
        max={100}
        value={percentage}
        readOnly
        style={{
          '--range-progress': `${percentage}%`,
          width: 300,
        }}
      />
    </div>
  );
}

export default NowPlaying;