import { fireEvent, render, screen } from '@testing-library/react';
import { ExportButtons } from './ExportButtons';

// T-074 (UX-M1, UX-M4): focus returns to the toggle and the status region stays mounted.
describe('ExportButtons focus', () => {
  it('returns focus to the toggle after Escape and keeps the status region mounted', () => {
    render(<ExportButtons deck={{ name: 'Oma', sections: [] }} cardsByKey={new Map()} />);
    const toggle = screen.getByRole('button', { expanded: false });
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: 'Escape' });
    expect(toggle).toHaveFocus();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
