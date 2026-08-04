import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '@/components/ui/file-upload';

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

function uploadFile(file: File) {
  const input = document.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [file] } });
  return input;
}

describe('FileUpload', () => {
  const baseProps = {
    accept: '.pdf,.png,application/pdf,image/png',
    maxSize: 1024 * 1024,
    label: 'Upload document',
    value: null as File | null,
    onChange: vi.fn(),
  };

  it('renders the label and accept hint', () => {
    render(<FileUpload {...baseProps} />);
    expect(screen.getByText('Upload document')).toBeInTheDocument();
    expect(screen.getByText(/Accepted:/)).toBeInTheDocument();
  });

  it('accepts a valid file', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} onChange={onChange} />);
    uploadFile(makeFile('resume.pdf', 'application/pdf'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'resume.pdf' }));
  });

  it('rejects an invalid extension', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} onChange={onChange} />);
    uploadFile(makeFile('virus.exe', 'application/x-msdownload'));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
  });

  it('rejects an oversized file', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} onChange={onChange} />);
    uploadFile(makeFile('big.png', 'image/png', 2 * 1024 * 1024));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByText(/File is too large/)).toBeInTheDocument();
  });

  it('rejects an empty file', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} onChange={onChange} />);
    uploadFile(makeFile('empty.pdf', 'application/pdf', 0));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByText('File is empty')).toBeInTheDocument();
  });

  it('shows the selected file name when a value is set', () => {
    render(<FileUpload {...baseProps} value={makeFile('doc.pdf', 'application/pdf')} />);
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
  });

  it('removes the file via the remove button', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} value={makeFile('doc.pdf', 'application/pdf')} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    const remove = buttons[buttons.length - 1];
    fireEvent.click(remove);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows an external error and applies a destructive class', () => {
    const { container } = render(<FileUpload {...baseProps} error="Server rejected the file" />);
    expect(screen.getByText('Server rejected the file')).toBeInTheDocument();
    expect(container.querySelector('.border-destructive')).toBeInTheDocument();
  });

  it('handles drop of a valid file', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} onChange={onChange} />);
    const dropzone = screen.getByRole('button');
    const file = makeFile('notes.pdf', 'application/pdf');
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'notes.pdf' }));
  });

  it('opens the file picker when activated with the keyboard', () => {
    const spy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<FileUpload {...baseProps} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('clears the previous error when a new file is selected', () => {
    const onChange = vi.fn();
    render(<FileUpload {...baseProps} onChange={onChange} />);
    uploadFile(makeFile('bad.exe', 'application/x-msdownload'));
    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();

    uploadFile(makeFile('good.pdf', 'application/pdf'));
    expect(screen.queryByText(/Invalid file type/)).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'good.pdf' }));
  });
});
