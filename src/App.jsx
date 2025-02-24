import { useState } from 'react';
import styled from '@emotion/styled';
import JsBarcode from 'jsbarcode';
import FileSaver from 'file-saver';
import JSZip from 'jszip';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
`;

const Title = styled.h1`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 150px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const Instructions = styled.div`
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background-color: #fdeaea;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  display: none;
  &.visible {
    display: block;
  }
`;

function App() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const generateBarcodes = async () => {
    try {
      setError('');
      const lines = input.trim().split('\n');
      const barcodes = [];

      if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
        throw new Error('Voer eerst wat barcodes in voordat je genereert.');
      }

      for (const line of lines) {
        if (!line.trim()) continue;

        const [code, title] = line.split(';').map(s => s.trim());
        if (!code) continue;

        if (code.length !== 13 || !/^\d+$/.test(code)) {
          throw new Error(`Ongeldige barcode: ${code}. EAN13 barcodes moeten exact 13 cijfers bevatten.`);
        }

        // Maak een canvas element voor de barcode
        const canvas = document.createElement('canvas');
        try {
          JsBarcode(canvas, code, {
            format: "EAN13",
            width: 3,
            height: 100,
            fontSize: 16,
            margin: 10,
            background: "#ffffff"
          });

          // Maak een nieuw canvas voor de complete afbeelding met titel
          const finalCanvas = document.createElement('canvas');
          const ctx = finalCanvas.getContext('2d');
          finalCanvas.width = 600;
          finalCanvas.height = 250;

          // Witte achtergrond
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

          // Teken de titel
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title || code, finalCanvas.width / 2, 30);

          // Teken de barcode
          const barcodeImg = canvas;
          ctx.drawImage(
            barcodeImg,
            (finalCanvas.width - barcodeImg.width) / 2,
            50,
            barcodeImg.width,
            barcodeImg.height
          );

          // Teken de code onderaan
          ctx.font = '16px Arial';
          ctx.fillText(code, finalCanvas.width / 2, 200);

          // Converteer naar PNG
          const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));
          barcodes.push({
            blob,
            filename: `${code}.png`
          });
        } catch (error) {
          throw new Error(`Fout bij het genereren van barcode voor ${code}: ${error.message}`);
        }
      }

      // Download als ZIP bestand
      if (barcodes.length > 0) {
        const zip = new JSZip();
        barcodes.forEach(({blob, filename}) => {
          zip.file(filename, blob);
        });
        
        const zipBlob = await zip.generateAsync({type: 'blob'});
        FileSaver.saveAs(zipBlob, 'barcodes.zip');
      }
    } catch (err) {
      console.error('Fout:', err);
      setError(err.message);
    }
  };

  return (
    <Container>
      <Title>Batch Barcode Generator</Title>
      
      <Instructions>
        <h3>Instructies:</h3>
        <p>1. Voer elke barcode op een nieuwe regel in met het formaat:</p>
        <p><code>barcode;titel</code></p>
        <p>2. Bijvoorbeeld:</p>
        <p><code>5051644057924;Name product</code></p>
        <p>3. Klik op "Genereer Barcodes" om een ZIP-bestand te downloaden met alle barcodes.</p>
      </Instructions>

      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Voer hier je barcodes in..."
      />
      
      <Button onClick={generateBarcodes}>
        Genereer Barcodes
      </Button>

      <ErrorMessage className={error ? 'visible' : ''}>
        {error}
      </ErrorMessage>
    </Container>
  );
}

export default App;
