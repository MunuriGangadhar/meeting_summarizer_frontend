import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

function App() {
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [summary, setSummary] = useState('');
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use environment variable for API base URL, fallback to proxy for local dev
  const API_BASE_URL = process.env.REACT_APP_API_URL 

console.log("backend",API_BASE_URL);
  const validateFile = (file) => {
    if (!file) return 'No file selected';
    if (file.type !== 'text/plain' || !file.name.endsWith('.txt')) return 'Only .txt files allowed';
    if (file.size > 5 * 1024 * 1024) return 'File too large (max 5MB)';
    return null;
  };

  const validateEmails = (emails) => {
    const list = emails.split(',').map(r => r.trim());
    return list.every(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r)) ? null : 'Invalid email format';
  };

  const handleGenerate = async () => {
    const fileError = validateFile(transcriptFile);
    if (fileError) return setMessage(fileError);
    if (!prompt.trim()) return setMessage('Prompt cannot be empty');

    setIsLoading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('transcript', transcriptFile);
    formData.append('prompt', prompt);

    try {
      const res = await axios.post(`${API_BASE_URL}/generate-summary`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSummary(res.data.summary);
      setMessage('Summary generated successfully');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error generating summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!summary.trim()) return setMessage('Summary cannot be empty');
    const emailError = validateEmails(recipients);
    if (emailError) return setMessage(emailError);

    setIsLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_BASE_URL}/send-email`, { summary, recipients });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error sending email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTranscriptFile(null);
    setPrompt('');
    setSummary('');
    setRecipients('');
    setMessage('');
    document.getElementById('transcript-input').value = null;
  };

  return (
    <div className="App">
      <motion.div
        className="card shadow-sm p-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="card-title text-center mb-4">AI-Powered Meeting Summarizer</h1>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="transcript-input" className="form-label fw-bold">Upload Transcript (.txt)</label>
            <input
              id="transcript-input"
              type="file"
              accept=".txt"
              className="form-control"
              onChange={(e) => setTranscriptFile(e.target.files[0])}
              disabled={isLoading}
              aria-describedby="transcriptHelp"
            />
            <small id="transcriptHelp" className="form-text text-muted">Only .txt files up to 5MB.</small>
          </div>
          <div className="mb-3">
            <label htmlFor="prompt-input" className="form-label fw-bold">Custom Prompt</label>
            <textarea
              id="prompt-input"
              placeholder="e.g., Summarize in bullet points for executives"
              className="form-control"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              aria-describedby="promptHelp"
            />
            <small id="promptHelp" className="form-text text-muted">Enter instructions for AI summarization.</small>
          </div>
          <motion.button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Generate summary"
          >
            {isLoading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating...
              </span>
            ) : (
              'Generate Summary'
            )}
          </motion.button>
          <div className="mb-3">
            <label htmlFor="summary-input" className="form-label fw-bold">Editable Summary</label>
            <AnimatePresence>
              {summary && (
                <motion.textarea
                  id="summary-input"
                  placeholder="Generated summary will appear here..."
                  className="form-control"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  aria-describedby="summaryHelp"
                />
              )}
            </AnimatePresence>
            <small id="summaryHelp" className="form-text text-muted">Edit the generated summary as needed.</small>
          </div>
          <div className="mb-3">
            <label htmlFor="recipients-input" className="form-label fw-bold">Recipients (comma-separated emails)</label>
            <input
              id="recipients-input"
              type="text"
              placeholder="e.g., email1@example.com, email2@example.com"
              className="form-control"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              disabled={isLoading}
              aria-describedby="recipientsHelp"
            />
            <small id="recipientsHelp" className="form-text text-muted">Enter valid email addresses separated by commas.</small>
          </div>
          <div className="d-flex justify-content-center gap-2">
            <motion.button
              className="btn btn-success"
              onClick={handleSend}
              disabled={isLoading || !summary}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Share via email"
            >
              {isLoading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </span>
              ) : (
                'Share via Email'
              )}
            </motion.button>
            <motion.button
              className="btn btn-secondary"
              onClick={handleReset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Reset form"
            >
              Reset
            </motion.button>
          </div>
          <AnimatePresence>
            {message && (
              <motion.div
                className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'} mt-3`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                role="alert"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default App;