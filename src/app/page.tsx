export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to SunoBot 👋</h1>
      <p>This is your AI assistant in Urdu and English.</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/chat" style={{ marginRight: '10px' }}>Go to Chat</a>
        <a href="/profile" style={{ marginRight: '10px' }}>Go to Profile</a>
        <a href="/settings">Go to Settings</a>
      </div>
    </div>
  );
}
