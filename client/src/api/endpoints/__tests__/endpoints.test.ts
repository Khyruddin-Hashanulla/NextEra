import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { authApi } from '@/api/endpoints/auth';
import { blogApi } from '@/api/endpoints/blog';
import { codingApi } from '@/api/endpoints/coding';
import { liveClassApi } from '@/api/endpoints/liveClass';
import { quizApi } from '@/api/endpoints/quiz';
import { studyReminderApi } from '@/api/endpoints/studyReminder';
import { userApi } from '@/api/endpoints/user';
import { aiApi } from '@/api/endpoints/ai';
import { API_BASE_URL } from '@/lib/constants';

const recorded: Array<{ url: string; method: string }> = [];

function recorder() {
  return (info: { request: Request }) => {
    const url = new URL(info.request.url);
    recorded.push({ url: url.pathname, method: info.request.method });
    if (/\/export\/|\/download/.test(url.pathname)) {
      return HttpResponse.arrayBuffer(new ArrayBuffer(8));
    }
    return HttpResponse.json({ data: {}, success: true });
  };
}

beforeAll(() => {
  server.resetHandlers(http.all(/\/api\/v1\/.*/, recorder()));
});

afterEach(() => {
  recorded.length = 0;
});

afterAll(() => server.resetHandlers());

function expectRequested(path: string, method: string) {
  const match = recorded.find((r) => (r.url === `${API_BASE_URL}${path}` || r.url === path) && r.method === method);
  expect(match).toBeDefined();
}

describe('authApi endpoints', () => {
  it('dispatches register', async () => {
    await authApi.register({ name: 'Jane', email: 'j@x.com', password: 'Secret1' });
    expectRequested('/auth/register', 'POST');
  });

  it('dispatches login', async () => {
    await authApi.login({ email: 'j@x.com', password: 'Secret1' });
    expectRequested('/auth/login', 'POST');
  });

  it('dispatches google auth', async () => {
    await authApi.googleAuth('credential-token');
    expectRequested('/auth/google', 'POST');
  });

  it('dispatches send OTP', async () => {
    await authApi.sendOTP('j@x.com');
    expectRequested('/auth/send-otp', 'POST');
  });

  it('dispatches verify email', async () => {
    await authApi.verifyEmail({ email: 'j@x.com', otp: '123456' });
    expectRequested('/auth/verify-email', 'POST');
  });

  it('dispatches refresh token', async () => {
    await authApi.refreshToken('refresh-token');
    expectRequested('/auth/refresh', 'POST');
  });

  it('dispatches forgot password', async () => {
    await authApi.forgotPassword({ email: 'j@x.com' });
    expectRequested('/auth/forgot-password', 'POST');
  });

  it('dispatches reset password', async () => {
    await authApi.resetPassword({ token: 't', password: 'NewPass1' });
    expectRequested('/auth/reset-password', 'POST');
  });

  it('dispatches logout', async () => {
    await authApi.logout();
    expectRequested('/auth/logout', 'POST');
  });
});

describe('blogApi endpoints', () => {
  it('dispatches listPublished', async () => {
    await blogApi.listPublished({ page: 1 });
    expectRequested('/blogs', 'GET');
  });

  it('dispatches getFeatured', async () => {
    await blogApi.getFeatured(3);
    expectRequested('/blogs/featured', 'GET');
  });

  it('dispatches getBySlug', async () => {
    await blogApi.getBySlug('hello-world');
    expectRequested('/blogs/hello-world', 'GET');
  });

  it('dispatches getCategories', async () => {
    await blogApi.getCategories();
    expectRequested('/blogs/categories', 'GET');
  });

  it('dispatches comment crud and interactions', async () => {
    await blogApi.getComments('blog-1', { page: 1 });
    expectRequested('/blogs/blog-1/comments', 'GET');

    await blogApi.createComment('blog-1', { content: 'nice' });
    expectRequested('/blogs/blog-1/comments', 'POST');

    await blogApi.updateComment('comment-1', { content: 'updated' });
    expectRequested('/blogs/comments/comment-1', 'PUT');

    await blogApi.deleteComment('comment-1');
    expectRequested('/blogs/comments/comment-1', 'DELETE');

    await blogApi.toggleLike('comment-1');
    expectRequested('/blogs/comments/comment-1/like', 'POST');

    await blogApi.toggleBookmark('blog-1');
    expectRequested('/blogs/blog-1/bookmark', 'POST');

    await blogApi.getBookmarks({ page: 1 });
    expectRequested('/bookmarks', 'GET');
  });
});

