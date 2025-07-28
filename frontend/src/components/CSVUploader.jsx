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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Trades CSV</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {uploadStatus && (
        <div className={`mb-4 p-3 border rounded ${
          uploadStatus.success 
            ? 'bg-green-100 border-green-400 text-green-700' 
            : 'bg-red-100 border-red-400 text-red-700'
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
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
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
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label
                htmlFor="csv-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
              >
                Select CSV File
              </label>
              <p className="mt-2 text-sm text-gray-600">
                or drag and drop your CSV file here
              </p>
            </div>
          </div>
        ) : (
          <div>
            <FileText className="mx-auto h-12 w-12 text-green-500" />
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Expected CSV format:</p>
        <div className="bg-gray-50 p-3 rounded font-mono text-xs">
          symbol,entry_timestamp,exit_timestamp,entry_price,exit_price,quantity,commissions,net_pnl<br/>
          AAPL,2024-01-15T10:30:00,2024-01-15T11:45:00,150.00,155.00,100,5.00,495.00
        </div>
      </div>
    </div>
  )
}