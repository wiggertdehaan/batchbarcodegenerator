import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ErrorPage = () => {
  const [errorMessage, setErrorMessage] = useState('Er is een onbekende fout opgetreden');
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    if (message) {
      setErrorMessage(message);
    }
  }, [location]);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: '#D32F2F',
      padding: '0 20px',
      textAlign: 'center'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Fout</h1>
      <p>{errorMessage}</p>
      <a 
        href="/" 
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          backgroundColor: '#1976D2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
      >
        Terug naar de startpagina
      </a>
    </div>
  );
};

export default ErrorPage; 