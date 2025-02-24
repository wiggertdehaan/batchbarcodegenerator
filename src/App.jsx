import { useState } from 'react';
import styled from '@emotion/styled';
import JsBarcode from 'jsbarcode';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import { BlobServiceClient } from '@azure/storage-blob';

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
  margin-right: 1rem;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
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

const ResultsContainer = styled.div`
  margin-top: 2rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const ResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ResultItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
  &:last-child {
    border-bottom: none;
  }
`;

const CopyButton = styled.button`
  background-color: #2ecc71;
  color: white;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  &:hover {
    background-color: #27ae60;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

function App() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState([]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Fout bij kopiëren naar klembord:', err);
    }
  };

  const downloadUrlList = () => {
    const content = results.map(result => `${result.code};${result.title};${result.url}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, 'barcode_urls.txt');
  };

  const generateBarcodes = async () => {
    try {
      setError('');
      setIsGenerating(true);
      setResults([]);

      const lines = input.trim().split('\n');
      const barcodes = [];
      const generatedResults = [];

      if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
        throw new Error('Voer eerst wat barcodes in voordat je genereert.');
      }

      // Azure Blob Storage configuratie
      const sasToken = import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN;
      const storageAccountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME;
      const containerName = 'barcodes';

      if (!sasToken || !storageAccountName) {
        throw new Error('Azure Storage configuratie ontbreekt. Neem contact op met de beheerder.');
      }

      const blobServiceClient = new BlobServiceClient(
        `https://${storageAccountName}.blob.core.windows.net${sasToken}`
      );
      const containerClient = blobServiceClient.getContainerClient(containerName);

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

          // Converteer naar PNG blob
          const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));
          
          // Upload naar Azure Blob Storage
          const blobName = `${code}.png`;
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          await blockBlobClient.uploadData(blob, {
            blobHTTPHeaders: { blobContentType: 'image/png' }
          });

          // Voeg toe aan resultaten
          const blobUrl = blockBlobClient.url;
          generatedResults.push({
            code,
            title: title || code,
            url: blobUrl
          });

          // Voeg ook toe aan ZIP bestand
          barcodes.push({
            blob,
            filename: blobName
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

      // Update resultaten
      setResults(generatedResults);

    } catch (err) {
      console.error('Fout:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
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
        <p><code>5051644057924;ROBLOX 10 BEL - GIFTCARD</code></p>
        <p>3. Klik op "Genereer Barcodes" om de barcodes te genereren en op te slaan.</p>
      </Instructions>

      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Voer hier je barcodes in..."
      />
      
      <ButtonGroup>
        <Button onClick={generateBarcodes} disabled={isGenerating}>
          {isGenerating ? 'Bezig met genereren...' : 'Genereer Barcodes'}
        </Button>
        {results.length > 0 && (
          <Button onClick={downloadUrlList}>
            Download URL Lijst
          </Button>
        )}
      </ButtonGroup>

      <ErrorMessage className={error ? 'visible' : ''}>
        {error}
      </ErrorMessage>

      <ResultsContainer visible={results.length > 0}>
        <h3>Gegenereerde Barcodes:</h3>
        <ResultsList>
          {results.map((result, index) => (
            <ResultItem key={index}>
              <div>
                <strong>{result.title}</strong>
                <br />
                <small>{result.url}</small>
              </div>
              <CopyButton onClick={() => copyToClipboard(result.url)}>
                Kopieer URL
              </CopyButton>
            </ResultItem>
          ))}
        </ResultsList>
      </ResultsContainer>
    </Container>
  );
}

export default App;
