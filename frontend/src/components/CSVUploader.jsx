import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react'
import { tradesApi } from '../services/api'

export default function CSVUploader({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setUploadStatus(null)
      setError('')
    } else {
      setError('Please select a valid CSV file')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')
    setUploadStatus(null)

    try {
      const response = await tradesApi.uploadTradesCSV(file)
      setUploadStatus({
        success: true,
        message: response.message,
        tradesCreated: response.trades?.length || 0
      })
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload CSV')
      setUploadStatus({
        success: false,
        message: 'Upload failed'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile)
      setUploadStatus(null)
      setError('')
    } else {
      setError('Please drop a valid CSV file')
    }
  }

  return (
    <div className="bg-card rounded-lg shadow p-6 border border-border transition-colors">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Upload Trades CSV</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500 text-rose-200 rounded">
          {error}
        </div>
      )}

      {uploadStatus && (
        <div className={`mb-4 p-3 border rounded text-sm ${
          uploadStatus.success 
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200' 
            : 'bg-rose-500/10 border-rose-500 text-rose-200'
        }`}>
          <div className="flex items-center">
            {uploadStatus.success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span>{uploadStatus.message}</span>
            {uploadStatus.success && uploadStatus.tradesCreated > 0 && (
              <span className="ml-2 font-medium">
                ({uploadStatus.tradesCreated} trades created)
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/60 transition-colors bg-background/60"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        
        {!file ? (
          <div>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <label
                htmlFor="csv-upload"
                className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 inline-block transition-colors"
              >
                Select CSV File
              </label>
              <p className="mt-2 text-sm text-muted-foreground">
                or drag and drop your CSV file here
              </p>
            </div>
          </div>
        ) : (
          <div>
            <FileText className="mx-auto h-12 w-12 text-emerald-400" />
            <div className="mt-4">
              <p className="text-lg font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload CSV'
            )}
          </button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2 text-foreground">Expected CSV format:</p>
        <div className="bg-muted/40 p-3 rounded font-mono text-xs">
          symbol,entry_timestamp,exit_timestamp,entry_price,exit_price,quantity,commissions,net_pnl<br/>
          AAPL,2024-01-15T10:30:00,2024-01-15T11:45:00,150.00,155.00,100,5.00,495.00
        </div>
      </div>
    </div>
  )
}
