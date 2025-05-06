import React from 'react'
import './App.css'

// Simple word lists for generating random pairs
const ADJECTIVES = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"];
const NOUNS = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"];

function App() {
  const [wordPair, setWordPair] = React.useState('');
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const [provisioningStatus, setProvisioningStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const generateWordPair = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    setWordPair(`${adj}-${noun}`);
  };

  React.useEffect(() => {
    generateWordPair();
  }, []);

  const handleProvisionAccount = async () => {
    setIsProvisioning(true);
    setProvisioningStatus('idle');
    try {
      const response = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the current wordPair as accountId, as per the original prompt
        body: JSON.stringify({ accountId: wordPair }),
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Provisioning success:', result);
        setProvisioningStatus('success');
      } else {
        console.error('Provisioning failed:', response.statusText);
        setProvisioningStatus('error');
      }
    } catch (error) {
      console.error('Error during provisioning:', error);
      setProvisioningStatus('error');
    } finally {
      setIsProvisioning(false);
      // Reset status after a short delay so user can see the change
      setTimeout(() => {
        setProvisioningStatus('idle');
      }, 2000); // Keep success/error visible for 2 seconds
    }
  };

  return (
    <>
      <h1>Welcome to Saas Website!!</h1>
      <div className='card'>
        <p>Your random word pair is: <strong>{wordPair}</strong></p>
        <button onClick={generateWordPair}>
          Refresh Words
        </button>
      </div>
      <div className='card'>
        <button 
          onClick={handleProvisionAccount} 
          disabled={isProvisioning}
          style={{
            backgroundColor: provisioningStatus === 'success' ? 'green' : provisioningStatus === 'error' ? 'red' : undefined,
            color: provisioningStatus === 'success' || provisioningStatus === 'error' ? 'white' : undefined,
          }}
        >
          {isProvisioning ? 'Provisioning...' : provisioningStatus === 'success' ? 'Success!' : provisioningStatus === 'error' ? 'Failed!' : 'Provision Account'}
        </button>
      </div>
    </>
  )
}

export default App