describe('codingApi endpoints', () => {
  it('dispatches problem listing and retrieval', async () => {
    await codingApi.listProblems({ page: 1 });
    expectRequested('/coding/problems', 'GET');

    await codingApi.getProblemById('p-1');
    expectRequested('/coding/problems/p-1', 'GET');

    await codingApi.getProblemBySlug('two-sum');
    expectRequested('/coding/problems/slug/two-sum', 'GET');

    await codingApi.listInstructorProblems({ page: 1 });
    expectRequested('/coding/my-problems', 'GET');
  });

  it('dispatches problem crud', async () => {
    await codingApi.createProblem({ title: 'T', description: 'D', difficulty: 'easy' } as any);
    expectRequested('/coding/problems', 'POST');

    await codingApi.updateProblem('p-1', { title: 'T2' });
    expectRequested('/coding/problems/p-1', 'PUT');

    await codingApi.deleteProblem('p-1');
    expectRequested('/coding/problems/p-1', 'DELETE');
  });

  it('dispatches submissions', async () => {
    await codingApi.submitCode('p-1', { language: 'javascript', code: 'console.log(1)' });
    expectRequested('/coding/problems/p-1/submit', 'POST');

    await codingApi.getSubmissionById('s-1');
    expectRequested('/coding/submissions/s-1', 'GET');

    await codingApi.getUserSubmissions('p-1', { page: 1 });
    expectRequested('/coding/problems/p-1/submissions', 'GET');

    await codingApi.getAllUserSubmissions({ page: 1 });
    expectRequested('/coding/submissions', 'GET');
  });
});

describe('liveClassApi endpoints', () => {
  it('dispatches instructor class endpoints', async () => {
    await liveClassApi.listInstructorLiveClasses({ page: 1 });
    expectRequested('/live-classes/instructor', 'GET');

    await liveClassApi.listInstructorRecordings({ page: 1 });
    expectRequested('/live-classes/instructor/recordings', 'GET');

    await liveClassApi.createLiveClass({ title: 'Intro' });
    expectRequested('/live-classes', 'POST');

    await liveClassApi.updateLiveClass('lc-1', { title: 'Updated' });
    expectRequested('/live-classes/lc-1', 'PUT');

    await liveClassApi.getLiveClass('lc-1');
    expectRequested('/live-classes/lc-1', 'GET');

    await liveClassApi.cancelLiveClass('lc-1');
    expectRequested('/live-classes/lc-1/cancel', 'POST');

    await liveClassApi.startLiveClass('lc-1');
    expectRequested('/live-classes/lc-1/start', 'POST');

    await liveClassApi.endLiveClass('lc-1');
    expectRequested('/live-classes/lc-1/end', 'POST');
  });

  it('dispatches recording endpoints', async () => {
    await liveClassApi.addRecording({ liveClass: 'lc-1', course: 'c-1', title: 'Rec', url: 'https://x' });
    expectRequested('/live-classes/instructor/recordings', 'POST');

    await liveClassApi.getInstructorRecording('rec-1');
    expectRequested('/live-classes/instructor/recordings/rec-1', 'GET');

    await liveClassApi.deleteRecording('rec-1');
    expectRequested('/live-classes/instructor/recordings/rec-1', 'DELETE');

    await liveClassApi.syncRecordings('lc-1');
    expectRequested('/live-classes/instructor/recordings/sync', 'POST');

    await liveClassApi.incrementRecordingView('rec-1');
    expectRequested('/live-classes/recordings/rec-1/view', 'POST');
  });

  it('dispatches student endpoints', async () => {
    await liveClassApi.listStudentLiveClasses({ page: 1, filter: 'upcoming' });
    expectRequested('/live-classes/student', 'GET');

    await liveClassApi.listStudentRecordings({ page: 1 });
    expectRequested('/live-classes/student/recordings', 'GET');

    await liveClassApi.joinLiveClass('lc-1');
    expectRequested('/live-classes/lc-1/join', 'POST');

    await liveClassApi.leaveLiveClass('lc-1');
    expectRequested('/live-classes/lc-1/leave', 'POST');
  });
});

