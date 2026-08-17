import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InstructorCard } from '@/components/course/InstructorCard';

function renderCard(instructor: Parameters<typeof InstructorCard>[0]['instructor']) {
  return render(
    <MemoryRouter>
      <InstructorCard instructor={instructor} />
    </MemoryRouter>
  );
}

const fullInstructor = {
  _id: 'instructor-1',
  name: 'Priya Sharma',
  email: 'priya@example.com',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Frontend architect helping teams build accessible, high-performance web applications.',
  title: 'Frontend Engineer',
  specialties: ['React', 'TypeScript', 'Design Systems'],
  rating: 4.8,
  totalReviews: 3241,
  studentsCount: 18420,
  coursesCount: 8,
  experience: '8 years',
  country: 'India',
  verified: true,
};

describe('InstructorCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders name, title and verified status', () => {
    renderCard(fullInstructor);
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend Engineer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Verified Instructor/i)).toBeInTheDocument();
  });

  it('renders rating, experience and footer stats', () => {
    renderCard(fullInstructor);
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(3.2K)')).toBeInTheDocument();
    expect(screen.getByText('8 years')).toBeInTheDocument();
    expect(screen.getByText('8 Courses')).toBeInTheDocument();
    expect(screen.getByText('18.4K Students')).toBeInTheDocument();
  });

  it('links to the instructor profile and exposes a View Profile CTA', () => {
    renderCard(fullInstructor);
    const viewProfile = screen.getByRole('link', { name: /View Profile/i });
    expect(viewProfile).toHaveAttribute('href', '/instructors/instructor-1');
    expect(screen.getByRole('link', { name: /Priya Sharma/i })).toHaveAttribute('href', '/instructors/instructor-1');
  });

  it('copies the email and announces feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderCard(fullInstructor);
    const copyButton = screen.getByRole('button', { name: /Copy email address/i });
    expect(copyButton).toBeInTheDocument();

    fireEvent.click(copyButton);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('priya@example.com'));
    expect(screen.getByText(/Email copied to clipboard/i)).toBeInTheDocument();
  });

  it('omits the copy button when no email is available', () => {
    const { email: _email, ...noEmailInstructor } = fullInstructor;
    renderCard(noEmailInstructor);
    expect(screen.queryByRole('button', { name: /Copy email address/i })).not.toBeInTheDocument();
  });

  it('renders gracefully with a minimal payload', () => {
    renderCard({ _id: 'instructor-2', name: 'Daniel Kim' });
    expect(screen.getByText(/Daniel Kim/i)).toBeInTheDocument();
    expect(screen.getByText('DK')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Profile/i })).toHaveAttribute('href', '/instructors/instructor-2');
  });

  it('does not break layout with a long name', () => {
    renderCard({ _id: 'instructor-3', name: 'Alexandria Vanderburgh-Strauss III' });
    expect(screen.getByText(/Alexandria Vanderburgh-Strauss III/i)).toBeInTheDocument();
    expect(screen.getByText('AV')).toBeInTheDocument();
  });
});