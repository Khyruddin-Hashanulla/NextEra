import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  it('renders name, title, bio and verified badge', () => {
    renderCard(fullInstructor);
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/high-performance web applications/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Verified Instructor/i)).toBeInTheDocument();
  });

  it('renders rating, reviews, stats, skills and country', () => {
    renderCard(fullInstructor);
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(3241)')).toBeInTheDocument();
    expect(screen.getByText('18420')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('8 years')).toBeInTheDocument();
    expect(screen.getByText(/React/i)).toBeInTheDocument();
    expect(screen.getByText(/India/i)).toBeInTheDocument();
  });

  it('links to the instructor profile and exposes a View Profile CTA', () => {
    renderCard(fullInstructor);
    const viewProfile = screen.getByRole('link', { name: /View Profile/i });
    expect(viewProfile).toHaveAttribute('href', '/instructors/instructor-1');
    expect(screen.getByRole('link', { name: /Priya Sharma/i })).toHaveAttribute('href', '/instructors/instructor-1');
  });

  it('renders gracefully with a minimal payload', () => {
    renderCard({ _id: 'instructor-2', name: 'Daniel Kim' });
    expect(screen.getByText(/Daniel Kim/i)).toBeInTheDocument();
    expect(screen.getByText('DK')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Profile/i })).toHaveAttribute('href', '/instructors/instructor-2');
  });
});