describe('quizApi endpoints', () => {
  it('dispatches quiz lifecycle endpoints', async () => {
    await quizApi.startQuizEnhanced({ courseId: 'c-1', lectureId: 'l-1' });
    expectRequested('/quiz/start-enhanced', 'POST');

    await quizApi.submitQuiz({ attemptId: 'a-1', answers: [], autoSubmitted: false });
    expectRequested('/quiz/submit', 'POST');

    await quizApi.autoSubmit({ attemptId: 'a-1', answers: [] });
    expectRequested('/quiz/auto-submit', 'POST');

    await quizApi.resumeQuiz({ attemptId: 'a-1' });
    expectRequested('/quiz/resume', 'POST');
  });

  it('dispatches attempt result endpoints', async () => {
    await quizApi.getAttemptResult('a-1');
    expectRequested('/quiz/result/a-1', 'GET');

    await quizApi.getAttemptDetails('a-1');
    expectRequested('/quiz/attempts/a-1/details', 'GET');

    await quizApi.downloadResult('a-1');
    expectRequested('/quiz/instructor/export/a-1', 'GET');
  });

  it('dispatches analytics endpoints', async () => {
    await quizApi.getStudentAnalytics('l-1');
    expectRequested('/quiz/analytics/l-1', 'GET');

    await quizApi.getStudentOverview();
    expectRequested('/quiz/overview', 'GET');

    await quizApi.getLeaderboard('l-1', { limit: 10 });
    expectRequested('/quiz/leaderboard/l-1', 'GET');

    await quizApi.getQuizAnalytics('l-1');
    expectRequested('/quiz/instructor/analytics/l-1', 'GET');

    await quizApi.getQuestionStatistics('l-1');
    expectRequested('/quiz/instructor/questions/l-1', 'GET');

    await quizApi.getAdminAnalytics({ courseId: 'c-1' });
    expectRequested('/quiz/admin/analytics', 'GET');
  });

  it('dispatches grading endpoints', async () => {
    await quizApi.manualGrade('a-1', { score: 10 });
    expectRequested('/quiz/manual-grade/a-1', 'PUT');

    await quizApi.publishGrade('a-1');
    expectRequested('/quiz/publish/a-1', 'PUT');
  });
});

describe('studyReminderApi endpoints', () => {
  it('dispatches reminder crud', async () => {
    await studyReminderApi.list();
    expectRequested('/study-reminders', 'GET');

    await studyReminderApi.create({ title: 'Study', type: 'daily', time: '09:00' });
    expectRequested('/study-reminders', 'POST');

    await studyReminderApi.update('r-1', { title: 'Updated' });
    expectRequested('/study-reminders/r-1', 'PUT');

    await studyReminderApi.delete('r-1');
    expectRequested('/study-reminders/r-1', 'DELETE');

    await studyReminderApi.toggle('r-1');
    expectRequested('/study-reminders/r-1/toggle', 'POST');
  });
});

describe('userApi endpoints', () => {
  it('dispatches user endpoints', async () => {
    await userApi.getMe();
    expectRequested('/users/me', 'GET');

    await userApi.updateProfile({ name: 'Jane' } as any);
    expectRequested('/users/me', 'PUT');

    await userApi.changePassword({ currentPassword: 'Old1', newPassword: 'New1' } as any);
    expectRequested('/users/me/password', 'PUT');
  });
});

describe('aiApi endpoints', () => {
  it('dispatches ai generation endpoints', async () => {
    await aiApi.generateDescription({ title: 'React', category: 'frontend', level: 'beginner' });
    expectRequested('/ai/generate-description', 'POST');

    await aiApi.generateQuiz({ topic: 'React', count: 5, difficulty: 'easy' });
    expectRequested('/ai/generate-quiz', 'POST');

    await aiApi.generateAssignment({ topic: 'React', duration: '1h', skills: ['hooks'] });
    expectRequested('/ai/generate-assignment', 'POST');

    await aiApi.chat({ message: 'hi' });
    expectRequested('/ai/chat', 'POST');
  });
});
