import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';

const RealtimeBarcode = () => {
  const { barcode } = useParams();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!barcode || !/^\d{13}$/.test(barcode)) {
      setError('Ongeldige barcode. EAN13 barcodes moeten 13 cijfers bevatten.');
      return;
    }
    
    try {
      // Canvas maken
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      
      // Barcode genereren
      JsBarcode(canvas, barcode, {
        format: 'EAN13',
        width: 3,
        height: 100,
        displayValue: true,
        font: 'Arial',
        fontSize: 20,
        margin: 10,
        textMargin: 15,
      });
      
      // Canvas naar image omzetten en weergeven
      const imageUrl = canvas.toDataURL('image/png');
      const img = document.getElementById('barcodeImage');
      if (img) {
        img.src = imageUrl;
      }
    } catch (err) {
      setError(`Fout bij het genereren van barcode: ${err.message}`);
    }
  }, [barcode]);
  
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        color: 'red'
      }}>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh'
    }}>
      <img id="barcodeImage" alt={`Barcode ${barcode}`} />
    </div>
  );
};

export default RealtimeBarcode; 