import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';

const BarcodeApi = () => {
  const { barcode } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verwijder .png extensie als die aanwezig is
    const cleanBarcode = barcode.replace(/\.png$/i, '');
    
    if (!cleanBarcode || !/^\d{13}$/.test(cleanBarcode)) {
      navigate('/error?message=Ongeldige barcode. EAN13 barcodes moeten 13 cijfers bevatten.');
      return;
    }
    
    try {
      // Canvas maken voor de barcode
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      
      // Barcode genereren
      JsBarcode(canvas, cleanBarcode, {
        format: 'EAN13',
        width: 3,
        height: 100,
        displayValue: true,
        font: 'Arial',
        fontSize: 20,
        margin: 10,
        textMargin: 15,
      });
      
      // Canvas naar blob converteren
      canvas.toBlob((blob) => {
        // Blob URL maken
        const blobUrl = URL.createObjectURL(blob);
        
        // Download simuleren
        const a = document.createElement('a');
        a.href = blobUrl;
        document.body.appendChild(a);
        
        // De browser direct doorsturen naar de blob URL
        window.location.href = blobUrl;
        
        // Opruimen
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 'image/png');
    } catch (err) {
      navigate(`/error?message=Fout bij het genereren van barcode: ${err.message}`);
    }
  }, [barcode, navigate]);
  
  return null; // Deze component rendert niets, werkt alleen als API
};

export default BarcodeApi; 