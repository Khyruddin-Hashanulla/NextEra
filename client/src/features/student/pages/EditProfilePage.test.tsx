import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QUERY_KEYS } from '@/lib/constants';

const { addToast, getMe, updateProfile, uploadAvatar, changePassword, setQueryData, invalidateQueries } = vi.hoisted(
  () => ({
    addToast: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    changePassword: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })
);

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ setQueryData, invalidateQueries })),
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ addToast }),
}));

vi.mock('@/api/endpoints/user', () => ({
  userApi: {
    getMe,
    updateProfile,
    uploadAvatar,
    changePassword,
  },
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}));

import { useQuery, useMutation } from '@tanstack/react-query';
import { EditProfilePage } from './EditProfilePage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const useMutationMock = useMutation as unknown as ReturnType<typeof vi.fn>;

const EMPTY_SOCIAL = { youtube: '', twitter: '', linkedin: '', github: '', portfolio: '', website: '' };

function makeUser(overrides: Record<string, any> = {}) {
  return {
    _id: 'u1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    avatar: { url: '', publicId: '' },
    bio: '',
    socialLinks: { ...EMPTY_SOCIAL },
    isEmailVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/profile']}>
      <Routes>
        <Route path="/student/profile" element={<EditProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  addToast.mockClear();
  getMe.mockClear();
  updateProfile.mockClear();
  uploadAvatar.mockClear();
  changePassword.mockClear();
  setQueryData.mockClear();
  invalidateQueries.mockClear();

  updateProfile.mockResolvedValue({ data: { data: makeUser() } });

  useQueryMock.mockImplementation(({ _queryKey, _queryFn }: any) => ({
    data: null,
    isLoading: false,
  }));

  useMutationMock.mockImplementation((options: any) => ({
    mutate: (arg?: any) => {
      Promise.resolve()
        .then(() => options.mutationFn(arg))
        .then((res: any) => options.onSuccess?.(res))
        .catch((err: any) => options.onError?.(err));
    },
    isPending: false,
  }));
});

describe('PROFILE-001: Portfolio field must never be auto-populated with the user email', () => {
  it('does not display the email in the Portfolio field when the API returns it in socialLinks.portfolio', async () => {
    useQueryMock.mockReturnValue({
      data: makeUser({ socialLinks: { ...EMPTY_SOCIAL, portfolio: 'john@example.com' } }),
      isLoading: false,
    });

    renderPage();

    const portfolioInput = (await screen.findByPlaceholderText('https://yourportfolio.com/...')) as HTMLInputElement;
    await waitFor(() => expect(portfolioInput.value).toBe(''));
    expect(portfolioInput.value).not.toContain('@');
  });

  it('does not submit the email inside the portfolio field', async () => {
    useQueryMock.mockReturnValue({
      data: makeUser({ socialLinks: { ...EMPTY_SOCIAL, portfolio: 'john@example.com' } }),
      isLoading: false,
    });

    renderPage();

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    const payload = updateProfile.mock.calls[0][0];
    expect(payload.socialLinks.portfolio).toBe('');
    expect(payload.socialLinks.portfolio).not.toContain('@');
  });

  it('loads a real portfolio URL into the field unchanged', async () => {
    useQueryMock.mockReturnValue({
      data: makeUser({ socialLinks: { ...EMPTY_SOCIAL, portfolio: 'https://myportfolio.dev' } }),
      isLoading: false,
    });

    renderPage();

    const portfolioInput = (await screen.findByPlaceholderText('https://yourportfolio.com/...')) as HTMLInputElement;
    await waitFor(() => expect(portfolioInput.value).toBe('https://myportfolio.dev'));
  });

  it('keeps an empty portfolio empty and saves successfully', async () => {
    useQueryMock.mockReturnValue({ data: makeUser(), isLoading: false });

    renderPage();

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile.mock.calls[0][0].socialLinks.portfolio).toBe('');
  });

  it('rejects an email typed into the Portfolio field without calling the API', async () => {
    useQueryMock.mockReturnValue({ data: makeUser(), isLoading: false });

    renderPage();

    const portfolioInput = (await screen.findByPlaceholderText('https://yourportfolio.com/...')) as HTMLInputElement;
    fireEvent.change(portfolioInput, { target: { value: 'john@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(updateProfile).not.toHaveBeenCalled());
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
  });

  it('syncs the auth and profile caches after a successful save', async () => {
    const updated = makeUser({ name: 'Jane Doe' });
    useQueryMock.mockReturnValue({ data: makeUser(), isLoading: false });
    updateProfile.mockResolvedValue({ data: { data: updated } });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(setQueryData).toHaveBeenCalled());
    expect(setQueryData).toHaveBeenCalledWith(QUERY_KEYS.auth.user, updated);
    expect(setQueryData).toHaveBeenCalledWith(['user', 'profile'], updated);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.auth.user });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user', 'profile'] });
  });
});
