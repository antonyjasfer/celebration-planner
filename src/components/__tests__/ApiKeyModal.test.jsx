import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApiKeyModal from '../ApiKeyModal/ApiKeyModal';

describe('ApiKeyModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete window.__GEMINI_API_KEY__;
  });

  it('renders modal dialog with accessible attributes', () => {
    render(<ApiKeyModal onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Gemini API Key')).toBeInTheDocument();
  });

  it('displays setup instructions when no key is configured', () => {
    render(<ApiKeyModal onClose={() => {}} />);
    expect(screen.getByText(/CelebriPlan uses Google Gemini AI/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('AIza...')).toBeInTheDocument();
  });

  it('disables Save button when input is empty', () => {
    render(<ApiKeyModal onClose={() => {}} />);
    const saveBtn = screen.getByRole('button', { name: /save & reload/i });
    expect(saveBtn).toBeDisabled();
  });

  it('enables Save button and stores key in localStorage on submit', () => {
    render(<ApiKeyModal onClose={() => {}} />);
    const input = screen.getByPlaceholderText('AIza...');
    fireEvent.change(input, { target: { value: 'AIzaSyTestKey1234567890123' } });

    const saveBtn = screen.getByRole('button', { name: /save & reload/i });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(localStorage.getItem('gemini_api_key')).toBe('AIzaSyTestKey1234567890123');
    expect(screen.getByText(/✓ Key saved!/i)).toBeInTheDocument();
  });

  it('displays configured status and allows reset when key exists', () => {
    localStorage.setItem('gemini_api_key', 'AIzaSyConfiguredKey123');
    render(<ApiKeyModal onClose={() => {}} />);

    expect(screen.getByText(/API key is configured and active/i)).toBeInTheDocument();
    const resetBtn = screen.getByRole('button', { name: /reset \/ change api key/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(localStorage.getItem('gemini_api_key')).toBeNull();
  });

  it('calls onClose when close button or skip is clicked', () => {
    const handleClose = vi.fn();
    render(<ApiKeyModal onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const skipBtn = screen.getByRole('button', { name: /skip for now/i });
    fireEvent.click(skipBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});

